# Definition: Voce, "Chiedi ai tuoi feedback"

**Phase:** 2 · **Cycle:** 1 · **Mode:** lite · **Date:** 2026-09-27 · **Owner:** Mario Miletta (albero, scelta e metrica scritti dal modello per delega)

## Stato della fase 1, detto prima di tutto

Il verdetto della fase 1 è IN SOSPESO, né confermato né ucciso né rimodellato. Il gate 1 è passato solo per deroga di Mario (fallite 1.1, 1.2, 1.3) `[doc:user-2026-09-27-deroga-gate-1]`. Questo albero poggia su 23 fonti pubbliche estratte dal web, tutte `doc`, nessuna intervista e nessuna persona dell'ICP `[doc:user-2026-09-26-delega]`. Ogni ordinamento qui sotto va letto così: indica dove guardare nelle interviste dal 2 al 9 ottobre, non cosa è vero per i PM italiani. La fase 7 decide sulle interviste, come dice la deroga.

La demo dal vivo di PHC26 del 1 ottobre è un vincolo di consegna, non un'evidenza `[doc:user-2026-09-26-init]`. Ha deciso in quale ramo cercare (domande sui feedback già in Voce) e la data. Non alza la fiducia in nessuna opportunità.

## Desired outcome

I PM che hanno già i loro feedback in Voce tornano a interrogarli quando preparano decisioni diverse, e ricevono risposte che citano testo verificato dei loro clienti. Misura: la metrica di successo sotto.

## Opportunity tree

| Opportunity | Evidence | Reach | Severity | Frequency | Score |
|-------------|----------|-------|----------|-----------|-------|
| O1. Rileggere tutti i feedback prima della pianificazione costa ore o giorni, quindi la sintesi si fa di rado o si salta | `[doc:mined-reddit-confusedus]` `[doc:mined-reddit-kitchen-ad-4367]` `[doc:mined-reddit-poodleface]` `[doc:mined-capterra-canny-senior-pm]` `[doc:mined-capterra-canny-katherine-l]` `[doc:mined-reddit-rupicolus]` | 6 fonti su 23 `[estimate:conteggio-fonti-estratte]`; quota dell'ICP ignota `[assumption:unvalidated]` | Alta: "a couple hours a day for a week or so" a trimestre `[doc:mined-reddit-confusedus]`, "a full day just rereading" per 22 interviste `[doc:mined-reddit-kitchen-ad-4367]` | Bassa: a trimestre o a progetto `[doc:mined-reddit-confusedus]` | 1ª (evidenza più ampia) |
| O2. Quando prepara una decisione o scrive una specifica su un argomento preciso, il PM non ritrova in tempo utile quanti clienti ne hanno parlato e con quali parole, e decide sul ricordo di 2-3 conversazioni | `[doc:mined-reddit-frustrated-pm26]` `[doc:mined-reddit-ashleygibsonpm]` `[doc:mined-capterra-productboard-simon-h]` `[doc:mined-reddit-dada-man]` | 4 fonti su 23 `[estimate:conteggio-fonti-estratte]`; quota dell'ICP ignota `[assumption:unvalidated]` | Media-alta: la specifica si scrive su "2-3 conversations that stuck with them" mentre il problema più frequente resta nei ticket `[doc:mined-reddit-frustrated-pm26]`; "very hard to [...] see how many people asked for the same thing" `[doc:mined-reddit-ashleygibsonpm]` | Media: a ogni specifica o decisione; quante al mese non è noto `[assumption:unvalidated]` | 2ª |
| O3. La sintesi fatta con un assistente generico sbaglia categorie o inventa citazioni, e il PM non può portarla a chi decide senza ricontrollarla a mano | `[doc:mined-lenny-caitlin-sullivan]` `[doc:mined-reddit-thibaultzim]` `[doc:mined-reddit-cheese-bro]` `[doc:mined-reddit-contralle]` | 4 fonti su 23 `[estimate:conteggio-fonti-estratte]` | Alta quando succede: circa il 90% dei commenti etichettati male secondo l'autore `[doc:mined-reddit-thibaultzim]`; errori "invisible until a stakeholder asks a question you can't answer" `[doc:mined-lenny-caitlin-sullivan]` | A ogni uso dell'assistente; non misurata `[assumption:unvalidated]` | 3ª |
| O4. Le richieste arrivano senza caso d'uso né segmento del cliente, quindi il PM non riesce a pesarle né a verificarle | `[doc:mined-reddit-just-competition9002]` `[doc:mined-reddit-meknoid333]` | 2 fonti su 23 `[estimate:conteggio-fonti-estratte]` | Media: la richiesta non si verifica senza un incontro col cliente `[doc:mined-reddit-just-competition9002]` | Non nota `[assumption:unvalidated]` | 4ª |
| O5. Dove decide il CEO, il PM non ha modo di far pesare i bisogni dei clienti | `[doc:mined-reddit-trowaman]` | 1 fonte su 23 `[estimate:conteggio-fonti-estratte]` | Alta per chi la vive: le prove "doesn't work" `[doc:mined-reddit-trowaman]` | Non nota `[assumption:unvalidated]` | 5ª (confine del segmento) |

