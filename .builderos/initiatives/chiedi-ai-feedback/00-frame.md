# Frame: Voce, "Chiedi ai tuoi feedback"

**Phase:** 0 · **Cycle:** 1 · **Mode:** lite · **Date:** 2026-09-26 · **Owner:** Mario Miletta (framing scritto dal modello per delega)

## La richiesta, verbatim

"Chiedi ai tuoi feedback": il PM fa una domanda in linguaggio naturale sui feedback raccolti in Voce e riceve una risposta con le citazioni. `[doc:user-2026-09-26-richiesta]`

È una soluzione: dice cosa fare (domanda libera, risposta, citazioni), non quale problema risolve né per chi. La scala qui sotto risale al costo.

| Gradino | Affermazione | Stato |
|---------|--------------|-------|
| 0 | Il PM fa una domanda in linguaggio naturale e riceve una risposta con citazioni | Soluzione |
| 1 | Il PM ha domande precise sui feedback che i temi non coprono: "cosa chiedono i clienti che hanno disdetto?", "quanti si lamentano dell'onboarding da mobile?" | Attività |
| 2 | Per rispondere rilegge i feedback a mano o li incolla altrove; la risposta arriva tardi o non arriva | Costo, non quantificato |
| 3 | Quando in una decisione di roadmap qualcuno chiede "quanti clienti vogliono X?", il PM non ha una risposta con prove in quel momento, e la decisione segue l'aneddoto più forte | Conseguenza sentita da chi decide |

Il gradino successivo ("perché le decisioni di roadmap contano") è un'ovvietà: ci si ferma al 3. Il gradino 3 è lo stesso problema di fondo di Voce `[doc:voce-brief]`, visto da un'altra angolazione: i temi rispondono a "cosa emerge di più", non alle domande che arrivano durante una decisione.

## Problem

Quando in una decisione di roadmap il founder, le vendite o il team chiedono al PM una cosa precisa sui feedback dei clienti ("quanti chiedono l'export in Excel?", "cosa dicono i clienti che hanno disdetto?"), il PM non riesce a rispondere con prove nel momento in cui la domanda conta. Per rispondere dovrebbe rileggere i feedback a mano, quindi rimanda o risponde a memoria, e la priorità la decide l'aneddoto di chi parla più forte. `[assumption:unvalidated]`

Il raggruppamento in temi che Voce produce oggi risponde a "cosa emerge più spesso", non a domande che tagliano i feedback per cliente, argomento o periodo `[doc:voce-brief]`. Dentro Voce la lista dei feedback si filtra solo per canale e si scorre a pagine, senza ricerca nel testo `[code:src/lib/data.ts:186]`.

## Who

**Primary ICP:** PM unico o in un team di prodotto da 1 a 10 persone in una startup o scaleup italiana, che raccoglie già i feedback dei clienti e riceve domande su di essi da founder, vendite o supporto · in Italia i product manager sono "più di 7.000" secondo una stima di stampa del 2023 senza metodo dichiarato `[doc:icp-product-manager-italia]`; le startup innovative iscritte erano 12.170 al 1 aprile 2025 `[doc:icp-startup-innovative]` e 11.090 a fine 2025 secondo CRIBIS `[doc:icp-startup-innovative-cribis-2026]`; quante di queste hanno un PM, e quanti PM stanno in team da 1 a 10, non è noto `[assumption:unvalidated]` · trigger: una riunione di roadmap o una domanda puntuale del founder o delle vendite su cosa chiedono i clienti · signs: il PM stesso, piano Pro a 19 €/mese `[doc:voce-brief]` · reachable via: la sala di PHC26 del 1 ottobre 2026, circa 230 PM `[doc:user-2026-09-26-init]`, e la community Product Heroes `[assumption:unvalidated]`

**Secondary:** founder che fa anche da PM. Stesso problema, ma riceve meno domande da altri perché la decisione è sua: resta secondario. Deciso dal modello per delega di Mario (2026-09-26) `[doc:user-2026-09-26-delega]`

**Dimensione, lettura onesta.** Nessun numero misura il segmento vero. Il dato sui PM è vecchio e senza metodo; quello sulle startup innovative conta aziende, non PM, e lascia fuori le scaleup uscite dal registro. Servono come ordine di grandezza, non come mercato.

