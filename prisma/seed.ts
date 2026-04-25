import { PrismaClient, RuoloUtente, TipoContratto } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding Quaser Board...")

  // Società
  const srl = await prisma.societa.upsert({
    where: { id: "soc-srl" },
    update: {},
    create: { id: "soc-srl", nome: "Quaser Srl", tipo: "srl" },
  })
  const studio = await prisma.societa.upsert({
    where: { id: "soc-studio" },
    update: {},
    create: { id: "soc-studio", nome: "Quaser Studio Associato", tipo: "studio" },
  })
  const caa = await prisma.societa.upsert({
    where: { id: "soc-caa" },
    update: {},
    create: { id: "soc-caa", nome: "CAA", tipo: "caa", descrizione: "Centro Autorizzato di Assistenza Agricola" },
  })

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@studioquaser.it" },
    update: {},
    create: {
      email: "admin@studioquaser.it",
      name: "Amministratore",
    },
  })

  const adminCollab = await prisma.collaboratore.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      ruolo: RuoloUtente.ADMIN,
      nome: "Admin",
      cognome: "Quaser",
      tipoContratto: TipoContratto.INDETERMINATO,
      attivo: true,
    },
  })

  // Collaboratore di test (Giovanni)
  const giovUser = await prisma.user.upsert({
    where: { email: "qualita@studioquaser.it" },
    update: {},
    create: {
      email: "qualita@studioquaser.it",
      name: "Giovanni Carbontax",
    },
  })

  const giovCollab = await prisma.collaboratore.upsert({
    where: { userId: giovUser.id },
    update: {},
    create: {
      userId: giovUser.id,
      ruolo: RuoloUtente.COLLABORATORE,
      nome: "Giovanni",
      cognome: "Carbontax",
      tipoContratto: TipoContratto.PARTITA_IVA,
      attivo: true,
    },
  })

  // Associa Giovanni al CAA
  await prisma.collaboratoreSocieta.upsert({
    where: { collaboratoreId_societaId: { collaboratoreId: giovCollab.id, societaId: caa.id } },
    update: {},
    create: { collaboratoreId: giovCollab.id, societaId: caa.id, ruoloInSocieta: "Tecnico" },
  })

  // Tariffa km Giovanni 2026
  await prisma.tariffaKm.upsert({
    where: { collaboratoreId_anno: { collaboratoreId: giovCollab.id, anno: 2026 } },
    update: {},
    create: { collaboratoreId: giovCollab.id, anno: 2026, tariffa: 0.4389, note: "Tariffa ACI 2026" },
  })

  // Cliente Fagiolino Berdia
  const fagiolino = await prisma.cliente.upsert({
    where: { codice: "CLI-0031" },
    update: {},
    create: {
      codice: "CLI-0031",
      ragioneSociale: "Fagiolino Berdia Srl",
      comune: "Ragusa",
      provincia: "RG",
      email: "info@fagiolinoberdia.it",
      attivo: true,
    },
  })

  // Referente Fagiolino
  const referenteFagiolino = await prisma.referente.findFirst({
    where: { clienteId: fagiolino.id, predefinito: true },
  })
  if (!referenteFagiolino) {
    await prisma.referente.create({
      data: {
        clienteId: fagiolino.id,
        nome: "Giuseppe",
        cognome: "Berdia",
        ruolo: "Titolare",
        telefono: "+39 333 9876543",
        email: "g.berdia@fagiolinoberdia.it",
        predefinito: true,
      },
    })
  }

  // Progetto Fagiolino Berdia
  const progetto = await prisma.progetto.upsert({
    where: { codice: "PRJ-006" },
    update: {},
    create: {
      codice: "PRJ-006",
      nome: "Fagiolino Berdia",
      clienteId: fagiolino.id,
      societaId: caa.id,
      stato: "IN_CORSO",
      dataInizio: new Date("2026-04-25"),
      dataScadenza: new Date("2026-06-30"),
      prezzoCliente: 1800,
      statoPagamento: "Da fatturare",
    },
  })

  // Assegna Giovanni al progetto
  await prisma.progettoCollaboratore.upsert({
    where: { progettoId_collaboratoreId: { progettoId: progetto.id, collaboratoreId: giovCollab.id } },
    update: {},
    create: { progettoId: progetto.id, collaboratoreId: giovCollab.id, ruolo: "Responsabile" },
  })

  // Fasi del progetto
  const fasiDef = [
    { nome: "Commerciale",  ordine: 1, stato: "done"   },
    { nome: "Questionario", ordine: 2, stato: "active" },
    { nome: "Sopralluogo",  ordine: 3, stato: "todo"   },
    { nome: "Documenti",    ordine: 4, stato: "todo"   },
    { nome: "Verifica",     ordine: 5, stato: "todo"   },
    { nome: "Fine lavoro",  ordine: 6, stato: "todo"   },
  ]

  for (const f of fasiDef) {
    const fase = await prisma.faseProgetto.upsert({
      where: { id: `fase-${progetto.id}-${f.ordine}` },
      update: { stato: f.stato },
      create: {
        id: `fase-${progetto.id}-${f.ordine}`,
        progettoId: progetto.id,
        nome: f.nome,
        ordine: f.ordine,
        stato: f.stato,
      },
    })

    // Task per ogni fase
    const taskDef: Record<string, string[]> = {
      Commerciale:  ["Primo contatto cliente", "Offerta economica", "Conferma incarico firmata"],
      Questionario: ["Invio questionario al cliente", "Ricezione questionario compilato", "Verifica completezza dati"],
      Sopralluogo:  ["Pianificazione data sopralluogo", "Esecuzione sopralluogo", "Report fotografico e note"],
      Documenti:    ["Lista documenti richiesti", "Ricezione documenti", "Caricamento su Quaser Board"],
      Verifica:     ["Revisione documentazione", "Verifica conformità normativa", "Approvazione amministratore"],
      "Fine lavoro":["Consegna al cliente", "Firma chiusura pratica", "Emissione fattura"],
    }

    const tasks = taskDef[f.nome] ?? []
    for (let i = 0; i < tasks.length; i++) {
      await prisma.taskFase.upsert({
        where: { id: `task-${fase.id}-${i}` },
        update: {},
        create: {
          id: `task-${fase.id}-${i}`,
          faseId: fase.id,
          testo: tasks[i],
          completato: f.stato === "done",
          ordine: i,
        },
      })
    }
  }

  console.log("✅ Seed completato!")
  console.log("   Admin: admin@studioquaser.it")
  console.log("   Collaboratore: qualita@studioquaser.it")
  console.log("   Progetto: Fagiolino Berdia (PRJ-006)")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