```
Risultato: i PM con feedback in Voce tornano a interrogarli per decisioni diverse
├── O1  sintesi periodica troppo costosa             6 fonti
├── O2  "cosa dicono i clienti su questo argomento"   4 fonti
│   ├── O2a mentre prepara una specifica o una pianificazione   3 fonti (frustrated-pm26, ashleygibsonpm, simon-h)
│   └── O2b domanda arrivata dal vivo in riunione (il frame)    0 fonti dirette; dada-man è vicino ma il feedback non esisteva
├── O3  output dell'AI generica non affidabile       4 fonti
├── O4  richieste senza contesto del cliente         2 fonti
└── O5  le prove non pesano dove decide il CEO       1 fonte
```

**Il sotto-ramo si divide perché l'evidenza si divide.** Il frame ha scelto O2b, la domanda arrivata in riunione. Nessuna delle 23 fonti la racconta `[doc:mined-reddit-frustrated-pm26]`. Le fonti parlano di O2a: il momento in cui si scrive una specifica o si prepara la pianificazione.

**Mutua esclusione.** O1 riguarda tutto il corpus ("cosa emerge di più"), O2 un argomento scelto dal PM ("cosa dicono di X"). Il brief di Voce copre la prima domanda con i temi, non la seconda `[doc:voce-brief]`. O3 è la fiducia nel risultato, qualunque sia la domanda. O4 è il contesto che manca al feedback stesso. O5 è il potere di decidere.

**Il concorrente di oggi, per ogni ramo.** Claude collegato a Slack, Intercom e Amplitude fa sintesi "directional" in minuti su volumi bassi `[doc:mined-reddit-praying4exitz]`. NotebookLM o Claude sulle interviste "saved me hours" `[doc:mined-reddit-constantkooky3329]` `[doc:mined-reddit-patientcauliflower84]`. Un Project di ChatGPT diventa un archivio interrogabile `[doc:mined-lenny-amir-klein]`. Senza AI, etichettare all'ingresso lascia "examples and counts ready" per le specifiche `[doc:mined-reddit-armok3290]`. Per alcuni i temi ricorrenti bastano `[doc:mined-reddit-darcswan]`. Tutte queste fonti abbassano la severità di O1 e O2.

**Candidati scartati prima dell'albero.** "Raccogliere i feedback in un unico posto" come opportunità a sé: Voce lo fa già, e la fonte più vicina dice "Its not a collection problem" `[doc:mined-reddit-frustrated-pm26]`; la frase di rupicolus sui trend è finita in O1. "Rispondere in pochi secondi durante la riunione" come opportunità di primo livello: nessuna fonte, resta O2b.

**L'ordinamento ordina, non decide.** I conteggi sono fonti web, non persone dell'ICP. O2 e O3 hanno lo stesso numero di fonti, e la differenza tra O1 e O2 sta nel rumore. La scelta sotto usa la strategia, non la classifica.

## Selected: O2, il PM che prepara una decisione non ritrova cosa hanno detto i clienti su quell'argomento e decide sul ricordo

Deciso dal modello per delega di Mario (2026-09-27) `[doc:user-2026-09-26-delega]`.

**Why:**

