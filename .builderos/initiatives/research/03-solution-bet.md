# Solution Bet: Voce, Research e customer discovery

**Phase:** 3 · **Cycle:** 1 · **Mode:** lite · **Date:** 2026-09-28 · **Owner:** Mario Miletta (opzioni, scelta, criteri di stop e test scritti dal modello per delega)

## Stato, detto prima di tutto

La fase 1 è passata solo per deroga di Mario, senza interviste, con verdetto IN SOSPESO fino alle 6 interviste di ottobre; se la regola di decisione dà KILLED o RESHAPED si torna indietro `[doc:user-2026-09-28-deroga-gate-1-research]`. Ogni punteggio di confidenza qui sotto poggia su fonti web `doc`, nessuna dall'ICP, e per questo nessuna opzione supera 2. La deroga porta un'istruzione precisa per questa fase: tenere sul tavolo la Research guidata da ipotesi e la Research come domanda aperta, e valutarle in modo onesto `[doc:user-2026-09-28-deroga-gate-1-research]`. Mario ha descritto la Research con ipotesi e verdetto `[doc:user-2026-09-28-research-round1]`: la scelta sotto va contro quella descrizione, ed è segnalata come tale.

## Opportunity

**O1.** Dopo aver sentito i clienti, il confronto di tutte le voci raccolte con ciò che il PM voleva sapere salta o si fa a metà perché costa ore o giorni, e la decisione si chiude sulle due o tre conversazioni ricordate `[doc:mined-reddit-waste-mastodon2646]` `[doc:mined-reddit-frustrated-pm26]` `[doc:mined-reddit-cold-hall-5384]` `[doc:mined-substack-else-van-der-berg]`. Due sotto-rami lasciati aperti dalla fase 2: O1a, si parte da un'ipotesi (3 fonti, la più fragile) `[doc:mined-indiehackers-james-paden]` `[doc:mined-reddit-chance-back4949]` `[doc:mined-substack-productpill]`; O1b, si parte da una domanda aperta o la domanda cambia nel tempo (4 fonti e un prodotto) `[doc:mined-substack-else-van-der-berg]` `[doc:mined-reddit-confusedus]` `[doc:mined-reddit-darcswan]` `[doc:mined-reddit-ttorres]` `[doc:priorart-vistaly]`. Vincoli ereditati: solo citazioni verificate sul testo (O2) `[code:src/lib/analysis.ts]`, conteggio e parole delle voci nell'output (O3) `[doc:mined-reddit-georgeharter]`.

**Metrica di fase 2:** quota di workspace la cui prima Research raggiunge 5 voci tra il 2026-10-05 e il 2026-10-25 e che, entro 14 giorni, completano una sintesi di una Research con almeno 5 voci e almeno una citazione verificata. Baseline 0, target 60% entro il 2026-11-08, letta solo con almeno 10 workspace; neutra rispetto alla forma, con `hypothesis_count` sull'evento per leggere le forme separatamente `[doc:user-2026-09-28-research-round1]`.

**Cosa c'è già nel codice, e pesa sullo sforzo.** Oggi ogni feedback appartiene solo a un workspace `[code:supabase/migrations/20260924225437_create_core_schema.sql]`; il modulo pubblico è uno per workspace, con slug e domanda sulla riga del workspace `[code:supabase/migrations/20260924231853_collect_feedback.sql]`; analisi, temi e Chiedi leggono tutti i feedback del workspace `[code:src/app/(app)/themes/actions.ts]` `[code:src/lib/questions.ts]`. L'analisi riceve già i titoli dei temi esistenti, quindi i temi restano stabili da un'analisi all'altra `[code:src/lib/analysis.ts]`: è metà del lavoro dei "temi che si accumulano". Nessun prompt del codice produce un verdetto su un'affermazione; Chiedi risponde a una domanda con citazioni verificate `[code:src/lib/questions.ts]`.

## Options

