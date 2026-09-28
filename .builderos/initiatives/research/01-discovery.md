# Discovery: Voce, Research e customer discovery

**Phase:** 1 · **Cycle:** 1 · **Mode:** lite · **Date:** 2026-09-28 · **Owner:** Mario Miletta (piano e ricerca su fonti pubbliche scritti dal modello per delega)

## Assumption under test

Un PM dell'ICP, nel suo ultimo giro di discovery degli ultimi 60 giorni, partiva da una domanda o da un'ipotesi che sa ancora nominare, e ha chiuso la decisione senza aver confrontato in modo sistematico tutte le voci raccolte con quell'ipotesi, perché con i mezzi che usa (rilettura, foglio, ChatGPT, Claude o NotebookLM) farlo costava troppo tempo o dava un risultato di cui non si fidava. `[assumption:unvalidated]`

**Would be falsified by:** in 6-8 interviste a PM dell'ICP reclutati fuori dalla sala di PHC26, chiedendo di raccontare l'ultimo giro di discovery degli ultimi 60 giorni: meno della metà sa nominare la domanda o l'ipotesi da cui partiva; oppure la maggioranza di chi la nomina dice di aver confrontato le voci con l'ipotesi in meno di due ore con i mezzi attuali e di essersi fidata del risultato abbastanza da difenderlo davanti al team. Soglie ereditate dal frame, decise dal modello per delega di Mario (2026-09-28) `[doc:user-2026-09-28-research-round1]`

## Method

0 interviste, 0 questionari tornati: Voce non ha utenti e nessun PM dell'ICP è stato sentito. Questa sessione ha prodotto il piano e una ricerca su fonti pubbliche il 2026-09-28:

- **Rilettura delle 23 fonti estratte per Chiedi** contro questa credenza, con classificazione primaria o secondaria e ICP per ciascuna; copiate in `evidence/` senza toccare gli originali.
- **Nuova estrazione di episodi in prima persona** su Reddit (r/ProductManagement, r/UXResearch, r/SaaS, letti tramite l'archivio arctic-shift perché reddit.com blocca l'accesso diretto), Indie Hackers, Substack, Medium (tramite Wayback), Product Talk, Mind the Product e Hacker News (API Algolia): 23 fonti nuove in `evidence/mined-*.md`, ogni citazione riletta sulla pagina originale. Fonti italiane, vault di Mario e segnalibri X cercati senza trovare nessun episodio in prima persona.
- **Prior art verificata sulle pagine dei fornitori** per 12 prodotti (Dovetail, Condens, Maze, Notably, Productboard, EnjoyHQ, NotebookLM e 5 entranti vicini: Vistaly, Strategyzer, Great Question, Marvin, Looppanel), in `evidence/priorart-*.md`.

Capacità disponibili: file, shell, ricerca e lettura web. Nessun analytics, nessun database di produzione, nessuna trascrizione: le interviste restano l'unica fonte primaria possibile per l'ICP.

**Saturation reached:** no. Nessun PM dell'ICP è stato sentito. Resta sconosciuto tutto ciò che la credenza afferma per l'ICP: se nomina un'ipotesi di partenza, se il confronto con le voci salta o si fa a metà, quanto costa, e se si fida degli assistenti generici.

### Piano delle interviste (da eseguire dopo il 1 ottobre 2026)

**Obiettivo:** 6-8 PM senza un ricercatore dedicato al loro prodotto, reclutati fuori dalla sala di PHC26, ciascuno con il racconto dell'ultimo giro di discovery degli ultimi 60 giorni. Deciso dal modello per delega di Mario (2026-09-28) `[doc:user-2026-09-28-research-round1]`

**Stop:** si smette quando due interviste consecutive non portano nessun modo nuovo di chiudere un giro di discovery (nuovo modo di sintetizzare, nuovo motivo per saltare il confronto, nuovo strumento, nuovo motivo di fiducia o sfiducia). Minimo 6 anche se la saturazione arriva prima, massimo 10 prima di rivedere il segmento; se startup e grande azienda divergono, la saturazione si valuta separatamente e si sale a 5 per sotto-segmento. Deciso dal modello per delega di Mario (2026-09-28) `[doc:user-2026-09-28-research-round1]`

**Screener (4 domande via messaggio, nessuna nomina ipotesi o sintesi):**
1. Ruolo: PM, Head of Product, product owner con responsabilità di decisione, o founder che fa il PM.
2. "C'è qualcuno in azienda il cui lavoro principale è fare ricerca con utenti o clienti, e lavora sul tuo prodotto?" Entra chi risponde no. Chi risponde sì va tra i confini (classe 4), al massimo uno.
3. "Negli ultimi 60 giorni hai parlato con almeno tre clienti o utenti, o raccolto le loro risposte scritte?" Entra chi risponde sì; chi risponde no è candidato alla classe 4.
4. Dimensione dell'azienda e settore, per coprire sia startup sia aziende grandi.

