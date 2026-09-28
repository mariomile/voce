# Definition: Voce, Research e customer discovery

**Phase:** 2 · **Cycle:** 1 · **Mode:** lite · **Date:** 2026-09-28 · **Owner:** Mario Miletta (albero, scelta e metrica scritti dal modello per delega)

## Stato della fase 1, detto prima di tutto

La fase 1 è passata solo per deroga firmata da Mario: il gate 1 ha fallito le condizioni 1.1, 1.2 e 1.3, e il verdetto resta IN SOSPESO fino alle interviste di ottobre `[doc:user-2026-09-28-deroga-gate-1-research]`. La motivazione di Mario, verbatim: "Procedo alla fase 2 senza interviste perché la Research si costruisce comunque: è una scelta mia. Il verdetto resta IN SOSPESO fino alle 6 interviste di ottobre, e se la regola di decisione dà KILLED o RESHAPED si torna indietro." `[doc:user-2026-09-28-deroga-gate-1-research]`

Cosa vuol dire per questo documento:

- L'albero poggia su 46 fonti pubbliche estratte dal web, tutte `doc`, nessuna intervista, una sola fonte primaria dall'ICP e con riserva `[doc:mined-indiehackers-james-paden]`. Ogni ordinamento qui sotto indica dove guardare nelle interviste dal 6 al 16 ottobre, non cosa è vero per i PM senza ricercatore.
- La regola di decisione della fase 1, fissata prima delle interviste, resta sovraordinata a tutto ciò che segue: se dà KILLED o RESHAPED, questa scelta si rifà `[doc:user-2026-09-28-deroga-gate-1-research]`.
- La deroga porta un'istruzione per la fase 3: tenere sul tavolo due opzioni distinte, la Research guidata da ipotesi (domanda, ipotesi, verdetto) e la Research come domanda aperta o discovery continua (domanda e temi nel tempo, senza ipotesi) `[doc:user-2026-09-28-deroga-gate-1-research]`. Questo albero è costruito apposta per non chiudere quella scelta.
- Nulla va in produzione prima della masterclass del 1 ottobre 2026: la demo usa il flusso attuale `[doc:user-2026-09-28-research-round1]`. La demo non è evidenza e non entra nella metrica.

## Desired outcome

Il PM senza ricercatore che ha raccolto le voci dei clienti su una domanda arriva a una sintesi di tutte quelle voci, con citazioni verificate, invece di fermarsi prima e chiudere sul ricordo. Misura: la metrica di successo sotto.

## Opportunity tree

