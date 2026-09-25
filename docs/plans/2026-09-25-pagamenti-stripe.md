# Pagamenti con Stripe (modalità test)

## Obiettivo

Il PM passa a Pro (19 € al mese) con Stripe Checkout, gestisce o disdice l'abbonamento dal portale cliente di Stripe, e il piano del workspace cambia solo quando arriva un webhook firmato. Eventi duplicati o fuori ordine non lasciano il piano sbagliato. Al ritorno dal Checkout la pagina aspetta la conferma del webhook e lo dice. Senza chiavi Stripe in `.env.local` l'app resta Free e lo dice.

## Decisioni

- **SDK `stripe` 22.6, API `2026-08-26.dahlia`.** Nuova dipendenza, prevista dallo stack.
- **Variabili:** `STRIPE_SECRET_KEY` (meglio una chiave con permessi limitati, `rk_test_…`), `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` (il prezzo da 19 € al mese creato nella dashboard). Solo lato server. Se ne manca una, i pagamenti sono spenti: la pagina Piano lo dice, il pulsante non c'è, il webhook risponde 503.
- **Il webhook non si fida del contenuto dell'evento.** Da ogni evento prende solo il cliente Stripe, poi rilegge da Stripe tutti gli abbonamenti di quel cliente e scrive lo stato attuale. Così un evento ripetuto riscrive lo stesso stato, e un evento vecchio arrivato tardi non riporta indietro il piano: conta quello che Stripe dice adesso. Gli eventi di Checkout arrivano spesso nello stesso secondo, quindi ordinarli per data non basterebbe.
- **Dal cliente al workspace, senza metadata.** Il cliente Stripe si crea dal server al primo "Passa a Pro" e il suo id si salva in `subscriptions.stripe_customer_id`. Il webhook trova il workspace da quell'id. Un cliente sconosciuto si ignora (200).
- **Quale abbonamento conta.** Se il cliente ne ha più di uno (per esempio uno disdetto e uno nuovo), vale quello che dà Pro; altrimenti il più recente.
- **Pro con gli stati `active`, `trialing`, `past_due`.** `past_due`: Stripe sta ritentando il pagamento, il PM non perde Pro durante i tentativi. Con `unpaid`, `canceled`, `incomplete`, `incomplete_expired`, `paused` il piano è Free.
- **Disdetta dal portale a fine periodo.** Il piano resta Pro fino alla fine del periodo pagato e la pagina dice "resta Pro fino al …". Quando Stripe chiude l'abbonamento arriva `customer.subscription.deleted` e il workspace torna Free: i dati restano, i limiti tornano quelli Free (decisione 6 del brief).
- **Nuova colonna `subscriptions.cancel_at`**: la data in cui l'abbonamento finirà, se è disdetto. Scritta solo dal webhook, come il resto della riga.
- **Solo l'owner** avvia il Checkout e apre il portale (brief, "Chi può fare cosa"). Oggi owner e utente coincidono, ma il controllo c'è.
- **Nessun doppio abbonamento dal pulsante:** se il workspace è già Pro, "Passa a Pro" non crea un Checkout.
- **Ritorno dal Checkout:** `success_url` porta a `/billing?checkout=done`. La pagina non guarda il parametro per decidere il piano: legge il database ogni 2 secondi finché il piano diventa Pro, e intanto dice che aspetta la conferma di Stripe. Dopo un minuto dice che la conferma sta tardando e che il piano si aggiorna da solo appena arriva.
- **Niente Stripe Tax** in modalità test: il fiscale resta in `docs/prima-dei-clienti-reali.md`.

## Passi

1. Migrazione `cancel_at`, tipi rigenerati.
2. `src/lib/stripe.ts` (client e configurazione) e `src/lib/billing.ts` (sincronizzazione del cliente, calcolo del piano).
3. Webhook `src/app/api/stripe/webhook/route.ts`.
4. Azioni `startCheckout` e `openPortal`, pagina `/billing` (Piano) con attesa della conferma, link dal badge del piano e da "Passa a Pro".
5. Test, verifica, revisione indipendente.

## Verifica

- `supabase db reset` da zero.
- Test del webhook contro il database locale (Stripe finto per la lettura degli abbonamenti, firma vera): firma valida, firma non valida o assente, evento ripetuto, evento vecchio dopo uno nuovo, disdetta a fine periodo e chiusura, nuovo abbonamento dopo uno chiuso, cliente sconosciuto, chiavi mancanti.
- Test delle azioni: cliente creato una volta sola, niente Checkout se già Pro, chiavi mancanti.
- RLS: l'utente non scrive la fatturazione (test già esistenti, più `cancel_at`).
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
- Browser: pagina Piano senza chiavi, con chiavi finte in attesa della conferma e poi Pro, disdetta programmata.
