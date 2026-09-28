# Research, S8: le evals del verdetto (codice)

Ottavo passo della Research, parte di codice (piano: `docs/plans/2026-09-28-research.md`, slice S8 di `.builderos/initiatives/research/05-build-plan.md`). Criterio: 60, **solo il codice**. Il run col modello vero non è stato fatto: in questo worktree non c'è `ANTHROPIC_API_KEY` (P1 del piano) e non va cercata altrove. Dentro c'è anche il codice di S0 (evals di Chiedi e salvataggio dei risultati per le tre evals), senza il suo run.

## Cosa è stato fatto

- **`evals/verdicts.ts`**: carica `evals/verdicts.json` e `evals/dataset.json`, costruisce la chiamata di ogni caso (sottoinsieme `feedback`, `extra_feedback` in fondo, `locale`), chiama `runVerdict` (lo stesso codice dell'app) al massimo 4 casi alla volta, e giudica in modo deterministico: G1 sull'uscita grezza, G2-G5 e i controlli per caso (`verdict`, `for_allowed`, `against_allowed`, `min_for_quotes`, `min_against_quotes`, `max_quotes`, `forbidden`, `forbidden_links`) sull'uscita dopo `checkVerdicts`. Un errore del modello fa fallire il caso (nel file solo il nome dell'errore) e il run va avanti. Il run passa con almeno l'85% dei casi, tutti i must-pass (v06, v07, v09, v11, v12, v13, v14, v15) e G1 a 0.
- **`evals/verdicts.eval.ts`**: il run vero con `pnpm evals`, timeout di 20 minuti, stampa caso per caso, il ragionamento di v17 da valutare a mano (rubric di Mario, non bloccante) e le asserzioni su G1, must-pass e soglia.
- **`evals/questions.ts` e `evals/questions.eval.ts`** (S0): lo stesso per Chiedi su `evals/questions.json`: G1-G4, esito `answered` (almeno una citazione verificata, tutte da `relevant`), `no_evidence` (nessuna), `forbidden`; G5 (frasi della risposta) solo riportato; must-pass q11-q16 e q20; q17 stampato per Mario.
- **`evals/shared.ts`**: dataset, commit, `saveResult` e `latestResult`. Ogni run si salva in `evals/results/{eval}-{data}.json` con modello e commit, e si confronta col run precedente **della stessa eval** (prima `analysis.eval.ts` salvava `{data}.json` e avrebbe confrontato con qualunque file). `analysis.eval.ts` usa questi aiuti e scrive anche il commit.

## Visti fallire prima del codice

- `evals/verdicts.test.ts` e `evals/questions.test.ts` senza modulo. Poi rossi su un oracolo che citava meno feedback di `min_for_quotes`, su v16 (lista `against_allowed` assente) e su v09 e v12 che hanno la stessa ipotesi: correzioni al test, non al giudice.

## Come l'ho verificato senza modello vero

Con `pnpm exec vitest run evals/` (dentro `pnpm test`): un modello finto che risponde come vuole ogni caso passa 20 su 20; una citazione inventata in v11 dà G1 a 1, v11 nei must-pass falliti e run non superato; 4 verdetti sbagliati fuori dai must-pass danno 16 su 20 (80%) e run non superato; parole vietate, collegamenti vietati, conteggi nel ragionamento, frasi tra virgolette inventate e un'ipotesi senza verdetto fanno fallire i loro casi; il file dei risultati si scrive con modello e commit e si confronta col precedente. Lo stesso per Chiedi. `vitest list --config evals/vitest.config.mts` trova le tre evals.

## Cosa resta

- **Run delle evals in attesa della chiave**: `pnpm evals` con `ANTHROPIC_API_KEY` in `.env.local`. Sono 20 chiamate del verdetto, 20 di Chiedi, 1 di analisi. Per AC 61 il primo run di analisi e Chiedi andrebbe fatto sul codice di `edac3cf` (prima del cambio del perimetro), come dice S0.
- Se i must-pass del verdetto falliscono, si ritoccano solo le istruzioni di `src/lib/verdict.ts` e si rilancia tutto il set.