| Opportunity | Evidence | Reach | Severity | Frequency | Score |
|-------------|----------|-------|----------|-----------|-------|
| O1. Dopo aver sentito i clienti, il confronto di tutte le voci raccolte con ciò che il PM voleva sapere salta o si fa a metà perché costa ore o giorni, e la decisione si chiude sulle due o tre conversazioni ricordate | `[doc:mined-reddit-waste-mastodon2646]` `[doc:mined-reddit-solid-aardvark-4590]` `[doc:mined-reddit-frustrated-pm26]` `[doc:mined-reddit-cold-hall-5384]` `[doc:mined-substack-else-van-der-berg]` `[doc:mined-reddit-ttorres]` | 6 fonti su 46 sul costo, più 7 sulla forma di partenza (sotto-rami) `[estimate:conteggio-fonti-estratte]`; quota dell'ICP ignota `[assumption:unvalidated]` | Alta: "takes hours. That's where most PMs give up and just go with their gut anyway" `[doc:mined-reddit-waste-mastodon2646]`; "In practice, I just start over" su 50 trascrizioni `[doc:mined-substack-else-van-der-berg]` | A ogni giro di discovery; quanti giri al mese non è noto `[assumption:unvalidated]` | 1ª a pari merito per fonti; la più sostenuta secondo il verdetto di fase 1 |
| O2. La sintesi fatta con l'assistente generico contiene citazioni sbagliate o conclusioni di cui il PM non si fida, quindi va ricontrollata a mano prima di portarla a qualcuno | `[doc:mined-producttalk-teresa-torres-ai-synthesis]` `[doc:mined-substack-else-van-der-berg]` `[doc:mined-reddit-similarities]` `[doc:mined-reddit-thibaultzim]` `[doc:mined-reddit-khanhhuy]` `[doc:mined-substack-valerie-ehrlich]` | 6 fonti su 46 `[estimate:conteggio-fonti-estratte]`, contro 5 che si fidano `[doc:mined-reddit-praying4exitz]` `[doc:mined-reddit-constantkooky3329]` | Alta quando succede: "About 30% of the direct quotes [...] weren't in the source material at all" `[doc:mined-producttalk-teresa-torres-ai-synthesis]` | A ogni uso dell'assistente; non misurata `[assumption:unvalidated]` | 1ª a pari merito per fonti, ma la più contestata |
| O3. Quando capo o colleghi chiedono "su quali prove?", il PM non ha le voci contate da mostrare per difendere una decisione già intuita | `[doc:mined-reddit-aikhuda]` `[doc:mined-reddit-georgeharter]` `[doc:mined-reddit-dada-man]` | 3 fonti su 46 `[estimate:conteggio-fonti-estratte]` | Media-alta: "thousands of support tickets" etichettati a mano per una metrica da mostrare `[doc:mined-reddit-aikhuda]` | A ogni decisione contestata; non nota `[assumption:unvalidated]` | 3ª |
| O4. Il PM non riesce a trovare o raggiungere i clienti da sentire, quindi le voci da confrontare non arrivano | `[doc:mined-substack-productpill]` `[doc:mined-reddit-just-competition9002]` | 2 fonti su 46 `[estimate:conteggio-fonti-estratte]` | Media: il reclutamento è "mostly a volume game" `[doc:mined-substack-productpill]` | A ogni giro; non nota `[assumption:unvalidated]` | 4ª |
| O5. Dove decide il CEO o il founder, le voci dei clienti non pesano sulla decisione | `[doc:mined-reddit-trowaman]` | 1 fonte su 46 `[estimate:conteggio-fonti-estratte]` | Alta per chi la vive: "That crap doesn't work" `[doc:mined-reddit-trowaman]` | Non nota `[assumption:unvalidated]` | 5ª (confine del segmento) |

```
Risultato: il PM che ha raccolto le voci arriva alla sintesi di tutte, con citazioni verificate
├── O1  confronto di tutte le voci saltato per tempo, decisione sul ricordo      6 fonti sul costo
│   ├── O1a si parte da un'ipotesi da confermare o smentire                      3 fonti, la più fragile
│   └── O1b si parte da una domanda aperta, o la domanda cambia nel tempo        4 fonti + 1 prodotto
├── O2  sintesi dell'assistente generico non affidabile                          6 fonti, 5 contro
├── O3  niente prove da mostrare quando chiedono "su quali prove?"               3 fonti
├── O4  i clienti da sentire non si trovano                                      2 fonti
└── O5  le voci non pesano dove decide il CEO                                    1 fonte
```

**O1 si divide perché l'evidenza si divide, ed è qui che l'ipotesi si rivela fragile.**

- **O1a, partenza da un'ipotesi.** Tre fonti: un founder-PM con "a list of assumptions" da "validate or invalidate" `[doc:mined-indiehackers-james-paden]`, un founder che scrive "I'm still validating it" `[doc:mined-reddit-chance-back4949]`, un APM per cui ogni decisione è "an educated guess (hypothesis) at best" `[doc:mined-substack-productpill]`. Una sola racconta un giro concluso, e quel founder ha lasciato il confronto sistematico per scelta di metodo, non per tempo `[doc:mined-indiehackers-james-paden]`. Nessuna fonte racconta l'episodio intero della credenza rischiosa.
- **O1b, domanda aperta o discovery continua.** Quattro fonti e un prodotto: ICP e domande che cambiano di continuo, con il materiale da rileggere da capo `[doc:mined-substack-else-van-der-berg]`; revisione trimestrale a temi senza ipotesi `[doc:mined-reddit-confusedus]`; richieste scartate finché non diventano "a recurring theme" `[doc:mined-reddit-darcswan]`; l'invito a sintetizzare ogni intervista subito, dentro un albero delle opportunità `[doc:mined-reddit-ttorres]`; il prodotto più vicino per pubblico e prezzo è costruito così `[doc:priorart-vistaly]`.

