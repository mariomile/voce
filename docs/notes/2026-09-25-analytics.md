# Analytics con PostHog

## Fatto

- Quattro eventi di attivazione verso PostHog UE, mandati solo dal server: `signed_up`, `first_feedback_added`, `first_analysis_completed`, `upgraded_to_pro`. Elenco, proprietà e funnel della metrica in `docs/analytics.md`.
- `src/lib/analytics.ts`: una sola funzione, `trackMilestone`. Senza `POSTHOG_KEY` esce subito: niente chiamate, niente righe nel database, niente errori.
- Migrazione `analytics_milestones`: una riga per workspace ed evento già partito. RLS attiva, nessun accesso per anonimi e utenti.
- Agganci: conferma email (`/auth/confirm`), callback Google, feedback manuale, import CSV, modulo pubblico, fine analisi, webhook Stripe (tramite `syncCustomer`).
- `saveBilling` restituisce anche il workspace salvato, per sapere chi è passato a Pro.

## Decisioni

- **Niente SDK, né nel browser né sul server.** Una `fetch` all'API di cattura di PostHog basta per quattro eventi. Niente script nel browser vuol dire niente cookie, niente banner e nessun rischio che l'autocapture legga il testo dei feedback dalla pagina. `posthog-node` avrebbe richiesto di gestire lo svuotamento della coda in ambiente serverless.
- **Identità = workspace**, non utente: la metrica del brief è per workspace, e l'id del workspace non porta con sé email o nome. Nessun profilo persona, nessuna geolocalizzazione.
- **Una sola volta per workspace, decisa dal database.** Contare i feedback prima o dopo l'inserimento sbaglia con la sala piena (tanti eventi doppi o nessuno). L'inserimento con `on conflict do nothing` lascia partire un solo evento anche con invii simultanei. Si registra prima di mandare: in caso di errore di PostHog l'evento si perde, mai doppio.
- **Invio dopo la risposta** con `after()`: l'utente non aspetta PostHog. La ricerca del workspace (modulo pubblico, conferma, Google) avviene anch'essa lì, e solo se la chiave c'è.
- **I test non mandano mai eventi**: `vitest.config.mts` svuota `POSTHOG_KEY`.

## Verifiche

- `supabase db reset`: la migrazione si applica da zero; test RLS sulla nuova tabella.
- Test di `analytics.ts` contro il database locale, con PostHog finto: senza chiave nulla, un solo invio per due chiamate, cinque invii simultanei dal modulo producono un solo evento senza testo né email, errore di PostHog solo nei log.
- Test degli agganci: analisi (anche che un'analisi fallita non manda nulla), passaggio a Pro, CSV (non in anteprima né con soli duplicati), feedback manuale.
- Browser, server di sviluppo con PostHog intercettato: registrazione con conferma email, due feedback manuali, due invii dal modulo pubblico. Partiti esattamente `signed_up`, `first_feedback_added` (manual) e `first_feedback_added` (form), solo con l'id del workspace. Stesso flusso senza chiave: nessun evento, nessuna riga, nessun errore.
- Il test "two clicks at once make one analysis" dipendeva dai tempi: con il nuovo file di test in parallelo falliva 2 volte su 12. Ora il modello finto trattiene la risposta finché il secondo clic non è stato rifiutato: 15 esecuzioni su 15 verdi.

## Resta

- Creare il progetto PostHog in regione UE e mettere `POSTHOG_KEY` in `.env.local` e su Vercel.
- Costruire in PostHog il funnel `signed_up` → `first_analysis_completed` con finestra 24 ore.
- Voci aggiunte in `docs/prima-dei-clienti-reali.md` (chiave su Vercel, PostHog tra i sub-responsabili).
