# Prima dei clienti reali

Cose da risolvere prima di aprire Voce a clienti reali. Finché siamo in modalità test restano fuori scope, ma non si dimenticano.

## Dati e AI

- **Elaborazione AI in UE.** Oggi Claude passa da Vercel AI Gateway e l'elaborazione in UE non è garantita. Serve una soluzione che tenga i dati dei feedback in UE, o una scelta esplicita e documentata.

## Modulo pubblico

- **Limiti di invio** (10 al minuto per IP, 300 all'ora per workspace) non ancora costruiti. Oggi la funzione del database che salva i feedback del modulo si può chiamare anche direttamente, senza passare dall'app: così si salta il campo anti-bot e, con il link in mano, uno script può riempire in pochi secondi i 100 posti di un workspace Free. I limiti vanno messi nella funzione del database, oppure la funzione va resa chiamabile solo dal server.

## Database in produzione

- Il progetto Supabase di produzione non esiste ancora. Va creato in regione UE, con la conferma dell'email attiva, un SMTP vero per le email di Auth, il template di conferma di `supabase/templates/confirmation.html` e gli URL di redirect del dominio vero.

## Legale

- Da definire: privacy policy, termini di servizio, accordo sul trattamento dei dati (DPA) con i clienti, elenco dei sub-responsabili.

## Fiscale

- Da definire: fatturazione, IVA e configurazione fiscale di Stripe.
