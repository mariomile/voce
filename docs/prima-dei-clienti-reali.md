# Prima dei clienti reali

Cose da risolvere prima di aprire Voce a clienti reali. Finché siamo in modalità test restano fuori scope, ma non si dimenticano.

## Dati e AI

- **Elaborazione AI in UE.** Oggi Claude gira sull'API Anthropic e l'elaborazione in UE non è garantita. Serve una soluzione che tenga i dati dei feedback in UE, o una scelta esplicita e documentata. Anthropic va nell'elenco dei sub-responsabili e nel registro dei trattamenti.
- **Testo delle domande all'API Anthropic.** Con "Chiedi ai tuoi feedback" anche il testo delle domande del PM va all'API Anthropic, insieme ai feedback, sotto la stessa eccezione accettata in modalità test. Con clienti reali va deciso se l'eccezione copre anche le domande. Il registro `question_runs` conserva domanda, prompt e risposta: stesse regole di conservazione di `analysis_runs`.
- **Testo delle ipotesi all'API Anthropic.** Con la Research anche il testo delle ipotesi del PM va all'API Anthropic, insieme ai feedback, per il verdetto: stessa eccezione accettata in modalità test, da decidere con clienti reali come per le domande. La domanda della Research non entra nei prompt di temi e verdetto, solo in quello del report (voce sotto). Il registro `analysis_runs` conserva ipotesi, prompt e risposta anche per il verdetto.
- **Report della Research all'API Anthropic.** Il report manda all'API Anthropic la domanda della Research, le ipotesi con il ragionamento dei verdetti, titoli e riassunti dei temi e il testo dei feedback citati dalla sintesi (non tutti i feedback), sotto la stessa eccezione accettata in modalità test. `analysis_runs` conserva prompt e risposta anche per il report; `research_reports` conserva il report con gli id dei feedback citati e le frasi evidenziate: il testo intero si legge dal feedback, e un feedback eliminato sparisce dal report, ma la frase evidenziata resta nel JSON salvato finché si elimina la Research.
- **Chiave Anthropic su Vercel.** Senza `ANTHROPIC_API_KEY` nelle variabili d'ambiente di Vercel ogni analisi fallisce. La chiave si crea nella console Anthropic, in un workspace dedicato a Voce, con un limite di spesa mensile impostato lì: è il tetto di sicurezza sul costo AI. `AI_MODEL` resta facoltativa.
- **Registro delle analisi.** `analysis_runs` conserva per sempre il testo dei feedback inviati al modello e la risposta. Da citare nel registro dei trattamenti e da decidere per quanto tempo tenerlo. Un feedback eliminato dalla lista resta nel registro delle analisi che lo hanno letto: se l'eliminazione deve valere come cancellazione dei dati, va tolto anche da lì. Eliminare una Research invece svuota testi, prompt e risposte dei registri delle sue analisi e domande (`analysis_runs`, `question_runs`).
- **Analisi rimaste a metà.** Se la funzione viene interrotta, l'analisi resta "in corso" e si chiude come fallita solo al tentativo successivo, dopo 10 minuti. Con traffico vero valutare un job che le chiuda.
- **Costo AI oltre la quota.** Le analisi fallite non consumano quota e si provocano facilmente: il tetto effettivo è il doppio della quota (fino a circa 130 $ al mese per un Pro nel caso peggiore, 500 feedback lunghi). E ogni nuovo account Free porta 3 analisi al mese, quindi chi crea account in serie moltiplica il costo. Da decidere: contare le fallite oltre una soglia, un tetto di caratteri per analisi, un tetto di spesa globale o un captcha alla registrazione (`docs/review.md`, B5 e B6).
- **Durata della funzione.** L'analisi può durare fino a 4 minuti: la pagina della Research (`/research/[id]`) chiede 300 secondi (`maxDuration`). Con le ipotesi le due chiamate (temi e verdetto) partono insieme e stanno negli stessi 4 minuti. Verificare che il piano Vercel li consenta.

## Analytics

- **Chiave PostHog su Vercel.** Senza `POSTHOG_KEY` non parte nessun evento: la metrica di attivazione resta vuota. Il progetto PostHog va creato in regione UE.
- **PostHog tra i sub-responsabili.** Riceve solo l'id del workspace, il momento e categorie o conteggi (`docs/analytics.md`), niente testo né dati personali. Va comunque nell'elenco dei sub-responsabili e nel registro dei trattamenti: l'id del workspace è un identificativo pseudonimo.

## Modulo pubblico

