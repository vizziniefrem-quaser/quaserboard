import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

const STATI_LABEL: Record<string, string> = {
  DA_INIZIARE: "Da iniziare",
  IN_CORSO: "In corso",
  IN_ATTESA_DOCUMENTI: "In attesa documenti",
  CONSEGNATO: "Consegnato",
  DA_FATTURARE: "Da fatturare",
  CHIUSO: "Chiuso",
}

const STATI_STYLE: Record<string, string> = {
  DA_INIZIARE:          "bg-gray-100 text-gray-600",
  IN_CORSO:             "bg-blue-100 text-blue-800",
  IN_ATTESA_DOCUMENTI:  "bg-amber-100 text-amber-800",
  CONSEGNATO:           "bg-green-100 text-green-800",
  DA_FATTURARE:         "bg-pink-100 text-pink-800",
  CHIUSO:               "bg-gray-100 text-gray-400",
}

export default async function ProgettiPage({
  searchParams,
}: {
  searchParams: { stato?: string; societa?: string }
}) {
  const session = await auth()
  const isAdmin = session?.user.ruolo === "ADMIN"

  const where: any = {}
  if (searchParams.stato) where.stato = searchParams.stato
  if (searchParams.societa) where.societaId = searchParams.societa

  // Collaboratori vedono solo i propri progetti
  if (!isAdmin && session?.user.collaboratoreId) {
    where.collaboratori = {
      some: { collaboratoreId: session.user.collaboratoreId },
    }
  }

  const [progetti, societa] = await Promise.all([
    prisma.progetto.findMany({
      where,
      include: {
        cliente: { select: { ragioneSociale: true } },
        societa: { select: { nome: true, tipo: true } },
        collaboratori: {
          include: {
            collaboratore: { select: { nome: true, cognome: true } },
          },
          take: 3,
        },
        fasi: { select: { stato: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.societa.findMany({ orderBy: { nome: "asc" } }),
  ])

  // Calcola avanzamento per ogni progetto
  const progettiConPct = progetti.map((p) => {
    const tot = p.fasi.length
    const done = p.fasi.filter((f) => f.stato === "done").length
    const pct = tot > 0 ? Math.round((done / tot) * 100) : 0
    return { ...p, pct }
  })

  // Contatori per filtri
  const contatoriStati = await prisma.progetto.groupBy({
    by: ["stato"],
    _count: true,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Progetti</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {progettiConPct.length} progetti trovati
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/progetti/nuovo"
            className="text-sm px-4 py-2 bg-[#1F3864] text-white rounded-lg hover:bg-[#2a4d8a] transition-colors"
          >
            + Nuovo progetto
          </Link>
        )}
      </div>

      {/* Filtri */}
      <div className="flex gap-2 flex-wrap mb-5">
        <Link
          href="/progetti"
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            !searchParams.stato
              ? "border-gray-400 bg-gray-100 text-gray-700 font-medium"
              : "border-gray-200 text-gray-500 hover:bg-gray-50"
          }`}
        >
          Tutti ({progetti.length})
        </Link>
        {contatoriStati.map((c) => (
          <Link
            key={c.stato}
            href={`/progetti?stato=${c.stato}`}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              searchParams.stato === c.stato
                ? "border-gray-400 bg-gray-100 text-gray-700 font-medium"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {STATI_LABEL[c.stato]} ({c._count})
          </Link>
        ))}
      </div>

      {/* Lista progetti */}
      <div className="space-y-2">
        {progettiConPct.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">
            Nessun progetto trovato
          </div>
        ) : (
          progettiConPct.map((p) => (
            <Link
              key={p.id}
              href={`/progetti/${p.id}`}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-gray-300 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {p.nome}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">{p.codice}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {p.cliente.ragioneSociale}
                  {p.dataScadenza && (
                    <span className="ml-2">
                      · Scad.{" "}
                      {new Date(p.dataScadenza).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  )}
                </div>
                {/* Barra avanzamento */}
                {p.fasi.length > 0 && (
                  <div className="mt-2 h-1 bg-gray-100 rounded-full w-32 overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full transition-all"
                      style={{ width: `${p.pct}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Badge stato */}
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                  STATI_STYLE[p.stato] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {STATI_LABEL[p.stato]}
              </span>

              {/* Società */}
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0">
                {p.societa.tipo.toUpperCase()}
              </span>

              {/* % avanzamento */}
              {p.fasi.length > 0 && (
                <span className="text-xs text-gray-400 w-8 text-right shrink-0">
                  {p.pct}%
                </span>
              )}

              {/* Avatars collaboratori */}
              <div className="flex -space-x-1.5 shrink-0">
                {p.collaboratori.slice(0, 3).map((pc) => (
                  <div
                    key={pc.collaboratoreId}
                    className="w-6 h-6 rounded-full bg-purple-100 border border-white flex items-center justify-center text-xs font-medium text-purple-700"
                    title={`${pc.collaboratore.nome} ${pc.collaboratore.cognome}`}
                  >
                    {pc.collaboratore.nome[0]}{pc.collaboratore.cognome[0]}
                  </div>
                ))}
              </div>

              <span className="text-gray-300 group-hover:text-gray-400 text-sm shrink-0">›</span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
