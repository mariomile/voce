# Schermo della sala

Piano: `docs/plans/2026-09-28-schermo-della-sala.md`.

## Cosa è stato fatto

Una pagina `/sala` da proiettare alla masterclass PHC26 (1 ottobre, circa 230 PM che rispondono dal telefono). Si apre dalla Raccolta con "Apri lo schermo della sala".

- Fondo giallo come la landing: la domanda del modulo in grande, il QR code del modulo pubblico con l'indirizzo breve, il numero di risposte a scala da manifesto che si aggiorna ogni 3 secondi.
- "Analizza le risposte" lancia la stessa analisi di Temi e poi mostra al massimo 5 temi aperti: numero di feedback, tipo, titolo. "Torna al QR code" riporta al conteggio.
- Stati: modulo spento (con il link a Raccolta per riaccenderlo), modulo pieno per il limite Free (con il link a Piano), nessuna risposta (pulsante spento, "Si accende con la prima risposta."), analisi in corso, analisi fallita e quota finita con i messaggi di Temi.

## Decisioni

- **Il numero è il totale delle risposte del modulo pubblico** del workspace (feedback con canale `Modulo pubblico`, fissato dal database). Non riparte da zero quando si apre la pagina: una ricarica durante la sessione non deve azzerarlo. Per partire da 0 alla masterclass serve un workspace senza risposte precedenti, oppure cancellare quelle vecchie da Feedback.
- **Il conteggio arriva da una route (`GET /sala/status`), non da un'azione server.** Next.js esegue le azioni di una pagina una alla volta: durante un'analisi di qualche minuto il numero si sarebbe fermato. La route risponde `private, no-store`, solo numero e stato del modulo.
- **L'analisi è quella di Temi, senza cambi:** legge tutti i feedback del workspace degli ultimi 90 giorni, non solo le risposte della sala. Se il workspace usato in sala contiene altri feedback, i temi li includono. Stesse quote e stessi messaggi (`ANALYSIS_FAILURES` esportato da `analyze-button.tsx`, `analysisLimitNote` spostato in `src/lib/format.ts`).
- **Nessun testo dei feedback esce dal server per questa pagina:** `roomThemes` riduce i temi a id, tipo, titolo e numero. I titoli sono scritti dal modello a partire dai feedback: accettato.
- I temi compaiono solo dopo aver premuto il pulsante; ricaricando si torna al conteggio (ogni nuova analisi usa la quota).
- Stile: classi `room-*` in `src/app/landing.css`, accanto alle `l-*` della landing. Ogni taglia segue larghezza e altezza, così tutto sta in uno schermo da 853x480 (1280x720 al 150%) a 1920x1080. Il numero fa un balzo quando sale, fermo con `prefers-reduced-motion`.
- Nessuna tabella, migrazione, dipendenza o prompt nuovo.

## Verifica

Numeri nella descrizione della PR. Screenshot in `/tmp/voce-sala/` (vuoto, con risposte, temi, domanda lunga, modulo spento) a 1920x1080 e 1280x720 al 150%, presi dalla build locale con un'API Anthropic finta che restituisce 5 temi.

## Cosa resta

- Le e2e di registrazione (conferma via email su porta 3000) girano solo in CI; `e2e/room.spec.ts` è stato eseguito anche in locale su porta 3003.
- Non verificato su un proiettore vero né con 230 telefoni: il limite di 300 invii all'ora per IP e per workspace regge la sala (decisione 7 del brief).
- Niente pulsante "schermo intero": si usa quello del browser.
