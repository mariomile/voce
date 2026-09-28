# Discovery: Voce, "Chiedi ai tuoi feedback"

**Phase:** 1 · **Cycle:** 1 · **Mode:** lite · **Date:** 2026-09-26 · **Owner:** Mario Miletta (piano e ricerca su fonti pubbliche scritti dal modello per delega)

## Assumption under test

Nell'ultimo mese, un PM dell'ICP ha avuto almeno una domanda precisa sui feedback dei clienti, arrivata durante o prima di una decisione, a cui non ha risposto con prove in pochi minuti con quello che usa già (foglio, ricerca nel testo, ChatGPT, Claude o NotebookLM). `[assumption:unvalidated]`

**Would be falsified by:** in 6-8 interviste a PM dell'ICP, chiedendo l'ultima domanda concreta sui feedback ricevuta negli ultimi 30 giorni, meno della metà ne ricorda una; oppure la maggioranza di chi la ricorda l'ha risolta in meno di 10 minuti con i mezzi attuali e si è fidata della risposta. Soglie ereditate dal frame, decise dal modello per delega di Mario (2026-09-26) `[doc:user-2026-09-26-delega]`

## Method

0 interviste, 0 questionari tornati. Estrazione da fonti pubbliche il 2026-09-26: Reddit (r/ProductManagement, r/UXResearch, letto tramite l'archivio arctic-shift e Wayback perché reddit.com blocca l'accesso diretto), Lenny's Newsletter, recensioni Capterra; vault di Mario e segnalibri X cercati senza risultati utili. 23 fonti salvate in `evidence/mined-*.md`, ogni citazione riletta sulla pagina originale prima di scriverla.

**Saturation reached:** no. Nessuna persona dell'ICP (PM di startup o scaleup italiana, team 1-10) è stata sentita, e nessuna delle 23 fonti descrive l'episodio esatto della credenza rischiosa. Resta sconosciuto tutto ciò che la credenza afferma: frequenza delle domande, tempo per rispondere, fiducia nelle risposte degli assistenti generici.

Fonti non accessibili: G2 e TrustRadius (bloccati, errore 403), Product Hunt (solo lodi generiche), Hacker News (nessun episodio pertinente in circa 7 ricerche), fonti italiane (blog e podcast Product Heroes, Medium e LinkedIn in italiano: nessun episodio in prima persona trovato).

### Piano delle interviste (da eseguire)

**Obiettivo:** 6-8 PM dell'ICP, reclutati fuori dalla sala di PHC26, con l'ultimo episodio concreto raccontato in ordine. Deciso dal modello per delega di Mario (2026-09-26). `[doc:user-2026-09-26-delega]`

**Stop:** si smette quando due interviste consecutive non portano nessun modo nuovo di rispondere (o di non rispondere) alla domanda; minimo 6 interviste anche se la saturazione arriva prima, massimo 10 prima di rivedere il segmento. Deciso dal modello per delega di Mario (2026-09-26) `[doc:user-2026-09-26-delega]`

**Criteri di ingresso (screener, 3 domande via messaggio):**
1. Ruolo: PM, Head of Product o founder che fa il PM, in una startup o scaleup italiana con un team di prodotto da 1 a 10 persone.
2. Raccoglie feedback dei clienti da almeno due canali (ticket, call, sondaggi, recensioni, Slack).
3. Negli ultimi 3 mesi ha partecipato ad almeno una decisione di roadmap.

**Esclusi:** chi ha visto Voce o la demo di PHC26; colleghi diretti di Mario in DeepAgent; studenti di Mario nella cohort in corso; Mario stesso. Motivo: chi conosce Mario o l'idea risponde per cortesia.

**Classi da coprire e come raggiungerle:**

| Classe | Quanti | Chi | Come raggiungerli |
|--------|--------|-----|-------------------|
| 1. Ha il problema e paga per risolverlo male | 2 | PM che pagano Productboard, Canny, Featurebase, Dovetail, o un abbonamento ChatGPT/Claude usato sui feedback | Ricerca LinkedIn "Product Manager" in aziende italiane da 10 a 200 persone che citano questi strumenti; rete di Mario di primo grado |
| 2. Ha il problema e tollera | 2-3 | PM con foglio, Notion o canale Slack dei feedback | Rete di Mario; community di product italiane che Mario già frequenta, con messaggio personale e mai un post pubblico |
| 3. Ha provato una soluzione e l'ha abbandonata | 1-2 | PM che ha disdetto uno strumento dedicato, o che ha smesso di usare ChatGPT/NotebookLM sui feedback | Domanda 5.2 del questionario ("conosci qualcuno che ha smesso..."); chiedere a ogni intervistato un nome |
| 4. Sembra ICP ma non ha il problema | 1 | PM di una startup italiana dove la roadmap la decide il founder, o con pochi clienti e feedback in testa | Rete di Mario; chiedere agli intervistati "chi conosci che non guarda mai i feedback?" |