**Raggiungibilità.** Nessun PM dell'ICP è oggi utente di Voce e nessuno è stato intervistato. La sala di PHC26 è il primo canale reale, ma è mista per seniority e dimensione d'azienda, e una reazione durante una demo dal vivo non è una prova: è pubblico che applaude. Primo compito della fase 1: Mario nomina cinque PM dell'ICP della sua rete da sentire questa settimana, e la fase 1 usa PHC26 per reclutare, non per validare.

## Today

**Workaround:** dentro Voce, i temi dell'ultima analisi e la lista filtrabile solo per canale `[code:src/lib/data.ts:186]`; fuori da Voce, cercare nel foglio di calcolo, rileggere, oppure incollare l'export in un assistente generico come ChatGPT, Claude o NotebookLM, che risponde con citazioni alle fonti caricate ed è gratuito nel piano base `[doc:priorart-notebooklm]`. Quale di questi usi davvero l'ICP non è noto `[assumption:unvalidated]`

**Cost:** tempo speso a rileggere, risposte rimandate a dopo la riunione, e priorità decise senza prove, quindi credibilità del PM più bassa quando difende la roadmap. Nessuna quantificazione disponibile `[assumption:unvalidated]`

## Why now

Tre cambiamenti datati. Nessuno rende il problema nuovo: rendono nuova l'aspettativa di poter fare la domanda e vedere le prove.

