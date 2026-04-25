import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const CommentiSchema = z.object({
  progettoId: z.string(),
  testo: z.string().min(1).max(2000),
  faseNome: z.string().optional(),
})

const RispostaSchema = z.object({
  risposta: z.string().min(1),
})

// GET tutti i commenti (con filtri)
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const progettoId = searchParams.get("progettoId")
  const stato = searchParams.get("stato") // "open" | "done"

  const where: any = {}
  if (progettoId) where.progettoId = progettoId
  if (stato) where.stato = stato

  // Collaboratori vedono solo i commenti dei propri progetti
  if (session.user.ruolo !== "ADMIN") {
    where.autore = { id: session.user.id }
  }

  const commenti = await prisma.commento.findMany({
    where,
    include: {
      autore: { select: { name: true, email: true } },
      progetto: { select: { nome: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(commenti)
}

// POST nuovo commento
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const body = await req.json()
  const parsed = CommentiSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const commento = await prisma.commento.create({
    data: {
      progettoId: parsed.data.progettoId,
      autorId: session.user.id,
      testo: parsed.data.testo,
      faseNome: parsed.data.faseNome,
      stato: "open",
    },
    include: {
      autore: { select: { name: true, email: true } },
      progetto: { select: { nome: true } },
    },
  })

  return NextResponse.json(commento, { status: 201 })
}

// PATCH risposta admin
export async function PATCH(req: Request) {
  const session = await auth()
  if (!session || session.user.ruolo !== "ADMIN") {
    return NextResponse.json({ error: "Solo l'amministratore può rispondere" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID mancante" }, { status: 400 })

  const body = await req.json()
  const parsed = RispostaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const commento = await prisma.commento.update({
    where: { id },
    data: {
      risposta: parsed.data.risposta,
      stato: "done",
      rispostoAt: new Date(),
    },
  })

  return NextResponse.json(commento)
}
