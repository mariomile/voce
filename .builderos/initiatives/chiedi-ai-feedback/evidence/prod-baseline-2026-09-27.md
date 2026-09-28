# prod-baseline-2026-09-27

**Class:** data
**Captured:** 2026-09-27T09:07:51Z · **By:** Claude Code (release-manager) · **Where:** database di produzione Supabase `gnmwatxyhigexujgfmem` (progetto "Voce", eu-west-1), Management API `POST /v1/projects/gnmwatxyhigexujgfmem/database/query`

Catturato prima di qualsiasi esposizione di Chiedi: la migrazione `20260927120000_questions.sql` è stata applicata alle 09:08:06Z, il primo deployment con Chiedi è stato promosso sul dominio pubblico alle 09:09:48Z.

## Query eseguita

```sql
select
  now() as captured_at_utc,
  (now() at time zone 'Europe/Rome') as captured_at_rome,
  to_regclass('public.questions') is not null as questions_table_exists,
  (select count(*) from public.workspaces) as workspaces_total,
  (select count(distinct a.workspace_id) from public.analyses a
     where a.status = 'done' and exists (select 1 from public.themes t where t.analysis_id = a.id)) as workspaces_activated_ever,
  (select count(distinct a.workspace_id) from public.analyses a
     where a.status = 'done' and exists (select 1 from public.themes t where t.analysis_id = a.id)
       and a.created_at >= '2026-10-01 00:00 Europe/Rome' and a.created_at < '2026-10-18 00:00 Europe/Rome') as workspaces_activated_in_cohort_window,
  (select count(*) from public.analytics_milestones where event = 'first_analysis_completed') as milestone_first_analysis_rows,
  (select count(*) from public.analyses) as analyses_total,
  (select count(*) from public.feedback) as feedback_total
```

## Output, verbatim

```
[{"captured_at_utc":"2026-09-27 09:07:51.535023+00","captured_at_rome":"2026-09-27 11:07:51.535023","questions_table_exists":false,"workspaces_total":0,"workspaces_activated_ever":0,"workspaces_activated_in_cohort_window":0,"milestone_first_analysis_rows":0,"analyses_total":0,"feedback_total":0}]
```

Lettura: la tabella `questions` non esiste, quindi 0 domande. 0 workspace, 0 analisi, 0 feedback: il seed della demo (account A, B, M) non è ancora stato eseguito.

## Dopo la migrazione (09:08:14Z), stesso database

```
[{"at_utc":"2026-09-27 09:08:14.309048+00","questions_rows":0,"question_runs_rows":0,"rls":[{"t":"question_runs","rls":true},{"t":"questions","rls":true}],"anon_auth_grants":0,"fn_exec_anon_auth":["fail_question:false/false","finish_question:false/false","question_usage:false/false","questions_limit:false/false","start_question:false/false"]}]
```

## Verifica del metodo (09:12:05Z, dopo la prova di rollback)

Query M1, M2, M3 di `06-release.md` eseguite sul database di produzione:

```
M1 [{"run_at":"2026-09-27 09:12:05.685079+00","workspace_attivati":0,"tornati_a_chiedere":0,"quota":null}]
M2 [{"run_at":"2026-09-27 09:12:06.428449+00","domande_totali":0,"chiuse":0,"no_evidence":0,"fallite":0,"quota_no_evidence":null}]
M3 [{"run_at":"2026-09-27 09:12:07.027824+00","workspace_creati":0,"attivati_24h":0}]
```
