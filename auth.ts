import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Resend from "next-auth/providers/resend"
import { prisma } from "@/lib/prisma"
import type { RuoloUtente } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      ruolo: RuoloUtente
      collaboratoreId?: string
    }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
    async session({ session, user }) {
      // Arricchisce la sessione con ruolo e collaboratoreId
      const collaboratore = await prisma.collaboratore.findUnique({
        where: { userId: user.id },
        select: { id: true, ruolo: true },
      })
      session.user.id = user.id
      session.user.ruolo = collaboratore?.ruolo ?? "COLLABORATORE"
      session.user.collaboratoreId = collaboratore?.id
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url
      return baseUrl + "/dashboard"
    },
  },
})
