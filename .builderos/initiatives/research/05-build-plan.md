# Build: Research, customer discovery (Research ibrida)

**Phase:** 5 · **Cycle:** 1 · **Mode:** lite · **Date:** 2026-09-28 · **Owner:** Mario Miletta (piano scritto dal modello, delivery-planner)
**Branch:** `feat/research` @ `edac3cf`, worktree `voce-research`, stack Supabase isolato `voce-research` (porte 555xx) comandato solo da `/Users/mariomiletta/.cache/voce-research-db.sh`.
**Fonte:** `04-spec.md` (73 criteri, 14 voci in scope, 22 fuori scope, 4 domande aperte) e `DESIGN.md` di questa iniziativa (flussi F1-F12, stati, testi). Il piano del repository è `docs/plans/2026-09-28-research.md` e rimanda qui.
**Vincolo di consegna:** si costruisce su `feat/research` con PR in bozza, niente merge e niente migrazione remota prima della masterclass del 2026-10-01; la data della migrazione in produzione è di Mario.

Stato di questo file: **piano, nessuna riga di codice dell'app toccata.** Le sezioni "Test output", "Instrumentation", "Eval results" e "Scope check" si compilano a fine costruzione.

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
| S12 | **Chiusura.** Seed completo (due Research, ipotesi e verdetti), `docs/analytics.md` con eventi e query, test di render in inglese su tutti i cataloghi, rilancio delle evals di analisi e Chiedi contro S0, tutti i comandi di AC 73 da zero con output incollato, controllo del diff contro le 22 voci fuori scope, strumentazione verificata, revisione indipendente (`build-reviewer`), `TECH.md` e roadmap | 16 (resto), 61, 68, 69, 72, 73 | S0, S2, S4, S7, S8, S9, S10, S11 | piccola nel codice, verifica completa | da fare |

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

I nomi dei test sono quelli previsti; chi costruisce li può ritoccare, e la revisione di S12 riallinea la tabella ai nomi veri.

