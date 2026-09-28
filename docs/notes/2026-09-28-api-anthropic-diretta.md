# Analisi AI sull'API Anthropic, senza Vercel AI Gateway

Claude non rientra nel piano gratuito del Gateway e Mario non vuole comprare crediti Gateway. Decisione del 2026-09-28 ("Usiamo anthropic"): l'analisi chiama direttamente l'API Anthropic. Il Gateway è tolto del tutto, senza doppio percorso.

## Cosa è stato fatto

- **`src/lib/analysis.ts`:** `createAnthropic` di `@ai-sdk/anthropic` 4.0.65 (stessa `@ai-sdk/provider` 4.0.18 di `ai` 7.0.114) al posto di `createGateway`. Chiave da `ANTHROPIC_API_KEY`, solo lato server. Modello da `AI_MODEL` con gli id Anthropic, default `claude-sonnet-5`. Tabella prezzi di `estimateCost` con il nuovo id e gli stessi prezzi (2 $ e 10 $ per milione di token). Invariati token massimi, timeout, output strutturato e controllo delle citazioni.
- **E2E:** `e2e/fake-gateway.mts` diventa `e2e/fake-anthropic.mts`, una finta API Messages su `POST /v1/messages`. L'app ci arriva con `ANTHROPIC_BASE_URL` (letta dal provider). Risponde nel formato Messages (`content` con un blocco `text` che contiene il JSON, `stop_reason`, `usage` con 1200 token in ingresso e 300 in uscita), con lo stesso tema "I clienti chiedono l'esportazione in PDF" di prima.
- **Test:** `analysis.test.ts` verifica il default `claude-sonnet-5`, che il modello sia del provider `anthropic.messages` e il costo con il nuovo id. Gli unit test restano su modelli finti.
- **Config e documenti:** `.env.example` (`ANTHROPIC_API_KEY` obbligatoria in produzione, `AI_MODEL` e `ANTHROPIC_BASE_URL` facoltative), `README.md`, `AGENTS.md` (l'eccezione UE ora è l'API Anthropic), `BRIEF.md` (decisione sul modello), `docs/prima-dei-clienti-reali.md`, commenti di CI, Playwright ed evals.

## Decisioni

- **Output strutturato nativo.** Per `claude-sonnet-5` il provider manda lo schema in `output_config.format` (json_schema) e il modello risponde con testo JSON, non con un tool. La finta API rifiuta con 400 una richiesta senza `output_config.format`: se il provider smette di mandare lo schema, l'E2E se ne accorge.
- **Nessuna migrazione dei dati.** Le righe vecchie di `analysis_runs` restano con `anthropic/claude-sonnet-5`: è il registro di cosa è stato chiamato allora.
- **Note e piani del 2026-09-25 non toccati:** raccontano com'era allora.
- `@ai-sdk/gateway` resta nel lockfile perché è una dipendenza di `ai`, non del nostro codice.

## Verifica

**In locale** (worktree `voce-anthropic`):
- `pnpm typecheck`: exit 0, nessun errore.
- `pnpm lint`: exit 0, nessun avviso.
- `pnpm build`: riuscita, tutte le route generate.
- `src/lib/analysis.test.ts`: prima della modifica 3 test falliti su 12 (default ancora `anthropic/claude-sonnet-5`, costo `null` per `claude-sonnet-5`), dopo 12 su 12.
- Prova del provider vero (`@ai-sdk/anthropic`) contro `e2e/fake-anthropic.mts` con `runAnalysis`: 1 test passato, un tema restituito.
- `pnpm test`: 4 file e 49 test passati; gli altri 9 file non partono perché lo stack Supabase locale non è utilizzabile (vedi sotto).
- **Non eseguiti in locale:** `supabase db reset`, `supabase test db`, i test che usano il database ed E2E. La macchina virtuale Docker (Colima) risponde "input/output error" a ogni `docker exec` e `docker run`, quindi lo stack `voce` condiviso con gli altri worktree è "unhealthy" e `supabase status -o env` fallisce. Serve `colima restart`, che ferma container avviati da altri: non l'ho fatto.

**In CI** (GitHub Actions, run 36360455234, Supabase avviato da zero con migrazioni e seed):
- Typecheck e lint: passati.
- Test del database (RLS, `src/test/rls.test.ts`): 1 file, 54 test passati.
- `supabase test db`: `Files=1, Tests=2`, `Result: PASS`.
- Unit test: 12 file, 149 test passati.
- Build: `Compiled successfully`.
- E2E con la finta API Anthropic: `sign up, add feedback and get the first themes`, 1 passato.
- Evals col modello vero: non eseguite, nessuna chiave disponibile.

## Cosa resta

- Su Vercel Production: aggiungere `ANTHROPIC_API_KEY` (e `AI_MODEL` solo se si vuole un modello diverso da `claude-sonnet-5`). Chiave creata nella console Anthropic con un limite di spesa.
- Evals col modello vero da eseguire con la chiave: `pnpm evals`.
