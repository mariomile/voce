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

## Priorità medie corrette (secondo passo)

- **M1, header di sicurezza.** `headers()` in `next.config.ts` su tutte le pagine: `Content-Security-Policy: frame-ancestors 'none'`, `X-Frame-Options: DENY` (per i browser vecchi), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. Nessuna pagina va incorniciata: Stripe apre il checkout con un redirect, non in un iframe. La CSP completa resta da fare, provandola con PostHog e Stripe.
- **M2, indice per la pulizia.** Nuova migrazione `20260925200000_form_attempts_cleanup_index.sql` con un indice su `private.form_attempts (created_at)`. Scelto l'indice e non `pg_cron`: una riga, nessun job da mantenere, la pulizia resta dove già funziona.
- **M3** resta com'è: il lock è ciò che rende affidabile il limite Free.

Verifica: `supabase db reset` da zero riuscito; con 50.000 tentativi nell'ultima ora la cancellazione usa `form_attempts_created_at_idx` (0,03 ms), senza l'indice leggeva tutto `form_attempts_workspace_idx` (0,25 ms, in crescita con la tabella). Typecheck e lint senza errori, 190 test passati, build riuscita. Con `pnpm start` i quattro header arrivano su `/login` (200), su un link del modulo inesistente (404) e su `/feedback` (redirect 307).

## Cosa resta

- Le priorità basse di `docs/review.md` e la CSP completa.
