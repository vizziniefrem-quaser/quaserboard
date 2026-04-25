# Quaser Board

Piattaforma di gestione progetti, clienti e collaboratori.

## Stack

- **Next.js 14** (App Router)
- **PostgreSQL** su [Neon](https://neon.tech) (serverless, gratuito)
- **Prisma** ORM
- **NextAuth.js v5** (magic link via email)
- **Resend** per le email
- **Vercel Blob** per i documenti
- **Tailwind CSS** + shadcn/ui

---

## Setup locale (passo per passo)

### 1. Prerequisiti

- Node.js 18+
- Git
- Account gratuiti su: [Neon](https://neon.tech), [Resend](https://resend.com), [Vercel](https://vercel.com)

### 2. Clona e installa

```bash
git clone https://github.com/tuo-utente/quaserboard.git
cd quaserboard
npm install
```

### 3. Variabili d'ambiente

```bash
cp .env.example .env.local
```

Apri `.env.local` e compila:

| Variabile | Come ottenerla |
|---|---|
| `DATABASE_URL` | Neon → New Project → Connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` nel terminale |
| `RESEND_API_KEY` | Resend → API Keys → Create |
| `EMAIL_FROM` | Il tuo dominio verificato su Resend |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Create Blob Store |

### 4. Database

```bash
# Crea le tabelle
npm run db:push

# Oppure con migrazioni versionabili
npm run db:migrate

# Apri Prisma Studio per vedere i dati
npm run db:studio
```

### 5. Avvia in sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

---

## Struttura cartelle

```
quaserboard/
├── app/
│   ├── (auth)/login/          # Pagina login
│   ├── (admin)/               # Route solo amministratore
│   │   ├── dashboard/         # Home con riepilogo
│   │   ├── progetti/          # Lista e schede progetti
│   │   ├── collaboratori/     # Schede collaboratori + costi
│   │   ├── anagrafica/        # Clienti + documenti
│   │   ├── trasferte/         # Registro trasferte
│   │   └── commenti/          # Pannello richieste
│   ├── (collab)/              # Route collaboratori
│   │   └── miei-progetti/
│   ├── (cliente)/             # Portale clienti
│   │   └── portale/
│   └── api/                   # Route handlers
├── components/                # Componenti React
├── lib/
│   ├── prisma.ts              # Client Prisma
│   ├── auth.ts                # Config NextAuth
│   ├── email.ts               # Email con Resend
│   └── export-trasferte.ts    # Generazione XLS
├── prisma/
│   └── schema.prisma          # Schema database
├── middleware.ts              # Protezione route per ruolo
└── auth.ts                    # NextAuth handlers
```

## Ruoli

| Ruolo | Accesso |
|---|---|
| `ADMIN` | Tutto, incluso costi e storico |
| `COLLABORATORE` | Progetti assegnati, trasferte |
| `ESTERNO` | Solo propri progetti |
| `CLIENTE` | Portale: stato progetto e documenti condivisi |

## Deploy su Vercel

```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel

# Produzione
vercel --prod
```

Ricorda di aggiungere le variabili d'ambiente anche su Vercel Dashboard → Settings → Environment Variables.

---

## Prossimi sviluppi

- [ ] Alert automatici scadenze 90gg (cron job)
- [ ] Export PDF scheda cliente
- [ ] Notifiche WhatsApp (Twilio)
- [ ] App mobile (React Native)
