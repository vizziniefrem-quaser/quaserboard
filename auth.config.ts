import type { NextAuthConfig } from "next-auth"
import Resend from "next-auth/providers/resend"

export const authConfig: NextAuthConfig = {
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verifica",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = nextUrl

      if (pathname.startsWith("/login")) return true
      if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl))
      return true
    },
  },
}
