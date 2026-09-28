# Landing davvero bold, testo e grafica

## Cosa è stato fatto

La landing è stata riscritta per la sala di PHC26 del 1 ottobre: circa 230 PM la vedono da un proiettore e dal telefono. Deve dire cosa fa Voce in pochi secondi e non sembrare un modello di SaaS.

Primo passaggio: stesso sistema dell'app, titolo a 96 px. Mario: "ti ho detto di fare roba BOLD". Secondo passaggio: la landing esce dal sistema sobrio dell'app, solo lei.

- Primo schermo tutto giallo. Titolo "Chi si lamenta più forte non decide la roadmap." in Hanken 900 fino a 200 px, "non decide la roadmap." in una fascia inchiostro con testo giallo. Una riga di testo e un pulsante grande.
- "58" alto un terzo dello schermo, a cavallo tra il giallo e il bianco, accanto al tema d'esempio.
- "Parole diverse, stesso problema.": le cinque citazioni in un solo paragrafo serif grande, ognuna con il canale in un'etichetta e la frase chiave evidenziata. Dichiarate inventate.
- Raccogli, Analizza, Decidi larghi quanto lo schermo, una riga sotto ciascuno.
- Chiedi su fondo inchiostro: domanda scritta in grande, "12" in giallo, una riga di risposta e due citazioni. Dichiarato esempio.
- Prezzi a scala da manifesto, chiusura su fondo giallo.
- Testo dimezzato ovunque.
- Responsive: prima a 390 px il layout usciva dallo schermo.

## Decisioni

- Nessun font, colore o dipendenza nuova: stessi token, Hanken e Literata a pesi e taglie estremi. Le regole della landing stanno in `src/app/landing.css`; `globals.css`, `design/kit.css` e le schermate dell'app non cambiano.
- Le taglie da display aggiunte nel primo passaggio (`--text-7xl`...`9xl`) sono state tolte: la landing usa le sue classi, il sistema dell'app resta com'era.
- Movimento: conteggio che sale, evidenziatori in sequenza, domanda che si scrive, risposta che sale. Partono una volta quando il blocco entra nello schermo, grazie a un piccolo componente client (`src/components/in-view.tsx`, IntersectionObserver). Prima e senza JavaScript tutto è nello stato finale; con `prefers-reduced-motion` non parte niente. Scartate le animazioni legate allo scroll: su un telefono che scorre veloce il conteggio si sarebbe fermato a metà.
- Niente numeri, loghi o testimonianze inventate. "Non serve una carta" viene dalla pagina di registrazione.
- Le righe dei piani sono identiche e lette da `PLAN_LIMITS`: nessun test cambiato.

## Verifica

Vedi la descrizione della PR #8 per i numeri. Screenshot in `/tmp/voce-landing/` con prefisso `bold2-`.

## Cosa resta

- Le e2e girano solo in CI.
