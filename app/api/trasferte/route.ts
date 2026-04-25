import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const TrasferteSchema = z.object({
  progettoId: z.string(),
  collaboratoreId: z.string(),
  societaId: z.string().optional(),
  data: z.string(),
  destinazione: z.string().min(1),
  mezzo: z.enum(["Auto", "Treno", "Aereo", "Altro"]),
  km: z.number().optional(),
  costoAltro: z.number().optional(),
  note: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const progettoId = searchParams.get("progettoId")
  const collaboratoreId = searchParams.get("collaboratoreId")
  const anno = searchParams.get("anno")
  const mese = searchParams.get("mese")

  const where: any = {}
  if (progettoId) where.progettoId = progettoId
  if (collaboratoreId) where.collaboratoreId = collaboratoreId
  if (anno || mese) {
    const y = anno ? parseInt(anno) : new Date().getFullYear()
    const m = mese ? parseInt(mese) - 1 : undefined
    where.data = {
      gte: new Date(y, m ?? 0, 1),
      lt: m !== undefined
        ? new Date(y, m + 1, 1)
        : new Date(y + 1, 0, 1),
    }
  }

  // Collaboratori vedono solo le proprie
  if (session.user.ruolo !== "ADMIN" && session.user.collaboratoreId) {
    where.collaboratoreId = session.user.collaboratoreId
  }

  const trasferte = await prisma.trasferta.findMany({
    where,
    include: {
      collaboratore: { select: { nome: true, cognome: true } },
      progetto: { select: { nome: true } },
    },
    orderBy: { data: "desc" },
  })

  return NextResponse.json(trasferte)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const body = await req.json()
  const parsed = TrasferteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const anno = new Date(data.data).getFullYear()

  // Recupera tariffa km dell'anno per il collaboratore
  let tariffa = null
  let rimborso = null

  if (data.mezzo === "Auto" && data.km) {
    const tariffaRecord = await prisma.tariffaKm.findUnique({
      where: {
        collaboratoreId_anno: {
          collaboratoreId: data.collaboratoreId,
          anno,
        },
      },
    })
    tariffa = tariffaRecord?.tariffa ?? null
    rimborso = tariffa ? Number(tariffa) * data.km : null
  } else if (data.costoAltro) {
    rimborso = data.costoAltro
  }

  const trasferta = await prisma.trasferta.create({
    data: {
      progettoId: data.progettoId,
      collaboratoreId: data.collaboratoreId,
      societaId: data.societaId,
      data: new Date(data.data),
      destinazione: data.destinazione,
      mezzo: data.mezzo,
      km: data.km,
      costoAltro: data.costoAltro,
      tariffa: tariffa,
      rimborso: rimborso,
      note: data.note,
    },
  })

  return NextResponse.json(trasferta, { status: 201 })
}
