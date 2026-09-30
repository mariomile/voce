# Sala: la rete che cade durante l'analisi

Trovato dal controllo in produzione prima della masterclass. Screenshot in `/tmp/voce-errorfix/`.

## Fatto

- **Sala.** Se la server action `synthesize` (o il caricamento di temi e verdetto subito dopo) non risponde, perché la rete cade o la funzione supera il tempo massimo, lo schermo resta sulla pila con il QR code e sotto "Analizza le risposte" compare: "La connessione è caduta. Controlla la rete e riprova: se l'analisi era già partita, attendi un minuto e premi di nuovo." Il pulsante torna usabile. Prima l'eccezione arrivava al boundary di Next e il proiettore mostrava la pagina inglese "This page couldn't load".
- **Pagina d'errore dell'app.** `src/app/error.tsx` e `src/app/global-error.tsx`: stessa impaginazione del 404, in italiano o inglese come il resto dell'app, con "Riprova" e "Tutte le Research". `global-error` non ha il provider delle traduzioni: legge il cookie della lingua e il browser, italiano finché la pagina non è viva.

## Decisioni

- **La logica dell'analisi della sala in una funzione (`analyzeRoom`)** che non lancia mai: così il caso "la chiamata rifiuta" si prova con un test unitario, senza browser.
- **"Riprova" chiama `retry`, non `reset`.** In Next 16.3 `retry` ricarica i dati del segmento e poi lo ridisegna; `reset` ridisegna soltanto, quindi un errore di un Server Component si ripresenterebbe uguale.
- **Sintesi, Solo il verdetto, Report e Chiedi** gestivano già la chiamata che rifiuta: non toccati.

## Come è stato verificato

- Test unitari nuovi su `analyzeRoom` (azione che rifiuta, temi o verdetto che non arrivano) e sulle pagine d'errore.
- E2E nuovo in `e2e/room.spec.ts`: la richiesta della server action viene interrotta con `page.route(...).abort()`; sul codice di prima il test fallisce con "This page couldn’t load", sul codice nuovo mostra il messaggio e la seconda pressione produce i temi.
