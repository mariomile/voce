# Solution Bet: Voce, "Chiedi ai tuoi feedback"

**Phase:** 3 · **Cycle:** 1 · **Mode:** lite · **Date:** 2026-09-27 · **Owner:** Mario Miletta (opzioni, scelta, criteri di stop e test scritti dal modello per delega)

## Stato, detto prima di tutto

La fase 1 è passata solo per deroga di Mario, senza interviste `[doc:user-2026-09-27-deroga-gate-1]`. Ogni punteggio di confidenza qui sotto poggia su fonti web `doc`, nessuna dall'ICP, e per questo nessuna opzione supera 3. Il vincolo di consegna (costruita, provata e mostrata dal vivo a circa 230 PM il 1 ottobre 2026, con Mario da solo più l'agente) `[doc:user-2026-09-26-init]` decide la dimensione della scommessa, non la sua probabilità di funzionare.

## Opportunity

**O2.** Quando prepara una decisione o scrive una specifica su un argomento preciso, il PM non ritrova in tempo utile quanti clienti ne hanno parlato e con quali parole, e decide sul ricordo di 2-3 conversazioni `[doc:mined-reddit-frustrated-pm26]` `[doc:mined-reddit-ashleygibsonpm]` `[doc:mined-capterra-productboard-simon-h]` `[doc:mined-reddit-dada-man]`. Vincolo ereditato da O3: ogni risposta cita solo testo presente nei feedback, verificato carattere per carattere come fa già l'analisi `[code:src/lib/analysis.ts:183]`.

**Metrica di fase 2:** quota di workspace che completano la prima analisi AI tra il 2026-10-01 e il 2026-10-17 e che, entro 14 giorni, ricevono da "Chiedi ai tuoi feedback" una risposta con almeno una citazione verificata in almeno 2 giorni distinti. Baseline 0, target 25% entro il 2026-10-31, letta solo con almeno 20 workspace `[doc:user-2026-09-26-delega]`.

**Cosa c'è già nel codice.** La lista dei feedback si filtra solo per canale, senza ricerca nel testo `[code:src/lib/data.ts:186]`. L'analisi manda al modello i feedback degli ultimi 90 giorni, massimo 500, come dati numerati separati dalle istruzioni `[code:src/lib/analysis.ts:11]` `[code:src/lib/analysis.ts:89]`, controlla la quota nel database prima della chiamata `[code:supabase/migrations/20260925120000_ai_analysis.sql:82]` e registra token e costo in `analysis_runs` `[code:supabase/migrations/20260925120000_ai_analysis.sql:16]`.

## Options

Generate con i quattro spunti: chi agisce (utente, sistema, Mario a mano), quando (prima, durante, dopo), togliere invece di aggiungere, togliere il vincolo. Ogni riga ha un'azione principale diversa.

| # | Option | Primary user action | Impact | Confidence | Effort | Reversibility |
|---|--------|--------------------|--------|-----------|--------|---------------|
| 1 | **Chiedi, forma minima.** Una casella di domanda; Voce risponde in poche frasi, con il numero di feedback collegati contato dal server e fino a 5 citazioni verificate. Niente conversazione, niente cronologia | il PM scrive una domanda in linguaggio naturale e legge sullo schermo una risposta generata con citazioni verificate | 4 | 2 `[doc:priorart-enterpret]` `[doc:priorart-dovetail]` `[doc:mined-lenny-amir-klein]` | 3 | 3 |
| 2 | **Ricerca nel testo, senza AI.** Un campo di ricerca sulla lista dei feedback, con il conteggio dei risultati e la parola evidenziata | il PM digita una parola e scorre i feedback che la contengono | 2 | 2 `[doc:mined-reddit-meknoid333]` `[doc:mined-reddit-armok3290]` | 5 | 5 |
| 3 | **Argomento seguito dall'analisi.** Il PM fissa un argomento ("export in Excel"); la prossima analisi produce sempre un tema per quell'argomento, con conteggio e citazioni, dentro la stessa chiamata al modello | il PM aggiunge un argomento da seguire e lo ritrova come tema alla prossima analisi | 2 | 2 `[doc:mined-reddit-armok3290]` | 3 | 2 |
| 4 | **Dossier fatto a mano (concierge).** Il PM descrive la decisione che sta preparando; Mario prepara un dossier con conteggi e citazioni dai suoi feedback e lo consegna entro 24 ore | il PM descrive la decisione che prepara e riceve un dossier scritto da una persona | 2 | 1 `[assumption:unvalidated]` | 4 | 3 |
| 5 | **Togliere la risposta: export per l'assistente.** Un bottone scarica i feedback in un formato pronto da incollare in Claude, ChatGPT o NotebookLM | il PM scarica i feedback e li interroga fuori da Voce | 1 | 3 `[doc:mined-reddit-praying4exitz]` `[doc:mined-lenny-amir-klein]` `[doc:mined-reddit-constantkooky3329]` | 5 | 4 |

