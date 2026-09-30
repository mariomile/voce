# Schermo della sala: il verdetto delle ipotesi

Piano: `docs/plans/2026-09-29-verdetto-in-sala.md`. Per la masterclass PHC26 del 1 ottobre 2026: la sala vede la propria ipotesi confermata, smentita o da rivedere, con i numeri.

## Cosa è stato fatto

- **`roomVerdicts`** in `src/lib/room.ts`, funzione pura: dalle ipotesi della Sintesi (`listHypotheses`) tiene solo `id`, testo dell'ipotesi, parola del verdetto e i tre conteggi (a favore, contro, letti). Solo le ipotesi giudicate dall'ultima analisi del verdetto (`latestVerdictHypothesisIds` in `data.ts`): un'ipotesi che il modello lascia fuori tiene il verdetto di prima, per esempio di una prova, e la sala non lo mostra come nuovo. Ordine del PM, "da rivedere" quando nessun feedback è collegato (la regola di `VerdictWord` nella Sintesi).
- **Azione `roomVerdicts(researchId)`** in `src/app/research/[id]/sala/actions.ts`, accanto a `roomThemes`: legge come l'utente (RLS), un id sbagliato o di un altro workspace dà `[]`.
- **La sala fa l'analisi completa.** `synthesize` non ha più la modalità `"room"`: "Analizza le risposte" chiama `synthesize(researchId)` come "Analizza" della Sintesi. Senza ipotesi è una sola chiamata di temi, come prima. Con ipotesi: temi e verdetto, 2 analisi; con 1 sola analisi rimasta solo i temi (S4). Una modalità sconosciuta, `"room"` compresa, resta `failed` senza chiamate.
- **Schermo** (`room-screen.tsx`): dopo l'analisi, se la Research ha ipotesi, l'interruttore diventa "Bolle / Elenco / Verdetto". La vista Verdetto ha il titolo "Il verdetto" e una riga per ipotesi: testo del PM, parola con il segno, conteggi. Con una sola ipotesi la parola va a scala da manifesto (`.room-verdict` in `landing.css`). Se il verdetto di questo clic non arriva (`failed`) o non parte per la quota (`limit`) la vista lo dice e non mostra un verdetto di prima. Se arriva il verdetto ma non i temi di questo clic (falliti o nessuno aperto), lo schermo apre la sola vista Verdetto con una riga che lo dice, senza Bolle ed Elenco: mai i temi di prima.
- **Primo atto**: la nota sotto il pulsante ora dice "Con i temi arriva anche il verdetto delle ipotesi."
- Testi IT ed EN in `room.json`; parole e conteggi riusano `research.verdict.*`, le stesse della Sintesi. DESIGN.md, `docs/analytics.md` (`hypothesis_count` dalla sala), spec e DESIGN della Research (fuori scope, criteri 52 e 64, stato F10) aggiornati.

## Decisioni

- **Revisione indipendente** (un agente revisore sul diff): due difetti trovati e corretti prima del PR, il verdetto vecchio di un'ipotesi lasciata fuori mostrato come nuovo e il messaggio sbagliato quando falliscono i temi ma arriva il verdetto; più quattro righe della spec e del DESIGN della Research ancora sul comportamento di prima.
- **Niente citazioni né motivazione in sala.** Il fuori scope "Verdetto in sala" della spec esisteva perché le citazioni sono testo dei feedback: resta fuori tutto ciò che lo è, entra solo ciò che non lo è (testo dell'ipotesi scritto dal PM, parola, numeri).
- **Il relatore sceglie quando mostrare il verdetto.** Dopo l'analisi si vedono le bolle come prima; "Verdetto" è un clic.
- **Tolta la modalità `"room"` invece di tenerla identica a `"full"`**: una modalità che non cambia nulla è un ramo morto.
- **"su N letti" conta tutti i feedback della Research mandati al modello** (fino a 500), non solo le risposte della sala: è lo stesso numero della Sintesi.

## Verifica

- Test unitari: `room.test.ts` (4 nuovi), `sala/actions.test.ts` (4 nuovi, contro il Supabase locale), `room-screen.test.tsx` (3 nuovi, 1 aggiornato). Tolti i 3 test della modalità "room" in `synthesize.test.ts` e `analytics.test.ts`, esteso quello delle modalità sconosciute.
- E2E `e2e/room.spec.ts`: il nuovo "with hypotheses, Analizza le risposte also runs the verdict: its word and counts, never the quotes" (parola, conteggi, nessun testo dei feedback, righe `themes` e `verdict` nel database) e il controllo che senza ipotesi il pulsante "Verdetto" non c'è; "the verdict that did not come says so, and a verdict without this click's themes shows alone" (il finto modello Anthropic ora fa fallire i temi di feedback con `TEMI_FUORI_SCHEMA`).
- Screenshot a 1920x1080 e 853x480 (1280x720 al 150%), con 1 e 3 ipotesi e 230 risposte: nessuno scorrimento in nessuno dei 4.

## Allineamento con main (30 settembre)

Il PR è stato unito con main dopo #30 (conteggi del verdetto completi, una riga di evidenza per feedback), #31, #32, #33, #34, #25/#26 e #27.

- **Conteggi veri, citazioni esempi.** `supporting` e `contradicting` di `listHypotheses` ora sono tutti i feedback a favore e contro, non un campione: la sala li mostra senza cambiare codice. Le citazioni restano fuori dalla sala come prima.
- **Stesse parole della Sintesi.** `research.verdict.counts` dopo #32 dice "{n} feedback a favore · {m} contro · su {r} letti": aggiornati `room-screen.test.tsx`, `e2e/room.spec.ts` e `DESIGN.md`.
- **Test della sala sul nuovo formato del modello.** `sala/actions.test.ts` costruisce le risposte finte con `themesOutput` e `verdictOutput` (righe `assignments` ed `evidence`); tolti da `synthesize.test.ts` i due test della modalità `"room"` arrivati da main.
- **Il verdetto non rallenta i temi.** Temi e verdetto partono insieme; in produzione (ultime 3 analisi con ipotesi) il verdetto ha sempre finito prima dei temi: 26 s contro 35 s, 9 s contro 23 s, 8,5 s contro 52 s. Senza ipotesi la sala fa una sola chiamata, come prima.

## Cosa resta

- Con 5 ipotesi lunghe la vista può superare l'altezza di uno schermo 853x480: provato fino a 3.