Se la classe 3 resta vuota dopo 8 interviste, il questionario asincrono va a chi l'ha nominata; se resta vuota comunque, la conclusione non potrà dire nulla sul perché i PM smettono di usare gli strumenti, e va scritto. Deciso dal modello per delega di Mario (2026-09-26). `[doc:user-2026-09-26-delega]`

**Canale PHC26 (1 ottobre 2026):** solo reclutamento. A chi si ferma a parlare dopo la masterclass si chiede il contatto per una call nei giorni seguenti; le reazioni alla demo non entrano in questo documento. Chi è reclutato così resta al massimo 2 su 8, perché ha già visto l'idea. Deciso dal modello per delega di Mario (2026-09-26). `[doc:user-2026-09-26-delega]`

**Tempi:** screener e inviti entro il 30 settembre 2026, interviste dal 2 al 9 ottobre 2026, sintesi entro il 10 ottobre 2026. Deciso dal modello per delega di Mario (2026-09-26). `[doc:user-2026-09-26-delega]`

**Questionario asincrono:** `questionnaires/pm-icp-asincrono.md`, per i PM dell'ICP che Mario non riesce a chiamare. Stesse regole della guida. Le risposte in prima persona di un PM dell'ICP si taggano come intervista `Q{n}`.

**Primo compito di Mario, non delegabile:** nominare i primi 5 PM dell'ICP della sua rete. Il modello non conosce le persone e non le inventa.

### Guida all'intervista (45 minuti, in italiano)

Registrare con consenso. Prendere note parola per parola sulle risposte della sezione 2. Il problema non si nomina prima della sezione 3.

**1. Contesto (5 min)**
- Raccontami cosa fai e com'è fatta la tua settimana tipo.
- Com'è fatto il team di prodotto e chi prende le decisioni su cosa costruire?
- Com'è andata l'ultima riunione in cui avete deciso cosa fare nel trimestre o nello sprint? Chi c'era, cosa si è deciso?

**2. L'ultima volta (15 min)**
- In quella riunione, o nei giorni prima, qualcuno ha chiesto qualcosa su cosa dicono o chiedono i clienti? Cosa ha chiesto, con quali parole?
- Se non in quella: qual è l'ultima volta che qualcuno ti ha chiesto una cosa precisa sui clienti? Quando?
- Cosa hai fatto subito dopo? E poi? Quali strumenti hai aperto, in che ordine?
- Quanto tempo è passato prima che tu rispondessi? Quanto ci hai lavorato?
- Cosa hai risposto, alla fine? Con numeri, frasi dei clienti, a memoria?
- Cosa è successo alla decisione? Qualcuno ha contestato la tua risposta?
- E la volta prima di questa?

**3. Il workaround (10 min)**
- Dove sono oggi i feedback dei clienti? Fammi vedere, se puoi condividere lo schermo.
- L'ultima volta che hai usato ChatGPT, Claude, Gemini o NotebookLM su feedback o ticket: cosa hai caricato, cosa hai chiesto, cosa ne hai fatto della risposta?
- Hai controllato la risposta? Come? Ti è capitato di trovarci qualcosa di sbagliato?
- Hai mai provato uno strumento per i feedback e poi l'hai lasciato? Cos'è successo?
- Cosa paghi oggi, in soldi o ore di qualcuno, per tenere in ordine i feedback?

**4. Il confine (5 min)**
- Quando non serve guardare i feedback per decidere? Chi nel team non li guarda mai?
- Quali domande sui clienti ti fanno spesso e a cui rispondi in un attimo? Come?

**5. Chiusura (5 min)**
- Cosa avrei dovuto chiederti e non ti ho chiesto?
- Conosci qualcuno che ha smesso di usare uno strumento per i feedback? Mi presenti?

**Audit della guida.**

