# user-2026-09-27-release-dispatch

**Class:** doc
**Captured:** 2026-09-27 · **By:** Claude Code (release-manager) · **Where:** prompt di dispatch della fase 6, dalla sessione principale di Mario

Contenuto rilevante del dispatch, riportato fedelmente:

- Il rilascio è il finale dal vivo della masterclass PHC26 del 1 ottobre 2026 alle 15:00, davanti a circa 230 PM: Mario fa il merge della PR e la modifica arriva in produzione sul palco.
- Mario ha delegato "fai tutto tu" e ha dato gli account: le azioni di produzione su questo progetto sono autorizzate (deploy e migrazioni remote, che AGENTS.md riserva al suo ok), nient'altro fuori dal progetto. Non fare il merge della PR. Non toccare Stripe né PostHog. Lasciare la produzione su `main` alla fine.
- Fatti di produzione verificati dal dispatch: `main` servito da https://voce-feedback-ten.vercel.app (progetto Vercel `voce-feedback`, team Demos), rilasciato con `vercel deploy --prod` da un checkout di origin/main. Supabase di produzione con le 9 migrazioni di main; `20260927120000_questions.sql` non applicata. Vercel non collegato a GitHub (serve una connessione di login GitHub da parte di Mario): un merge non fa partire il deploy. Azioni mancanti di Mario: connessione GitHub su Vercel, termini dell'integrazione Stripe, una carta sul team (AI Gateway: senza, analisi e Chiedi falliscono), chiave PostHog UE. Supabase Free: template di conferma non personalizzabile senza SMTP; registrazioni chiuse durante la sessione, account demo già confermati.
- Override in vigore: gate 1, gate 3.4, gate 5 (evals rimandate finché non c'è una carta sul team Vercel, da eseguire prima del 1 ottobre).
