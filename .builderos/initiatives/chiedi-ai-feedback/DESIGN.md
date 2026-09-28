# Design: Chiedi ai tuoi feedback, forma minima

**Phase:** 4 · **Cycle:** 1 · **Mode:** lite · **Date:** 2026-09-27 · **Owner:** Mario Miletta (struttura scritta dal modello per delega)

Disegno strutturale di "Chiedi" come scelto in `03-solution-bet.md`: una domanda, una risposta, il numero di feedback collegati contato dal server, al massimo 5 citazioni verificate, niente conversazione, niente cronologia, "Non trovo feedback che ne parlano" quando non ci sono prove. Quota firmata da Mario: Free 10 domande al mese, Pro 100, separate dalle analisi `[doc:user-2026-09-27-deroga-gate-3-quota]`.

Il flusso che serve tutto il resto è l'azione principale della scommessa: **il PM scrive una domanda e legge sullo schermo una risposta con citazioni verificate** (`03-solution-bet.md`, opzione 1). Due vincoli di consegna guidano ogni scelta sotto: la funzione si mostra dal vivo su un proiettore a circa 230 PM il 1 ottobre 2026 `[doc:user-2026-09-26-init]`, quindi deve leggersi da lontano, e la risposta deve capirsi in 5 secondi.

Il sistema visivo è quello di `DESIGN.md` alla radice del repository. Qui non si inventa uno stile: si compongono i pezzi che esistono e si dicono le due estensioni che servono.

Tutte le scelte marcate **[D]** sono "Deciso dal modello per delega di Mario (2026-09-27)" `[doc:user-2026-09-26-delega]`.

## Placement

**Today:** barra dell'app con quattro schede `[code:src/components/app-tabs.tsx]`

```
[Voce] Workspace   Temi | Feedback | Raccolta | Piano        Free  Feedback: 37 di 100. Analisi di settembre: 1 di 3   Esci
```

- `/themes`: "Cosa dicono i clienti di …", i temi dell'ultima analisi `[code:src/app/(app)/themes/page.tsx]`
- `/feedback`: l'elenco grezzo, filtrabile solo per canale `[code:src/app/(app)/feedback/page.tsx]`
- `/collect`: modulo pubblico, CSV, inserimento manuale
- `/billing`: piano e limiti, che oggi nominano feedback e analisi `[code:src/app/(app)/billing/page.tsx]`
- Il proxy tiene fuori dall'app chi non ha fatto l'accesso solo per i percorsi elencati in `APP_PATHS` `[code:src/proxy.ts]`

**Proposed:** una scheda nuova, **Chiedi**, seconda da sinistra, su una pagina sua `/ask` **[D]**

```
[Voce] Workspace   Temi | Chiedi | Feedback | Raccolta | Piano   Free  Feedback: 37 di 100. Analisi di settembre: 1 di 3   Esci
```

**Perché una pagina sua e non una casella dentro Temi.**

- **Dove se l'aspetta il PM.** La domanda è "cosa dicono i clienti di X". I temi rispondono a "cosa dicono i clienti" in generale, l'elenco dei feedback mostra il testo grezzo. Chiedi sta in mezzo: interroga i feedback grezzi e restituisce una sintesi con prove. Per questo va tra le due schede, non dentro una delle due.
- **Accanto a cosa.** Accanto a Temi eredita il modello mentale giusto (numero grande, citazioni evidenziate). Dentro la pagina dei temi, la casella competerebbe con "Nuova analisi" (il pulsante primario di quella zona) e con la barra dei filtri, e confonderebbe due quote diverse sulla stessa schermata.
- **Proiettore.** Una pagina con una sola cosa sopra la piega (domanda e risposta) si legge dalla sala. La pagina dei temi a 125% di zoom è già piena.
- **Criterio di stop.** Il criterio 1 dice "togliamo Chiedi dalla navigazione e cancelliamo il codice" (`03-solution-bet.md`, Kill criteria). Una scheda e una rotta si tolgono senza toccare Temi, raccolta e analisi.
- **Costo della strada comoda, detto.** Una seconda porta d'ingresso nella pagina dei temi porterebbe più PM alla funzione. Non la metto **[D]**: la scheda è sempre visibile, e ogni ingresso in più è una cosa da togliere se scatta il criterio di stop.