| Domanda | Problema | Correzione |
|---------|----------|------------|
| "Ti capita che ti chiedano cose sui feedback?" (prima bozza) | Si risponde sì per cortesia; nomina il problema in sezione 2 | Sostituita da "com'è andata l'ultima riunione" e "qualcuno ha chiesto qualcosa su cosa dicono i clienti?", ancorata a un episodio |
| "Sarebbe utile poter fare domande ai feedback?" (prima bozza) | Domanda sul futuro, misura la cortesia | Eliminata. Nessuna domanda sul futuro nella guida |
| "Quanto è frustrante cercare nei feedback?" (prima bozza) | Presuppone la frustrazione | Sostituita da "cosa hai fatto subito dopo? quanto ci hai lavorato?" |
| "Usi ChatGPT sui feedback?" (prima bozza) | Sì/no | Riscritta come "l'ultima volta che hai usato...: cosa hai caricato, chiesto, fatto" |
| "Hai mai provato uno strumento e l'hai lasciato?" | Resta sì/no in apertura | Tenuta perché seguita subito da "cos'è successo?"; l'intervistatore non accetta un sì senza racconto |
| Sezione 2, prima domanda | Nomina i feedback prima della sezione 3 | Accettato: è la domanda su cui poggia la credenza. Non nomina l'insufficienza dei mezzi, che entra solo in sezione 3 |

Nel questionario asincrono la domanda sui feedback arriva già nella sezione 2, perché senza intervistatore non si può arrivarci per gradi: le risposte del questionario pesano meno di quelle delle call quando i due divergono.

## Participants

| Code | Role | Segment | Class |
|------|------|---------|-------|
| nessuno | Nessuna intervista né questionario ancora svolti | ICP | da reclutare |

Fonti pubbliche estratte (non partecipanti, classe `doc`):

| Fonte | Chi | Tipo | Classe di reclutamento analoga |
|-------|-----|------|-------------------------------|
| dada-man | PM e-commerce | episodio in prima persona | tollerante |
| thibaultzim | PM app sportiva | episodio in prima persona | abbandono (tentativo con ChatGPT) |
| kitchen-ad-4367 | ricercatore qualitativo | episodio in prima persona | confine |
| trowaman | PM | episodio in prima persona | confine |
| just-competition9002 | PM | episodio in prima persona | tollerante |
| frustrated-pm26, ashleygibsonpm, confusedus, rupicolus, poodleface, darcswan, praying4exitz, constantkooky3329, amir-klein | PM | pratica in prima persona, senza episodio datato | misti |
| armok3290, meknoid333, contralle, cheese-bro, patientcauliflower84, caitlin-sullivan | PM e consulenti | opinione o consiglio | secondari |
| capterra: simon-h, katherine-l, senior-pm | recensori | recensione di strumento | paga male o abbandono |

## Evidence

Tutte le fonti sono `doc` estratte dal web. Per la regola stretta di questa fase, conta come primaria solo una fonte che racconta in prima persona un episodio: ce ne sono 5, nessuna di un PM dell'ICP e nessuna con la forma esatta della credenza (domanda precisa, durante una decisione, senza risposta con prove in pochi minuti). Le altre 18 sono secondarie.

**Tema 1: la decisione si prende sul ricordo, non sui feedback raccolti.** Un PM racconta che in azienda foglio condiviso, canale Slack e board Notion raccoglievano feedback ma "Nobody ever went back and read any of it when writing specs", si scriveva la specifica su "2-3 conversations that stuck with them" mentre il problema più frequente del trimestre stava nei ticket non letti `[doc:mined-reddit-frustrated-pm26]`. Un altro dice che i feedback sono "all in my head" `[doc:mined-reddit-rupicolus]`; un terzo che con foglio e Notion era "very hard to [...] see how many people asked for the same thing", finché non è passato a Canny `[doc:mined-reddit-ashleygibsonpm]`. Un PM racconta una decisione concreta in cui non aveva feedback da portare al management per difendere una funzione `[doc:mined-reddit-dada-man]`. Recensioni pre-LLM descrivono lo stesso stato: aneddoti del commerciale e ore passate a scavare in Intercom e CRM `[doc:mined-capterra-productboard-simon-h]`, fogli compilati a mano `[doc:mined-capterra-canny-katherine-l]`. Nessuna di queste fonti descrive una domanda arrivata in riunione: parlano di scrittura di specifiche e di revisioni periodiche.

