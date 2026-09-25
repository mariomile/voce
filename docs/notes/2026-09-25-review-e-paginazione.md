# Review di sicurezza e performance, paginazione dei feedback

## Cosa è stato fatto

- `docs/review.md`: review di sicurezza e performance fatta da due revisori indipendenti, con priorità alta, media e bassa e l'elenco di ciò che è in ordine.
- Corretta l'unica priorità alta (P1): la pagina Feedback caricava e mostrava tutti i feedback del workspace. Ora `listFeedback` legge una pagina da 100 con una sola richiesta, anche con il filtro per canale, e la pagina ha i link "Più recenti" e "Meno recenti" con "Pagina N di M".
- `docs/prima-dei-clienti-reali.md`: nuovo punto sul costo AI oltre la quota (analisi fallite gratuite, account Free multipli).

## Decisioni

- **Paginazione per numero di pagina, non a cursore.** Il numero di pagina sta nell'URL e si condivide; i totali vengono già dai conteggi per canale, quindi nessuna query in più. A 50.000 feedback l'ultima pagina salta 50.000 righe su un indice: accettabile ai volumi del brief.
- Una pagina oltre l'ultima mostra l'ultima; un valore non numerico mostra la prima.
- Nessuna priorità media o bassa corretta: la richiesta era correggere solo le alte.

## Verifica

Typecheck e lint senza errori, 190 test (137 unit e 53 RLS; il test dei 1.050 feedback ora controlla le 11 pagine, l'ultima pagina, il filtro per canale e la pagina fuori intervallo), build riuscita. Nel browser: workspace da 250 feedback, 3 pagine da 100, filtro "Supporto" con 2 pagine e 25 righe nella seconda.

## Cosa resta

- Le priorità medie di `docs/review.md`: header di sicurezza (M1) e indice per la pulizia dei tentativi del modulo (M2).
