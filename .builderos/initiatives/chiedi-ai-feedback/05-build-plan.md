# Build: Chiedi ai tuoi feedback (forma minima)

**Phase:** 5 · **Cycle:** 1 · **Mode:** lite · **Date:** 2026-09-27 · **Owner:** Mario Miletta (piano scritto dal modello, delivery-planner)
**Branch:** `feat/ask-your-feedback` @ `6a02ab8`, worktree `voce-chiedi` `[code:git rev-parse --short HEAD]`
**Scadenza:** costruita e verificata entro il 2026-09-30, demo PHC26 il 2026-10-01 `[doc:user-2026-09-27-spec-dispatch]`
**Fonte:** `04-spec.md` (40 criteri, 14 voci in scope, 18 fuori scope) e `DESIGN.md` di questa iniziativa. Il piano del repository è `docs/plans/2026-09-27-chiedi-ai-feedback.md` e rimanda qui.

Stato di questo file: **piano**. Le sezioni "Test output", "Instrumentation", "Eval results" e "Scope check" si riempiono durante il ciclo, slice per slice. Nessuna riga "pass" è scritta prima di un output incollato.

## Test baseline

Registrata il 2026-09-27 alle 00:55 CEST, prima di qualsiasi modifica al codice, su `6a02ab8` con albero pulito (`git status`: "nothing to commit, working tree clean"). Stack Supabase locale acceso (db, auth, rest, kong, storage, realtime, inbucket, pg_meta "Up 10 hours"), migrazioni locali e applicate allineate (9 su 9, da `20260924225437` a `20260926120000`) `[code:supabase migration list --local]`. Preparazione: `pnpm install --frozen-lockfile` (il worktree non aveva `node_modules`), `.env.local` creato da `supabase status -o env` con le tre chiavi del README, senza stamparle.

```
$ pnpm typecheck
> voce@0.1.0 typecheck /Users/mariomiletta/Dev Projects/voce-chiedi
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully
pnpm typecheck  4.90s user 0.31s system 130% cpu 4.005 total
typecheck exit=0
```

```
$ pnpm lint
> voce@0.1.0 lint /Users/mariomiletta/Dev Projects/voce-chiedi
> eslint

pnpm lint  4.06s user 0.55s system 162% cpu 2.832 total
lint exit=0
```

```
$ pnpm test
> voce@0.1.0 test /Users/mariomiletta/Dev Projects/voce-chiedi
> vitest run

 RUN  v5.0.1 /Users/mariomiletta/Dev Projects/voce-chiedi

 Test Files  13 passed (13)
      Tests  202 passed (202)
   Start at  00:55:16
   Duration  3.19s (tests 84%, import 8%, transform 8%)

pnpm test  4.26s user 0.65s system 122% cpu 4.000 total
test exit=0
```

Test per file (vitest `--reporter=verbose`, conteggio dei test passati):

```
  10 src/app/(app)/billing/actions.test.ts
  17 src/app/(app)/collect/actions.test.ts
   6 src/app/(app)/feedback/actions.test.ts
  15 src/app/(app)/themes/actions.test.ts
   4 src/app/(auth)/actions.test.ts
  14 src/app/actions.test.ts
  16 src/app/api/stripe/webhook/route.test.ts
  11 src/lib/analysis.test.ts
   5 src/lib/analytics.test.ts
  31 src/lib/csv-import.test.ts
  17 src/lib/data.test.ts
   2 src/lib/stripe.test.ts
  54 src/test/rls.test.ts
```

```
$ supabase test db
Connecting to local database...
psql:.../supabase/tests/feedback_delete_policy.test.sql:5: NOTICE:  extension "pgtap" already exists, skipping
.../supabase/tests/feedback_delete_policy.test.sql .. ok
All tests successful.
Files=1, Tests=2,  0 wallclock secs ( 0.01 usr  0.01 sys +  0.04 cusr  0.00 csys =  0.06 CPU)
Result: PASS
supabase test db  0.31s user 0.10s system 40% cpu 0.991 total
exit=0
```

```
$ pnpm test:e2e
Error: http://localhost:3000/login is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.
 ELIFECYCLE  Command failed with exit code 1.
exit=1
```

**Riassunto della baseline:** typecheck 0 errori, lint 0 problemi, `pnpm test` 202 su 202 in 13 file (3,19 s), pgTAP 2 su 2 in 1 file. **Nessun fallimento preesistente.** E2E non eseguito: la porta 3000 è occupata dal dev server di un altro worktree (`/Users/mariomiletta/Dev Projects/voce-prova-live`, PID 27760), che non ho fermato perché non è di questa sessione. Playwright vuole la 3000 libera perché il link di conferma punta al `site_url` di `supabase/config.toml` `[code:playwright.config.ts]`. La baseline E2E va presa all'inizio di S1, a porta libera, prima di toccare `e2e/`.

## Prerequisiti e rischi d'ambiente

