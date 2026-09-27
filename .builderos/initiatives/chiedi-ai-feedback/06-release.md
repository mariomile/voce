# Release: Chiedi ai tuoi feedback

**Phase:** 6 · **Cycle:** 1 · **Mode:** lite · **Date:** 2026-09-27 · **Owner:** Mario Miletta (piano, prova e baseline eseguiti dal modello per delega `[doc:user-2026-09-27-release-dispatch]`)
**Branch:** `feat/ask-your-feedback` @ `57e8624`, PR #4 in bozza, nessun commit di `main` fuori dal branch (`origin/main` @ `89b2a73`).
**Rilascio pubblico:** 2026-10-01 alle 15:00 (13:00Z), finale dal vivo di PHC26 davanti a circa 230 PM `[doc:user-2026-09-27-release-dispatch]`.

Stato di produzione alla fine di questa fase (2026-09-27T09:10:46Z): il dominio pubblico serve `main` (`dpl_CrMZmy4xothGsgzqZYHzNs397LQn`), il database ha già la migrazione di Chiedi con le tabelle vuote `[data:prod-rollback-rehearsal-2026-09-27]`.

## Rollout
**Strategy:** full, con la migrazione applicata in anticipo e un deployment di riserva già costruito. Motivo: in produzione ci sono 0 workspace `[data:prod-baseline-2026-09-27]`, le registrazioni sono chiuse durante la sessione `[doc:user-2026-09-27-release-dispatch]`, e il pubblico del rilascio è la sala intera nello stesso istante. Una percentuale o un canary su 0 utenti non misura niente. Un flag non esiste nel codice e aggiungerlo ora sarebbe superficie nuova a quattro giorni dal palco. Quello che protegge il rilascio è il rollback: provato in produzione, 5 secondi `[data:prod-rollback-rehearsal-2026-09-27]`.

