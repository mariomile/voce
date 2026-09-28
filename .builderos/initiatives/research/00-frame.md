# Frame: Voce, Research e customer discovery

**Phase:** 0 · **Cycle:** 1 · **Mode:** lite · **Track:** product · **Date:** 2026-09-28 · **Owner:** Mario Miletta (framing scritto dal modello per delega)

## La richiesta, verbatim

"Voce aiuta i PM a fare customer discovery: parti da una domanda, raccogli le voci dei clienti, ottieni una sintesi con le prove e un verdetto." `[doc:user-2026-09-28-research-round1]`

Una Research è una domanda di ricerca con ipotesi, una raccolta dedicata (modulo pubblico o QR, note di intervista incollate, CSV), temi e Chiedi limitati a quella Research, e un verdetto per ipotesi (confermata / smentita / da rivedere) con le citazioni che lo sostengono. Ogni feedback appartiene a una Research e la casella generica sparisce. `[doc:user-2026-09-28-research-round1]`

È una soluzione: descrive un contenitore, una raccolta e un verdetto, non quale costo toglie né a chi. La scala qui sotto risale al costo.

| Gradino | Affermazione | Stato |
|---------|--------------|-------|
| 0 | Il PM crea una Research con domanda e ipotesi, raccoglie voci dedicate e riceve un verdetto per ipotesi con citazioni | Soluzione |
| 1 | Il PM senza ricercatore fa discovery da solo: parla con clienti, raccoglie risposte e note su una domanda precisa | Attività |
| 2 | Rileggere tutto e confrontarlo con l'ipotesi di partenza richiede ore o giorni, quindi il confronto si fa a metà o salta | Costo, non quantificato |
| 3 | La decisione di prodotto si chiude sulle due o tre conversazioni che il PM ricorda meglio: l'ipotesi passa per confermata senza che nessuno abbia contato le voci a favore e contro, e quando il team chiede "su quali prove?" il PM non ha niente da mostrare | Conseguenza sentita da chi decide |

Il gradino successivo ("perché decidere su prove conta") è un'ovvietà: ci si ferma al 3. Rispetto al frame di Chiedi, il costo si sposta dalla domanda che arriva in riunione alla sintesi che chiude un giro di discovery, che è anche il costo che le fonti estratte in quella fase descrivono più spesso `[doc:mined-reddit-frustrated-pm26]`.

## Problem

Quando un product manager che non ha un ricercatore al suo fianco deve capire se un problema dei clienti è reale prima di investirci, parte da un'idea di cosa sia vero, sente qualche cliente e accumula note, risposte e commenti in posti diversi. Rileggere tutto e metterlo a confronto con l'idea di partenza richiede ore o giorni, e quel lavoro non ha una scadenza, quindi si fa a metà o si salta. La decisione si chiude sulle due o tre conversazioni che il PM ricorda meglio: l'ipotesi passa per confermata senza che nessuno abbia contato le voci a favore e quelle contro, e quando il team o il capo chiede su quali prove, il PM non ha niente da mostrare. `[assumption:unvalidated]`

Cosa lo sostiene oggi, da fonti pubbliche e non dall'ICP. Un PM descrive un'azienda dove foglio condiviso, canale Slack e board Notion raccoglievano feedback ma "Nobody ever went back and read any of it when writing specs": la specifica nasceva da "2-3 conversations that stuck with them" `[doc:mined-reddit-frustrated-pm26]`. Un ricercatore qualitativo racconta di aver speso "a full day just rereading" 22 interviste prima di iniziare a codificare i temi `[doc:mined-reddit-kitchen-ad-4367]`. Nessuna delle due fonti è un PM dell'ICP che parte da un'ipotesi esplicita: il gradino 3 resta da provare.

Dentro Voce, oggi, ogni feedback appartiene solo a un workspace, senza una domanda o un'ipotesi a cui riferirsi `[code:supabase/migrations/20260924225437_create_core_schema.sql:54]`.

## Who

