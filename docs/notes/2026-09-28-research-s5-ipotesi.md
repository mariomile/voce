# Research, S5: le ipotesi

Quinto passo della Research (piano: `docs/plans/2026-09-28-research.md`, slice S5 di `.builderos/initiatives/research/05-build-plan.md`). Criteri, interi o in parte: 1 (resto: RLS sulle tre tabelle nuove), 8 (resto), 9 (resto), 10 (parte: nessuna scrittura su verdetti e collegamenti), 18, 19, 20.

## Cosa è stato fatto

- **Migrazione** `20261001090000_research.sql`, cresciuta in place: `research_hypotheses` (testo 1-200 caratteri dopo il trim, `position`, `written_at`, chiave composta sulla Research con `on delete cascade`), RLS con select, insert, update e delete per i membri, grant di insert solo su `workspace_id`, `research_id`, `text` e di update solo su `text`. Tipi `hypothesis_verdict` e `verdict_stance`; `hypothesis_verdicts` e `verdict_feedback` con RLS in sola lettura per i membri e nessuna scrittura per `authenticated` e `anon` (li scriverà `finish_verdict` in S6).
- **Trigger** `before insert`: blocca la riga della Research (`for no key update`), solleva `max_hypotheses` alla sesta, imposta `position` (massima più 1) e `written_at`. `before update of text`: se il testo cambia, `written_at = now()` e cancella la riga del verdetto (i collegamenti vanno in cascata); stesso testo, nulla.
- **Action** in `src/app/(app)/research/[id]/actions.ts`: `addHypothesis`, `updateHypothesis`, `deleteHypothesis` con `invalid`, `too_long`, `max_reached`, `failed`, `session`. Scrivono come l'utente: RLS limita al workspace, il trigger conta. Costanti `HYPOTHESIS_MAX_LENGTH` e `MAX_HYPOTHESES` in `src/lib/plans.ts`.
- **`HypothesisList`** (nuovo) nella Sintesi, sopra i temi: sezione vuota con la riga e "Scrivi un'ipotesi", campo "Nuova ipotesi" con focus e "Annulla" (il focus torna al pulsante), ipotesi come h3 in testo con "Nessun verdetto ancora. Arriva con la prossima analisi.", "Modifica" ed "Elimina" con nome accessibile completo, modifica con H5 quando c'è un verdetto, Esc che annulla e rimette il focus su "Modifica", conferma H6 nella riga con focus su "Annulla", focus sull'h2 dopo l'eliminazione, annuncio "Ipotesi aggiunta…", H1-H4, H3 al posto del campo a 5 ipotesi, E-SESS con il testo che resta.
- **`listHypotheses`** in `src/lib/data.ts` (ipotesi per posizione, con `hasVerdict`).
- **Cataloghi**: `research.hypotheses` in italiano e inglese.
- **Proxy**: le server action di `/research/[id]` senza sessione passano come quelle di `/research`, così le ipotesi (e l'analisi) rispondono `session` e la pagina mostra E-SESS. Aggiornato il trap in `TECH.md`.

## Visti fallire prima del codice

- `voce-research-db.sh test`: `hypotheses.test.sql` "You planned 35 tests but ran 0" (tabelle assenti). Dopo la migrazione passavano 34 test: il piano era contato male, corretto a 34.
- vitest: `hypotheses.test.ts` 12 rossi (`addHypothesis is not a function`); `hypothesis-list.test.tsx` senza modulo; `listHypotheses is not a function`.
- E2E: "E-SESS with the text kept" rosso prima del cambio del proxy (la action veniva rimandata a `/login`).
- Il test di `docs.test.ts` sulle tre tabelle l'ho scritto dopo la migrazione: non l'ho visto rosso.

## Decisioni

- **Il trigger `analysis_running` non c'è ancora**: è di S6 (AC 21), come il motivo `busy` e H7.
- **`position` ha default 0**, sostituito sempre dal trigger: senza default i tipi generati la chiedevano a ogni insert, e l'utente comunque non la può scrivere (nessun grant).
- **Con 0 feedback la sezione Ipotesi sta sotto le tre strade di raccolta**: scrivere l'ipotesi prima dei feedback è il caso migliore per il conto "arrivati dopo"; la raccolta resta la prima cosa da fare. Con feedback sta sopra i temi, come nel disegno.
- **Il pulsante di analisi viene dopo le ipotesi** nell'ordine della pagina, perché in S3 sta nella testata della sezione dei temi. Nel disegno viene prima (testata comune). Da rivedere quando in S7 le ipotesi mostrano i verdetti e la sezione si allunga.
- **Una Research di un altro workspace** in `addHypothesis` dà `failed`, come un id sbagliato: la pagina è comunque la NF.

## Cosa resta

S4 (Chiedi nella Research), S6 (verdetto), S7 (lettura del verdetto) e dopo.
