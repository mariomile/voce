# Chiedi, S3: regole del database

Slice S3 di `.builderos/initiatives/chiedi-ai-feedback/05-build-plan.md`. Criteri: 2, 3, 4, 5, 7 (metà database), 8, 17.

## Cosa è stato fatto

`supabase/tests/questions.test.sql`, 50 asserzioni pgTAP:

- **AC 2 e 3**: `authenticated` (utente di A) e `anon` ricevono `42501` leggendo `questions` e `question_runs` senza filtri e per id di una domanda di B, e su insert, update, delete delle due tabelle.
- **AC 4**: `start_question`, `finish_question`, `fail_question`, `question_usage` danno `42501` a `authenticated` e `anon`.
- **AC 5**: Free con 9 domande del mese (done, no_evidence, failed e una running vecchia) più 5 del mese prima: la decima è `ok`, l'undicesima `limit`; `question_usage` dice 10 su 10. Pro: 99 danno `ok`, 100 danno `limit`.
- **AC 7**: 3 analisi `done` su Free non cambiano `start_question` né `question_usage`.
- **AC 8**: running di 2 minuti dà `busy` e non riserva nulla; a 6 minuti diventa `failed` con `stale` e `finished_at` in `question_runs`, conta, e la nuova si riserva.
- **AC 17**: una citazione assente dal testo salvato solleva `quote_not_in_feedback` e la domanda resta `running`; con citazioni valide l'esito è `answered` con conteggio e registro; la citazione di un feedback eliminato nel frattempo si toglie e senza citazioni l'esito è `no_evidence`.

La migrazione non è cambiata: le funzioni sono nate complete in S1 (scelta di confine del piano).

## Visti fallire

Le funzioni esistevano già, quindi il "rosso" di questa slice è la prova per mutazione: ogni regola rotta di proposito dentro la transazione del test, un test che diventa rosso. Script usato: una copia del file di test con la mutazione subito dopo `begin`, eseguita con `psql` nel container `supabase_db_voce`, tutto annullato dal `rollback` finale.

```
M1 grant select on questions to authenticated (AC 2): 2 failing
    not ok 3 - A cannot read questions, unfiltered
    not ok 4 - A cannot read B's question by id
M2 grant execute on start_question to authenticated (AC 4): 2 failing
    not ok 13 - authenticated cannot call start_question
M3 Free limit 11 instead of 10 (AC 5): 3 failing
    not ok 32 - Free: with 10 questions this month, the next one is refused
    not ok 33 - question_usage counts every state of this month only
M4 failed questions do not count (AC 5): 4 failing
    not ok 32 - Free: with 10 questions this month, the next one is refused
    not ok 35 - Pro: with 100 questions this month, the next one is refused
M5 stale after 10 minutes instead of 5 (AC 8): 5 failing
    not ok 41 - over 5 minutes the stuck question no longer blocks: the new one is reserved
    not ok 42 - the stuck question is failed as stale in question_runs
M6 no strpos check in finish_question (AC 17): 2 failing
    not ok 44 - a quote not in the saved text is refused
    not ok 45 - the refused question stays running
M7 quotes of deleted feedback kept (AC 17): 2 failing
    not ok 49 - the quote of a deleted feedback is dropped
    not ok 50 - with no quote left the outcome is no_evidence
```

Il primo giro vero ha trovato un errore nel test, non nella funzione: due domande create nella stessa transazione hanno lo stesso `now()`, quindi "l'ultima per `created_at`" era ambigua. Il test ora usa l'id della domanda.

## Verifica

```
supabase test db   Files=2, Tests=52, Result: PASS
pnpm typecheck     exit 0
pnpm lint          exit 0
pnpm test          Test Files  16 passed (16)   Tests  217 passed (217)
```

## Cosa resta

La metà unitaria di AC 7 (`getUsage` e `analysesThisMonth`) è in S4.