Il costo di O1 (tempo, sintesi saltata) è lo stesso nei due sotto-rami: cambia solo da cosa si parte. Per questo la scelta sotto prende O1 intera e lascia O1a contro O1b alla fase 3 e alle interviste, dove la regola di decisione già distingue "domanda nominata" da "ipotesi nominata" (RESHAPED se c'è la domanda ma non l'ipotesi) `[doc:user-2026-09-28-deroga-gate-1-research]`.

**Mutua esclusione.** O1 è il costo del confronto quando le voci ci sono. O2 è la fiducia nel risultato di uno strumento, qualunque sia il confronto. O3 è il bisogno di argomentare una decisione già presa: le fonti cercano prove da mostrare, non una scoperta `[doc:mined-reddit-georgeharter]`. O4 sta prima della raccolta. O5 sta dopo la sintesi, nel potere di decidere.

**Evidenza contraria a O1, detta per intero.** Claude collegato a Slack, Intercom e Amplitude dà una "directional synthesis" in minuti `[doc:mined-reddit-praying4exitz]`; Claude Code rilegge 50 trascrizioni per segmento "in minutes instead of re-reading for days" `[doc:mined-substack-else-van-der-berg]`; un PM senza ricercatore usa l'AI sul feedback senza lamentele `[doc:mined-reddit-governmentbroad2054]`. Nessuna di queste fonti dice di aver confrontato le voci con una domanda o un'ipotesi di partenza, ma abbassano la severità di O1 per chi usa già l'assistente generico. Due fonti sul costo non sono neutrali: una stima "2-3 days" ed è scritta da chi costruisce uno strumento concorrente `[doc:mined-reddit-solid-aardvark-4590]`.

**Candidati scartati prima dell'albero.** "Le voci arrivano da registrazioni di call che Voce non trascrive": è la credenza 6 del frame, senza nessuna fonte di fase 1, e la trascrizione è un non-goal `[doc:user-2026-09-28-research-round1]`. "Il feedback raccolto è di scarsa qualità": una sola opinione senza episodio, dello stesso commentatore che dice che l'AI "can absolutely distill these problems" `[doc:mined-reddit-freekiltman]`; troppo poco per un ramo.

**L'ordinamento ordina, non decide.** O1 e O2 hanno lo stesso numero di fonti, e i conteggi sono pagine web, non persone dell'ICP. La scelta sotto usa la strategia, non la classifica.

## Selected: O1, il confronto di tutte le voci raccolte con ciò che il PM voleva sapere salta per tempo, e la decisione si chiude sul ricordo

Deciso dal modello per delega di Mario (2026-09-28) `[doc:user-2026-09-28-research-round1]`.

**Why:**