**Esclusi:** chi ha visto Voce o la demo di PHC26; colleghi diretti di Mario in DeepAgent; studenti della cohort Product Heroes in corso; chi ha già risposto al questionario di Chiedi. Motivo: chi conosce Mario o l'idea risponde per cortesia.

**Classi da coprire e come raggiungerle:**

| Classe | Quanti | Chi | Come raggiungerli |
|--------|--------|-----|-------------------|
| 1. Ha il problema e paga per risolverlo male | 2 | PM che pagano Dovetail, Condens, Maze, Notably, o un abbonamento ChatGPT, Claude o Gemini usato su interviste e risposte | Rete di primo grado di Mario; ricerca LinkedIn di PM che citano questi strumenti nel profilo o nei post |
| 2. Ha il problema e tollera | 2-3 | PM che rileggono note, documenti o fogli a mano | Rete di Mario; community di product italiane, sempre con messaggio personale |
| 3. Ha provato una soluzione e l'ha abbandonata | 1-2 | PM che hanno disdetto uno strumento di ricerca, o smesso di usare NotebookLM o ChatGPT sulle interviste | Domanda 5.2 della guida e del questionario a ogni intervistato; post in prima persona trovati nell'estrazione, contattati solo se l'autore è identificabile e raggiungibile |
| 4. Sembra ICP ma non ha il problema | 1-2 | PM che fa discovery continua senza giri legati a una decisione; PM di azienda dove decide il founder; un PM con ricercatore dedicato come confine | Rete di Mario; domanda "chi conosci che non sente mai i clienti?" |

Se la classe 3 resta vuota dopo 8 interviste, il questionario va a chi l'ha nominata; se resta vuota comunque, la conclusione non potrà dire nulla sul perché i PM lasciano gli strumenti, e va scritto nel verdetto. Deciso dal modello per delega di Mario (2026-09-28) `[doc:user-2026-09-28-research-round1]`

**Canale PHC26 (1 ottobre 2026):** solo reclutamento. A chi si ferma a parlare si chiede il contatto per una call nei giorni seguenti; le reazioni alla demo non entrano. Chi è reclutato così resta al massimo 2 su 8. Deciso dal modello per delega di Mario (2026-09-28) `[doc:user-2026-09-28-research-round1]`

**Tempi:** Mario nomina i primi 5 PM della sua rete e invia screener e inviti dal 2 al 5 ottobre 2026; interviste dal 6 al 16 ottobre 2026; sintesi e verdetto entro il 20 ottobre 2026. La finestra dei 60 giorni si conta dalla data di ogni intervista. Deciso dal modello per delega di Mario (2026-09-28) `[doc:user-2026-09-28-research-round1]`

**Questionario asincrono:** `questionnaires/pm-senza-ricercatore.md`, per i PM dell'ICP che Mario non riesce a chiamare, inviato dal 2 ottobre 2026. Le risposte in prima persona di un PM dell'ICP si taggano come interviste, con codice Q seguito dal numero del rispondente e testo integrale in `evidence/`. Deciso dal modello per delega di Mario (2026-09-28) `[doc:user-2026-09-28-research-round1]`

**Primo compito di Mario, non delegabile:** nominare i primi 5 PM senza ricercatore della sua rete. Il modello non conosce le persone e non le inventa.

### Guida all'intervista (45 minuti, in italiano)

Registrare con consenso, note parola per parola sulla sezione 2. Le parole "ipotesi", "verdetto", "sintesi" e "confronto" non si pronunciano prima della sezione 3. L'intervistatore non accetta un sì o un no senza un racconto.

**1. Contesto (5 min)**
- 1.1 Raccontami cosa fai e com'è fatta la tua settimana tipo.
- 1.2 Com'è fatto il team di prodotto? Chi decide cosa costruire?
- 1.3 C'è qualcuno in azienda che fa ricerca con gli utenti di mestiere? Con te lavora?

**2. L'ultima volta (15 min)**
- 2.1 Qual è l'ultima volta, negli ultimi due mesi, in cui hai parlato con clienti o utenti, o raccolto le loro risposte, per capire qualcosa? Quando, con quante persone?
- 2.2 Perché proprio allora? Cosa stava succedendo nel prodotto o in azienda?
- 2.3 Com'è iniziata? Chi hai sentito per primo, come li hai scelti?
- 2.4 Prima della prima call, cosa ti aspettavi di sentire? Come l'avresti detto allora?
- 2.5 Dove sono finite le cose che ti hanno detto? Me lo fai vedere, se puoi condividere lo schermo?
- 2.6 Dopo l'ultima conversazione, cosa hai fatto con quel materiale? E poi? Quali strumenti hai aperto, in che ordine?
- 2.7 Quanto tempo ci hai lavorato, da quando avevi tutto a quando avevi una conclusione?
- 2.8 Hai ripreso tutte le conversazioni o solo alcune? Quali, e perché quelle?
- 2.9 Qual è stata la conclusione? Cosa si è deciso, e chi l'ha deciso?
- 2.10 Quando l'hai presentata, qualcuno ha chiesto su cosa si basava? Cosa hai mostrato?
- 2.11 E il giro prima di questo, com'era andato?