**Controllo di distinzione.** Le cinque frasi d'azione sono diverse per verbo e oggetto: scrivere una domanda e leggere una risposta subito (1), digitare una parola e scorrere (2), dichiarare un argomento prima e ritrovarlo dopo un'analisi (3), descrivere una decisione e aspettare una persona (4), scaricare e lavorare altrove (5). La 1 e la 4 sembrano vicine; non lo sono: nella 4 agisce Mario, la consegna arriva il giorno dopo e l'oggetto è una decisione, non una domanda.

**Come si leggono i punteggi.**

- **Impact** misura la metrica di fase 2, che conta risposte con citazioni verificate da "Chiedi". La 2 e la 5 non la muovono senza riscriverla: la 2 non produce citazioni verificate né coglie le parafrasi ("cosa dicono i clienti che hanno disdetto" non è una parola da cercare); la 5 porta la risposta fuori da Voce, dove non si misura e le citazioni non si verificano, cioè ripete O3 `[doc:mined-lenny-caitlin-sullivan]`. La 3 è legata alla quota di analisi, 3 al mese su Free `[code:src/lib/plans.ts:4]`, quindi due giorni distinti in 14 giorni sono improbabili. La 4 non scala oltre le ore di Mario e non si mostra dal vivo.
- **Confidence** poggia solo su fonti `doc`, nessuna dall'ICP. Per la 1: le soluzioni enterprise della categoria hanno adottato domande libere con citazioni `[doc:priorart-enterpret]` `[doc:priorart-dovetail]` e un PM usa un Project di ChatGPT come archivio interrogabile `[doc:mined-lenny-amir-klein]`; che un PM dell'ICP lo faccia dentro Voce è `[assumption:unvalidated]`. La 5 ha 3 perché descrive un comportamento già osservato, ma è il comportamento del concorrente, non di Voce. La 4 non ha nessuna fonte.
- **Effort** è la distanza da un utente reale entro il 1 ottobre. La 1 è media: 1 migrazione con RLS e quota, 1 file di logica, 1 server action, 1 pagina, un set di evals nuovo, 1 evento. La 2 e la 5 sono piccole (una query e un componente). La 3 cambia il prompt dell'analisi, quindi rifà le evals del cuore del prodotto. La 4 costa poco in codice e molte ore di Mario per ogni workspace.
- **Reversibility.** La 1 si toglie nascondendo la pagina, ma viene mostrata a circa 230 PM `[doc:user-2026-09-26-init]`: toglierla dopo è visibile. La 3 tocca il prompt da cui dipendono priorità e stato dei temi, che passano per titolo `[code:supabase/migrations/20260925120000_ai_analysis.sql:136]`. La 4 è una promessa di lavoro umano a utenti veri.

## Selected: 1, Chiedi in forma minima

Deciso dal modello per delega di Mario (2026-09-27) `[doc:user-2026-09-26-delega]`.

**Why:**

- **Impact.** È l'unica opzione con impatto sopra 2 sulla metrica di fase 2 senza riscriverla, e l'unica che mantiene la promessa "con le parole dei clienti" con citazioni verificate `[doc:voce-brief]`.
- **Confidence, detta onestamente.** 2 su 5, come quasi tutte. Non vince sulla confidenza: vince perché è l'unica che mette alla prova O2 come è stata definita.
- **Il tie-break della reversibilità non si applica**: nessuna altra opzione ha impatto simile. La 2 vince su sforzo e reversibilità ed è il ripiego scritto nei criteri di stop.
- **Forma minima per la superficie più piccola.** Una domanda, una risposta, nessuna conversazione, nessuna cronologia visibile, stesso modello e stesso gateway dell'analisi `[code:src/lib/analysis.ts:9]`. Il numero di feedback lo conta il server dall'elenco verificato, non il modello. Le citazioni passano lo stesso controllo dell'analisi `[code:src/lib/analysis.ts:183]`. Senza citazioni verificate la risposta è "Non trovo feedback che ne parlano", ed è un esito, non un errore.
- **Non è un prompt personalizzabile** (non-goal di PRODUCT.md `[doc:user-2026-09-26-init]`): le istruzioni restano fisse e uniche, la domanda viaggia come dato in un blocco suo, come i feedback `[code:src/lib/analysis.ts:85]`. Le evals restano possibili.

