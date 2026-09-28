# TECH.md — Voce

**Verified:** 2026-09-26 @ 89b2a73

## Stack
| Layer | Choice | Why | Decision |
|-------|--------|-----|----------|
| frontend | Next.js 16 (App Router), React 19, TypeScript strict, Tailwind, shadcn/ui | stack di default, un solo repo per UI e server | inherited |
| backend | Server action e route handler di Next.js | niente servizio separato da gestire | inherited |
| data | Supabase: Postgres, Auth (`@supabase/ssr`), Row Level Security | login e permessi per workspace nel database | inherited |
| AI | AI SDK con Claude sull'API Anthropic (`@ai-sdk/anthropic`, chiave `ANTHROPIC_API_KEY`), modello da `AI_MODEL` (default `claude-sonnet-5`), thinking spento | un solo fornitore AI, tetto di spesa nella console Anthropic | inherited |
| payments | Stripe, modalità test | Checkout e portale cliente senza UI propria | inherited |
| hosting | Vercel, progetto `voce-feedback` | anteprime per ogni PR | inherited |
| analytics | PostHog UE, eventi solo lato server | niente testo dei feedback nel browser di terzi | inherited |

## Technical constraints
- Segreti solo in `.env.local` e su Vercel; solo le chiavi pubbliche hanno `NEXT_PUBLIC_`. `[code:AGENTS.md]`
- RLS attiva su ogni tabella nella stessa migrazione che la crea. `[code:AGENTS.md]`
- Ogni input validato lato server con uno schema esplicito. `[code:AGENTS.md]`
- Il testo dei feedback è input non fidato: nel prompt separato dalle istruzioni, mai reso come HTML. `[code:AGENTS.md]`
- Quote di feedback e analisi AI controllate lato server prima di ogni chiamata al modello. `[code:AGENTS.md]`
- Dati in UE; unica eccezione accettata in test: l'API Anthropic. `[code:docs/prima-dei-clienti-reali.md]`
- L'analisi può durare fino a 4 minuti: la pagina della Research (`/research/[id]`) chiede `maxDuration` 300. `[code:docs/prima-dei-clienti-reali.md]`

## Conventions
- Interfaccia in italiano; codice, nomi e commit in inglese.
- Piano in `docs/plans/AAAA-MM-GG-titolo.md` prima di cambi grandi (tabella nuova, prompt AI, più di qualche file); nota in `docs/notes/` dopo ogni passo; un commit per passo verificato.
- Prima di "finito": `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`. Con il database: `supabase db reset` e test RLS. Con prompt o analisi AI: `pnpm evals` e confronto col risultato precedente.
- Le domande di Chiedi contano nella quota anche quando falliscono (Free 10, Pro 100 al mese), diversamente dalle analisi; `PLAN_LIMITS.questionsPerMonth` rispecchia `private.questions_limit`, e un test controlla che coincidano.
- I test non chiamano mai il modello vero: modello finto in `pnpm test`, finta API Anthropic (`e2e/fake-anthropic.mts`) sulla porta 4010 in `pnpm test:e2e`.
- Ogni analisi scrive una riga in `analysis_runs` (input, output, modello, token, costo stimato).
- Non senza chiedere a Mario: deploy, variabili su Vercel, migrazioni remote, Stripe live, nuovi fornitori che ricevono dati, cambio di modello o scelte che alzano il costo per analisi.

## Known traps
- Il tetto di costo AI arriva al doppio della quota, perché le analisi fallite non consumano quota. `docs/review.md` B5
- Più account Free moltiplicano le analisi gratuite. `docs/review.md` B6
- Le scritture sullo stesso workspace passano una alla volta. `docs/review.md` M3
- Le server action di `/ask`, `/research`, `/research/new` e `/research/[id]` (Sintesi: ipotesi e analisi) senza sessione passano il proxy apposta (POST con intestazione `next-action`), perché la action risponda `session` e la pagina mostri E8, RC4 o E-SESS. Le altre server action senza sessione vengono ancora mandate a `/login`. `src/proxy.ts`
- Lo stack Supabase locale è condiviso tra i worktree: un `supabase db reset` da un altro worktree toglie le migrazioni che lì non ci sono (per esempio `questions`) e i test di questo falliscono finché non si rilancia il reset qui. `05-build-plan.md` di chiedi-ai-feedback, P3
- `supabase config push` spingerebbe `site_url = localhost` in produzione: per l'Auth remota si usa la Management API. Runbook di produzione PHC26.
- `vercel rollback` mette `autoAssignCustomDomains` a false sul progetto: il deployment di produzione successivo (anche da un merge) non prende il dominio finché non si riattiva (PATCH `/v9/projects/voce-feedback`). Provato il 2026-09-27. `06-release.md` di chiedi-ai-feedback
- Le variabili d'ambiente di Vercel entrano nel deployment quando lo si costruisce: dopo aver aggiunto una variabile (per esempio `POSTHOG_KEY`) vanno ricostruiti i deployment che devono usarla. Le variabili oggi esistono solo in Production: un'anteprima non ha Supabase.
- Vercel non esegue migrazioni: le migrazioni additive vanno applicate in produzione prima del codice che le usa (`supabase db push --linked`), come per `20260927120000_questions.sql`.
