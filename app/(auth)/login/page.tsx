"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [inviato, setInviato] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await signIn("resend", { email, redirect: false })
    setInviato(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-wide text-gray-900">
            QUASER<span className="text-amber-500">BOARD</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gestione progetti e collaboratori</p>
        </div>

        {inviato ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-xl">✓</span>
            </div>
            <h2 className="text-sm font-medium text-gray-900 mb-2">Controlla la tua email</h2>
            <p className="text-sm text-gray-500">
              Abbiamo inviato un link di accesso a <strong>{email}</strong>.
              Clicca il link per entrare in Quaser Board.
            </p>
            <button
              onClick={() => setInviato(false)}
              className="mt-4 text-xs text-blue-600 underline"
            >
              Usa un'altra email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block text-xs text-gray-500 mb-1">Email aziendale</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@studioquaser.it"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1F3864] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#2a4d8a] transition-colors disabled:opacity-50"
            >
              {loading ? "Invio in corso..." : "Invia link di accesso"}
            </button>
            <p className="text-xs text-gray-400 text-center mt-4">
              Riceverai un link via email — nessuna password necessaria
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
