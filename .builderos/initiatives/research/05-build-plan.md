# Build: Research, customer discovery (Research ibrida)

**Phase:** 5 · **Cycle:** 1 · **Mode:** lite · **Date:** 2026-09-28 · **Owner:** Mario Miletta (piano scritto dal modello, delivery-planner)
**Branch:** `feat/research` @ `edac3cf`, worktree `voce-research`, stack Supabase isolato `voce-research` (porte 555xx) comandato solo da `/Users/mariomiletta/.cache/voce-research-db.sh`.
**Fonte:** `04-spec.md` (73 criteri, 14 voci in scope, 22 fuori scope, 4 domande aperte) e `DESIGN.md` di questa iniziativa (flussi F1-F12, stati, testi). Il piano del repository è `docs/plans/2026-09-28-research.md` e rimanda qui.
**Vincolo di consegna:** si costruisce su `feat/research` con PR in bozza, niente merge e niente migrazione remota prima della masterclass del 2026-10-01; la data della migrazione in produzione è di Mario.

Stato di questo file: **costruzione chiusa (S1-S12) il 2026-09-28, tranne le evals col modello vero** (manca `ANTHROPIC_API_KEY`: AC 60 e 61 non eseguiti). Le sezioni "Test output", "Instrumentation", "Eval results" e "Scope check" sono compilate da S12.

## Test baseline

Registrata il 2026-09-28 tra le 20:14 e le 20:39 CEST, prima di qualsiasi modifica, su `edac3cf` con albero pulito (`git status --short` vuoto). Stack isolato acceso, `.env.local` con le tre chiavi Supabase del worktree. Porte 3000 e 4010 libere prima di `pnpm test:e2e` (`lsof -i :3000 -i :4010` vuoto).

```
$ pnpm typecheck
> voce@0.1.0 typecheck /Users/mariomiletta/Dev Projects/voce-research
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully
pnpm typecheck  8.79s user 0.48s system 129% cpu 7.143 total
```

```
$ pnpm lint
> voce@0.1.0 lint /Users/mariomiletta/Dev Projects/voce-research
> eslint

pnpm lint  6.19s user 0.60s system 197% cpu 3.439 total
```

```
$ pnpm exec vitest run
 RUN  v5.0.1 /Users/mariomiletta/Dev Projects/voce-research

 Test Files  33 passed (33)
      Tests  375 passed (375)
   Start at  20:14:37
   Duration  3.48s (tests 79%, import 13%, transform 8%)

pnpm exec vitest run  8.94s user 1.45s system 273% cpu 3.797 total
```

Test per file (vitest `--reporter=json`, test passati):

```
  19 src/app/(app)/ask/actions.test.ts
   5 src/app/(app)/ask/analytics.test.ts
   3 src/app/(app)/ask/page.test.tsx
  10 src/app/(app)/billing/actions.test.ts
  17 src/app/(app)/collect/actions.test.ts
   6 src/app/(app)/feedback/actions.test.ts
  16 src/app/(app)/themes/actions.test.ts
  12 src/app/(auth)/actions.test.ts
  14 src/app/actions.test.ts
  16 src/app/api/stripe/webhook/route.test.ts
   5 src/app/auth/callback/route.test.ts
   7 src/app/sala/actions.test.ts
   7 src/components/ask-answer.test.tsx
   9 src/components/ask-copy.test.ts
   5 src/components/auth-forms.test.tsx
   2 src/components/kit.test.tsx
   3 src/components/password-input.test.tsx
   2 src/i18n/actions.test.ts
  16 src/i18n/locale.test.ts
   3 src/i18n/messages.test.ts
  13 src/lib/analysis.test.ts
   6 src/lib/analytics.test.ts
  31 src/lib/csv-import.test.ts
  19 src/lib/data.test.ts
   3 src/lib/format.test.ts
   6 src/lib/prompt-language.test.ts
  15 src/lib/questions.test.ts
  37 src/lib/room-viz.test.ts
   5 src/lib/room.test.ts
   2 src/lib/stripe.test.ts
   5 src/test/docs.test.ts
   2 src/test/plan-pages.test.tsx
  54 src/test/rls.test.ts
```

```
$ /Users/mariomiletta/.cache/voce-research-db.sh test
Connecting to local database...
psql:/Users/mariomiletta/.cache/voce-research-db/supabase/tests/feedback_delete_policy.test.sql:5: NOTICE:  extension "pgtap" already exists, skipping
/Users/mariomiletta/.cache/voce-research-db/supabase/tests/feedback_delete_policy.test.sql .. ok
psql:/Users/mariomiletta/.cache/voce-research-db/supabase/tests/questions.test.sql:3: NOTICE:  extension "pgtap" already exists, skipping
/Users/mariomiletta/.cache/voce-research-db/supabase/tests/questions.test.sql ............... ok
All tests successful.
Files=2, Tests=52,  0 wallclock secs ( 0.01 usr  0.00 sys +  0.01 cusr  0.00 csys =  0.02 CPU)
Result: PASS
/Users/mariomiletta/.cache/voce-research-db.sh test  0.30s user 0.10s system 50% cpu 0.794 total
```

```
$ pnpm test:e2e
Running 36 tests using 6 workers
...
  1) [chromium] › e2e/ask.spec.ts:11:5 › ask a question from the keyboard and read the answer
    Error: No confirmation email for e2e-ask-90de4bd4@test.voce in Mailpit
  2) [chromium] › e2e/ask.spec.ts:302:5 › waiting state and the 15-second message
    Error: expect(locator).toBeVisible() failed
  3) [chromium] › e2e/ask.spec.ts:319:5 › two quick submits make one model call
    Error: expect(locator).toBeVisible() failed
  4) [chromium] › e2e/email-confirmation.spec.ts:17:5 › the default template link lands the user signed in on the themes
    Error: No confirmation email for e2e-confirm-1fea807e@test.voce in Mailpit
  5) [chromium] › e2e/email-confirmation.spec.ts:23:5 › opened in another browser, the link confirms the email and asks to sign in
    Error: No confirmation email for e2e-confirm-950e4da2@test.voce in Mailpit
  6) [chromium] › e2e/english.spec.ts:52:5 › /f/phc26 stays in Italian for an English browser that chose English
    Error: page.goto: net::ERR_NETWORK_IO_SUSPENDED at http://localhost:3000/f/phc26
  7) [chromium] › e2e/main-flow.spec.ts:7:5 › sign up, add feedback and get the first themes
    Error: No confirmation email for e2e-ee850669@test.voce in Mailpit
  8) [chromium] › e2e/room.spec.ts:15:5 › the counter goes up with a public form response, then the analysis shows the themes
    Error: page.goto: net::ERR_NETWORK_IO_SUSPENDED at http://localhost:3000/f/prova-sala-f43455b4
  8 failed
  28 passed (10.2m)
 ELIFECYCLE  Command failed with exit code 1.
pnpm test:e2e  48.69s user 11.63s system 9% cpu 10:12.39 total
```

Rilancio dei quattro fallimenti che non riguardano la posta, subito dopo:

```
$ pnpm exec playwright test e2e/english.spec.ts:52 e2e/room.spec.ts:15 e2e/ask.spec.ts:302 e2e/ask.spec.ts:319
Running 4 tests using 3 workers

  ✓  2 [chromium] › e2e/english.spec.ts:52:5 › /f/phc26 stays in Italian for an English browser that chose English (4.4s)
  ✓  1 [chromium] › e2e/room.spec.ts:15:5 › the counter goes up with a public form response, then the analysis shows the themes (7.1s)
  ✓  3 [chromium] › e2e/ask.spec.ts:302:5 › waiting state and the 15-second message (23.4s)
  ✓  4 [chromium] › e2e/ask.spec.ts:319:5 › two quick submits make one model call (21.1s)

  4 passed (47.2s)
```

Causa dei quattro fallimenti "No confirmation email", verificata: `e2e/helpers.ts` cerca la posta su Mailpit alla porta fissa 54324 (stack condiviso), mentre lo stack isolato la manda sulla 55524. La mail di `e2e-ask-90de4bd4@test.voce` è sulla 55524 (`/api/v1/search` restituisce 1 messaggio) e non sulla 54324 (0 messaggi).

**Riassunto della baseline:** typecheck 0 errori, lint 0 problemi, vitest 375 su 375 in 33 file (3,48 s), pgTAP 52 su 52 in 2 file. E2E 36 test in 10,2 minuti: 28 passati, 8 falliti, nessuno per un difetto del codice. 4 falliscono sempre in questo worktree per la porta di Mailpit (P2 sotto); 4 sono passati al rilancio (47 s) e il primo giro li aveva persi per la rete sospesa del Mac (`ERR_NETWORK_IO_SUSPENDED`) durante una corsa di 10 minuti (P4). **Nessun fallimento preesistente del codice.**

## Prerequisiti e rischi d'ambiente

| # | Cosa | Perché conta | Chi o come |
|---|------|--------------|------------|
| P1 | `ANTHROPIC_API_KEY` in `.env.local` | `pnpm evals` chiama il modello vero (AC 60, 61). Verificato ora: nessun `.env.local` dei worktree `voce*` ha la chiave (7 su 7 a zero), e `evals/results/` non esiste in nessun worktree | Mario mette la chiave in `.env.local` di questo worktree. Le evals costano chiamate vere: ogni run del verdetto sono 20 chiamate. Blocca S0, S8, S12 |
| P2 | Mailpit alla porta dello stack isolato | 4 E2E falliscono qui per la porta fissa 54324 in `e2e/helpers.ts`; AC 70 e AC 16 passano dalla conferma email | In S1, `MAILPIT` si ricava dalla porta di `NEXT_PUBLIC_SUPABASE_URL` più 3 (54321 → 54324, 55521 → 55524). Una riga, solo codice di test, funziona su entrambi gli stack |
| P3 | Test della migrazione dei dati | AC 3, 4, 6, 7 chiedono lo stato "prima" (workspace con `form_slug = 'phc26'`), che dopo la migrazione non esiste più: un file pgTAP in `supabase/tests/` gira sempre sul database già migrato e non può provarli | Nuovo comando `migration-test` nello script dello stack isolato: `supabase db reset --version 20260927120000`, fixture `supabase/migration-tests/research_before.sql` via `docker exec supabase_db_voce-research psql`, `supabase migration up`, poi `research_after.test.sql` con `pg_prove`, poi `reset` completo. Tocca un file fuori dal repository (lo script di Mario): è reversibile, lo si aggiunge in S1 e lo si dice. Sull'host non c'è `psql`: si passa dal container |
| P4 | Rete sospesa durante le corse E2E lunghe | Il primo giro ha perso 4 test per `ERR_NETWORK_IO_SUSPENDED` | Ogni E2E si lancia con `caffeinate -i pnpm test:e2e` |
| P5 | Tipi del database dopo ogni cambio di migrazione | `src/lib/database.types.ts` va rigenerato dallo stack isolato, mai dallo stack `voce` | `supabase gen types typescript --db-url postgresql://postgres:postgres@127.0.0.1:55522/postgres --schema public > src/lib/database.types.ts` (sola lettura sul database isolato) |
| P6 | Evals di partenza sul codice di prima | AC 61 confronta con "l'ultimo file in `evals/results/` salvato prima del cambio": quel file non esiste, e `evals/questions.eval.ts` nemmeno (era S2 di Chiedi, rimandata) | S0 li crea su `edac3cf`, in un worktree temporaneo o prima che S3 cambi il perimetro |
| P7 | Due gruppi di rotte sullo stesso `[id]` | La sala sta fuori dal layout dell'app (niente barra): `/research/[id]/sala` in `src/app/research/[id]/sala/` accanto a `src/app/(app)/research/[id]/` | Da provare in S1 con `pnpm build`: se Next.js rifiuta le due cartelle, la sala va sotto `(app)` con un layout senza barra. Rischio tecnico, non di prodotto |

## Slices

**Scelta di confine.** La spec vuole una sola migrazione, `supabase/migrations/20261001090000_research.sql`. Finché non è su un database remoto la si fa crescere in place, slice dopo slice, e la si riapplica con `voce-research-db.sh reset`; ogni slice aggiunge la sua parte (tabelle, colonne, funzioni) e i suoi test pgTAP. Alla fine è un file unico, una transazione, come chiede la spec.

**Perché S1 è la prima, ed è grande.** È la più rischiosa tra quelle che stanno in una sessione: la migrazione dei dati è la porta a senso unico dell'iniziativa (ogni feedback cambia forma, il modulo lascia il workspace) e `/f/phc26` deve sopravvivere. Non si può fare più sottile senza codice da buttare: `feedback.research_id not null` e le colonne del modulo tolte dal workspace rompono ogni percorso che inserisce feedback (modulo, CSV, inserimento manuale, seed, fixture dei test) e le due pagine che leggono il modulo (`/collect`, `/sala`). Per questo S1 sposta Raccolta e sala dentro la Research **con il comportamento di oggi**, senza le novità: quelle arrivano in S2 e S10. Se S1 sfora la sessione, il punto di taglio è dopo la migrazione con pgTAP verde e tipi rigenerati, prima delle pagine.