**Tema 2: il costo è la sintesi periodica, misurato in ore o giorni.** Un PM dedica ogni trimestre "a couple hours a day for a week or so" ai sondaggi di insoddisfazione `[doc:mined-reddit-confusedus]`; un ricercatore ha speso "a full day just rereading" 22 interviste `[doc:mined-reddit-kitchen-ad-4367]`; anche con Productboard la categorizzazione restava "a tedious, manual process" `[doc:mined-reddit-poodleface]`, e un Senior PM ha lasciato Productboard perché "Slowed us down immensely" `[doc:mined-capterra-canny-senior-pm]`. Il costo emerso è quello della sintesi prima della pianificazione, non quello della risposta sotto pressione.

**Tema 3: l'assistente generico viene già usato, con esiti opposti.** Nel giugno 2026 un PM con pochi feedback descrive Claude collegato a Slack, Intercom e Amplitude: "It's not perfect but it takes a few minutes versus the hours it used to take manually" `[doc:mined-reddit-praying4exitz]`. Altri caricano interviste in NotebookLM o Claude, "It saved me hours" `[doc:mined-reddit-constantkooky3329]` `[doc:mined-reddit-patientcauliflower84]`; un PM di monday.com usa un Project di ChatGPT con trascrizioni, sondaggi e CSV come archivio interrogabile `[doc:mined-lenny-amir-klein]`. Dall'altra parte, un tentativo del 2024 con ChatGPT-4 su migliaia di recensioni è fallito alla categorizzazione, con circa il 90% dei commenti etichettati male secondo l'autore `[doc:mined-reddit-thibaultzim]`; un PM giudica l'output dell'AI "super unreliable" `[doc:mined-reddit-cheese-bro]`; una consulente documenta citazioni inventate che restano invisibili "until a stakeholder asks a question you can't answer" `[doc:mined-lenny-caitlin-sullivan]`.

**Tema 4: in alcuni contesti le prove non cambiano la decisione.** Un PM racconta il CEO che impone la sua funzione e conclude che spiegare i bisogni reali "with logic and reason [...] doesn't work" `[doc:mined-reddit-trowaman]`. Un altro riceve richieste dal supporto senza dettagli sul caso d'uso e non riesce a verificarle: il blocco è l'accesso al cliente, non la ricerca nei feedback `[doc:mined-reddit-just-competition9002]`.

## Disconfirming evidence

**Sought:** prima di cercare, stabilito che il frame muore se (a) i PM dicono che domande precise sui feedback arrivano di rado, o che le decisioni non dipendono da quelle risposte; (b) i PM rispondono già in pochi minuti con foglio, ricerca nel testo o assistente generico, e si fidano del risultato; (c) chi ha provato strumenti dedicati li ha lasciati perché bastava un foglio o ChatGPT. Cercato in thread Reddit con ricerche mirate a NotebookLM, ChatGPT, Claude, esportazioni CSV e abbandono di Productboard, su Lenny's Newsletter e su Hacker News. Nelle interviste, la stessa prova è nel falsificatore sopra, fissato prima di qualsiasi call.

**Found:** smentite parziali, nessuna sul punto esatto. (b) Esiste un uso reale e recente di Claude collegato direttamente alle fonti, con tempi di minuti su volumi bassi `[doc:mined-reddit-praying4exitz]`, e di NotebookLM o Claude sulle interviste `[doc:mined-reddit-constantkooky3329]`; esiste un'alternativa senza AI, etichettare all'ingresso per avere conteggi pronti `[doc:mined-reddit-armok3290]`, e nel 2023 un PM riteneva che foglio e ricerca di parole bastassero `[doc:mined-reddit-meknoid333]`. (a) Un PM dice che una revisione trimestrale basta per un prodotto stabile `[doc:mined-reddit-confusedus]`, un altro che le richieste si ignorano finché non diventano un tema `[doc:mined-reddit-darcswan]`, e un altro che il CEO decide comunque `[doc:mined-reddit-trowaman]`. (c) Nessuna fonte trovata. Nessuna di queste smentite viene dall'ICP né da un episodio dell'ultimo mese: indeboliscono la credenza 3 e la frequenza della credenza 1, non la uccidono.

## JTBD

