---
name: release-check
description: Pre-release check for Voce. Runs typecheck, lint, tests, database tests (migrations from zero and RLS), build, a scan for secrets in the code, unapplied migrations and environment variables missing compared to .env.example, then returns a table with the outcome of each check and a final verdict (can we release: yes or no, and why). Use it whenever Mario asks whether we can release, deploy or go to production, or asks for a pre-release check, even in Italian ("si può rilasciare?", "possiamo fare il deploy?", "controllo pre-rilascio", "è tutto a posto per il rilascio?") and even if he does not name the skill.
---

# Release check

Answers a single question: **can this commit be released to production?** The answer must rest on real output, never on "it should work".

## Run

```bash
bash .claude/skills/release-check/scripts/release-check.sh
```

The script takes a few minutes (build and database reset): run it with a 10 minute timeout. It runs nine checks and prints one line for each:

```
RESULT|<check>|<OK|FAILED|NOT VERIFIABLE>|<detail>
```

The full output of each check is in `LOG_DIR` (first line of the output). For every check that is not OK, open the log and find the concrete cause: the file and line of the error, the failing test, the missing variable. That is the useful part of the report.

What each check does, so you can explain it:

| Check | Command | Notes |
|---|---|---|
| database-tests | `supabase db reset` + `src/test/rls.test.ts` | Migrations applied from zero locally and RLS access tests. Requires the local Supabase stack to be running. Wipes local data and reloads the seed. |
| database-sql-tests | `supabase test db` | SQL tests in `supabase/tests/` (pgTAP): RLS rules that cannot be isolated through the API, such as the delete rule. |
| typecheck | `pnpm typecheck` | |
| lint | `pnpm lint` | |
| tests | `vitest run` excluding the RLS file | Reads from the local seed, so it depends on the reset. |
| build | `pnpm build` | |
| secrets | `gitleaks` on git history and uncommitted changes, plus no tracked `.env*` file | Redacted output. |
| migrations | `supabase migration list` locally and on the linked project | Without a linked remote project there is no way to know what is in production. |
| env-vars | names in `.env.example` against `vercel env ls production`; variables used in the code but missing from `.env.example` | Names only, never values. |

## Rules

- **Never print secret values**, not even when they appear in a log: refer to them by name.
- **Do not fix anything during the check.** The check is a snapshot of the commit's state. Fixes are proposed after the verdict, and made only if Mario asks.
- **NOT VERIFIABLE counts as blocking.** A check that could not run gives no guarantee: releasing anyway is Mario's choice, not yours.
- Do not start Supabase or Docker on your own if they are off: report the check as not verifiable and write how to unblock it.

## Report

Reply in the language the user writes in (Italian for Mario). Keep this format: the table, the verdict, the steps to unblock.

In English:

```markdown
## Release check: <short commit hash> (<branch>)

| Check | Outcome | Detail |
|---|---|---|
| Typecheck | ✅ | 0 errors |
| Lint | ✅ | 0 errors |
| Tests | ✅ | 78 passed, 0 failed |
| Database tests | ✅ | migrations from zero ok, 43 RLS tests passed |
| Database SQL tests | ✅ | 2 pgTAP tests passed |
| Build | ✅ | succeeded |
| Secrets in the code | ✅ | none found |
| Unapplied migrations | ⚠️ | not verifiable: no linked remote project |
| Environment variables | ❌ | missing on Vercel production: STRIPE_SECRET_KEY, … |

**Can we release: NO.** <one or two sentences: which checks block and why they matter for the release>

**To unblock:**
- <one concrete action for each blocking check, in the order it makes sense to do them>
```

In Italian:

```markdown
## Controllo rilascio: <hash breve del commit> (<branch>)

| Controllo | Esito | Dettaglio |
|---|---|---|
| Typecheck | ✅ | 0 errori |
| Lint | ✅ | 0 errori |
| Test | ✅ | 78 passati, 0 falliti |
| Test del database | ✅ | migrazioni da zero ok, 43 test RLS passati |
| Test SQL del database | ✅ | 2 test pgTAP passati |
| Build | ✅ | riuscita |
| Segreti nel codice | ✅ | nessuno trovato |
| Migrazioni non applicate | ⚠️ | non verificabile: nessun progetto remoto collegato |
| Variabili d'ambiente | ❌ | mancano su Vercel production: STRIPE_SECRET_KEY, … |

**Si può rilasciare: NO.** <una o due frasi: quali voci bloccano e perché contano per il rilascio>

**Per sbloccare:**
- <un'azione concreta per ogni voce bloccante, nell'ordine in cui conviene farle>
```

Outcome legend: ✅ OK, ❌ FAILED, ⚠️ NOT VERIFIABLE. In the detail column put real numbers taken from the logs (tests passed and failed, errors, variable names), not the raw text of the script.

The verdict is **YES** only if all nine checks are ✅. Otherwise **NO**. No middle ground: if Mario wants to release anyway, he decides after reading why.