Generate con i quattro spunti: chi agisce (PM, sistema, Mario a mano), quando (prima della raccolta, durante, a giro concluso), togliere invece di aggiungere, togliere il vincolo. Tutte e quattro condividono il contenitore Research deciso da Mario (domanda, raccolta dedicata, temi e Chiedi limitati) tranne la 3 e la 4, che lo tolgono o lo sostituiscono con una persona.

| # | Option | Primary user action | Impact | Confidence | Effort | Reversibility |
|---|--------|--------------------|--------|-----------|--------|---------------|
| 1 | **A. Research guidata da ipotesi.** Domanda più 1-5 ipotesi scritte alla creazione; a raccolta avviata il PM chiede il verdetto: per ogni ipotesi confermata / smentita / da rivedere, voci a favore e contro contate dal server, citazioni verificate | il PM scrive le ipotesi prima di raccogliere e, a fine giro, legge un verdetto per ciascuna | 4 | 1 `[doc:mined-indiehackers-james-paden]` `[doc:mined-reddit-chance-back4949]` `[doc:mined-substack-productpill]` | 2 | 3 |
| 2 | **B. Research come domanda aperta, discovery continua.** Solo la domanda; le voci entrano nel tempo dal modulo, dalle note incollate e dal CSV; il PM aggiorna i temi quando vuole e vede cosa è cambiato dall'ultima volta; Chiedi limitato alla Research per le verifiche puntuali | il PM tiene aperta una domanda, aggiunge voci nel tempo e rilegge i temi che crescono | 4 | 2 `[doc:mined-substack-else-van-der-berg]` `[doc:mined-reddit-confusedus]` `[doc:mined-reddit-darcswan]` `[doc:priorart-vistaly]` | 3 | 4 |
| 3 | **C. Sintesi una tantum, senza contenitore.** A giro concluso il PM incolla o carica in un colpo tutte le voci raccolte altrove e riceve un documento di sintesi con conteggi e citazioni verificate da scaricare e portare al team. Niente modulo, niente Research che dura | il PM incolla tutte le voci di un giro già chiuso e scarica un documento di sintesi | 3 | 2 `[doc:mined-reddit-constantkooky3329]` `[doc:mined-reddit-praying4exitz]` | 4 | 4 |
| 4 | **D. Sintesi fatta a mano (concierge).** Il PM manda a Mario domanda e note; Mario restituisce entro 48 ore una sintesi scritta con conteggi e citazioni | il PM manda note e domanda a una persona e aspetta la sintesi | 1 | 1 `[assumption:unvalidated]` | 4 | 5 |

**Controllo di distinzione (condizione 3.1).** Le quattro frasi differiscono per verbo, oggetto e momento: scrivere affermazioni prima della raccolta e leggere un giudizio su di esse (1); tenere aperta una domanda e tornare più volte sui temi (2); scaricare un documento una volta, a giro chiuso, senza raccolta in Voce (3); delegare a una persona e aspettare (4). La 1 e la 2 condividono il contenitore, non l'azione: nella 1 l'oggetto su cui il PM agisce è l'ipotesi, scritta prima, e l'uscita è un giudizio; nella 2 l'oggetto è la domanda, che resta aperta, e l'uscita sono i temi. La 2 e la 3 producono entrambe temi con citazioni, ma nella 3 il PM non raccoglie in Voce e non torna: una sola azione, a giro chiuso.

**Variante non contata come opzione: B con ipotesi facoltative (ibrido).** Domanda obbligatoria, ipotesi aggiungibili quando il PM vuole un verdetto. Scritta la sua frase d'azione, per chi non aggiunge ipotesi coincide con la 2 ("tiene aperta una domanda e rilegge i temi"), e per chi le aggiunge coincide con la 1. Non è un meccanismo terzo: è la 2 con la 1 come estensione. Per questo non ha una riga, e compare sotto come percorso della scelta, legato all'esito delle interviste.

**Come si leggono i punteggi.**

