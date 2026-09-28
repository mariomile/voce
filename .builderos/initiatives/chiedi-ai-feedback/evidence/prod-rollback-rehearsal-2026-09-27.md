# prod-rollback-rehearsal-2026-09-27

**Class:** data
**Captured:** 2026-09-27 · **By:** Claude Code (release-manager) · **Where:** Vercel, team `demos-1c73`, progetto `voce-feedback`; Supabase `gnmwatxyhigexujgfmem`

Prova completa del rilascio e del rollback in produzione, prima della sessione. Output dei comandi, verbatim dove riportato.

## 1. Migrazione (additiva) su produzione, 09:08:06Z

```
$ supabase db push --linked --dry-run
Would push these migrations:
 • 20260927120000_questions.sql
$ supabase db push --linked --yes
Applying migration 20260927120000_questions.sql...
{"upToDate":false,"dryRun":false,"migrations":["20260927120000_questions.sql"],...,"message":"Finished supabase db push."}
$ supabase migration list --linked
local = remote per tutte e 10: 20260924225437, 20260924231853, 20260925090000, 20260925120000, 20260925150000, 20260925180000, 20260925200000, 20260926090000, 20260926120000, 20260927120000
```

Istruzioni DDL nella migrazione: solo `create type`, `create table`, `create index`, `create function`, `enable row level security`, `revoke`, `grant execute ... to service_role`. Nessun `drop` o `alter` su oggetti esistenti (grep sul file).

## 2. Build del branch come deployment di produzione senza dominio, 09:08:34Z-09:09:29Z

Sorgente: `git archive` di `feat/ask-your-feedback` @ `57e8624` (albero pulito, `origin/main` @ `89b2a73` non ha commit fuori dal branch).

```
$ vercel deploy --prod --skip-domain --yes --scope demos-1c73
Production: https://voce-feedback-93feygslg-demos-1c73.vercel.app [47s]
```

Subito dopo, dominio pubblico ancora su main:

```
voce-feedback-ten.vercel.app  / 200  /ask 404
vercel inspect voce-feedback-ten.vercel.app -> id dpl_CrMZmy4xothGsgzqZYHzNs397LQn
```

## 3. Promozione del branch (inizio esposizione), 09:09:43Z-09:09:48Z

```
$ vercel promote voce-feedback-93feygslg-demos-1c73.vercel.app --yes
> Success! voce-feedback was promoted to voce-feedback-93feygslg-demos-1c73.vercel.app (dpl_FPYYj3gM92ZoqJsh14ycDDh3qrTC) [3s]
vercel inspect voce-feedback-ten.vercel.app -> id dpl_FPYYj3gM92ZoqJsh14ycDDh3qrTC
/ 200  /ask 307 https://voce-feedback-ten.vercel.app/login
landing: "domande ai feedback al mese" presente (riga della quota di Chiedi)
```

## 4. Rollback, 09:10:01Z-09:10:06Z

```
$ vercel rollback voce-feedback-c07p3pai0-demos-1c73.vercel.app --yes
> Success! voce-feedback was rolled back to voce-feedback-c07p3pai0-demos-1c73.vercel.app (dpl_CrMZmy4xothGsgzqZYHzNs397LQn) [2s]
vercel inspect voce-feedback-ten.vercel.app -> id dpl_CrMZmy4xothGsgzqZYHzNs397LQn
/ 200  /ask 404
landing: "domande ai feedback" presente 0 volte
$ vercel rollback status -> Success! voce-feedback was rolled back to ... (dpl_CrMZmy4xothGsgzqZYHzNs397LQn)
```

## 5. Effetto collaterale trovato e corretto

Dopo il rollback il progetto ha `autoAssignCustomDomains: false` (GET `/v9/projects/voce-feedback`): un deployment di produzione successivo, compreso quello del merge sul palco, non prenderebbe il dominio. `vercel promote` del deployment già corrente risponde `409 already the current production deployment`. Ripristinato con PATCH `/v9/projects/voce-feedback` `{"autoAssignCustomDomains":true}`:

```
{"autoAssignCustomDomains": true, "prod": "dpl_CrMZmy4xothGsgzqZYHzNs397LQn"}   (09:10:46Z)
voce-feedback-ten.vercel.app  / 200  /ask 404
```

## 6. Dati scritti durante l'esposizione

0 workspace in produzione durante tutta la prova, 0 righe in `questions` e `question_runs` alle 09:12:06Z (query M2). Registrazioni chiuse.
