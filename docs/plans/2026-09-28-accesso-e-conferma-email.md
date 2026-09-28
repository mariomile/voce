# Conferma email che porta nell'app, e moduli di accesso curati

## Obiettivo

1. Chi si registra con email e apre il link di conferma arriva dentro l'app (`/themes`), già connesso. Oggi in produzione arriva alla landing.
2. I moduli di accesso e registrazione seguono le buone pratiche: mostra/nascondi password, `autocomplete` giusti, regole della password prima dell'invio, errori accanto al campo, niente doppio invio, avviso Bloc Maiusc.

## Perché oggi si arriva alla landing

La produzione è sul piano Free di Supabase con l'SMTP integrato: il template personalizzato (`supabase/templates/confirmation.html`, link a `/auth/confirm?token_hash=...`) non si può applicare. Parte il template di default, che linka `{{ .ConfirmationURL }}`: `.../auth/v1/verify?token=pkce_...&type=signup&redirect_to=<emailRedirectTo>`. La registrazione non passa `emailRedirectTo`, quindi Supabase torna al `site_url`, la landing, e il `code` PKCE resta lì inutilizzato.

Verificato in locale: con `redirect_to=http://localhost:3000/auth/callback?flow=signup` il verify risponde `303` a `/auth/callback?code=...&flow=signup`; un secondo clic risponde con `error_code=otp_expired` nella query.

## Scelte

- **`signUp` passa `emailRedirectTo: <origine>/auth/callback?flow=signup`.** La callback esiste già (Google) e scambia il `code` con la sessione. Nessuna rotta nuova. Nessun parametro `next`: la destinazione resta fissa su `/themes`, niente redirect aperti.
- **Lo scambio del codice vuole il code verifier**, un cookie scritto nel browser dove ci si è registrati (limite documentato del flusso PKCE). Se il link si apre su un altro dispositivo lo scambio fallisce, ma l'email è già confermata: la callback manda a `/login?confirmed=1`, con il messaggio "Email confermata. Accedi per entrare nel tuo workspace.". Per questo serve `flow=signup`: distingue la conferma email da un accesso Google fallito.
- **`signed_up` resta una volta sola**: parte dalla callback con `method: "email"` quando `flow=signup`, `google` altrimenti. `analytics_milestones` lo tiene unico per workspace. Se il link si apre in un altro browser non c'è sessione, quindi l'evento parte al primo accesso con email e password (`signIn`), sempre una volta sola.
- **`/auth/confirm` resta** per il template personalizzato (locale, e produzione quando ci sarà un SMTP proprio). Con quel template il link funziona anche da un altro dispositivo.
- **Lunghezza minima della password: 8.** Il server la controlla già (zod) e `config.toml` dice 8; la produzione ha 6. Allineo la produzione a 8 (Management API), così la regola scritta nel modulo è quella di Supabase.
- **Errori accanto al campo**: le azioni restituiscono anche il campo (`field`) quando l'errore è di un campo; il campo prende `aria-invalid` e `aria-describedby`, e riceve il focus. Gli errori non di campo (credenziali sbagliate) restano sopra il pulsante, `role="alert"`.
- **Nessun flusso "Password dimenticata?"**: non esiste, non lo aggiungo in questo lavoro.
- I campi dei moduli passano in due componenti client (`LoginForm`, `SignupForm`), perché gli errori vivono nello stato del modulo. Le pagine restano server.

## Passi

1. **Conferma email nell'app.** `signUp` con `emailRedirectTo`; callback con `flow=signup`; messaggio `confirmed` sul login.
   - Verifica: test unitari della callback (successo email e Google, scambio fallito con e senza `flow=signup`, nessun codice) e di `signUp` (passa `emailRedirectTo`). E2E locale: link costruito come il template di default (`/auth/v1/verify?token=<token_hash>&type=signup&redirect_to=...`), nello stesso browser arriva a `/themes`, in un browser nuovo a `/login` con il messaggio.
2. **Campo password e moduli.** `PasswordInput` (mostra/nascondi, Bloc Maiusc), attributi dei campi, errori per campo, niente doppio invio.
   - Verifica: test unitari del markup del campo e dei moduli; E2E del pulsante mostra/nascondi (tipo del campo, `aria-pressed`, focus che resta nel campo, nessun invio). Screenshot 1440 e 390 di login e registrazione.
3. **Produzione.** `password_min_length` da 6 a 8. La lista dei redirect contiene già `https://voce-feedback.vercel.app/**`.
   - Verifica: rilettura della configurazione; registrazione vera contro il Supabase di produzione (app in locale sulla porta 3005 puntata alla produzione, `http://localhost:3005/**` aggiunto per il tempo della prova e poi tolto), link costruito come quello dell'email, arrivo su `/themes`, `signed_up` una volta in `analytics_milestones`, utente di prova cancellato.
4. **Nota** in `docs/notes/2026-09-28-accesso-e-conferma-email.md`.