- **Forza dell'evidenza.** Quattro fonti `doc`, nessuna dall'ICP, una sola con un episodio in prima persona `[doc:mined-reddit-dada-man]`. È debole. È la seconda per ampiezza, e la prima tra quelle che Voce non copre già.
- **Perché non O1, detto onestamente.** Se si scegliesse solo sull'evidenza, O1 sarebbe in testa. Ma O1 è già il cuore di Voce: l'analisi in temi esiste `[code:src/lib/analysis.ts]` ed è misurata dal North Star `[doc:voce-brief]`. Sceglierla ora vorrebbe dire "nessuna funzione nuova: mettere Voce in produzione e intervistare". È una raccomandazione legittima, e resta vera per la parte di questa iniziativa che conta di più (le interviste). Non la scelgo perché senza un solo utente non si sa dove i temi non bastano, e quindi non c'è niente di preciso da migliorare in O1.
- **Coerenza strategica.** O2 lavora sui feedback che il PM ha già messo in Voce e mantiene la promessa del brief, "con le parole dei clienti" `[doc:voce-brief]`. Non porta Voce nel mercato dei repository di ricerca (Dovetail) né delle integrazioni, che sono non-goal `[doc:user-2026-09-26-init]`.
- **Coerenza con lo stadio pre-PMF.** Approfondisce il valore per lo stesso segmento stretto. Non è un'opportunità di acquisizione. Dettaglio sotto.
- **Reversibilità.** Una superficie di domanda separata dai temi si toglie senza toccare raccolta e analisi `[assumption:unvalidated]`. È un vincolo da portare in fase 3, non un fatto già vero.

**Cosa cambia rispetto alla richiesta.** La richiesta è "domanda libera, risposta con citazioni" `[doc:user-2026-09-26-richiesta]`. L'evidenza sposta il momento d'uso: preparare una decisione o una specifica (O2a), non rispondere in riunione in pochi secondi (O2b). Conseguenza per la fase 3: conta di più una risposta con conteggio e citazioni da incollare in un documento che la velocità della risposta. O2b resta un'ipotesi da verificare nelle interviste, sezione 2 della guida.

**O3 entra come vincolo, non come opportunità scelta.** Ogni risposta deve citare solo testo presente nei feedback, come fa già l'analisi, che scarta le citazioni non trovate carattere per carattere `[code:src/lib/analysis.ts:183]`. Senza questo vincolo O2 ripete il difetto che le fonti attribuiscono agli assistenti generici `[doc:mined-lenny-caitlin-sullivan]`.

**Prova di resistenza: quale opportunità sceglierebbe un concorrente, e perché qui non vale.** Enterpret e Dovetail hanno già scelto O2, con chat e citazioni ai feedback originali `[doc:priorart-enterpret]` `[doc:priorart-dovetail]`, per clienti enterprise. L'assistente generico collegato alle fonti copre O1 e parte di O2 per chi ha volumi bassi `[doc:mined-reddit-praying4exitz]`. L'argomento per Voce è che i feedback sono già dentro, senza connettori né esportazioni, e che le citazioni sono verificate sul testo `[code:src/lib/analysis.ts:183]`. Che questo basti a preferire Voce a Claude con i connettori è un'ipotesi `[assumption:unvalidated]`. È esattamente la credenza 3 del frame, e le interviste la mettono alla prova.

## Rejected

| Opportunity | Why not now | Revisit when |
|-------------|------------|--------------|
| O1. Sintesi periodica troppo costosa | È già il lavoro dei temi di Voce e la misura del North Star; senza utenti non si sa dove i temi falliscono, quindi non c'è un intervento preciso da scegliere | Quando almeno 3 intervistati o i primi 20 workspace attivati mostrano un punto preciso in cui i temi non bastano per la pianificazione |
| O3. Output dell'AI generica non affidabile | Non è un bisogno a sé ma una condizione di ogni risposta generata; entra come vincolo della scelta (solo citazioni verificate) | Se la maggioranza degli intervistati dice che il blocco è la fiducia nella risposta, non ritrovare i feedback |
| O4. Richieste senza contesto del cliente | 2 fonti; il blocco descritto è l'accesso al cliente e il dettaglio del caso d'uso, non la ricerca nei feedback già raccolti `[doc:mined-reddit-just-competition9002]` | Se almeno 2 intervistati dicono che una risposta senza segmento del cliente è inutile, come obietta `[doc:mined-reddit-meknoid333]` |
| O5. Le prove non pesano dove decide il CEO | È un confine del segmento: nessuna funzione di Voce cambia chi decide | Non come opportunità; resta criterio della classe 4 delle interviste ("sembra ICP ma non ha il problema") |