## Rejected

| Option | Why not now | Revisit when |
|--------|------------|--------------|
| 2. Ricerca nel testo | Non coglie le parafrasi, non produce citazioni verificate, non muove la metrica così com'è scritta | Se le interviste mostrano che le domande reali sono parole precise ("export", "Excel"), o se scatta il criterio di stop sulla quota di "nessuna prova" |
| 3. Argomento seguito dall'analisi | Legata alla quota di analisi (3 al mese su Free) `[code:src/lib/plans.ts:4]`; cambia il prompt del cuore del prodotto a 4 giorni dalla demo | Quando almeno 3 intervistati descrivono lo stesso argomento seguito per settimane, non una domanda del momento |
| 4. Dossier a mano | Non si mostra dal vivo, non scala oltre le ore di Mario, nessuna fonte | Se dopo il 2026-10-10 le interviste confermano il bisogno ma la risposta generata non viene riusata: allora si prova a mano con 3 PM prima di ricostruire |
| 5. Export per l'assistente | Porta la risposta fuori da Voce, dove non si misura e le citazioni non si verificano | Se la maggioranza degli intervistati usa già Claude o NotebookLM sui feedback e se ne fida: allora il valore di Voce è raccogliere, non rispondere |

## Prova di resistenza

**La scommessa nella forma più forte.** Un PM che ha già i feedback in Voce, quando prepara una decisione, fa una domanda e riceve in secondi un conteggio e frasi vere dei suoi clienti da incollare nel documento, cosa che un assistente generico non garantisce perché può inventare citazioni `[doc:mined-lenny-caitlin-sullivan]`.

**L'assunzione portante.** Che l'occasione di chiedere si ripeta. La metrica chiede 2 giorni distinti in 14; se il PM ha una domanda al mese, la funzione è una curiosità dopo la demo, anche se funziona bene. Soglia dei 2 giorni fissata in fase 2 `[doc:user-2026-09-26-delega]`.

| Branch | Status | Evidence / Test | Cost |
|--------|--------|-----------------|------|
| Il bisogno esiste e i mezzi attuali non bastano (credenze 1 e 3 del frame) | Deferred | Questionario asincrono e interviste del 2-9 ottobre, regola di decisione fissata in fase 1 `[doc:user-2026-09-26-delega]` | 0,5 giorni di Mario per il questionario; interviste già pianificate |
| L'occasione si ripete almeno due volte in 14 giorni | Deferred | La metrica stessa, letta il 2026-10-31 con almeno 20 workspace | nessun costo in più |
| Le risposte su dati veri hanno citazioni, non "nessuna prova" | Deferred | Evals con 10-15 domande scritte a mano sul set sintetico, prima del rilascio; guardrail sulla quota di "nessuna prova" dopo | dentro il costo di costruzione |
| Il PM si fida abbastanza da riusare la risposta (credenza 5) | Deferred | Sezione 3 della guida d'intervista, domanda sul controllo delle risposte | già nelle interviste |
| Il costo AI esplode con le domande | Resolved per progetto, da confermare | Quota separata contata anche sulle fallite, proposta sotto; decisione di Mario | nessuno |
| La domanda del PM o un feedback fanno eseguire istruzioni al modello | Resolved per progetto | Istruzioni fisse, domanda e feedback in blocchi di dati con "<" codificato come nell'analisi `[code:src/lib/analysis.ts:85]`; evals con i feedback di iniezione già nel set `[code:evals/analysis.eval.ts:22]` | dentro il costo di costruzione |
| Le reazioni alla demo gonfiano la metrica | Resolved | Il workspace della demo di Mario è escluso dalla query; le reazioni in sala non sono evidenza `[doc:user-2026-09-26-delega]` | nessuno |
| Claude collegato alle fonti basta già all'ICP | Deferred | Interviste, sezione 3 `[doc:mined-reddit-praying4exitz]` | già nelle interviste |

