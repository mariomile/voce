# Research, S3: i temi della Research

Terzo passo della Research (piano: `docs/plans/2026-09-28-research.md`, slice S3 di `.builderos/initiatives/research/05-build-plan.md`). Criteri, interi o in parte: 3 (parte: analisi e temi), 10 (parte: `start_analysis`, `finish_analysis`, `fail_analysis` solo per `service_role`), 15, 16 (parte: `/themes` risponde 404), 28, 29, 30, 31, 33, 34, 36 (parte: la chiamata dei temi e `maxDuration`), 48 (parte: riga `themes`), 63 (parte), 64 (parte), 65 (parte), 66 (parte: `RepeatedEvent`).

## Cosa è stato fatto

- **Migrazione**, cresciuta in place: tipo `analysis_kind` (`themes`, `verdict`); `analyses.research_id` (chiave composta sul workspace, `on delete set null (research_id)`: eliminando la Research la riga resta e conta) e `analyses.kind`; `themes.research_id` obbligatorio con chiave composta; analisi e temi esistenti legati alla Research iniziale. `start_analysis(ws, research, model, kinds, period_start, feedback_count, inputs)`: controlla che la Research sia del workspace, chiude `stale`, `busy` con una `running` in qualunque Research, `limit` quando le non fallite del mese più le richieste superano il piano o le fallite l'hanno raggiunto, poi una riga di `analyses` e una di `analysis_runs` per ogni tipo, tutto o niente. `finish_analysis` eredita priorità e stato solo dall'ultima analisi dei temi `done` della stessa Research, salva `research_id` sui temi e restituisce il numero di citazioni verificate salvate.
- **Perimetro condiviso** in `src/lib/analysis.ts`: `selectFeedback` tiene i feedback dal più recente fino a 500 e a 1.000.000 di caratteri (caratteri, non unità UTF-16), niente finestra di 90 giorni; `ANALYSIS_MAX_CHARS`.
- **Action `synthesize(researchId)`** in `src/app/(app)/research/[id]/actions.ts` al posto di `analyze()`: `session` senza sessione, `not_found` per una Research non leggibile (nessuna chiamata al modello), solo i feedback della Research, titoli esistenti dalla stessa Research, riserva `kinds: ["themes"]`, `first_analysis_completed` come prima, `research_synthesized` con `feedback_count`, `citation_count` (dal database) e `hypothesis_count` 0. La usano la Sintesi e la sala.
- **Sintesi** `/research/[id]` con `maxDuration` 300: `LimitWarning`, "{n} feedback, ancora nessun tema" con la card "Pronti per la prima analisi", poi h2 "Temi", riga "Dall'analisi del {data}: {n} feedback in più, {m} temi nuovi." sull'analisi dei temi precedente della stessa Research, filtri, `ThemeRow` con "+{k} dal {data}" o "Nuovo" e titolo h3. Dettaglio del tema in `/research/[id]/themes/[themeId]`, con "Sintesi" corrente. `/themes` e `/themes/[id]` cancellate, senza reindirizzamenti.
- **`AnalyzeButton`** riceve la Research, il numero che il server manderà e il totale: "Analizza {n} feedback" o "Analizza i {n} feedback più recenti" con "su {totale} di questa Research", nota del costo, nota sotto 5 feedback, `aria-disabled` al posto di `disabled` (anche a quota finita), nota lunga dopo 2 minuti, annuncio "Analisi finita: {m} temi.", S2, S10, E-SESS.
- **Sala**: `roomThemes(researchId)` e "Analizza le risposte" sulla Research.
- **Cataloghi**: `research.synthesis` nuovo; `themes.analyzeButton.failures` con `no_feedback` senza 90 giorni, `busy` (S2), `session`, `not_found`; tolte le chiavi della pagina `/themes` che non esiste più.

## Visti fallire prima del codice

- `voce-research-db.sh test`: `analysis.test.sql` 21 su 24 ("type public.analysis_kind[] does not exist").
- vitest: `selectFeedback` 4 rossi; `synthesize.test.ts` senza modulo; `analyze-button.test.tsx` e `theme-row.test.tsx` rossi (import di `/themes/actions`, niente "+5 dal 8 ottobre" né h3); `docs.test.ts` su `maxDuration`.
- E2E: i due test nuovi della Sintesi rossi al primo giro (annuncio e focus persi, sotto).
- Il test di `migration-test` su analisi e temi l'ho scritto prima della migrazione ma lanciato solo dopo: non l'ho visto rosso.

## Decisioni

- **Il pulsante di analisi sta nella Sintesi, non nella testata comune**: il layout non sa quale scheda è aperta, e il pulsante c'è solo lì. Sta nella stessa posizione con e senza temi, perché dopo la prima analisi la pagina si aggiorna: con il pulsante dentro la card il componente si rifaceva, perdendo focus e annuncio. Per questo la card "Pronti per la prima analisi" non contiene più il pulsante. Differenza dal disegno (ordine del Tab: il pulsante viene dopo le schede).
- **`start_analysis` riceve ancora `period_start`**: `analyses.period_start` è obbligatorio e la riga di testa lo mostra ("dal {inizio} al {fine}"). Un parametro in più rispetto alla firma della spec.
- **`ANALYSIS_WINDOW_DAYS` resta**, usata solo da Chiedi finché non entra nella Research (S4). La spec la toglie; toglierla ora voleva dire cambiare Chiedi.
- **La variazione per tema** si mostra solo quando il tema è cresciuto; un tema con meno feedback di prima non mostra niente.
- **Due tipi espliciti per i cataloghi** (`ask/page.tsx`, `csv-import.tsx`): con i cataloghi più grandi `getTranslations()` senza namespace superava la profondità dei tipi di TypeScript.
- Niente riga "Ultima analisi il {data}: {n} feedback arrivati dopo." nella testata: nessun criterio di S3 la chiede.

## Visto nel browser

Sintesi di Fatturino (seed) e Raccolta con le note a 1280 px: disposizione come nel disegno. Nel seed tutti i temi di Fatturino risultano "Nuovo" e la riga dice "0 feedback in più, 8 temi nuovi", perché le analisi precedenti del seed non hanno temi: il seed completo è di S12.

## Cosa resta

- Evals di analisi (`pnpm evals`, AC 61): non eseguite, manca `ANTHROPIC_API_KEY` in `.env.local` (P1 del piano). Il prompt dei temi non è cambiato, è cambiato solo il perimetro.
- S4 (Chiedi nella Research), S5 e dopo. `/ask` resta sul workspace.
