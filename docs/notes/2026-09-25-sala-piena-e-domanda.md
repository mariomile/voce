# Sala piena sul modulo pubblico e domanda modificabile

## Cosa è stato fatto

- **Limite per IP da 10 al minuto a 300 all'ora**, contato su tutti i moduli insieme. Il limite per workspace resta 300 all'ora. Migrazione `…_form_limit_for_full_rooms.sql` (sostituisce `submit_public_feedback`, stessa firma e stessi permessi). Brief aggiornato (decisione 7).
- Messaggio del modulo quando si supera il limite: "Riprova più tardi" invece di "tra qualche minuto", perché la finestra ora è di un'ora.
- **Campo "Domanda del modulo" nella Raccolta**, sotto i controlli del link: massimo 140 caratteri con conteggio, vuoto = domanda di default (mostrata come segnaposto e nel suggerimento), salvataggio con conferma.

## Decisioni

- **Perché 300 all'ora per IP e non un limite per IP e workspace.** In una sala piena i telefoni escono dallo stesso IP: nessun limite al minuto per IP basso regge 230 persone. Un limite per IP e workspace alto quanto la sala sarebbe uguale al tetto del workspace, quindi inutile. Contato su tutti i moduli, invece, impedisce a un solo IP di spargere invii su molti workspace. Contro un singolo modulo proteggono il tetto orario del workspace e il limite Free.
- Nessun cookie o token per visitatore: uno script li ignora, quindi non proteggono dagli abusi e aggiungono superficie.
- La domanda di default è scritta in due posti (database per il modulo, pagina per il segnaposto): è una frase, un helper condiviso tra SQL e TypeScript non esiste.

## Verifica

- `supabase db reset` da zero, `supabase db advisors`: nessun problema.
- `pnpm typecheck`, `pnpm lint`: zero errori. `pnpm build`: riuscito. `pnpm test`: 125 test, 0 falliti.
- Nuovi test: 230 invii dallo stesso IP in meno di un minuto su un workspace, tutti accettati (lo stesso test con la regola vecchia fallisce, verificato); 300 invii dallo stesso IP divisi su due workspace, il 301° rifiutato su entrambi, un altro IP passa; domanda salvata con spazi tolti, 140 sì e 141 no, NUL tolto, vuota torna al default, input non stringa rifiutato.
- Browser (Playwright): segnaposto con la domanda di default, campo fermo a 140, pulsante spento se non cambia nulla, domanda salvata e visibile subito sul modulo pubblico, vuota torna al default.
- Revisione indipendente da un subagente: permessi della funzione identici a prima (controllati nel database). Rilievo: con le emoji il conteggio in JavaScript è più severo di quello del database (un'emoji conta 2). Lasciato così, è lo stesso criterio di tutti gli altri campi dell'app.

## Cosa resta

- IP condivisi dal NAT degli operatori e script che mandano 300 invii in pochi secondi: in `docs/prima-dei-clienti-reali.md`.