**3. Il workaround (10 min)**
- 3.1 L'ultima volta che hai usato ChatGPT, Claude, Gemini o NotebookLM su interviste o risposte di clienti: cosa hai caricato, cosa hai chiesto, cosa ne hai fatto della risposta?
- 3.2 Hai ricontrollato la risposta sulle conversazioni originali? Come? Ci hai trovato qualcosa di sbagliato?
- 3.3 Nel giro che mi hai raccontato, quello che pensavi all'inizio si è confermato, smentito, o non l'hai verificato? Come lo sai?
- 3.4 Hai provato uno strumento per la ricerca o per le interviste e poi l'hai lasciato? Cos'è successo?
- 3.5 Cosa paghi oggi, in soldi o in ore tue o di altri, per mettere ordine in quello che dicono i clienti?

**4. Il confine (5 min)**
- 4.1 Quali decisioni di prodotto si prendono da voi senza sentire nessun cliente? Chi le prende, su cosa?
- 4.2 Quando hai sentito clienti senza avere niente da decidere? Cosa ne è venuto fuori?

**5. Chiusura (5 min)**
- 5.1 Cosa avrei dovuto chiederti e non ti ho chiesto?
- 5.2 Conosci qualcuno che ha smesso di usare uno strumento di ricerca o di sintesi, o che non sente mai i clienti? Mi presenti?

**Audit della guida.**

| Domanda (prima bozza o finale) | Problema | Correzione |
|---------|----------|------------|
| "Da quale ipotesi partivi?" (bozza) | Presuppone che ci fosse un'ipotesi: chi non l'aveva ne costruisce una per cortesia, e il falsificatore non si può più osservare | Sostituita da 2.2 "perché proprio allora?" e 2.4 "cosa ti aspettavi di sentire?"; conta solo ciò che emerge entro la 2.4 |
| "Fai discovery partendo da ipotesi?" (bozza) | Si risponde sì per cortesia; è sul metodo in generale, non su un episodio | Eliminata. La domanda è l'episodio 2.1-2.11 |
| "Hai confrontato le interviste con la tua ipotesi?" (bozza) | Sì/no che nomina il problema in sezione 2 e suggerisce la risposta giusta | Sostituita da 2.6-2.8 "cosa hai fatto con quel materiale, quanto tempo, tutte o solo alcune?" |
| "Quanto è faticoso sintetizzare le interviste?" (bozza) | Presuppone la fatica | Sostituita da 2.7 "quanto tempo ci hai lavorato?" |
| "Useresti uno strumento che ti dà un verdetto per ipotesi?" (bozza) | Domanda sul futuro, misura la cortesia e fa pitch | Eliminata. Nessuna domanda sul futuro nella guida |
| "Ti fidi di ChatGPT per sintetizzare?" (bozza) | Opinione, sì/no | Sostituita da 3.1-3.2 sull'ultima volta e sul controllo fatto |
| 1.3 "C'è qualcuno che fa ricerca di mestiere?" | Sì/no | Tenuta: è un filtro di segmento, non una domanda sul problema; se sì, si chiede "cosa fa per te?" |
| 3.3 "si è confermato, smentito, o non l'hai verificato?" | Nomina gli esiti del verdetto e arriva dopo che l'intervistato ha già raccontato la sezione 2 | Tenuta in sezione 3 apposta: le risposte dopo questo punto non contano per "ipotesi nominata" |
| 3.4 "Hai provato uno strumento e l'hai lasciato?" | Sì/no in apertura | Tenuta perché seguita da "cos'è successo?"; nessun sì accettato senza racconto |
| 4.2 "Quando hai sentito clienti senza avere niente da decidere?" | Presuppone che capiti | Tenuta: serve a trovare la discovery non legata a una decisione (smentita della credenza 1); "mai" è una risposta valida e va registrata |

Controllo finale: nessuna domanda sul futuro; nessuna domanda della sezione 1 e 2 nomina ipotesi, verdetto, sintesi o strumenti; ogni sì/no rimasto è seguito da una richiesta di racconto.

## Participants

| Code | Role | Segment | Class |
|------|------|---------|-------|
| nessuno | Nessuna intervista né questionario ancora svolti | PM senza ricercatore dedicato | da reclutare |

Fonti pubbliche lette (non partecipanti, classe `doc`). "Primaria" solo quando il testo è il racconto in prima persona di un episodio vissuto da chi scrive; tutto il resto è secondario. "ICP" solo quando il testo dice che l'autore è un PM o founder-PM senza un ricercatore dedicato.

