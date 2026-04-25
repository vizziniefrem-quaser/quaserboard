import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Route accessibili solo all'admin
const ADMIN_ROUTES = [
  "/collaboratori",
  "/anagrafica/storico",
  "/anagrafica/costi",
]

// Route accessibili a collaboratori e admin (non clienti)
const STAFF_ROUTES = [
  "/dashboard",
  "/progetti",
  "/trasferte",
  "/commenti",
  "/anagrafica",
]

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Non autenticato → login
  if (!session) {
    if (pathname.startsWith("/login")) return NextResponse.next()
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const ruolo = session.user?.ruolo ?? "COLLABORATORE"

  // Cliente → solo portale
  if (ruolo === "CLIENTE") {
    if (!pathname.startsWith("/portale")) {
      return NextResponse.redirect(new URL("/portale", req.url))
    }
    return NextResponse.next()
  }

  // Route solo admin
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (ruolo !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