## PMF coherence

**Signal score:** 0/8, con 0 segnali misurabili su 4 `[doc:user-2026-09-26-init]` · **Stage:** pre-PMF · **Opportunity type:** approfondire il valore per il segmento stretto · **Coherent:** sì, con una riserva scritta

Lettura dei quattro segnali, tutti **non disponibili**: Voce ha zero utenti e non è in produzione `[doc:user-2026-09-26-init]`. Nessun sondaggio "how disappointed", nessuna curva di retention, nessuna misura di trazione organica, nessun utente che la chiami insostituibile. Lo 0 non è un voto negativo: è l'assenza di misure. Lo stadio pre-PMF è quello dichiarato in PRODUCT.md.

Perché è coerente: O2 non cerca nuovi utenti. Si rivolge allo stesso PM dell'ICP primario, sui feedback che ha già caricato, e la metrica misura il ritorno di chi è già attivato, non le registrazioni. La demo di PHC26 porta registrazioni, ma è distribuzione del prodotto, non l'opportunità scelta, e le registrazioni non entrano nella metrica.

La riserva: a pre-PMF il quadro di riferimento dice di smettere di costruire funzioni e parlare con gli utenti. Questa funzione si costruisce lo stesso per la deroga di Mario `[doc:user-2026-09-27-deroga-gate-1]`. Il "parlare con gli utenti" è fissato: 6-8 interviste dal 2 al 9 ottobre, con regola di decisione scritta prima `[doc:user-2026-09-26-delega]`. Se quelle interviste chiudono la credenza, la funzione si toglie anche se la metrica sotto è buona.

## Success metric

**Metric:** quota di workspace che completano la prima analisi AI tra il 2026-10-01 e il 2026-10-17 e che, entro 14 giorni dalla prima analisi, ricevono da "Chiedi ai tuoi feedback" una risposta con almeno una citazione verificata in almeno 2 giorni di calendario distinti. `[doc:user-2026-09-26-delega]`

Scelte della definizione, decise dal modello per delega di Mario (2026-09-27) `[doc:user-2026-09-26-delega]`:
- **Denominatore = workspace attivati**, non registrati: la funzione ha senso solo con feedback in Voce (credenza 6 del frame, piano Free fermo a 100 feedback `[doc:voce-brief]`).
- **Due giorni distinti**, non una domanda: la prima domanda dopo la demo è curiosità; tornare un altro giorno è il segnale di O2, una seconda decisione da preparare.
- **Almeno una citazione verificata**: una risposta senza prove non risolve O2 e ripete O3.
- **14 giorni**: abbastanza per una seconda occasione di decisione in un team piccolo, abbastanza corto da leggere il numero prima della fase 7. `[doc:user-2026-09-26-delega]`

**Baseline:** 0, funzione non costruita e Voce non in produzione: oggi non esiste nessun evento di domanda `[code:src/lib/analytics.ts]`; prima misurazione dal 2026-10-01, giorno della demo PHC26 con Voce in produzione e `POSTHOG_KEY` configurata.

**Target:** 25% entro il 2026-10-31, letto solo se il denominatore conta almeno 20 workspace. Ragionamento: il benchmark Userpilot su 547 aziende SaaS mette l'adozione media delle funzioni principali al 24,5%, definita come quota di utenti che le usano "habitually" `[doc:bench-userpilot-core-feature-adoption]`. Il paragone è imperfetto e va detto: il benchmark misura funzioni principali di prodotti maturi e paganti, qui si misura una funzione opzionale e nuova su utenti arrivati da una demo. Una forza spinge in su (il denominatore è già selezionato: solo workspace attivati), tre in giù (funzione opzionale, funzione nuova, soglia di due giorni). Che si compensino non è calcolato: il 25% è un'ancora presa dal paragone più vicino trovato, scelta perché cadere molto sotto la media di settore sarebbe un segnale leggibile anche con pochi workspace, non perché derivata. Sotto 20 workspace un singolo workspace vale più di 5 punti percentuali `[estimate:1-su-20]`: il numero non si legge e la fase 7 decide solo sulle interviste, come dice la deroga. Soglia di 20 decisa dal modello per delega di Mario (2026-09-27) `[doc:user-2026-09-26-delega]`.

**Measured by:** PostHog UE, eventi solo dal server. Serve un evento nuovo, requisito della fase 4:

