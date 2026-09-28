# Schermo della sala: struttura rifatta, comportamento invariato

Segue `2026-09-28-sala-risposte-diventano-temi.md`. Nessun cambiamento visibile: stessi pallini, stesse bolle, stessi tempi.

## Cosa è stato fatto

- **La scena si calcola in funzioni pure testate** in `src/lib/room-viz.ts`:
  - `pileScene(places, responses)`: il mucchio, un pallino inchiostro per risposta.
  - `themesLayout(stage, gruppi)`: le bolle di un'analisi, centrate in verticale nella fascia alta, e i riquadri delle etichette già nelle coordinate della fascia. Le costanti (fascia al 60%, colonna di "Altro" a 0,55 di una colonna di tema, spazio minimo 12 px) stanno lì dentro.
  - `themesScene(layout, gruppi dal vivo, ordine)`: pallini e aloni del secondo atto; cresce solo "Altro", niente alone per "Altro" vuoto.
  - `Scene`, `Circle` (pallino e alone sono la stessa forma) e `DotColor` vivono lì. `DotColor` deriva dal tipo dei gruppi: se si aggiunge un tipo di tema e manca il suo colore, non compila.
  - `bubbleTargets` scarta da sola i pallini senza posto (feedback cancellati dopo l'analisi).
  - I tempi del volo (`FLY_DELAY_MAX`, `FLY_MS`, `GROW_DELAY`, `LABEL_DELAY`, `LABEL_STEP`) sono condivisi tra canvas ed etichette, con un test che tiene le etichette dopo il volo.
- **Tolti** `pileLayout` (usata solo dai test, ora puntati su `pileScene`), il `dotRadius` in cima a `bubbleLayout`, la correzione `lift` dopo il layout, la prop `stageRect` di `ThemesView`, la copia a mano di `roomGroups` per i gruppi dal vivo.
- **Uno stato solo per lo schermo**: `{ act: "pile", failure }` oppure `{ act: "themes", analysis, view }`, aggiornato in un colpo solo alla fine dell'analisi. Spariti il reset della vista e il doppio controllo `analysis && view`.
- **`PileView`** contiene il primo atto; `RoomScreen` ora interroga il server, lancia l'analisi e sceglie l'atto. `ThemesView` costruisce elenco e riga di conto dai gruppi.
- **Movimento ridotto**: invece di un ramo `still` in ogni punto del motore, il confronto tra scene gira sempre uguale e poi `finishAll()` mette tutti i pallini al loro posto finale.

## Verifica

Numeri nella descrizione della PR. Screenshot nuovi in `/tmp/voce-sala-viz/` con prefisso `r-`, confrontati pixel per pixel con i precedenti.

## Cosa resta

- Il difetto trovato durante il confronto (l'onda del mucchio non partiva a clic su un mucchio fermo) è corretto nel commit "Start the heap's breathing wave even when the heap is still".
