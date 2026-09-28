# Research, S2: la raccolta della Research

Secondo passo della Research (piano: `docs/plans/2026-09-28-research.md`, slice S2 di `.builderos/initiatives/research/05-build-plan.md`). Criteri, interi o in parte: 7, 16 (parte: `/feedback` risponde 404, `/research/[id]/feedback` senza sessione va a `/login`), 25, 26, 27, 62, 66 (parte: vincolo e `Milestone`), 67 (parte: `first_research_collected`).

## Cosa è stato fatto

- **Migrazione** `20261001090000_research.sql`, cresciuta in place come dice il piano: check del testo dei feedback a 1-10.000 caratteri; `import_feedback` cerca i duplicati solo nella Research e rifiuta righe oltre 2.000 caratteri (il modulo pubblico era già a 2.000 nella sua funzione); vincolo di `analytics_milestones` con `first_research_collected` e riga inserita dalla migrazione per ogni workspace la cui Research iniziale ha almeno 5 feedback; vista `feedback_channels` rifatta con `research_id`, così la scheda Feedback filtra i canali della Research.
- **Note di intervista**: `addNotes` al posto di `addFeedback` (canale vuoto diventa "Intervista" nella lingua dell'interfaccia, testo fino a 10.000 caratteri contati come caratteri, motivi `invalid`, `too_long`, `future_date`, `limit`, `session`). `ManualFeedbackForm` è ora il modulo delle note: canale precompilato, "Persona o ruolo", contatore sempre visibile, suggerimento "Le note non si salvano finché non le aggiungi.", N1-N4 ed E-SESS, focus sul campo dopo un errore con `aria-invalid`, pulsante con `aria-disabled`. In Raccolta la sezione `#notes` sta prima del CSV, come nel disegno.
- **Scheda Feedback** `/research/[id]/feedback` al posto di `/feedback` (cancellata, niente reindirizzamento): solo i feedback della Research, filtro per canale, pagine, eliminazione, `LimitWarning` in cima, stato vuoto con "Aggiungi feedback" verso `#notes`. Action `deleteFeedback` spostata con il suo test. Schede interne: Sintesi, Feedback, Raccolta.
- **Limite Free sommato su tutte le Research**: il trigger già contava il workspace; ora lo dicono N3, `LimitWarning` ("Il limite vale per tutte le tue Research…") e i test.
- **CSV**: "Importati {n} feedback in questa Research", "Vedi i feedback" porta alla scheda Feedback della Research, riga d'introduzione sui duplicati "in questa Research".
- **`first_research_collected`**: nel tipo `Milestone`; parte da modulo, note e CSV con `workspaceOfCollectedResearch` (chiave segreta, solo quando c'è `POSTHOG_KEY`), che restituisce il workspace solo se quella Research ha almeno 5 feedback. Nessuna proprietà.
- **Cataloghi**: `research.notes` e `research.tabs.feedback` nuovi, `collect.manualForm` e `collect.page.sections.manual` tolti, `feedback.page.ledeEmpty` e `addFeedback`, `themes.limitWarning.text` e la card "Incolla le note" dello stato vuoto, in italiano e in inglese.

## Visti fallire prima del codice

- `voce-research-db.sh test`: 4 su 31 in `research.test.sql` (duplicato in un'altra Research, riga CSV da 2.001, feedback da 10.000, milestone rifiutata dal vincolo).
- `voce-research-db.sh migration-test`: "first_research_collected is claimed…" (have NULL, want cinque).
- vitest: 15 rossi (`addNotes is not a function`, nessun `first_research_collected` da modulo e CSV), poi 4 su `listFeedback` per Research (`invalid input syntax for type uuid`).
- vitest dopo il codice: `rls.test.ts` "feedback longer than 2,000" rosso, riscritto a 10.001 (il check del database ora è quello delle note); `analytics.test.ts` sul modulo riscritto perché cinque risposte portano anche la Research a 5.

## Decisioni

- **Il canale vuoto diventa "Intervista" sul server**, nella lingua dell'interfaccia: il campo è precompilato, ma la action non dipende dal browser.
- **Nome del componente invariato** (`ManualFeedbackForm`), come dice il disegno ("Extend"); il testo delle note va a capo nella tabella dei feedback (`whitespace-pre-line`), altrimenti un'intervista incollata diventa un blocco unico.
- **I canali suggeriti in Raccolta restano quelli del workspace**: servono a scrivere lo stesso nome in ogni Research.

## Cosa resta

S3 (temi della Research, `/themes` dentro la Sintesi) e le slice dopo. `/themes` e `/ask` restano ancora sul workspace e raggiungibili solo dall'URL.