Nessun ramo resta senza test o senza decisione.

## Kill criteria

Tre criteri, scritti prima della costruzione. Decisi dal modello per delega di Mario (2026-09-27) `[doc:user-2026-09-26-delega]`, soglie da rivedere da lui.

1. **Interviste.** Il 2026-10-10, se la sintesi delle interviste del 2-9 ottobre applica la regola della fase 1 con esito "chiuso" (meno della metà degli intervistati ricorda una domanda precisa sui feedback negli ultimi 30 giorni, oppure la maggioranza di chi la ricorda ha risposto in meno di 10 minuti con i mezzi attuali e si è fidata), togliamo "Chiedi" dalla navigazione e cancelliamo il codice entro il 2026-10-17, anche se la metrica sembra buona `[doc:user-2026-09-26-delega]`. Con esito "rimodellato" verso la sintesi periodica (O1) smettiamo di investire su "Chiedi" e riapriamo la fase 2. Se il 2026-10-10 le interviste fatte sono meno di 6, il criterio slitta al 2026-10-17 e lo slittamento si scrive in `state.json`.
2. **Metrica.** Il 2026-10-31, con almeno 20 workspace attivati tra il 2026-10-01 e il 2026-10-17, se la quota che riceve risposte con almeno 1 citazione verificata in almeno 2 giorni distinti entro 14 giorni è sotto il 15%, togliamo "Chiedi". Con 20 workspace vuol dire 2 o meno `[estimate:15-per-cento-di-20]`. Tra 15% e 25% la funzione resta ma non si estende, e la fase 7 decide insieme alle interviste. Sotto 20 workspace la metrica non si legge e decide solo il criterio 1, come dice la fase 2.
3. **Qualità, ricostruire diversamente.** Il 2026-10-31, se più del 50% delle risposte del periodo ha esito "nessuna prova", non miglioriamo il prompt: sostituiamo "Chiedi" con la ricerca nel testo (opzione 2) `[doc:user-2026-09-26-delega]`.

Perché 15% e non 5%: il target è 25%, ancorato al benchmark di adozione delle funzioni principali (24,5%) `[doc:bench-userpilot-core-feature-adoption]`. Una soglia a 5% (un workspace su 20) non si mancherebbe mai con una sala che ha appena visto la demo. 15% è la soglia che si può mancare.

**Measured by:** criteri 2 e 3 con la query HogQL di `02-definition.md` sugli eventi `first_analysis_completed` e `question_answered`, con in più il filtro `distinct_id != '<id del workspace della demo di Mario>'`; per il criterio 3, `countIf(properties.outcome = 'no_evidence') / count()` su `question_answered` dal 2026-10-01 al 2026-10-31. Criterio 1: sintesi delle interviste scritta in `evidence/` entro il 2026-10-10, un file per partecipante `[doc:user-2026-09-26-delega]`.

## Riskiest assumption

Nei 14 giorni dopo la prima analisi, un PM dell'ICP con i feedback in Voce incontra almeno due occasioni distinte in cui vuole sapere cosa dicono i clienti su un argomento preciso, e in quelle occasioni né i temi, né la memoria, né un assistente generico gli danno una risposta con prove che porterebbe a chi decide. `[assumption:unvalidated]`

Viene dalle credenze 1 e 3 del frame (domande frequenti, mezzi attuali insufficienti), ristretta dalla fase 2 al momento in cui si prepara una decisione, e dalla fase 3 alla ripetizione, perché la metrica chiede due giorni distinti. Nessuna delle 23 fonti racconta questo episodio `[doc:mined-reddit-frustrated-pm26]`.

## Cheapest test