**Primary ICP:** PM che fa discovery senza un ricercatore dedicato, da startup a grande azienda, e decide da solo cosa vale la pena costruire · dimensione non misurata, solo ordini di grandezza da fonti deboli o sbilanciate: in Italia i product manager sono "più di 7.000" secondo una stima di stampa del 2023 senza metodo dichiarato `[doc:icp-product-manager-italia]`; nel report Maze 2025 (800 risposte, solo il 7% PM) il 42% indica i product manager tra chi raccoglie insight in prima persona `[doc:icp-maze-future-of-user-research-2025]`; nel sondaggio User Interviews 2025 (485 risposte, soprattutto ricercatori) quasi il 14% dice che la propria azienda non ha ricercatori dedicati, contro il 6% del 2022 `[doc:icp-user-interviews-state-of-user-research-2025-headcount]`, e il 71% che in azienda fa ricerca anche chi non è ricercatore `[doc:icp-user-interviews-state-of-research-strategy-2025]`; quanti PM italiani lavorano senza ricercatore non è noto `[assumption:unvalidated]` · trigger: una decisione di prodotto da prendere (costruire, rimandare, abbandonare) su cui il PM ha un'ipotesi e poche settimane per sentire i clienti `[assumption:unvalidated]` · signs: il PM stesso, piano Pro a 19 €/mese `[doc:voce-brief]` · reachable via: la sala di PHC26 del 1 ottobre 2026, circa 230 PM `[doc:user-2026-09-26-init]`, la community Product Heroes e la rete di Mario `[assumption:unvalidated]`

**Secondario:** PM e team di prodotto di grandi aziende con research ops `[doc:user-2026-09-28-research-round1]`. Hanno lo stesso lavoro di sintesi, ma lo strumento lo sceglie e lo paga chi fa research, e spesso ce l'hanno già (Dovetail, Condens, EnjoyHQ dentro UserTesting, Maze) `[doc:priorart-condens]` `[doc:priorart-enjoyhq]`. Restano secondari.

**Scelta del primario: presa dal modello per delega.** Mario ha indicato "Anche per grandi aziende" `[doc:user-2026-09-28-research-round1]`; BuilderOS chiede un solo primario. Il primario è definito dall'assenza del ricercatore, non dalla dimensione dell'azienda, perché è chi fa sintesi da solo e non ha già uno strumento di research. Deciso dal modello per delega di Mario (2026-09-28). Da confermare con Mario.

**Dimensione, lettura onesta.** Nessun numero misura il segmento. Il dato sui PM italiani è vecchio e senza metodo. I due sondaggi internazionali sono raccolti soprattutto tra ricercatori, quindi sottostimano per costruzione le aziende senza ricercatori: nello stesso campione User Interviews l'87% ha ricercatori dedicati `[doc:icp-user-interviews-state-of-research-strategy-2025]`, un numero che dice chi risponde al sondaggio, non com'è il mercato. Il rapporto più citato, del 2020, è di un ricercatore ogni 5 designer e 50 sviluppatori `[doc:icp-nngroup-researcher-designer-ratio]`: vecchio e senza i PM, dice solo che i ricercatori sono pochi rispetto a chi costruisce. Servono per dire che il PM che fa ricerca da solo esiste ed è comune, non quanti sono.

**Raggiungibilità.** Nessun PM dell'ICP è utente di Voce e nessuno è stato intervistato: lo stato è lo stesso dell'iniziativa Chiedi, ancora senza interviste. La sala di PHC26 serve a reclutare, non a validare: una reazione alla demo dal vivo non è una prova. Primo compito della fase 1: Mario nomina cinque PM senza ricercatore della sua rete da sentire questa settimana.

## Today

**Workaround:** rileggere a mano note e risposte; incollare trascrizioni in un foglio collegato a ChatGPT `[doc:mined-reddit-kitchen-ad-4367]`; caricare le interviste in NotebookLM o Claude e farsi scrivere una sintesi, "It saved me hours" `[doc:mined-reddit-constantkooky3329]`; collegare Claude direttamente a Slack, Intercom e Amplitude per una "directional synthesis" in pochi minuti `[doc:mined-reddit-praying4exitz]`; oppure saltare la sintesi e scrivere la specifica su ciò che si ricorda `[doc:mined-reddit-frustrated-pm26]`. NotebookLM, lo strumento generico più vicino, è gratuito nel piano base `[doc:priorart-notebooklm]`. Quale di questi usi davvero l'ICP, e se parte da un'ipotesi esplicita, non è noto `[assumption:unvalidated]`

