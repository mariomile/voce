# Analytics

Voce manda a PostHog solo gli eventi che servono a misurare l'attivazione del brief: la quota di nuovi workspace che eseguono la prima analisi AI entro 24 ore dalla registrazione, e il passaggio a Pro. In più un evento ripetibile, `question_answered`, per misurare se i PM tornano a fare domande ai feedback (iniziativa "Chiedi ai tuoi feedback"), e i due eventi della Research (iniziativa "Research"): `first_research_collected`, quando una Research arriva a 5 feedback, e `research_synthesized`, a ogni sintesi. Infine `report_generated`, a ogni report di una Research salvato.

## Come funziona

- **Solo dal server.** Nessuno script PostHog nel browser: niente cookie, niente registrazione dei clic o delle pagine, niente IP dei visitatori.
- **PostHog UE**: `https://eu.i.posthog.com`.
- **Identità = id del workspace** (`distinct_id`). Niente email, nome, id utente. Nessun profilo persona (`$process_person_profile: false`) e nessuna geolocalizzazione (`$geoip_disable: true`).
- **Mai il testo dei feedback**, né il testo delle domande a Chiedi o delle risposte, né la domanda di una Research, le ipotesi, i temi, il ragionamento dei verdetti o le citazioni, né email, nomi di clienti, nomi del workspace, domande del modulo. Le proprietà sono solo categorie e conteggi, elencate sotto.
- **Gli eventi di attivazione partono una sola volta per workspace.** La tabella `analytics_milestones` (solo server, invisibile agli utenti) registra gli eventi già partiti. Anche con una sala piena che invia dal modulo nello stesso istante parte un solo `first_feedback_added`.
- **Dopo la risposta.** L'utente non aspetta PostHog. Se PostHog non risponde, l'errore finisce nei log e l'evento si perde: non si ritenta.
- **Senza `POSTHOG_KEY` non parte nulla** e non viene registrato nulla in `analytics_milestones`. I test non mandano mai eventi.

## Eventi

| Evento | Quando parte | Proprietà |
|---|---|---|
| `signed_up` | Conferma dell'email di registrazione (o primo accesso con email e password, se il link è stato aperto in un altro browser), o primo accesso con Google | `method`: `email` o `google` |
| `first_feedback_added` | Primo feedback salvato nel workspace | `source`: `manual`, `csv` o `form` |
| `first_analysis_completed` | Prima analisi dei temi completata con almeno un tema, in qualunque Research del workspace. Non parte per una sintesi con il solo verdetto | `feedback_count`: feedback analizzati; `theme_count`: temi prodotti |
| `upgraded_to_pro` | La prima volta che il webhook Stripe porta il workspace su Pro | nessuna |
| `first_research_collected` | Il feedback che porta una Research del workspace ad almeno 5 feedback, dal modulo pubblico, dalle note di intervista o dal CSV: una volta per workspace. Il sesto feedback e il quinto di un'altra Research non la mandano. I workspace che avevano già 5 feedback prima della migrazione della Research la hanno già in `analytics_milestones` e non la mandano | nessuna |
| `research_synthesized` | A ogni sintesi di una Research (il clic su "Analizza", "Solo il verdetto", "Analizza le risposte" della sala) con almeno una parte `done`, temi o verdetto. Non parte se falliscono entrambe, né per le sintesi rifiutate (occupato, quota finita, senza feedback, senza sessione) | `feedback_count`: feedback mandati al modello; `citation_count`: citazioni verificate salvate dal database in quella sintesi (temi e verdetto); `hypothesis_count`: ipotesi che hanno ricevuto un verdetto in quella sintesi, 0 per i soli temi, per la sala e con una sola analisi rimasta |
| `report_generated` | A ogni report di una Research ("Genera il report" o "Rigenera") salvato dal database, dopo il ricontrollo delle citazioni. Non parte per i report falliti, né per quelli rifiutati (senza sintesi, occupato, quota finita, senza sessione) | `feedback_count`: feedback letti dalla sintesi da cui viene il report; `theme_count`: temi mandati al modello; `hypothesis_count`: ipotesi della Research |
| `question_answered` | A ogni domanda a Chiedi chiusa con una risposta (`answered`) o senza prove (`no_evidence`), dopo che il database ha ricontrollato le citazioni. Non parte per le domande fallite, rifiutate per quota, occupato, non valide, senza sessione o senza feedback | `citation_count`: citazioni verificate mostrate, da 0 a 5; `outcome`: `answered` o `no_evidence` |

