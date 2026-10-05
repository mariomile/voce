# Registrazioni sospese

## Cosa è stato fatto

- `src/lib/auth.ts` legge le impostazioni pubbliche di Supabase Auth una volta per funzione: `isGoogleEnabled` (come prima) e il nuovo `areSignupsOpen`, che segue `disable_signup`.
- `/signup` con le registrazioni spente mostra "Le registrazioni sono chiuse", nessun modulo, e il link per accedere. Con le registrazioni aperte non cambia nulla.

## Perché

Al 2026-10-05 in produzione ci sono 8 account, tutti nostri, e l'SMTP integrato di Supabase non manda la conferma a chi non è del team. Mario ha deciso di non aggiungere un SMTP esterno e di sospendere le registrazioni.

## Decisioni

- **Un solo interruttore, quello di Supabase.** È l'unico che blocca davvero, anche chi chiama l'API di Auth direttamente con la chiave pubblica. La pagina lo legge invece di avere un suo flag, così riaprire non richiede un deploy.
- **Se Supabase non risponde, la pagina mostra il modulo:** `signUp` gestisce già `signup_disabled` con lo stesso messaggio.
- **La landing non cambia:** i bottoni portano a `/signup`, che spiega.

## Cosa resta

- Spegnere "Allow new users to sign up" in Supabase Auth del progetto di produzione (account di Mario).