- **Impact** misura la metrica di fase 2. La 1 e la 2 la muovono entrambe senza riscriverla: la metrica è neutra rispetto alla forma. La 1 aggiunge un passo prima della sintesi (scrivere ipotesi), quindi chi non parte da un'ipotesi rischia di fermarsi prima del verdetto; la 2 no. La 3 la muove in modo quasi automatico (incolli 5 voci, ricevi la sintesi) ma toglie la raccolta dedicata, che è metà della Research decisa da Mario `[doc:user-2026-09-28-research-round1]`, e serve solo il momento di fine giro. La 4 non è nel prodotto e non passa dagli eventi.
- **Confidence** poggia solo su fonti `doc`. La 1 poggia su O1a, il sotto-ramo più fragile: tre fonti, una sola con un giro concluso, e quel founder ha lasciato il confronto sistematico per scelta di metodo, non per tempo `[doc:mined-indiehackers-james-paden]`. Nessun prodotto verificato espone un verdetto per ipotesi `[doc:priorart-strategyzer]`: spazio libero o assenza di domanda, non si sa. La 2 poggia su O1b: quattro fonti e il concorrente più vicino per pubblico e prezzo costruito così `[doc:priorart-vistaly]`, più l'autorità più citata del settore che spinge a sintetizzare subito, dentro un albero di opportunità `[doc:mined-reddit-ttorres]`. La 3 descrive un comportamento già osservato, ma è quello che il concorrente gratuito fa già bene `[doc:priorart-notebooklm]` `[doc:mined-reddit-constantkooky3329]`: la confidenza che Voce lo faccia meglio è bassa. La 4 non ha fonti.
- **Effort** è la distanza da un utente reale (5 = pochi giorni, 1 = trimestri: più alto vuol dire più economico), in giorni di Mario con l'agente `[estimate:scomposizione-costruzione-research]`. Base comune a 1 e 2 (tabella Research con RLS, `research_id` obbligatorio su ogni feedback, casella generica tolta senza compatibilità, modulo e QR per Research, note incollate, CSV dentro una Research, analisi, temi, Chiedi e `/sala` limitati, eventi, E2E): circa 4,5 giorni. La 2 aggiunge "cosa è cambiato dall'ultima volta" sui temi, mezza giornata: 5 giorni. La 1 aggiunge ipotesi, un prompt nuovo per il verdetto con controllo delle citazioni, un set di evals nuovo con verdetti etichettati a mano e la pagina del verdetto, circa 2,5 giorni: 7 giorni. La 3 sono circa 2,5 giorni (un ingresso, una pagina, un export). La 4 è quasi zero codice e circa un giorno di Mario per ogni PM servito `[estimate:ore-mario-concierge]`.
- **Reversibility.** La base comune (ogni feedback in una Research, casella generica tolta) è la parte meno reversibile e la pagano la 1 e la 2 in egual misura. Sopra la base, la 2 si estende aggiungendo le ipotesi senza toccare nulla di ciò che esiste; la 1 si riduce alla 2 solo togliendo un prompt, un set di evals e una pagina già costruiti e un passo già mostrato agli utenti. Un secondo prompt AI per il verdetto aggiunge anche una voce di costo per workspace, che AGENTS.md riserva a Mario `[code:AGENTS.md]`.

## Selected: 2, B. Research come domanda aperta, con le ipotesi come estensione solo se le interviste le sostengono

Deciso dal modello per delega di Mario (2026-09-28) `[doc:user-2026-09-28-research-round1]`. **Da segnalare a Mario: va contro la sua descrizione della Research, che include ipotesi e verdetto per ipotesi.**

**Why:**