| Fonte | Chi | Primaria o secondaria | ICP | Classe analoga |
|-------|-----|------|-----|------|
| `[doc:mined-indiehackers-james-paden]` | founder-PM, 15+ interviste, 2022 | primaria | sì, con riserva | tollerante |
| `[doc:mined-substack-else-van-der-berg]` | advisor e interim product lead, 50+ trascrizioni | primaria | non verificabile | paga male (Claude Code) |
| `[doc:mined-producttalk-teresa-torres-ai-synthesis]` | coach di discovery, test di ChatGPT sulle sue interviste | primaria | no | abbandono (sintesi solo AI) |
| `[doc:mined-indiehackers-alexander-chen]` | maker solo, costruisce senza validare | primaria | no | confine |
| `[doc:mined-substack-productpill]` | APM, campagna di reclutamento | primaria | non verificabile | confine (collo di bottiglia altrove) |
| `[doc:mined-reddit-cold-hall-5384]` | team SaaS di 18 persone, adotta Dovetail | primaria | non verificabile | paga male |
| `[doc:mined-reddit-similarities]` | designer UX da sola, freelance, Dovetail | primaria | no | paga male |
| `[doc:mined-reddit-aikhuda]` | migliaia di ticket etichettati a mano per una metrica | primaria | non verificabile | tollerante |
| `[doc:mined-reddit-dada-man]` | PM e-commerce davanti al management | primaria | non verificabile | tollerante |
| `[doc:mined-reddit-thibaultzim]` | PM app sportiva, processo con ChatGPT | primaria | non verificabile | abbandono |
| `[doc:mined-reddit-kitchen-ad-4367]` | ricercatore qualitativo, 22 interviste | primaria | no | confine |
| `[doc:mined-reddit-trowaman]` | PM, il CEO impone la funzione | primaria | non verificabile | confine |
| `[doc:mined-reddit-just-competition9002]` | PM, richieste dal supporto senza accesso al cliente | primaria | non verificabile | confine |
| `[doc:mined-reddit-governmentbroad2054]` | PM di prodotto 0-1 senza ricercatore | secondaria (pratica, niente episodio) | sì | paga male (AI) |
| `[doc:mined-reddit-waste-mastodon2646]`, `[doc:mined-reddit-solid-aardvark-4590]`, `[doc:mined-reddit-georgeharter]`, `[doc:mined-reddit-khanhhuy]`, `[doc:mined-reddit-freekiltman]`, `[doc:mined-reddit-swirls109]`, `[doc:mined-reddit-chance-back4949]` | commenti di PM o founder | secondaria (opinioni o pratiche senza episodio) | non verificabile, tranne chance-back4949 (founder senza ricercatore) | misti |
| `[doc:mined-reddit-ttorres]`, `[doc:mined-reddit-droid3562]`, `[doc:mined-substack-valerie-ehrlich]`, `[doc:mined-mtp-dilip-chetan]`, `[doc:mined-lenny-caitlin-sullivan]` | coach, ricercatori, consulenti | secondaria | no | confine |
| `[doc:mined-medium-aakash-gupta-claude-code]`, `[doc:mined-hn-paulshin]`, `[doc:mined-indiehackers-insightlab-founder]` | autori che vendono un corso o uno strumento | secondaria (contenuto promozionale) | non verificabile | misti |
| Le altre 18 fonti di Chiedi rilette: `[doc:mined-reddit-frustrated-pm26]`, `[doc:mined-reddit-praying4exitz]`, `[doc:mined-reddit-constantkooky3329]`, `[doc:mined-reddit-confusedus]`, `[doc:mined-reddit-darcswan]`, `[doc:mined-reddit-cheese-bro]`, `[doc:mined-reddit-armok3290]`, `[doc:mined-reddit-meknoid333]`, `[doc:mined-reddit-contralle]`, `[doc:mined-reddit-patientcauliflower84]`, `[doc:mined-reddit-poodleface]`, `[doc:mined-reddit-rupicolus]`, `[doc:mined-reddit-ashleygibsonpm]`, `[doc:mined-lenny-amir-klein]`, `[doc:mined-capterra-canny-katherine-l]`, `[doc:mined-capterra-canny-senior-pm]`, `[doc:mined-capterra-productboard-simon-h]` | PM, founder, recensori | secondaria | non verificabile, amir-klein no | misti |

Conteggio onesto: 46 fonti estratte lette, 13 primarie, 1 sola primaria dall'ICP (James Paden, con riserva: founder-PM, episodio del 2022, prima degli assistenti generici) `[doc:mined-indiehackers-james-paden]`. Nessuna è un'intervista, nessuna è un PM italiano, e nessuna racconta l'episodio esatto della credenza negli ultimi 60 giorni.

## Evidence

Tutte le fonti sono `doc` estratte dal web e riguardano persone fuori dall'ICP o non verificabili come ICP. Descrivono la forma del problema; non dicono quanto è diffuso tra i PM senza ricercatore.

