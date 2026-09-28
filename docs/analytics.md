# Analytics

Voce manda a PostHog solo gli eventi che servono a misurare l'attivazione del brief: la quota di nuovi workspace che eseguono la prima analisi AI entro 24 ore dalla registrazione, e il passaggio a Pro. In più un evento ripetibile, `question_answered`, per misurare se i PM tornano a fare domande ai feedback (iniziativa "Chiedi ai tuoi feedback").

## Come funziona

- **Solo dal server.** Nessuno script PostHog nel browser: niente cookie, niente registrazione dei clic o delle pagine, niente IP dei visitatori.
- **PostHog UE**: `https://eu.i.posthog.com`.
- **Identità = id del workspace** (`distinct_id`). Niente email, nome, id utente. Nessun profilo persona (`$process_person_profile: false`) e nessuna geolocalizzazione (`$geoip_disable: true`).
- **Mai il testo dei feedback**, né il testo delle domande a Chiedi o delle risposte, né email, nomi di clienti, nomi del workspace, domande del modulo. Le proprietà sono solo categorie e conteggi, elencate sotto.
- **Gli eventi di attivazione partono una sola volta per workspace.** La tabella `analytics_milestones` (solo server, invisibile agli utenti) registra gli eventi già partiti. Anche con una sala piena che invia dal modulo nello stesso istante parte un solo `first_feedback_added`.
- **Dopo la risposta.** L'utente non aspetta PostHog. Se PostHog non risponde, l'errore finisce nei log e l'evento si perde: non si ritenta.
- **Senza `POSTHOG_KEY` non parte nulla** e non viene registrato nulla in `analytics_milestones`. I test non mandano mai eventi.

## Eventi

| Evento | Quando parte | Proprietà |
|---|---|---|
| `signed_up` | Conferma dell'email di registrazione, o primo accesso con Google | `method`: `email` o `google` |
| `first_feedback_added` | Primo feedback salvato nel workspace | `source`: `manual`, `csv` o `form` |
| `first_analysis_completed` | Prima analisi AI completata con almeno un tema | `feedback_count`: feedback analizzati; `theme_count`: temi prodotti |
| `upgraded_to_pro` | La prima volta che il webhook Stripe porta il workspace su Pro | nessuna |
| `question_answered` | A ogni domanda a Chiedi chiusa con una risposta (`answered`) o senza prove (`no_evidence`), dopo che il database ha ricontrollato le citazioni. Non parte per le domande fallite, rifiutate per quota, occupato, non valide, senza sessione o senza feedback | `citation_count`: citazioni verificate mostrate, da 0 a 5; `outcome`: `answered` o `no_evidence` |

Il momento dell'evento è quello in cui l'azione avviene sul server (`timestamp`).

**`question_answered` è ripetibile e non passa da `analytics_milestones`:** parte a ogni risposta, con `trackEvent` in `src/lib/analytics.ts`, che manda la stessa richiesta dei milestone (stesso URL, stessa identità, dopo la risposta, niente senza chiave) senza registrare nulla. Il vincolo della tabella resta con i quattro eventi di attivazione. Le domande fallite non mandano eventi: si contano in `question_runs`.

## La metrica di attivazione in PostHog

Funnel con `signed_up` → `first_analysis_completed`, finestra di conversione 24 ore, aggregato per `distinct_id` (il workspace). Il tasso di conversione è la quota di nuovi workspace attivati. `first_feedback_added` come passo intermedio mostra dove si fermano; `upgraded_to_pro` come passo finale, con finestra più lunga, dice quanti attivati pagano.

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
