# Risposte di Chiedi più brevi, per il proiettore

**Cosa è stato fatto.** Una risposta di "Chiedi ai tuoi feedback" oggi è un paragrafo di circa 7 righe: sul proiettore non si legge. Le istruzioni in `src/lib/questions.ts` passano da "At most 3 sentences" a "At most 2 short sentences, about 40 words in total, the point customers make most often first". La stessa lunghezza è nella descrizione del campo `answer` dello schema di output, e nella nota del controllo G5 in `evals/questions.json`.

**Decisioni.**
- Solo il testo della risposta cambia. Conteggio, citazioni, controllo delle citazioni e interfaccia restano come sono.
- Nessun limite di parole nel codice: la lunghezza la chiede il prompt. Tagliare la risposta lato server rischierebbe di spezzare una frase a metà sul palco.
- È la stessa modifica che Claude Code fa dal vivo sul palco: questo PR è il piano B e il riferimento.

**Verifica.**
- `src/lib/questions.test.ts`: il nuovo test fallisce prima della modifica (15 su 16), passa dopo (16 su 16).
- `pnpm typecheck`, `pnpm lint`, `pnpm build`: exit 0.
- `pnpm test`: 11 file e 94 test passati; gli altri 11 file non partono perché lo stack Supabase locale non risponde (Colima rotto). Test con database e E2E su GitHub CI.
- Modello vero (Claude Sonnet 5, account A, 351 feedback), riserva `voce-feedback-qgijgpy8f-demos-1c73.vercel.app` (`dpl_2fDXMT23uGWxECTDvyh6KJaq8ZwL`, build del branch senza dominio):
  - "Cosa chiedono i clienti sull'export?": da 89 parole in 2 frasi a 39 parole in 1 frase. 20 feedback, 5 citazioni tenute su 5, 5,9 s, 0,0578 $.
  - "Cosa dicono i clienti della sincronizzazione con la banca?": da 87 parole in 3 frasi a 32 parole in 1 frase. 52 feedback, 5 citazioni tenute su 5, 6,7 s, 0,0587 $.
  - Il dominio pubblico non si è mosso (`dpl_62h33qKfYE6AngEtDSzandicnp6D`). L'alias di team `voce-feedback-demos-1c73.vercel.app` era ancora sul vecchio `main` (`dpl_GNKqBoe92nDJc1rSFxsqVNppiru1`) già prima del deploy: riportato sulla produzione attuale con `vercel alias set`. Segreto di bypass temporaneo creato e revocato: 0 sul progetto.

**Cosa resta.** Dopo il palco, se la modifica dal vivo e questo PR coincidono, chiudere questo PR senza merge.
