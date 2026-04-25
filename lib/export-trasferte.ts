import * as XLSX from "xlsx"
import { prisma } from "@/lib/prisma"

export async function generaModuloTrasferte(
  collaboratoreId: string,
  anno: number,
  mese: number // 1-12
): Promise<Buffer> {
  // Dati collaboratore e tariffe
  const collaboratore = await prisma.collaboratore.findUnique({
    where: { id: collaboratoreId },
    include: {
      mezzi: { where: { principale: true }, take: 1 },
      tariffe: { where: { anno } },
    },
  })

  if (!collaboratore) throw new Error("Collaboratore non trovato")

  const mezzo = collaboratore.mezzi[0]
  const tariffa = collaboratore.tariffe[0]?.tariffa ?? 0

  // Trasferte del mese
  const trasferte = await prisma.trasferta.findMany({
    where: {
      collaboratoreId,
      data: {
        gte: new Date(anno, mese - 1, 1),
        lt: new Date(anno, mese, 1),
      },
    },
    include: { progetto: { select: { nome: true } } },
    orderBy: { data: "asc" },
  })

  const MESI = [
    "", "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([])

  // Intestazione
  XLSX.utils.sheet_add_aoa(ws, [
    ["MODULO RIMBORSO TRASFERTA MEZZO PROPRIO"],
    [],
    ["Collaboratore:", `${collaboratore.nome} ${collaboratore.cognome}`],
    ["Mese:", `${MESI[mese]} ${anno}`],
    [
      "Mezzo:",
      mezzo ? `${mezzo.marca ?? ""} ${mezzo.modello ?? ""}`.trim() : "",
    ],
    ["Targa:", mezzo?.targa ?? ""],
    ["Tariffa €/km:", Number(tariffa).toFixed(4) + " €"],
    [],
    ["DATA", "CLIENTE / PROGETTO", "DESTINAZIONE", "KM", "TARIFFA €/KM", "TOTALE €"],
  ])

  // Righe dati
  let totaleKm = 0
  let totaleImporto = 0

  trasferte.forEach((t, i) => {
    const row = i + 10 // riga Excel (1-based, dopo intestazione)
    const km = t.km ?? 0
    const rimb = Number(t.rimborso ?? 0)
    totaleKm += km
    totaleImporto += rimb

    const data = new Date(t.data)
    const dataStr = `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}`

    XLSX.utils.sheet_add_aoa(ws, [
      [
        dataStr,
        t.progetto?.nome ?? "",
        t.destinazione,
        km,
        Number(tariffa),
        rimb,
      ],
    ], { origin: `A${row}` })
  })

  // Riga totale
  const totRow = trasferte.length + 10
  XLSX.utils.sheet_add_aoa(ws, [
    ["", "", "TOTALE", totaleKm, "", totaleImporto],
  ], { origin: `A${totRow}` })

  // Riga firma
  XLSX.utils.sheet_add_aoa(ws, [
    [],
    [`Data: ____________________`, "", "", `Firma: ____________________`],
  ], { origin: `A${totRow + 2}` })

  // Larghezze colonne
  ws["!cols"] = [
    { wch: 12 }, { wch: 30 }, { wch: 28 }, { wch: 8 }, { wch: 14 }, { wch: 12 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, `${MESI[mese]} ${anno}`)

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
}
