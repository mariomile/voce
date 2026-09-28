# Schermo della sala: le risposte diventano temi

Piano: `docs/plans/2026-09-28-sala-risposte-diventano-temi.md`.

## Cosa è stato fatto

- **Primo atto, la sala scrive.** Ogni risposta del modulo pubblico è un pallino inchiostro che cade dall'alto e si ammucchia sopra il numero gigante. Quando il conteggio sale, i pallini nuovi cadono uno alla volta (110 ms l'uno, al massimo 2,4 secondi in tutto) e ognuno lascia un anello dove atterra. All'apertura le risposte già arrivate cadono in una cascata di al massimo 1,2 secondi.
- **Durante l'analisi** un'onda lenta attraversa il mucchio, insieme a "Analisi in corso…".
- **Secondo atto, i temi.** Il fondo passa al bianco e i pallini volano su un arco in una bolla per tema (i primi 5), del colore del tipo. Sotto ogni bolla numero, tipo e titolo; ultima una bolla grigia "Altro" con le risposte che restano. Una riga dice il conto: "230 risposte, 5 temi: 2 problemi, 2 opportunità, 1 apprezzamento." L'interruttore "Bolle / Elenco" mostra le righe di prima. "Torna al QR code" riporta i pallini nel mucchio.
- Geometria pura in `src/lib/room-viz.ts` (test in `room-viz.test.ts`), motore del canvas in `src/components/room-dots.tsx`, schermata in `src/components/room-screen.tsx`, stili `room-*` in `src/app/landing.css`, DESIGN.md aggiornato.

## Decisioni

- **Un canvas solo, sotto il testo**, montato per tutta la pagina: così gli stessi pallini passano da un atto all'altro. React calcola solo le posizioni di arrivo quando cambia il conteggio o la misura dello schermo; il motore anima i pallini in memoria, un `fill` per colore, e si ferma quando nulla si muove. Il canvas è `aria-hidden`: numeri e titoli restano testo.
- **Nessuna dipendenza.** Mucchio su griglia esagonale riempita dal basso e dal punto sopra il numero verso i lati; bolle come spirali di girasole. Il passo del mucchio cambia solo a gradini (60, 120, 250, 500, 1000, 2000 posti, con spazio per 1,7 volte tanto così un gradino pieno resta un mucchio): una risposta nuova non sposta le altre.
- **Stessa taglia di pallino in tutte le bolle**: l'area di una bolla è il numero dei suoi feedback, e la bolla contiene esattamente quel numero di pallini (verificato dai test).
- **"Altro" senza numero.** L'analisi legge tutti i feedback del workspace, non solo quelli della sala, e un feedback può stare in fino a 3 temi: "risposte meno la somma dei temi" non è il conteggio esatto di nulla. Se la somma dei temi supera le risposte, i pallini che mancano compaiono direttamente nelle bolle. Le risposte che arrivano dopo l'analisi vanno in "Altro".
- **Smistamento da sinistra a destra**: al momento dell'analisi i pallini più a sinistra vanno nella bolla più grande, e così via. Il volo si legge come un ordinamento.
- `prefers-reduced-motion`: niente cadute, voli, onde o anelli; le disposizioni finali compaiono subito.
- Nessuna tabella, migrazione, prompt, costo AI o dipendenza nuova.

## Verifica

Numeri nella descrizione della PR. Prove in `/tmp/voce-sala-viz/`: screenshot a 1920x1080 e 1280x720 al 150% (vuoto, 12 e 230 risposte, analisi in corso, temi, elenco, ritorno, modulo spento, movimento ridotto) e il video `sala-risposte-diventano-temi.webm`, presi dalla build locale con un'API Anthropic finta che restituisce 5 temi.

## Cosa resta

- Non provato su un proiettore vero né su un portatile lento vero: la misura con la CPU rallentata 4 volte è in Chromium headless.
- Le e2e di registrazione girano solo in CI (porta 3000); `e2e/room.spec.ts` è stata eseguita anche in locale su porta 3004.