**Tema 1: partire da un'ipotesi nominabile succede, ma non è l'unica forma della discovery.** Un founder-PM racconta un giro di più di 15 interviste in cui "I made a list of assumptions" e ha scritto le domande per "validate or invalidate my assumptions" `[doc:mined-indiehackers-james-paden]`. Un founder tecnico che fa discovery da solo nel settembre 2026 parte da un lavoro da verificare e scrive "I'm still validating it, not sure if it's a real pain point" `[doc:mined-reddit-chance-back4949]`. Un APM scrive che "Every decision that a PM makes is an educated guess (hypothesis) at best" `[doc:mined-substack-productpill]`. Dall'altra parte, una advisor con più di 50 trascrizioni descrive una discovery continua in cui ICP e domande cambiano di continuo: "I'm constantly refining the ICP, revising interview questions, and shifting focus between opportunities" `[doc:mined-substack-else-van-der-berg]`; un PM rivede i sondaggi una volta a trimestre cercando "common themes", senza un'ipotesi di partenza `[doc:mined-reddit-confusedus]`; un altro scarta le richieste "until it becomes a recurring theme" `[doc:mined-reddit-darcswan]`; un maker salta ogni validazione per scelta `[doc:mined-indiehackers-alexander-chen]`. Il prodotto più vicino per pubblico e prezzo, Vistaly, organizza la discovery attorno all'albero delle opportunità di Teresa Torres, non attorno a ipotesi `[doc:priorart-vistaly]`.

**Tema 2: il confronto con tutte le voci salta o si fa a metà, e il motivo dichiarato è il tempo.** "Synthesis is where it dies honestly [...] turning messy conversations into something a VP will act on takes hours. That's where most PMs give up and just go with their gut anyway", in un thread dell'aprile 2026 intitolato proprio alla discovery senza ricercatore `[doc:mined-reddit-waste-mastodon2646]`. Nello stesso thread un altro commentatore, che sta costruendo uno strumento concorrente, stima la sintesi in "2-3 days you don't have" `[doc:mined-reddit-solid-aardvark-4590]`. Un PM racconta specifiche scritte su "2-3 conversations that stuck with them" `[doc:mined-reddit-frustrated-pm26]`. Un team SaaS di 18 persone dice di aver adottato Dovetail per il feedback "we were collecting but never synthesizing" `[doc:mined-reddit-cold-hall-5384]`. Quando il contesto cambia, la advisor con 50 trascrizioni dovrebbe rileggerle tutte: "In practice, I just start over" `[doc:mined-substack-else-van-der-berg]`. Teresa Torres avverte i PM che non torneranno sulle note: "Don't assume you'll watch it again later or that you'll revisit your notes. You likely won't." `[doc:mined-reddit-ttorres]`. Un caso diverso: il founder-PM con la lista di ipotesi ha abbandonato di proposito un modello comparabile tra interviste e ora condivide "the raw interview notes" col team: il confronto sistematico lo ha lasciato per scelta di metodo, non per mancanza di tempo `[doc:mined-indiehackers-james-paden]`.

**Tema 3: l'assistente generico divide.** Chi lo usa con fiducia: Claude collegato a Slack, Intercom e Amplitude, "a few minutes versus the hours" `[doc:mined-reddit-praying4exitz]`; NotebookLM o Claude sulle interviste, "It saved me hours" `[doc:mined-reddit-constantkooky3329]`; un PM senza ricercatore che usa l'AI per organizzare il feedback e mappare i pattern, senza lamentele `[doc:mined-reddit-governmentbroad2054]`; Claude Code che rilegge le trascrizioni per segmento "in minutes instead of re-reading for days" `[doc:mined-substack-else-van-der-berg]`; un commentatore per cui "AI, with enough business context can absolutely distill these problems down for you today" `[doc:mined-reddit-freekiltman]`. Chi non si fida, con episodi: Teresa Torres ha trovato che "About 30% of the direct quotes that ChatGPT included were either incorrect summaries of what the participant said or weren't in the source material at all" nelle sue interviste `[doc:mined-producttalk-teresa-torres-ai-synthesis]`; la stessa advisor che usa Claude Code ha provato a fargli costruire l'albero delle opportunità e "Did not go well" `[doc:mined-substack-else-van-der-berg]`; una designer sola ha usato il clustering AI di Dovetail e "I still had to cluster things on my own" `[doc:mined-reddit-similarities]`; un PM ha rifatto a mano la categorizzazione di ChatGPT `[doc:mined-reddit-thibaultzim]`. Senza episodio: un PM trova l'AI utile per la logistica ma non "for recognizing the insights" `[doc:mined-reddit-khanhhuy]`, una ricercatrice ha ottenuto un report "80% there" solo dopo "a lot of experimenting" `[doc:mined-substack-valerie-ehrlich]`. La divisione non segue il ruolo: la stessa persona può fidarsi della ricerca nel materiale e non della sintesi finale `[doc:mined-substack-else-van-der-berg]`.