**Cost:** tempo di rilettura (una giornata per 22 interviste nel caso di un ricercatore, non di un PM `[doc:mined-reddit-kitchen-ad-4367]`); decisioni prese su un campione ricordato invece che su tutte le voci raccolte `[doc:mined-reddit-frustrated-pm26]`; con gli assistenti generici, citazioni inventate che restano invisibili "until a stakeholder asks a question you can't answer" `[doc:mined-lenny-caitlin-sullivan]`. Nessuna quantificazione per l'ICP `[assumption:unvalidated]`

## Why now

Tre cambiamenti datati. Nessuno rende il problema nuovo: spostano la ricerca verso chi non è ricercatore e rendono economica la raccolta, lasciando la sintesi contro un'ipotesi dove era.

1. **Comportamento cambiato: la ricerca la fanno i non ricercatori, 2025.** Nel report Maze 2025, con sondaggio tra il 2024-12-10 e il 2025-01-10, designer (70%) e product manager (42%) risultano tra chi raccoglie insight, "research is becoming a company-wide effort" `[doc:icp-maze-future-of-user-research-2025]`. Nel report User Interviews pubblicato il 2025-10-22, il 71% delle organizzazioni ha persone che fanno ricerca senza essere ricercatori `[doc:icp-user-interviews-state-of-research-strategy-2025]`, e nel 2025 il 21% dei rispondenti dice che la propria azienda ha licenziato ricercatori, in linea col 2024 `[doc:icp-user-interviews-state-of-user-research-2025-headcount]`. Limite: campioni fatti soprattutto di ricercatori.
2. **Costo della raccolta crollato: le interviste condotte da un modello, settembre 2025 - gennaio 2026.** Il 2025-09-24 Maze ha lanciato AI moderator, con un messaggio rivolto proprio all'ICP: "When PMs need to run research but lack the confidence or bandwidth [...] no researcher required" `[doc:whynow-maze-ai-moderator-launch]`; è un componente aggiuntivo dei soli piani Enterprise `[doc:priorart-maze]`. Il 2026-01-14 Listen Labs, interviste ai clienti condotte da un modello, ha annunciato una Serie B per 100 milioni di dollari di finanziamento totale e dichiara più di un milione di persone intervistate `[doc:whynow-listen-labs-series-b]`. Il 2025-10-08 Dovetail ha lanciato la sua piattaforma di "customer intelligence" con chat sui dati dei clienti `[doc:priorart-dovetail]`. Più voci raccolte a basso costo significa più materiale da confrontare con l'ipotesi: il collo di bottiglia si sposta sulla sintesi `[assumption:unvalidated]`.
3. **Soglia di capacità superata, 2025-01-23.** Anthropic ha rilasciato Citations: le risposte citano le frasi esatte dei documenti forniti `[doc:whynow-anthropic-citations]`. Voce già scarta ogni citazione che non compare nel feedback carattere per carattere `[code:src/lib/analysis.ts:215]`: il costo di una sintesi verificabile è sceso, ed è la risposta al rischio di citazioni inventate descritto sopra.

Il problema di fondo (decidere su prove invece che sul ricordo) è durevole. La ragione strutturale per cui resta aperto per il PM senza ricercatore, per ipotesi, è che gli strumenti di research sono prezzati e pensati per team di ricerca, e quelli generici non tengono insieme domanda, ipotesi e voci `[assumption:unvalidated]`

## Riskiest assumption

