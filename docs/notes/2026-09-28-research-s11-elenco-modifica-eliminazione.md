# Research, S11: elenco completo, modifica della domanda, eliminazione

Undicesimo passo della Research (piano: `docs/plans/2026-09-28-research.md`, slice S11 di `.builderos/initiatives/research/05-build-plan.md`). Criteri, interi o in parte: 14 (resto), 56, 57, 58 (resto: `finish_analysis`), 59.

## Cosa è stato fatto

- **Elenco** (`listResearch`, `ResearchRow`): righe ordinate per attività, la più recente tra creazione, ultimo feedback entrato in Voce e ultima analisi finita. Stato della riga come in DESIGN.md: "{n} temi" (temi dell'ultima analisi dei temi), "{h} ipotesi: {c} confermate, {s} smentite, {r} da rivedere" con le sole parole presenti (senza verdetti: "{h} ipotesi"), "{k} feedback nuovi da analizzare" (entrati dopo l'ultima analisi dei temi; prima della prima, tutti), "Modulo spento", "Nessun feedback ancora". La vista `research_feedback_stats` ha `last_created_at`.
- **Modifica della domanda** (`updateResearchQuestion`, `ResearchQuestion` nella testata di ogni scheda): "Modifica" (nome accessibile "Modifica la domanda") apre il campo con Salva e Annulla; Invio salva, Esc e Annulla chiudono e riportano il focus su "Modifica"; RC1 e RC2 riportano il focus nel campo con `aria-invalid`; RC3 e RC4 sotto i pulsanti. Cambia solo `research.question`: temi, ipotesi e verdetti restano, e la domanda non entra in nessun prompt.
- **Eliminazione** (`deleteResearch`, `DeleteResearch` in fondo alla Raccolta): link "Elimina la Research", conferma D1 nella riga con la domanda e il numero dei feedback, focus su "Annulla", Esc annulla; D2 o la nota della sessione se non riesce. Riuscita: il server manda a `/research`, che dice "Research eliminata." nella regione di stato e mette il focus sul titolo; se era l'ultima, il primo accesso (F1) con lo stesso annuncio.
- **Database** (migrazione cresciuta in place): trigger `before delete` su `research` che svuota `input`, `output`, `issues` dei registri delle sue analisi e domande; `analysis_runs.input` e `question_runs.input` possono essere nulli; trigger `before update` sui due registri che non riprende testi per una riga senza Research (un'analisi che si chiude dopo l'eliminazione). `finish_analysis` fallisce con `research_deleted` se la Research non c'è più, con un lucchetto `for key share` che aspetta un'eliminazione in corso. Le righe di `analyses` e `questions` restano con `research_id` nullo e contano nella quota: eliminare non restituisce analisi.
- **Cataloghi** IT ed EN: `research.list.row.*` (stati), `research.list.deleted`, `research.form.edit`, `editLabel`, `save`, `saving`, `research.delete.*` (D1, D2).

## Visti fallire prima del codice

- pgTAP: `research.test.sql` 3 rossi (registri delle analisi e delle domande con i testi, run chiuso dopo l'eliminazione con l'output); `analysis.test.sql` "finish_analysis on a deleted Research fails with research_deleted" (arrivava `23502` sul `not null` dei temi). Passati subito perché c'erano già: cascata di feedback, temi, ipotesi, verdetti e collegamenti, `research_id` nullo su analisi e domande, analisi che contano.
- vitest: 7 rossi in `research/actions.test.ts` (le due action non esistevano), 1 in `research-row.test.tsx` (stati), 1 in `data.test.ts` (ordine per attività e stati). In `synthesize.test.ts` il test della Research eliminata durante l'analisi ha trovato un difetto vero: l'errore del database finiva nel registro come `[object Object]`, perché l'errore di Supabase non è un `Error`. Ora `errorMessage` legge il suo `message`, e il registro dice `research_deleted`.
- Passato subito: "neither the themes nor the verdict prompt contains the Research question" (la domanda non era mai entrata nei prompt).
- E2E: i due test nuovi di `research.spec.ts` rossi prima dei componenti; poi rossi per due difetti veri: il focus non tornava su "Modifica" (il componente si rimontava col testo nuovo) e "Research eliminata." spariva perché il redirect della action arriva al browser come errore, che veniva preso per D2 (ora `unstable_rethrow`).

## Decisioni

- **Trigger `before delete`, non `after delete` come nella spec**: dopo la cancellazione la chiave esterna ha già messo a nullo `research_id` di analisi e domande, e il trigger non saprebbe più quali registri svuotare.
- **I registri non riprendono testi dopo l'eliminazione**: senza il trigger sui registri, un'analisi in corso che fallisce dopo l'eliminazione riscriverebbe l'output del modello nel registro.
- **"{n} temi" conta tutti i temi dell'ultima analisi**, non solo quelli aperti; l'attività usa l'ingresso in Voce del feedback (`created_at`), non la sua data.
- **Il flag "Research eliminata." vive nel browser**, come il focus dopo la creazione: una visita normale a `/research` non dice nulla, e un ricaricamento non ripete l'annuncio.

## Cosa resta

- S12.
- Dalla Raccolta senza sessione il proxy manda la action a `/login`, come le altre action della Raccolta: `deleteResearch` risponde `session`, ma la nota E-SESS non si vede da lì.
- Le altre action che scrivono l'errore del database nei registri (Chiedi) usano ancora `String(error)`: non le ho toccate.