**Nome della rotta.** `/ask`, in inglese come le altre (`/themes`, `/feedback`, `/collect`, `/billing`). Etichetta visibile "Chiedi", titolo di pagina "Chiedi ai tuoi feedback" (il nome dell'iniziativa).

**Moves:**

| Cosa cambia | Dove | Perché |
|---|---|---|
| Scheda "Chiedi" tra Temi e Feedback | `TABS` in `src/components/app-tabs.tsx` | Unico ingresso nella navigazione |
| `/ask` aggiunto a `APP_PATHS` | `src/proxy.ts` | Senza, chi non ha fatto l'accesso arriva sulla pagina invece che su `/login`. È lo stato di permesso della pagina |
| La quota delle domande **non** entra nella barra dell'app **[D]** | `src/components/app-bar.tsx` resta com'è | La barra ha già piano, feedback e analisi; con una quarta voce va a capo a 125% di zoom sul proiettore. La quota si mostra dove si spende, sotto il pulsante di Chiedi, come fa `AnalyzeButton` con le analisi |
| Righe dei piani con le domande: "10 domande ai feedback al mese" (Free) e "100 domande ai feedback al mese" (Pro) | `src/app/(app)/billing/page.tsx`, `src/app/page.tsx` (prezzi della landing), con i valori da `PLAN_LIMITS` in `src/lib/plans.ts` | La quota è parte del piano: se non è scritta dove si sceglie il piano, il primo "hai usato le 10 domande" è una sorpresa. La landing la vedono i 230 PM il 1 ottobre |

## Information architecture

Una pagina, tre zone dall'alto in basso. Nessuna zona compare insieme alla sua alternativa.

```
/ask
├── Intestazione         titolo "Chiedi ai tuoi feedback" + una riga che dice cosa succede
├── Domanda              etichetta, campo, suggerimento o errore, pulsante primario, nota della quota
└── Risposta             una sola alla volta, sostituita dalla domanda successiva
    ├── Risposta a «…»   la domanda a cui si riferisce (h2)
    ├── Numero           quanti feedback ne parlano, contato dal server
    ├── Testo            poche frasi generate, in sans: sono parole di Voce, non dei clienti
    ├── Citazioni        fino a 5, in serif: solo testo verificato dei clienti
    └── Perimetro        quanti feedback sono stati letti, e che la risposta non si salva
```

**Regola tipografica che regge la lettura in 5 secondi.** La serif si usa solo per le parole dei clienti (principio 1 di `DESIGN.md`). Nella risposta questo diventa una garanzia visibile: tutto ciò che è in serif è una frase vera di un cliente, verificata; tutto ciò che è in sans l'ha scritto Voce. Da lontano la sala vede tre cose in quest'ordine: il numero (48 px, il più grande della pagina), la risposta (24 px), le frasi in serif con la parte chiave in giallo.

**Ordine di lettura in 5 secondi:** numero → etichetta "feedback ne parlano" → prima frase della risposta → prima citazione evidenziata. La colonna del numero a sinistra è la stessa di un tema (`ThemeRow`, colonna da 148 px) **[D]**: chi ha appena visto la pagina dei temi riconosce subito lo schema "numero, poi parole dei clienti".

## Flows

### F1. Fare una domanda e leggere la risposta (flusso principale)

**Entry points:**

1. Scheda "Chiedi" nella barra, da qualunque pagina dell'app.
2. URL diretto `/ask` (segnalibro, digitato durante la demo).
3. Accesso scaduto o mai fatto su `/ask`: il proxy porta a `/login`; dopo l'accesso l'app porta su `/themes` come oggi `[code:src/proxy.ts]`, e da lì si entra dalla scheda. Nessun ritorno automatico a `/ask` **[D]**: il ritorno alla pagina di partenza oggi non esiste per nessuna scheda, e aggiungerlo solo qui è un meccanismo nuovo.
4. Indietro e avanti del browser: la pagina si apre sempre nello stato iniziale, senza risposta (non c'è cronologia).

Non sono ingressi, di proposito: la pagina dei temi, l'elenco dei feedback, la landing (che nomina solo la quota).

| Step | User action | System response | Branches |
|---|---|---|---|
| 1. Apertura | Apre `/ask` | Il server legge quanti feedback ci sono negli ultimi 90 giorni (massimo 500 usati, come l'analisi `[code:src/lib/analysis.ts:11]`) e quante domande restano nel mese. Il campo riceve il focus | Nessun feedback in assoluto → F3. Feedback solo più vecchi di 90 giorni → F3, variante. Quota esaurita → F2. Altrimenti → step 2 |
| 2. Scrittura | Scrive la domanda | Il contatore compare da 250 caratteri; oltre 300 il campo segnala l'errore mentre si scrive **[D]** | Invio vuoto o oltre 300 → errore sul campo, nessuna chiamata, nessuna quota spesa. Resta allo step 2 |
| 3. Invio | Preme Invio o il pulsante "Chiedi ai 212 feedback" | Il server valida, controlla la quota e che non ci sia un'altra domanda in corso per il workspace (come `start_analysis` `[code:supabase/migrations/20260925120000_ai_analysis.sql:54]`), poi chiama il modello. Il campo diventa di sola lettura, il pulsante dice "Risposta in arrivo…", la risposta precedente sparisce | Quota esaurita nel frattempo (altra scheda) → messaggio di F2 sotto il pulsante. Domanda già in corso → errore "occupato". Sessione scaduta → errore di sessione. Errori prima della chiamata al modello non contano nella quota |
| 4. Attesa | Aspetta | Nota "Sto leggendo 212 feedback…". Dopo 15 secondi: "Ci vuole più del solito. La risposta arriva: resta su questa pagina." Il server interrompe a 60 secondi **[D]**, proposta per `04-spec.md` | Tempo scaduto, errore del modello, risposta non valida → errore "non arrivata", la domanda conta nella quota (regola firmata: conta ogni domanda che arriva al modello) |
| 5. Risposta | Legge | Il server conta i feedback collegati dall'elenco verificato e tiene solo le citazioni trovate carattere per carattere nel testo `[code:src/lib/analysis.ts:183]`, al massimo 5. Mostra numero, testo, citazioni, perimetro. Aggiorna la nota della quota. Annuncia la risposta ai lettori di schermo | Almeno 1 citazione verificata → risposta completa. Zero citazioni verificate → "Non trovo feedback che ne parlano" (esito, non errore; conta nella quota). Più di 500 feedback nel periodo → risposta con perimetro parziale dichiarato |
| 6. Nuova domanda | Corregge il testo nel campo o ne scrive uno nuovo e invia | Si torna allo step 3. La nuova risposta sostituisce la precedente. Nessun contesto passa da una domanda all'altra: ogni domanda è indipendente | Quota finita con questa domanda → dopo la risposta il pulsante si spegne e compare il messaggio di F2 |

**Exit, success:** la risposta resta sullo schermo finché il PM non fa un'altra domanda o lascia la pagina. Il passo successivo è suo (copiare a mano le citazioni nel documento, fare un'altra domanda, andare ai temi).

**Abandonment:**

- **Prima dell'invio** (scrive e cambia scheda, ricarica, chiude): il testo si perde. Nessuna bozza **[D]**: è una frase sola, riscriverla costa meno di un meccanismo di salvataggio, e salvare le domande è già cronologia, fuori dalla forma minima.
- **Durante l'attesa** (cambia scheda, ricarica, chiude): la chiamata continua sul server, la domanda conta nella quota, la risposta si perde. Se torna su `/ask` prima che finisca e rifà la domanda, riceve l'errore "occupato" per qualche secondo. La nota di attesa lo dice prima che succeda ("resta su questa pagina").
- **Dopo la risposta:** lasciare la pagina cancella la risposta. La riga del perimetro lo dice sotto ogni risposta: "La risposta non resta su questa pagina: se ti serve, copiala."
- La domanda non va nell'URL **[D]**: resterebbe nei log delle richieste e nella cronologia del browser, e il testo delle domande, come quello dei feedback, non deve finire negli analytics `[code:AGENTS.md]`.

**Reversible:** nessun passo cambia dati. Una domanda inviata non si annulla: la quota spesa resta spesa. Nessun pulsante "Annulla" durante l'attesa **[D]**: la domanda conterebbe comunque, e l'attesa prevista è di secondi.

### F2. Quota delle domande esaurita

**Entry points:** apertura di `/ask` con quota finita (step 1 di F1); ultima domanda del mese appena risposta (step 6); invio da un'altra scheda che ha finito la quota (step 3).

| Step | User action | System response | Branches |
|---|---|---|---|
| 1. Arrivo | Apre la pagina o riceve l'ultima risposta | Campo e pulsante restano visibili ma il pulsante è spento (`aria-disabled`). Sopra la domanda, un avviso giallo chiaro (`Card` soft, riga) dice quante domande ha usato e quando tornano | Free → avviso con "Passa a Pro". Pro → avviso senza pulsante |
| 2. Scelta | Free: preme "Passa a Pro" | Va a `/billing`, flusso di pagamento esistente | Non passa a Pro → la pagina resta com'è fino al 1 del mese |

La risposta appena ricevuta resta visibile sotto l'avviso: finire la quota non cancella l'ultima risposta.

**Exit:** `/billing` (successo), oppure lascia la pagina. **Abandonment:** niente da perdere. **Reversible:** n/a.

### F3. Nessun feedback su cui rispondere

**Entry points:** apertura di `/ask` in un workspace senza feedback, oppure con feedback solo più vecchi di 90 giorni.

| Step | User action | System response | Branches |
|---|---|---|---|
| 1. Arrivo | Apre la pagina | Stato vuoto al posto del campo: titolo in serif, una riga, un'azione "Aggiungi feedback" verso `/collect`. Nessun campo: una domanda senza feedback spende quota per niente | Nessun feedback → testo A. Solo feedback vecchi → testo B, con il numero dei vecchi |
| 2. Azione | Preme "Aggiungi feedback" | Va a `/collect` | Torna dopo aver aggiunto feedback → F1 |

**Exit:** `/collect`. **Abandonment:** niente da perdere. **Reversible:** n/a.

## States

Sei stati per passo. La sesta colonna, "Permission", copre chi non ha fatto l'accesso e la quota esaurita, che su questa pagina è il limite del piano. Dove uno stato non si applica, la cella dice perché.

| Flow / step | Empty | Loading | Partial | Error | Success | Permission |
|---|---|---|---|---|---|---|
| F1.1 Apertura | Stato pronto: titolo, riga "Scrivi una domanda su un argomento…", campo vuoto con il focus, suggerimento con un esempio, pulsante "Chiedi ai 212 feedback", nota "Userai 1 delle 10 domande di settembre." | Rendering sul server come le altre pagine; nessuno scheletro. Se il caricamento dei conteggi fallisce vale l'errore di pagina esistente dell'app | Più di 500 feedback negli ultimi 90 giorni: il pulsante dice "Chiedi ai 500 feedback più recenti", la nota aggiunge "su 740 degli ultimi 90 giorni" | Conteggi non leggibili: pagina di errore esistente di Next.js, senza stato inventato qui | Pagina pronta, focus nel campo | Non autenticato: `/login` (con `/ask` in `APP_PATHS`). Quota esaurita: F2. Nessun feedback: F3 |
| F1.2 Scrittura | Campo vuoto: nessun errore finché non si invia | Non si applica: nessuna chiamata mentre si scrive | Da 250 caratteri compare il contatore "250 di 300" | Invio vuoto: E1. Oltre 300 caratteri: E2, mentre si scrive e all'invio | Testo valido: il pulsante è pronto, nessun segnale in più | Come F1.1 |
| F1.3 Invio | Non si applica: l'invio vuoto non parte (E1) | Pulsante "Risposta in arrivo…" spento, campo in sola lettura con il focus, nota "Sto leggendo 212 feedback…", risposta precedente tolta | Non si applica: prima della chiamata al modello non c'è un risultato parziale | Occupato: E5. Sessione scaduta: E8. Connessione: E7. Nessun feedback nel frattempo: E9 | La richiesta è accettata e si passa all'attesa | Quota finita da un'altra scheda: E3 (Free) o E4 (Pro), nessuna chiamata, nessuna quota spesa |
| F1.4 Attesa | Non si applica: c'è sempre una domanda in corso | Da 0 a 15 s: "Sto leggendo 212 feedback…". Da 15 s: "Ci vuole più del solito. La risposta arriva: resta su questa pagina." A 60 s il server interrompe | Non si applica: la risposta arriva intera o non arriva **[D]**, niente testo che compare a pezzi (le citazioni vanno verificate prima di mostrarle) | Tempo scaduto, errore del modello o risposta non valida: E6, la domanda conta | Si passa alla risposta | Non si applica: i permessi sono stati controllati all'invio |
| F1.5 Risposta | "Non trovo feedback che ne parlano." in serif grande, con il perimetro e un suggerimento (testo sotto). Nessun numero, nessun testo del modello | Non si applica: la risposta è già arrivata | Più di 500 feedback: il perimetro dice "Letti i 500 feedback più recenti degli ultimi 90 giorni, su 740: i più vecchi non entrano nella risposta." Citazioni scartate dalla verifica: non si mostrano e non si dice nulla, il numero conta solo i feedback verificati. Collegati più di 5: "5 dei 23 feedback" sopra le citazioni | Non si applica qui: gli errori sono in F1.3 e F1.4. Il testo generato si mostra sempre come testo, mai come HTML | Numero, "feedback ne parlano", risposta, citazioni con la frase chiave evidenziata, perimetro, nota "Ti restano 7 domande di settembre." Annuncio al lettore di schermo | Ultima domanda del mese: risposta visibile, poi avviso di F2 sopra il campo e pulsante spento |
| F2 Quota esaurita | Non si applica: la pagina ha sempre il campo con l'ultima domanda o vuoto | Non si applica: nessuna chiamata | Non si applica | Non si applica: la quota esaurita è lo stato, non un errore. Il messaggio è E3 o E4 | Free: "Passa a Pro" porta a `/billing` | È lo stato di permesso: Free E3 con "Passa a Pro", Pro E4 senza pulsante |
| F3 Nessun feedback | Testo A o testo B con l'azione "Aggiungi feedback" | Non si applica: rendering sul server | Testo B: feedback presenti ma tutti oltre i 90 giorni | Non si applica: nessuna azione che possa fallire sulla pagina; `/collect` gestisce i suoi errori | "Aggiungi feedback" porta a `/collect` | Non autenticato: `/login` |

**Error copy** (stringhe esatte, italiano dell'interfaccia; `{n}` e `{mese}` calcolati, il mese come in `formatMonth`):

| Id | Quando | Dove | Testo | Conta nella quota |
|---|---|---|---|---|
| E1 | Invio con il campo vuoto o solo spazi | Sotto il campo, rosso, `aria-invalid` | "Scrivi una domanda prima di inviarla. Per esempio: cosa dicono i clienti dei prezzi?" | No |
| E2 | Più di 300 caratteri | Sotto il campo, rosso, con il contatore | "La domanda supera i 300 caratteri: accorciala a una sola richiesta." | No |
| E3 | Quota Free esaurita | Avviso sopra il campo, `Card` soft | Titolo: "Hai usato le 10 domande di {mese}" · Testo: "Con Pro diventano 100 al mese. Altrimenti tornano disponibili il 1 {mese successivo}." · Pulsante: "Passa a Pro" | No |
| E4 | Quota Pro esaurita | Avviso sopra il campo, `Card` soft | Titolo: "Hai usato le 100 domande di {mese}" · Testo: "Tornano disponibili il 1 {mese successivo}." | No |
| E5 | Un'altra domanda è già in corso per il workspace | Nota sotto il pulsante, rossa | "C'è già una domanda in corso, forse da un'altra scheda. Aspetta qualche secondo e riprova." | No |
| E6 | Errore del modello, tempo scaduto, risposta non valida | Nota sotto il pulsante, rossa | "La risposta non è arrivata. La domanda conta lo stesso tra quelle del mese: ti restano {n} domande di {mese}. Riprova tra poco." (con {n} = 0: "…conta lo stesso: hai usato tutte le domande di {mese}." e subito dopo l'avviso E3 o E4) | Sì |
| E7 | La richiesta non raggiunge il server o la risposta si perde per strada | Nota sotto il pulsante, rossa | "Non riesco a raggiungere Voce: controlla la connessione e riprova. Se la domanda era già partita, conta tra quelle del mese." | Dipende da dove si è interrotta: il testo lo dice |
| E8 | Sessione scaduta all'invio | Nota sotto il pulsante, rossa, con link | "La sessione è scaduta. Accedi di nuovo per fare la domanda." · Link: "Accedi" verso `/login` | No |
| E9 | Tra l'apertura e l'invio i feedback degli ultimi 90 giorni sono spariti (cancellati da un'altra scheda) | Nota sotto il pulsante, rossa, con link | "Negli ultimi 90 giorni non ci sono più feedback su cui rispondere." · Link: "Aggiungi feedback" verso `/collect` | No |

**Copy degli stati non di errore:**

| Stato | Testo |
|---|---|
| Titolo pagina | "Chiedi ai tuoi feedback" |
| Riga sotto il titolo | "Scrivi una domanda su un argomento. Voce risponde con quanti feedback ne parlano e con le frasi esatte dei clienti." |
| Etichetta del campo | "La tua domanda" |
| Suggerimento | "Per esempio: cosa chiedono i clienti sull'export in Excel?" (nessun placeholder: l'esempio sta nel suggerimento, leggibile a 5,9:1) |
| Pulsante | "Chiedi ai {n} feedback" · con 1: "Chiedi a 1 feedback" · con più di 500: "Chiedi ai 500 feedback più recenti" · durante l'attesa: "Risposta in arrivo…" |
| Nota quota, prima domanda del mese | "Userai 1 delle {limite} domande di {mese}." |
| Nota quota, dopo | "Ti restano {n} domande di {mese}." · con 1: "Ti resta 1 domanda di {mese}." |
| Attesa | "Sto leggendo {n} feedback…" · dopo 15 s: "Ci vuole più del solito. La risposta arriva: resta su questa pagina." |
| Intestazione della risposta (h2) | "Risposta a «{domanda}»" |
| Etichetta del numero | "feedback ne parlano" · con 1: "feedback ne parla" |
| Sopra le citazioni | "Cosa hanno scritto" · se i collegati sono più delle citazioni: "Cosa hanno scritto: {citazioni} dei {collegati} feedback" |
| Perimetro | "Letti {n} feedback degli ultimi 90 giorni. La risposta non resta su questa pagina: se ti serve, copiala." |
| Perimetro parziale | "Letti i 500 feedback più recenti degli ultimi 90 giorni, su {totale}: i più vecchi non entrano nella risposta. La risposta non resta su questa pagina: se ti serve, copiala." |
| Nessuna prova, titolo (serif) | "Non trovo feedback che ne parlano." |
| Nessuna prova, testo | "Letti {n} feedback degli ultimi 90 giorni. Prova con altre parole, per esempio il nome della funzione come lo scrivono i clienti." |
| F3 testo A, titolo (serif) | "Qui farai domande ai tuoi feedback e leggerai le risposte con le parole dei clienti." |
| F3 testo A, riga | "Per rispondere servono feedback. Aggiungili dal modulo pubblico, da un CSV o incollandoli a mano." · Azione: "Aggiungi feedback" |
| F3 testo B, titolo (serif) | "Negli ultimi 90 giorni non è arrivato nessun feedback." |
| F3 testo B, riga | "Chiedi legge solo i feedback degli ultimi 90 giorni, e i tuoi {n} sono più vecchi. Aggiungine di recenti per fare una domanda." · Azione: "Aggiungi feedback" |

Nella citazione si mostrano canale e data, mai il nome del cliente **[D]**: come nei temi, e su un proiettore davanti a 230 persone il nome non deve comparire.

## Main screen (ascii)

Stato di successo, 1280×720 con zoom del browser a 125% (circa 1024×576 punti CSS). Sopra la linea tratteggiata ciò che si vede senza scorrere.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [V] Acme   Temi   Chiedi   Feedback   Raccolta   Piano      [Free] Feedback: …  Esci│
│                   ‾‾‾‾‾‾                                                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Chiedi ai tuoi feedback                                          32 px, bold    │
│  Scrivi una domanda su un argomento. Voce risponde con quanti feedback           │
│  ne parlano e con le frasi esatte dei clienti.                    16 px, muted   │
│                                                                                  │
│  La tua domanda                                                                  │
│  ┌───────────────────────────────────────────────────────┐  ┌───────────────────┐│
│  │ cosa dicono i clienti dell'export in Excel?           │  │Chiedi ai 212 feed.││
│  │                                                       │  └───────────────────┘│
│  └───────────────────────────────────────────────────────┘  Ti restano 7        │
│  Per esempio: cosa chiedono i clienti sull'export in Excel?   domande di settembre│
│                                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Risposta a «cosa dicono i clienti dell'export in Excel?»        14 px, muted h2 │
│                                                                                  │
│   23              Chiedono di esportare i temi e i feedback in Excel per         │
│  feedback         portarli nelle riunioni di pianificazione. Quasi tutti         │
│  ne parlano       arrivano da clienti che oggi copiano a mano.   24 px, sans     │
│ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  │
│  48 px            Cosa hanno scritto: 5 dei 23 feedback                          │
│                                                                                  │
│                   “Ogni lunedì copio i feedback in un foglio: ██mi serve         │
│                   un export in Excel██ per la riunione.”        20 px, serif     │
│                   Supporto, 12 set 2026                         13 px, muted     │
│                                                                                  │
│                   “██Senza export non posso portarlo al CEO██, quindi …”         │
│                   Call di vendita, 3 set 2026                                    │
│                                                                                  │
│                   … fino a 5 citazioni                                           │
│                                                                                  │
│                   Letti 212 feedback degli ultimi 90 giorni. La risposta non     │
│                   viene salvata: se ti serve, copiala.          13 px, muted     │
└──────────────────────────────────────────────────────────────────────────────────┘
  ██…██ = frase chiave in <mark> giallo, una per citazione
  ━━━  = linea inchiostro che chiude la zona della domanda (come la barra dei filtri)
```

**Nessuna prova**, stessa pagina sotto la linea:

```
  Risposta a «quanti clienti usano il tema scuro?»

  Non trovo feedback che ne parlano.                                40 px, serif
  Letti 212 feedback degli ultimi 90 giorni. Prova con altre parole, per esempio
  il nome della funzione come lo scrivono i clienti.                16 px, muted
```

**Attesa:**

```
  ┌───────────────────────────────────────────────┐  ┌──────────────────────┐
  │ cosa dicono i clienti dell'export in Excel?   │  │ Risposta in arrivo…  │  (spento)
  └───────────────────────────────────────────────┘  └──────────────────────┘
  (sola lettura, focus resta qui)                     Sto leggendo 212 feedback…
```

**Regole di impaginazione per il proiettore** **[D]**:

- A 1280×720 con zoom 125%, domanda, numero e prima riga della risposta stanno sopra la piega. Se la pagina è più corta (zoom 150%), all'arrivo della risposta la pagina scorre fino all'intestazione della risposta, senza animazione.
- Risposta a 24 px (`--text-3xl`, peso 500, interlinea snug), al massimo 3 frasi: il limite di lunghezza va nella spec. Citazioni a 20 px (`Quote` taglia default). Numero a 48 px (`Stat`).
- Nessuna animazione, nessuno spinner: lo stato di attesa è testo, come in `AnalyzeButton`.

## Components

| Component | Exists / Extend / New | Affects | Justification (new only) |
|---|---|---|---|
| `Page`, `PageHeader`, `PageTitle`, `PageLede` (`src/components/page.tsx`) | Exists | Nessuno | |
| `AppTabs` (`src/components/app-tabs.tsx`) | Extend: una voce in `TABS` | La barra di ogni pagina dell'app: cinque schede invece di quattro; a 125% di zoom resta su una riga, da verificare nel browser | |
| `Field`, `FieldLabel`, `FieldHint`, `FieldCount`, `FieldError` (`src/components/ui/field.tsx`) | Exists | Nessuno | |
| `Textarea` (`src/components/ui/textarea.tsx`) | Extend: variante nuova `ask` **[D]**: fondo carta, bordo interno 1,5 px in `--color-ink-muted`, testo 20 px sans, `rows={2}`, niente ridimensionamento | Nessun uso esistente cambia: la variante `default` resta com'è. Va aggiunta al kit (`design/kit.css`, `design/kit.html`) e a `DESIGN.md` nella sezione Campi, come chiede la regola del kit | Serve perché il campo `default` è velo su carta, 1,11:1: da lontano il campo non si vede e non regge 3:1 per i confini di un controllo |
| `Button` (`src/components/ui/button.tsx`) | Exists: primario, taglia `lg`; `aria-disabled` invece di `disabled` durante l'attesa | Nessuno | |
| `Stat` (esportato da `src/components/theme-row.tsx`) | Exists: numero a 48 px con etichetta | Nessuno. Si importa da dove sta, senza spostarlo | |
| `Quote` (`src/components/quote.tsx`) | Exists per testo, `highlight` e `cite`. Extend: colore di `<cite>` da `ink-subtle` a `ink-muted` **[D]** | Ogni citazione dell'app: temi, dettaglio del tema, anteprima prima dell'analisi. `ink-subtle` su carta è 3,0:1, sotto il 4,5:1 richiesto per testo di 13 px; su proiettore canale e data sparirebbero. Cambia anche la riga "Fonti delle citazioni" della tabella colori di `DESIGN.md`. Da verificare nel browser su `/themes`, `/themes/[id]` e sull'anteprima prima dell'analisi: la fonte resta a 13 px e sotto la citazione, quindi la gerarchia tiene, ma va guardata | |
| `Card` soft, layout `row` (`src/components/ui/card.tsx`) | Exists: avviso della quota esaurita, con `Button` "Passa a Pro" a destra, come `LimitWarning` | Nessuno. `LimitWarning` non si riusa: ha titolo e testo fissi sul limite dei feedback, e generalizzarlo cambierebbe un componente che funziona | |
| Stato vuoto (markup di `EmptyNoFeedback` in `src/app/(app)/themes/page.tsx`: titolo serif 40 px, riga, azione) | Exists come schema, composto con le stesse classi. Per "Non trovo feedback che ne parlano" si usa lo stesso titolo serif | Nessuno | |
| `AskForm` (`src/components/ask-form.tsx`) | New | | Pezzo di schermata client, come `AnalyzeButton`: tiene lo stato del flusso (pronto, attesa, risposta, nessuna prova, errore), l'invio con Invio, la nota e la regione annunciata. Non esiste un modulo client che chiama il modello e mostra un risultato sulla stessa pagina: `AnalyzeButton` ricarica la pagina, non mostra un risultato |
| `AskAnswer` (`src/components/ask-answer.tsx`) | New | | Solo composizione di pezzi esistenti (`Stat`, `Quote`, testo): colonna del numero a 148 px come `ThemeRow`, poi testo, citazioni e perimetro. Separato da `AskForm` perché è presentazione pura e si prova da solo. Nessuna primitiva nuova |

Conto: 0 primitive nuove, 2 estensioni (una variante, un colore), 2 pezzi di schermata nuovi composti dal kit.

## Accessibility floor

**Keyboard path** (flusso principale, ordine di tabulazione):

1. Schede della barra: Temi → **Chiedi** → Feedback → Raccolta → Piano → Esci.
2. Solo in F2 Free: "Passa a Pro" nell'avviso, che nel DOM sta tra il titolo e il campo.
3. Campo "La tua domanda" (fuori da F2 riceve il focus all'apertura, quindi il primo Tab porta avanti da qui).
4. Pulsante "Chiedi ai {n} feedback".
5. Solo in E8 ed E9: il link nella nota ("Accedi", "Aggiungi feedback").
6. In F3: "Aggiungi feedback" è l'unico controllo della pagina.

- **Invio** nel campo invia la domanda; **Maiusc+Invio** va a capo (il server riduce gli a capo a spazi). Invio durante la composizione di un metodo di input (accenti con tastiera internazionale) non invia.
- La risposta non ha controlli: si legge con le frecce e si naviga per titoli (h1 della pagina, h2 "Risposta a «…»").
- Nessuna azione richiede il mouse. Nessuna scorciatoia globale nuova.

**Contrast:** WCAG 2.2 AA come pavimento, con un obiettivo più alto per ciò che si legge dalla sala.

| Elemento | Colori | Rapporto | Obiettivo |
|---|---|---|---|
| Numero, testo della risposta, citazioni, titolo | `ink` su `paper` | 16,1:1 | ≥ 7:1 (AAA), il proiettore toglie contrasto |
| Riga sotto il titolo, suggerimento, perimetro, nota della quota, `<cite>` dopo l'estensione | `ink-muted` su `paper` | 5,9:1 | ≥ 4,5:1 |
| Errori | `problem` su `paper` | 5,9:1 | ≥ 4,5:1 |
| Testo nell'avviso della quota | `on-highlight` su `highlight-soft` | 8,7:1 | ≥ 4,5:1 |
| Frase evidenziata | `ink` su `highlight` | 12,7:1 | ≥ 4,5:1 |
| Bordo del campo (variante `ask`) | `ink-muted` su `paper` | 5,9:1 | ≥ 3:1 per i confini dei controlli |
| Anello di focus | `ink`, 2 px, scostato 2 px `[code:src/app/globals.css]` | 16,1:1 | ≥ 3:1 |
| Da non usare su questa pagina per testo da leggere | `ink-subtle` su `paper` | 3,0:1 | Solo decorazione; anche il placeholder resta vuoto |

Rapporti calcolati con la formula WCAG sui valori dei token in `src/app/globals.css`.

**Focus:**

- **On open:** nel campo della domanda (`autoFocus`). In F2 niente `autoFocus` **[D]**: con il pulsante spento il campo non serve, e l'avviso della quota, che nel DOM viene subito dopo il titolo, è la prima cosa che legge chi naviga con la tastiera o il lettore di schermo. In F3 nessun campo: il focus resta al documento, primo Tab sulle schede.
- **On submit / attesa:** resta nel campo, che diventa `readOnly`, non `disabled`. Il pulsante usa `aria-disabled`, non `disabled`, e il gestore ignora i clic mentre è spento. Qui ci si stacca di proposito da `AnalyzeButton`, che usa `disabled`: con Invio il focus è nel campo, ma con il clic o con Tab + Spazio il focus è sul pulsante, e spegnere l'elemento che ha il focus lo manda al `body`. Nell'analisi succede una volta al mese, qui a ogni domanda.
- **On error:** E1 ed E2 riportano il focus nel campo, con `aria-invalid="true"` e l'errore collegato con `aria-describedby`. E5-E9 lasciano il focus nel campo, con il testo della domanda intatto per riprovare.
- **On completion:** il focus resta nel campo, cursore in fondo al testo, pronto per la domanda successiva. La pagina scorre fino all'intestazione della risposta solo se la risposta è sotto la piega.
- **On close:** nessun dialog o pannello su questa pagina. "Passa a Pro" e "Aggiungi feedback" sono navigazioni: la pagina di arrivo parte dal suo inizio.

**Annuncio della risposta al lettore di schermo:**

- Una sola regione `role="status"` (educata) sotto il pulsante, come in `AnalyzeButton`. Annuncia in ordine: "Sto leggendo 212 feedback…" all'invio; "Ci vuole più del solito…" a 15 s; alla fine un riassunto: "Risposta pronta. 23 feedback ne parlano. {testo della risposta} Sotto ci sono 5 citazioni." Oppure: "Non trovo feedback che ne parlano. Letti 212 feedback degli ultimi 90 giorni." Oppure il testo dell'errore.
- Il riassunto non legge le citazioni: si trovano con la navigazione per titoli, sotto l'h2 della risposta, nella `section` etichettata da quell'h2.
- Il focus non si sposta sulla risposta: spostarlo annuncerebbe due volte e costringerebbe a tornare indietro per la domanda successiva.

**Oltre il pavimento, già deciso:**

- Ogni controllo ha un nome: il campo dall'etichetta visibile, il pulsante dal suo testo.
- Nessuna informazione solo nel colore: gli errori dicono cosa è successo a parole; il giallo evidenzia una frase che è comunque nel testo; la differenza tra parole di Voce e parole dei clienti è anche nelle virgolette tipografiche e nella riga con canale e data, non solo nel carattere.
- Nessuna animazione, quindi nessun problema con il movimento ridotto.

## Decisioni prese per delega

Tutte "Deciso dal modello per delega di Mario (2026-09-27)" `[doc:user-2026-09-26-delega]`, da rivedere da lui:

1. Pagina sua `/ask` con scheda "Chiedi" seconda da sinistra; nessun ingresso dalla pagina dei temi.
2. La quota delle domande si mostra sotto il pulsante di Chiedi, non nella barra dell'app; si scrive nei piani di `/billing` e della landing.
3. Colonna del numero come un tema; testo della risposta in sans a 24 px, citazioni in serif: la serif significa "parole vere di un cliente".
4. "Non trovo feedback che ne parlano" senza numero e senza il testo del modello, con il titolo serif dello stato vuoto.
5. Domanda da 1 a 300 caratteri, contatore da 250; Invio invia.
6. Nessuna bozza, nessuna domanda nell'URL, nessun pulsante per annullare l'attesa; la risposta si perde lasciando la pagina e la pagina lo dice.
7. Attesa: messaggio più lungo a 15 s, interruzione a 60 s (proposta per la spec); risposta mostrata intera, non a pezzi.
8. Variante `ask` di `Textarea` e colore di `<cite>` portato a `ink-muted` in tutta l'app.
9. Nelle citazioni canale e data, mai il nome del cliente.
10. Focus che resta nel campo dall'apertura alla risposta (tranne F2, senza focus automatico); pulsante con `aria-disabled` invece di `disabled`, diversamente da `AnalyzeButton`; annuncio tramite una sola regione di stato.

## Da passare a `04-spec.md` (flow list)

- **F1** Fare una domanda e leggere la risposta: stati F1.1-F1.5, errori E1, E2, E5, E6, E7, E8, E9.
- **F2** Quota esaurita: E3 (Free), E4 (Pro).
- **F3** Nessun feedback su cui rispondere: testi A e B.
- Numeri da fissare nella spec, qui proposti: 300 caratteri, 5 citazioni, 3 frasi, 60 s, 15 s, 500 feedback, 90 giorni.
- Candidati alla lista "fuori ambito", già esclusi da questo disegno: cronologia delle domande, domande di seguito con contesto, pulsante "Copia", link all'elenco completo dei feedback collegati, ingresso dalla pagina dei temi, quota nella barra dell'app, ritorno a `/ask` dopo l'accesso, layout per telefono, nomi dei clienti nelle citazioni.

## Not covered here

- **Rifinitura visiva.** Il disegno usa solo token e componenti di `DESIGN.md`; non è stato fatto un passaggio di qualità visiva con strumenti dedicati, e non è stata disegnata una tavola in `design/`. Resta da fare la verifica a occhio nel browser a 1280×720 con zoom 125% e 150%, che è anche la prova del proiettore.
- **Layout per telefono.** L'app oggi è pensata per il desktop (barra a riga unica); Chiedi non cambia questa scelta.
- **Nota per la demo, non di disegno.** Le prove di settembre consumano la quota di settembre; il 1 ottobre la quota riparte, ma su Free le prove del giorno stesso possono esaurire le 10 domande prima della sala. Il workspace della demo conviene su Pro, ed è già escluso dalla metrica (`03-solution-bet.md`).

## DESIGN COMPLETE

**Placement:** scheda "Chiedi" tra Temi e Feedback, pagina `/ask`, `/ask` nel proxy, quota scritta nei piani · **Flows:** 3 (F1 domanda e risposta, F2 quota esaurita, F3 nessun feedback), ogni ingresso e abbandono dichiarato · **States:** 7 righe × 6 stati, 9 errori con testo reale · **Components:** 0 primitive nuove, 2 estensioni (`Textarea` variante `ask`, colore di `<cite>` in `Quote`), 2 pezzi di schermata nuovi (`AskForm`, `AskAnswer`) · **Accessibility floor:** keyboard path con ordine di tabulazione, contrast ≥ 4,5:1 per il testo e ≥ 7:1 per ciò che si legge dalla sala, ≥ 3:1 per i confini dei controlli, focus che resta nel campo con annuncio tramite `role="status"`