**Tema 4: le prove servono spesso a difendere una decisione, non a prenderla.** Un PM ha etichettato a mano "thousands of support tickets" per un miglioramento che era già "fairly obvious", solo per avere una metrica da mostrare `[doc:mined-reddit-aikhuda]`. Un altro PM difende le priorità davanti a chi ha "1 or 2 customer conversations to support their position" con 10 interviste e un sondaggio con 137 risposte `[doc:mined-reddit-georgeharter]`. Un PM non aveva voci dei clienti da portare ai dirigenti per una decisione `[doc:mined-reddit-dada-man]`. È il gradino 3 del frame (il team chiede "su quali prove?"), ma la risposta che queste fonti cercano è un'argomentazione difendibile, non un verdetto sull'ipotesi.

**Tema 5: in alcuni casi il collo di bottiglia è altrove.** Trovare le persone da sentire: un APM racconta il reclutamento come "mostly a volume game" `[doc:mined-substack-productpill]`, un PM non ottiene l'accesso al cliente `[doc:mined-reddit-just-competition9002]`. Decide il CEO a prescindere: "That crap doesn't work" `[doc:mined-reddit-trowaman]`. Il feedback "sits" perché "a lot of it isn't very good", secondo un commentatore `[doc:mined-reddit-freekiltman]`.

**Tema 6: prior art, nessuno ha l'ipotesi con verdetto per il PM singolo.** Verificato sulle pagine il 2026-09-28:

| Prodotto | Unità centrale | Ipotesi con verdetto | Prezzo d'ingresso | Acquirente |
|------|------|------|------|------|
| Dovetail `[doc:priorart-dovetail]` | progetto e canale, Docs generati | no | 0 $ gratuito, poi Enterprise su preventivo | enterprise |
| Condens `[doc:priorart-condens]` | progetto con insight | no | Lite 15 € al mese | team di ricerca |
| Maze `[doc:priorart-maze]` | studio | no, solo domande di marketing "Is this the right problem to solve?" | cifre assenti dalla pagina; circa 99 $ al mese da fonte terza | da researcher a team di prodotto |
| Notably `[doc:priorart-notably]` | progetto (fonte terza) | non verificabile | circa 15 $ al mese da fonte terza, pagina irraggiungibile | agenzie e team UX |
| Productboard `[doc:priorart-productboard]` | nota di feedback, opportunità | no | Plus 19 $ per maker al mese annuale | team di prodotto strutturati |
| EnjoyHQ in UserTesting `[doc:priorart-enjoyhq]` | workspace, progetto, storia | no | nessuna cifra pubblica | enterprise |
| NotebookLM, ora Gemini Notebook `[doc:priorart-notebooklm]` | notebook con fonti | no | gratuito; Google AI Plus 4,99 € al mese | generico |
| Vistaly `[doc:priorart-vistaly]` | card dell'albero delle opportunità | no, usa uno stato | 25 $ per utente al mese | PM in discovery continua |
| Strategyzer `[doc:priorart-strategyzer]` | "hypothesis card" | parziale: ipotesi e validazione, senza verdetto a tre stati con citazioni | piattaforma su richiesta | team di innovazione |
| Great Question `[doc:priorart-great-question]` | studio | no | 129 $ per utente al mese | research ops |
| Marvin `[doc:priorart-marvin]` | progetto | non trovato | gratuito; piani a pagamento senza cifre | da singoli a team |
| Looppanel `[doc:priorart-looppanel]` | progetto di ricerca | no | Solo 49 $ al mese | ricercatori |

Strategyzer è l'unico con l'ipotesi come oggetto del prodotto, ma per team di innovazione e senza prezzo pubblico `[doc:priorart-strategyzer]`. Il vuoto di Voce resta: nessuno lega ipotesi, voci dei clienti e verdetto con citazioni per un PM singolo. L'assenza di concorrenti non dice se qualcuno lo vuole.

## Disconfirming evidence

**Sought:** stabilito prima di cercare, dal falsificatore del frame: il frame muore se (a) la discovery dei PM senza ricercatore non parte da un'ipotesi o una domanda nominabile, ma è continua, a temi, o assente; (b) i PM confrontano già le voci con l'ipotesi in poco tempo con l'assistente generico e se ne fidano; (c) il confronto salta per motivi che uno strumento non tocca (decide il capo, il collo di bottiglia è trovare le persone, il feedback è di scarsa qualità). Cercato con query mirate su Reddit (discovery senza ricercatore, NotebookLM e ChatGPT sulle interviste, abbandono di Dovetail, conferme di ipotesi), su Hacker News, Indie Hackers, Product Talk, Substack, Medium e fonti italiane. Nelle interviste la stessa prova è la regola di decisione sopra, fissata oggi prima di qualsiasi call.

