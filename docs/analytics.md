# Analytics

Voce manda a PostHog solo gli eventi che servono a misurare l'attivazione del brief: la quota di nuovi workspace che eseguono la prima analisi AI entro 24 ore dalla registrazione, e il passaggio a Pro.

## Come funziona

- **Solo dal server.** Nessuno script PostHog nel browser: niente cookie, niente registrazione dei clic o delle pagine, niente IP dei visitatori.
- **PostHog UE**: `https://eu.i.posthog.com`.
- **Identità = id del workspace** (`distinct_id`). Niente email, nome, id utente. Nessun profilo persona (`$process_person_profile: false`) e nessuna geolocalizzazione (`$geoip_disable: true`).
- **Mai il testo dei feedback**, né email, nomi di clienti, nomi del workspace, domande del modulo. Le proprietà sono solo categorie e conteggi, elencate sotto.
- **Ogni evento parte una sola volta per workspace.** La tabella `analytics_milestones` (solo server, invisibile agli utenti) registra gli eventi già partiti. Anche con una sala piena che invia dal modulo nello stesso istante parte un solo `first_feedback_added`.
- **Dopo la risposta.** L'utente non aspetta PostHog. Se PostHog non risponde, l'errore finisce nei log e l'evento si perde: non si ritenta.
- **Senza `POSTHOG_KEY` non parte nulla** e non viene registrato nulla in `analytics_milestones`. I test non mandano mai eventi.

## Eventi

| Evento | Quando parte | Proprietà |
|---|---|---|
| `signed_up` | Conferma dell'email di registrazione, o primo accesso con Google | `method`: `email` o `google` |
| `first_feedback_added` | Primo feedback salvato nel workspace | `source`: `manual`, `csv` o `form` |
| `first_analysis_completed` | Prima analisi AI completata con almeno un tema | `feedback_count`: feedback analizzati; `theme_count`: temi prodotti |
| `upgraded_to_pro` | La prima volta che il webhook Stripe porta il workspace su Pro | nessuna |

Il momento dell'evento è quello in cui l'azione avviene sul server (`timestamp`).

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

Il codice è in `src/lib/analytics.ts`: ogni nuovo evento va aggiunto lì, al tipo `Milestone`, al vincolo della tabella `analytics_milestones` e a questa pagina.