When un founder o un collega mi chiede in una decisione di roadmap cosa dicono i clienti su un tema preciso, I want to rispondere in pochi minuti con numeri e parole dei clienti, so I can difendere la priorità con prove invece che a memoria. `[assumption:unvalidated]` Formulazione del frame, non ancora confermata: le fonti estratte descrivono più spesso un lavoro diverso, sintetizzare i feedback prima di pianificare o scrivere una specifica `[doc:mined-reddit-frustrated-pm26]` `[doc:mined-reddit-confusedus]`.

## Surprises

1. **Nessuna delle 23 fonti racconta l'episodio del frame.** Chi lamenta il problema parla di sintesi periodica e di specifiche scritte a memoria, non di una domanda arrivata in riunione `[doc:mined-reddit-frustrated-pm26]`. Può voler dire che l'episodio è raro, o solo che non si racconta su Reddit: le interviste devono distinguere le due cose.
2. **Il concorrente è già oltre il "copia e incolla l'export".** Nel 2026 un PM descrive Claude collegato direttamente a Slack, Intercom e Amplitude `[doc:mined-reddit-praying4exitz]`. Il frame assume che l'assistente generico richieda di esportare e incollare ogni volta; per chi usa i connettori non è più vero.
3. **La stessa idea è stata proposta su r/ProductManagement a febbraio 2023** (domande in linguaggio naturale sui feedback con risposte basate su prove) e ha ricevuto scetticismo: "similar technology exists today" `[doc:mined-reddit-meknoid333]` e "magic ML fairy dust" per la parte prescrittiva `[doc:mined-reddit-contralle]`.
4. **Le prove possono non contare.** Dove decide il CEO, rispondere meglio non cambia la decisione `[doc:mined-reddit-trowaman]`: è un confine del segmento, non solo un'obiezione.
5. **Due thread su cui poggiano molte fonti sembrano ricerche di mercato di fornitori** (post di account che chiedono "how much time do you spend synthesizing" o "do you actually use your feedback"): i post originali non sono stati usati come evidenza, solo i commenti in prima persona `[doc:mined-reddit-praying4exitz]` `[doc:mined-reddit-frustrated-pm26]`.

## Regola di decisione per le interviste

Fissata prima delle interviste. Deciso dal modello per delega di Mario (2026-09-26). `[doc:user-2026-09-26-delega]`

- Meno della metà degli intervistati ricorda una domanda precisa negli ultimi 30 giorni: la credenza cade, esito "chiuso".
- La ricordano, ma la maggioranza ha risposto in meno di 10 minuti con i mezzi attuali e si è fidata: la credenza cade, esito "chiuso" per questa iniziativa.
- La ricordano e non hanno risposto con prove in pochi minuti: la credenza regge, si passa alla fase 2.
- Il costo reale emerge ma è diverso (per esempio la sintesi prima della pianificazione, non la domanda sotto pressione, come suggeriscono le fonti estratte): esito "rimodellato", con frame da correggere.

## Verdict

**IN SOSPESO.** Nessun esito è sostenibile oggi. Mancano:

- **Unità primarie dall'ICP:** 0 su 5 richieste. Le 5 fonti con un episodio in prima persona `[doc:mined-reddit-dada-man]` `[doc:mined-reddit-thibaultzim]` `[doc:mined-reddit-kitchen-ad-4367]` `[doc:mined-reddit-trowaman]` `[doc:mined-reddit-just-competition9002]` non sono PM di startup italiane e non descrivono la domanda arrivata in una decisione.
- **Fonti distinte sulla credenza rischiosa:** 0 su 5 richieste. Le 18 fonti restanti sono pratiche generali, opinioni o recensioni.
- **Episodi negli ultimi 30 giorni:** 0. Le fonti più recenti sono del 2026-08-18 `[doc:mined-reddit-kitchen-ad-4367]` e del 2026-06-12 `[doc:mined-reddit-praying4exitz]`.

Cosa serve per chiudere: 6-8 interviste secondo il piano sopra, o questionari tornati da PM dell'ICP che raccontano l'ultimo episodio. Le fonti estratte spostano già il peso: il costo della sintesi periodica è documentato `[doc:mined-reddit-confusedus]`, la domanda sotto pressione no, e l'assistente generico collegato alle fonti è un concorrente più forte di quanto il frame assume `[doc:mined-reddit-praying4exitz]`. Il gate non va forzato: una deroga spetta solo a Mario.