**Found:** smentite parziali su tutti e tre i fronti, nessuna dall'ICP con un episodio recente. (a) Discovery continua con ICP e domande che cambiano `[doc:mined-substack-else-van-der-berg]`, revisione trimestrale a temi `[doc:mined-reddit-confusedus]`, richieste scartate finché non diventano un tema `[doc:mined-reddit-darcswan]`, nessuna validazione per scelta `[doc:mined-indiehackers-alexander-chen]`; il concorrente più vicino per pubblico è costruito sull'albero delle opportunità, non sulle ipotesi `[doc:priorart-vistaly]`. (b) Sintesi in minuti con Claude collegato alle fonti `[doc:mined-reddit-praying4exitz]`, ricerca per segmento "in minutes instead of re-reading for days" con Claude Code `[doc:mined-substack-else-van-der-berg]`, uso dell'AI senza lamentele da parte di un PM senza ricercatore `[doc:mined-reddit-governmentbroad2054]`; nessuna di queste fonti dice però di aver confrontato le voci con un'ipotesi. (c) Reclutamento `[doc:mined-substack-productpill]`, accesso al cliente `[doc:mined-reddit-just-competition9002]`, CEO che decide `[doc:mined-reddit-trowaman]`, qualità del feedback `[doc:mined-reddit-freekiltman]`. Queste smentite indeboliscono la credenza 2 (ipotesi nominabile) più della 3 (confronto saltato), che resta la più sostenuta dalle fonti, ma solo da opinioni e fonti fuori ICP `[doc:mined-reddit-waste-mastodon2646]`.

## JTBD

When ho sentito alcuni clienti per capire se un problema è reale e devo portare una decisione al team o al capo, I want to vedere quali voci sostengono e quali smentiscono quello che pensavo all'inizio, senza rileggere tutto da capo, so I can decidere e difendere la decisione con le parole dei clienti invece che con le due conversazioni che ricordo meglio. `[assumption:unvalidated]` Formulazione del frame; le fonti sostengono la seconda metà (difendere la decisione) `[doc:mined-reddit-georgeharter]` `[doc:mined-reddit-aikhuda]` più della prima (partire da un'ipotesi) `[doc:mined-substack-else-van-der-berg]`.

## Surprises

1. **L'ICP ha un nome e un thread.** Nell'aprile 2026 un PM con 14 anni di esperienza apre su r/ProductManagement "How do you handle product discovery without a dedicated UX researcher?" e scrive che il problema è "how to turn messy notes into something your VP can act on"; i commenti dicono che la discovery "dies" nella sintesi `[doc:mined-reddit-waste-mastodon2646]`. Ma almeno due commentatori stanno costruendo strumenti per questo problema `[doc:mined-reddit-solid-aardvark-4590]` `[doc:mined-reddit-khanhhuy]`, e il post ha l'aspetto di chi prepara un proprio esperimento: lo spazio è affollato di costruttori, non solo di PM.
2. **Le prove servono a difendere, non a scoprire.** Due PM descrivono il lavoro di confronto come il modo per rendere una decisione già intuita difendibile davanti a capi e colleghi `[doc:mined-reddit-aikhuda]` `[doc:mined-reddit-georgeharter]`. Se è così, il verdetto per ipotesi vale per quanto regge alla domanda "su quali prove?", non per quanto scopre.
3. **Chi si fida dell'AI e chi no può essere la stessa persona.** La advisor che rilegge 50 trascrizioni in minuti con Claude Code non si fida dell'AI per la struttura finale `[doc:mined-substack-else-van-der-berg]`; Torres usa ChatGPT e Claude come seconda opinione dopo aver trovato citazioni sbagliate nel 30% dei casi `[doc:mined-producttalk-teresa-torres-ai-synthesis]`. La fiducia si divide tra recupero delle voci (sì) e conclusione (no): è proprio la divisione tra citazioni verificate e verdetto su cui poggia Voce.
4. **La discovery continua è un modello rivale del "giro con un'ipotesi".** L'autorità più citata del settore spinge a sintetizzare ogni intervista subito e a lavorare su un albero di opportunità `[doc:mined-reddit-ttorres]`, e lo strumento più vicino per prezzo e pubblico è costruito così `[doc:priorart-vistaly]`. Il frame assume giri delimitati con un'ipotesi (credenza 1): è una scelta di forma, non un fatto.
5. **Fonti italiane: niente.** Nessun episodio in prima persona di un PM italiano trovato su blog, Medium, Substack o community; nemmeno nel vault di Mario o nei segnalibri X. Il segmento italiano resta del tutto non osservato.


## Regola di decisione per le interviste

Fissata oggi, 2026-09-28, prima di qualsiasi intervista. Deciso dal modello per delega di Mario (2026-09-28) `[doc:user-2026-09-28-research-round1]`. Si applica solo alle interviste e ai questionari di PM dell'ICP; le fonti pubbliche non entrano nel conteggio.

