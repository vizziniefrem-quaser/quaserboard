import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  // Dati per le card di riepilogo
  const [progetttiCount, clientiCount, collaboratoriCount, scadenzeCount] =
    await Promise.all([
      prisma.progetto.count({ where: { stato: { not: "CHIUSO" } } }),
      prisma.cliente.count({ where: { attivo: true } }),
      prisma.collaboratore.count({ where: { attivo: true } }),
      prisma.documento.count({
        where: {
          stato: { in: ["In scadenza", "Scaduto"] },
        },
      }),
    ])

  const progettiRecenti = await prisma.progetto.findMany({
    take: 5,
    orderBy: { updatedAt: "desc" },
    include: { cliente: true, societa: true },
  })

  return (
    <main className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900">
          Quaser<span className="text-amber-500">Board</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Benvenuto, {session.user.name ?? session.user.email}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Progetti attivi" value={progetttiCount} />
        <SummaryCard label="Clienti" value={clientiCount} />
        <SummaryCard label="Collaboratori" value={collaboratoriCount} />
        <SummaryCard
          label="Alert scadenze"
          value={scadenzeCount}
          alert={scadenzeCount > 0}
        />
      </div>

      {/* Progetti recenti */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-900 mb-4">
          Progetti recenti
        </h2>
        <div className="space-y-3">
          {progettiRecenti.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{p.nome}</div>
                <div className="text-xs text-gray-500">
                  {p.cliente.ragioneSociale} · {p.societa.nome}
                </div>
              </div>
              <StatoBadge stato={p.stato} />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

function SummaryCard({
  label,
  value,
  alert = false,
}: {
  label: string
  value: number
  alert?: boolean
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div
        className={`text-xl font-medium ${
          alert ? "text-amber-700" : "text-gray-900"
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function StatoBadge({ stato }: { stato: string }) {
  const map: Record<string, string> = {
    DA_INIZIARE: "bg-gray-100 text-gray-600",
    IN_CORSO: "bg-blue-100 text-blue-800",
    IN_ATTESA_DOCUMENTI: "bg-amber-100 text-amber-800",
    CONSEGNATO: "bg-green-100 text-green-800",
    DA_FATTURARE: "bg-pink-100 text-pink-800",
    CHIUSO: "bg-gray-100 text-gray-500",
  }
  const label: Record<string, string> = {
    DA_INIZIARE: "Da iniziare",
    IN_CORSO: "In corso",
    IN_ATTESA_DOCUMENTI: "Attesa doc.",
    CONSEGNATO: "Consegnato",
    DA_FATTURARE: "Da fatturare",
    CHIUSO: "Chiuso",
  }
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium ${
        map[stato] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {label[stato] ?? stato}
    </span>
  )
}
