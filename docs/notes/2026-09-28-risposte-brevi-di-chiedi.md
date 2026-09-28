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
- Prova sul modello vero su un deployment di riserva: risultati nel PR.

**Cosa resta.** Dopo il palco, se la modifica dal vivo e questo PR coincidono, chiudere questo PR senza merge.
