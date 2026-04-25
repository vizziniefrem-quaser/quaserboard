import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { signOut } from "@/auth"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.ruolo === "CLIENTE") redirect("/portale")

  const isAdmin = session.user.ruolo === "ADMIN"

  const navItems = [
    { href: "/dashboard",      label: "Home",           icon: "⬜" },
    { href: "/progetti",       label: "Progetti",       icon: "📋" },
    { href: "/anagrafica",     label: "Anagrafica",     icon: "🗂" },
    { href: "/trasferte",      label: "Trasferte",      icon: "🚗" },
    { href: "/commenti",       label: "Commenti",       icon: "💬" },
    ...(isAdmin ? [
      { href: "/collaboratori", label: "Collaboratori", icon: "👥" },
    ] : []),
  ]

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="text-lg font-bold tracking-wide text-gray-900">
            QUASER<span className="text-amber-500">BOARD</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {session.user.ruolo === "ADMIN" ? "Amministratore" : "Collaboratore"}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <span className="text-base w-5">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-800">
              {session.user.email?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-700 truncate">
                {session.user.name ?? session.user.email}
              </div>
            </div>
          </div>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button className="w-full text-left text-xs text-gray-400 hover:text-gray-600 px-1">
              Esci
            </button>
          </form>
        </div>
      </aside>

      {/* Contenuto principale */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>

    </div>
  )
}
