# PRODUCT.md — Voce

**Stage:** pre-PMF
**Last amended:** 2026-09-26
**Amendment count:** 0

## Purpose

Voce raccoglie i feedback dei clienti da più canali e li raggruppa in temi con l'AI, per decidere la roadmap. `[doc:voce-brief]`

## The Problem

I feedback dei clienti arrivano da ticket di supporto, call di vendita, sondaggi NPS, recensioni e Slack, e finiscono in fogli di calcolo e thread diversi. Leggerli tutti richiede ore, gli schemi ricorrenti sfuggono e la roadmap segue il cliente che si lamenta più forte, non il problema più frequente.

**Who has it:** product manager di startup e scaleup italiane, team di prodotto da 1 a 10 persone, senza uno strumento dedicato ai feedback. `[assumption:unvalidated]`
**How they solve it today:** fogli di calcolo e thread sparsi, letti a mano. `[assumption:unvalidated]`
**What that costs them:** ore di lettura e priorità decise dal cliente più rumoroso invece che dal problema più frequente. `[assumption:unvalidated]`

Nessuna delle tre righe viene da utenti: sono le ipotesi scritte nel brief `[doc:voce-brief]`. Voce non ha ancora utenti.

## ICP

| | Primary | Secondary |
|---|---------|-----------|
| **Segment** | PM di startup e scaleup italiane, team di prodotto 1-10 | Founder che fanno anche da PM |
| **Size** | non stimata `[assumption:unvalidated]` | non stimata `[assumption:unvalidated]` |
| **Trigger** | una riunione di roadmap con feedback da riassumere | |
| **Buying power** | il PM stesso, piano Pro a 19 €/mese `[doc:voce-brief]` | |
| **Where they are** | community di product italiane, Product Heroes `[assumption:unvalidated]` | |

## Jobs To Be Done

When accumulo feedback da canali diversi, I want to vedere in pochi minuti quali problemi e opportunità emergono più spesso, con le parole dei clienti, so I can decidere cosa mettere in roadmap e spiegarlo al team. `[doc:voce-brief]`

## Non-Goals

- Inviti e team con più membri, because prima serve un utente singolo che torna `[doc:user-2026-09-26-init]`
- Integrazioni dirette con Intercom, Zendesk, Slack, because CSV e modulo pubblico coprono la raccolta `[doc:user-2026-09-26-init]`
- Notifiche email, app mobile, SSO aziendale, because non servono per arrivare alla prima analisi `[doc:user-2026-09-26-init]`
- Prompt dell'AI personalizzabili dall'utente, because la qualità si misura con le evals solo se il prompt è unico `[doc:user-2026-09-26-init]`

## Constraints

| Type | Constraint | Source |
|------|-----------|--------|
| Technical | Segreti solo lato server; Row Level Security su ogni tabella prima che contenga dati; testo dei feedback trattato come input non fidato | `[code:AGENTS.md]` |
| Regulatory | Dati in Unione Europea; il testo dei feedback non va negli analytics; eccezione accettata in modalità test: API Anthropic | `[code:AGENTS.md]` |
| Resource | Mario da solo con un coding agent; scadenza fissa: masterclass PHC26 del 1 ottobre 2026 | `[doc:user-2026-09-26-init]` |
| Distribution | Nessun canale oggi; il primo è la sala di PHC26 (circa 230 PM) | `[doc:user-2026-09-26-init]` |

## Voice

- **Chiaro, non tecnico:** "Raggruppa i feedback in temi", non "clustering semantico dei feedback".
- **Concreto, non promozionale:** "3 analisi al mese", non "potenzia le tue decisioni".
- **Breve, non brusco:** "Hai raggiunto 100 feedback: passa a Pro per continuare", non "Limite superato".

`[doc:user-2026-09-26-init]`

## Language

| Term | Means | Not to be confused with |
|------|-------|------------------------|
| Feedback | Un messaggio di un cliente raccolto in Voce | Tema |
| Tema | Un gruppo di feedback con titolo, sintesi, conteggio e citazioni, prodotto dall'analisi | Feedback |
| Analisi | L'esecuzione dell'AI che produce un nuovo insieme di temi | Evals |
| Workspace | Lo spazio dati di un utente; nessuno vede quello di un altro | Account |

## Success

**North Star:** quota di nuovi workspace che eseguono la prima analisi AI entro 24 ore dalla registrazione `[doc:voce-brief]`
**Current baseline:** 0, prodotto non ancora in produzione; prima misurazione dopo il rilascio `[code:src/lib/analytics.ts]`

## Data Sources

| Source | Status | What it answers |
|--------|--------|-----------------|
| PostHog (UE) | assente: eventi nel codice, chiave non configurata | attivazione per workspace |
| Supabase | solo locale, produzione non creata | feedback, analisi, piani |
| Registro `analysis_runs` | solo locale | costo, durata ed esito di ogni analisi |
