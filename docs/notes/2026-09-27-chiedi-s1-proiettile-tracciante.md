# Chiedi, S1: proiettile tracciante

Primo passo di "Chiedi ai tuoi feedback" (piano: `docs/plans/2026-09-27-chiedi-ai-feedback.md`, slice S1 di `.builderos/initiatives/chiedi-ai-feedback/05-build-plan.md`). Criteri: 1, 13, 14, 18, 25, 27, 32, 38.

## Cosa è stato fatto

- **Migrazione** `supabase/migrations/20260927120000_questions.sql`: tabelle `questions` (numeri e stati, senza testo) e `question_runs` (registro con prompt e output), RLS attiva nello stesso file, nessuna policy, `revoke all` a `public`, `anon`, `authenticated`. Funzioni `start_question`, `finish_question`, `fail_question`, `question_usage` solo per `service_role`, più `private.questions_limit` (Free 10, Pro 100). Nascono complete (quota su ogni stato, `busy`, `stale` a 5 minuti, `strpos` e feedback eliminati): S3 le prova.
- **`src/lib/questions.ts`**: istruzioni fisse, domanda in `<question_data>` e feedback in `<feedback_data>` come JSON con `<` codificato, schema dell'output (`answer`, `feedback`, `quotes`, nessun conteggio), `runQuestion` con `analysisModel()`, 1.500 token e 60 secondi, `checkAnswer` con conteggio dei feedback distinti ed esistenti e citazioni esatte. Gli altri motivi di scarto arrivano in S4, con i loro test.
- **Action `ask`** (`src/app/(app)/ask/actions.ts`): legge i feedback come l'analisi, riserva la domanda, chiama il modello, chiude nel database, chiede l'evento, restituisce la risposta. Guardie (`invalid`, `session`, `no_feedback`) e fallimenti arrivano in S4, con i loro test.
- **`trackEvent`** in `src/lib/analytics.ts`: stesso corpo di `trackMilestone`, costruito in una sola funzione, senza `analytics_milestones`.
- **`getQuestionWindow`** in `src/lib/data.ts`: feedback totali e degli ultimi 90 giorni, per il pulsante e (in S7) gli stati vuoti.
- **Pagina `/ask`** essenziale con `AskForm` e `AskAnswer`, scheda "Chiedi" tra Temi e Feedback, `/ask` in `APP_PATHS` del proxy.
- **E2E** `e2e/ask.spec.ts` (AC 32, 38) e finto gateway esteso alle domande. `confirmationLink` spostato in `e2e/helpers.ts`, insieme a un aiuto per creare utenti con la chiave segreta.
- Tipi del database rigenerati.

## Visti fallire prima del codice

```
 FAIL  src/lib/questions.test.ts
Error: Cannot find module './questions' imported from .../src/lib/questions.test.ts
 FAIL  src/app/(app)/ask/actions.test.ts
Error: Cannot find module '/src/app/(app)/ask/actions' imported from .../src/app/(app)/ask/actions.test.ts
 FAIL  src/test/docs.test.ts > the questions migration > enables RLS on questions and question_runs in the same file that creates them
AssertionError: expected [] to have a length of 1 but got +0
 FAIL  src/lib/analytics.test.ts > trackEvent > sends question_answered with only citation_count and outcome
TypeError: trackEvent is not a function
 Test Files  4 failed (4)
      Tests  2 failed | 5 passed (7)

supabase test db
psql:.../supabase/tests/questions.test.sql:9: ERROR:  relation "public.questions" does not exist
Failed 2/2 subtests
Result: FAIL

 FAIL  src/lib/data.test.ts > getQuestionWindow > counts all the feedback and those of the last 90 days, today included
TypeError: getQuestionWindow is not a function
```

## Verifica

```
supabase db reset   ... Applying migration 20260927120000_questions.sql... Finished supabase db reset on branch main.
supabase test db    Files=2, Tests=4 ... Result: PASS
pnpm typecheck      ✓ Types generated successfully (exit 0)
pnpm lint           (nessun problema)
pnpm test           Test Files  16 passed (16)   Tests  217 passed (217)
pnpm build          ƒ /ask ... compilata senza errori
```

E2E scritto ma **non eseguito**: la porta 3000 è occupata dal dev server di un altro worktree (`voce-prova-live`, PID 27760), che non è di questa sessione. `lsof -i :3000` al momento del commit: `node 27760 ... TCP *:hbci (LISTEN)`.

## Decisioni

- `finish_question` restituisce le citazioni tenute e l'esito si deduce da quante sono: una sola fonte di verità, il database.
- Gli `issues` hanno `part` (`feedback` o `quote`): lo stesso numero sconosciuto può stare nella lista o in una citazione, e il guardrail di produzione conta solo quelle delle citazioni.
- La action restituisce anche `feedbackInWindow` (conteggio esatto dei feedback nei 90 giorni), per il perimetro parziale oltre 500 senza un'altra lettura.

## Cosa resta

S3 (pgTAP), S4 (guardie e fallimenti), S6, S5, S7, S8, poi S2 (evals) e S9.