- **Forza dell'evidenza.** Sei fonti `doc` sul costo, nessuna dall'ICP verificato; due con un episodio in prima persona `[doc:mined-substack-else-van-der-berg]` `[doc:mined-reddit-cold-hall-5384]`, le altre sono opinioni o pratiche. È debole, ma il verdetto di fase 1 (01-discovery.md, Verdict) indica il confronto che salta per tempo come la parte più sostenuta `[doc:mined-reddit-waste-mastodon2646]` e l'ipotesi nominabile come la più fragile `[doc:mined-substack-else-van-der-berg]` `[doc:priorart-vistaly]`.
- **Perché non O2, detto onestamente.** Sulle sole fonti O2 pareggia con O1 e ha più episodi in prima persona. Non la scelgo perché è la più contestata (5 fonti si fidano dell'assistente generico `[doc:mined-reddit-constantkooky3329]`) e perché è una condizione di ogni sintesi generata, non un bisogno a sé: entra come vincolo. Voce scarta già ogni citazione che non compare nel feedback carattere per carattere `[code:src/lib/analysis.ts:215]`, e la fiducia si divide proprio tra recupero delle voci (sì) e conclusione (no) `[doc:mined-substack-else-van-der-berg]`.
- **Coerenza strategica.** O1 è il costo che il nuovo scopo di Voce promette di togliere: "raccogli le voci dei clienti, ottieni una sintesi con le prove" `[doc:user-2026-09-28-research-round1]`. Non porta Voce nel reclutamento, nelle interviste o nella trascrizione, che sono non-goal `[doc:user-2026-09-28-research-round1]`.
- **Coerenza con lo stadio pre-PMF.** Approfondisce il valore per l'ICP primario, non cerca nuovi segmenti. Dettaglio sotto.
- **Reversibilità.** Scegliere O1 intera, e non O1a, è la scelta che conserva più opzioni: l'ipotesi con verdetto e la domanda aperta servono entrambe O1, e la fase 3 può tenerle entrambe o toglierne una dopo le interviste senza riscrivere questa fase `[assumption:unvalidated]`.

**Cosa cambia rispetto alla richiesta.** La richiesta definisce la Research con ipotesi e verdetto per ipotesi `[doc:user-2026-09-28-research-round1]`. L'evidenza sostiene il costo (il confronto salta) molto più della forma (partire da un'ipotesi). L'opportunità scelta è quindi scritta su "ciò che il PM voleva sapere", domanda o ipotesi, e la metrica sotto misura la sintesi qualunque sia la forma. Per la fase 3 restano aperte, con peso onesto:

1. **Research guidata da ipotesi** (domanda, ipotesi, verdetto confermata / smentita / da rivedere con citazioni): è la richiesta di Mario, serve O1a, poggia sulla credenza più fragile.
2. **Research come domanda aperta o discovery continua** (domanda e temi che si aggiornano quando arrivano voci nuove, senza ipotesi): serve O1b, ha più fonti e un prodotto concorrente già costruito così `[doc:priorart-vistaly]`.

**O2 e O3 entrano come vincoli, non come opportunità scelte.** Ogni sintesi cita solo testo presente nelle voci (O2). Ogni sintesi mostra quante voci la sostengono e con quali parole, in una forma da portare a chi chiede "su quali prove?" (O3) `[doc:mined-reddit-georgeharter]`.

**Prova di resistenza: quale opportunità sceglierebbe un concorrente, e perché qui non vale.** Vistaly ha scelto O1b per il PM in discovery continua, 25 $ per utente al mese, con uno stato sulle card e senza verdetto `[doc:priorart-vistaly]`. Dovetail e Condens hanno scelto O1 per team di ricerca, con prezzi e acquirenti da research ops `[doc:priorart-dovetail]` `[doc:priorart-condens]`. NotebookLM copre gratis il recupero delle voci con citazioni, senza domanda né ipotesi come oggetto `[doc:priorart-notebooklm]`. L'argomento per Voce è raccolta dedicata e sintesi con citazioni verificate nello stesso posto, per chi non ha un ricercatore. Che basti a preferire Voce a NotebookLM o a Claude è la credenza 4 del frame, non provata `[assumption:unvalidated]`: le interviste la mettono alla prova con la domanda 3.1-3.2 della guida.

## Rejected

