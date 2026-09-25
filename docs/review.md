# Review di sicurezza e performance

Data: 2026-09-25, commit di partenza `9153b61`. Due revisori indipendenti (sicurezza e performance) hanno letto migrazioni, funzioni del database, server action, route handler, proxy e componenti client, con verifiche sul database locale (privilegi, policy RLS, `EXPLAIN`) e sul bundle della build. Ogni punto rimanda al file e alla riga.

## Priorità alta

### P1. La pagina Feedback carica e mostra tutti i feedback del workspace (performance): corretta

- **Dove:** `src/lib/data.ts` (`listFeedback`), `src/app/(app)/feedback/page.tsx`.
- **Problema:** `listFeedback` leggeva tutte le righe del workspace a blocchi di 1.000, una richiesta dopo l'altra, e la pagina le metteva tutte in una tabella. Sul piano Pro i feedback sono illimitati: con 10.000 feedback sono 10 richieste in sequenza, un payload di qualche MB e 10.000 righe nel DOM. La pagina diventa lenta da generare e da aprire, e peggiora a ogni feedback raccolto.
- **Correzione:** paginazione vera, 100 feedback per pagina, con link alle pagine più recenti e meno recenti. Una sola richiesta per pagina, anche con il filtro per canale.

## Priorità media

### M1. Nessun header di sicurezza: l'app si può aprire in un iframe (sicurezza)

- **Dove:** `next.config.ts` (nessun `headers()`), nessun `vercel.json`.
- **Scenario:** mancano `frame-ancestors`/`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e una CSP. Un sito esterno carica `/collect` in un iframe trasparente e fa cliccare al PM "genera un nuovo link" (i QR già stampati smettono di funzionare), spegne il modulo o avvia un'analisi che consuma la quota del mese.
- **Correzione:** `headers()` in `next.config.ts` con `Content-Security-Policy: frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. Una CSP completa dopo, provandola con PostHog e Stripe.

### M2. La pulizia dei tentativi del modulo pubblico scorre tutta la tabella a ogni invio (performance)

- **Dove:** `supabase/migrations/20260924231853_collect_feedback.sql:50`, indici alle righe 15-16.
- **Problema:** a ogni invio dal modulo pubblico la funzione cancella i tentativi più vecchi di un'ora da `private.form_attempts`. Non c'è un indice che inizi da `created_at`, quindi la cancellazione legge la tabella intera, condivisa da tutti i workspace, dentro il percorso critico della sala piena. Oggi la tabella è quasi vuota; il costo cresce con il traffico di tutto il sistema.
- **Correzione:** un indice su `created_at`, oppure spostare la pulizia in un job periodico (`pg_cron`).

### M3. Le scritture sullo stesso workspace passano una alla volta (performance, limite noto)

- **Dove:** `supabase/migrations/20260925090000_form_limit_for_full_rooms.sql:23-25`, trigger in `20260924225437_create_core_schema.sql:218`, `import_feedback` in `20260924231853_collect_feedback.sql:128`.
- **Problema:** ogni invio del modulo, inserimento manuale e import CSV blocca la riga del workspace per garantire il limite Free anche con invii simultanei. Con 230 persone nello stesso minuto gli invii sono in fila: a qualche decina di millisecondi l'uno restano sotto il minuto, ma è il punto più stretto del sistema. Un import CSV di 2.000 righe tiene in attesa il modulo pubblico dello stesso workspace finché non finisce.
- **Correzione:** nessuna per ora: il lock è ciò che rende affidabile il limite Free. Da misurare con un test di carico prima di eventi più grandi.

## Priorità bassa

### B1. Il limite per IP si supera in parallelo su moduli diversi (sicurezza)

- **Dove:** `supabase/migrations/20260925090000_form_limit_for_full_rooms.sql:23-38`.
- **Scenario:** il lock è sulla riga del workspace, non sull'IP. Invii simultanei dallo stesso IP verso moduli diversi leggono tutti un conteggio sotto 300 e passano. Servono però più link pubblici, che non si indovinano.
- **Correzione:** `pg_advisory_xact_lock` sull'hash dell'IP prima del conteggio.

### B2. L'IP del visitatore viene dagli header della richiesta (sicurezza)

- **Dove:** `src/app/actions.ts:61-62`.
- **Scenario:** su Vercel gli header li imposta Vercel. Fuori da Vercel, o dietro un altro proxy, un `x-real-ip` casuale a ogni invio salta il limite per IP. Senza header tutti i visitatori finiscono nello stesso conteggio `unknown`. Già annotato in `docs/prima-dei-clienti-reali.md`.
- **Correzione:** `ipAddress()` di `@vercel/functions`, oppure rifiutare l'invio quando l'IP manca.