Ogni slice va da capo a piedi: pagina o action, logica, database, evento dove esiste. Ogni slice finisce con un commit verificato e una nota in `docs/notes/`, come chiede `AGENTS.md`. Il ciclo per slice: test dal criterio, visto fallire, codice minimo, refactor in verde, strumentazione, revisione su standard e spec (superpowers:test-driven-development per i passi 1-4).

| # | Slice | Acceptance criteria | Blocks on | Dimensione | Status |
|---|-------|---------------------|-----------|------------|--------|
| S0 | **Evals di partenza.** `evals/questions.eval.ts` su `evals/questions.json` (G1-G5, soglia, must-pass, come `analysis.eval.ts`); salvataggio dei risultati in `evals/results/` con confronto col precedente per entrambi i file; un run di `pnpm evals` sul codice di `edac3cf` | 61 (base) | P1 | media: 1 file di evals nuovo, 1 esteso, run col modello vero | codice fatto in S8, run su `edac3cf` in attesa della chiave |
| S1 | **Proiettile tracciante: la Research nasce e raccoglie.** Migrazione parte 1: `research` con RLS e permessi, `create_research`, `feedback.research_id not null` con indice, Research iniziale per workspace, modulo spostato sulla Research e colonne tolte da `workspaces`, `handle_new_user` senza slug, `get_public_form`, `submit_public_feedback`, `regenerate_form_link(research)`, `import_feedback(ws, research, …)`. `/research` (primo accesso ed elenco minimo: numero, domanda, "Nessun feedback ancora", "Modulo spento"), `/research/new`, `/research/[id]` (testata, schede interne, Sintesi vuota con le tre strade di raccolta), pagina NF. Raccolta, QR e sala spostati sotto la Research con il comportamento di oggi; `/collect` e `/sala` cancellate. `AppTabs` a due livelli, `APP_PATHS`, arrivo su `/research` dopo accesso e conferma. Seed con Research, fixture dei test (`src/test/supabase.ts`, `e2e/helpers.ts`), P2, P3, file `supabase/tests/research.test.sql` e `supabase/migration-tests/`. E2E `e2e/research.spec.ts` e percorsi aggiornati in `ask`, `room`, `main-flow`, `email-confirmation`, `english` | 1 (parte), 2, 3 (parte), 4, 5, 6, 8 (parte), 9 (parte), 11, 12, 13, 14 (parte), 15 (parte), 16 (parte), 17, 22, 23, 24, 71, 72 (parte) | nessuno | grande: 1 migrazione (circa 350 righe), 2 file pgTAP, ~6 file nuovi, ~20 toccati, 6 spec E2E | fatta (`docs/notes/2026-09-28-research-s1-proiettile-tracciante.md`) |
| S2 | **Raccolta della Research: note, CSV, limite, scheda Feedback, prima milestone.** `addNotes` (canale "Intervista", 10.000 caratteri, N1-N4) al posto di `addFeedback`, check del testo a 1-10.000 nel database con modulo e CSV fermi a 2.000; duplicati del CSV nella Research; limite Free sommato su tutte le Research con `LimitWarning` nuovo; `/research/[id]/feedback` al posto di `/feedback` (cancellata); vincolo di `analytics_milestones` esteso, milestone inserita dalla migrazione, `first_research_collected` da modulo, note e CSV | 7, 16 (parte), 25, 26, 27, 62, 66 (parte), 67 (parte) | S1 | media: 1 action nuova, 2 componenti estesi, 1 pagina spostata, pgTAP e 1 test di analytics | fatta (`docs/notes/2026-09-28-research-s2-raccolta.md`) |
| S3 | **Temi della Research, dal clic alla riga "cosa è cambiato".** Migrazione: `analysis_kind`, `analyses.research_id` e `kind`, `themes.research_id`, collegamento dei dati esistenti (AC 3, parte analisi e temi), `start_analysis(ws, research, model, kinds[], …)` con quota, `busy` e `stale`, `finish_analysis` per Research. Perimetro condiviso in `src/lib/analysis.ts` (500 feedback, 1.000.000 di caratteri, niente 90 giorni, `ANALYSIS_WINDOW_DAYS` tolta). Action `synthesize` sul solo ramo temi, Sintesi con temi, variazione per tema e riga "cosa è cambiato", dettaglio `/research/[id]/themes/[themeId]`, `AnalyzeButton` con Research, costo e `aria-disabled`, `maxDuration` 300; `/themes` cancellata. `research_synthesized` con `hypothesis_count` 0, `first_analysis_completed` spostato | 3 (parte), 10 (parte), 15, 16 (parte), 28, 29, 30, 31, 33, 34, 36 (parte), 48 (parte), 63 (parte), 64 (parte), 65 (parte), 66 (parte) | S1 | grande: migrazione estesa, 1 file pgTAP nuovo, 1 action nuova al posto di `analyze`, 3 componenti estesi, 2 pagine spostate | fatta (`docs/notes/2026-09-28-research-s3-temi.md`) |
| S4 | **Chiedi nella Research.** `start_question` riceve la Research e salva `questions.research_id` (dati esistenti collegati), stesso perimetro dell'analisi, `/research/[id]/ask` al posto di `/ask` (cancellata) con l'eccezione del proxy spostata, stringhe senza 90 giorni e stato vuoto verso la Raccolta | 3 (parte), 16 (parte), 50, 51 | S3 | media: 1 pagina e 1 action spostate, migrazione estesa, cataloghi, test spostati | fatta (`docs/notes/2026-09-28-research-s4-chiedi.md`) |
| S5 | **Ipotesi: scrivere, modificare, eliminare.** Migrazione: `research_hypotheses` con i tre trigger (`max_hypotheses`, `position`, `written_at` e cancellazione del verdetto al cambio di testo), `hypothesis_verdicts` e `verdict_feedback` in sola lettura, tipi `hypothesis_verdict` e `verdict_stance`, RLS e permessi. `addHypothesis`, `updateHypothesis`, `deleteHypothesis` con H1-H6; `HypothesisList` senza verdetto (sezione vuota, campo, modifica con H5, conferma H6, focus e annunci) | 1 (resto), 8 (resto), 9 (resto), 10 (parte), 18, 19, 20 | S1 | media: migrazione estesa, 1 file pgTAP nuovo, 3 action, 1 componente nuovo | fatta (`docs/notes/2026-09-28-research-s5-ipotesi.md`) |
| S6 | **Verdetto, dal clic al database.** `src/lib/verdict.ts` (istruzioni per lingua, `<hypotheses_data>` e `<feedback_data>`, schema, `checkVerdicts` con i 9 motivi, regola `verdict_without_quotes`, `missing_hypothesis`), `finish_verdict` in SQL con `strpos` e feedback eliminati, trigger `analysis_running` sulle ipotesi, `synthesize` con due righe e due chiamate in parallelo ed esiti per parte (S5, S6, S7), `analysis_runs` per la riga `verdict`, log senza testo, finta API Anthropic estesa al verdetto, `research_synthesized` con `citation_count` e `hypothesis_count` veri | 10 (resto), 21, 32, 35, 36 (resto), 37, 38 (parte), 39, 40, 41, 48 (resto), 49, 63 (parte), 64 (parte), 67 | S3, S5 | grande: 1 file di logica e prompt nuovo, 1 funzione SQL, 1 file pgTAP nuovo, action estesa, finto server esteso | fatta (`docs/notes/2026-09-28-research-s6-verdetto.md`) |
| S7 | **Leggere il verdetto.** Sezione Ipotesi con parola dal catalogo e segno `aria-hidden`, conteggi dai `verdict_feedback`, ragionamento come testo, citazioni "A favore" e "Contro", V1 e V2, "Dopo questo verdetto…", "Nessuno dei {n} feedback letti ne parla." senza ragionamento, annuncio di fine analisi; E2E da tastiera di AC 70 al posto di `main-flow.spec.ts` | 38 (resto), 42, 43, 46, 47, 70 | S6, S2 | media: 1 componente esteso, lettura dati, 1 test di render, 1 E2E riscritto | fatta (`docs/notes/2026-09-28-research-s7-lettura-verdetto.md`) |
| S8 | **Evals del verdetto.** `evals/verdicts.eval.ts` su `evals/verdicts.json` (G1-G5 e controlli per caso), primo run col modello vero, ritocchi alle istruzioni di `verdict.ts` finché non passano soglia e must-pass, risultato in `evals/results/` | 60 | S6, P1 | piccola nel codice, rischio alto sul modello | codice fatto, run delle evals in attesa della chiave (`docs/notes/2026-09-28-research-s8-evals-verdetto.md`) |
| S9 | **Quota del verdetto e "Solo il verdetto".** Costo prima del clic (1 o 2 analisi), S4 con solo temi deciso dal server, "Solo il verdetto di {h} ipotesi" con le sue condizioni, pulsanti spenti a quota finita, riga "Il verdetto delle ipotesi usa 1 analisi" in `/billing` e landing | 44, 45, 54 (parte), 55, 65 (resto) | S7; decision: S4 (AC 44, domanda aperta della spec) | media: action e 2 componenti estesi, 2 pagine dei piani, cataloghi | fatta (`docs/notes/2026-09-28-research-s9-quota-verdetto.md`) |
| S10 | **Sala della Research.** Conteggio delle sole risposte del modulo della Research, "Analizza le risposte" che riserva solo i temi con la nota sulle ipotesi, R1 e 404 di `/sala/status` a Research eliminata, pulsante spento a quota finita, `room.spec.ts` riscritto | 52, 53, 54 (resto), 63 (parte), 64 (parte) | S6 | piccola: 1 pagina, 1 route, 1 componente esteso, 1 E2E | fatta (`docs/notes/2026-09-28-research-s10-sala.md`) |
| S11 | **Elenco completo, modifica ed eliminazione.** Righe dell'elenco con tutti gli stati e l'ordine per attività, `updateResearchQuestion`, `deleteResearch` con D1 e D2, trigger che svuota i registri, righe di quota con `research_id` nullo, `research_deleted` in `finish_analysis` e `finish_verdict` | 14 (resto), 56, 57, 58, 59 | S6 | media: 2 action, 1 componente esteso, migrazione estesa, pgTAP, 1 E2E | fatta (`docs/notes/2026-09-28-research-s11-elenco-modifica-eliminazione.md`) |
| S12 | **Chiusura.** Seed completo (due Research, ipotesi e verdetti), `docs/analytics.md` con eventi e query, test di render in inglese su tutti i cataloghi, rilancio delle evals di analisi e Chiedi contro S0, tutti i comandi di AC 73 da zero con output incollato, controllo del diff contro le 22 voci fuori scope, strumentazione verificata, revisione indipendente (`build-reviewer`), `TECH.md` e roadmap | 16 (resto), 61, 68, 69, 72, 73 | S0, S2, S4, S7, S8, S9, S10, S11 | piccola nel codice, verifica completa | fatta tranne le evals (`docs/notes/2026-09-28-research-s12-chiusura.md`): AC 61 in attesa della chiave |

### Blocking edges

