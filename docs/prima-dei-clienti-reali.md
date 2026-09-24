# Prima dei clienti reali

Cose da risolvere prima di aprire Voce a clienti reali. Finché siamo in modalità test restano fuori scope, ma non si dimenticano.

## Dati e AI

- **Elaborazione AI in UE.** Oggi Claude passa da Vercel AI Gateway e l'elaborazione in UE non è garantita. Serve una soluzione che tenga i dati dei feedback in UE, o una scelta esplicita e documentata.

## Modulo pubblico

- **Chiave segreta su Vercel.** Il modulo pubblico ora salva passando dal server con `SUPABASE_SECRET_KEY`: senza questa variabile su Vercel il modulo non funziona.
- **IP del visitatore.** Il limite per IP si fida di `x-real-ip` e `x-forwarded-for`, che Vercel imposta da sé. Se l'app gira dietro un altro proxy, va verificato che quelle intestazioni non arrivino dal visitatore.
- **IP condivisi.** Il limite per IP (300 all'ora) conta tutti i moduli insieme. Dietro il NAT di un operatore mobile molti sconosciuti condividono lo stesso IP: con traffico vero, se si vedono rifiuti tra workspace diversi, contare per IP e workspace. E uno script da un solo IP può mandare 300 invii in pochi secondi: il tetto resta l'ora del workspace, ma un Free si riempie subito. Da rivedere con dati veri (captcha o verifica leggera).
- **Tentativi del modulo.** Per i limiti si salva un hash con chiave dell'IP (la chiave è `SUPABASE_SECRET_KEY`, il database non la conosce). Le righe più vecchie di un'ora si cancellano al primo invio successivo: se un modulo non riceve più invii restano lì. Da citare nel registro dei trattamenti, o da pulire con un job programmato.

## Database in produzione

- Il progetto Supabase di produzione non esiste ancora. Va creato in regione UE, con la conferma dell'email attiva, un SMTP vero per le email di Auth, il template di conferma di `supabase/templates/confirmation.html` e gli URL di redirect del dominio vero.

## Legale

- Da definire: privacy policy, termini di servizio, accordo sul trattamento dei dati (DPA) con i clienti, elenco dei sub-responsabili.

## Fiscale

- Da definire: fatturazione, IVA e configurazione fiscale di Stripe.