| Opportunity | Why not now | Revisit when |
|-------------|------------|--------------|
| O2. Sintesi dell'assistente generico non affidabile | Pareggia O1 per fonti ma è la più contestata (5 fonti si fidano) e non è un bisogno a sé: è una condizione di ogni sintesi generata, quindi entra come vincolo (solo citazioni verificate sul testo) `[code:src/lib/analysis.ts:215]` | Se la maggioranza degli intervistati di ottobre dice che il blocco è la fiducia nel risultato dell'assistente, non il tempo del confronto |
| O3. Niente prove da mostrare quando chiedono "su quali prove?" | 3 fonti; descrive un uso della sintesi (difendere una decisione già intuita), non un costo diverso dal confronto; entra come vincolo sulla forma dell'output `[doc:mined-reddit-aikhuda]` | Se almeno 3 intervistati raccontano che la decisione era già presa e le voci servivano solo a difenderla (Surprise 2 della fase 1) |
| O4. I clienti da sentire non si trovano | Sta prima della raccolta, e il reclutamento è un non-goal deciso da Mario `[doc:user-2026-09-28-research-round1]` | Se la regola di decisione dà RESHAPED verso "il collo di bottiglia è trovare le persone" |
| O5. Le voci non pesano dove decide il CEO | Confine del segmento: nessuna funzione di Voce cambia chi decide `[doc:mined-reddit-trowaman]` | Non come opportunità; resta criterio della classe 4 delle interviste |

## PMF coherence

**Signal score:** 0/8, con 0 segnali misurati su 4 `[doc:user-2026-09-26-init]` · **Stage:** pre-PMF · **Opportunity type:** approfondire il valore per il segmento stretto · **Coherent:** sì, con una riserva scritta

I quattro segnali sono tutti **non disponibili**: Voce ha zero utenti ed è pre-PMF per dichiarazione di Mario `[doc:user-2026-09-26-init]`, e la Research non esiste nel prodotto `[code:src/lib/analytics.ts]`. Nessun sondaggio "very disappointed", nessuna curva di retention, nessuna misura di trazione organica, nessun utente che chiami Voce insostituibile. Lo 0 è assenza di misure, non un voto.

Perché è coerente: O1 non è un'opportunità di acquisizione né di espansione. Riguarda lo stesso PM dell'ICP primario, nel momento in cui ha già raccolto le voci, e la metrica conta chi arriva alla sintesi, non chi si registra. Il riposizionamento verso le grandi aziende indicato da Mario ("Anche per grandi aziende") `[doc:user-2026-09-28-research-round1]` è un rischio di allargamento a pre-PMF: qui non entra, perché il primario resta il PM senza ricercatore e il secondario con research ops non ha opportunità nell'albero.

La riserva: a pre-PMF il quadro di riferimento dice di smettere di costruire funzioni e parlare con gli utenti. La Research si costruisce lo stesso per scelta di Mario `[doc:user-2026-09-28-deroga-gate-1-research]`. Il "parlare con gli utenti" è fissato con date: 6-8 interviste dal 6 al 16 ottobre, verdetto entro il 20 ottobre, regola scritta prima. Se dà KILLED o RESHAPED si torna indietro anche se la metrica sotto è buona `[doc:user-2026-09-28-deroga-gate-1-research]`.

## Success metric

**Metric:** quota di workspace la cui prima Research raggiunge 5 voci raccolte tra il 2026-10-05 e il 2026-10-25 e che, entro 14 giorni da quel momento, completano una sintesi di una Research con almeno 5 voci e almeno una citazione verificata. Unità: il workspace. Definizione decisa dal modello per delega di Mario (2026-09-28) `[doc:user-2026-09-28-research-round1]`

Scelte della definizione, tutte "Deciso dal modello per delega di Mario (2026-09-28)" `[doc:user-2026-09-28-research-round1]`:

