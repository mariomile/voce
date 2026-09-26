# Chiedi, S5: evento ripetibile e riservatezza

Slice S5 di `.builderos/initiatives/chiedi-ai-feedback/05-build-plan.md`. Criteri: 28, 29, 30, 31.

## Cosa è stato fatto

- `src/app/(app)/ask/analytics.test.ts`: la action vera con `trackEvent` vero; finti solo PostHog (`fetch`) e il modello. Un marcatore in domanda, risposta e feedback non compare mai nel corpo verso PostHog; due risposte danno due richieste e nessuna riga in `analytics_milestones`; il vincolo della tabella rifiuta ancora `question_answered` (`23514`); nessuna richiesta per `failed`, `limit`, `busy`, `invalid`, `session`, `no_feedback`; nessuna senza `POSTHOG_KEY`.
- `docs/analytics.md`: riga di `question_answered` con proprietà e momento d'invio, e il paragrafo su evento ripetibile che non passa da `analytics_milestones`; la regola "mai il testo" ora nomina anche domande e risposte.

`trackEvent` esisteva da S1 (con il corpo costruito in una sola funzione insieme a `trackMilestone`): qui niente codice nuovo, solo prove e documento.

## Visti fallire

Il test del documento è fallito prima della modifica:

```
     × documents question_answered, its properties, when it is sent, and that it skips analytics_milestones
AssertionError: expected undefined to be defined
      Tests  1 failed | 8 passed (9)
```

I test dell'evento passavano al primo giro, perché il comportamento è di S1. Prova per mutazione, ogni regola rotta e poi rimessa:

```
Ma question text in the event properties (AC 28)
    × the PostHog body carries no question, answer or feedback text
Mb question_answered through analytics_milestones (AC 29)
    × the PostHog body carries no question, answer or feedback text
    × is sent every time and never claims a milestone
Mc event also for failed questions (AC 30)
    × no event for failed, limit, busy, invalid, session, no_feedback
Md sent without POSTHOG_KEY (AC 30)
    × without POSTHOG_KEY no question sends anything
```

## Strumentazione

Evidenza più debole di un arrivo in PostHog, perché `POSTHOG_KEY` non è configurata: la richiesta costruita davvero da `trackEvent` e catturata dal `fetch` finto, dopo una domanda con risposta.

```
CAPTURED {"url":"https://eu.i.posthog.com/i/v0/e/","body":{"api_key":"phc_test","event":"question_answered","distinct_id":"1bb6cd5d-cd98-43a6-8786-fe7895fe034d","timestamp":"2026-09-26T23:17:22.756Z","properties":{"citation_count":1,"outcome":"answered","$process_person_profile":false,"$geoip_disable":true}}}
```

## Verifica

```
pnpm typecheck   exit 0
pnpm lint        exit 0
pnpm test        Test Files  19 passed (19)   Tests  251 passed (251)
```