**Definizioni, uguali per ogni intervista:**
- **Ipotesi nominata:** l'intervistato dice una credenza o una domanda precisa riferita a prima della raccolta ("pensavo che i clienti lasciassero per il prezzo", "volevo capire se i responsabili acquisti usano l'export"), al più tardi alla domanda 2.4 della guida ("prima della prima call, cosa ti aspettavi di sentire?"). Una conclusione riscritta come aspettativa, o un'ipotesi ricostruita dopo che l'intervistatore ha nominato la parola "ipotesi" in sezione 3, non conta. Si registra anche se è una domanda aperta senza una credenza ("volevo capire come scelgono il fornitore") o un'ipotesi vera e propria.
- **Confronto sistematico:** tutte le voci raccolte nel giro sono state riprese e messe in relazione con l'ipotesi, con un conteggio o un elenco di voci a favore e contro, a mano o con uno strumento. Riprenderne solo alcune, lavorare a memoria o su un riassunto generico senza tornare all'ipotesi è "a metà" o "saltato".
- **Fiducia sufficiente:** l'intervistato ha portato la conclusione al team, al capo o al founder e, se gli hanno chiesto su cosa si basava, ha mostrato le voci; oppure dice di non aver avuto bisogno di ricontrollare e racconta un motivo concreto.
- **Maggioranza:** più della metà, esclusa la parità.

**Esiti, fissati prima:**

| Cosa emerge dalle interviste dell'ICP | Esito |
|------|------|
| Meno della metà nomina una domanda o un'ipotesi di partenza | KILLED: la discovery dell'ICP non parte da una domanda, il contenitore domanda più ipotesi più verdetto non corrisponde al lavoro |
| Almeno metà nomina una domanda aperta, ma meno della metà nomina un'ipotesi (una credenza da confermare o smentire) | RESHAPED: il contenitore è la domanda, non l'ipotesi; il verdetto per ipotesi va tolto o reso opzionale |
| Tra chi nomina l'ipotesi, la maggioranza ha fatto il confronto sistematico in meno di 2 ore con i mezzi attuali e se ne è fidata | KILLED: il problema è già risolto, per lo più dall'assistente generico |
| Tra chi nomina l'ipotesi, la maggioranza ha saltato o fatto a metà il confronto per tempo o sfiducia nel risultato, e ha chiuso su ciò che ricordava | VALIDATED: si passa alla fase 2 |
| Il confronto salta, ma per un motivo diverso da tempo o sfiducia (la decisione era già presa dal founder o dal CEO, le voci erano troppo poche per confrontare, il collo di bottiglia era trovare le persone) | RESHAPED verso quel costo, oppure KILLED se la maggioranza dice che le voci non cambiano la decisione |
| Parità o esiti misti dopo 8 interviste | Nessun esito: altre 2 interviste nella classe meno coperta, poi si decide con le stesse soglie |

Minimo per decidere: 6 interviste in call di PM dell'ICP; i questionari si aggiungono al conteggio ma, dove divergono dalle call, pesano meno. Le reazioni alla demo di PHC26 non entrano mai.

## Verdict

**IN SOSPESO.** Nessun esito è sostenibile oggi. Mancano:

- **Unità primarie dall'ICP:** 1 su 5 richieste, con riserva: un founder-PM del 2022 che partiva da una lista di ipotesi e ha lasciato il confronto sistematico per scelta, non per tempo `[doc:mined-indiehackers-james-paden]`. Le altre 12 fonti con un episodio in prima persona sono coach, ricercatori, designer, maker o PM non verificabili come ICP `[doc:mined-producttalk-teresa-torres-ai-synthesis]` `[doc:mined-reddit-kitchen-ad-4367]`.
- **Fonti distinte sulla credenza rischiosa:** 0 che raccontino l'episodio intero (ipotesi nominata, voci raccolte, confronto saltato per tempo o sfiducia, decisione chiusa sul ricordo). Il pezzo più sostenuto, il confronto che salta per tempo, poggia su opinioni `[doc:mined-reddit-waste-mastodon2646]` e pratiche senza episodio `[doc:mined-reddit-frustrated-pm26]`.
- **Episodi negli ultimi 60 giorni:** 0 dall'ICP. La fonte più recente è del 2026-09-07 ed è un piano dichiarato, non un giro concluso `[doc:mined-reddit-chance-back4949]`.
- **PM italiani:** 0.

Cosa serve per chiudere: 6-8 interviste secondo il piano sopra, o questionari tornati da PM dell'ICP, valutati con la regola di decisione fissata prima. Le fonti spostano già il peso: il confronto che salta per tempo è la parte più sostenuta `[doc:mined-reddit-waste-mastodon2646]`; l'ipotesi nominabile è la più fragile, perché la discovery continua è una forma diffusa e ha già il suo strumento `[doc:mined-substack-else-van-der-berg]` `[doc:priorart-vistaly]`; la fiducia nell'assistente generico è divisa `[doc:mined-producttalk-teresa-torres-ai-synthesis]` `[doc:mined-reddit-praying4exitz]`. Il gate non va forzato: una deroga spetta solo a Mario.