- **Confidence, detta onestamente.** L'evidenza favorisce la 2. Il verdetto di fase 1 indica l'ipotesi nominabile come la parte più fragile e la discovery continua come forma diffusa, con il suo strumento già sul mercato `[doc:mined-substack-else-van-der-berg]` `[doc:priorart-vistaly]`. La 2 chiede ai PM solo di avere una domanda; la 1 chiede anche un'ipotesi, che è la credenza 2 del frame, confidenza bassa, crollo totale.
- **Impact pari.** Entrambe muovono la metrica senza riscriverla; la 2 senza il passo in più prima della sintesi.
- **Sopravvive a più esiti della regola di decisione.** Con VALIDATED la 2 resta giusta e le si aggiungono le ipotesi (circa 2,5 giorni, additivi). Con RESHAPED verso "il contenitore è la domanda, non l'ipotesi" la regola stessa dice di togliere o rendere opzionale il verdetto `[doc:user-2026-09-28-deroga-gate-1-research]`: la 2 è già quella forma, la 1 va smontata. Con KILLED muoiono entrambe, e la 2 ha speso 2 giorni in meno.
- **Reversibilità come tie-break.** Impatto uguale, confidenza a favore della 2, e la 2 conserva l'opzione della 1; la 1 non conserva quella della 2 senza lavoro buttato.
- **Il verdetto di Mario non sparisce del tutto.** Chiedi limitato alla Research risponde già a "è vero che i clienti lasciano per il prezzo?" con conteggio dal server e citazioni verificate `[code:src/lib/questions.ts]`: un PM che ha un'ipotesi la verifica con una domanda, senza un oggetto "ipotesi" nel prodotto.
- **Il costo di questa scelta, detto per intero.** La 1 è la più differenziata: nessuno dei prodotti controllati lega ipotesi, voci e verdetto per un PM singolo `[doc:priorart-strategyzer]` `[doc:priorart-condens]`. La 2 entra in uno spazio dove ci sono già Vistaly per lo stesso pubblico e NotebookLM gratis per il recupero delle voci `[doc:priorart-vistaly]` `[doc:priorart-notebooklm]`. A pre-PMF preferisco adattarmi al comportamento osservato piuttosto che differenziarmi su uno non osservato; se Mario pesa diversamente la differenziazione, la 1 o l'ibrido costano circa 2-2,5 giorni in più e sono una scelta legittima sua.

