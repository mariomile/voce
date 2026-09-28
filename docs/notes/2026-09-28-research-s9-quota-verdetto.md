# Research, S9: la quota del verdetto e "Solo il verdetto"

Nono passo della Research (piano: `docs/plans/2026-09-28-research.md`, slice S9 di `.builderos/initiatives/research/05-build-plan.md`). Criteri, interi o in parte: 44, 45, 54 (parte: pulsante di analisi e "Solo il verdetto"; la sala è di S10), 55, 65 (resto).

## Cosa è stato fatto

- **`synthesize(researchId, mode)`**: `"full"` (il clic su "Analizza") o `"verdict"` ("Solo il verdetto", una sola riga `verdict`, il verdetto di tutte le ipotesi, niente temi). Con ipotesi il server chiede a `start_analysis` temi e verdetto; se il database risponde `limit`, richiede i soli temi: con 1 analisi rimasta passano (S4), con 0 resta `limit`. La regola vale qualunque cosa mostrasse la pagina (scheda vecchia). Esiti nuovi: temi `skipped` (solo verdetto), verdetto `limit` (S4). "Solo il verdetto" senza ipotesi: `failed`, nessuna riga, nessuna chiamata.
- **`AnalyzeButton`** riceve quota e numero di ipotesi e dice il costo prima del clic: "Userai 1 delle {limite} analisi di {mese}." o "Ti restano {n} analisi di {mese}." senza ipotesi, "Userai 2 delle {limite} analisi di {mese}: una per i temi, una per il verdetto delle ipotesi." con ipotesi, e con 1 analisi rimasta e ipotesi "Analizza solo i temi di {n} feedback" con S4. Se il server ha fatto solo i temi, l'annuncio finisce con S4.
- **"Solo il verdetto di {h} ipotesi"** in fondo alla sezione Ipotesi, dopo "Aggiungi l'ipotesi": solo se almeno un'ipotesi non ha verdetto o ha feedback arrivati dopo il suo verdetto, e nessun feedback è entrato in Voce dopo l'ultima analisi dei temi `done` (e un'analisi dei temi c'è). Nota "Userai 1 delle {limite} analisi di {mese}.", attesa "Verdetto in corso…" con `aria-disabled`, spento con la nota del piano a quota finita. Il risultato lo annuncia la sezione ("2 verdetti: 2 confermate."), e il focus va sull'h2 "Ipotesi" perché il pulsante sparisce quando tutti i verdetti sono aggiornati. Se fallisce, S6 nella sezione.
- **`/billing` e landing**: "Il verdetto delle ipotesi usa 1 analisi" (EN "The hypothesis verdict uses 1 analysis") nei piani Free e Pro.
- **Cataloghi** `research`, `billing`, `landing` in italiano e inglese. `countFeedbackAfter` esportata da `src/lib/data.ts`.

## Visti fallire prima del codice

- vitest: 3 rossi in `synthesize.test.ts` (1 analisi rimasta, solo il verdetto, solo il verdetto senza ipotesi); 1 in `analytics.test.ts` (solo il verdetto e `first_analysis_completed`); 8 in `analyze-button.test.tsx`; 3 in `hypothesis-list.test.tsx`; 1 in `plan-pages.test.tsx` (riga del verdetto in italiano e inglese).
- Passati subito, perché il comportamento c'era già nel database: "with no analysis left and hypotheses: limit, no call" e "verdict only with the analyses used up: … limit … no model call".
- E2E: i tre test nuovi di `research.spec.ts` li ho scritti dopo il codice dell'interfaccia; il primo giro ha trovato un difetto vero (l'annuncio di "Solo il verdetto" spariva col pulsante), corretto spostandolo nella sezione.

## Decisioni

- **S4 come scritto nella spec** (AC 44): Mario non ha deciso diversamente, quindi con 1 analisi rimasta e ipotesi si fanno solo i temi e lo si dice.
- **Tolto il test "Free with 2 analyses used and hypotheses: the request of 2 is limit"** di S6: contraddiceva AC 44. Lo sostituiscono "with 1 analysis left and hypotheses the server reserves only themes…" e "with no analysis left and hypotheses: limit, no call".
- **Con ipotesi il costo dice sempre 2 analisi**, anche dopo la prima del mese (il disegno aveva "Ti restano {n}" dopo la prima): il costo va detto prima del clic.
- **La riga di `/billing`** è una frase in coda alla descrizione del piano; sulla landing è una riga della lista.
- **`main-flow.spec.ts`**: dopo l'analisi il pulsante col focus dice "Analizza solo i temi di 5 feedback", perché su Free restano 1 analisi e un'ipotesi.

## Cosa resta

- S10 (sala: "Analizza le risposte" solo temi e pulsante spento a quota finita, resto di AC 54), S11, S12.
- S4 dice "o subito con Pro" anche a chi è già Pro con 1 analisi rimasta: il testo del disegno è unico.
- Dopo un verdetto fallito, S6 dice di riprovare con "Solo il verdetto", ma il pulsante compare solo alle condizioni di AC 45: se ogni ipotesi aveva già un verdetto senza feedback nuovi, non c'è.