Un PM dell'ICP, nel suo ultimo giro di discovery degli ultimi 60 giorni, partiva da una domanda o da un'ipotesi che sa ancora nominare, e ha chiuso la decisione senza aver confrontato in modo sistematico tutte le voci raccolte con quell'ipotesi, perché con i mezzi che usa (rilettura, foglio, ChatGPT, Claude o NotebookLM) farlo costava troppo tempo o dava un risultato di cui non si fidava. `[assumption:unvalidated]`

**Would be falsified by:** in 6-8 interviste a PM dell'ICP reclutati fuori dalla sala di PHC26, chiedendo di raccontare l'ultimo giro di discovery degli ultimi 60 giorni: meno della metà sa nominare la domanda o l'ipotesi da cui partiva (la loro discovery non è guidata da ipotesi, e il contenitore domanda più ipotesi più verdetto non corrisponde al loro lavoro); oppure la maggioranza di chi la nomina dice di aver confrontato le voci con l'ipotesi in meno di due ore con i mezzi attuali e di essersi fidata del risultato abbastanza da difenderlo davanti al team. Soglie decise dal modello per delega di Mario (2026-09-28) `[doc:user-2026-09-28-research-round1]`

Perché questa e non un'altra: tiene insieme le due credenze che, se false, fanno crollare il riposizionamento. Se i PM non partono da ipotesi, l'unità "Research con ipotesi e verdetto" è la forma del lavoro di un ricercatore imposta a chi non lo è. Se partono da ipotesi ma chiudono il confronto in fretta e con fiducia con ChatGPT o NotebookLM, il problema è già risolto e Voce è solo comodità. La fiducia in un verdetto generato (credenza 5) è rischiosa ma viene dopo.

## Prior art

**Classificazione: per chi ha ricercatori, risolto e adottato; per il PM senza ricercatore, risolto male e adottato comunque.** Per il primario è la posizione di partenza più forte: la cosa da capire in fase 1 è il costo di passaggio dall'assistente generico.

- **Dovetail:** repository e piattaforma di "customer intelligence" lanciata il 2025-10-08, chat sui dati e documenti con citazioni; piano gratuito limitato a un progetto, poi Enterprise su preventivo; clienti enterprise `[doc:priorart-dovetail]`. Risolto e adottato, per team di ricerca.
- **Condens:** repository di ricerca con risposte "evidence-backed"; Lite 15 €/mese per contributor, Business da 500 €/mese; clienti come KPMG e Accenture `[doc:priorart-condens]`. Risolto e adottato, per team di ricerca.
- **EnjoyHQ:** acquisita da UserZoom il 2021-04-15, UserZoom fusa in UserTesting il 2023-04-03; oggi è un tipo di workspace dentro UserTesting, senza prezzo proprio `[doc:priorart-enjoyhq]`. Assorbita nell'enterprise.
- **Maze:** raccolta e interviste condotte da un modello, con un messaggio diretto ai PM senza ricercatore; AI moderator solo come aggiunta ai piani Enterprise, piano gratuito limitato a uno studio, prezzi da fonte terza `[doc:priorart-maze]`. Il più vicino all'ICP, ma sul lato raccolta.
- **Productboard Spark:** risposte sui feedback che risalgono alla fonte, circa 15 $ per maker al mese secondo una sintesi non riverificata `[doc:priorart-productboard]`. Vicino, ma legato alla roadmap, non a una domanda di ricerca.
- **Notably:** sintesi di ricerca qualitativa con template; pagina prezzi ufficiale non raggiungibile, fonte terza, debole `[doc:priorart-notably]`.
- **NotebookLM (ora Gemini Notebook):** carichi le fonti, chiedi, ricevi risposte citate; gratuito nel piano base; generico `[doc:priorart-notebooklm]`. È il concorrente vero per il primario, insieme a ChatGPT e Claude `[doc:mined-reddit-constantkooky3329]`.

Nessuno dei prodotti controllati espone un'ipotesi con un verdetto (confermata / smentita / da rivedere): Condens usa "evidence-backed answers [...] not assumptions" come garanzia di accuratezza, Maze chiede "Is this the right problem to solve?" come messaggio, non come oggetto del prodotto `[doc:priorart-condens]` `[doc:priorart-maze]`. L'assenza può voler dire spazio libero o che nessuno lo chiede: lo dice la credenza rischiosa.

