# Research, S6: il verdetto, dal clic al database

Sesto passo della Research (piano: `docs/plans/2026-09-28-research.md`, slice S6 di `.builderos/initiatives/research/05-build-plan.md`). Criteri, interi o in parte: 10 (resto: `finish_verdict` solo per `service_role`), 21, 32, 35, 36 (resto), 37, 38 (parte: lingua del ragionamento), 39, 40, 41, 48 (resto: riga `verdict`), 49, 63 (parte), 64 (parte), 67 (parte: ipotesi e ragionamento).

## Cosa è stato fatto

- **`src/lib/verdict.ts`** (nuovo): istruzioni per lingua (`verdictInstructions`, "Italian" o "English" per il ragionamento), ipotesi in `<hypotheses_data>` e feedback in `<feedback_data>` come JSON con `<` codificato (stesso `asData` dei temi, ora esportato), schema dell'uscita (`hypotheses: [{hypothesis, verdict, reasoning, supporting, contradicting, quotes: [{feedback, stance, text}]}]`), `runVerdict` con lo stesso modello, thinking spento, 16.000 token e 240 secondi. `checkVerdicts` con i 9 motivi della spec più `verdict_without_quotes` e `missing_hypothesis`; calcola `feedback_read` e `arrived_after` (feedback entrati in Voce, `created_at`, dopo `written_at` dell'ipotesi). La domanda della Research non entra nel prompt.
- **Migrazione**, cresciuta in place: `private.analysis_running(research)`; i trigger delle ipotesi sollevano `analysis_running` su insert, update del testo e delete durante un'analisi della loro Research (il delete no se è la Research stessa che se ne va). `finish_verdict(analysis, verdicts, run)`: solo su una riga `verdict` `running`, `research_deleted` se la Research non c'è più, salta ipotesi di altre Research o con un testo diverso da quello mandato al modello, salta i feedback eliminati (`for key share`), ricontrolla le citazioni con `strpos`, rinumera le citazioni per lato, porta a `to_review` un `confirmed` o `refuted` senza citazioni del suo lato, sostituisce verdetto e collegamenti, chiude la riga e `analysis_runs`. Restituisce citazioni e verdetti salvati. Solo `service_role`.
- **`synthesize`**: legge le ipotesi della Research; con ipotesi riserva `themes` e `verdict` insieme e fa le due chiamate in parallelo; ogni parte chiude la sua riga (`finish_analysis` o `finish_verdict`, altrimenti `fail_analysis`) e conta solo se riesce. Esiti: `{ ok: true, themes, themeCount, verdict, verdictCount, previousThemesDate }` con almeno una parte `done`; `no_themes` o `failed` quando nessuna parte riesce. `research_synthesized` una volta con `citation_count` di temi più verdetto e `hypothesis_count` = verdetti salvati in quella esecuzione; `first_analysis_completed` solo con i temi `done`. Nei log solo nome dell'errore e id dell'analisi.
- **Ipotesi**: `addHypothesis`, `updateHypothesis`, `deleteHypothesis` restituiscono `busy` su `analysis_running`; `HypothesisList` mostra H7.
- **`AnalyzeButton`**: S5 (temi non arrivati, verdetto pronto, con la data dei temi che restano o senza data alla prima analisi) e S6 accanto all'annuncio.
- **Finta API Anthropic**: al prompt con `<hypotheses_data>` conferma ogni ipotesi col primo feedback citato per intero; `FUORI_SCHEMA` in un'ipotesi fa fallire il verdetto.
- **Cataloghi**: `research.synthesis.analyze.themesFailed`, `themesFailedFirst`, `verdictFailed`, `research.hypotheses.errors.busy`, in italiano e inglese.

## Visti fallire prima del codice

- `voce-research-db.sh test`: `verdicts.test.sql` "function public.finish_verdict does not exist"; `hypotheses.test.sql` 4 rossi su `analysis_running`. Dopo la revisione: `verdicts.test.sql` rosso sul nuovo formato di ritorno, `hypotheses.test.sql` rosso sul lucchetto oltre i 10 minuti.
- vitest: `verdict.test.ts` senza modulo; 15 rossi tra `synthesize.test.ts` e `hypotheses.test.ts`; `resultMessage` e `FailureNote` non esportati.
- E2E: il verdetto con citazione rosso finché la finta API rispondeva ai verdetti con i temi.
- I test di `analytics.test.ts` sul verdetto li ho scritti dopo la action: non li ho visti rossi.

## Decisioni

- **`finish_verdict` restituisce due numeri** (citazioni e verdetti salvati), non uno come nella spec: `hypothesis_count` deve essere il numero di verdetti davvero salvati.
- **Il testo dell'ipotesi viaggia con il verdetto** e `finish_verdict` salta le ipotesi cambiate: il lucchetto nasce con la riserva, e un'ipotesi modificata tra la lettura e la riserva avrebbe preso il verdetto della frase di prima (trovato dalla revisione indipendente).
- **Il lucchetto sulle ipotesi dura al massimo 10 minuti**, come `stale` in `start_analysis`: una funzione uccisa a metà non blocca le ipotesi finché qualcuno non spende un'analisi.
- **`research_deleted` in `finish_verdict` c'è già** (parte di AC 58, slice S11): senza, un verdetto su una Research eliminata veniva chiuso `done` e contava.
- **S6 sta sotto il pulsante di analisi**, insieme all'annuncio, non nella sezione Ipotesi come nel disegno: il messaggio nasce dal risultato del pulsante. Da spostare in S7 con la lettura del verdetto. Il testo rimanda a "Solo il verdetto", che arriva in S9.
- **Le righe `hypothesis_verdicts` puntano ad `analyses`**: chi cancella analisi nei test deve cancellare prima le ipotesi (vale per le fixture, non per l'app, che non cancella analisi).

## Cosa resta

- S7 (lettura del verdetto), S8 (evals del verdetto: codice fatto, run in attesa della chiave), S9 (costo, 1 analisi rimasta, "Solo il verdetto": oggi con 1 analisi rimasta e ipotesi il clic riceve `limit`), S10 (la sala oggi fa anche il verdetto quando la Research ha ipotesi), S11.
- Evals del verdetto (AC 60): non eseguite, manca `ANTHROPIC_API_KEY`.