- **Denominatore = chi ha già raccolto almeno 5 voci**, non chi crea una Research. O1 riguarda il momento in cui le voci ci sono e il confronto salta; chi non raccoglie voci è O4, fuori scelta. Sotto 5 voci il confronto si fa a memoria senza costo, quindi non misura O1.
- **Sintesi con almeno una citazione verificata:** una sintesi senza prove non risolve O1 e ripete O2.
- **Neutra rispetto alla forma.** "Sintesi" vale per il verdetto per ipotesi e per i temi della domanda aperta: la fase 3 sceglie la forma, la metrica non cambia. L'evento porta il numero di ipotesi, così la fase 7 può leggere le due forme separatamente.
- **14 giorni:** un giro di discovery legato a una decisione dura "poche settimane" secondo il trigger del frame `[assumption:unvalidated]`, e il numero va letto prima della fase 7.
- **Unità workspace, non Research:** a pre-PMF un solo utente con dieci Research peserebbe dieci volte.

**Baseline:** 0, la Research non esiste nel prodotto e oggi Voce non emette nessun evento di Research `[code:src/lib/analytics.ts]`; prima misurazione il 2026-10-05, primo giorno della coorte, con la Research in produzione dopo la masterclass del 1 ottobre 2026 `[doc:user-2026-09-28-research-round1]`. La data del rilascio è Deciso dal modello per delega di Mario (2026-09-28): se il rilascio slitta, la fase 6 sposta coorte e lettura dello stesso numero di giorni e lo registra.

**Target:** 60% entro il 2026-11-08, letto solo se il denominatore conta almeno 10 workspace. Target Deciso dal modello per delega di Mario (2026-09-28) `[doc:user-2026-09-28-research-round1]`: è una decisione, non un dato. Ragionamento: la fonte che sostiene di più O1 dice che nella sintesi "most PMs give up" `[doc:mined-reddit-waste-mastodon2646]`; se Voce toglie quel costo, tra chi ha già raccolto le voci la maggioranza deve arrivare alla sintesi, cioè l'opposto di quanto descritto. "Maggioranza" è la stessa soglia della regola di decisione di fase 1 `[doc:user-2026-09-28-deroga-gate-1-research]`. Il 60% invece del 51% perché con 10 workspace un workspace vale 10 punti `[estimate:1-su-10]`: 6 su 10 è il primo valore che non si confonde con la parità. Nessun benchmark esterno misura questo passaggio: il più vicino trovato, l'adozione abituale delle funzioni principali nel SaaS al 24,5% `[doc:bench-userpilot-core-feature-adoption]`, misura l'abitudine e non il completamento di un flusso, quindi non è usato. Sotto il 60% con almeno 10 workspace la lettura è che il confronto non salta per tempo (fiducia, O2, o decisione già presa, O3 e O5), e va detto in fase 7. Sotto 10 workspace il numero non si legge e decide solo il verdetto delle interviste. Soglia di 10 Deciso dal modello per delega di Mario (2026-09-28) `[doc:user-2026-09-28-research-round1]`.

**Measured by:** PostHog UE, eventi solo dal server, `distinct_id` = id del workspace, mai testo delle voci, delle domande, delle ipotesi o della sintesi `[code:AGENTS.md]` `[code:docs/analytics.md]`. Oggi esistono `signed_up`, `first_feedback_added`, `first_analysis_completed`, `upgraded_to_pro` e `question_answered` `[code:src/lib/analytics.ts]`: nessuno sa cos'è una Research. Requisiti per la fase 4 (i nomi li fissa la specifica, il significato no):

- `first_research_collected`: milestone, una volta per workspace, quando una sua Research raggiunge 5 voci per la prima volta. Passa da `analytics_milestones` come gli altri milestone, quindi il vincolo sui nomi della tabella va esteso `[code:supabase/migrations/20260925180000_analytics_milestones.sql]`. Proprietà: nessuna, o solo categorie e conteggi.
- `research_synthesized`: evento ripetibile (`RepeatedEvent`, `trackEvent`), a ogni sintesi completata di una Research. Proprietà: `feedback_count` (voci nella sintesi), `citation_count` (citazioni verificate mostrate), `hypothesis_count` (0 per la domanda aperta). Parte quando il PM avvia la sintesi; se la fase 3 sceglie una sintesi che si aggiorna da sola, l'evento si sposta sulla prima apertura della sintesi aggiornata da parte del PM, altrimenti la metrica misura la macchina e non il PM.
- `POSTHOG_KEY` configurata in produzione dal giorno del rilascio: senza chiave non parte nulla `[code:docs/analytics.md]`. Controllo della fase 6.

