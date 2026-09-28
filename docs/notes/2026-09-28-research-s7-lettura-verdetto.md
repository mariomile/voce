# Research, S7: leggere il verdetto

Settimo passo della Research (piano: `docs/plans/2026-09-28-research.md`, slice S7 di `.builderos/initiatives/research/05-build-plan.md`). Criteri, interi o in parte: 38 (resto: parola del verdetto dal catalogo), 42, 43, 46, 47, 70.

## Cosa è stato fatto

- **`listHypotheses`** (`src/lib/data.ts`) restituisce per ogni ipotesi `writtenAt` e il verdetto o `null` (tolto `hasVerdict`): parola, ragionamento, `feedbackRead`, `arrivedAfter`, conteggi a favore e contro contati dal vivo sui `verdict_feedback` esistenti, citazioni per lato in ordine di `quote_rank` (canale e data, mai il cliente), e `arrivedAfterVerdict`: i feedback della Research entrati in Voce dopo l'avvio dell'analisi del verdetto.
- **`HypothesisList`**: colonna di 148 px con segno `aria-hidden` e parola dal catalogo (`research.verdict`), in inchiostro, e sotto "{f} a favore · {c} contro · su {n} letti"; a destra ragionamento come testo, "A favore" (fino a 3) e "Contro" (fino a 2) con `Quote`, V1 o V2, "Dopo questo verdetto sono arrivati {k} feedback." solo con k > 0. Senza collegamenti: "Da rivedere", "Nessuno dei {n} feedback letti ne parla.", niente ragionamento, niente conteggi.
- **S6 spostato nella sezione Ipotesi**: una regione `role="status"` rossa in fondo alla sezione. Il pulsante di analisi e la sezione lo condividono con un contesto piccolo, `src/components/synthesis-outcome.tsx`.
- **Annuncio di fine analisi**: "Analisi finita: {m} temi. {h} verdetti: {c} confermate, …", solo le parole che compaiono. `synthesize` restituisce `verdicts` per parola (riletti dal database dopo `finish_verdict`, che può portare un verdetto a `to_review`) al posto di `verdictCount`.
- **Pulsante di analisi prima delle ipotesi**: sta in cima alla scheda Sintesi, sopra la sezione Ipotesi. Ordine del Tab: schede interne, "Passa a Pro" se c'è, pulsante di analisi, ipotesi, temi.
- **E2E di AC 70** (`e2e/main-flow.spec.ts`, riscritto): dopo la registrazione solo tastiera (Tab, Maiusc+Tab, Invio, testo), 5 note, un'ipotesi, "Analizza 5 feedback", verdetto con citazione evidenziata e conteggi, temi, focus ancora sul pulsante.
- **Cataloghi**: `research.verdict` e le parti dell'annuncio in `research.synthesis.analyze`, in italiano e inglese.
- **Test di AC 46**: `docs.test.ts` controlla tutti i file sotto `src/app/(app)/research` e `hypothesis-list.tsx`.

## Visti fallire prima del codice

- vitest: `data.test.ts` su `listHypotheses` (forma nuova); 8 rossi in `hypothesis-list.test.tsx`; 2 in `analyze-button.test.tsx`; 4 in `synthesize.test.ts` su `verdicts`.
- E2E: `main-flow.spec.ts` rosso sul codice di prima (rimesso con `git stash`), verde dopo.
- Non visti rossi: "a hypothesis written after 29 of 37 feedback reads 8 arrived after" in `synthesize.test.ts` (scritto dopo `listHypotheses`) e il test di AC 46, che è una guardia su file.

## Decisioni

- **"Dopo questo verdetto" conta dall'avvio dell'analisi del verdetto**, non dal salvataggio (`hypothesis_verdicts.created_at`): un feedback arrivato durante l'analisi non era nel prompt, e la spec (casi limite) lo vuole contato.
- **Senza collegamenti la parola è sempre "Da rivedere"**, qualunque cosa abbia salvato il modello, come dice AC 47.
- **Il pulsante di analisi resta dopo le schede interne** (deviazione di S3), ma ora viene prima delle ipotesi, come nel disegno.
- **"1 verdetto" e "1 feedback" al singolare**: i testi del disegno sono al plurale, i cataloghi hanno la forma singolare.

## Cosa resta

S9 (costo, 1 analisi rimasta, "Solo il verdetto": oggi S6 dice di riprovare con un pulsante che arriva lì), S10, S11, S12.
