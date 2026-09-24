# Voce

## Supabase in locale

Serve Docker acceso e la [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

```bash
supabase start              # avvia lo stack locale (la prima volta scarica le immagini)
supabase db reset           # applica le migrazioni da zero e carica supabase/seed.sql
```

In `.env.local` (mai nel repository) servono tre chiavi, prese da `supabase status -o env`:

```
NEXT_PUBLIC_SUPABASE_URL=            # API_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= # PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=                 # SECRET_KEY, solo per i test
```

Poi `pnpm dev` e apri `http://localhost:3000`.

- **Utenti di esempio**, password `password-voce`: `fatturino@voce.test` (Pro, con analisi e temi), `orto@voce.test` (feedback senza analisi), `ordinalo@voce.test` (al limite Free), `bottega@voce.test` (vuoto), `spento@voce.test` (modulo pubblico spento).
- **Email** (conferma della registrazione): Mailpit su `http://127.0.0.1:54324`.
- **Database**: Studio su `http://127.0.0.1:54323`.
- **Test**: `pnpm test` gira contro lo stack locale, con il seed caricato.
- **Tipi del database** dopo una migrazione: `supabase gen types typescript --local > src/lib/database.types.ts`.

## Accesso con Google

È predisposto ma spento. Per accenderlo in locale: crea le credenziali OAuth su Google Cloud (redirect `http://127.0.0.1:54321/auth/v1/callback`), mettile in `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` e `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` nell'ambiente da cui lanci la CLI, imposta `enabled = true` in `[auth.external.google]` di `supabase/config.toml` e riavvia (`supabase stop && supabase start`). Il pulsante "Continua con Google" compare da solo quando Google è attivo.
