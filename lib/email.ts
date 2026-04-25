import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── INVIO INVITO COLLABORATORE ──────────────────────────
export async function inviaInvitoCollaboratore({
  email,
  nome,
  passwordTemp,
  linkAccesso,
}: {
  email: string
  nome: string
  passwordTemp: string
  linkAccesso: string
}) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: "Quaser Board — Il tuo accesso",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
        <div style="background:#1F3864;padding:20px 24px;border-radius:8px 8px 0 0;">
          <span style="font-size:16px;font-weight:700;color:#fff;letter-spacing:1px;">
            QUASER<span style="color:#EF9F27;">BOARD</span>
          </span>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e0ddd6;border-top:none;border-radius:0 0 8px 8px;">
          <p>Gentile <strong>${nome}</strong>,</p>
          <p>Sei stato invitato ad accedere a <strong>Quaser Board</strong>.</p>
          <p><strong>Credenziali di accesso:</strong><br>
          Email: <code>${email}</code><br>
          Password temporanea: <code>${passwordTemp}</code></p>
          <a href="${linkAccesso}"
            style="display:inline-block;background:#1F3864;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;margin:12px 0;">
            Accedi a Quaser Board
          </a>
          <p style="font-size:12px;color:#888;">Al primo accesso ti verrà chiesto di impostare una password personale.</p>
          <p>Cordiali saluti,<br><strong>Il team di <span style="color:#EF9F27;">Quaser</span></strong></p>
        </div>
      </div>
    `,
  })
}

// ─── ALERT SCADENZA DOCUMENTO ────────────────────────────
export async function inviaAlertScadenza({
  emailDestinatario,
  nomeReferente,
  nomeCliente,
  scadenze,
}: {
  emailDestinatario: string
  nomeReferente: string
  nomeCliente: string
  scadenze: Array<{ nome: string; data: string; giorniMancanti: number }>
}) {
  const righeScadenze = scadenze
    .map(
      (s) =>
        `<li><strong>${s.nome}</strong> — scade il ${s.data} (tra ${s.giorniMancanti} giorni)</li>`
    )
    .join("")

  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: emailDestinatario,
    subject: `Quaser Board — Scadenze in arrivo: ${nomeCliente}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
        <div style="background:#1F3864;padding:20px 24px;border-radius:8px 8px 0 0;">
          <span style="font-size:16px;font-weight:700;color:#fff;letter-spacing:1px;">
            QUASER<span style="color:#EF9F27;">BOARD</span>
          </span>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e0ddd6;border-top:none;border-radius:0 0 8px 8px;">
          <p>Gentile ${nomeReferente},</p>
          <p>Le seguenti scadenze per il cliente <strong>${nomeCliente}</strong>
            si avvicinano entro i prossimi 90 giorni:</p>
          <ul>${righeScadenze}</ul>
          <p>Acceda a Quaser Board per visualizzare e aggiornare i documenti.</p>
          <p style="font-size:12px;color:#888;">— Notifica automatica Quaser Board</p>
        </div>
      </div>
    `,
  })
}

// ─── EMAIL MENSILE RIEPILOGO LAVORI ──────────────────────
export async function inviaRiepilogoMensile({
  emailDestinatario,
  nomeCliente,
  mese,
  anno,
  lavori,
  nota,
}: {
  emailDestinatario: string
  nomeCliente: string
  mese: string
  anno: number
  lavori: Array<{ tipo: string; descrizione: string; stato: string }>
  nota?: string
}) {
  const righe = lavori
    .map(
      (l) =>
        `<li><strong>${l.tipo}</strong> — ${l.descrizione} <em>(${l.stato})</em></li>`
    )
    .join("")

  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: emailDestinatario,
    subject: `Quaser Board — Riepilogo lavori ${mese} ${anno}: ${nomeCliente}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
        <div style="background:#1F3864;padding:20px 24px;border-radius:8px 8px 0 0;">
          <span style="font-size:16px;font-weight:700;color:#fff;letter-spacing:1px;">
            QUASER<span style="color:#EF9F27;">BOARD</span>
          </span>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e0ddd6;border-top:none;border-radius:0 0 8px 8px;">
          <p>Gentile cliente,<br><strong>${nomeCliente}</strong></p>
          <p>Le inviamo il riepilogo delle attività svolte nel mese di
            <strong>${mese} ${anno}</strong>:</p>
          <ul>${righe}</ul>
          ${nota ? `<p>${nota}</p>` : ""}
          <p>Restiamo a disposizione per qualsiasi chiarimento.</p>
          <p>Cordiali saluti,<br>
          <strong>Il team di <span style="color:#EF9F27;">Quaser</span></strong></p>
        </div>
      </div>
    `,
  })
}