**Shape:** smoke test nella forma del questionario sull'ultimo episodio. Non misura l'interesse per un'idea: chiede un fatto passato, che è ciò che la credenza afferma. È più economico di ogni forma del catalogo che richieda la funzione (fake door, Wizard of Oz, fetta strumentata).
**Design:** Mario manda il questionario asincrono già scritto (`questionnaires/pm-icp-asincrono.md`) con messaggio personale a 8-10 PM dell'ICP della sua rete, esclusi colleghi DeepAgent, studenti della cohort e chiunque abbia visto Voce. Misura, per ogni risposta: se ricorda una domanda precisa sui feedback negli ultimi 30 giorni, quante nello stesso mese, con cosa ha risposto, in quanto tempo, se si è fidato. Risposte entro il 2026-10-07, come già scritto nel questionario `[doc:user-2026-09-26-delega]`.
**Test cost:** 0.5 giorni di Mario `[estimate:ore-mario-questionario]` (circa 1 ora per 8-10 messaggi personali, 2-3 ore per leggere e codificare le risposte; l'attesa delle risposte non è lavoro) · **Build cost:** 3 giorni `[estimate:scomposizione-costruzione]` (migrazione con RLS, quota e registro: mezza giornata; logica, prompt, controllo delle citazioni e test unitari: mezza; server action, pagina e stati: mezza; evals con domande e confronto: mezza; evento ripetibile e `docs/analytics.md`: un quarto; E2E col finto gateway, verifica e prova della demo: tre quarti) · **Ratio:** 17%
**Order:** costruzione prima, questionario in parallelo da domani. La regola dice che il test viene prima (17% è sotto il 20%) e qui non si rispetta: le risposte arrivano entro il 2026-10-07, la costruzione deve partire il 2026-09-27 per la demo del 2026-10-01, e i primi 5 PM da contattare non sono ancora stati nominati da Mario `[doc:user-2026-09-26-delega]`. È una deroga alla condizione 3.4, **firmata da Mario il 2026-09-27** `[doc:user-2026-09-27-deroga-gate-3-quota]`.
**Falsified if:** su almeno 5 risposte di PM dell'ICP, meno della metà ricorda una domanda precisa sui feedback negli ultimi 30 giorni, oppure nessuno ne ricorda almeno due nello stesso mese, oppure la maggioranza di chi la ricorda ha risposto in meno di 10 minuti con i mezzi attuali e si è fidata. In quel caso il criterio di stop 1 si applica senza aspettare il 2026-10-10. Soglie ereditate dalla fase 1 `[doc:user-2026-09-26-delega]`.

**Controllo tecnico prima del rilascio, dentro il costo di costruzione.** Evals con 10-15 domande scritte a mano sul set sintetico di 60 feedback `[code:evals/dataset.json]`: zero citazioni non presenti nei feedback nell'output grezzo, zero istruzioni di iniezione eseguite, e almeno una citazione verificata per ogni domanda che ha risposta nel set. Non mette alla prova la credenza rischiosa: dice solo se la funzione è pronta per la sala.

## Costo per domanda e quota proposta (decisione di Mario)

**Da confermare da Mario, non deciso per delega.** AGENTS.md vieta di cambiare modello o alzare il costo per analisi senza chiedere `[code:AGENTS.md]`. "Chiedi" non cambia modello (stesso `AI_MODEL`, default `anthropic/claude-sonnet-5`) `[code:src/lib/analysis.ts:9]` e non tocca il costo di un'analisi, ma aggiunge una nuova voce di costo per workspace.

**Stima del costo per domanda.** Ogni domanda manda al modello lo stesso blocco di feedback dell'analisi (90 giorni, massimo 500) con un tetto di uscita proposto di 1.500 token, contro i 16.000 dell'analisi `[code:src/lib/analysis.ts:120]`. Prezzi usati dal codice: 2 $ per milione di token in entrata, 10 $ in uscita `[code:src/lib/analysis.ts:19]`. Il caso peggiore documentato di un'analisi è circa 130 $ al mese per 200 esecuzioni con 500 feedback da 2.000 caratteri `[code:docs/review.md:62]`, cioè circa 0,65 $ per esecuzione `[estimate:130-diviso-200]`. Scalando in modo lineare sui caratteri e attribuendo tutto all'entrata, per eccesso `[estimate:scala-lineare-da-review-b5]`:

| Caso | Feedback nel prompt | Costo per domanda |
|------|--------------------|-------------------|
| Set delle evals: 60 feedback, 7.091 caratteri, 118 in media `[code:evals/dataset.json]` | circa 10.000 caratteri con i campi JSON | circa 0,02 $ (0,0065 in entrata, al massimo 0,015 in uscita) |
| Sala di PHC26, circa 230 risposte brevi, se lunghe come quelle delle evals `[assumption:unvalidated]` | circa 40.000 caratteri | circa 0,04 $ |
| Free, caso peggiore: 100 feedback da 2.000 caratteri `[code:src/lib/plans.ts:4]` | 200.000 caratteri | circa 0,15 $ |
| Pro, caso peggiore: 500 feedback da 2.000 caratteri | 1.000.000 di caratteri | circa 0,67 $, come un'analisi |

La stima è grezza: il dato di `docs/review.md` non dichiara il rapporto tra caratteri e token. Il primo numero vero arriva dal registro delle domande, che scrive token e costo come `analysis_runs`.

**Quota proposta.** Deciso dal modello, **da confermare da Mario**:

- **Free: 10 domande al mese. Pro: 100 domande al mese.** Separate dalle analisi, che restano 3 e 100 `[code:src/lib/plans.ts:4]`.
- **Conta ogni domanda che arriva al modello, riuscita o fallita.** Così non si ripete il tetto doppio delle analisi (B5) `[code:docs/review.md:62]`.
- Controllata nel database prima della chiamata, una domanda alla volta per workspace, come `start_analysis` `[code:supabase/migrations/20260925120000_ai_analysis.sql:54]`.
- Costo massimo al mese per workspace `[estimate:quota-per-costo-peggiore]`: Free circa 1,5 $ (10 per 0,15), Pro circa 67 $ (100 per 0,67), in aggiunta alle analisi. Con dati come quelli delle evals: Free circa 0,20 $, Pro circa 2 $.
- 10 domande bastano per la metrica, che chiede risposte in 2 giorni distinti `[doc:user-2026-09-26-delega]`.
- Il rischio degli account Free creati in serie (B6) cresce di circa 1,5 $ al mese per account nel caso peggiore `[code:docs/review.md:68]`.

Alternative che Mario può scegliere: 5 domande su Free (caso peggiore 0,75 $); nessuna quota nuova, con le domande che consumano le analisi (più semplice, ma su Free lascia 2 domande dopo la prima analisi e la metrica diventa quasi irraggiungibile) `[estimate:quota-per-costo-peggiore]`.

## Decisioni prese per delega

Tutte "Deciso dal modello per delega di Mario (2026-09-27)" `[doc:user-2026-09-26-delega]`, da rivedere da lui:

1. Cinque opzioni, scelta la 1 in forma minima: una domanda, una risposta, nessuna conversazione né cronologia visibile.
2. Numero di feedback contato dal server, non dal modello; massimo 5 citazioni verificate; "nessuna prova" come esito esplicito.
3. Criteri di stop: esito "chiuso" delle interviste al 2026-10-10; soglia 15% al 2026-10-31; più del 50% di "nessuna prova" porta alla ricerca nel testo `[doc:user-2026-09-26-delega]`.
4. Workspace della demo escluso dalla metrica.
5. Questionario asincrono come test più economico, in parallelo alla costruzione.

**Non decise, servono a Mario:**

- **Deroga alla condizione 3.4** (test prima della costruzione). Motivo proposto: "Il questionario costa 0,5 giorni contro 3 di costruzione, ma le risposte arrivano entro il 7 ottobre e la funzione va mostrata a PHC26 il 1 ottobre: si costruisce prima, il questionario parte in parallelo e il criterio di stop 1 si applica appena le risposte lo falsificano."
- **Quota e costo per domanda**: Free 10, Pro 100, fallite contate, tetto di uscita 1.500 token `[estimate:quota-per-costo-peggiore]`.
- **I primi 5 PM** a cui mandare il questionario: il modello non conosce le persone e non le inventa.

## BET SELECTED

**Options:** 5, cinque azioni principali distinte, punteggi decisi dal modello per delega `[doc:user-2026-09-26-delega]` · **Selected:** 1, Chiedi in forma minima (impatto 4, confidenza 2, sforzo 3, reversibilità 3) · **Rejected:** 2, 3, 4, 5, con condizione di ritorno · **Kill criteria:** esito "chiuso" delle interviste al 2026-10-10; sotto il 15% al 2026-10-31 con almeno 20 workspace; oltre il 50% di "nessuna prova" · **Riskiest assumption:** l'occasione di chiedere si ripete almeno due volte in 14 giorni e i mezzi attuali non bastano · **Cheapest test:** questionario sull'ultimo episodio, 0,5 giorni contro 3 di costruzione, 17% · **Gate 3:** passato con deroga su 3.4, firmata da Mario il 2026-09-27. Quota confermata: Free 10 domande al mese, Pro 100, separate dalle analisi `[doc:user-2026-09-27-deroga-gate-3-quota]`.
