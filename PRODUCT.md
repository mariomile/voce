# PRODUCT.md — Voce

**Stage:** pre-PMF
**Last amended:** 2026-09-28
**Amendment count:** 1

## Purpose

Voce aiuta i PM a fare customer discovery: parti da una domanda, raccogli le voci dei clienti, ottieni una sintesi con le prove e un verdetto. `[doc:user-2026-09-28-research-round1]`

Fino al 2026-09-27 lo scopo era raccogliere i feedback da più canali e raggrupparli in temi per decidere la roadmap `[doc:voce-brief]`. Il riposizionamento è una scelta di Mario, non un risultato della ricerca: l'iniziativa `research` lo mette alla prova.

## The Problem

I feedback dei clienti arrivano da ticket di supporto, call di vendita, sondaggi NPS, recensioni e Slack, e finiscono in fogli di calcolo e thread diversi. Leggerli tutti richiede ore, gli schemi ricorrenti sfuggono e la roadmap segue il cliente che si lamenta più forte, non il problema più frequente.

**Who has it:** product manager di startup e scaleup italiane, team di prodotto da 1 a 10 persone, senza uno strumento dedicato ai feedback. `[assumption:unvalidated]`
**How they solve it today:** fogli di calcolo e thread sparsi, letti a mano. `[assumption:unvalidated]`
**What that costs them:** ore di lettura e priorità decise dal cliente più rumoroso invece che dal problema più frequente. `[assumption:unvalidated]`

Nessuna delle tre righe viene da utenti: sono le ipotesi scritte nel brief `[doc:voce-brief]`. Voce non ha ancora utenti.

## ICP

| | Primary | Secondary |
|---|---------|-----------|
| **Segment** | PM che fa discovery senza un ricercatore dedicato, da startup a grande azienda `[doc:user-2026-09-28-research-round1]` | PM e team di prodotto di grandi aziende con research ops `[doc:user-2026-09-28-research-round1]` |
| **Size** | non stimata `[assumption:unvalidated]` | non stimata `[assumption:unvalidated]` |
| **Trigger** | una domanda aperta su clienti o problema da chiudere prima di una decisione di prodotto `[assumption:unvalidated]` | uno studio che il team di research non ha tempo di seguire `[assumption:unvalidated]` |
| **Buying power** | il PM stesso, piano Pro a 19 €/mese `[doc:voce-brief]` | budget di team o di research ops, non noto `[assumption:unvalidated]` |
| **Where they are** | community di product italiane, Product Heroes; la sala di PHC26 come primo canale `[assumption:unvalidated]` | non noto `[assumption:unvalidated]` |

Mario ha indicato "Anche per grandi aziende" `[doc:user-2026-09-28-research-round1]`. BuilderOS chiede un solo ICP primario: il primario è il PM senza ricercatore, a prescindere dalla dimensione dell'azienda, perché è chi fa discovery da solo e non ha già uno strumento di research; il PM di grande azienda con research ops resta secondario, perché lì compra e sceglie gli strumenti chi fa research. Deciso dal modello per delega di Mario (2026-09-28). Da confermare con Mario.

## Jobs To Be Done

When accumulo feedback da canali diversi, I want to vedere in pochi minuti quali problemi e opportunità emergono più spesso, con le parole dei clienti, so I can decidere cosa mettere in roadmap e spiegarlo al team. `[doc:voce-brief]`

## Non-Goals

- Inviti, team con più membri e condivisione delle Research, because prima serve un utente singolo che torna `[doc:user-2026-09-26-init]` `[doc:user-2026-09-28-research-round1]`
- Pianificazione, registrazione e trascrizione delle interviste, because Voce parte dalle voci già raccolte: le note si incollano `[doc:user-2026-09-28-research-round1]`
- Reclutamento dei partecipanti, because trovare le persone da sentire resta fuori da Voce `[doc:user-2026-09-28-research-round1]`
- Survey builder per ora, because arriverà in seguito (non ora, non mai escluso); oggi la raccolta è il modulo pubblico con una domanda `[doc:user-2026-09-28-research-round1]`
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
| Research | Una domanda di ricerca con le sue ipotesi, la sua raccolta dedicata (modulo pubblico o QR, note di intervista incollate, CSV), i temi e Chiedi limitati ai suoi feedback, e un verdetto per ipotesi (confermata / smentita / da rivedere) con le citazioni che lo sostengono `[doc:user-2026-09-28-research-round1]` | Analisi, Workspace |
| Feedback | Un messaggio di un cliente raccolto in Voce; appartiene sempre a una sola Research `[doc:user-2026-09-28-research-round1]` | Tema |
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

## Amendment Log

| Date | What changed | Why | Evidence |
|------|-------------|-----|----------|
| 2026-09-26 | Created | nessuno | `[doc:user-2026-09-26-init]` |
| 2026-09-28 | Purpose riscritto su customer discovery; ICP primario e secondario ridefiniti (primario Deciso dal modello per delega di Mario (2026-09-28)); non-goal su interviste, reclutamento, condivisione e survey builder; termine Research nel glossario, ogni Feedback appartiene a una Research | Riposizionamento deciso da Mario; The Problem e JTBD restano quelli del brief finché la fase 1 dell'iniziativa `research` non dà un verdetto | `[doc:user-2026-09-28-research-round1]` |