| # | Criterion (sintesi) | Test | Result |
|---|---------------------|------|--------|
| 1 | La migrazione crea `research`, `research_hypotheses`, `hypothesis_verdicts`, `verdict_feedback` con RLS nello stesso file; reset da zero senza errori | S1, S5. `src/test/docs.test.ts`: "enables RLS on research, research_hypotheses, hypothesis_verdicts and verdict_feedback in the file that creates them"; output di `voce-research-db.sh reset` | da eseguire |
| 2 | Dopo reset con seed nessun feedback senza `research_id`; insert senza `research_id` fallisce per `not null` | S1. `supabase/tests/research.test.sql`: "after reset with the seed no feedback lacks a research", "a feedback without research_id violates not null" | da eseguire |
| 3 | Workspace con `phc26`, 3 feedback, 1 analisi con 2 temi, 1 domanda: una sola Research iniziale con slug, stato e domanda di default, e tutti legati a lei | S1, S3, S4. `supabase/migration-tests/research_after.test.sql`: "one initial Research per workspace with slug phc26, enabled and null form question", "the default question names the workspace", "the 3 feedback carry its research_id" (S1), "the analysis and its 2 themes carry its research_id" (S3), "the question carries its research_id" (S4) | da eseguire |
| 4 | Con `form_question = 'Come va?'` domanda e domanda del modulo sono "Come va?" | S1. `research_after.test.sql`: "a form question becomes the Research question and stays the form question" | da eseguire |
| 5 | `workspaces` senza colonne del modulo; la registrazione crea workspace, membro, abbonamento e nessuna Research | S1. `research.test.sql`: "workspaces has no form_slug, form_enabled, form_question", "a new user gets workspace, member and subscription and no Research" | da eseguire |
| 6 | `get_public_form('phc26')` e `submit_public_feedback('phc26', …)` sulla Research iniziale | S1. `research_after.test.sql`: "get_public_form('phc26') returns the workspace name, the form question and accepting", "submit_public_feedback('phc26') lands in the initial Research as Modulo pubblico" | da eseguire |
| 7 | La migrazione inserisce `first_research_collected` per i workspace con almeno 5 feedback e per nessun altro | S2. `research_after.test.sql`: "first_research_collected is claimed for a workspace with 5 feedback and not for one with 4" | da eseguire |
| 8 | Utente di A e `anon`: 0 righe o permesso negato sulle quattro tabelle di B, senza filtri e per id | S1, S5. `research.test.sql`: "A reads no research of B, unfiltered and by id", "anon cannot read research"; `supabase/tests/hypotheses.test.sql`: "A reads no research_hypotheses, hypothesis_verdicts, verdict_feedback of B, unfiltered and by id", "anon cannot read them" | da eseguire |
| 9 | Update e delete su `research` e `research_hypotheses` di B falliscono; insert con workspace di A e Research di B fallisce | S1, S5. `research.test.sql`: "A cannot update or delete a research of B", "a feedback with A's workspace and B's research is refused"; `hypotheses.test.sql`: "A cannot update or delete a hypothesis of B", "a hypothesis with A's workspace and B's research is refused" | da eseguire |
| 10 | Nessuna scrittura di `authenticated` e `anon` su verdetti e collegamenti; le quattro funzioni solo per `service_role` | S3, S5, S6. `hypotheses.test.sql`: "authenticated and anon cannot insert, update or delete hypothesis_verdicts and verdict_feedback"; `supabase/tests/analysis.test.sql`: "start_analysis, finish_analysis and fail_analysis run only as service_role"; `supabase/tests/verdicts.test.sql`: "finish_verdict runs only as service_role" | da eseguire |
| 11 | `create_research`: `not_a_member` per chi non è membro; per un membro slug valido e unico, modulo acceso, domanda del modulo nulla | S1. `research.test.sql`: "create_research by a non member fails with not_a_member", "create_research makes a unique slug matching the pattern, form enabled and null form question" | da eseguire |
| 12 | `createResearch`: vuota, spazi o oltre 200 caratteri danno `invalid` o `too_long` senza righe; valida crea e porta a `/research/{id}` | S1. `src/app/(app)/research/actions.test.ts`: "empty, blank and 201-character questions return invalid or too_long and create nothing", "a valid question creates the Research and redirects to /research/{id}" | da eseguire |
| 13 | Con 0 Research: titolo, campo con focus, "Crea la Research", nessun "Nuova Research" | S1. `src/app/(app)/research/page.test.tsx`: "with no Research shows the first-run title, the field and Crea la Research, without Nuova Research"; `e2e/research.spec.ts`: "first run: the question field has the focus and creates the first Research from the keyboard" | da eseguire |
| 14 | Una riga per Research ordinata per attività, numero, domanda come link, stati di DESIGN.md | S1, S11. `src/components/research-row.test.tsx`: "shows the count, the question as a link and each state of DESIGN.md, only the non-zero verdict parts"; `src/app/(app)/research/page.test.tsx`: "orders rows by the latest of creation, last feedback and last analysis" | da eseguire |
| 15 | Barra con "Research" e "Piano"; schede interne; "Sintesi" corrente su `/research/[id]` e sul tema, non sulle altre | S1, S3. `e2e/research.spec.ts`: "the app bar has Research and Piano, and Sintesi is current on the Research and on a theme but not on Chiedi, Feedback, Raccolta" | da eseguire |
| 16 | Senza sessione a `/login`; dopo accesso email, Google e conferma su `/research`; le cinque rotte di oggi rispondono 404 | S1, S2, S3, S4, S12. `e2e/research.spec.ts`: "every path under /research without a session goes to /login", "the routes of today answer 404" (lista completa dopo S4); `src/app/(auth)/actions.test.ts`: "email and Google sign-in return to /research"; `src/app/auth/callback/route.test.ts`: "the confirmation lands on /research"; `e2e/email-confirmation.spec.ts`: "the default template link lands the user signed in on the Research" | da eseguire |
| 17 | Research di un altro workspace, eliminata o id non uuid: stessa pagina NF, 404 | S1. `e2e/research.spec.ts`: "another workspace's, a deleted and a non-uuid Research show the same not-found page with status 404" | da eseguire |
| 18 | `addHypothesis`: `invalid`, `too_long`, `max_reached`, concorrenza su 4 ipotesi, `session`, nessuna riga | S5. `src/app/(app)/research/[id]/hypotheses.test.ts`: "empty and 201-character hypotheses are invalid or too_long and create nothing", "a sixth hypothesis is max_reached", "two concurrent adds on 4 hypotheses: one saves, the other is max_reached", "without a session returns session and creates nothing"; `hypotheses.test.sql`: "the trigger refuses a sixth hypothesis with max_hypotheses" | da eseguire |
| 19 | `written_at` all'insert, `position` massima più 1 | S5. `hypotheses.test.sql`: "written_at is the insert time and position is the maximum plus 1" | da eseguire |
| 20 | Testo nuovo cancella verdetto e collegamenti e sposta `written_at`; stesso testo non cambia nulla | S5. `hypotheses.test.sql`: "a new text deletes the verdict and its links and moves written_at", "the same text changes nothing" | da eseguire |
| 21 | Con un'analisi `running` sulla Research insert, update e delete di un'ipotesi falliscono con `analysis_running`; la action dà `busy` con H7 | S6. `hypotheses.test.sql`: "insert, update and delete of a hypothesis fail with analysis_running during an analysis of its Research"; `hypotheses.test.ts`: "analysis_running becomes busy"; `src/components/hypothesis-list.test.tsx`: "busy shows H7" | da eseguire |
| 22 | Il modulo di R scrive in R; slug rigenerato dà 404; modulo spento o Free a 100 dà `FormUnavailable` | S1. `src/app/actions.test.ts`: "a public form response lands in the Research of its slug"; `e2e/research.spec.ts`: "a regenerated link answers 404 on the old slug", "a disabled form and a full Free workspace show FormUnavailable" | da eseguire |
| 23 | Raccolta con link e QR di `/f/{slug di R}`; `/research/[id]/qr` scarica quel QR | S1. `e2e/research.spec.ts`: "the Raccolta shows the link and QR of this Research and /qr downloads the QR of its slug" | da eseguire |
| 24 | `/f/[slug]` in italiano col cookie `en`; domanda del modulo o default | S1. `e2e/english.spec.ts`: "/f/phc26 stays in Italian for an English browser that chose English", "the form shows the Research form question, or the default when null" | da eseguire |
| 25 | `addNotes` nella Research con "Intervista", fino a 10.000, `too_long` a 10.001; modulo e CSV restano a 2.000 | S2. `src/app/(app)/research/[id]/collect/actions.test.ts`: "addNotes saves in the open Research with channel Intervista", "10,000 characters pass and 10,001 are too_long", "a 2,001-character form response or CSV row is still refused" | da eseguire |
| 26 | Free a 100 su tutte le Research: `limit` (N3), righe CSV `over_limit`, ogni modulo `FormUnavailable` | S2. `collect/actions.test.ts`: "at 100 feedback across Research addNotes returns limit and CSV rows are over_limit"; `e2e/research.spec.ts`: "every form of a full Free workspace shows FormUnavailable" | da eseguire |
| 27 | `import_feedback`: `duplicate` nella stessa Research, `new` se l'uguale sta in un'altra | S2. `research.test.sql`: "a row equal to a feedback of the same Research is duplicate", "the same row is new when the equal feedback is in another Research" | da eseguire |
| 28 | Perimetro: dal più recente, 500 feedback e 1.000.000 di caratteri, niente 90 giorni, solo la Research | S3. `src/lib/analysis.test.ts`: "selectFeedback keeps the 500 most recent of 501", "selectFeedback stops at 1,000,000 characters: 250 of 300 feedback of 4,000", "selectFeedback has no 90-day window"; `synthesize.test.ts`: "the prompt holds no feedback of another Research" | da eseguire |
| 29 | Perimetro parziale: "Analizza i {n} feedback più recenti" con "su {totale} di questa Research", n dal server | S3. `src/components/analyze-button.test.tsx`: "partial perimeter: the label and the note carry n from the server and the Research total" | da eseguire |
| 30 | Titoli, priorità e stato dall'ultima analisi dei temi `done` della stessa Research | S3. `synthesize.test.ts`: "existing titles come from the last done themes analysis of the same Research"; `analysis.test.sql`: "finish_analysis inherits priority and status only from the same Research" | da eseguire |
| 31 | Riga "Dall'analisi del {data}…" e variazione per tema sull'analisi precedente della stessa Research; nessuna riga alla prima | S3. `src/lib/data.test.ts`: "what changed compares with the previous themes analysis of the same Research", "no what-changed line on the first analysis"; `src/components/theme-row.test.tsx`: "shows +{k} dal {data} or Nuovo" | da eseguire |
| 32 | Con ipotesi un clic riserva `themes` e `verdict` nella stessa transazione e fa due chiamate; senza, una riga e una chiamata | S6. `synthesize.test.ts`: "with hypotheses one click reserves themes and verdict together and calls the model twice", "without hypotheses one themes row and one call" | da eseguire |
| 33 | `start_analysis` e la quota: non fallite più richieste, tetto delle fallite; Free 1 usata passa, 2 usate no | S3. `analysis.test.sql`: "limit when the done ones plus the requested exceed the plan", "limit when the failed ones reach the plan", "Free with 1 used: themes and verdict pass", "Free with 2 used: a request of 2 does not" | da eseguire |
| 34 | `busy` con una `running` in qualunque Research, 0 chiamate; oltre 10 minuti `stale` | S3. `analysis.test.sql`: "a running analysis in any Research of the workspace makes start_analysis busy", "a running row older than 10 minutes is failed as stale and does not block"; `synthesize.test.ts`: "busy makes no model call" | da eseguire |
| 35 | Esiti per parte: S5 (conta 1), S6 (conta 1), S7 (conta 0) | S6. `synthesize.test.ts`: "themes fail and verdict succeeds: S5 and usage 1", "verdict fails and themes succeed: S6 and usage 1", "both fail: S7 and usage 0" | da eseguire |
| 36 | Chiamate insieme, 240.000 ms e 16.000 token ciascuna; `maxDuration` 300 | S3, S6. `synthesize.test.ts`: "both calls start together with a 240,000 ms timeout and 16,000 output tokens"; `docs.test.ts`: "the Research page exports maxDuration 300" | da eseguire |
| 37 | Istruzioni solo in `instructions`; ipotesi e feedback nei blocchi dati con `<` codificato; chiusura una volta sola | S6. `src/lib/verdict.test.ts`: "instructions only in instructions, hypotheses and feedback as JSON in their data blocks with < encoded", "a hypothesis closing its block cannot leave it" | da eseguire |
| 38 | Ragionamento nella lingua dell'avvio ("English", "Italian"); parola del verdetto dal catalogo | S6, S7. `verdict.test.ts`: "instructions ask for English with en and Italian with it"; `hypothesis-list.test.tsx`: "the verdict word comes from research.verdict, not from the model" | da eseguire |
| 39 | `checkVerdicts`, un test per motivo (9 test) | S6. `verdict.test.ts`: "drops unknown_hypothesis", "drops duplicate_hypothesis", "drops unknown_feedback", "removes feedback_on_both_sides from both sides", "drops quote_not_linked", "drops quote_not_in_feedback, empty and inexact", "drops second_quote_same_feedback", "drops too_many_quotes, fourth for and third against", "a stance outside for and against fails the verdict part" | da eseguire |
| 40 | `verdict_without_quotes` porta a `to_review`; ipotesi assente tiene il verdetto precedente con `missing_hypothesis` | S6. `verdict.test.ts`: "confirmed or refuted without verified quotes of its side becomes to_review", "a hypothesis missing from the output keeps its previous verdict with missing_hypothesis" | da eseguire |
| 41 | `finish_verdict`: `strpos`, feedback eliminati, `to_review` senza citazioni del suo lato | S6. `verdicts.test.sql`: "a quote not in the saved text raises quote_not_in_feedback", "links and quotes of deleted feedback are dropped", "a confirmed left without quotes of its side is saved to_review" | da eseguire |
| 42 | Parola, conteggi, ragionamento come testo, fino a 3 "A favore" e 2 "Contro" con canale e data senza cliente | S7. `hypothesis-list.test.tsx`: "shows the word, counts from verdict_feedback and the read count, the reasoning, up to 3 for and 2 against with channel and date and no customer name" | da eseguire |
| 43 | V1 o V2; "Dopo questo verdetto sono arrivati {k} feedback."; caso 29 di 37 | S7. `src/lib/data.test.ts`: "a hypothesis written after 29 of 37 feedback reads 8 arrived after"; `hypothesis-list.test.tsx`: "Dei 37 feedback letti, 8 sono arrivati dopo.", "V2 when none arrived after", "Dopo questo verdetto sono arrivati {k} feedback." | da eseguire |
| 44 | 1 analisi rimasta e ipotesi: "Analizza solo i temi…", S4, solo `themes`, anche con richiesta completa dal browser | S9. `synthesize.test.ts`: "with 1 analysis left and hypotheses the server reserves only themes, even when asked for both"; `analyze-button.test.tsx`: "one analysis left with hypotheses: themes-only label and S4" | da eseguire |
| 45 | "Solo il verdetto" solo alle sue condizioni; riserva una riga `verdict` per tutte le ipotesi | S9. `hypothesis-list.test.tsx`: "Solo il verdetto shows only when a hypothesis lacks a verdict or has newer feedback and nothing is newer than the last themes analysis"; `synthesize.test.ts`: "verdict only reserves one verdict row and redoes every hypothesis" | da eseguire |
| 46 | Ragionamento, titoli e sintesi come testo; nessun `dangerouslySetInnerHTML` sotto `research` | S7. `hypothesis-list.test.tsx`: "a reasoning with <b>x</b> and **x** shows those characters"; `docs.test.ts`: "no dangerouslySetInnerHTML under src/app/(app)/research" | da eseguire |
| 47 | Nessun collegamento: "Da rivedere" con "Nessuno dei {n} feedback letti ne parla." e senza ragionamento | S7. `hypothesis-list.test.tsx`: "no links: Da rivedere, Nessuno dei {n} feedback letti ne parla. and no reasoning" | da eseguire |
| 48 | Una riga di `analysis_runs` per riga di `analyses`, anche `verdict`, con input e chiusura completi | S3, S6. `synthesize.test.ts`: "every analyses row has its analysis_runs row with model, instructions, prompt and feedback ids in order", "on close the run has raw output, issues, tokens, duration, cost and the error when failed" | da eseguire |
| 49 | Errore del modello nel verdetto: `console.error` con solo nome e id, mai il marcatore | S6. `synthesize.test.ts`: "a verdict model error logs only the error name and the analysis id, never the marker" | da eseguire |
| 50 | Chiedi: solo la Research, perimetro di AC 28, `questions.research_id`, quota del workspace, `no_feedback` verso la Raccolta | S4. `src/app/(app)/research/[id]/ask/actions.test.ts`: "sends only this Research's feedback with the analysis perimeter", "saves questions.research_id and counts in the workspace quota", "no feedback in the Research returns no_feedback"; `ask/page.test.tsx`: "no feedback: the action goes to /research/{id}/collect" | da eseguire |
| 51 | Niente 90 giorni: "Letti {n} feedback di questa Research."; `titleOld` e `bodyOld` spariti | S4. `src/components/ask-answer.test.tsx`: "the perimeter says Letti {n} feedback di questa Research."; `docs.test.ts`: "no catalog has ask.nothingToAsk.titleOld or bodyOld" | da eseguire |
| 52 | Sala: domanda e QR della Research, solo le risposte del suo modulo, "Analizza le risposte" solo temi con la nota | S10. `e2e/room.spec.ts`: "the room of a Research shows its form question and QR and counts only its public form responses", "Analizza le risposte reserves only themes and says where the verdict is"; `synthesize.test.ts`: "room mode reserves only themes with hypotheses" | da eseguire |
| 53 | Research eliminata a sala aperta: `/sala/status` 404, R1 al posto del QR | S10. `e2e/room.spec.ts`: "a Research deleted while the room is open: status 404 and R1 instead of the QR" | da eseguire |
| 54 | Analisi finite: pulsanti `aria-disabled` con la nota del piano; invio forzato `limit`, 0 chiamate | S9, S10. `analyze-button.test.tsx`: "analyses used up: aria-disabled with common.analysisLimit.free or .pro"; `hypothesis-list.test.tsx`: "Solo il verdetto off with the same note"; `synthesize.test.ts`: "a forced submit gets limit from the database and makes no model call"; `e2e/room.spec.ts`: "the room button is off with the quota note" | da eseguire |
| 55 | `/billing` e landing: "Il verdetto delle ipotesi usa 1 analisi" (EN) in Free e Pro | S9. `src/test/plan-pages.test.tsx`: "billing and landing show the verdict line in Free and Pro, in Italian and English" | da eseguire |
| 56 | `deleteResearch`: cancella tutto; `analyses` e `questions` restano con `research_id` nullo e contano; registri senza testi | S11. `research.test.sql`: "deleting a Research deletes its feedback, themes, hypotheses, verdicts and links", "its analyses and questions stay with a null research_id and still count", "their runs lose input, output and issues" | da eseguire |
| 57 | Dopo l'eliminazione `/research` con "Research eliminata."; ultima Research: F1 | S11. `e2e/research.spec.ts`: "deleting a Research lands on /research with Research eliminata., and on the first run after the last one"; `src/app/(app)/research/actions.test.ts`: "deleteResearch returns failed or session" | da eseguire |
| 58 | Analisi `running` di una Research eliminata: `failed` con `research_deleted`, niente temi né verdetti | S11. `analysis.test.sql`: "finish_analysis on a deleted Research fails with research_deleted and saves no theme"; `verdicts.test.sql`: "finish_verdict on a deleted Research fails with research_deleted and saves no verdict" | da eseguire |
| 59 | `updateResearchQuestion` cambia solo la domanda; i prompt non la contengono | S11. `research/actions.test.ts`: "updating the question keeps themes, hypotheses and verdicts"; `synthesize.test.ts`: "neither the themes nor the verdict prompt contains the Research question" | da eseguire |
| 60 | `pnpm evals` su `verdicts.json`: almeno 17 su 20, tutti i must-pass, G1 a 0; risultato in `evals/results/` | S8. Eval `evals/verdicts.eval.ts` su `evals/verdicts.json`: soglia 85% (17 su 20); must-pass v06, v07, v09, v11, v12, v13, v14, v15; G1 su tutti i 20 casi; confronto col run precedente | da eseguire |
| 61 | Dopo il cambio del perimetro, evals di analisi e Chiedi non sotto l'ultimo risultato di prima, must-pass di Chiedi passati | S0, S12. Eval `evals/analysis.eval.ts` ed `evals/questions.eval.ts`: run su `edac3cf` (S0), rilancio dopo S3 e S4 (S12), confronto dei due file in `evals/results/` | da eseguire |
| 62 | Il feedback che porta una Research a 5 manda una sola `first_research_collected`, da modulo, note o CSV; il sesto e il quinto di un'altra no | S2. `src/app/(app)/research/[id]/analytics.test.ts`: "the feedback that brings a Research to 5 sends first_research_collected once, from the form, the notes or the CSV", "the sixth and a second Research's fifth send nothing" | da eseguire |
| 63 | Una sola `research_synthesized` per `synthesize` con una parte `done`, proprietà esatte; nessuna se falliscono entrambe | S3, S6, S10. `research/[id]/analytics.test.ts`: "one research_synthesized per synthesize with a done part, with exactly its properties", "none when both parts fail" | da eseguire |
| 64 | `feedback_count`, `citation_count`, `hypothesis_count` (0 per temi soli, sala e S4) | S3, S6, S10. `research/[id]/analytics.test.ts`: "feedback_count is what the model read and citation_count the verified quotes saved", "hypothesis_count counts the hypotheses with a saved verdict, 0 for themes only, the room and S4" | da eseguire |
| 65 | `first_analysis_completed` alla prima analisi dei temi con un tema, una volta per workspace; non per il solo verdetto | S3, S9. `research/[id]/analytics.test.ts`: "the first themes analysis with a theme in any Research sends first_analysis_completed once", "a verdict-only synthesis does not send it" | da eseguire |
| 66 | Vincolo delle milestone con `first_research_collected`; `Milestone` e `RepeatedEvent` con i due eventi | S2, S3. `research.test.sql`: "analytics_milestones accepts first_research_collected"; `src/lib/analytics.test.ts`: "Milestone and RepeatedEvent carry the two events with typed properties" | da eseguire |
| 67 | Marcatore in domanda, ipotesi, feedback e ragionamento assente dal corpo verso PostHog | S2, S6. `research/[id]/analytics.test.ts`: "no question, hypothesis, feedback or reasoning text reaches PostHog" | da eseguire |
| 68 | `docs/analytics.md` con i due eventi, proprietà, momento d'invio e la query HogQL | S12. `docs.test.ts`: "documents first_research_collected and research_synthesized with properties, timing and the HogQL query of the metric" | da eseguire |
| 69 | Chiavi uguali in IT ed EN con gli stessi segnaposto; nessuna frase italiana di DESIGN.md nelle pagine rese in inglese | Ogni slice, S12. `src/i18n/messages.test.ts` (esistente); `src/test/english-render.test.tsx`: "Research pages rendered with the en catalog contain none of the Italian sentences of DESIGN.md" | da eseguire |
| 70 | E2E solo da tastiera: registrazione, primo accesso, Research, 5 note, ipotesi, "Analizza 5 feedback", verdetto con citazione e conteggi, temi, focus sul pulsante | S7. `e2e/main-flow.spec.ts` (riscritto): "sign up, create a Research, paste 5 notes, write a hypothesis, analyze and read the verdict from the keyboard" | da eseguire |
| 71 | `english.spec.ts` riscritto: `/f/phc26` in italiano con lo slug su una Research | S1. `e2e/english.spec.ts`: "/f/phc26 stays in Italian for an English browser that chose English" | da eseguire |
| 72 | Seed con un workspace, due Research, una con 2 ipotesi e verdetti, una senza; reset senza errori | S1, S12. `research.test.sql`: "the seed has a workspace with two Research, one with 2 hypotheses and their verdicts, one without"; output di `voce-research-db.sh reset` | da eseguire |
| 73 | Con output: typecheck, lint, test, build, reset, test del database, evals, E2E | S12. Esecuzione completa in "Test output": `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `voce-research-db.sh reset`, `voce-research-db.sh test`, `voce-research-db.sh migration-test`, `pnpm evals`, `caffeinate -i pnpm test:e2e` | da eseguire |

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

da compilare a fine costruzione

## Instrumentation

da compilare a fine costruzione

## Eval results

Nessun run col modello vero finora: manca `ANTHROPIC_API_KEY` (P1). Il codice delle tre evals c'è (S8, con quello di S0) ed è provato con un modello finto in `evals/verdicts.test.ts` ed `evals/questions.test.ts`. Da compilare col primo `pnpm evals`.

## Scope check

da compilare a fine costruzione

## Deviations from spec

Previste dal piano, da confermare a fine costruzione:

- **AC 3, 4, 6, 7 non girano in `supabase test db`.** La spec dice "in un test pgTAP"; restano pgTAP, ma in `supabase/migration-tests/` lanciati da `voce-research-db.sh migration-test` (P3), perché lo stato "prima della migrazione" non esiste nel database su cui gira `supabase/tests/`. In CI servirà lo stesso passo; oggi il repository non ha CI.
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