Decisione: procedere alla fase 1. Deciso dal modello per delega di Mario (2026-09-28) `[doc:user-2026-09-28-research-round1]`

## Beliefs this frame requires

| Belief | Confidence | Collapse if wrong |
|--------|-----------|-------------------|
| 1. Il PM dell'ICP fa discovery a giri delimitati, legati a una decisione, non solo in modo continuo e sparso | Media | Alto: la Research come contenitore non corrisponde al lavoro |
| 2. All'inizio di un giro ha una domanda o un'ipotesi che sa nominare | Bassa | Totale: senza ipotesi non c'è verdetto |
| 3. Il confronto sistematico tra voci e ipotesi oggi salta o si fa a metà, per tempo o sfiducia | Bassa | Totale: il problema è già risolto |
| 4. ChatGPT, Claude o NotebookLM non danno un confronto con prove di cui il PM si fida abbastanza da difenderlo | Bassa | Alto: il concorrente gratuito basta |
| 5. Il PM si fida di un verdetto generato con citazioni verificate abbastanza da portarlo al team | Media | Alto, ma solo se 2 e 3 reggono |
| 6. Le voci arrivano dai canali che Voce copre (modulo, note incollate, CSV), non solo da registrazioni di call che Voce non trascrive `[doc:user-2026-09-28-research-round1]` | Media | Medio: le note si incollano, ma è lavoro in più |
| 7. Il PM senza ricercatore paga da sé una cifra piccola, senza passare da un team di research `[doc:voce-brief]` | Media | Medio: cambia il prezzo, non il problema |
| 8. I PM dell'ICP adotteranno Voce, prerequisito di tutto | Bassa | Totale, ma è la scommessa del prodotto intero |

La più rischiosa è la combinazione di 2 e 3: confidenza bassa, crollo totale.

## Decisioni prese per delega

Mario ha delegato con "fai tutto tu" `[doc:user-2026-09-28-research-round1]`. Ogni scelta qui sotto è "Deciso dal modello per delega di Mario (2026-09-28)" e va rivista da lui.

1. Problema al gradino 3 (decisione chiusa sul ricordo invece che sul confronto con tutte le voci), non al gradino 1 (fare discovery da soli).
2. ICP primario: il PM che fa discovery senza un ricercatore dedicato, da startup a grande azienda; secondario il PM di grande azienda con research ops. Scelta del modello, segnalata come tale.
3. Dimensione dell'ICP lasciata come ordine di grandezza da fonti deboli o sbilanciate verso i ricercatori, senza calcolare un numero di PM che nessuna fonte misura.
4. Credenza rischiosa: discovery guidata da ipotesi e confronto oggi saltato, insieme, invece della fiducia nel verdetto generato.
5. Soglie di falsificazione: meno della metà che nomina l'ipotesi di partenza, oppure maggioranza che ha fatto il confronto in meno di due ore con i mezzi attuali e se ne è fidata; finestra di 60 giorni perché i giri di discovery sono meno frequenti delle domande in riunione. `[doc:user-2026-09-28-research-round1]`
6. Prior art: procedere, con l'assistente generico come concorrente da battere e Maze come il più vicino all'ICP.
7. PHC26 è un canale per reclutare, non una prova: le reazioni alla demo dal vivo non entrano come evidenza.

## Obiettivo che la fase 1 eredita

Verificare con 6-8 PM senza ricercatore dedicato, reclutati fuori dalla sala di PHC26, com'è andato il loro ultimo giro di discovery negli ultimi 60 giorni: da quale domanda o ipotesi partivano, dove hanno raccolto le voci, come le hanno confrontate con l'ipotesi, quanto tempo ci hanno messo, con quali mezzi, se si sono fidati del risultato e cosa è successo alla decisione. Episodi concreti, non opinioni sulla Research. Riusare le fonti estratte per Chiedi solo come contesto: nessuna descrive un PM dell'ICP che parte da un'ipotesi. `[assumption:unvalidated]`
