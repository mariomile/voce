# Analytics con PostHog

## Obiettivo

Misurare l'attivazione del brief: quota di nuovi workspace che eseguono la prima analisi AI entro 24 ore dalla registrazione, più il passaggio a Pro. Quattro eventi, niente testo dei feedback, niente dati personali. Senza chiave PostHog non parte nulla e non ci sono errori.

## Scelte

- **Solo lato server**, con una chiamata diretta all'API di PostHog UE (`eu.i.posthog.com`). Nessuno script nel browser: niente cookie, niente autocapture che potrebbe leggere testo dalla pagina, niente IP dei visitatori.
- **Identificativo = id del workspace.** Niente email, niente id utente, niente profili persona (`$process_person_profile: false`), niente geolocalizzazione.
- **Ogni evento parte una sola volta per workspace.** Una tabella `analytics_milestones` (solo server, RLS attiva, nessun accesso per gli utenti) registra quali eventi sono già partiti: l'inserimento con `on conflict do nothing` decide chi lo manda, anche con 230 invii dal modulo nello stesso momento.
- **Dopo la risposta** (`after` di Next): l'utente non aspetta PostHog, e un errore di PostHog finisce solo nei log.

## Passi

1. Migrazione `analytics_milestones`, tipi rigenerati, test RLS.
   - Verifica: `supabase db reset`, test RLS (anonimo e utente non leggono né scrivono).
2. `src/lib/analytics.ts` + eventi in conferma email, callback Google, feedback manuale, CSV, modulo pubblico, fine analisi, webhook Stripe.
   - Verifica: test di `analytics.ts` (senza chiave nessuna chiamata; con chiave un solo invio per workspace; niente testo nelle proprietà), test esistenti verdi.
3. `docs/analytics.md`, README, `.env` di esempio nel README, `docs/prima-dei-clienti-reali.md`.
   - Verifica: typecheck, lint, test, build.
