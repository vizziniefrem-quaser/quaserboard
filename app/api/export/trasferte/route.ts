import { auth } from "@/auth"
import { generaModuloTrasferte } from "@/lib/export-trasferte"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await auth()
  if (!session || session.user.ruolo !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const collaboratoreId = searchParams.get("collaboratoreId")
  const anno = parseInt(searchParams.get("anno") ?? String(new Date().getFullYear()))
  const mese = parseInt(searchParams.get("mese") ?? String(new Date().getMonth() + 1))

  if (!collaboratoreId) {
    return NextResponse.json({ error: "collaboratoreId richiesto" }, { status: 400 })
  }

  try {
    const buffer = await generaModuloTrasferte(collaboratoreId, anno, mese)

    const MESI = ["", "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio",
      "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"]

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rimborso_trasferte_${MESI[mese]}_${anno}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Errore generazione XLS:", error)
    return NextResponse.json({ error: "Errore nella generazione del file" }, { status: 500 })
  }
}
