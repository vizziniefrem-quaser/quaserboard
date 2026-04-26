import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

const ADMIN_ROUTES = [
  "/collaboratori",
  "/anagrafica/storico",
  "/anagrafica/costi",
]

export default NextAuth(authConfig).auth(function middleware(req) {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (!session) {
    if (pathname.startsWith("/login")) return
    return Response.redirect(new URL("/login", req.url))
  }

  const ruolo = (session.user as any)?.ruolo ?? "COLLABORATORE"

  if (ruolo === "CLIENTE") {
    if (!pathname.startsWith("/portale")) {
      return Response.redirect(new URL("/portale", req.url))
    }
    return
  }

  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (ruolo !== "ADMIN") {
      return Response.redirect(new URL("/dashboard", req.url))
    }
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
