# Sala piena sul modulo pubblico e domanda modificabile

## Obiettivo

1. Il modulo pubblico regge una sala di 230 persone che escono tutte dallo stesso IP (Wi-Fi della sala o operatore), senza smettere di proteggere dagli abusi.
2. Nella Raccolta il PM cambia la domanda del modulo pubblico, al massimo 140 caratteri.

## Passi

1. **Limite per IP da 10 al minuto a 300 all'ora**, sempre contato su tutti i workspace insieme. Il limite per workspace resta 300 all'ora. Nuova migrazione che sostituisce `submit_public_feedback` (stessa firma).
   - Verifica: `supabase db reset`, test che manda 230 invii dallo stesso IP in un minuto (tutti accettati), test che il 301° invio dallo stesso IP nell'ora viene rifiutato anche su un altro workspace, mentre un altro IP passa.
2. **Brief:** aggiornare la decisione 7.
3. **Campo "Domanda" nella Raccolta**, nella card del modulo pubblico. Azione server con schema (vuota = domanda di default, massimo 140 caratteri). Il database ha già colonna, vincolo e permesso.
   - Verifica: test dell'azione (salva, vuota torna al default, 141 caratteri rifiutata, NUL), browser.