- `question_answered`, inviato **a ogni** risposta completata, con `distinct_id` = id del workspace e sole proprietà `citation_count` (intero, citazioni verificate) e `outcome` (`answered` o `no_evidence`). Mai il testo della domanda né della risposta: vincolo di PRODUCT.md `[code:AGENTS.md]`.
- Oggi `trackMilestone` manda ogni evento una sola volta per workspace, tramite la tabella `analytics_milestones` e il suo vincolo sui nomi `[code:supabase/migrations/20260925180000_analytics_milestones.sql]`. Un evento che si ripete ha bisogno di un invio senza quel passaggio, stesse regole di privacy `[code:src/lib/analytics.ts]`, e va documentato in `docs/analytics.md`.
- Evento esistente usato come ingresso: `first_analysis_completed` `[code:docs/analytics.md]`.

Query HogQL da eseguire il 2026-10-31:

```sql
with activated as (
  select distinct_id as ws, min(timestamp) as t0
  from events
  where event = 'first_analysis_completed'
    and timestamp >= '2026-10-01' and timestamp < '2026-10-18'
  group by ws
),
asked as (
  select e.distinct_id as ws, count(distinct toDate(e.timestamp)) as days
  from events e
  join activated a on e.distinct_id = a.ws
  where e.event = 'question_answered'
    and toInt(e.properties.citation_count) >= 1
    and e.timestamp >= a.t0 and e.timestamp < a.t0 + interval 14 day
  group by ws
)
select count() as workspace_attivati,
       countIf(asked.days >= 2) as tornati_a_chiedere,
       round(100 * tornati_a_chiedere / workspace_attivati, 1) as quota
from activated
left join asked on activated.ws = asked.ws
```

**Guardrail (non target):** quota di `question_answered` con `outcome = no_evidence` nello stesso periodo, perché una risposta onesta "non trovo prove" è corretta ma se domina la funzione non serve; e il North Star di attivazione letto sullo stesso periodo, perché la domanda non deve sostituire la prima analisi.

**Connects to North Star:** il North Star è la quota di nuovi workspace che eseguono la prima analisi AI entro 24 ore dalla registrazione `[doc:voce-brief]`. Questa metrica sta subito sotto: il suo denominatore è la popolazione che il North Star conta, e misura se chi si è attivato torna. Il North Star non copre il ritorno. È un indicatore d'ingresso della retention, che oggi Voce non misura. Il North Star non cambia.

## Decisioni prese per delega

Tutte "Deciso dal modello per delega di Mario (2026-09-27)" `[doc:user-2026-09-26-delega]`, da rivedere da lui:

1. Selezione di O2, con O1 scartata perché già coperta dal prodotto, non perché più debole.
2. Momento d'uso spostato dalla riunione (O2b, zero fonti) alla preparazione di una decisione (O2a).
3. O3 trasformata in vincolo della scelta: solo citazioni verificate sul testo.
4. Metrica: denominatore sui workspace attivati, due giorni distinti, finestra di 14 giorni, coorte dal 2026-10-01 al 2026-10-17. `[doc:user-2026-09-26-delega]`
5. Target 25% con soglia minima di 20 workspace; sotto soglia decide solo la fase 7 sulle interviste. `[doc:user-2026-09-26-delega]`
6. Nuovo evento ripetibile `question_answered` senza testo, come requisito della fase 4.

## DEFINITION COMPLETE

**Selected:** O2, il PM che prepara una decisione non ritrova cosa hanno detto i clienti su quell'argomento · **Rejected:** 4 (O1, O3, O4, O5) · **Metric:** quota di workspace attivati tra il 2026-10-01 e il 2026-10-17 che ricevono risposte con citazioni verificate in almeno 2 giorni distinti entro 14 giorni · **Baseline:** 0, prima misurazione 2026-10-01 · **Target:** 25% entro il 2026-10-31, con almeno 20 workspace · **PMF coherence:** pre-PMF, approfondimento del valore per il segmento stretto, coerente con riserva · **Gate 2:** PASS il 2026-09-27 (E.1, 2.1, 2.2, 2.3, 2.4 decise dallo script; 2.5 giudicata PASS dal modello e da un revisore indipendente). Metrica e target decisi per delega `[doc:user-2026-09-26-delega]`, baseline `[code:src/lib/analytics.ts]`