- S0 blocks on prerequisite: `ANTHROPIC_API_KEY` (P1), e gira sul codice di `edac3cf` (P6)
- S2 blocks on S1
- S3 blocks on S1
- S4 blocks on S3
- S5 blocks on S1
- S6 blocks on S3
- S6 blocks on S5
- S7 blocks on S6
- S7 blocks on S2 (l'E2E di AC 70 incolla le note)
- S8 blocks on S6
- S8 blocks on prerequisite: `ANTHROPIC_API_KEY` (P1)
- S9 blocks on S7
- S9 blocks on decision: solo temi con 1 analisi rimasta (S4, AC 44), domanda aperta per Mario "prima della fase 5". La spec lo dice costruibile come scritto; il piano non lo decide nel codice: se Mario non risponde prima di S9, si costruisce come scritto e lo si registra in "Deviations from spec"
- S10 blocks on S6
- S11 blocks on S6
- S12 blocks on S0, S2, S4, S7, S8, S9, S10, S11
- Tutte le parti E2E block on prerequisite: porte 3000 e 4010 libere, P2 (in S1), P4

Le altre tre domande aperte della spec (data della migrazione in produzione, id del workspace della demo, `POSTHOG_KEY` in Production) non toccano nessun criterio di costruzione.

**Critical path:** S1 → S3 → S6 → S7 → S9 → S12, **6 slice su 13**. Non è la maggior parte del lavoro: dopo S1 vanno in parallelo S2, S3 e S5; dopo S3, S4; dopo S6, S7, S8, S10 e S11. La catena è lunga per una dipendenza di dati vera (il verdetto ha bisogno di analisi per Research e di ipotesi), non per strati: ogni slice della catena finisce su una pagina che il PM usa. Il ramo più incerto non è il più lungo: S6 → S8, perché dipende dal modello vero e da una chiave che oggi non c'è.

**Ordine consigliato con un solo esecutore:** S1, S3, S5, S6, S8, S2, S7, S4, S9, S10, S11, S12. S0 appena Mario mette la chiave, su `edac3cf`. S8 subito dopo S6 perché un prompt del verdetto che non passa i must-pass è l'unica cosa che può rimettere in discussione la scommessa ibrida; S2 prima di S7 perché l'E2E di AC 70 incolla le note.

### Per slice: file e verifica

Comandi di verifica comuni a ogni slice, oltre ai test elencati: `pnpm typecheck`, `pnpm lint`, `pnpm exec vitest run`, `/Users/mariomiletta/.cache/voce-research-db.sh reset` seguito da `/Users/mariomiletta/.cache/voce-research-db.sh test` se la slice tocca la migrazione, `lsof -i :3000 -i :4010` vuoto prima di `caffeinate -i pnpm exec playwright test <spec>`. Mai `supabase db reset`, `supabase start` o `supabase test db` nudi nel repository.

**S0.** File: `evals/questions.eval.ts` (nuovo), `evals/analysis.eval.ts` (salvataggio del risultato), `evals/results/` (nuovo). Verifica: `pnpm evals` su `edac3cf` con output incollato; il file dei risultati porta commit e modello.

**S1.** File probabili: `supabase/migrations/20261001090000_research.sql` (nuovo), `supabase/tests/research.test.sql` (nuovo), `supabase/migration-tests/research_before.sql` e `research_after.test.sql` (nuovi), `supabase/tests/questions.test.sql` e `feedback_delete_policy.test.sql` (fixture con Research), `supabase/seed.sql`, `src/lib/database.types.ts`, `src/lib/types.ts`, `src/lib/data.ts` (`getCurrentWorkspace` senza modulo, `getResearch`, `listResearch`, `getPublicForm`, `getRoomStatus`), `src/lib/supabase/admin.ts` (`workspaceOfForm` sulla Research), `src/app/(app)/research/page.tsx`, `new/page.tsx`, `actions.ts`, `[id]/layout.tsx`, `[id]/page.tsx`, `[id]/not-found.tsx`, `[id]/collect/page.tsx` e `actions.ts` (da `collect/`), `[id]/qr/route.ts`, `src/app/research/[id]/sala/page.tsx`, `actions.ts`, `status/route.ts` (da `sala/`), `src/components/research-form.tsx` e `research-row.tsx` (nuovi), `app-tabs.tsx`, `form-link-controls.tsx`, `form-question-field.tsx`, `csv-import.tsx`, `manual-feedback-form.tsx`, `room-screen.tsx`, `src/proxy.ts`, `src/app/(auth)/actions.ts`, `src/app/auth/callback/route.ts`, `src/app/actions.ts`, `src/i18n/messages/{it,en}/research.json` (nuovo) e `app.json`, `src/i18n/messages/index.ts`, `src/test/supabase.ts`, `src/test/rls.test.ts`, `e2e/helpers.ts` (P2), `e2e/research.spec.ts` (nuovo), `e2e/english.spec.ts`, `e2e/room.spec.ts`, `e2e/ask.spec.ts`, `e2e/main-flow.spec.ts`, `e2e/email-confirmation.spec.ts`; fuori dal repository `/Users/mariomiletta/.cache/voce-research-db.sh` (P3). Verifica: comuni, più `voce-research-db.sh migration-test`, `pnpm build` (P7), E2E completo.

**S2.** File: migrazione (check del testo, vincolo delle milestone, milestone dei workspace migrati), `supabase/tests/research.test.sql`, `supabase/migration-tests/research_after.test.sql`, `src/app/(app)/research/[id]/collect/actions.ts` e test, `src/app/(app)/research/[id]/feedback/page.tsx` e `actions.ts` (da `feedback/`), `src/components/manual-feedback-form.tsx`, `limit-warning.tsx`, `delete-feedback-button.tsx`, `src/lib/plans.ts` (`NOTES_MAX_LENGTH`), `src/lib/analytics.ts` (`Milestone`), `src/lib/supabase/admin.ts`, `src/app/actions.ts` (modulo), `src/app/(app)/research/[id]/analytics.test.ts` (nuovo), cataloghi `research`, `collect`, `feedback`. Verifica: comuni, `migration-test`, E2E `research.spec.ts`.

**S3.** File: migrazione (tipo, colonne, `start_analysis`, `finish_analysis`, collegamento dei dati), `supabase/tests/analysis.test.sql` (nuovo), `supabase/migration-tests/research_after.test.sql`, `src/lib/analysis.ts` (`selectFeedback`, `ANALYSIS_MAX_CHARS`), `src/lib/supabase/admin.ts` (`startAnalysis` con `kinds`), `src/app/(app)/research/[id]/actions.ts` (`synthesize`) e `synthesize.test.ts` (nuovo, eredita `themes/actions.test.ts`), `src/app/(app)/research/[id]/page.tsx`, `themes/[themeId]/page.tsx` (da `themes/[id]/`), `src/lib/data.ts` (Sintesi e "cosa è cambiato"), `src/components/analyze-button.tsx` e `analyze-button.test.tsx` (nuovo), `theme-row.tsx` e `theme-row.test.tsx` (nuovo), `src/lib/analytics.ts` (`RepeatedEvent`), cataloghi `research`, `themes`. Verifica: comuni, `migration-test`, E2E `research.spec.ts` e `main-flow.spec.ts` sul percorso dei temi.

**S4.** File: migrazione (`questions.research_id`, `start_question`), `supabase/tests/questions.test.sql`, `supabase/migration-tests/research_after.test.sql`, `src/app/(app)/research/[id]/ask/page.tsx`, `actions.ts` e test (da `ask/`), `src/lib/questions.ts`, `src/lib/supabase/admin.ts`, `src/proxy.ts`, `src/components/ask-form.tsx`, `ask-answer.tsx`, cataloghi `ask`. Verifica: comuni, `migration-test`, E2E `ask.spec.ts` con i percorsi nuovi.

**S5.** File: migrazione (tabelle, tipi, trigger, RLS), `supabase/tests/hypotheses.test.sql` (nuovo), `src/app/(app)/research/[id]/actions.ts` (ipotesi) e `hypotheses.test.ts` (nuovo), `src/components/hypothesis-list.tsx` (nuovo), `src/lib/data.ts`, `src/lib/plans.ts` (`HYPOTHESIS_MAX_LENGTH`, `MAX_HYPOTHESES`), `src/test/docs.test.ts`, cataloghi `research.hypotheses`. Verifica: comuni, controllo a mano da tastiera del focus (H6 su "Annulla", h2 dopo l'eliminazione).

**S6.** File: `src/lib/verdict.ts` e `verdict.test.ts` (nuovi), migrazione (`finish_verdict`, trigger `analysis_running`), `supabase/tests/verdicts.test.sql` (nuovo), `supabase/tests/hypotheses.test.sql`, `src/lib/supabase/admin.ts` (`finishVerdict`), `src/app/(app)/research/[id]/actions.ts` e `synthesize.test.ts`, `src/app/(app)/research/[id]/analytics.test.ts`, `src/test/fake-model.ts`, `e2e/fake-anthropic.mts` (risposta al prompt con `<hypotheses_data>`). Verifica: comuni, un giro E2E di `research.spec.ts` contro la finta API.

**S7.** File: `src/components/hypothesis-list.tsx` e `hypothesis-list.test.tsx` (nuovo), `src/lib/data.ts` (verdetti, conteggi, feedback arrivati dopo), `src/app/(app)/research/[id]/page.tsx`, `e2e/main-flow.spec.ts` (riscritto), cataloghi `research.verdict`. Verifica: comuni, E2E `main-flow.spec.ts`, controllo a mano nel browser della Sintesi con verdetti.

**S8.** File: `evals/verdicts.eval.ts` (nuovo), `src/lib/verdict.ts` (solo istruzioni, se i must-pass falliscono), `evals/results/`. Verifica: `pnpm evals` con output incollato; ogni ritocco alle istruzioni rilancia tutto il set.

**S9.** File: `src/app/(app)/research/[id]/actions.ts` (scelta dei `kinds` sul server), `src/components/analyze-button.tsx`, `hypothesis-list.tsx`, `src/app/(app)/billing/page.tsx`, `src/app/page.tsx`, `src/test/plan-pages.test.tsx`, cataloghi `research`, `billing`, `landing`. Verifica: comuni, E2E della quota in `research.spec.ts`.

**S10.** File: `src/app/research/[id]/sala/page.tsx`, `status/route.ts`, `actions.ts` e test, `src/components/room-screen.tsx`, `src/lib/data.ts` (`getRoomStatus` per Research), `e2e/room.spec.ts`, cataloghi `room`. Verifica: comuni, E2E `room.spec.ts`, prova a mano dello schermo con R1.

**S11.** File: `src/app/(app)/research/actions.ts` (`updateResearchQuestion`, `deleteResearch`) e test, `src/app/(app)/research/page.tsx`, `src/components/research-row.tsx` e `research-row.test.tsx`, migrazione (trigger `after delete`, `research_deleted`), `supabase/tests/research.test.sql`, `analysis.test.sql`, `verdicts.test.sql`, `e2e/research.spec.ts`. Verifica: comuni, E2E dell'eliminazione.

**S12.** File: `supabase/seed.sql`, `docs/analytics.md`, `src/test/docs.test.ts`, `src/test/english-render.test.tsx` (nuovo), `docs/notes/`, `TECH.md`, `.builderos/ROADMAP.md`. Verifica: tutti i comandi di AC 73 da zero, `pnpm evals` completo, `caffeinate -i pnpm test:e2e` completo.

## Acceptance criteria to tests

File di test previsti. Nuovi: `supabase/tests/research.test.sql`, `supabase/tests/analysis.test.sql`, `supabase/tests/hypotheses.test.sql`, `supabase/tests/verdicts.test.sql` (pgTAP), `supabase/migration-tests/research_after.test.sql` (pgTAP sul passaggio dei dati, lanciato da `voce-research-db.sh migration-test`, P3), `src/app/(app)/research/actions.test.ts`, `src/app/(app)/research/page.test.tsx`, `src/app/(app)/research/[id]/synthesize.test.ts`, `src/app/(app)/research/[id]/hypotheses.test.ts`, `src/app/(app)/research/[id]/analytics.test.ts`, `src/lib/verdict.test.ts`, `src/components/research-row.test.tsx`, `src/components/hypothesis-list.test.tsx`, `src/components/analyze-button.test.tsx`, `src/components/theme-row.test.tsx`, `src/test/english-render.test.tsx`, `e2e/research.spec.ts`, `evals/questions.eval.ts`, `evals/verdicts.eval.ts`. Spostati con le loro rotte: `collect/actions.test.ts` → `research/[id]/collect/`, `ask/*.test.*` → `research/[id]/ask/`, `themes/actions.test.ts` → `research/[id]/synthesize.test.ts`, `feedback/actions.test.ts` → `research/[id]/feedback/`, `sala/actions.test.ts` → `src/app/research/[id]/sala/`. Estesi: `src/lib/analysis.test.ts`, `src/lib/analytics.test.ts`, `src/lib/data.test.ts`, `src/app/actions.test.ts`, `src/test/docs.test.ts`, `src/test/plan-pages.test.tsx`, `src/components/ask-answer.test.tsx`, `src/i18n/messages.test.ts`, `e2e/english.spec.ts`, `e2e/room.spec.ts`, `e2e/main-flow.spec.ts`, `e2e/email-confirmation.spec.ts`.

Riallineata in S12 ai nomi veri dei test (controllo automatico: ogni nome tra virgolette della colonna Test esiste in un file di test, tranne i nomi abbreviati con "..." e le etichette di sezione). Result: "passa" vuol dire verde nell'esecuzione completa del 2026-09-28 in "Test output".

| # | Criterion (sintesi) | Test | Result |
|---|---------------------|------|--------|
| 1 | La migrazione crea `research`, `research_hypotheses`, `hypothesis_verdicts`, `verdict_feedback` con RLS nello stesso file; reset da zero senza errori | S1, S5. `src/test/docs.test.ts`: "enables RLS on research in the same file that creates it", "enables RLS on research_hypotheses, hypothesis_verdicts and verdict_feedback in the file that creates them"; `research.test.sql`: "RLS is enabled on research"; output di `voce-research-db.sh reset` in "Test output" | passa |
| 2 | Dopo reset con seed nessun feedback senza `research_id`; insert senza `research_id` fallisce per `not null` | S1. `supabase/tests/research.test.sql`: "after reset with the seed no feedback lacks a research", "a feedback without research_id violates not null" | passa |
| 3 | Workspace con `phc26`, 3 feedback, 1 analisi con 2 temi, 1 domanda: una sola Research iniziale con slug, stato e domanda di default, e tutti legati a lei | S1, S3, S4. `supabase/migration-tests/research_after.test.sql`: "one initial Research per workspace with slug phc26, enabled and null form question", "the default question names the workspace", "the 3 feedback carry its research_id" (S1), "the analysis and its 2 themes carry its research_id" (S3), "the question carries its research_id" (S4) | passa |
| 4 | Con `form_question = 'Come va?'` domanda e domanda del modulo sono "Come va?" | S1. `research_after.test.sql`: "a form question becomes the Research question and stays the form question" | passa |
| 5 | `workspaces` senza colonne del modulo; la registrazione crea workspace, membro, abbonamento e nessuna Research | S1. `research.test.sql`: "workspaces has no form_slug", "workspaces has no form_enabled", "workspaces has no form_question", "a new user gets workspace, member and subscription and no Research" | passa |
| 6 | `get_public_form('phc26')` e `submit_public_feedback('phc26', …)` sulla Research iniziale | S1. `research_after.test.sql`: "get_public_form('phc26') returns the workspace name, the form question and accepting", "submit_public_feedback('phc26') lands in the initial Research as Modulo pubblico" | passa |
| 7 | La migrazione inserisce `first_research_collected` per i workspace con almeno 5 feedback e per nessun altro | S2. `research_after.test.sql`: "first_research_collected is claimed for a workspace with 5 feedback and not for one with 4" | passa |
| 8 | Utente di A e `anon`: 0 righe o permesso negato sulle quattro tabelle di B, senza filtri e per id | S1, S5. `research.test.sql`: "A reads no research of B, unfiltered", "A reads no research of B, by id", "anon cannot read research"; `hypotheses.test.sql`: "A reads no research_hypotheses of B, unfiltered" e "by id", lo stesso per `hypothesis_verdicts` e `verdict_feedback`, "anon cannot read research_hypotheses", "anon cannot read hypothesis_verdicts", "anon cannot read verdict_feedback" | passa |
| 9 | Update e delete su `research` e `research_hypotheses` di B falliscono; insert con workspace di A e Research di B fallisce | S1, S5. `research.test.sql`: "A cannot update a research of B", "A cannot delete a research of B", "a feedback with A's workspace and B's research is refused"; `hypotheses.test.sql`: "A cannot update a hypothesis of B", "A cannot delete a hypothesis of B", "a hypothesis with A's workspace and B's research is refused" | passa |
| 10 | Nessuna scrittura di `authenticated` e `anon` su verdetti e collegamenti; le quattro funzioni solo per `service_role` | S3, S5, S6. `hypotheses.test.sql`: "authenticated cannot insert hypothesis_verdicts", "... update ...", "... delete ...", lo stesso per `verdict_feedback`, "anon cannot insert hypothesis_verdicts", "anon cannot insert verdict_feedback"; `analysis.test.sql`: "authenticated cannot call start_analysis", "authenticated cannot call finish_analysis", "authenticated cannot call fail_analysis", "anon cannot call start_analysis", "anon cannot call finish_analysis"; `verdicts.test.sql`: "authenticated cannot call finish_verdict", "anon cannot call finish_verdict" | passa |
| 11 | `create_research`: `not_a_member` per chi non è membro; per un membro slug valido e unico, modulo acceso, domanda del modulo nulla | S1. `research.test.sql`: "create_research by a non member fails with not_a_member", "create_research makes a unique slug matching the pattern, form enabled and null form question" | passa |
| 12 | `createResearch`: vuota, spazi o oltre 200 caratteri danno `invalid` o `too_long` senza righe; valida crea e porta a `/research/{id}` | S1. `src/app/(app)/research/actions.test.ts`: "empty, blank and 201-character questions return invalid or too_long and create nothing", "a valid question creates the Research and gives its id, where the browser goes" | passa |
| 13 | Con 0 Research: titolo, campo con focus, "Crea la Research", nessun "Nuova Research" | S1. `src/app/(app)/research/page.test.tsx`: "with no Research shows the first-run title, the field and Crea la Research, without Nuova Research"; `e2e/research.spec.ts`: "first run: the question field has the focus and creates the first Research from the keyboard" | passa |
| 14 | Una riga per Research ordinata per attività, numero, domanda come link, stati di DESIGN.md | S1, S11. `src/components/research-row.test.tsx`: "shows the count, the question as a link and each state of DESIGN.md, only the non-zero verdict parts"; `src/app/(app)/research/page.test.tsx`: "orders rows by the latest of creation, last feedback and last analysis" | passa |
| 15 | Barra con "Research" e "Piano"; schede interne; "Sintesi" corrente su `/research/[id]` e sul tema, non sulle altre | S1, S3. `e2e/research.spec.ts`: "the app bar has Research and Piano, and Sintesi is current on the Research and on a theme but not on Chiedi, Feedback, Raccolta" | passa |
| 16 | Senza sessione a `/login`; dopo accesso email, Google e conferma su `/research`; le cinque rotte di oggi rispondono 404 | S1-S4, S12. `e2e/research.spec.ts`: "every path under /research without a session goes to /login", "the themes, ask, feedback, collection and room routes of today answer 404"; `src/app/(auth)/actions.test.ts`: "counts an email sign-up at sign-in, and lands in the app" (redirect `/research`); `src/app/auth/callback/route.test.ts`: "signs in from the confirmation email and lands in the app, tracking an email sign-up", "signs in from Google and lands in the app, tracking a Google sign-up" (entrambi `/research`); `e2e/email-confirmation.spec.ts`: "the default template link lands the user signed in on the Research" | passa |
| 17 | Research di un altro workspace, eliminata o id non uuid: stessa pagina NF, 404 | S1. `e2e/research.spec.ts`: "another workspace's, a deleted and a non-uuid Research show the same not-found page with status 404" | passa |
| 18 | `addHypothesis`: `invalid`, `too_long`, `max_reached`, concorrenza su 4 ipotesi, `session`, nessuna riga | S5. `src/app/(app)/research/[id]/hypotheses.test.ts`: "empty and 201-character hypotheses are invalid or too_long and create nothing", "a sixth hypothesis is max_reached", "two concurrent adds on 4 hypotheses: one saves, the other is max_reached", "without a session returns session and creates nothing"; `hypotheses.test.sql`: "the trigger refuses a sixth hypothesis with max_hypotheses" | passa |
| 19 | `written_at` all'insert, `position` massima più 1 | S5. `hypotheses.test.sql`: "written_at is the insert time and position is the maximum plus 1" | passa |
| 20 | Testo nuovo cancella verdetto e collegamenti e sposta `written_at`; stesso testo non cambia nulla | S5. `hypotheses.test.sql`: "a new text deletes the verdict and moves written_at", "a new text deletes the links of the verdict too", "the same text changes nothing" | passa |
| 21 | Con un'analisi `running` sulla Research insert, update e delete di un'ipotesi falliscono con `analysis_running`; la action dà `busy` con H7 | S6. `hypotheses.test.sql`: "insert of a hypothesis fails with analysis_running during an analysis of its Research", lo stesso per "update" e "delete"; `hypotheses.test.ts`: "analysis_running becomes busy for add, update and delete, and nothing changes"; `src/components/hypothesis-list.test.tsx`: "busy shows H7" | passa |
| 22 | Il modulo di R scrive in R; slug rigenerato dà 404; modulo spento o Free a 100 dà `FormUnavailable` | S1. `src/app/actions.test.ts`: "a public form response lands in the Research of its slug"; `e2e/research.spec.ts`: "a regenerated link answers 404 on the old slug", "a disabled form and a full Free workspace show FormUnavailable" | passa |
| 23 | Raccolta con link e QR di `/f/{slug di R}`; `/research/[id]/qr` scarica quel QR | S1. `e2e/research.spec.ts`: "the Raccolta shows the link and QR of this Research and /qr downloads the QR of its slug" | passa |
| 24 | `/f/[slug]` in italiano col cookie `en`; domanda del modulo o default | S1. `e2e/english.spec.ts`: "/f/phc26 stays in Italian for an English browser that chose English", "the form shows the Research form question, or the default when null" | passa |
| 25 | `addNotes` nella Research con "Intervista", fino a 10.000, `too_long` a 10.001; modulo e CSV restano a 2.000 | S2. `src/app/(app)/research/[id]/collect/actions.test.ts`: "addNotes saves in the open Research with channel Intervista", "10,000 characters pass and 10,001 are too_long", "a 2,001-character CSV row is still refused"; `research.test.sql`: "a 2,001-character public form response is still refused", "a feedback of 10,000 characters is saved", "a feedback of 10,001 characters violates the check" | passa |
| 26 | Free a 100 su tutte le Research: `limit` (N3), righe CSV `over_limit`, ogni modulo `FormUnavailable` | S2. `collect/actions.test.ts`: "at 100 feedback across Research addNotes returns limit and CSV rows are over_limit"; `e2e/research.spec.ts`: "a disabled form and a full Free workspace show FormUnavailable"; `src/app/actions.test.ts`: "keeps rejecting the 101st feedback of a Free workspace" | passa |
| 27 | `import_feedback`: `duplicate` nella stessa Research, `new` se l'uguale sta in un'altra | S2. `research.test.sql`: "a row equal to a feedback of the same Research is duplicate", "the same row is new when the equal feedback is in another Research" | passa |
| 28 | Perimetro: dal più recente, 500 feedback e 1.000.000 di caratteri, niente 90 giorni, solo la Research | S3. `src/lib/analysis.test.ts`: "selectFeedback keeps the 500 most recent of 501", "selectFeedback stops at 1,000,000 characters: 250 of 300 feedback of 4,000", "selectFeedback has no 90-day window"; `synthesize.test.ts`: "the prompt holds no feedback of another Research" | passa |
| 29 | Perimetro parziale: "Analizza i {n} feedback più recenti" con "su {totale} di questa Research", n dal server | S3. `src/components/analyze-button.test.tsx`: "partial perimeter: the label and the note carry n from the server and the Research total" | passa |
| 30 | Titoli, priorità e stato dall'ultima analisi dei temi `done` della stessa Research | S3. `synthesize.test.ts`: "existing titles come from the last done themes analysis of the same Research"; `analysis.test.sql`: "finish_analysis inherits priority and status only from the same Research" | passa |
| 31 | Riga "Dall'analisi del {data}…" e variazione per tema sull'analisi precedente della stessa Research; nessuna riga alla prima | S3. `src/lib/data.test.ts`: "what changed compares with the previous themes analysis of the same Research" (con `changes` nullo alla prima analisi); `src/components/theme-row.test.tsx`: "shows +{k} dal {data} or Nuovo"; `e2e/research.spec.ts`: "the Sintesi analyzes the Research and says what changed since the analysis before" (nessuna riga alla prima) | passa |
| 32 | Con ipotesi un clic riserva `themes` e `verdict` nella stessa transazione e fa due chiamate; senza, una riga e una chiamata | S6. `synthesize.test.ts`: "with hypotheses one click reserves themes and verdict together and calls the model twice", "without hypotheses one themes row and one call" | passa |
| 33 | `start_analysis` e la quota: non fallite più richieste, tetto delle fallite; Free 1 usata passa, 2 usate no | S3. `analysis.test.sql`: "limit when the done ones plus the requested exceed the plan", "limit when the failed ones reach the plan", "Free with 1 used: themes and verdict pass", "Free with 2 used: a request of 2 does not" | passa |
| 34 | `busy` con una `running` in qualunque Research, 0 chiamate; oltre 10 minuti `stale` | S3. `analysis.test.sql`: "a running analysis in any Research of the workspace makes start_analysis busy", "a running row older than 10 minutes does not block", "it is failed as stale"; `synthesize.test.ts`: "busy with an analysis running in another Research: no model call" | passa |
| 35 | Esiti per parte: S5 (conta 1), S6 (conta 1), S7 (conta 0) | S6. `synthesize.test.ts`: "themes fail and verdict succeeds: S5 and usage 1", "verdict fails and themes succeed: S6 and usage 1", "both fail: S7 and usage 0" | passa |
| 36 | Chiamate insieme, 240.000 ms e 16.000 token ciascuna; `maxDuration` 300 | S3, S6. `synthesize.test.ts`: "both calls start together with a 240,000 ms timeout and 16,000 output tokens"; `docs.test.ts`: "the Research page exports maxDuration 300" | passa |
| 37 | Istruzioni solo in `instructions`; ipotesi e feedback nei blocchi dati con `<` codificato; chiusura una volta sola | S6. `src/lib/verdict.test.ts`: "instructions only in instructions, hypotheses and feedback as JSON in their data blocks with < encoded", "a hypothesis closing its block cannot leave it" | passa |
| 38 | Ragionamento nella lingua dell'avvio ("English", "Italian"); parola del verdetto dal catalogo | S6, S7. `verdict.test.ts`: "instructions ask for English with en and Italian with it"; `hypothesis-list.test.tsx`: "the verdict word comes from research.verdict, not from the model" | passa |
| 39 | `checkVerdicts`, un test per motivo (9 test) | S6. `verdict.test.ts`: "drops unknown_hypothesis", "drops duplicate_hypothesis", "drops unknown_feedback", "removes feedback_on_both_sides from both sides", "drops quote_not_linked", "drops quote_not_in_feedback, empty and inexact", "drops second_quote_same_feedback", "drops too_many_quotes, fourth for and third against", "a stance outside for and against fails the verdict part" | passa |
| 40 | `verdict_without_quotes` porta a `to_review`; ipotesi assente tiene il verdetto precedente con `missing_hypothesis` | S6. `verdict.test.ts`: "confirmed or refuted without verified quotes of its side becomes to_review", "a hypothesis missing from the output keeps its previous verdict with missing_hypothesis" | passa |
| 41 | `finish_verdict`: `strpos`, feedback eliminati, `to_review` senza citazioni del suo lato | S6. `verdicts.test.sql`: "a quote not in the saved text raises quote_not_in_feedback", "links and quotes of deleted feedback are dropped, and the ranks close the gap", "a confirmed left without quotes for is saved to_review", "a refused left without quotes of its side is saved to_review" | passa |
| 42 | Parola, conteggi, ragionamento come testo, fino a 3 "A favore" e 2 "Contro" con canale e data senza cliente | S7. `hypothesis-list.test.tsx`: "shows the word, counts from verdict_feedback and the read count, the reasoning, up to 3 for and 2 against with channel and date and no customer name" | passa |
| 43 | V1 o V2; "Dopo questo verdetto sono arrivati {k} feedback."; caso 29 di 37 | S7. `src/lib/data.test.ts`: "a hypothesis written after 29 of 37 feedback reads 8 arrived after"; `hypothesis-list.test.tsx`: "Dei 37 feedback letti, 8 sono arrivati dopo.", "V2 when none arrived after", "Dopo questo verdetto sono arrivati {k} feedback." | passa |
| 44 | 1 analisi rimasta e ipotesi: "Analizza solo i temi…", S4, solo `themes`, anche con richiesta completa dal browser | S9. `synthesize.test.ts`: "with 1 analysis left and hypotheses the server reserves only themes, even when asked for both"; `analyze-button.test.tsx`: "one analysis left with hypotheses: themes-only label and S4" | passa |
| 45 | "Solo il verdetto" solo alle sue condizioni; riserva una riga `verdict` per tutte le ipotesi | S9. `hypothesis-list.test.tsx`: "shows only when a hypothesis lacks a verdict or has newer feedback and nothing is newer than the last themes analysis"; `synthesize.test.ts`: "verdict only reserves one verdict row and redoes every hypothesis"; `e2e/research.spec.ts`: "Solo il verdetto: after the themes, a new hypothesis gets its verdict for 1 analysis" | passa |
| 46 | Ragionamento, titoli e sintesi come testo; nessun `dangerouslySetInnerHTML` sotto `research` | S7. `hypothesis-list.test.tsx`: "a reasoning with <b>x</b> and **x** shows those characters"; `docs.test.ts`: "no dangerouslySetInnerHTML under src/app/(app)/research" | passa |
| 47 | Nessun collegamento: "Da rivedere" con "Nessuno dei {n} feedback letti ne parla." e senza ragionamento | S7. `hypothesis-list.test.tsx`: "no links: Da rivedere, Nessuno dei {n} feedback letti ne parla. and no reasoning" | passa |
| 48 | Una riga di `analysis_runs` per riga di `analyses`, anche `verdict`, con input e chiusura completi | S3, S6. `synthesize.test.ts`: "every analyses row has its analysis_runs row: the verdict with model, instructions, prompt, feedback and hypothesis ids in order", "saves themes, links, quotes, sentiment and the run log", "a verdict out of schema fails the verdict part and keeps the raw text"; `verdicts.test.sql`: "the verdict row is done and its run log closed" | passa |
| 49 | Errore del modello nel verdetto: `console.error` con solo nome e id, mai il marcatore | S6. `synthesize.test.ts`: "a verdict model error logs only the error name and the analysis id, never the marker" | passa |
| 50 | Chiedi: solo la Research, perimetro di AC 28, `questions.research_id`, quota del workspace, `no_feedback` verso la Raccolta | S4. `src/app/(app)/research/[id]/ask/actions.test.ts`: "sends only this Research's feedback with the analysis perimeter", "saves questions.research_id and counts in the workspace quota", "no feedback in the Research returns no_feedback"; `ask/page.test.tsx`: "no feedback: the action goes to /research/{id}/collect" | passa |
| 51 | Niente 90 giorni: "Letti {n} feedback di questa Research."; `titleOld` e `bodyOld` spariti | S4. `src/components/ask-answer.test.tsx`: "shows heading, count, text, quotes with channel and date and the perimeter", "over 500 feedback in the Research: the partial perimeter"; `docs.test.ts`: "no catalog has ask.nothingToAsk.titleOld or bodyOld, and no ask string names the 90 days" | passa |
| 52 | Sala: domanda e QR della Research, solo le risposte del suo modulo, "Analizza le risposte" solo temi con la nota | S10. `e2e/room.spec.ts`: "the room of a Research shows its form question and QR and counts only its public form responses", "Analizza le risposte reserves only themes and says where the verdict is"; `synthesize.test.ts`: "room mode reserves only themes with hypotheses" | passa |
| 53 | Research eliminata a sala aperta: `/sala/status` 404, R1 al posto del QR | S10. `e2e/room.spec.ts`: "a Research deleted while the room is open: status 404 and R1 instead of the QR" | passa |
| 54 | Analisi finite: pulsanti `aria-disabled` con la nota del piano; invio forzato `limit`, 0 chiamate | S9, S10. `analyze-button.test.tsx`: "analyses used up: aria-disabled, not disabled, with the note of the plan"; `hypothesis-list.test.tsx`: "Solo il verdetto off with the same note"; `synthesize.test.ts`: "verdict only with the analyses used up: a forced submit gets limit from the database and makes no model call", "with no analysis left and hypotheses: limit, no call", "room mode with the analyses used up: limit from the database and no model call"; `room-screen.test.tsx`: "the room button is off with the quota note, aria-disabled so the focus stays on it"; `e2e/room.spec.ts`: "the room button is off with the quota note" | passa |
| 55 | `/billing` e landing: "Il verdetto delle ipotesi usa 1 analisi" (EN) in Free e Pro | S9. `src/test/plan-pages.test.tsx`: "billing and landing show the verdict line in Free and Pro, in Italian and English" | passa |
| 56 | `deleteResearch`: cancella tutto; `analyses` e `questions` restano con `research_id` nullo e contano; registri senza testi | S11. `research.test.sql`: "deleting a Research deletes its feedback, themes, hypotheses, verdicts and links, and nothing of another Research", "its analyses and questions stay with a null research_id", "the analyses of a deleted Research still count in the month", "their analysis runs lose input, output and issues, and keep model and tokens", "their question runs lose input, output and issues, and keep the tokens" | passa |
| 57 | Dopo l'eliminazione `/research` con "Research eliminata."; ultima Research: F1 | S11. `e2e/research.spec.ts`: "deleting a Research lands on /research with Research eliminata., and on the first run after the last one", "the Raccolta without a session: the notes and the deletion say E-SESS instead of leaving for /login" (S12); `src/app/(app)/research/actions.test.ts`: "deleteResearch returns failed for another workspace's Research or a wrong id, and deletes nothing", "deleteResearch without a session returns session and deletes nothing" | passa |
| 58 | Analisi `running` di una Research eliminata: `failed` con `research_deleted`, niente temi né verdetti | S6, S11. `analysis.test.sql`: "finish_analysis on a deleted Research fails with research_deleted", "and saves no theme: the server then fails the row"; `verdicts.test.sql`: "finish_verdict on a deleted Research fails with research_deleted", "and saves nothing: the server then fails the row"; `synthesize.test.ts`: "both parts fail with research_deleted: no theme, no verdict, no text in the logs, nothing counted" | passa |
| 59 | `updateResearchQuestion` cambia solo la domanda; i prompt non la contengono | S11. `research/actions.test.ts`: "updating the question keeps themes, hypotheses and verdicts"; `synthesize.test.ts`: "neither the themes nor the verdict prompt contains the Research question" | passa |
| 60 | `pnpm evals` su `verdicts.json`: almeno 17 su 20, tutti i must-pass, G1 a 0; risultato in `evals/results/` | S8. Eval `evals/verdicts.eval.ts` su `evals/verdicts.json`: soglia 85% (17 su 20); must-pass v06, v07, v09, v11, v12, v13, v14, v15; G1 su tutti i 20 casi; confronto col run precedente | non eseguito: manca `ANTHROPIC_API_KEY` (codice provato con modello finto in `evals/verdicts.test.ts`) |
| 61 | Dopo il cambio del perimetro, evals di analisi e Chiedi non sotto l'ultimo risultato di prima, must-pass di Chiedi passati | S0, S12. Eval `evals/analysis.eval.ts` ed `evals/questions.eval.ts`: run su `edac3cf` (S0), rilancio dopo S3 e S4 (S12), confronto dei due file in `evals/results/` | non eseguito: manca `ANTHROPIC_API_KEY`, e manca il run di partenza su `edac3cf` (S0) |
| 62 | Il feedback che porta una Research a 5 manda una sola `first_research_collected`, da modulo, note o CSV; il sesto e il quinto di un'altra no | S2. `src/app/(app)/research/[id]/analytics.test.ts`: "the feedback that brings a Research to 5 sends it once, from the notes", "... from the public form", "... from the CSV", "the sixth and a second Research's fifth send nothing" | passa |
| 63 | Una sola `research_synthesized` per `synthesize` con una parte `done`, proprietà esatte; nessuna se falliscono entrambe | S3, S6, S10. `research/[id]/analytics.test.ts`: "one per synthesize with a done part, with exactly its properties", "none when the themes part fails or finds no theme, nor when nothing ran", "none when both parts fail" | passa |
| 64 | `feedback_count`, `citation_count`, `hypothesis_count` (0 per temi soli, sala e S4) | S3, S6, S10. `research/[id]/analytics.test.ts`: "citation_count adds the verdict quotes saved, hypothesis_count the hypotheses with a saved verdict", "a failed verdict counts no hypothesis and none of its quotes", "the room with hypotheses: one research_synthesized with the themes' quotes and hypothesis_count 0", "one analysis left with hypotheses (S4): the themes alone, hypothesis_count 0" (aggiunto in revisione, `c19db6a`) | passa |
| 65 | `first_analysis_completed` alla prima analisi dei temi con un tema, una volta per workspace; non per il solo verdetto | S3, S9. `research/[id]/analytics.test.ts`: "the first themes analysis with a theme in any Research sends it once", "a verdict-only synthesis does not send it, and sends research_synthesized with its hypotheses", "themes failed and verdict done: one research_synthesized, no first_analysis_completed" | passa |
| 66 | Vincolo delle milestone con `first_research_collected`; `Milestone` e `RepeatedEvent` con i due eventi | S2, S3. `research.test.sql`: "analytics_milestones accepts first_research_collected"; `src/lib/analytics.test.ts`: "Milestone carries first_research_collected, with no properties", "RepeatedEvent carries research_synthesized with its three counts" | passa |
| 67 | Marcatore in domanda, ipotesi, feedback e ragionamento assente dal corpo verso PostHog | S2, S6. `research/[id]/analytics.test.ts`: "no question, hypothesis, feedback or reasoning text reaches PostHog" | passa |
| 68 | `docs/analytics.md` con i due eventi, proprietà, momento d'invio e la query HogQL | S12. `docs.test.ts`: "documents first_research_collected and research_synthesized with properties, timing and the HogQL query of the metric", "first_analysis_completed is the first themes analysis in any Research, and the milestones table accepts five events" | passa |
| 69 | Chiavi uguali in IT ed EN con gli stessi segnaposto; nessuna frase italiana di DESIGN.md nelle pagine rese in inglese | Ogni slice, S12. `src/i18n/messages.test.ts`: "has exactly the keys of the Italian one", "uses the same placeholders and tags in every message"; `src/test/english-render.test.tsx` (S12): "{pagina}: rendered with the en catalog, contains none of the Italian sentences of DESIGN.md" per 11 pagine (`/research` primo accesso ed elenco, `/research/new`, NF, Sintesi con temi, ipotesi e verdetti, Sintesi senza feedback, Raccolta, Feedback, tema, Chiedi, sala), ciascuna rifatta in italiano per provare che il controllo trova le frasi; "finds enough Italian sentences in the catalog to check" | passa |
| 70 | E2E solo da tastiera: registrazione, primo accesso, Research, 5 note, ipotesi, "Analizza 5 feedback", verdetto con citazione e conteggi, temi, focus sul pulsante | S7. `e2e/main-flow.spec.ts` (riscritto): "sign up, create a Research, paste 5 notes, write a hypothesis, analyze and read the verdict from the keyboard" | passa |
| 71 | `english.spec.ts` riscritto: `/f/phc26` in italiano con lo slug su una Research | S1. `e2e/english.spec.ts`: "/f/phc26 stays in Italian for an English browser that chose English" | passa |
| 72 | Seed con un workspace, due Research, una con 2 ipotesi e verdetti, una senza; reset senza errori | S1, S12. `research.test.sql`: "the seed has a workspace with two Research, one with 2 hypotheses and their verdicts, one without", "every quote of a seed verdict is an exact substring of its feedback", "after reset with the seed no feedback lacks a research"; output di `voce-research-db.sh reset` in "Test output" | passa |
| 73 | Con output: typecheck, lint, test, build, reset, test del database, evals, E2E | S12. Esecuzione completa in "Test output": `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `voce-research-db.sh reset`, `voce-research-db.sh test`, `voce-research-db.sh migration-test`, `pnpm evals`, `caffeinate -i pnpm test:e2e` | passa, tranne `pnpm evals` (non eseguito, manca la chiave) |

**Criteri senza test pianificato: nessuno.** Tre hanno una parte che non è un'asserzione su comportamento, dichiarata:

- **AC 1**, "nello stesso file": `docs.test.ts` legge il file della migrazione; "da zero senza errori" è l'output del reset.
- **AC 68**: un test che legge il documento dice che le parole ci sono, non che la query sia giusta; la revisione di S12 la rilegge contro `02-definition.md`.
- **AC 73** è un criterio di processo: il suo test è l'esecuzione dei comandi con output incollato.

**Due criteri dipendono da fuori:** AC 60 e AC 61 non si possono eseguire senza P1. Se la chiave non arriva, la costruzione finisce con quei due criteri non eseguiti e il gate 5.5 fallito: è il blocco, non un rinvio del piano.

**Evidenza per la strumentazione.** `POSTHOG_KEY` non è configurata qui e non c'è `analytics.query`. La prova di AC 62-67 sarà la richiesta costruita davvero da `trackMilestone` e `trackEvent` e catturata da un `fetch` finto nei test, con il corpo incollato, etichettata con un tag `code` sul file di test: evidenza più debole di un arrivo in PostHog. La verifica in PostHog UE resta alla fase 6.

## Controllo dello scope da preparare

Voci fuori scope che una slice potrebbe tirare dentro "già che c'è", da controllare sul diff in S12:

| Voce fuori scope | Slice a rischio | Cosa guardare nel diff |
|---|---|---|
| Reindirizzamenti dalle rotte di oggi | S1, S2, S3, S4 | nessun `redirect` o `rewrites` da `/themes`, `/ask`, `/feedback`, `/collect`, `/sala` |
| Colonne del modulo sul workspace, feedback senza Research | S1 | nessun `form_` su `workspaces`, nessun percorso con `research_id` facoltativo |
| Quote per Research, limite al numero di Research | S3, S9 | quota letta solo per workspace; nessun conteggio di Research in `start_analysis` o `create_research` |
| Sintesi o verdetto automatici all'arrivo di feedback | S2, S6 | nessun trigger o job che chiama `synthesize` |
| Cronologia dei verdetti | S6, S7 | `hypothesis_verdicts` con pk sull'ipotesi, nessuna tabella di storico |
| Verdetto in sala | S10 | la sala non legge `hypothesis_verdicts` né `verdict_feedback` |
| Più di 5 ipotesi, ipotesi alla creazione | S1, S5 | `ResearchForm` con un solo campo; `MAX_HYPOTHESES = 5` |
| Bozze non salvate | S2, S5 | niente `localStorage` o `sessionStorage` nei campi |
| Spostare, duplicare, archiviare una Research | S11 | solo modifica della domanda ed eliminazione |
| Layout per telefono delle pagine della Research | S1, S7 | nessun lavoro responsive oltre al kit di oggi |
| Testo negli analytics | S2, S3, S6 | test del marcatore (AC 67) |
| Lingua del modulo per Research, prompt modificabile, parola "voci" | S1, S6 | `PUBLIC_FORM_LOCALE` invariato, istruzioni costanti, cataloghi con "feedback" |

## Test output

Esecuzione completa del 2026-09-28 tra le 23:50 e le 00:00 CEST, sul codice di S12 prima del commit (albero con le modifiche di S12, base `cad928f`), stack isolato `voce-research`, porte 3000 e 4010 libere (`lsof -i :3000 -i :4010` vuoto). Ordine: reset, test del database, test della migrazione, typecheck, lint, unit test, build, E2E. `pnpm test` è `vitest run`: qui lanciato come `pnpm exec vitest run`.

```
$ /Users/mariomiletta/.cache/voce-research-db.sh reset
Applying migration 20261001090000_research.sql...
Seeding data from supabase/seed.sql...
Restarting containers...
Finished supabase db reset on branch main.
{"target":"local","version":"","message":"Reset local database."}
/Users/mariomiletta/.cache/voce-research-db.sh reset  1.05s user 0.57s system 6% cpu 25.127 total
```

```
$ /Users/mariomiletta/.cache/voce-research-db.sh test
/Users/mariomiletta/.cache/voce-research-db/supabase/tests/analysis.test.sql ................ ok
/Users/mariomiletta/.cache/voce-research-db/supabase/tests/feedback_delete_policy.test.sql .. ok
/Users/mariomiletta/.cache/voce-research-db/supabase/tests/hypotheses.test.sql .............. ok
/Users/mariomiletta/.cache/voce-research-db/supabase/tests/questions.test.sql ............... ok
/Users/mariomiletta/.cache/voce-research-db/supabase/tests/research.test.sql ................ ok
/Users/mariomiletta/.cache/voce-research-db/supabase/tests/verdicts.test.sql ................ ok
All tests successful.
Files=6, Tests=185,  0 wallclock secs ( 0.02 usr  0.00 sys +  0.02 cusr  0.01 csys =  0.05 CPU)
Result: PASS
/Users/mariomiletta/.cache/voce-research-db.sh test  0.33s user 0.06s system 43% cpu 0.907 total
```

```
$ /Users/mariomiletta/.cache/voce-research-db.sh migration-test
Resetting local database to version: 20260927120000
Finished supabase db reset on branch main.
{"applied":["/Users/mariomiletta/.cache/voce-research-db/supabase/migrations/20261001090000_research.sql"],"message":"Migrations applied"}
/Users/mariomiletta/.cache/voce-research-db/supabase/migration-tests/research_after.test.sql .. ok
All tests successful.
Files=1, Tests=12,  0 wallclock secs ( 0.01 usr +  0.00 sys =  0.01 CPU)
Result: PASS
Resetting local database...
Finished supabase db reset on branch main.
/Users/mariomiletta/.cache/voce-research-db.sh migration-test  3.33s user 1.16s system 8% cpu 52.645 total
```

```
$ pnpm typecheck
> voce@0.1.0 typecheck /Users/mariomiletta/Dev Projects/voce-research
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully
pnpm typecheck  3.38s user 0.29s system 188% cpu 1.950 total
```

Il primo giro di typecheck ha trovato un errore mio di S12 (`hypothesis-list.tsx`, `verdictOnly` non ristretto dopo `canVerdictOnly`), corretto; l'output sopra è del giro dopo, e lint, unit test, build ed E2E sotto sono tutti successivi alla correzione.

```
$ pnpm lint
> voce@0.1.0 lint /Users/mariomiletta/Dev Projects/voce-research
> eslint

pnpm lint  7.82s user 0.54s system 211% cpu 3.948 total
```

```
$ pnpm exec vitest run
 Test Files  46 passed (46)
      Tests  572 passed (572)
   Start at  23:54:04
   Duration  5.90s (tests 77%, import 14%, transform 9%)

pnpm exec vitest run  14.44s user 2.74s system 272% cpu 6.305 total
```

```
$ pnpm build
✓ Compiled successfully in 1915ms
  Finished TypeScript in 4.5s ...
✓ Generating static pages using 11 workers (11/11) in 158ms
Route (app)
├ ƒ /research
├ ƒ /research/[id]
├ ƒ /research/[id]/ask
├ ƒ /research/[id]/collect
├ ƒ /research/[id]/feedback
├ ƒ /research/[id]/qr
├ ƒ /research/[id]/sala
├ ƒ /research/[id]/sala/status
├ ƒ /research/[id]/themes/[themeId]
├ ƒ /research/new
(nessuna rotta /themes, /ask, /feedback, /collect, /sala)
pnpm build  11.12s user 3.02s system 158% cpu 8.901 total
```

```
$ caffeinate -i pnpm test:e2e
Running 63 tests using 6 workers
[WebServer] Question f228d0fc-3b22-43e5-b473-6373e34c02d1 failed: AI_NoObjectGeneratedError
[WebServer] Analysis 7a623a83-d6b5-472b-917d-66344066f035 failed: AI_NoObjectGeneratedError
  63 passed (1.2m)
caffeinate -i pnpm test:e2e  89.66s user 19.59s system 147% cpu 1:13.97 total
```

Le due righe `[WebServer] ... failed` sono i casi d'errore voluti dei test (risposta fuori schema della finta API). Il giro completo prima di questo aveva 62 passati e 1 fallito: "deleting a Research lands on /research…" (S11) cercava il titolo con `getByText`, che trovava anche l'annunciatore di rotta di Next con lo stesso testo (violazione di strict mode). Corretto in S12 cercando l'h1; il giro sopra è quello dopo la correzione.

```
$ pnpm evals
non eseguito: manca ANTHROPIC_API_KEY in .env.local (P1). Vedi "Eval results".
```

**Riassunto:** reset da zero con seed senza errori; pgTAP 185 su 185 in 6 file; test della migrazione 12 su 12; typecheck 0 errori; lint 0 problemi; vitest 572 su 572 in 46 file (baseline: 375 in 33); build riuscita con le sole rotte della Research; E2E 63 su 63 (baseline: 36). `pnpm evals` non eseguito.

## Instrumentation

**Nessun ambiente PostHog reale.** `POSTHOG_KEY` non è configurata qui e non c'è accesso a PostHog UE: l'evidenza sotto è **codice** (`src/app/(app)/research/[id]/analytics.test.ts` sul codice di `src/lib/analytics.ts` `[code:src/lib/analytics.ts]`), cioè il corpo della richiesta costruito davvero da `trackMilestone` e `trackEvent` (`src/lib/analytics.ts`) dopo le vere action (`addNotes`, `synthesize`) contro il database locale, catturato da un `fetch` finto sull'URL `https://eu.i.posthog.com/i/v0/e/` con la chiave di prova `phc_test`. Non dice che PostHog li riceva: la verifica in PostHog UE resta alla fase 6.

Come sono stati catturati: una stampa temporanea in `afterEach` di `analytics.test.ts` (tolta subito dopo, il file è quello del commit), su tre test: `pnpm exec vitest run "src/app/(app)/research/[id]/analytics.test.ts" -t "sends it once, from the notes|citation_count adds the verdict quotes|the first themes analysis with a theme in any Research sends it once" --reporter=verbose` → 3 passati.

| Evento | Proprietà attese (spec) | Emette | Test che lo asserisce | Evidenza |
|---|---|---|---|---|
| `first_research_collected` | nessuna oltre `$process_person_profile`, `$geoip_disable`; una volta per workspace, al feedback che porta una Research a 5 | yes, in codice (non un ambiente PostHog reale) | "the feedback that brings a Research to 5 sends it once, from the notes", "... from the public form", "... from the CSV", "the sixth and a second Research's fifth send nothing", "no question or feedback text reaches PostHog" | corpo catturato: `{"api_key":"phc_test","event":"first_research_collected","distinct_id":"714c0f81-0226-4f5d-857b-403a028db4fa","timestamp":"2026-09-28T21:57:31.347Z","properties":{"$process_person_profile":false,"$geoip_disable":true}}` (quinta nota; la quarta non ne manda) `[code:src/lib/analytics.ts]` |
| `research_synthesized` | `feedback_count`, `citation_count`, `hypothesis_count` e le due di sistema, niente altro | yes, in codice (non un ambiente PostHog reale) | "one per synthesize with a done part, with exactly its properties", "citation_count adds the verdict quotes saved, hypothesis_count the hypotheses with a saved verdict", "the room with hypotheses: one research_synthesized with the themes' quotes and hypothesis_count 0", "none when both parts fail", "no question, hypothesis, feedback or reasoning text reaches PostHog" | corpo catturato: `{"api_key":"phc_test","event":"research_synthesized","distinct_id":"714c0f81-0226-4f5d-857b-403a028db4fa","timestamp":"2026-09-28T21:57:31.390Z","properties":{"feedback_count":5,"citation_count":5,"hypothesis_count":2,"$process_person_profile":false,"$geoip_disable":true}}` (temi e verdetto di 2 ipotesi); solo temi: `{"...","properties":{"feedback_count":5,"citation_count":3,"hypothesis_count":0,"$process_person_profile":false,"$geoip_disable":true}}` `[code:src/lib/analytics.ts]` |
| `first_analysis_completed` | `feedback_count`, `theme_count`; prima analisi dei temi con un tema in qualunque Research, una volta per workspace, non per il solo verdetto | yes, in codice (non un ambiente PostHog reale) | "the first themes analysis with a theme in any Research sends it once", "a verdict-only synthesis does not send it, and sends research_synthesized with its hypotheses", "themes failed and verdict done: one research_synthesized, no first_analysis_completed" | corpo catturato: `{"api_key":"phc_test","event":"first_analysis_completed","distinct_id":"714c0f81-0226-4f5d-857b-403a028db4fa","timestamp":"2026-09-28T21:57:31.433Z","properties":{"feedback_count":5,"theme_count":2,"$process_person_profile":false,"$geoip_disable":true}}`; nello stesso test tre sintesi su due Research mandano tre `research_synthesized` e un solo `first_analysis_completed` `[code:src/lib/analytics.ts]` |

Nessun testo nei corpi: i test col marcatore (AC 67) lo cercano in ogni corpo e non lo trovano. Documentazione degli eventi e della query della metrica in `docs/analytics.md` (AC 68). Da fare in fase 6: `POSTHOG_KEY` in Production (Mario) e un primo evento visto arrivare in PostHog UE.

## Eval results

**Non eseguite: manca `ANTHROPIC_API_KEY`** (P1). Nessun `.env.local` dei worktree ha la chiave e questa costruzione non ne ha usata né cercata una. Nessun run col modello vero, quindi:

- **AC 60** (verdetto: almeno 17 su 20, must-pass v06, v07, v09, v11, v12, v13, v14, v15, G1 a 0): non eseguito. Il codice (`evals/verdicts.eval.ts`, `evals/verdicts.ts`) è provato con un modello finto in `evals/verdicts.test.ts`.
- **AC 61** (temi e Chiedi non sotto il risultato di prima del cambio del perimetro): non eseguibile nemmeno con la chiave finché non c'è il run di partenza di S0 sul codice di `edac3cf`. `evals/results/` non esiste.

Comandi esatti, nell'ordine, con la chiave in `.env.local` di questo worktree:

```bash
# 1. S0: run di partenza sul codice di prima del perimetro nuovo (temi e Chiedi), in un worktree temporaneo
git -C "/Users/mariomiletta/Dev Projects/voce-research" worktree add /tmp/voce-edac3cf edac3cf
cp "/Users/mariomiletta/Dev Projects/voce-research/evals/"{analysis.eval.ts,questions.eval.ts,questions.ts,shared.ts,questions.json} /tmp/voce-edac3cf/evals/   # su edac3cf questions.eval.ts non esisteva (P6)
cp "/Users/mariomiletta/Dev Projects/voce-research/.env.local" /tmp/voce-edac3cf/ && cd /tmp/voce-edac3cf && pnpm install && pnpm evals
# 2. il run di adesso, sul codice di feat/research: verdetto, temi, Chiedi, ciascuno col confronto col proprio precedente in evals/results/
cd "/Users/mariomiletta/Dev Projects/voce-research" && pnpm evals
```

Il passo 1 non è provato: le evals di adesso importano `runAnalysis` da `src/lib/analysis.ts` e `runQuestion` da `src/lib/questions.ts`, che su `edac3cf` avevano firme di prima della Research. Se `pnpm evals` non compila nel worktree temporaneo, i due file di evals vanno adattati a quelle firme (il salvataggio in `evals/results/{eval}-{data}.json` è di S8). Poi si copiano i due file di risultato in `evals/results/` di questo worktree prima del passo 2, così il confronto li trova. Esito da incollare qui: quota di casi passati per eval, must-pass, violazioni di G1, confronto col file precedente.

## Scope check

Diff `edac3cf..` (S1-S12, 114 file in `src/` più migrazione, test, documenti) letto contro le 22 voci fuori scope di `04-spec.md`. Nessuna voce costruita.

| Voce fuori scope | Costruita | Dove ho controllato |
|---|---|---|
| 1. Sintesi o verdetto che si aggiornano da soli | no, non costruito | `synthesize(` compare solo in `src/app/(app)/research/[id]/actions.ts` e nei componenti che lo chiamano al clic (`analyze-button.tsx`, `hypothesis-list.tsx`, `room-screen.tsx`); nessun trigger, `pg_cron` o `pg_net` nella migrazione |
| 2. Survey builder | no, non costruito | modulo pubblico con una sola domanda (`research.form_question`), `src/components/public-form.tsx` invariato nella forma |
| 3. Condivisione, inviti, team | no, non costruito | nessuna tabella o action di inviti; `workspace_members` invariata; grep di `invite`/`share` in `src/app`, `src/lib`: solo commenti |
| 4. Pianificazione, registrazione, trascrizione delle interviste | no, non costruito | le note si incollano (`addNotes`); nessun `MediaRecorder`, `getUserMedia`, trascrizione in `src` |
| 5. Reclutamento dei partecipanti | no, non costruito | nessuna funzione o pagina |
| 6. Quote per Research | no, non costruito | `start_analysis` conta le righe di `analyses` per workspace contro `private.analyses_limit(ws)` (migrazione, righe 403-404); `start_question` invariata nella quota; limite Free dei feedback sul workspace |
| 7. Limite al numero di Research | no, non costruito | `create_research` (migrazione, righe 132-161) non conta le Research |
| 8. Ipotesi alla creazione della Research | no, non costruito | `src/components/research-form.tsx` ha il solo campo della domanda |
| 9. Più di 5 ipotesi | no, non costruito | `MAX_HYPOTHESES = 5` in `src/lib/plans.ts`; trigger `max_hypotheses` |
| 10. Cronologia dei verdetti | no, non costruito | `hypothesis_verdicts` con pk su `hypothesis_id`; le tabelle create sono solo `research`, `research_hypotheses`, `hypothesis_verdicts`, `verdict_feedback` |
| 11. Verdetto in sala | no, non costruito | la sala legge solo `countHypotheses` per la nota "Il verdetto delle ipotesi lo trovi nella Research." (`src/app/research/[id]/sala/page.tsx`, `room-screen.tsx`); nessuna lettura di `hypothesis_verdicts` o `verdict_feedback` |
| 12. Spostare un feedback, duplicare o archiviare una Research | no, non costruito | action della Research: solo `createResearch`, `updateResearchQuestion`, `deleteResearch` (`src/app/(app)/research/actions.ts`) |
| 13. Bozze non salvate | no, non costruito | nessun `localStorage` o `sessionStorage` in `src` |
| 14. Reindirizzamenti dalle rotte di oggi | no, non costruito | nessun `redirects`/`rewrites` in `next.config.ts`; `src/app/(app)` ha solo `billing` e `research`; build senza quelle rotte; E2E "the themes, ask, feedback, collection and room routes of today answer 404" |
| 15. Colonne del modulo sul workspace, feedback senza Research | no, non costruito | `form_slug` nei tipi solo sotto `research`; `feedback.research_id` non nullo (pgTAP "a feedback without research_id violates not null"); `research_id` nullo solo su `analyses`, `questions` e viste, come da spec |
| 16. Ricerca semantica o indice vettoriale | no, non costruito | nessun `embedding`, `vector`, `pgvector` in `src` o migrazioni; perimetro per numero e caratteri in `selectFeedback` |
| 17. Lingua del modulo per Research | no, non costruito | `PUBLIC_FORM_LOCALE` costante in `src/i18n/locale.ts`, nessuna colonna di lingua su `research` |
| 18. Parola "voci" nell'interfaccia | no, non costruito | nessun "voci" nei cataloghi `src/i18n/messages/*/*.json` |
| 19. Prompt del verdetto modificabile dal PM | no, non costruito | `verdictInstructions(locale)` costante in `src/lib/verdict.ts`, nessun campo o colonna per istruzioni |
| 20. Testo negli analytics | no, non costruito | proprietà solo conteggi (`src/lib/analytics.ts`); test del marcatore in `research/[id]/analytics.test.ts` (AC 67) |
| 21. Layout per telefono delle pagine della Research | no, non costruito | nessun lavoro responsive oltre al kit: pagine con larghezze fisse del kit, nessuna variante per schermi piccoli aggiunta |
| 22. Migrazione in produzione prima del 2026-10-01 | no, non costruito | nessun `supabase db push`, nessun deploy, nessun push del branch; migrazione applicata solo allo stack isolato locale |

Due correzioni di S12 toccano comportamento dentro lo scope, non fuori: il proxy lascia passare senza sessione le action della Raccolta (E-SESS di note ed eliminazione, difetto di S11) e S6 ha una seconda frase quando "Solo il verdetto" non c'è (difetto di S9). Sono in "Deviations from spec".

## Deviations from spec

Previste dal piano, da confermare a fine costruzione:

- **AC 3, 4, 6, 7 non girano in `supabase test db`.** La spec dice "in un test pgTAP"; restano pgTAP, ma in `supabase/migration-tests/` lanciati da `voce-research-db.sh migration-test` (P3), perché lo stato "prima della migrazione" non esiste nel database su cui gira `supabase/tests/`. In CI li lancia un passo apposta di `.github/workflows/ci.yml` (`bash supabase/migration-tests/run.sh`); il piano diceva per errore che il repository non avesse CI.
- **`supabase db reset` e `supabase test db` di AC 1, 2, 72, 73** si eseguono con lo script dello stack isolato, che li lancia con `--workdir` sulla copia di `supabase/`: stesso comando, altro stack.
- **Una riga di `e2e/helpers.ts` (P2)** cambia prima di S1 per ricavare la porta di Mailpit: codice di test, nessun criterio lo chiede, senza di essa 4 E2E di oggi e AC 70 non possono passare in questo worktree.
- **`evals/questions.eval.ts`** nasce in S0: la spec lo dà per esistente (AC 61), ma non c'è.

Emerse costruendo (S2, S3):

- **Il pulsante di analisi sta nella scheda Sintesi, non nella testata comune** (S3): stessa posizione con e senza temi, così dopo la prima analisi tiene focus e annuncio; la card "Pronti per la prima analisi" non lo contiene più e nell'ordine del Tab viene dopo le schede interne.
- **`start_analysis` riceve anche `period_start`** (S3): `analyses.period_start` è obbligatorio e la Sintesi lo mostra.
- **`ANALYSIS_WINDOW_DAYS` resta fino a S4** (S3): la usa solo Chiedi, che legge ancora il workspace; la toglie S4 con AC 50 e 51.
- **Il canale vuoto delle note diventa "Intervista" nella lingua dell'interfaccia sul server** (S2), oltre al campo precompilato.

Emerse costruendo (S5):

- **La sezione Ipotesi sta sopra la sezione dei temi, quindi sopra il pulsante di analisi** (S5): il pulsante è nella testata dei temi da S3, e nell'ordine del Tab viene dopo le ipotesi, non prima come nel disegno. Con 0 feedback la sezione sta sotto le tre strade di raccolta.
- **Il proxy lascia passare senza sessione le server action di `/research/[id]`** (S5), come quelle di `/research`: senza, le action delle ipotesi non possono rispondere `session` ed E-SESS non si vede.
- **`research_hypotheses.position` ha default 0** (S5), sempre sostituito dal trigger, perché i tipi generati non la chiedano a ogni insert.

Emerse costruendo (S6):

- **`finish_verdict` restituisce citazioni e verdetti salvati** (S6), non solo le citazioni: `hypothesis_count` conta i verdetti davvero salvati.
- **`finish_verdict` riceve il testo di ogni ipotesi e salta quelle cambiate** (S6): un'ipotesi modificata tra la lettura e la riserva avrebbe preso il verdetto della frase di prima.
- **Il lucchetto `analysis_running` ignora le righe `running` più vecchie di 10 minuti** (S6), come `stale`: una funzione uccisa a metà non blocca le ipotesi.
- **`research_deleted` in `finish_verdict` arriva in S6** (parte di AC 58, di S11).
- **S6 compare sotto il pulsante di analisi** (S6), non nella sezione Ipotesi: da spostare in S7. Il testo rimanda a "Solo il verdetto", che arriva in S9.
- **Fino a S9 e S10**: con 1 analisi rimasta e ipotesi il clic riceve `limit` (AC 44 non ancora), e la sala fa anche il verdetto quando la Research ha ipotesi (AC 52 non ancora).

Emerse costruendo (S8):

- **I risultati delle evals si chiamano `{eval}-{data}.json`** (S8): ogni eval si confronta col proprio run precedente. `analysis.eval.ts` passa a questo nome e scrive il commit.
- **Il codice di S0 (`evals/questions.eval.ts`) nasce in S8**, prima del run di S0 su `edac3cf`, che resta da fare con la chiave.

Emerse costruendo (S7):

- **Il pulsante di analisi sta in cima alla scheda Sintesi, sopra le ipotesi** (S7): torna prima delle ipotesi come nel disegno; resta dopo le schede interne (deviazione di S3).
- **"Dopo questo verdetto sono arrivati {k} feedback." conta dall'avvio dell'analisi del verdetto** (S7), non dal salvataggio: i feedback arrivati durante l'analisi contano, come nei casi limite della spec.
- **`synthesize` restituisce i verdetti per parola** (S7) al posto del solo numero, per l'annuncio "{h} verdetti: {c} confermate, …", che mostra solo le parole presenti.

Emerse costruendo (S9):

- **S4 costruito come scritto** (AC 44): nessuna decisione diversa di Mario prima di S9, come prevedeva il piano. Con 1 analisi rimasta e ipotesi il server fa solo i temi, anche da una scheda vecchia, e lo dice con S4.
- **Il server decide S4 chiedendo al database**: prima temi e verdetto; a `limit`, i soli temi. Nessun conteggio della quota nel codice dell'app.
- **Con ipotesi la nota del costo dice sempre 2 analisi** (S9), anche dopo la prima del mese, al posto di "Ti restano {n} analisi di {mese}.".
- **Dopo "Solo il verdetto" il focus va sull'h2 "Ipotesi"** (S9): il pulsante sparisce quando tutti i verdetti sono aggiornati, e l'annuncio lo fa la sezione.
- **"Solo il verdetto" senza ipotesi risponde `failed`** (S9) senza riservare nulla: la pagina non lo mostra, lo può mandare solo una richiesta forzata.

Emerse costruendo (S11):

- **Il trigger che svuota i registri è `before delete`**, non `after delete` (S11): dopo la cancellazione `research_id` di analisi e domande è già nullo e i registri non si ritrovano.
- **`analysis_runs.input` e `question_runs.input` diventano nullabili, con un trigger `before update` sui due registri** (S11): un'analisi o una domanda che si chiude dopo l'eliminazione della sua Research non riscrive testi nel registro.
- **`research_feedback_stats` ha `last_created_at`** (S11), per ordinare l'elenco per attività senza scaricare i feedback.
- **"{k} feedback nuovi da analizzare" prima della prima analisi conta tutti i feedback; "{n} temi" conta tutti i temi dell'ultima analisi dei temi** (S11).
- **Dopo il salvataggio della domanda il focus torna su "Modifica"** (S11): il disegno non lo diceva.
- **E-SESS dell'eliminazione non si vede dalla Raccolta** (S11): il proxy manda le action di `/research/[id]/collect` senza sessione a `/login`, come per le altre action della scheda.

Emerse costruendo (S10):

- **`synthesize` ha una terza modalità, `"room"`** (S10): la sala chiede i soli temi e il server ignora le ipotesi, invece di un parametro `kinds` dal browser.
- **Contrasto 7:1 nella sala** (S10): `ink-muted` e `problem` tolti dallo schermo; la parola del tipo di tema è `ink`, il pallino tiene il colore del tipo. Nessun colore nuovo.

Emerse costruendo (S4):

- **`ask` ha un motivo in più, `not_found`** (S4), con testo "Non trovo questa Research: forse è stata eliminata." e link a `/research`: la spec lo chiede per una Research di un altro workspace, e capita anche con la scheda aperta su una Research eliminata.
- **La scheda Chiedi non ha un titolo proprio** (S4): l'h1 è la domanda della Research, come per Raccolta e Feedback; restano la riga introduttiva e il resto del flusso di oggi.

Emerse costruendo (S12):

- **Il proxy lascia passare senza sessione le server action di `/research/[id]/collect`** (S12, difetto di S11): note ed eliminazione rispondono `session` e la Raccolta mostra E-SESS invece di mandare a `/login`. Il CSV senza sessione risponde con una nota nuova, "La sessione è scaduta. Accedi di nuovo per importare il file." (`collect.csvImport.session`), invece di un errore non gestito; i controlli del link del modulo senza sessione mostrano il loro errore di oggi.
- **S6 ha una seconda frase** (S12, difetto di S9): quando "Solo il verdetto" non compare (ogni ipotesi ha un verdetto e nessun feedback è arrivato dopo), S6 finisce con "Arriva con la prossima analisi." invece di "Riprova con «Solo il verdetto»." (`research.synthesis.analyze.verdictFailedNextAnalysis`). La regola di AC 45 non cambia.
- **Nel seed ogni feedback entra in Voce alle 9:00 del giorno in cui è arrivato** (S12), non al momento del reset: così "feedback nuovi da analizzare", "arrivati dopo" e l'ordine dell'elenco hanno senso nella demo. Il seed ha tre Research di Fatturino (una con 2 ipotesi e i loro verdetti, una con 5 note di intervista e nessuna ipotesi, una con un'ipotesi e nessun feedback); AC 72 ne chiede almeno due.
- **`src/lib/data.test.ts` e un test di `verdicts.test.sql` riallineati al seed** (S12): leggevano il seed com'era (una sola Research con feedback, nessun verdetto nel database).

## Review

Revisione indipendente (build-reviewer) del 2026-09-29, sul diff `185a057..HEAD` senza `.builderos` (S1-S12, 160 file), base `f075af4`, più le due correzioni della revisione (`c19db6a`, `f938fc8`). Stack isolato `voce-research`, porte 3000 e 4010 libere prima di ogni E2E. Nessuna chiamata al modello vero, nessuna chiave cercata.

### Comandi rilanciati dal revisore

Su `f075af4`, prima delle correzioni:

```
$ pnpm typecheck        -> EXIT 0
$ pnpm lint             -> EXIT 0
$ pnpm exec vitest run
 Test Files  46 passed (46)
      Tests  572 passed (572)
$ /Users/mariomiletta/.cache/voce-research-db.sh reset
Applying migration 20261001090000_research.sql...
Seeding data from supabase/seed.sql...
Finished supabase db reset on branch main.
$ /Users/mariomiletta/.cache/voce-research-db.sh test
All tests successful.
Files=6, Tests=185,  1 wallclock secs
Result: PASS
$ /Users/mariomiletta/.cache/voce-research-db.sh migration-test
Resetting local database to version: 20260927120000
/Users/mariomiletta/.cache/voce-research-db/supabase/migration-tests/research_after.test.sql .. ok
All tests successful.
Files=1, Tests=12
Result: PASS
$ pnpm build            -> Compiled successfully, EXIT 0 (solo rotte /research, nessuna /themes, /ask, /feedback, /collect, /sala)
$ caffeinate -i pnpm test:e2e
Running 63 tests using 6 workers
  63 passed (1.9m)
```

Dopo `c19db6a` (validazione di `mode` e test di S4), un secondo giro E2E ha fallito un test:

```
$ caffeinate -i pnpm test:e2e
Running 63 tests using 6 workers
  ✘ e2e/main-flow.spec.ts:18:5 › sign up, create a Research, paste 5 notes, write a hypothesis, analyze and read the verdict from the keyboard
    Error: expect(locator).toBeVisible() failed
    Locator: getByText('Aggiunte a questa Research. Le trovi in Feedback.')
  1 failed
  62 passed (1.2m)
```

Causa: alla terza nota il campo era vuoto e in errore N1. La conferma "Aggiunte a questa Research." compariva mentre la transizione era ancora in corso e i campi erano in sola lettura, quindi i tasti battuti subito dopo si perdevano. Vale anche per un PM veloce, non solo per il test. Corretto in `f938fc8` (la conferma compare solo quando i campi accettano di nuovo testo). Giro finale, sul codice di `f938fc8`:

```
$ pnpm typecheck        -> EXIT 0
$ pnpm lint             -> EXIT 0
$ pnpm exec vitest run
 Test Files  46 passed (46)
      Tests  574 passed (574)
$ pnpm build
✓ Compiled successfully in 1348ms
✓ Generating static pages using 11 workers (11/11) in 125ms
EXIT build 0
$ caffeinate -i pnpm test:e2e
Running 63 tests using 6 workers
  63 passed (1.1m)
EXIT e2e 0
```

Un altro giro completo subito prima, sullo stesso codice: 63 passati (1.3m). Il flake è stato visto una volta su tre giri: due giri verdi dopo la correzione non bastano a escluderlo. Le correzioni non toccano la migrazione: i tre comandi del database valgono per `f938fc8`. `pnpm evals`: non eseguito, manca `ANTHROPIC_API_KEY`.

### Asse 1: qualità del codice

**Migrazione (`20261001090000_research.sql`), letta per intero.** Nessun percorso perde dati: nessun `delete` o `truncate` su dati esistenti; le colonne del modulo si copiano in `research` prima del `drop`; `feedback.research_id` diventa `not null` solo dopo l'`update`, quindi un feedback non collegato annullerebbe l'intera transazione invece di sparire. Una Research iniziale per workspace, con `created_at` del workspace; le analisi, i temi e le domande sono collegati alla Research. La milestone di AC 7 si inserisce con `having count(*) >= 5` e `on conflict do nothing`. RLS e grant stanno nello stesso file per le quattro tabelle nuove; `hypothesis_verdicts` e `verdict_feedback` sono in sola lettura per `authenticated`; `start_analysis`, `finish_analysis`, `finish_verdict` e `start_question` sono solo per `service_role`; le chiavi composte `(workspace_id, research_id)` impediscono i collegamenti tra workspace diversi. Il test della migrazione copre 4 workspace (con modulo di default, con domanda propria e modulo spento, con 5 e con 4 feedback).

**Sicurezza, letta da un secondo revisore sui percorsi completi.** Nessun difetto critico o alto. Il proxy lascia passare le action di `/research/[id]` senza sessione; ogni action che scrive o chiama il modello controlla `getClaims`, e le altre falliscono chiuse per i grant. Il client con la chiave segreta riceve id di workspace e Research solo da letture sotto RLS. Istruzioni e dati sono separati nei prompt (`<hypotheses_data>`, `<feedback_data>`, `<` codificato). Non c'è `dangerouslySetInnerHTML` in `src`. Negli analytics finiscono solo conteggi.

Difetti trovati, per gravità:

| Gravità | Dove | Difetto | Esito |
|---|---|---|---|
| media | `src/components/manual-feedback-form.tsx` | La conferma delle note compariva con i campi ancora in sola lettura, e i tasti battuti subito dopo si perdevano. Ha fatto fallire l'E2E di AC 70 in un giro su tre | corretto in `f938fc8` |
| bassa | `src/app/(app)/research/[id]/actions.ts`, `synthesize` | `mode` arrivava dal browser senza schema: un valore sconosciuto faceva l'analisi completa. AGENTS.md chiede la validazione di ogni input | corretto in `c19db6a`, con il test "a mode other than full, verdict and room is failed and makes no call" visto fallire prima della correzione |
| bassa | `actions.ts`, `verdictPart` | La rilettura di `hypothesis_verdicts` dopo `finish_verdict` sta fuori dal `try`. Con un errore transitorio del database a verdetto già salvato, `synthesize` lancia: il browser mostra S10 anche se le due analisi sono salvate e contate, e `research_synthesized` non parte | non corretto: la correzione semplice (dentro il `try`) proverebbe a far fallire una riga già `done`. Da decidere in fase 6 |
| bassa | `collect/actions.ts`, `addNotes` | Con la Research eliminata da un'altra scheda l'insert viola la chiave esterna e la action lancia un errore non gestito, invece di dare `not_found` | non corretto |
| bassa | `src/lib/analytics.ts` | Senza `POSTHOG_KEY` `first_research_collected` non si reclama, come vuole la spec. Se la chiave arriva in Production dopo che una Research ha già 5 feedback, l'evento parte al feedback successivo con un `t0` in ritardo | rischio di fase 6: la chiave va messa prima del rilascio |
| bassa | `actions.ts:99` | "Solo il verdetto" senza ipotesi risponde `failed` (già registrato tra le deviazioni di S9) | nessuna azione |

Rischio di rilascio, non di codice: la migrazione toglie le colonne e le firme delle funzioni che il codice di `main` usa. Tra migrazione e deploy l'app in produzione si rompe. Ordine e finestra vanno decisi in fase 6.

### Asse 2: conformità alla spec

**AC campionati: 32 su 73** (2, 3, 6, 7, 9, 11, 17, 18, 20, 21, 25, 27, 28, 32, 33, 35, 37, 39, 40, 41, 43, 44, 45, 52, 54, 56, 58, 62, 63, 64, 67, 69). Ogni test nominato esiste e verifica il criterio. Tre coperture parziali:

- **AC 64**: `hypothesis_count = 0` in S4 non era provato. Aggiunto in `c19db6a` il test "one analysis left with hypotheses (S4): the themes alone, hypothesis_count 0". Il test è stato visto fallire con la definizione di fase 3 (`hypotheses.length`) e passare col codice vero.
- **AC 32**: si prova che le due righe esistono e che le chiamate sono due, non che la riserva sia atomica. L'atomicità viene dalla funzione SQL (un solo `plpgsql`, `limit` prima di ogni insert), letta nel codice. Nessun test aggiunto.
- **AC 43**: il caso "29 di 37, 8 dopo" si prova in due metà (`data.test.ts` legge `arrived_after`, `hypothesis-list.test.tsx` rende 8). Il calcolo `created_at > written_at` sta in `synthesize` ed è provato altrove. Accettabile.

**Deviazioni.** Tutte vere e motivate, nessuna silenziosa. Quattro voci sono storiche e già superate nel codice: "S6 sotto il pulsante, da spostare in S7" (ora in `hypothesis-list.tsx`), "Fino a S9 e S10", "`ANALYSIS_WINDOW_DAYS` resta fino a S4" (non esiste più in `src` né in `evals`), "E-SESS dell'eliminazione non si vede dalla Raccolta (S11)" (corretto in S12). Tre cambiano il contratto dei dati della spec senza che `04-spec.md` sia stato emendato: `finish_verdict` riceve il testo dell'ipotesi e restituisce due numeri, `analysis_runs.input` e `question_runs.input` diventano nullabili, `synthesize` ha la modalità `room`. Sono registrate qui, con il motivo: da riportare nel Data model della spec alla prossima modifica.

### Controllo dello scope

Rifatto sulle 22 voci, con ricerche nel diff: nessun `redirects` o `rewrites` in `next.config.ts`; `src/app/(app)` contiene solo `billing` e `research`; nessun `pg_cron` o `pg_net` nella migrazione; nessun `localStorage` o `sessionStorage` in `src`; nessun "voci" nei cataloghi; nessun `embedding` o `vector`; nessun inviti o condivisione; nessun `MediaRecorder` o `getUserMedia`; la sala non legge `hypothesis_verdicts` né `verdict_feedback`; `PUBLIC_FORM_LOCALE` costante; `create_research` non conta le Research; nessuna classe responsive nuova. La tabella "Scope check" sopra è confermata: nessuna voce costruita.

### Strumentazione

Confermata come **evidenza di codice, più debole di un arrivo reale**: `POSTHOG_KEY` non c'è e PostHog non è stato toccato, perché mandare eventi di prova al progetto vero sporcherebbe la metrica. I corpi catturati da `analytics.test.ts` hanno le proprietà esatte della spec (`toEqual` sull'intero oggetto `properties`). Nei tre eventi nessun testo, provato col marcatore. `first_research_collected` si reclama con un upsert atomico, quindi due invii insieme ne mandano uno. L'arrivo in PostHog UE resta da vedere in fase 6.

### Esito

Il gate 5 non passa, per due motivi fuori dal codice:

- AC 60 e 61 non sono eseguiti, quindi il 5.2 conta due criteri non passati.
- Non c'è un tasso di superamento delle evals, quindi il 5.5 fallisce.

Il 5.3 passa sul formato con tag `code`, ma resta evidenza da codice. Il blocco è uno solo: manca `ANTHROPIC_API_KEY` in `.env.local` di questo worktree, per il run di partenza su `edac3cf` e per `pnpm evals`. Nessun override scritto.
