import { prisma } from "@/lib/prisma"
import { inviaAlertScadenza } from "@/lib/email"
import { NextResponse } from "next/server"
import { addDays } from "date-fns"

// Questo endpoint viene chiamato da Vercel Cron ogni giorno
// Configura in vercel.json: { "crons": [{ "path": "/api/cron/alert-scadenze", "schedule": "0 8 * * *" }] }

export async function GET(req: Request) {
  // Verifica token cron
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const oggi = new Date()
  const tra90giorni = addDays(oggi, 90)

  // Trova documenti in scadenza entro 90 giorni
  const documentiInScadenza = await prisma.documento.findMany({
    where: {
      alertAttivo: true,
      scadenza: {
        gte: oggi,
        lte: tra90giorni,
      },
    },
    include: {
      cliente: {
        include: {
          referenti: { where: { predefinito: true }, take: 1 },
        },
      },
    },
  })

  // Raggruppa per cliente
  const perCliente = new Map<string, typeof documentiInScadenza>()
  for (const doc of documentiInScadenza) {
    const key = doc.clienteId
    if (!perCliente.has(key)) perCliente.set(key, [])
    perCliente.get(key)!.push(doc)
  }

  let inviati = 0
  const errori: string[] = []

  for (const [clienteId, docs] of perCliente) {
    const cliente = docs[0].cliente
    const referente = cliente.referenti[0]
    if (!referente?.email) continue

    const scadenze = docs.map((d) => {
      const giorniMancanti = Math.ceil(
        (new Date(d.scadenza!).getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24)
      )
      return {
        nome: d.nome,
        data: new Date(d.scadenza!).toLocaleDateString("it-IT"),
        giorniMancanti,
      }
    })

    try {
      await inviaAlertScadenza({
        emailDestinatario: referente.email,
        nomeReferente: `${referente.nome} ${referente.cognome}`,
        nomeCliente: cliente.ragioneSociale,
        scadenze,
      })
      inviati++
    } catch (err) {
      errori.push(`Errore per ${cliente.ragioneSociale}: ${err}`)
    }
  }

  return NextResponse.json({
    success: true,
    clientiNotificati: inviati,
    errori,
    timestamp: new Date().toISOString(),
  })
}