- **Avviso privacy sul modulo.** Fatto (provvisorio): sotto il campo di risposta una riga dice che le risposte sono analizzate con un'AI (Anthropic) e chiede di non scrivere dati personali, l'email è facoltativa. Manca ancora la pagina privacy completa, a cui la riga dovrà rimandare (vedi "Legale").
- **Chiave segreta su Vercel.** Il modulo pubblico ora salva passando dal server con `SUPABASE_SECRET_KEY`: senza questa variabile su Vercel il modulo non funziona.
- **IP del visitatore.** Il limite per IP si fida di `x-real-ip` e `x-forwarded-for`, che Vercel imposta da sé. Se l'app gira dietro un altro proxy, va verificato che quelle intestazioni non arrivino dal visitatore.
- **IP condivisi.** Il limite per IP (1.000 all'ora) conta tutti i moduli insieme. Dietro il NAT di un operatore mobile molti sconosciuti condividono lo stesso IP: con traffico vero, se si vedono rifiuti tra workspace diversi, contare per IP e workspace. E uno script da un solo IP può mandare 1.000 invii in pochi minuti in un solo workspace Pro, spingendo fuori dall'analisi (gli ultimi 500) i feedback veri: il tetto resta l'ora del workspace, e un Free si riempie subito. Da rivedere con dati veri (captcha o verifica leggera).
- **Tentativi del modulo.** Per i limiti si salva un hash con chiave dell'IP (la chiave è `SUPABASE_SECRET_KEY`, il database non la conosce). Le righe più vecchie di un'ora si cancellano al primo invio successivo: se un modulo non riceve più invii restano lì. Da citare nel registro dei trattamenti, o da pulire con un job programmato.

## Pagamenti

- **Stripe in modalità live.** Chiavi live (una chiave con permessi limitati, non la segreta), prezzo Pro live, endpoint del webhook live con il suo segreto, portale cliente configurato in live. Le chiavi vanno su Vercel come variabili sensibili.
- **Stripe riceve dati degli utenti**: email dell'owner e nome del workspace per il cliente, più i dati di pagamento. Va nell'elenco dei sub-responsabili e nel registro dei trattamenti; Stripe tratta dati anche fuori UE.
- **Due abbonamenti per lo stesso workspace.** Un nuovo Checkout chiude quelli rimasti aperti e non parte se Stripe ha già un abbonamento Pro attivo. Resta un caso: due primi clic quasi simultanei da due schede diverse. Con clienti veri, attivare anche "Limita i clienti a un solo abbonamento" nelle impostazioni del Checkout.
- **Ordine dei webhook tra server diversi.** Due webhook che arrivano insieme vengono messi in ordine per l'ora in cui hanno cominciato a leggere da Stripe, presa dall'orologio del server. Tra istanze diverse di Vercel gli orologi possono differire di pochi millisecondi: in quella finestra resta possibile scrivere uno stato vecchio, che si corregge al prossimo evento dello stesso cliente.

## Database in produzione

- Il progetto Supabase di produzione non esiste ancora. Va creato in regione UE, con la conferma dell'email attiva, un SMTP vero per le email di Auth, il template di conferma di `supabase/templates/confirmation.html` e gli URL di redirect del dominio vero.
- **Migrazione della Research (`20261001090000_research.sql`) in produzione.** Non è additiva: rende obbligatorio `research_id` su ogni feedback e toglie `form_slug`, `form_enabled` e `form_question` da `workspaces`. Il codice di prima non funziona sul database migrato e il codice nuovo non funziona su quello di prima: migrazione e deploy del codice vanno insieme, nella stessa finestra, e la migrazione non si annulla. Non prima del 2026-10-01; la data la decide Mario (entro il 2026-10-04, perché la coorte della metrica parte il 2026-10-05). Prima: backup del database e prova su una copia dei dati di produzione, con `/f/phc26` che deve rispondere dopo.
- **In produzione la conferma dell'email è spenta** (decisione di Mario, 2026-10-05: niente SMTP esterno). L'SMTP integrato di Supabase manda solo agli indirizzi del team, 2 email all'ora: con la conferma accesa nessun cliente vero riusciva a registrarsi. Ora chi si registra entra subito. Costo: si accettano indirizzi non verificati e chiunque può registrarsi con l'email di un altro; il reset della password resta legato all'SMTP integrato, quindi non arriva a chi non è del team. Da rivedere se arrivano account falsi o se serve il reset password.

## Legale

- Da definire: pagina privacy completa (oggi c'è solo la riga provvisoria sul modulo pubblico), privacy policy, termini di servizio, accordo sul trattamento dei dati (DPA) con i clienti, elenco dei sub-responsabili.

## Fiscale

- Da definire: fatturazione, IVA e configurazione fiscale di Stripe. Il Checkout oggi non calcola l'IVA: Stripe Tax (`automatic_tax`) va attivato solo dopo aver registrato la partita IVA in Stripe, altrimenti non incassa nulla e non dà errori.