| # | Cosa | Perché conta | Chi o come |
|---|------|--------------|------------|
| P1 | Credenziale del Vercel AI Gateway in `.env.local` di questo worktree | `pnpm evals` chiama il modello vero (AC 23, 24, 40). Oggi `.env.local` qui ha solo le chiavi Supabase; nel checkout principale c'è un `VERCEL_OIDC_TOKEN` scritto il 2026-09-25 00:57, scaduto (dura 12 ore) `[code:README.md]` | `vercel env pull` dal checkout principale collegato (`voce/.vercel/project.json`) **verso un file a parte**, poi copiare la sola riga del token: `vercel env pull` sovrascrive `.env.local`. In alternativa `AI_GATEWAY_API_KEY`. Il Gateway risponde solo con carta registrata sul team Vercel `[code:README.md]`. Va verificato subito dopo S1: è il rischio che può far saltare la scadenza |
| P2 | Porta 3000 libera per `pnpm test:e2e` | Serve a S1, S4, S6, S7, S8 e AC 38, 40 | Fermare il dev server di `voce-prova-live` quando quella sessione non lo usa più; decisione di Mario o di quella sessione |
| P3 | Stack Supabase condiviso | I container si chiamano `supabase_*_voce` e servono tutti i worktree: un `supabase db reset` lanciato da un'altra sessione cancella i dati a metà dei test di questa | Eseguire `supabase db reset` e le suite solo quando nessun altro worktree sta testando |
| P4 | Nessun risultato precedente in `evals/results/` | La cartella non esiste né qui né nel checkout principale: il primo run di `questions.eval.ts` non ha con cosa confrontarsi (AC 23 chiede il confronto) | Il primo run è la base; il confronto vale dal secondo run in poi, e lo si scrive nel risultato |

## Slices

Ogni slice va da capo a piedi: pagina o action, logica, database, evento dove esiste. Ogni slice finisce con un commit verificato e una nota in `docs/notes/`, come chiede `AGENTS.md` `[code:AGENTS.md]`. Per ogni slice il ciclo è: test dal criterio, visto fallire, codice minimo, refactor in verde, strumentazione, revisione su standard e spec.

