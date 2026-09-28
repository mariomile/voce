# Conferma email che porta nell'app, e moduli di accesso curati

Piano: `docs/plans/2026-09-28-accesso-e-conferma-email.md`.

## Fatto

- **La conferma email porta dentro l'app.** `signUp` passa `emailRedirectTo: <origine>/auth/callback?flow=signup`. Il link del template di default di Supabase (quello che parte in produzione con l'SMTP integrato) passa dal verify di Supabase e torna alla callback con un `code`, scambiato per la sessione: si arriva su `/themes` già connessi.
- **Link aperto in un altro browser**: lo scambio non trova il code verifier (cookie del browser della registrazione), ma l'email è già confermata. La callback manda a `/login?confirmed=1`: "Email confermata. Accedi per entrare nel tuo workspace." `signed_up` parte allora al primo accesso con password.
- **Link già usato o scaduto**: `/login?error=link`, come prima.
- `/auth/confirm` (template personalizzato con `token_hash`) resta com'era: lo usa il Supabase locale e lo userà la produzione con un SMTP vero.
- **Moduli**: `PasswordInput` con pulsante mostra/nascondi (vero `<button type="button">`, `aria-label` "Mostra password"/"Nascondi password", `aria-pressed`, `aria-controls`; col mouse il cursore resta nel campo) e avviso "Bloc Maiusc è attivo." in una regione `aria-live`. Email con `type="email"`, `autocomplete="email"`, `inputmode="email"`, senza maiuscola automatica né correttore. Password con `current-password` o `new-password`, `maxlength` 72 come il server. Regola "Almeno 8 caratteri." scritta prima dell'invio e collegata al campo. Errori di un campo sotto il campo, con `aria-invalid`, `aria-describedby` e il focus; errori generali sopra il pulsante con `role="alert"`. Pulsante disabilitato durante l'invio.
- `email_address_invalid` di Supabase (indirizzo senza server di posta) ora dice "Controlla l'indirizzo email." sul campo email, invece dell'errore generico.
- **Produzione**: `password_min_length` da 6 a 8, come `config.toml` e il controllo del server. La lista dei redirect aveva già `https://voce-feedback.vercel.app/**`: nessuna modifica permanente.

## Verifica in produzione

L'SMTP integrato rifiuta l'indirizzo di prova (`email_address_invalid`) e ha un limite di 2 email all'ora, quindi una registrazione vera non può mandare l'email. Il link che genera `generate_link` dell'Admin API invece è del flusso implicito (token nel fragment `#access_token`), non quello che ricevono gli utenti: la callback non lo vedrebbe. Ho ricostruito il link PKCE vero:

1. `generate_link` tipo `signup` per `authcheck-1@voce-demo.it` (utente e workspace creati dal trigger, nessuna email).
2. Token con il prefisso `pkce_` e una riga in `auth.flow_state` con il code challenge, come fa `/signup` con PKCE; nel browser i cookie del code verifier scritti da `@supabase/ssr`.
3. Aperto in Playwright `https://gnmwatxyhigexujgfmem.supabase.co/auth/v1/verify?token=pkce_…&type=signup&redirect_to=http://localhost:3005/auth/callback?flow=signup`, con l'app di questo branch in locale sulla 3005 puntata al Supabase di produzione (`http://localhost:3005/**` aggiunto alla lista dei redirect per la prova e poi tolto).

Esito: `303` verify → `/auth/callback?code=…&flow=signup` → `307` → `/themes`, titolo "Qui leggerai cosa dicono i tuoi clienti, raggruppato per tema.". `signed_up` una volta in `analytics_milestones`. Riaperto lo stesso link: `/login?error=link`. Nei log di Auth la registrazione vera dall'app manda `referer: http://localhost:3005/auth/callback?flow=signup`. Utente e workspace di prova cancellati.

## Resta

- **Nessun flusso "Password dimenticata?"**: non esiste, quindi nessun link. Va costruito a parte (pagina di richiesta, template di recupero, pagina per la nuova password).
- **SMTP vero** in produzione: vedi `docs/prima-dei-clienti-reali.md`.
- `@supabase/auth-js` 2.117 salva il code verifier sia per flusso sia sulla chiave fissa ("deprecation-window dual write"). La callback legge la chiave fissa. Quando la chiave fissa sparirà, serve `appendPkceFlowIdToRedirects` e passare `sb_flow_id` a `exchangeCodeForSession`.