Il momento dell'evento è quello in cui l'azione avviene sul server (`timestamp`).

**`question_answered` è ripetibile e non passa da `analytics_milestones`:** parte a ogni risposta, con `trackEvent` in `src/lib/analytics.ts`, che manda la stessa richiesta dei milestone (stesso URL, stessa identità, dopo la risposta, niente senza chiave) senza registrare nulla. Le domande fallite non mandano eventi: si contano in `question_runs`.

**Anche `report_generated` è ripetibile e non passa da `analytics_milestones`:** parte con `trackEvent` alla fine di `generateReport`. Nessun testo del report, della domanda, dei temi o delle citazioni: solo i tre conteggi.

**Anche `research_synthesized` è ripetibile e non passa da `analytics_milestones`:** parte con `trackEvent` alla fine di `synthesize`. `first_research_collected` invece è un evento di attivazione: il vincolo della tabella accetta cinque eventi, i quattro di prima e `first_research_collected`. Il controllo "almeno 5 feedback nella Research" si fa solo con la chiave, dentro la funzione che `trackMilestone` esegue dopo la risposta.

## La metrica di attivazione in PostHog

Funnel con `signed_up` → `first_analysis_completed`, finestra di conversione 24 ore, aggregato per `distinct_id` (il workspace). Il tasso di conversione è la quota di nuovi workspace attivati. `first_feedback_added` come passo intermedio mostra dove si fermano; `upgraded_to_pro` come passo finale, con finestra più lunga, dice quanti attivati pagano.

## La metrica della Research

La metrica di fase 2 dell'iniziativa Research: tra i workspace che portano una Research a 5 feedback tra il 2026-10-05 e il 2026-10-25, quanti arrivano entro 14 giorni a una sintesi con almeno 5 feedback letti e almeno una citazione verificata. Si legge il 2026-11-08, solo con almeno 10 workspace nel denominatore. Query HogQL (sostituire `<id del workspace della demo>` con l'id che dà Mario; senza, togliere la riga e scrivere nel risultato che la demo è inclusa):

```sql
with collected as (
  select distinct_id as ws, min(timestamp) as t0
  from events
  where event = 'first_research_collected'
    and timestamp >= '2026-10-05' and timestamp < '2026-10-26'
    and distinct_id != '<id del workspace della demo>'
  group by ws
),
synthesized as (
  select distinct e.distinct_id as ws
  from events e
  join collected c on e.distinct_id = c.ws
  where e.event = 'research_synthesized'
    and toInt(e.properties.feedback_count) >= 5
    and toInt(e.properties.citation_count) >= 1
    and e.timestamp >= c.t0 and e.timestamp < c.t0 + interval 14 day
)
select count() as workspace_con_5_voci,
       countIf(ws in (select ws from synthesized)) as arrivati_alla_sintesi,
       round(100 * arrivati_alla_sintesi / workspace_con_5_voci, 1) as quota
from collected
```

Il criterio di stop 4 (ipotesi e verdetto usati) usa le stesse `collected` e `synthesized`, e tra i workspace di `synthesized` conta quelli con almeno un `research_synthesized` con `hypothesis_count >= 1` nella stessa finestra di 14 giorni: la query completa è nella sezione "Tracking plan" di `.builderos/initiatives/research/04-spec.md`. Limite accettato: la sintesi contata può essere di una Research diversa da quella arrivata a 5 feedback.

## Limiti noti

- **Account creati prima di PostHog.** Un utente registrato prima che la chiave fosse impostata manda `signed_up` al primo accesso con Google o alla conferma di un nuovo link, e `first_feedback_added` al primo feedback dopo l'attivazione. In modalità test non conta; con clienti veri la chiave c'è dal primo giorno.
- **Pro rinnovato dopo una disdetta.** `upgraded_to_pro` parte solo la prima volta: i ritorni a Pro non si contano.
- **Evento perso.** Se PostHog non risponde dopo che l'evento è stato registrato come partito, non si rimanda.

## Configurazione

In `.env.local` (e su Vercel), solo lato server:

```
POSTHOG_KEY=   # Project API key (phc_...) del progetto PostHog in regione UE
```

Il codice è in `src/lib/analytics.ts`: ogni nuovo evento di attivazione va aggiunto lì, al tipo `Milestone`, al vincolo della tabella `analytics_milestones` e a questa pagina; un evento ripetibile va al tipo `RepeatedEvent` e a questa pagina.
