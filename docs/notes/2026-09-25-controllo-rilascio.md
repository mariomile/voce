# Skill controllo-rilascio

## Cosa è stato fatto

- Skill di progetto `.claude/skills/controllo-rilascio/`: `SKILL.md` più uno script (`scripts/controllo.sh`) che esegue otto controlli e stampa un esito per voce. La skill trasforma l'output in una tabella e in un verdetto: si può rilasciare, sì o no.
- Controlli: test del database (`supabase db reset` e test RLS), typecheck, lint, test, build, segreti (gitleaks sulla storia e sulle modifiche non committate, nessun file `.env*` tracciato), migrazioni non applicate (locale e progetto remoto collegato), variabili d'ambiente (nomi di `.env.example` contro Vercel production, e variabili usate nel codice ma assenti da `.env.example`).

## Decisioni

- **Uno script invece di comandi descritti a parole.** I controlli sono sempre gli stessi: lo script li rende ripetibili e il modello si concentra sul capire i fallimenti.
- **Non verificabile vale come bloccante.** Un controllo che non si è potuto fare non dà garanzie.
- **Solo nomi delle variabili, mai valori.** `vercel env ls` e `.env.example` si confrontano per nome.
- `supabase migration list` cambia formato di output a seconda dell'ambiente: lo script forza `-o pretty` e legge la tabella.

## Verifica

Prima esecuzione, commit 39b7ad1, da un agente separato che ha usato solo la skill: typecheck, lint, 137 test, 53 test RLS con migrazioni da zero, build e segreti tutti ok. Migrazioni e variabili non verificabili. Verdetto: NO. Durata dello script circa 36 secondi.

## Cosa resta

- `.env.example` non esiste, e `.gitignore` (`.env*`) lo ignorerebbe: serve anche un'eccezione `!.env.example`.
- Nessun progetto Supabase remoto collegato: il controllo delle migrazioni resta non verificabile finché non c'è quello di produzione.
- Su Vercel production non c'è nessuna variabile d'ambiente.
- La lettura dei nomi da `vercel env ls` è provata solo con l'elenco vuoto.