### B3. L'indirizzo dell'app si costruisce dagli header (sicurezza)

- **Dove:** `src/lib/origin.ts:8-9`, `src/app/(auth)/actions.ts:59-63`.
- **Scenario:** da lì vengono i link di ritorno di Stripe, il QR del modulo e il redirect di Google. Oggi l'effetto resta nella sessione di chi manda la richiesta; dietro un proxy che inoltra un `Host` scelto dal visitatore il QR punterebbe a un dominio esterno.
- **Correzione:** leggere l'indirizzo da una variabile fissa (`APP_URL`) e tenere l'allowlist dei redirect di Supabase sul solo dominio di produzione.

### B4. L'import CSV legge il file prima di controllare l'accesso (sicurezza)

- **Dove:** `src/app/(app)/collect/actions.ts:110-114`.
- **Scenario:** chi trova l'identificativo della server action nel bundle può chiamarla senza login: il server legge fino a 2 MB e analizza il CSV prima di rifiutare. Spreco di CPU e memoria senza autenticazione, nessun dato esposto.
- **Correzione:** chiamare `getCurrentWorkspace()` prima di leggere il file.

### B5. Il tetto di costo AI arriva al doppio della quota (sicurezza dei costi)

- **Dove:** `supabase/migrations/20260925120000_ai_analysis.sql:81-90`.
- **Scenario:** le analisi fallite non consumano quota e si provocano facilmente (feedback senza temi comuni). Il tetto effettivo è il doppio: 200 esecuzioni al mese su Pro, fino a circa 130 $ nel caso peggiore (500 feedback da 2.000 caratteri) su un piano da 19 €.
- **Correzione:** decisione di prodotto: contare le fallite oltre una soglia, o limitare i caratteri totali per analisi.

### B6. Più account Free moltiplicano le analisi gratuite (sicurezza dei costi)

- **Dove:** `private.handle_new_user` in `20260924225437_create_core_schema.sql:245-274`.
- **Scenario:** ogni registrazione porta 3 analisi al mese. La conferma dell'email frena solo in parte chi crea account in serie.
- **Correzione:** da decidere prima dei clienti reali (captcha alla registrazione o tetto di spesa globale). Aggiunto a `docs/prima-dei-clienti-reali.md`.

### B7. Il trigger del limite Free gira per ogni riga dell'import CSV (performance)

- **Dove:** `supabase/migrations/20260924225437_create_core_schema.sql:212-228`.
- **Problema:** 2.000 chiamate di funzione per un import da 2.000 righe. Su Pro il controllo si ferma subito, su Free le righe sono al massimo 100: qualche secondo in più su un'operazione rara. Nessuna correzione necessaria ai volumi del brief.

## Controllato e in ordine

- **RLS e privilegi** (verificati sul database locale): RLS attiva su tutte le 10 tabelle; le viste usano `security_invoker`; nessun privilegio per `anon`; `authenticated` può scrivere solo nome, stato e domanda del modulo del workspace, priorità e stato dei temi, e 6 colonne di `feedback`. Nessuno può cambiarsi piano, quota o ruolo. Tutte le funzioni `security definer` hanno `search_path` vuoto; quelle del modulo pubblico e dell'analisi sono eseguibili solo dal server.
- **Limiti:** il limite Free vale su ogni strada (manuale, CSV, modulo) sotto lock; la quota delle analisi è controllata e riservata nel database prima di chiamare il modello.
- **Stripe:** firma del webhook verificata, stato riletto da Stripe, eventi vecchi scartati, Pro solo con il prezzo Pro.
- **Autenticazione:** nessun redirect aperto nei callback; messaggi di errore fissi; il proxy usa `getClaims`.
- **Prompt injection:** feedback come JSON con `<` codificato, separati dalle istruzioni; citazioni ricontrollate sul testo salvato; 3 casi di iniezione nelle evals.
- **Testo dei feedback:** mai renderizzato come HTML, mai inviato a PostHog, mai nei log.
- **Segreti:** nel bundle client solo URL e chiave pubblica di Supabase; client admin e Stripe `server-only`; nessun file `.env` tracciato.
- **Query:** indici sulle foreign key presenti; le query della dashboard, dell'analisi e dei temi usano gli indici composti; policy RLS con `(select ...)` valutate una volta per query; nessun N+1; import CSV in un solo insert; `getCurrentWorkspace` e `getUsage` in `cache()`; PostHog inviato dopo la risposta con `after()`.
- **Bundle:** `qrcode` e `papaparse` restano sul server; il modulo pubblico è un componente client leggero.
