# Pagamenti con Stripe (modalità test)

## Cosa è stato fatto

- **Pagina Piano** (`/billing`, nuova voce nel menu): i due piani, quello attuale segnato. Da Free: "Passa a Pro" apre Stripe Checkout (19 € al mese). Da Pro: "Gestisci o disdici" apre il portale cliente di Stripe; la card dice "Si rinnova il …", "Disdetto: resta Pro fino al …, poi torna Free" o, con un pagamento non riuscito, di aggiornare il metodo di pagamento. "Passa a Pro" nell'avviso del limite Free ora porta qui.
- **Ritorno dal Checkout** (`/billing?checkout=done`): la card "Aspettiamo la conferma di Stripe…" chiede di nuovo la pagina al server ogni 2 secondi finché il webhook scrive Pro; dopo un minuto dice che la conferma sta tardando e rallenta a 10 secondi, dopo 10 minuti smette e dice di ricaricare più tardi. Arrivata la conferma mostra "Pagamento confermato" e toglie il parametro dall'indirizzo.
- **Senza chiavi** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`): la pagina dice "I pagamenti non sono attivi… il workspace resta Free", nessun pulsante; il webhook risponde 503 e scrive nel log i nomi delle variabili mancanti.
- **Webhook** `POST /api/stripe/webhook`: verifica la firma sul corpo grezzo (400 se non valida o assente), poi per gli eventi di Checkout, abbonamento e fattura rilegge da Stripe gli abbonamenti del cliente e scrive lo stato in `subscriptions`.
- Migrazione `…_stripe_billing.sql`: colonne `cancel_at` e `stripe_synced_at`. Scritte solo dal server, come il resto della riga.
- Dipendenza nuova: `stripe` 22.6 (API `2026-08-26.dahlia`).

## Decisioni

- **Il webhook non si fida del contenuto dell'evento**: ne prende solo il cliente e rilegge lo stato da Stripe. Un evento ripetuto riscrive lo stesso stato; un evento vecchio arrivato tardi non riporta indietro il piano.
- **Due webhook insieme**: ogni scrittura porta l'ora in cui è cominciata la lettura da Stripe, e una lettura cominciata prima di quella già salvata viene scartata, nella stessa `update`. Trovato dalla revisione: prima uno stato "incompleto" letto lentamente poteva sovrascrivere "attivo" dopo il pagamento.
- **Solo il prezzo Pro dà Pro**, con gli stati `active`, `trialing`, `past_due`. `past_due` resta Pro mentre Stripe ritenta il pagamento; `unpaid`, `canceled`, `incomplete`, `paused` sono Free. Se il cliente ha più abbonamenti vale quello che dà Pro, altrimenti il più recente.
- **Dal cliente al workspace senza metadata**: il cliente Stripe si crea al primo "Passa a Pro" e il suo id si salva una volta sola (due clic insieme usano lo stesso). I metadata `workspace_id` sul cliente servono solo a chi legge la dashboard.
- **Niente doppio addebito dal pulsante**: niente Checkout se il workspace è Pro, né se Stripe ha già un abbonamento Pro che il webhook non ha ancora scritto; un nuovo Checkout chiude quelli rimasti aperti in altre schede.
- **Solo l'owner** apre Checkout e portale.
- **Disdetta**: dal portale, a fine periodo. Il workspace resta Pro fino a quella data, poi `customer.subscription.deleted` lo riporta a Free: i dati restano, i nuovi feedback oltre 100 vengono rifiutati (test).
- **Log**: il webhook scrive solo tipo e id dell'evento; le azioni scrivono il messaggio d'errore di Stripe (Stripe maschera le chiavi).
- Il seed resta com'è: Fatturino è Pro senza cliente Stripe, quindi la sua pagina Piano non ha il pulsante del portale.

## Verifica

- `supabase db reset` da zero: riuscito.
- `pnpm typecheck`, `pnpm lint`: zero errori. `pnpm build`: riuscito. `pnpm test`: 180 test, 0 falliti (erano 152). Nuovi:
  - 15 sul webhook (database locale, firma vera, risposte di Stripe finte): firma valida; firma non valida (segreto sbagliato, corpo cambiato, timestamp vecchio, intestazione vuota o assente) rifiutata senza chiamare Stripe; chiavi mancanti 503; evento ripetuto; evento vecchio dopo la disdetta; contenuto dell'evento ignorato; due webhook insieme con la lettura più vecchia che finisce dopo; prezzo diverso da Pro; nuovo abbonamento dopo uno chiuso; disdetta a fine periodo e chiusura; ritorno a Free con 101 feedback che restano e il 102° rifiutato; `past_due` e `unpaid`; cliente sconosciuto; altri eventi; Stripe irraggiungibile.
  - 9 sulle azioni: cliente creato una volta, Checkout con prezzo e indirizzi giusti e piano ancora Free; Checkout aperto in un'altra scheda chiuso; due primi clic insieme; già Pro; pagato ma webhook non arrivato; chiavi mancanti; non owner; errore di Stripe; portale con e senza cliente.
  - 2 sulla configurazione, 1 di accesso (l'utente non scrive nessun campo della fatturazione).
- Controprova: tolta la verifica della firma, tolto il controllo sull'ora di lettura, tolto il controllo sul prezzo: ogni volta il test corrispondente fallisce.
- Browser (Playwright, build di produzione): pagina senza chiavi; con chiavi finte "Passa a Pro" mostra "Stripe non risponde"; ritorno dal Checkout in attesa, poi "Pagamento confermato" quando il piano diventa Pro, indirizzo ripulito; disdetta programmata; webhook via HTTP: 503 senza chiavi, 400 con firma sbagliata.
- Revisione indipendente da un subagente: nessuna falla di accesso. Corretti tutti i punti: scrittura di stato vecchio con webhook concorrenti, prezzo non controllato, Checkout doppi in due schede, attesa senza fine e conferma ripetuta al ricaricamento, due test con nomi più forti di quello che provavano.

## Cosa resta

- **Il flusso vero con Stripe non è stato provato**: servono le chiavi test in `.env.local`, il prezzo e il portale configurati nella dashboard (passi nel README e nel riepilogo della sessione).
- I punti da risolvere prima dei clienti reali sono in `docs/prima-dei-clienti-reali.md`, sezione Pagamenti.