**Raccomandazione sulla migrazione: applicarla prima, ed è già fatto** (2026-09-27T09:08:06Z) `[data:prod-rollback-rehearsal-2026-09-27]`. Tre ragioni:
- è additiva: solo tipi, tabelle, indici e funzioni nuove, nessun `drop` o `alter` su oggetti esistenti; `main` non la legge e continua a funzionare (verificato: `/` 200 dopo l'applicazione) `[data:prod-rollback-rehearsal-2026-09-27]`;
- Vercel non esegue migrazioni: un merge che arriva in produzione senza tabelle darebbe un Chiedi che fallisce a ogni domanda, davanti alla sala;
- toglie dal palco l'unico passo che richiede la password del database e che non si annulla con un clic. Sul palco resta solo codice.

| Step | Exposure | Watched | Condition to proceed |
|------|----------|---------|----------------------|
| 0. Migrazione in produzione (fatto, 2026-09-27) | Nessuno: codice di `main`, tabelle vuote | RLS attiva su `questions` e `question_runs`, 0 permessi a `anon` e `authenticated`, funzioni non eseguibili da loro; `/` risponde 200 | Fatto: 10 migrazioni su 10 allineate, RLS true su entrambe, 0 grant `[data:prod-baseline-2026-09-27]` |
| 1. Prova generale (fatto, 2026-09-27) | Dominio pubblico sul branch per 18 secondi, 0 utenti | `/ask` 307 verso `/login`, riga della quota sulla landing; poi rollback | Fatto: vedi Rollback, Tested |
| 2. Preparazione, entro il 2026-09-30 alle 18:00 | Nessuno | Le quattro azioni di Mario sotto; evals su `evals/questions.json`; deployment di riserva ricostruito dopo `POSTHOG_KEY`; una domanda vera dall'account M sul deployment di riserva | Evals ad almeno 17 casi su 20 con i 7 must-pass e G1 a 0 violazioni `[code:evals/questions.json]`, e la domanda di M chiusa con almeno 1 citazione. Se una delle due manca, sul palco non si rilascia Chiedi: la produzione resta su `main` e la demo usa gli screenshot |
| 3. Palco, 2026-10-01 15:00 | Tutti: la sala, con registrazioni chiuse, e gli account demo | Build di Vercel dal merge di PR #4; `vercel inspect voce-feedback-ten.vercel.app` mostra l'id nuovo; `/ask` 307 senza sessione; domanda dal vivo dell'account M | Build Ready entro 180 secondi, altrimenti `vercel promote` del deployment di riserva `[estimate:soglia-palco-3-minuti]`. Se `/` o `/login` non rispondono 200 dopo il rilascio: rollback subito. Se fallisce solo la domanda: niente rollback, il resto di Voce funziona e la domanda si rifà una volta |
| 4. Pieno, dal 2026-10-01 al 2026-10-31 | Tutti gli utenti | Query M2 ogni giorno: quota di domande `failed` e di `no_evidence`; errori 5xx nei log di Vercel su `/ask` | Resta acceso se le fallite sono sotto il 20% delle domande del giorno `[estimate:soglia-fallite-20-per-cento]`; sopra, si guarda `question_runs.error` prima di decidere. `no_evidence` si giudica solo al 2026-10-31 (criterio di stop 3) |

**Come arriva il merge in produzione.** Oggi Vercel non è collegato a GitHub `[doc:user-2026-09-27-release-dispatch]`: il merge sul palco non rilascia niente da solo. Con il collegamento (azione di Mario 3 sotto) il merge fa partire la build di produzione, circa 50 secondi misurati sulla build di prova `[data:prod-rollback-rehearsal-2026-09-27]`. Il deployment di riserva è lo stesso albero di file (il branch contiene tutto `main`), promovibile in 3 secondi.

## Rollback
**Mechanism:** `vercel rollback <deployment di main precedente> --scope demos-1c73 --yes`, oppure dalla dashboard: progetto `voce-feedback`, Deployments, il deployment di produzione precedente, menu "...", "Instant Rollback". Riporta il dominio sul codice di `main` senza build, in 2 secondi lato Vercel e 5 in tutto. Dal 2026-09-28 il deployment di `main` da usare è `voce-feedback-p69aof2u5-demos-1c73.vercel.app` (`dpl_6FwMgcPnjwRmUispDfu1NoGX6DTW`, commit `89b2a73`, costruito con tutte le variabili di produzione). Comando pronto: `vercel rollback voce-feedback-p69aof2u5-demos-1c73.vercel.app --scope demos-1c73 --yes`. Mai `vercel rollback` senza argomento e mai verso `qulhfmodq` o `93feygslg`: sono codice di Chiedi con la chiave Supabase sbagliata (vedi Aggiornamento 2026-09-28). Se `main` si ricostruisce ancora prima del palco, l'id cambia e va riscritto qui. Il database non si tocca: le tabelle di Chiedi restano e `main` le ignora. Dopo ogni rollback va riattivata l'assegnazione automatica dei domini (vedi Tested), altrimenti il rilascio successivo non raggiunge il dominio: `curl -X PATCH "https://api.vercel.com/v9/projects/voce-feedback?teamId=team_tl2lJ8PV1kv19jt47abQrtlF" -H "Authorization: Bearer $(jq -r .token ~/Library/Application\ Support/com.vercel.cli/auth.json)" -H "Content-Type: application/json" -d '{"autoAssignCustomDomains":true}'`, poi controllare nella risposta `"autoAssignCustomDomains": true`. Il 2026-09-30, dopo le ricostruzioni, si riscrive qui l'id del deployment di `main` da usare e si ricontrolla che il flag sia true.
**Owner:** Mario Miletta, sul palco con il terminale di Vercel già aperto e il comando già scritto; è l'unica persona con accesso al team `demos-1c73`.
**Tested:** 2026-09-27, in produzione. Migrazione applicata (09:08:06Z), build del branch come deployment di produzione senza dominio (`voce-feedback-93feygslg-demos-1c73.vercel.app`, `dpl_FPYYj3gM92ZoqJsh14ycDDh3qrTC`), promosso sul dominio pubblico alle 09:09:48Z: `/ask` 307 verso `/login` e riga della quota sulla landing. Rollback con `vercel rollback voce-feedback-c07p3pai0-demos-1c73.vercel.app` alle 09:10:06Z: dominio di nuovo su `dpl_CrMZmy4xothGsgzqZYHzNs397LQn`, `/ask` 404, riga della quota assente, `/` 200. Osservato un effetto collaterale: il rollback mette `autoAssignCustomDomains` a false sul progetto, e il merge sul palco non avrebbe raggiunto il dominio. Ripristinato con PATCH `/v9/projects/voce-feedback` `{"autoAssignCustomDomains":true}` alle 09:10:46Z, verificato con una GET `[data:prod-rollback-rehearsal-2026-09-27]`. Non provato: il rollback dopo un merge vero, perché senza collegamento a GitHub non c'è build da merge; si prova il 2026-09-30 con il collegamento attivo.
**Data written while live:** in `questions` una riga per domanda, senza testo (stato, esito, conteggi); in `question_runs` il testo della domanda, il prompt con i feedback inviati e la risposta grezza. Dopo un rollback del codice restano entrambe: `main` non le legge, nessuna schermata le mostra, nessuna seconda correzione serve. Se Chiedi torna online nello stesso mese, le domande già fatte contano nella quota del mese, come prevede la spec (ogni domanda riservata conta). Gli eventi `question_answered` già inviati a PostHog restano e la metrica li conta. Il testo delle domande in `question_runs` segue le regole di conservazione di `analysis_runs`, già annotate in `docs/prima-dei-clienti-reali.md` `[code:docs/prima-dei-clienti-reali.md]`. Durante la prova: 0 righe scritte, 0 workspace esistenti `[data:prod-baseline-2026-09-27]`.
**Actually reversible:** sì per il codice (provato, 5 secondi) e per lo schema, che resta al suo posto senza effetti su `main`. No per la rimozione: la migrazione che toglie tabelle e funzioni, prevista dai criteri di stop `[code:.builderos/initiatives/chiedi-ai-feedback/04-spec.md]`, cancella `question_runs` e con esso il testo di tutte le domande. Si esegue solo con la decisione di stop, non come rollback.

## Pre-launch instrumentation
Nessun evento arriva oggi da produzione. `POSTHOG_KEY` non è tra le variabili del progetto (`vercel env ls`: solo `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, tutte Production), e senza chiave il codice esce prima di costruire la richiesta `[code:src/lib/analytics.ts:43]`. Vale anche per gli eventi di attivazione di `main`: oggi il North Star in PostHog è vuoto. La misura non si perde: le query M1, M2 e M3 sotto leggono le stesse informazioni dal database di produzione.

| Event | Arrives from production path | Evidence |
|-------|------------------------------|----------|
| `question_answered` | no: `POSTHOG_KEY` assente in produzione | `vercel env ls` del 2026-09-27; richiesta verificata solo nei test con un `fetch` finto `[code:src/app/(app)/ask/analytics.test.ts]` |
| `first_analysis_completed` (denominatore) | no, stesso motivo | come sopra `[code:src/lib/analytics.ts]` |
| `signed_up`, `first_feedback_added`, `upgraded_to_pro` (guardrail di attivazione) | no, stesso motivo | come sopra `[code:docs/analytics.md]` |

Da verificare appena la chiave esiste, prima del 2026-09-30 alle 18:00:
1. `vercel env ls` mostra `POSTHOG_KEY` in Production (non in Preview: le anteprime non devono mandare eventi).
2. Ricostruire i deployment: le variabili entrano nel deployment quando lo si costruisce. Sia `main` sia il deployment di riserva di Chiedi vanno ricostruiti, e l'id del `main` nuovo sostituisce `c07p3pai0` nel Rollback. Fatto il 2026-09-28: `main` è `p69aof2u5`, la riserva è `hfe81bpwz`.
3. In PostHog UE, Activity, filtro sull'evento: dopo la creazione degli account demo arrivano `signed_up` e `first_feedback_added`; dopo l'analisi di Fatturino `first_analysis_completed` con `feedback_count` e `theme_count`.
4. Una domanda dall'account M sul deployment di riserva: arriva `question_answered` con `distinct_id` uguale all'id del workspace di M, proprietà esattamente `citation_count` e `outcome` più `$process_person_profile: false` e `$geoip_disable: true`, nessun testo della domanda o della risposta.
5. Una domanda che finisce `failed` (per esempio con il Gateway fermo) non manda nessun evento e compare solo in `questions` con `status = 'failed'`.
6. Salvare in PostHog l'insight "Chiedi: ritorno a 14 giorni" con la HogQL di `04-spec.md` e l'insight "Chiedi: quota no_evidence", e scrivere qui i loro link.

## Baseline (captured 2026-09-27T09:07:51Z, before rollout 2026-09-27T09:09:48Z)
Il secondo timestamp è la prima esposizione del codice di Chiedi, la prova generale; il rilascio pubblico è il 2026-10-01 alle 13:00Z. Finestra: tutta la vita del database di produzione, creato il 2026-09-26, fino al momento della cattura. La coorte della metrica comincia il 2026-10-01, quindi il valore è uno zero esplicito con data di prima misurazione, non una media storica.

| Metric | Value | Window | Method | Tag |
|--------|-------|--------|--------|-----|
| Metrica di successo (fase 2): quota di workspace attivati tra il 2026-10-01 e il 2026-10-17 con risposte con almeno 1 citazione verificata in almeno 2 giorni distinti entro 14 giorni | 0: tabella `questions` inesistente, 0 workspace attivati (0 nella finestra della coorte), 0 righe `first_analysis_completed` in `analytics_milestones` | dal 2026-09-26 al 2026-09-27T09:07:51Z | SQL sul database di produzione via Management API, testo e output nell'evidenza; da ora in avanti query M1 | `[data:prod-baseline-2026-09-27]` |
| Guardrail: quota di risposte `no_evidence` (criterio di stop 3) | non definita: 0 domande su 0 | come sopra | query M2 | `[data:prod-baseline-2026-09-27]` |
| Guardrail: North Star di attivazione (prima analisi entro 24 ore dalla creazione del workspace) | non definita: 0 workspace creati | come sopra | query M3 | `[data:prod-baseline-2026-09-27]` |
| Guardrail operativo: quota di domande `failed` | non definita: 0 domande | come sopra | query M2 | `[data:prod-baseline-2026-09-27]` |
| Qualità dell'output del modello: pass rate del campione di produzione sulla rubrica delle evals | non misurata: evals mai eseguite (deroga al gate 5, da eseguire prima del 2026-10-01) e 0 risposte in produzione | nessuna | `pnpm evals` su `evals/questions.json`, soglia 17 su 20 | `[doc:user-2026-09-27-deroga-gate-5]` |

## Measurement
**Success metric measured by:** query M1 "Chiedi: ritorno a 14 giorni (DB)" sul database di produzione, eseguita il 2026-09-27T09:12:05Z con risultato 0 workspace `[data:prod-baseline-2026-09-27]`. Quando PostHog ha dati, anche l'insight PostHog con lo stesso nome e la HogQL di `04-spec.md` (non ancora creato: serve la chiave). Se le due differiscono, fa fede M1: non dipende dall'arrivo degli eventi.

Differenze di M1 dalla HogQL, dichiarate: `t0` è l'inizio della prima analisi con temi (`analyses.created_at`) invece del momento dell'evento, che arriva alla fine, fino a 4 minuti dopo `[code:docs/prima-dei-clienti-reali.md]`; "risposta con almeno una citazione verificata" è `outcome = 'answered'` e `citation_count >= 1`, lo stesso fatto che l'evento porta.

Si eseguono con la Management API di Supabase (`POST /v1/projects/gnmwatxyhigexujgfmem/database/query`) o nell'editor SQL della dashboard. Id del workspace della demo di Mario (M) da mettere al posto di `<demo_ws>`: si legge dopo il seed.

M1, "Chiedi: ritorno a 14 giorni (DB)":

```sql
with first_analysis as (
  select a.workspace_id as ws, min(a.created_at) as t0
  from public.analyses a
  where a.status = 'done'
    and exists (select 1 from public.themes t where t.analysis_id = a.id)
  group by a.workspace_id
),
activated as (
  select ws, t0 from first_analysis
  where t0 >= '2026-10-01 00:00 Europe/Rome' and t0 < '2026-10-18 00:00 Europe/Rome'
    and ws <> '<demo_ws>'::uuid
),
asked as (
  select q.workspace_id as ws, count(distinct (q.created_at at time zone 'Europe/Rome')::date) as days
  from public.questions q
  join activated a on a.ws = q.workspace_id
  where q.status = 'done' and q.outcome = 'answered' and q.citation_count >= 1
    and q.created_at >= a.t0 and q.created_at < a.t0 + interval '14 days'
  group by q.workspace_id
)
select now() as run_at, count(*) as workspace_attivati,
       count(*) filter (where asked.days >= 2) as tornati_a_chiedere,
       round(100.0 * count(*) filter (where asked.days >= 2) / nullif(count(*), 0), 1) as quota
from activated left join asked on asked.ws = activated.ws;
```

M2, "Chiedi: esiti delle domande (DB)", criterio di stop 3 e fallite:

```sql
select now() as run_at, count(*) as domande_totali,
       count(*) filter (where status = 'done') as chiuse,
       count(*) filter (where outcome = 'no_evidence') as no_evidence,
       count(*) filter (where status = 'failed') as fallite,
       round(100.0 * count(*) filter (where outcome = 'no_evidence')
             / nullif(count(*) filter (where status = 'done'), 0), 1) as quota_no_evidence
from public.questions
where created_at >= '2026-10-01 00:00 Europe/Rome' and created_at < '2026-11-01 00:00 Europe/Rome'
  and workspace_id <> '<demo_ws>'::uuid;
```

M3, "Voce: attivazione entro 24 ore (DB)", guardrail North Star:

```sql
select now() as run_at, count(*) as workspace_creati,
       count(*) filter (where exists (
         select 1 from public.analyses a join public.themes t on t.analysis_id = a.id
         where a.workspace_id = w.id and a.status = 'done'
           and a.created_at < w.created_at + interval '24 hours')) as attivati_24h
from public.workspaces w
where w.created_at >= '2026-10-01 00:00 Europe/Rome' and w.created_at < '2026-11-01 00:00 Europe/Rome';
```

## Release notes

> **Novità in Voce: chiedi ai tuoi feedback**
>
> Stai scrivendo una specifica o preparando una decisione e ti chiedi "cosa dicono i clienti di questo?". Da oggi lo chiedi a Voce, con parole tue, e ricevi la risposta in meno di un minuto, invece di rileggere tutto.
>
> **Cosa puoi fare adesso**
> - Scrivi una domanda nella nuova scheda **Chiedi**, per esempio "Cosa dicono i clienti dell'esportazione in Excel?".
> - Voce ti dice quanti feedback ne parlano e ti mostra fino a 5 frasi dei tuoi clienti, esattamente come le hanno scritte, con canale e data. Nessuna frase inventata: se una citazione non si trova parola per parola nei tuoi feedback, non te la mostriamo.
> - Se nei tuoi feedback non c'è niente sull'argomento, Voce te lo dice chiaramente: "Non trovo feedback che ne parlano." È una risposta anche questa.
>
> **Da sapere**
> - Voce cerca nei feedback degli ultimi 90 giorni, fino ai 500 più recenti.
> - La risposta non viene salvata: se ti serve in un documento, selezionala e copiala prima di lasciare la pagina.
> - Con il piano Free hai 10 domande al mese, con Pro 100. Sono separate dalle analisi dei temi, e trovi sempre sotto il pulsante quante te ne restano.
> - La domanda e i feedback passano dal nostro fornitore di intelligenza artificiale, come per l'analisi dei temi. Il testo non va mai nei nostri strumenti di statistica.

Pubblicazione: Voce non ha una pagina delle novità; il testo si legge sul palco e si pubblica dove decide Mario.

## Outcome review
**Owner:** Mario Miletta · **Date:** 2026-10-10 (criterio 1; slitta al 2026-10-17 se le interviste fatte sono meno di 6) e 2026-10-31 (criteri 2 e 3), dalle date dei criteri di stop di `03-solution-bet.md`, senza discrepanze con la fase 2.
**Will evaluate:**
1. 2026-10-10: se la sintesi delle interviste del 2-9 ottobre ha esito "chiuso", Chiedi esce dalla navigazione e il codice si cancella entro il 2026-10-17, anche con una metrica buona; con esito "rimodellato" verso la sintesi periodica si smette di investire su Chiedi e si riapre la fase 2 `[doc:user-2026-09-26-delega]`.
2. 2026-10-31: con almeno 20 workspace attivati tra il 2026-10-01 e il 2026-10-17, quota M1 sotto il 15%: Chiedi si toglie; tra 15% e 25% resta e non si estende; sotto 20 workspace decide solo il criterio 1 `[estimate:15-per-cento-di-20]`.
3. 2026-10-31: se M2 dà più del 50% di `no_evidence`, Chiedi si sostituisce con la ricerca nel testo, senza ritoccare il prompt `[doc:user-2026-09-26-delega]`.
Insieme, i guardrail: M3 sullo stesso periodo (la domanda non deve sostituire la prima analisi) e la quota di fallite di M2.

## Aggiornamento 2026-09-28: produzione pronta, AI bloccata

Eseguito dal modello per delega di Mario sul solo progetto Voce, 2026-09-27 tra le 22:00 e le 22:30 UTC `[data:prod-setup-2026-09-28]`.

**Deployment da usare sul palco**

| Ruolo | URL | Id | Codice |
|---|---|---|---|
| Produzione, target del rollback | `voce-feedback-p69aof2u5-demos-1c73.vercel.app` | `dpl_6FwMgcPnjwRmUispDfu1NoGX6DTW` | `main` @ `89b2a73` |
| Riserva di Chiedi, senza dominio | `voce-feedback-hfe81bpwz-demos-1c73.vercel.app` | `dpl_B9PNcdq7nwRRskkWwBZwKZNDvTNQ` | `feat/ask-your-feedback` @ `2f78b54` |

Promozione della riserva sul palco: `vercel promote voce-feedback-hfe81bpwz-demos-1c73.vercel.app --scope demos-1c73 --yes`. Il commit di questo aggiornamento tocca solo questo file: la riserva resta valida. `autoAssignCustomDomains` è true (verificato dopo le ricostruzioni).

**Due problemi trovati e corretti**
- La produzione non serviva `main`. Il deployment sul dominio (`qulhfmodq`, `dpl_H48MRKcUV9TccUdkYf3uwXAKfDUg`) era una ricostruzione della vecchia riserva `dpl_FPYYj3gM92ZoqJsh14ycDDh3qrTC`: sul dominio pubblico c'era Chiedi (`/ask` 307, voce "Chiedi" nel menu). Ricostruito `main` dal deployment con commit `89b2a73`: `/ask` 404, menu senza Chiedi.
- `SUPABASE_SECRET_KEY` su Vercel Production non era valida ("Invalid API key"): ogni pagina dopo il login dava 500 (`/feedback`, `/themes`, `/billing`). Sostituita con la chiave vera, sensibile. Da non promuovere: `qulhfmodq` e `93feygslg`, costruiti con la chiave vecchia.

**Verificato**
- Stripe, modalità test (sandbox `stripe-sandbox-emerald-ladder`): prodotto "Voce Pro" `prod_VL6NAX8njapDiW`, prezzo 19 EUR al mese `price_1UKQANPgHPsUC1BKPLl4lpKR`, webhook `we_1UKQAOPgHPsUC1BKsI4BNLit` sui 9 eventi del runbook, portale clienti `bpc_1UKQAOPgHPsUC1BKyN2IbD0n` (disdetta a fine periodo, cambio metodo di pagamento, nessun cambio piano). `STRIPE_WEBHOOK_SECRET` e `STRIPE_PRICE_ID` in Production, sensibili.
- `/` 200 e `/login` 200 su `voce-feedback.vercel.app` e `voce-feedback-ten.vercel.app`; POST non firmato al webhook 400.
- Dati demo: A Fatturino (Pro, 360 feedback), B Orto (Free, 9 feedback), M PHC26 (Pro, modulo `phc26` con la domanda della sala, 0 risposte). A e M sono passati a Pro con un pagamento di prova vero (carta 4242): 2 abbonamenti attivi, 0 eventi Stripe con consegna fallita.
- `prova-produzione.sh`: B legge 9 righe sue, 0 di A, il tentativo di darsi Pro è rifiutato (42501), piano ancora free.
- `prova-modulo.mjs phc26` sul dominio pubblico: domanda mostrata, conferma dopo l'invio. La risposta di prova è stata cancellata.
- PostHog: milestone registrate e inviate da produzione in `analytics_milestones`: `upgraded_to_pro` per A e M, `first_feedback_added` (modulo) per M. `signed_up` non parte per gli account demo, creati dall'API di amministrazione senza conferma email; `first_feedback_added` di A e B non parte perché il seed importa dall'API di Supabase e non dall'app.
- `controllo-rilascio` su `2f78b54`: 9 voci su 9 OK (54 test RLS, 52 test pgTAP, 215 test, build, typecheck, lint, segreti, 10 migrazioni allineate, 7 variabili). Verdetto: sì.

**Bloccato: AI Gateway.** Analisi dei temi di A dal browser fallita. Errore del Gateway, riprodotto con una chiamata diretta: HTTP 403 `RestrictedModelsError`, "Free tier users do not have access to this model. Upgrade to paid credits". Saldo del team `demos-1c73`: 5 USD, 0 usati: sono i crediti gratuiti, non un acquisto. Nessuna domanda di Chiedi fatta: fallirebbe allo stesso modo. Una riga `failed` in `analyses` su A, che non conta nella quota.

Delle quattro azioni sotto: 2 (PostHog) e 3 (GitHub) fatte; 1 non basta ancora, serve l'acquisto di crediti sul team Demos; 4 aperta.

## Azioni bloccate su Mario

In ordine, entro il 2026-09-30 alle 18:00. Dopo ognuna il passo successivo lo eseguo io.

1. **Carta sul team Vercel** (sblocca AI Gateway: senza, analisi e Chiedi falliscono). vercel.com, selettore del team in alto a sinistra: **Demos**, poi **Settings**, **Billing**, sezione **Payment Method**, **Add Payment Method**. Dopo: evals di Chiedi (condizione della deroga al gate 5) e una domanda vera.
2. **Chiave PostHog UE.** eu.posthog.com, nuovo progetto "Voce" in regione EU, poi **Settings**, **Project**, copia la **Project API key** (`phc_...`). Su vercel.com: progetto **voce-feedback**, **Settings**, **Environment Variables**, **Add New**: Key `POSTHOG_KEY`, Value la chiave, spunta solo **Production**, **Save**. La chiave non passa dalla chat. Dopo: ricostruisco `main` e il deployment di riserva e faccio i controlli 1-6 della sezione sulla strumentazione.
3. **Collegamento a GitHub.** vercel.com/account/authentication, sezione **Login Connections**, **Connect** accanto a GitHub, autorizza. Poi progetto **voce-feedback**, **Settings**, **Git**, **Connect Git Repository**, **GitHub**, `mariomile/voce`. Se il repository non compare: github.com/settings/installations, **Vercel**, **Configure**, **Repository access**, aggiungi `mariomile/voce`, **Save**. Controllare che **Production Branch** sia `main`. Dopo: verifico che un deployment da GitHub prenda il dominio.
4. **PR #4 pronta al merge**: sulla pagina della PR, **Ready for review**, prima della sessione, così sul palco resta un solo clic (**Merge pull request**).

Sulla sessione, non su Chiedi: i termini dell'integrazione Stripe servono al seed degli account demo (runbook, passi 4 e 7) e quindi all'account M con cui si fa la domanda dal vivo.

## SHIPPED

**Strategy:** full sul palco il 2026-10-01 alle 15:00, migrazione già in produzione, deployment di riserva `dpl_B9PNcdq7nwRRskkWwBZwKZNDvTNQ` (`voce-feedback-hfe81bpwz-demos-1c73.vercel.app`, dal 2026-09-28) · **Rollback:** `vercel rollback` al deployment di `main`, owner Mario, provato in produzione il 2026-09-27 (5 secondi, dominio di nuovo su `main`, assegnazione automatica dei domini ripristinata) · **Baseline:** 0, catturato 2026-09-27T09:07:51Z prima della prima esposizione delle 09:09:48Z `[data:prod-baseline-2026-09-27]` · **Measurement:** query M1 sul database di produzione, insight PostHog quando c'è la chiave · **Release notes:** per gli utenti di Voce, sopra · **Review:** Mario, 2026-10-10 e 2026-10-31 · **Stato:** Chiedi non è ancora pubblico; la produzione serve `main`.
