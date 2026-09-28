# Research, S4: Chiedi nella Research

Quarto passo della Research (piano: `docs/plans/2026-09-28-research.md`, slice S4 di `.builderos/initiatives/research/05-build-plan.md`). Criteri, interi o in parte: 3 (parte: la domanda porta il suo `research_id`), 16 (parte: `/ask` risponde 404, `/research/[id]/ask` senza sessione va a `/login`), 50, 51.

## Cosa è stato fatto

- **Migrazione** `20261001090000_research.sql`, cresciuta in place: `questions.research_id` con chiave composta sul workspace e `on delete set null (research_id)` (come `analyses`: eliminando la Research la riga resta e conta), domande esistenti legate alla Research iniziale, indice. `start_question(ws, research, model, feedback_considered, input)` controlla che la Research sia del workspace (`unknown_research`) e salva `research_id`; quota del workspace, `busy` e `stale` invariati.
- **Chiedi spostato** in `/research/[id]/ask` (pagina, action e i tre file di test), `/ask` cancellata senza reindirizzamenti. Scheda "Chiedi" tra Sintesi e Feedback.
- **`ask(researchId, { question })`**: `not_found` per una Research non leggibile (nessuna riga, nessuna chiamata), legge solo i feedback della Research con lo stesso perimetro dell'analisi (`selectFeedback`: dal più recente, 500 e 1.000.000 di caratteri, nessuna finestra di giorni), `no_feedback` quando la Research non ne ha. `feedbackInWindow` diventa `feedbackTotal` (tutti i feedback della Research).
- **Pagina**: niente h1 propria (l'h1 è la domanda della Research), resta la riga introduttiva; con 0 feedback lo stato vuoto A con "Aggiungi feedback" verso `/research/{id}/collect`; lo stato "solo feedback vecchi" non esiste più.
- **`ANALYSIS_WINDOW_DAYS` tolta**, con `getQuestionWindow` e il suo test (misurava la finestra di 90 giorni che non c'è più; il perimetro nuovo è provato nei test della action e della pagina).
- **Cataloghi `ask`**: tolte `nothingToAsk.titleOld` e `bodyOld`, `meta.title` e `page.title` (non più usate); `perimeterFull`, `perimeterPartial`, `noEvidenceBody`, `summary.noEvidence`, `errors.noFeedbackText` riferite alla Research; nuove `errors.notFoundText` e `notFoundLink` (Research eliminata con la scheda aperta). `research.tabs.ask`. Italiano e inglese.
- **Proxy**: `/ask` fuori da `APP_PATHS`; l'eccezione per le server action senza sessione vale per `/research/[id]/ask`. Trap aggiornato in `TECH.md`.

## Visti fallire prima del codice

- `voce-research-db.sh test`: `questions.test.sql` 24 su 52 ("function public.start_question(uuid, uuid, …) does not exist").
- vitest: 32 rossi tra action, analytics, `ask-answer`, `ask-copy` e `docs.test.ts`, più `page.test.tsx` senza modulo (i test spostati e riscritti sulla firma nuova).
- Il test di `migration-test` sulla domanda ("the question carries its research_id") l'ho scritto prima della migrazione ma lanciato solo dopo: non l'ho visto rosso.
- Gli E2E di `ask.spec.ts` li ho riscritti dopo il codice, non prima.

## Decisioni

- **`not_found` è un motivo nuovo di `ask`**, con il suo testo: la spec lo chiede per le action chiamate con la Research di un altro workspace, e lo stesso capita a chi ha la scheda aperta su una Research eliminata.
- **`askErrors` riceve l'id della Research**: E9 porta alla Raccolta di quella Research.
- **Il bottone dice quanti feedback legge** col perimetro calcolato sul server (`getAnalysisPerimeter`), lo stesso numero della action.

## Cosa resta

S6 (verdetto) e le slice dopo. Evals di Chiedi (AC 61) non eseguite: manca `ANTHROPIC_API_KEY` (P1 del piano); il prompt di Chiedi non è cambiato, è cambiato il perimetro.
