# Voce

Voce raccoglie i feedback dei clienti e li raggruppa in temi con l'AI. Contesto di prodotto in `BRIEF.md`, regole di lavoro in `AGENTS.md`.

## Avvio

Servono Node 22, pnpm 10, Docker acceso e la Supabase CLI.

```bash
pnpm install
supabase start                  # stack locale: migrazioni da zero e dati di esempio
cp .env.example .env.local      # poi incolla le tre chiavi Supabase da `supabase status -o env`
pnpm dev                        # http://localhost:3000
```

Con le sole chiavi Supabase l'app funziona: pagamenti, analytics e analisi AI si accendono aggiungendo le loro variabili (sezioni sotto). Elenco completo in `.env.example`: le righe non commentate sono obbligatorie in produzione.

## Test e pull request

```bash
pnpm typecheck
pnpm lint
pnpm test        # unit test e test del database (RLS), contro lo stack locale con il seed
pnpm test:e2e    # registrazione, feedback e prima analisi nel browser
pnpm evals       # solo dopo modifiche al prompt: chiama il modello vero
```

`pnpm test:e2e` avvia da solo l'app sulla porta 3000 (che deve essere libera) e una finta API Anthropic sulla 4010: l'analisi non chiama mai il modello vero. La prima volta serve `pnpm exec playwright install chromium`. L'email di conferma si legge da Mailpit.

A ogni pull request GitHub Actions (`.github/workflows/ci.yml`) esegue typecheck, lint, test del database, unit test, build e test end-to-end, con uno stack Supabase locale avviato nel job. Non servono segreti.

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
SUPABASE_SECRET_KEY=                 # SECRET_KEY: solo lato server, per il modulo pubblico e i test
```

Poi `pnpm dev` e apri `http://localhost:3000`.

- **Utenti di esempio**, password `password-voce`: `fatturino@voce.test` (Pro, con analisi e temi), `orto@voce.test` (feedback senza analisi), `ordinalo@voce.test` (al limite Free), `bottega@voce.test` (vuoto), `spento@voce.test` (modulo pubblico spento).
- **Email** (conferma della registrazione): Mailpit su `http://127.0.0.1:54324`.
- **Database**: Studio su `http://127.0.0.1:54323`.
- **Test**: `pnpm test` gira contro lo stack locale, con il seed caricato.
- **Tipi del database** dopo una migrazione: `supabase gen types typescript --local > src/lib/database.types.ts`.

## Analisi AI

L'analisi usa Claude direttamente sull'API Anthropic. La chiave va in `ANTHROPIC_API_KEY` (solo lato server: in locale in `.env.local`, in produzione nelle variabili d'ambiente di Vercel) e si crea nella console Anthropic, dove si impostano anche i limiti di spesa. Il modello si sceglie con `AI_MODEL`, con gli id di Anthropic (default `claude-sonnet-5`).

- **Registro**: ogni analisi lascia una riga in `analysis_runs` (input, output grezzo, scarti, modello, token, durata, costo stimato, errore). Si legge da Studio: gli utenti non la vedono.
- **Test**: `pnpm test` usa un modello finto, non chiama mai l'API Anthropic.
- **Evals**: `pnpm evals` chiama il modello vero sul set sintetico in `evals/dataset.json` (costa qualche centesimo). Il risultato va in `evals/results/` e si confronta con il precedente. Da eseguire dopo ogni modifica al prompt o ai controlli dell'analisi.

## Accesso con Google

È predisposto ma spento. Per accenderlo in locale: crea le credenziali OAuth su Google Cloud (redirect `http://127.0.0.1:54321/auth/v1/callback`), mettile in `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` e `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` nell'ambiente da cui lanci la CLI, imposta `enabled = true` in `[auth.external.google]` di `supabase/config.toml` e riavvia (`supabase stop && supabase start`). Il pulsante "Continua con Google" compare da solo quando Google è attivo.

## Analytics con PostHog

Il server manda a PostHog UE quattro eventi di attivazione, uno per workspace, senza testo dei feedback né dati personali: elenco e regole in `docs/analytics.md`. Senza la variabile non parte nulla.

```
POSTHOG_KEY=   # phc_...: Project API key di un progetto PostHog in regione UE, solo lato server
```

## Pagamenti con Stripe (modalità test)

Il piano Pro si compra con Stripe Checkout e si gestisce o disdice dal portale cliente di Stripe, dalla pagina **Piano**. Il piano del workspace cambia solo quando arriva il webhook firmato (`/api/stripe/webhook`): il webhook rilegge da Stripe gli abbonamenti del cliente e scrive lo stato attuale in `subscriptions`.

In `.env.local` servono tre variabili. Se ne manca una, i pagamenti sono spenti: la pagina Piano lo dice e ogni workspace resta sul piano che ha.

```
STRIPE_SECRET_KEY=      # meglio una chiave con permessi limitati (rk_test_...), solo lato server
STRIPE_WEBHOOK_SECRET=  # whsec_...: da `stripe listen` in locale, dall'endpoint della dashboard su Vercel
STRIPE_PRICE_ID=        # price_...: il prezzo Pro da 19 € al mese
```

In locale i webhook arrivano con la Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

- **Carta di prova**: `4242 4242 4242 4242`, qualsiasi data futura e CVC.
- **Test**: `pnpm test` non chiama mai Stripe. La firma del webhook è verificata davvero, le risposte di Stripe sono finte.