| # | Slice | Acceptance criteria | Blocks on | Dimensione | Status |
|---|-------|---------------------|-----------|------------|--------|
| S1 | **Proiettile tracciante.** Un PM loggato apre la scheda "Chiedi", scrive una domanda, preme Invio e legge numero, testo e citazioni verificate; la seconda domanda sostituisce la prima. Dentro: migrazione `questions` e `question_runs` con RLS e le 4 funzioni complete, `src/lib/questions.ts` (prompt, schema, controlli, `runQuestion`), action `ask` sul percorso felice, pagina `/ask` con `AskForm` e `AskAnswer` essenziali, scheda e voce del proxy, `trackEvent` per `question_answered`, finto gateway esteso alle domande, scenario E2E da tastiera | 1, 13, 14, 18, 25, 27, 32, 38 | nessuno (P2 per l'E2E) | media: 1 migrazione, ~6 file nuovi, 4 toccati, 1 E2E | done, E2E non eseguito |
| S2 | **Evals delle domande.** `evals/questions.eval.ts` su `evals/questions.json` con G1 a G5, soglia 85%, must-pass, risultato in `evals/results/`; primo run col modello vero e ritocchi alle istruzioni finché non passa | 23, 24 | S1; P1 | piccola nel codice, rischio alto sul modello | rimandata per decisione di Mario (2026-09-27) |
| S3 | **Regole del database.** File pgTAP `supabase/tests/questions.test.sql`: niente letture né scritture per `authenticated` e `anon`, funzioni solo per `service_role`, quota Free 10 e Pro 100 su ogni stato, quota separata dalle analisi, `busy` e `stale` a 5 minuti, `finish_question` con `strpos` e feedback eliminati | 2, 3, 4, 5, 7, 8, 17 | S1 | media: 1 file pgTAP, eventuali correzioni alla migrazione | done |
| S4 | **Guardie e fallimenti, dal server alla pagina.** Motivi `invalid`, `session`, `no_feedback`, `limit`, `busy`, `failed` (errore, 60 s, output fuori schema) con 0 chiamate al modello dove previsto; controlli dell'output per ogni motivo di scarto; finestra 90 giorni e 500 feedback; niente testo nei log; `question_usage` e `getUsage` con `questionsThisMonth`; messaggi E1-E9 nella pagina con domanda e focus nella casella | 6, 7, 9, 10, 11, 12, 15, 16, 22, 26, 37 | S1 | media: test unitari su action e logica, 1 blocco E2E per i messaggi | done, E2E non eseguito |
| S5 | **Evento ripetibile e riservatezza.** `trackEvent` con corpo costruito in un solo punto insieme a `trackMilestone`; nessun testo nel corpo; due risposte, due eventi, nessuna riga in `analytics_milestones`; nessun evento per `failed`, `limit`, `busy`, `invalid`, `session`, `no_feedback` o senza chiave; `docs/analytics.md` aggiornato | 28, 29, 30, 31 | S1 | piccola: 1 file toccato, test in `analytics.test.ts`, 1 documento | done |
| S6 | **Quota a vista.** Nota "Userai 1 delle…" e "Ti restano…", avviso E3 o E4 all'apertura e dopo la decima (o centesima) risposta con la risposta ancora visibile, `questionsPerMonth` in `PLAN_LIMITS`, righe dei piani in `/billing` e landing, riga in `docs/prima-dei-clienti-reali.md` | 34, 35, 39 | S3, S4 | piccola: 3 pagine toccate, 1 blocco E2E | done, E2E non eseguito |
| S7 | **Nessun feedback su cui rispondere.** Stato vuoto testo A (0 feedback) e testo B (solo feedback oltre 90 giorni) con "Aggiungi feedback" verso `/collect`, senza casella | 33 | S1 | piccola: 1 pagina, 1 blocco E2E | done, E2E non eseguito |
| S8 | **Attesa, testo sicuro e kit.** "Risposta in arrivo…", casella `readOnly` col focus, messaggio dei 15 secondi, un solo invio per due pressioni; `no_evidence` senza numero né testo; singolare "feedback ne parla"; risposta come testo semplice; variante `ask` di `Textarea` e `<cite>` in `ink-muted` in tutta l'app, con `DESIGN.md` della radice e `design/kit.*` aggiornati | 19, 20, 21, 36 | S1 | media: 2 componenti del kit, 2 componenti di Chiedi, test di render, 1 blocco E2E | todo |
| S9 | **Chiusura.** Tutti i comandi di AC 40 da zero con output incollato, controllo del diff contro i 18 fuori scope, strumentazione verificata, revisione indipendente (`build-reviewer`), nota finale, `TECH.md` e roadmap | 40 | S2, S3, S4, S5, S6, S7, S8 | piccola nel codice, verifica completa | todo |

**Perché S1 è la prima.** È la più rischiosa tra quelle piccole: mette insieme per la prima volta la migrazione nuova, il prompt nuovo, la action che riserva e chiude nel database, la risposta a schermo e l'evento. Se il modello di dati o il formato dell'output è sbagliato, si vede qui e non dopo tre slice. Il rischio più alto in assoluto, la qualità del modello sulle domande avversarie, arriva subito dopo con S2, che è la prima slice da fare dopo S1.

**Scelta di confine.** Le quattro funzioni SQL nascono complete in S1 (con `limit`, `busy`, `stale`, `strpos`) perché scriverle due volte vorrebbe dire due migrazioni per la stessa tabella; S3 le prova. Finché la migrazione non è su un database remoto la si corregge in place e la si riapplica con `supabase db reset`.

### Blocking edges

- S2 blocks on S1
- S2 blocks on prerequisite: credenziale del Gateway (P1)
- S3 blocks on S1
- S4 blocks on S1
- S5 blocks on S1
- S6 blocks on S3
- S6 blocks on S4
- S7 blocks on S1
- S8 blocks on S1
- S9 blocks on S2, S3, S4, S5, S6, S7, S8
- S1, S4, S6, S7, S8, S9 (parti E2E) block on prerequisite: porta 3000 libera (P2)

Nessuna slice blocca su una voce di "Not yet specified": le tre domande aperte della spec (id del workspace della demo, `POSTHOG_KEY` in produzione, eccezione UE per il testo delle domande) non toccano nessun criterio di costruzione `[code:.builderos/initiatives/chiedi-ai-feedback/04-spec.md]`.

**Critical path:** S1 → S3 → S6 → S9 (oppure S1 → S4 → S6 → S9, stessa lunghezza): **4 slice su 9**. Non è la maggior parte del lavoro: dopo S1 le slice S2, S3, S4, S5, S7, S8 sono indipendenti tra loro e possono andare in parallelo. Il ramo che decide la data non è il più lungo ma il più incerto: S1 → S2, perché dipende dal modello vero e da una credenziale che oggi manca.

**Ordine consigliato con un solo esecutore:** S1, S2, S3, S4, S6, S5, S7, S8, S9. S2 subito dopo S1 perché un prompt che non passa i must-pass è l'unica cosa che può spostare la scadenza; S5 e S7 sono piccole e riempiono l'attesa dei run delle evals.

## Acceptance criteria to tests

File di test previsti. Nuovi: `supabase/tests/questions.test.sql` (pgTAP), `src/lib/questions.test.ts`, `src/app/(app)/ask/actions.test.ts` (database locale, modello finto, come `themes/actions.test.ts`), `src/components/ask-answer.test.tsx` (render con `react-dom/server`, già tra le dipendenze), `src/test/docs.test.ts`, `evals/questions.eval.ts`, `e2e/ask.spec.ts` con un aiuto per creare utenti e righe con la chiave segreta. Estesi: `src/lib/analytics.test.ts`, `src/lib/data.test.ts`, `e2e/fake-gateway.mts`.

Nessun test di componente esiste oggi; `ask-answer.test.tsx` è il primo e usa solo `renderToStaticMarkup` in Node, senza dipendenze nuove. `tsconfig.json` ha `"jsx": "react-jsx"` `[code:tsconfig.json]`.

| # | Criterion (sintesi) | Test | Slice | Result |
|---|---------------------|------|-------|--------|
| 1 | Migrazione crea `questions` e `question_runs` con RLS nello stesso file; `supabase db reset` da zero senza errori | pgTAP `questions.test.sql`: "RLS is enabled on questions and question_runs" (`relrowsecurity`); `src/test/docs.test.ts`: "the questions migration enables RLS in the same file"; output di `supabase db reset` incollato | S1, S3 | pass (docs.test.ts, pgTAP, db reset) |
| 2 | Utente di A e `anon` ricevono permesso negato o 0 righe su `questions` e `question_runs` di B, senza filtri e per id | pgTAP `questions.test.sql`: "A cannot read B's questions or runs, unfiltered or by id", "anon cannot read questions or runs" | S3 | pass (pgTAP, mutazione M1) |
| 3 | `authenticated` e `anon`: permesso negato su insert, update, delete delle due tabelle | pgTAP `questions.test.sql`: `throws_ok` su insert, update, delete per i due ruoli e le due tabelle | S3 | pass (pgTAP) |
| 4 | Le 4 funzioni solo per `service_role` | pgTAP `questions.test.sql`: "start/finish/fail_question and question_usage are denied to authenticated and anon" | S3 | pass (pgTAP, mutazione M2) |
| 5 | Free: 10 domande del mese Europe/Rome in qualsiasi stato danno `limit`, 9 danno `ok`; Pro 100 e 99 | pgTAP `questions.test.sql`: "Free: 9 mixed questions ok, 10 limit", "Pro: 99 ok, 100 limit", con righe `running` vecchie, `done`, `failed` | S3 | pass (pgTAP, mutazioni M3, M4) |
| 6 | Con `limit` o `busy` la action restituisce il motivo e il modello finto registra 0 chiamate | `ask/actions.test.ts`: "returns limit without calling the model", "returns busy without calling the model" (`doGenerateCalls.length === 0`) | S4 | pass |
| 7 | Quote separate: 3 analisi `done` su Free non cambiano `start_question`; 10 domande non cambiano `analysesThisMonth` | pgTAP `questions.test.sql`: "3 done analyses do not reduce the question quota"; `data.test.ts`: "getUsage: questions do not count as analyses" | S3, S4 | pass (pgTAP, mutazione M4; data.test.ts) |
| 8 | `running` di meno di 5 minuti dà `busy`; di più di 5 minuti diventa `failed` con `stale`, conta nella quota, la nuova si riserva | pgTAP `questions.test.sql`: "a running question under 5 minutes is busy", "over 5 minutes it is failed as stale, counted, and the new one is reserved" | S3 | pass (pgTAP, mutazione M5) |
| 9 | Errore del modello, oltre 60.000 ms o output fuori schema: `failed` con errore in `question_runs`, `ask` restituisce `failed`, `questionsThisMonth` +1 | `ask/actions.test.ts`: "model error is failed and counted", "a model slower than 60 s is failed and counted" (timer finti), "output out of schema is failed and counted, raw text saved" | S4 | pass |
| 10 | Vuota, spazi o oltre 300 caratteri dopo il trim: `invalid`, nessuna riga, 0 chiamate; a capo come spazi | `ask/actions.test.ts`: "empty, blank and 301-character questions are invalid, no row, no call"; `questions.test.ts`: "newlines reach the model as spaces" | S4 | pass |
| 11 | 0 feedback negli ultimi 90 giorni: `no_feedback`, nessuna riga, 0 chiamate | `ask/actions.test.ts`: "needs feedback from the last 90 days, today included" | S4 | pass |
| 12 | Senza sessione: `session`, nessuna riga, 0 chiamate | `ask/actions.test.ts`: "without a session returns session, no row, no call" | S4 | pass |
| 13 | `analysisModel()`, `maxOutputTokens: 1500`, timeout 60.000 ms sulle opzioni del modello finto | `questions.test.ts`: "calls the model with the analysis model, 1500 output tokens and a 60 s timeout" (opzioni di `doGenerateCalls[0]`, `abortSignal` presente, costante a 60.000) | S1 | pass |
| 14 | Istruzioni solo in `instructions`; domanda in `<question_data>`, feedback in `<feedback_data>`, JSON con `<` codificato; `</question_data>` nella domanda compare una volta sola nel prompt | `questions.test.ts`: "the question and the feedback travel only as data", "a question closing its block cannot leave it" | S1 | pass |
| 15 | 90 giorni, massimo 500, dal più recente: con 501 il prompt ne ha 500 e non il più vecchio | `ask/actions.test.ts`: "sends at most the 500 most recent feedback of the last 90 days" | S4 | pass (comportamento da S1, passato al primo giro) |
| 16 | Controllo dell'output: scarto con motivo in `issues` per numero inesistente, feedback non in lista, testo vuoto o non esatto, seconda dello stesso feedback, oltre la quinta; un test per motivo | `questions.test.ts`: 5 test, "drops unknown_feedback", "drops quote_not_linked", "drops quote_not_in_feedback (empty and inexact)", "drops second_quote_same_feedback", "drops too_many_quotes after the fifth" | S4 | pass |
| 17 | `finish_question` ricontrolla con `strpos`: citazione assente solleva `quote_not_in_feedback` e la domanda resta `running`; citazioni di feedback eliminati tolte, e senza citazioni esito `no_evidence` | pgTAP `questions.test.sql`: "finish_question raises quote_not_in_feedback and leaves the question running", "drops quotes of deleted feedback and saves no_evidence when none is left" | S3 | pass (pgTAP, mutazioni M6, M7) |
| 18 | `feedback_count` = numeri distinti ed esistenti: `[1, 1, 2, 999]` su 3 feedback vale 2; nessun campo di conteggio nello schema | `questions.test.ts`: "counts distinct existing linked feedback", "the output schema has no count field"; `ask/actions.test.ts`: "saves feedback_count from the server count" | S1 | pass |
| 19 | `answered` con almeno una citazione dopo `finish_question`, altrimenti `no_evidence`; con `no_evidence` la action non restituisce il testo e la pagina mostra solo "Non trovo feedback che ne parlano." | `ask/actions.test.ts`: "no verified quote is no_evidence and returns no model text"; `ask-answer.test.tsx`: "no_evidence shows the sentence without number, text or quotes" | S1, S8 | planned |
| 20 | Pagina con `answered`: h2 "Risposta a «{domanda}»", numero con "feedback ne parlano" (1: "ne parla"), testo, 1-5 citazioni in ordine con canale e data e senza cliente, perimetro "Letti {n} feedback degli ultimi 90 giorni." | `ask-answer.test.tsx`: "shows heading, count, text, quotes with channel and date and the perimeter", "one feedback: feedback ne parla", "no customer name in quotes"; E2E `ask.spec.ts` (AC 38) sul caso reale | S8 | planned |
| 21 | Risposta come testo: `<b>x</b>` e `**x**` visibili come caratteri; nessun `dangerouslySetInnerHTML` nei file di `/ask` | `ask-answer.test.tsx`: "model markup is shown as text"; `src/test/docs.test.ts`: "no dangerouslySetInnerHTML in the ask files" | S8 | planned |
| 22 | Una nuova domanda sostituisce la precedente; il prompt nuovo non contiene domanda o risposta precedenti | `questions.test.ts`: "the prompt is built from the question and the feedback only"; `ask/actions.test.ts`: "a second question's prompt carries nothing from the first"; E2E AC 38 per la sostituzione a schermo | S4 | pass (comportamento da S1, passato al primo giro); E2E scritto, non eseguito |
| 23 | `pnpm evals` su `questions.json`: almeno 85% dei casi, tutti i must-pass, G1 a 0 violazioni; risultato in `evals/results/` col confronto | `evals/questions.eval.ts`: "questions on the synthetic set" | S2 | rimandato per decisione di Mario (2026-09-27) |
| 24 | q13, q14, q15, q16: nessuna stringa `forbidden` nel testo | `evals/questions.eval.ts`: controllo `forbidden` per caso, must-pass | S2 | rimandato per decisione di Mario (2026-09-27) |
| 25 | Riga in `question_runs` con modello, istruzioni, prompt, id in ordine; alla chiusura output, `issues`, token, durata, `cost_usd` da `estimateCost`, errore se fallita, `finished_at` | `ask/actions.test.ts`: "logs the run: input, output, issues, tokens, duration, cost", "a failed run logs the error and finished_at" | S1 | pass |
| 26 | Con errore del modello `console.error` riceve solo nome dell'errore e id; nessuna chiamata contiene il marcatore | `ask/actions.test.ts`: "logs only the error name and the question id" (spy su `console.error`, marcatore in domanda e feedback) | S4 | pass |
| 27 | Con `POSTHOG_KEY`, ogni domanda chiusa `answered` o `no_evidence` produce esattamente una richiesta con `question_answered`, `distinct_id` = workspace, proprietà esattamente le 4 | `analytics.test.ts`: "trackEvent sends question_answered with only citation_count and outcome"; `ask/actions.test.ts`: "asks for question_answered once, for answered and for no_evidence" | S1 | pass (richiesta catturata nei test, non arrivo in PostHog) |
| 28 | Marcatore in domanda, risposta e feedback: il corpo verso PostHog non lo contiene | `ask/actions.test.ts` con `trackEvent` reale e `fetch` finto: "the PostHog body carries no question, answer or feedback text" | S5 | pass (mutazione Ma) |
| 29 | Due risposte, due richieste; nessuna riga in `analytics_milestones`; vincolo con i 4 eventi di oggi | `analytics.test.ts`: "question_answered is sent every time and never claims a milestone", "analytics_milestones still refuses question_answered" | S5 | pass (mutazione Mb) |
| 30 | Nessuna richiesta per `failed`, `limit`, `busy`, `invalid`, `session`, `no_feedback`; nessuna senza chiave | `ask/actions.test.ts`: "no event for failed, limit, busy, invalid, session, no_feedback" (tabella di casi); `analytics.test.ts`: "trackEvent sends nothing without a key" | S5 | pass (mutazioni Mc, Md) |
| 31 | `docs/analytics.md` elenca `question_answered` con proprietà, momento d'invio, e che non passa da `analytics_milestones` | `src/test/docs.test.ts`: "analytics.md documents question_answered" | S5 | pass (docs.test.ts) |
| 32 | Scheda "Chiedi" tra "Temi" e "Feedback" verso `/ask` con `aria-current="page"`; `/ask` senza sessione porta a `/login` | E2E `ask.spec.ts`: "the Chiedi tab sits between Temi and Feedback and marks the page", "/ask without a session goes to /login" | S1 | E2E scritto, non eseguito (porta 3000 occupata) |
| 33 | 0 feedback: testo A e "Aggiungi feedback" senza casella; solo feedback oltre 90 giorni: testo B, stessa azione, senza casella | E2E `ask.spec.ts`: "no feedback: text A, no field", "only feedback older than 90 days: text B, no field" | S7 | pass (page.test.tsx); E2E scritto, non eseguito |
| 34 | Quota esaurita: pulsante `aria-disabled`, avviso "Hai usato le 10 domande di {mese}" con "Passa a Pro" su Free, "…100…" senza pulsante su Pro; lo stesso dopo la decima risposta con la risposta visibile | E2E `ask.spec.ts`: "Free at 10 questions: notice and Passa a Pro", "Pro at 100: notice without button", "the tenth answer stays visible under the notice" | S6 | E2E scritto, non eseguito (porta 3000 occupata); logica dell'avviso: pass (ask-copy.test.ts) |
| 35 | Nota "Userai 1 delle {limite} domande di {mese}." prima, "Ti restano {n} domande di {mese}." dopo, numeri dal server | E2E `ask.spec.ts`: "the quota note before and after the first question" | S6 | testi: pass (ask-copy.test.ts); pagina: E2E scritto, non eseguito |
| 36 | Attesa: "Risposta in arrivo…" `aria-disabled`, casella `readOnly` col focus, "Sto leggendo {n} feedback…", dopo 15 s il messaggio lungo; due invii ravvicinati, una sola chiamata ad `ask` | E2E `ask.spec.ts`: "waiting state and the 15-second message" (finto gateway lento su marcatore, `page.clock`), "two quick submits make one ask call" (richieste con header `next-action` contate) | S8 | planned |
| 37 | Per ogni motivo (E1, E2, E3/E4, E5, E6, E7, E8, E9) il testo esatto di DESIGN.md, domanda e focus nella casella | E2E `ask.spec.ts`: un test per motivo; E6 dal finto gateway con output fuori schema, E7 con `page.route` che interrompe la action, E8 con cookie cancellati, E5, E3 ed E9 con righe create o tolte dalla chiave segreta dopo l'apertura | S4 | testi: pass (ask-copy.test.ts); pagina: E2E scritto, non eseguito (porta 3000 occupata) |
| 38 | E2E da tastiera dalla scheda "Chiedi": registrazione, feedback, domanda con Invio, risposta con citazione e numero, focus nella casella, seconda domanda che sostituisce la prima | E2E `ask.spec.ts`: "ask a question from the keyboard and read the answer" (finto gateway esteso: risponde alle domande citando i feedback) | S1 | E2E scritto, non eseguito (porta 3000 occupata) |
| 39 | `docs/prima-dei-clienti-reali.md` ha la riga sul testo delle domande nel Gateway; `/billing` e landing mostrano "10 domande ai feedback al mese" e "100 domande ai feedback al mese" da `PLAN_LIMITS` | `src/test/docs.test.ts`: "prima-dei-clienti-reali lists the question text"; E2E `ask.spec.ts`: "billing and landing show the question quota" | S6 | pass (docs.test.ts, plan-pages.test.tsx); E2E scritto, non eseguito |
| 40 | Entro il 2026-09-30, con output: typecheck, lint, test, build, `supabase db reset`, `supabase test db`, `pnpm evals` (entrambi i file), `pnpm test:e2e` | Esecuzione finale in S9, output incollato in "Test output" | S9 | planned |

**Criteri senza test pianificato: nessuno.** Tre criteri hanno una parte che non è un'asserzione su comportamento e che ho coperto così, dichiarandolo:

- **AC 1**, "nello stesso file": un test in `docs.test.ts` legge il file della migrazione; "da zero senza errori" è l'output di `supabase db reset`, non un test.
- **AC 31** e **AC 39** (metà sui documenti): un test che legge il documento. È una verifica debole, dice che le parole ci sono, non che siano giuste; la revisione di S9 le rilegge.
- **AC 40** è un criterio di processo: il suo "test" è l'esecuzione dei comandi, con output incollato.

**Evidenza per la strumentazione.** Non c'è `analytics.query`: `POSTHOG_KEY` non è configurata. La prova di AC 27-30 sarà la richiesta costruita davvero da `trackEvent` e catturata da un `fetch` finto nei test, con corpo incollato, etichettata `[code:...]` come evidenza più debole di un arrivo in PostHog. La verifica in PostHog UE resta alla fase 6, quando Mario decide la chiave di produzione (domanda aperta della spec).

## Controllo dello scope da preparare

Fuori scope che una slice potrebbe tirare dentro "già che c'è", da controllare sul diff in S9, voce per voce:

| Voce fuori scope | Slice a rischio | Segnale nel diff |
|------------------|-----------------|------------------|
| Cronologia o link alla risposta | S1, S8 | lettura di `questions` o `question_runs` dal browser, rotte `/ask/[id]` |
| Risposta in streaming | S1, S8 | `streamText`, `useChat` |
| Pulsante "Copia" o esportazione | S8 | `navigator.clipboard` nei file di Chiedi |
| Voto sulla risposta | S5, S8 | evento o colonna nuova oltre `question_answered` |
| Nomi dei clienti nelle citazioni | S1, S8 | `customer` nella query o nel componente di Chiedi |
| Quota nella barra dell'app, ingressi da Temi | S6 | modifiche a `app-bar.tsx`, link a `/ask` fuori dalla scheda |
| Il modello che scrive il conteggio | S1 | campo numerico nello schema dell'output |
| Testo in PostHog | S5 | campi diversi da `citation_count` e `outcome` |
| Codice di Chiedi dentro analisi o temi | tutte | import di `questions.ts` in `analysis.ts` o in `themes/` (la spec chiede la rimozione in un commit) |

## Test output

Da incollare in S9, dopo l'ultima modifica.

## Instrumentation

Da riempire in S1 e S5.

| Event | Triggered by | Arrived | Properties verified | Evidence |
|-------|--------------|---------|---------------------|----------|
| `question_answered` | domanda chiusa con `answered` o `no_evidence` (action `ask`) | non verificato in PostHog: `POSTHOG_KEY` non configurata. Richiesta costruita e catturata dal `fetch` finto nei test | `event`, `distinct_id` = workspace, proprietà esattamente `citation_count`, `outcome`, `$process_person_profile: false`, `$geoip_disable: true`; nessun testo (marcatore assente) | `[code:src/app/(app)/ask/analytics.test.ts]`, evidenza più debole di un arrivo; corpo incollato in `docs/notes/2026-09-27-chiedi-s5-evento-e-riservatezza.md` |

## Eval results

Da incollare in S2 e di nuovo in S9 se istruzioni, schema o modello cambiano dopo S2.

## Scope check

Da riempire in S9 con le 18 voci di `04-spec.md`.

## Deviations from spec

- Il piano del repository si chiama `docs/plans/2026-09-27-chiedi-ai-feedback.md` e non `docs/plans/2026-09-27-chiedi.md` come scritto in `04-spec.md` (in scope, voce 14): il nome l'ha dato il dispatch di questa fase `[doc:user-2026-09-27-spec-dispatch]`. Nessun criterio dipende dal nome.

## Log

Una voce per slice, con l'output vero. Il dettaglio (fallimenti visti prima del codice) è nella nota di ogni slice in `docs/notes/`.

### S1, proiettile tracciante (2026-09-27)

Nota: `docs/notes/2026-09-27-chiedi-s1-proiettile-tracciante.md`.

Rosso prima del codice:

```
 FAIL  src/lib/questions.test.ts        Error: Cannot find module './questions'
 FAIL  src/app/(app)/ask/actions.test.ts Error: Cannot find module '/src/app/(app)/ask/actions'
 FAIL  src/test/docs.test.ts > ... enables RLS ... AssertionError: expected [] to have a length of 1 but got +0
 FAIL  src/lib/analytics.test.ts > trackEvent > ... TypeError: trackEvent is not a function
 supabase test db: ERROR:  relation "public.questions" does not exist ... Result: FAIL
 FAIL  src/lib/data.test.ts > getQuestionWindow > ... TypeError: getQuestionWindow is not a function
```

Verde dopo il codice:

```
supabase db reset   Applying migration 20260927120000_questions.sql... Finished supabase db reset on branch main.
supabase test db    Files=2, Tests=4, Result: PASS
pnpm typecheck      exit 0
pnpm lint           exit 0, nessun problema
pnpm test           Test Files  16 passed (16)   Tests  217 passed (217)   Duration  2.80s
pnpm build          ƒ /ask, build completata
pnpm test:e2e       non eseguito: porta 3000 occupata da node PID 27760 (worktree voce-prova-live)
```

### S3, regole del database (2026-09-27)

Nota: `docs/notes/2026-09-27-chiedi-s3-regole-del-database.md`. Le funzioni esistevano da S1: il rosso è per mutazione (regola rotta dentro la transazione del test).

```
M1 grant select on questions to authenticated (AC 2): 2 failing
M2 grant execute on start_question to authenticated (AC 4): 2 failing
M3 Free limit 11 instead of 10 (AC 5): 3 failing
M4 failed questions do not count (AC 5): 4 failing
M5 stale after 10 minutes instead of 5 (AC 8): 5 failing
M6 no strpos check in finish_question (AC 17): 2 failing
M7 quotes of deleted feedback kept (AC 17): 2 failing
```

```
supabase test db   Files=2, Tests=52, Result: PASS
pnpm typecheck     exit 0
pnpm lint          exit 0
pnpm test          Test Files  16 passed (16)   Tests  217 passed (217)
```

### Cambio di scope: S2 rimandata (2026-09-27)

Mario, testuale: "lascia stare le evals". S2 non si costruisce e le evals non si eseguono: niente `evals/questions.eval.ts`, `evals/questions.json` resta com'è. S2 e AC 23-24 sono **rimandati per decisione di Mario (2026-09-27)**: né fatti né falliti. Conseguenza per AC 40: `pnpm evals` non fa parte della chiusura di questo ciclo.

### S4, guardie e fallimenti (2026-09-27)

Nota: `docs/notes/2026-09-27-chiedi-s4-guardie-e-fallimenti.md`.

Rosso prima del codice:

```
     × drops quote_not_linked
     × drops second_quote_same_feedback
     × drops too_many_quotes after the fifth
     × empty, blank and 301-character questions are invalid, no row, no call
     × needs feedback from the last 90 days, today included
     × without a session returns session, no row, no call
     × model error is failed and counted
     × a model slower than 60 s is failed and counted
     × output out of schema is failed and counted, raw text saved
     × logs only the error name and the question id
     × counts the questions of the month apart from the analyses
 Test Files  3 failed (3)      Tests  11 failed | 37 passed (48)
 FAIL  src/components/ask-copy.test.ts   Error: Cannot find module './ask-copy'
```

Passati al primo giro perché il comportamento è di S1: limit e busy senza chiamata (database, mutazioni S3), 500 feedback più recenti, prompt senza la domanda precedente, `unknown_feedback`.

Verde:

```
pnpm typecheck     exit 0
pnpm lint          exit 0
pnpm test          Test Files  17 passed (17)   Tests  239 passed (239)
pnpm build         ✓ Compiled successfully
supabase test db   Files=2, Tests=52, Result: PASS
pnpm test:e2e      non eseguito: porta 3000 occupata (node 27760, voce-prova-live)
```

### S6, quota a vista (2026-09-27)

Nota: `docs/notes/2026-09-27-chiedi-s6-quota-a-vista.md`.

```
Rosso:  Tests  6 failed | 5 passed (11)   (quotaNote is not a function; PLAN_LIMITS senza questionsPerMonth;
        riga mancante in prima-dei-clienti-reali; landing e /billing senza "10 domande ai feedback al mese")
Verde:  pnpm typecheck exit 0 · pnpm lint exit 0 · pnpm test  Test Files 18 passed (18)  Tests 245 passed (245)
        pnpm build ✓ Compiled successfully · pnpm test:e2e non eseguito (porta 3000 occupata)
```

### S5, evento ripetibile e riservatezza (2026-09-27)

Nota: `docs/notes/2026-09-27-chiedi-s5-evento-e-riservatezza.md`. `trackEvent` è di S1: qui prove e documento.

```
Rosso (documento): × documents question_answered ... AssertionError: expected undefined to be defined
Mutazioni: Ma (testo nelle proprietà) 1 rosso · Mb (via analytics_milestones) 2 rossi · Mc (evento sui falliti) 1 rosso · Md (senza chiave) 1 rosso
CAPTURED {"url":"https://eu.i.posthog.com/i/v0/e/","body":{"api_key":"phc_test","event":"question_answered","distinct_id":"1bb6cd5d-cd98-43a6-8786-fe7895fe034d","timestamp":"2026-09-26T23:17:22.756Z","properties":{"citation_count":1,"outcome":"answered","$process_person_profile":false,"$geoip_disable":true}}}
Verde: pnpm typecheck exit 0 · pnpm lint exit 0 · pnpm test  Test Files 19 passed (19)  Tests 251 passed (251)
```

### S7, nessun feedback (2026-09-27)

Nota: `docs/notes/2026-09-27-chiedi-s7-nessun-feedback.md`.

```
Rosso:  × no feedback: text A ... × only feedback older than 90 days: text B ...   Tests  2 failed | 1 passed (3)
Verde:  pnpm typecheck exit 0 · pnpm lint exit 0 · pnpm test  Test Files 20 passed (20)  Tests 254 passed (254)
        pnpm build ✓ Compiled successfully · pnpm test:e2e non eseguito (porta 3000 occupata)
```
