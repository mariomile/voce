# Schermo della sala: le risposte diventano temi

## Obiettivo

Rendere `/sala` spettacolare su un proiettore davanti a circa 230 PM (masterclass PHC26, 1 ottobre 2026). Due atti sulla stessa schermata:

1. **La sala scrive.** Ogni risposta del modulo pubblico è un pallino che cade dall'alto e si ammucchia sopra il numero gigante. Quando il conteggio sale tra un aggiornamento e l'altro, i pallini nuovi cadono uno alla volta. All'apertura della pagina le risposte già arrivate cadono in una cascata breve. Mai testo dei feedback: solo pallini.
2. **Analizza le risposte.** Quando arriva il risultato dell'analisi, i pallini volano e si raccolgono in bolle, una per tema (i primi 5), più un piccolo gruppo "altro" per il resto. L'area di ogni bolla è proporzionale ai feedback del tema: ogni pallino ha la stessa taglia, quindi la bolla contiene esattamente tanti pallini quanti sono i feedback del tema. Sotto ogni bolla: numero, tipo (Problema, Opportunità, Apprezzamento con i colori del kit) e titolo. Si legge in 5 secondi: tante voci, pochi problemi veri. L'elenco di prima resta disponibile con un interruttore "Elenco".

Durante l'analisi (circa 40 secondi con il modello vero) il mucchio respira: un'onda leggera lo attraversa, insieme allo stato "Analisi in corso…" che c'è già.

## Scelte

- **Un solo canvas a tutto schermo**, fisso, sotto il testo e sopra lo sfondo, che resta montato tra i due atti: così i pallini possono volare da una disposizione all'altra. Il canvas è decorativo (`aria-hidden`): numeri e titoli restano testo vero nella pagina.
- **Niente React per ogni pallino.** Un piccolo motore in un `useEffect` tiene i pallini in memoria e li disegna con `requestAnimationFrame`, raggruppati per colore (un `fill` per colore). React calcola solo le posizioni di arrivo, quando cambia il conteggio o la misura dello schermo. Il ciclo si ferma quando nulla si muove.
- **Nessuna dipendenza nuova.** Le disposizioni sono geometria semplice scritta a mano:
  - mucchio: griglia esagonale nell'area libera tra la domanda e il numero, riempita dal centro verso i lati e dal basso verso l'alto (una duna). Il passo della griglia scende a gradini (60, 120, 250, 500, 1000, 2000 posti) così i pallini cambiano taglia di rado;
  - bolle: ogni bolla è una spirale di girasole (angolo aureo) di `n` pallini, raggio proporzionale a √n, bolle in fila dalla più grande, appoggiate sullo stesso pavimento, colonne larghe almeno quanto serve al titolo.
- **Quali pallini vanno in quale bolla:** al momento dell'analisi i pallini si ordinano da sinistra a destra e riempiono le bolle nello stesso ordine (i più a sinistra nella bolla più grande): il volo si legge come uno smistamento, non come un rimescolamento. I pallini arrivati dopo l'analisi vanno in "altro".
- **Conteggi:** il numero dei pallini del mucchio è il conteggio delle risposte del modulo pubblico. Nelle bolle ogni tema ha esattamente i suoi feedback; "altro" contiene le risposte che restano (risposte meno la somma dei primi 5 temi, mai sotto zero). L'analisi legge tutti i feedback del workspace e un feedback può stare in più temi (fino a 3): se la somma dei temi supera le risposte, i pallini che mancano compaiono direttamente nelle bolle. "Altro" non mostra un numero, perché con i temi che si sovrappongono non sarebbe un conteggio esatto di nulla.
- **Movimento ridotto** (`prefers-reduced-motion`): nessun volo, nessuna caduta, nessuna onda; le disposizioni finali compaiono subito.
- **Sfondo:** il primo atto resta giallo; nel secondo la pagina passa al bianco carta sotto la testata gialla, come l'elenco di prima, e i pallini prendono il colore del tipo di tema. Pallini "altro" in grigio.
- Stati esistenti invariati: modulo spento, modulo pieno, nessuna risposta, quota finita, analisi fallita.
- Nessuna tabella, migrazione, prompt, costo AI o dipendenza nuova. Nessun testo dei feedback sullo schermo.

## Passi

1. **Geometria pura** in `src/lib/room-viz.ts`: posti del mucchio, gruppi dai temi, disposizione delle bolle, assegnazione dei pallini alle bolle, ritardi a cascata.
   - Verifica: test unitari (`src/lib/room-viz.test.ts`), scritti prima del codice: numero di pallini per bolla uguale ai feedback del tema, "altro" mai negativo, tutto dentro l'area, nessuna sovrapposizione, cascata con durata massima.
2. **Motore e canvas** in `src/components/room-dots.tsx` e schermata aggiornata in `src/components/room-screen.tsx` (mucchio, onda durante l'analisi, bolle con etichette, interruttore Elenco), stili `room-*` in `src/app/landing.css`, DESIGN.md.
   - Verifica: typecheck, lint, test, build; E2E `e2e/room.spec.ts` aggiornata (bolla con numero, tipo e titolo; interruttore Elenco; ancora nessun testo dei feedback); screenshot a 1920x1080 e 1280x720 al 150% con 12 e 230 risposte e con i temi; video del passaggio; misura degli FPS con 300 pallini.
3. **Nota** in `docs/notes/2026-09-28-sala-risposte-diventano-temi.md`.
