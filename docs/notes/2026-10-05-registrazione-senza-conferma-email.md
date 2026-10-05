# Registrazione senza conferma email

## Cosa è stato fatto

- `signUp` ora gestisce la conferma dell'email spenta in Supabase Auth: Supabase restituisce una sessione, l'account parte subito, parte `signed_up` (`method: email`) e si arriva su `/research`. Con la conferma accesa (locale) resta tutto com'era: schermata "controlla l'email".
- Con la conferma spenta Supabase rifiuta un'email già registrata con `user_already_exists`: il modulo lo dice sul campo email e invita ad accedere.

## Perché

Al 2026-10-05 in produzione c'erano 8 account, tutti nostri: nessuno dei 230 partecipanti alla masterclass del 1 ottobre si è registrato. L'SMTP integrato di Supabase manda le email di conferma solo ai membri del team, 2 all'ora. Mario non vuole un SMTP esterno: si spegne la conferma.

## Cosa resta

- Spegnere "Confirm email" in Supabase Auth del progetto di produzione (dashboard, account di Mario). Va fatto dopo il deploy di questo codice: prima, l'app mostrerebbe "controlla l'email" a un utente già dentro.
- Il reset della password passa ancora dall'SMTP integrato: non arriva a chi non è del team.