1. **Comportamento cambiato, 2025-10-23** (data visibile sulla pagina; nei metadati 2025-10-22). Nel report Productboard con UserEvidence su 379 professionisti di prodotto, il 94% usa l'AI "daily or often" e il 54% indica la sintesi degli insight dei clienti tra le competenze sempre più importanti `[doc:whynow-productboard-ai-pm-survey]`. Limite: campione enterprise (aziende oltre 500 dipendenti), non startup italiane.
2. **La categoria ha adottato la pratica, ottobre 2025.** Dovetail ha lanciato il 2025-10-08 la sua piattaforma con chat che risponde a domande sui dati dei clienti `[doc:priorart-dovetail]`; Enterpret il 2025-10-27 (data letta dall'URL del comunicato, il testo non era accessibile) un agente che risponde in linguaggio naturale con "one-click citations" ai feedback originali `[doc:priorart-enterpret]`. Chiedere ai propri feedback è diventato normale negli strumenti enterprise della categoria.
3. **Soglia di capacità superata, 2025-01-23.** Anthropic ha rilasciato Citations: le risposte di Claude citano le frasi esatte dei documenti forniti, prima serviva prompt engineering fragile `[doc:whynow-anthropic-citations]`. Conta perché Voce già scarta le citazioni che non compaiono nei feedback carattere per carattere `[code:src/lib/analysis.ts:184]`: il costo di risposte verificabili è sceso.

Il problema di fondo (rispondere con prove sotto pressione) è durevole. La ragione strutturale per cui resta aperto nel segmento, per ipotesi, è che le soluzioni specializzate sono prezzate e progettate per l'enterprise, e quelle generiche richiedono di esportare e incollare ogni volta `[assumption:unvalidated]`

## Riskiest assumption

Nell'ultimo mese, un PM dell'ICP ha avuto almeno una domanda precisa sui feedback dei clienti, arrivata durante o prima di una decisione, a cui non ha risposto con prove in pochi minuti con quello che usa già (foglio, ricerca nel testo, ChatGPT, Claude o NotebookLM). `[assumption:unvalidated]`

**Would be falsified by:** in 6-8 interviste a PM dell'ICP, chiedendo di raccontare l'ultima domanda concreta sui feedback ricevuta negli ultimi 30 giorni, meno della metà ne ricorda una; oppure la maggioranza di chi la ricorda dice di averla risolta in meno di 10 minuti con i mezzi attuali e di essersi fidata della risposta. Soglie decise dal modello per delega di Mario (2026-09-26) `[doc:user-2026-09-26-delega]`

Perché questa e non un'altra: tiene insieme le due credenze che, se false, fanno crollare tutto. Se le domande non arrivano, non c'è problema; se arrivano ma un assistente generico le risolve già bene, il problema è risolto e la funzione in Voce è solo comodità. La fiducia nelle risposte (credenza 5) è rischiosa ma viene dopo: conta solo se il bisogno esiste.

## Prior art

**Classificazione: risolto bene e adottato nell'enterprise; nel segmento, risolto ma adozione non nota.** Il caso più pericoloso: il blocco che tiene i piccoli team lontani da queste soluzioni è la cosa da capire in fase 1.

- **Enterpret:** domanda in linguaggio naturale con citazioni cliccabili ai feedback originali; nessun prezzo pubblico, stima di terzi di circa 1.000 $/mese non verificata; clienti enterprise `[doc:priorart-enterpret]`
- **NotebookLM (ora Gemini Notebook):** carichi le fonti, chiedi, ricevi risposte citate; gratuito nel piano base; generico, non pensato per i feedback, richiede di esportare e caricare `[doc:priorart-notebooklm]`
- Altri vicini: Productboard Spark, risposte che risalgono alla fonte, circa 15 $ per maker al mese secondo una sintesi non riverificata `[doc:priorart-productboard]`; Dovetail, chat sui dati con piano gratuito limitato a un progetto `[doc:priorart-dovetail]`; Unwrap, da 24.000 $ l'anno `[doc:priorart-unwrap]`

Decisione: procedere alla fase 1, non fermarsi. Gli strumenti specializzati sono fuori scala per prezzo e complessità nel segmento, tranne Productboard Spark; il concorrente vero è l'assistente generico con l'export incollato, e la credenza rischiosa lo mette già alla prova. Deciso dal modello per delega di Mario (2026-09-26) `[doc:user-2026-09-26-delega]`

## Beliefs this frame requires

| Belief | Confidence | Collapse if wrong |
|--------|-----------|-------------------|
| 1. I PM dell'ICP ricevono domande precise sui feedback da founder, vendite o team, almeno una volta al mese | Media | Totale: senza domande non c'è problema |
| 2. I temi non bastano a rispondere a quelle domande | Media | Alto: se bastano, serve solo una ricerca nel testo |
| 3. I mezzi attuali (foglio, ChatGPT, NotebookLM) non danno una risposta con prove in pochi minuti | Bassa | Totale: il problema è già risolto |
| 4. Rispondere senza prove porta a decisioni peggiori o a perdita di credibilità del PM | Media | Medio: resta un risparmio di tempo, meno urgente |
| 5. Il PM si fida di una risposta generata con citazioni abbastanza da portarla in riunione | Bassa | Alto, ma solo se 1 e 3 reggono |
| 6. L'ICP ha abbastanza feedback in Voce perché valga la pena chiedere invece di leggere (il piano Free si ferma a 100) `[doc:voce-brief]` | Bassa | Alto per il piano Free, medio per Pro |
| 7. I PM dell'ICP adotteranno Voce per raccogliere i feedback, prerequisito di tutto | Bassa | Totale, ma è la scommessa del prodotto intero, non di questa iniziativa |

La più rischiosa è la combinazione di 1 e 3: confidenza bassa, crollo totale.

## Decisioni prese per delega

Mario ha delegato la fase con "Vai, fai tutto tu" `[doc:user-2026-09-26-delega]`. Ogni scelta qui sotto è "Deciso dal modello per delega di Mario (2026-09-26)" e va rivista da lui.

1. Problema al gradino 3 (rispondere con prove durante una decisione), non al gradino 1 (esplorare i feedback per curiosità).
2. ICP primario: il PM in team da 1 a 10 che riceve domande da altri; il founder-PM resta secondario. `[doc:user-2026-09-26-delega]`
3. Dimensione dell'ICP lasciata come ordine di grandezza con fonti deboli, senza inventare una quota di aziende con un PM.
4. Credenza rischiosa: bisogno reale e insufficienza dei mezzi attuali insieme, invece della fiducia nelle risposte generate.
5. Soglie di falsificazione: meno della metà che ricorda una domanda, o risolta in meno di 10 minuti con i mezzi attuali. `[doc:user-2026-09-26-delega]`
6. Prior art: procedere, con l'assistente generico come concorrente da battere in fase 1.
7. PHC26 è un canale per reclutare persone da sentire, non una prova: le reazioni alla demo dal vivo non entrano come evidenza.

## Obiettivo che la fase 1 eredita

Verificare con 6-8 PM dell'ICP, fuori dalla sala di PHC26, se nell'ultimo mese hanno avuto una domanda precisa sui feedback a cui non hanno risposto con prove in pochi minuti, e cosa hanno usato per provarci. Raccogliere l'ultimo episodio concreto (chi ha chiesto, in quale decisione, cosa hanno fatto, quanto tempo, cosa è successo dopo), non opinioni sulla funzione. `[assumption:unvalidated]`