**Percorso della scelta.** Si costruisce la 2. Il 2026-10-20, con il verdetto delle interviste: se VALIDATED, le ipotesi facoltative con verdetto (l'ibrido) entrano come aggiunta alla specifica; se RESHAPED verso la domanda, la 2 resta così; per gli altri esiti valgono i criteri di stop sotto.

**Evento della metrica per questa forma.** La sintesi della 2 la avvia il PM con un clic, come l'analisi di oggi, quindi `research_synthesized` resta sull'avvio del PM con `hypothesis_count` = 0, come previsto dalla fase 2 `[doc:user-2026-09-28-research-round1]`. Nessuna sintesi che si aggiorna da sola.

## Rejected

| Option | Why not now | Revisit when |
|--------|------------|--------------|
| 1. A, Research guidata da ipotesi | Poggia sul sotto-ramo più fragile (O1a, 3 fonti, un solo giro concluso, confronto lasciato per scelta di metodo) `[doc:mined-indiehackers-james-paden]`; costa circa 2 giorni in più; con esito RESHAPED va smontata `[doc:user-2026-09-28-deroga-gate-1-research]` | Il 2026-10-20 se la regola di decisione dà VALIDATED: entra come ipotesi facoltative sopra la 2, non come passo obbligatorio; oppure se Mario sceglie di pesare la differenziazione più dell'evidenza |
| 3. C, sintesi una tantum | Toglie la raccolta dedicata decisa da Mario `[doc:user-2026-09-28-research-round1]`, serve solo O1a o il fine giro, e compete di fronte con NotebookLM gratuito dove Voce ha solo le citazioni verificate `[doc:priorart-notebooklm]` | Se le interviste mostrano che le voci arrivano quasi tutte da call fuori da Voce (credenza 6 del frame) e il PM chiede solo la sintesi di fine giro; oppure se scatta il criterio di stop 3 |
| 4. D, concierge | Non è nel prodotto, non passa dalla metrica, non scala oltre le ore di Mario; nessuna fonte | Se la metrica scende sotto la soglia del criterio 2 ma le interviste confermano il bisogno: 3 PM serviti a mano prima di ricostruire |

## Prova di resistenza

**La scommessa nella forma più forte.** Un PM senza ricercatore apre una Research con la sua domanda, raccoglie voci dal modulo, dalle note e dal CSV nei giorni in cui gli arrivano, e ogni volta che vuole capire a che punto è ottiene in un clic i temi di tutte le voci, con conteggi e frasi vere dei clienti, invece di rileggere tutto o fermarsi sulle due conversazioni che ricorda.

**Cosa dovrebbe essere vero perché sia sbagliata, e cosa lo dice.**

| Branch | Status | Evidence / Test | Cost |
|--------|--------|-----------------|------|
| Il PM dell'ICP non parte nemmeno da una domanda nominabile (KILLED) | Deferred | Questionario asincrono dal 2 ottobre, interviste dal 6 al 16 ottobre, regola di decisione fissata in fase 1 `[doc:user-2026-09-28-deroga-gate-1-research]` | 0,5 giorni di Mario per il questionario, interviste già pianificate |
| La maggioranza parte da un'ipotesi vera e propria, quindi la 1 serviva (VALIDATED) | Resolved per progetto | Le ipotesi facoltative si aggiungono sopra la 2 senza rifare nulla; circa 2,5 giorni `[estimate:scomposizione-costruzione-research]` | nessuno ora |
| Il confronto è già fatto in fretta con Claude o NotebookLM e basta (KILLED) | Deferred | Sezione 3 della guida e del questionario `[doc:mined-reddit-praying4exitz]` | già nelle interviste |
| Le voci arrivano tutte in un colpo, quindi la "discovery continua" non c'è e la 2 si riduce alla 3 | Deferred | Criterio di stop 3, sui giorni distinti di ingresso delle voci | nessun costo in più |
| La 2 è un doppione di Vistaly o NotebookLM e il PM non ha motivo di preferirla | Deferred | Credenza 4 del frame, interviste 3.1-3.2 `[doc:priorart-notebooklm]` | già nelle interviste |
| Tolta la casella generica, la demo e il flusso attuale si rompono prima del 1 ottobre | Resolved | Nulla va in produzione prima della masterclass; la demo usa il flusso attuale `[doc:user-2026-09-28-research-round1]` | nessuno |
| Il North Star smette di misurarsi perché la prima analisi ora sta dentro una Research | Resolved per progetto | `first_analysis_completed` parte alla prima sintesi di qualunque Research, requisito già scritto in fase 2 `[doc:user-2026-09-28-research-round1]` | dentro la costruzione |

Nessun ramo resta senza test o senza decisione.

## Kill criteria

Tre criteri, scritti prima della costruzione. Decisi dal modello per delega di Mario (2026-09-28) `[doc:user-2026-09-28-research-round1]`, soglie da rivedere da lui.

1. **Interviste, condizione di stop sovraordinata.** Il 2026-10-20 si applica la regola di decisione della fase 1 alle interviste in call (minimo 6) e ai questionari. Se dà KILLED (meno della metà nomina una domanda o un'ipotesi di partenza, oppure la maggioranza di chi la nomina ha fatto il confronto in meno di 2 ore con i mezzi attuali e se ne è fidata), fermiamo ogni lavoro sulla Research e torniamo alla fase 0, anche se la metrica sembra buona. Se dà RESHAPED verso un costo diverso (decisione già presa dal founder, reclutamento), riapriamo la fase 2. Se dà RESHAPED verso la domanda, la 2 resta com'è. Se dà VALIDATED, le ipotesi facoltative entrano come aggiunta. Con meno di 6 interviste al 2026-10-20 il criterio slitta al 2026-10-27 e lo slittamento si scrive in `state.json` `[doc:user-2026-09-28-deroga-gate-1-research]`.
2. **Metrica.** Il 2026-11-08, con almeno 10 workspace nel denominatore (prima Research a 5 voci tra il 2026-10-05 e il 2026-10-25), se la quota che completa una sintesi con almeno 5 voci e almeno 1 citazione verificata entro 14 giorni è sotto il 40%, smettiamo di estendere la Research e ricostruiamo diversamente: il confronto non salta per tempo, e la fase 2 si riapre su O2 o O3. Con 10 workspace vuol dire 3 o meno `[estimate:40-per-cento-di-10]`. Tra 40% e 60% la Research resta ma non si estende, e la fase 7 decide insieme alle interviste. Sotto 10 workspace decide solo il criterio 1, come dice la fase 2.
3. **Forma continua.** Il 2026-11-08, se meno del 30% delle prime Research arrivate a 5 voci ha ricevuto voci in almeno 3 giorni diversi entro 21 giorni dalla creazione, la discovery continua non è il modo in cui la si usa: smettiamo di investire su "cosa è cambiato dall'ultima volta" e sulla raccolta nel tempo, e la fase 3 si riapre con la 3 (sintesi una tantum) come candidata. Soglia decisa dal modello per delega di Mario (2026-09-28) `[doc:user-2026-09-28-research-round1]`.

Perché 40% e non 20%: il target è 60%, fissato come "la maggioranza arriva alla sintesi" dopo una fonte che dice che nella sintesi "most PMs give up" `[doc:mined-reddit-waste-mastodon2646]`. Un 20% (2 workspace su 10) non si mancherebbe con una coorte che arriva dalla sala di PHC26. Il 40% si può mancare.

**Measured by:** criterio 2 con la query HogQL di `02-definition.md` sugli eventi `first_research_collected` e `research_synthesized`, con in più il filtro `distinct_id != '<id del workspace della demo di Mario>'`. Criterio 3 con una query SQL sul database di produzione che conta, per ogni prima Research arrivata a 5 voci, i giorni distinti di `created_at` dei suoi feedback nei 21 giorni dalla creazione: solo conteggi, mai testo `[code:AGENTS.md]`. Criterio 1: sintesi delle interviste in `evidence/`, un file per partecipante, entro il 2026-10-20.

## Riskiest assumption

Un PM dell'ICP parte da una domanda che sa nominare, anche senza un'ipotesi, e dopo aver raccolto almeno 5 voci su quella domanda non arriva oggi alla sintesi di tutte perché gli costa tempo, non perché la decisione è già presa o perché Claude o NotebookLM gliela danno già in fretta e con fiducia. `[assumption:unvalidated]`

Viene dalle credenze 2 e 3 del frame, ristretta dalla fase 2 a O1 e dalla fase 3 alla forma della 2: la 2 chiede una domanda, non un'ipotesi, quindi la parte fragile della credenza 2 si allenta, mentre la credenza 3 (il confronto salta per tempo) resta intera. Nessuna delle 46 fonti racconta l'episodio intero `[doc:mined-reddit-waste-mastodon2646]`.

## Cheapest test

**Shape:** smoke test nella forma del questionario sull'ultimo episodio. Chiede un fatto passato, che è ciò che la credenza afferma, e non richiede la funzione: più economico di fake door, prototipo o fetta strumentata.
**Design:** Mario manda il questionario già scritto (`questionnaires/pm-senza-ricercatore.md`) con messaggio personale a 8-10 PM dell'ICP della sua rete, esclusi colleghi DeepAgent, studenti della cohort in corso e chiunque abbia visto Voce o la demo. Per ogni risposta si codifica: domanda nominata, ipotesi nominata (secondo le definizioni della regola di fase 1), voci riprese tutte o solo alcune, tempo speso, mezzi usati, fiducia nel risultato. Invio dal 2026-10-02, risposte entro il 2026-10-12, come scritto nel questionario `[doc:user-2026-09-28-research-round1]`. Distingue anche la 1 dalla 2: conta quante risposte nominano un'ipotesi vera e propria e quante solo una domanda.
**Test cost:** 0.5 giorni di Mario `[estimate:ore-mario-questionario]` (circa 1 ora per 8-10 messaggi personali, 2-3 ore per leggere e codificare le risposte; l'attesa non è lavoro) · **Build cost:** 5 giorni `[estimate:scomposizione-costruzione-research]` (migrazione Research con RLS, `research_id` obbligatorio, casella generica tolta, modulo e quota per Research e test RLS: 1; raccolta per Research con modulo, QR, note incollate e CSV: 1; pagine elenco, creazione e dettaglio: 1; analisi, temi e Chiedi limitati alla Research e "cosa è cambiato": 0,75; `/sala` legata a una Research: 0,25; eventi e `docs/analytics.md`: 0,25; E2E con la finta API Anthropic e verifica: 0,75) · **Ratio:** 10%
**Order:** costruzione prima, questionario in parallelo dal 2026-10-02. La condizione 3.4 chiede il contrario (10% è sotto il 20%) e qui non è rispettata: Mario ha deciso "costruiamo ora", subito dopo la specifica `[doc:user-2026-09-28-research-round1]`, e le risposte arrivano entro il 2026-10-12. Serve una deroga alla 3.4 che solo Mario può firmare; non è scritta qui.
**Falsified if:** su almeno 5 risposte di PM dell'ICP, meno della metà nomina una domanda o un'ipotesi del suo ultimo giro; oppure la maggioranza di chi la nomina ha ripreso tutte le voci in meno di 2 ore con i mezzi attuali e se ne è fidata. In quel caso il criterio di stop 1 si anticipa senza aspettare il 2026-10-20. Se invece la maggioranza nomina un'ipotesi vera e propria, è il primo segnale per le ipotesi facoltative. Soglie ereditate dalla fase 1 `[doc:user-2026-09-28-deroga-gate-1-research]`.

## Decisioni prese per delega

Tutte "Deciso dal modello per delega di Mario (2026-09-28)" `[doc:user-2026-09-28-research-round1]`, da rivedere da lui:

1. **Scelta della 2 (domanda aperta, discovery continua) invece della 1 (ipotesi e verdetto), contro la descrizione della Research data da Mario.** Le ipotesi facoltative con verdetto entrano solo se il 2026-10-20 le interviste danno VALIDATED.
2. L'ibrido "domanda più ipotesi facoltative" trattato come estensione della 2, non come opzione a sé, perché la sua azione principale coincide con quella della 2.
3. Sintesi avviata dal PM con un clic, nessun aggiornamento automatico; `research_synthesized` con `hypothesis_count` = 0.
4. Criteri di stop: esito della regola di fase 1 al 2026-10-20; soglia 40% al 2026-11-08 con almeno 10 workspace; meno del 30% di Research con voci in almeno 3 giorni distinti riapre la fase 3 sulla sintesi una tantum `[doc:user-2026-09-28-research-round1]`.
5. Stime di costruzione: 5 giorni per la 2, 7 per la 1, 2,5 per la 3.

**Non decise, servono a Mario:**

- **Deroga alla condizione 3.4** (test prima della costruzione), se vuole costruire subito.
- **Conferma della scelta 2 contro la sua descrizione della Research**, oppure scelta della 1 o dell'ibrido, sapendo che costano circa 2-2,5 giorni in più e poggiano sulla parte più fragile dell'evidenza.
- **I PM a cui mandare il questionario:** il modello non conosce le persone e non le inventa.

## BET SELECTED

**Options:** 4, quattro azioni principali distinte; l'ibrido è una variante della 2 · **Selected:** 2, Research come domanda aperta, con le ipotesi come estensione condizionata alle interviste (impatto 4, confidenza 2, sforzo 3, reversibilità 4) · **Rejected:** 1, 3, 4, con condizione di ritorno · **Kill criteria:** regola di fase 1 al 2026-10-20; sotto il 40% al 2026-11-08 con almeno 10 workspace; meno del 30% di Research con voci in almeno 3 giorni distinti · **Riskiest assumption:** il PM parte da una domanda nominabile e il confronto con tutte le voci salta per tempo, non perché basta l'assistente generico · **Cheapest test:** questionario sull'ultimo episodio, 0,5 giorni contro 5 di costruzione, 10% · **Gate 3:** fallito sulla 3.4 finché Mario non firma una deroga o sceglie di far girare il test prima `[doc:user-2026-09-28-deroga-gate-1-research]`.