Query HogQL da eseguire il 2026-11-08:

```sql
with collected as (
  select distinct_id as ws, min(timestamp) as t0
  from events
  where event = 'first_research_collected'
    and timestamp >= '2026-10-05' and timestamp < '2026-10-26'
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

Limite noto: la sintesi contata può essere di una Research diversa da quella che ha raggiunto le 5 voci, perché l'evento non porta l'id della Research (le proprietà sono solo categorie e conteggi) `[code:docs/analytics.md]`. Con l'unità workspace l'errore è accettato.

**Guardrail (non target):** il North Star di attivazione, quota di nuovi workspace che eseguono la prima analisi AI entro 24 ore dalla registrazione `[doc:voce-brief]`, letto sulla stessa finestra con il funnel `signed_up` → `first_analysis_completed` `[code:docs/analytics.md]`. Non deve scendere perché la Research aggiunge passi prima della prima analisi (domanda, ipotesi, raccolta dedicata). Requisito per la fase 4: `first_analysis_completed` continua a partire alla prima sintesi di qualunque Research, altrimenti il North Star smette di misurarsi.

**Connects to North Star:** il North Star misura se un nuovo workspace arriva alla prima analisi entro 24 ore `[doc:voce-brief]`. Questa metrica sta dopo: chiede se chi ha raccolto voci vere su una domanda arriva alla sintesi di tutte. È l'indicatore d'ingresso del valore promesso dal nuovo scopo, che il North Star non copre. Il North Star è stato scelto per il posizionamento precedente (raccolta e temi per la roadmap) `[doc:voce-brief]`: dopo il verdetto delle interviste va riconsiderato, perché per uno strumento di customer discovery "prima analisi entro 24 ore" può non essere il momento di valore. Non cambia ora.

## Decisioni prese per delega

Mario ha delegato con "fai tutto tu" `[doc:user-2026-09-28-research-round1]`. Ogni scelta qui sotto è "Deciso dal modello per delega di Mario (2026-09-28)" e va rivista da lui.

1. Selezione di O1 intera, con i sotto-rami O1a (ipotesi) e O1b (domanda aperta o discovery continua) lasciati aperti per la fase 3 e per le interviste. `[doc:user-2026-09-28-research-round1]`
2. O2 (fiducia nella sintesi) e O3 (prove da mostrare) trasformate in vincoli della scelta: solo citazioni verificate, conteggio e parole delle voci nell'output. `[doc:user-2026-09-28-research-round1]`
3. Metrica: denominatore sui workspace la cui prima Research raggiunge 5 voci, sintesi con almeno una citazione verificata, finestra di 14 giorni, coorte dal 2026-10-05 al 2026-10-25, neutra rispetto alla forma della Research. `[doc:user-2026-09-28-research-round1]`
4. Data di prima misurazione 2026-10-05 come data di rilascio della Research dopo la masterclass, spostabile dalla fase 6 insieme a coorte e lettura. `[doc:user-2026-09-28-research-round1]`
5. Target 60% entro il 2026-11-08 con soglia minima di 10 workspace; sotto soglia decide solo il verdetto delle interviste. `[doc:user-2026-09-28-research-round1]`
6. Due eventi nuovi senza testo come requisito della fase 4 (`first_research_collected`, `research_synthesized` con `feedback_count`, `citation_count`, `hypothesis_count`), e `first_analysis_completed` mantenuto per il guardrail. `[doc:user-2026-09-28-research-round1]`
7. North Star invariato come guardrail, segnalato da riconsiderare dopo il verdetto delle interviste. `[doc:user-2026-09-28-research-round1]`
