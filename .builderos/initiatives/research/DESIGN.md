# Design: Research, customer discovery

**Phase:** 4 · **Cycle:** 1 · **Mode:** lite · **Date:** 2026-09-28 · **Owner:** Mario Miletta (forma ibrida e costo del verdetto scelti da Mario; struttura scritta dal modello per delega)

Disegno strutturale della Research ibrida scelta da Mario: una domanda aperta con temi che crescono nel tempo, più ipotesi facoltative, ciascuna con il suo verdetto (confermata / smentita / da rivedere), le citazioni verificate che lo sostengono e le voci arrivate dopo che l'ipotesi è stata scritta `[doc:user-2026-09-28-research-modello-e-deroga-3]`. Ogni feedback appartiene a una sola Research; la casella generica dei feedback sparisce, senza compatibilità all'indietro `[doc:user-2026-09-28-research-round1]`. Il verdetto è una seconda chiamata al modello e conta contro la quota di analisi del piano (Free 3, Pro 100 al mese) `[doc:user-2026-09-28-research-costo-verdetto-e-deroga-aggiornata]`.

Il flusso che serve tutto il resto è l'azione principale della scommessa: **il PM tiene aperta una domanda, raccoglie feedback nel tempo, avvia l'analisi con un clic e legge i temi e, se ha scritto ipotesi, un verdetto per ciascuna con le citazioni** (`03-solution-bet.md`, opzione 5). La metrica di fase 2 misura proprio questo passaggio: da 5 feedback raccolti a una sintesi con almeno una citazione verificata.

Vincoli di consegna che guidano ogni scelta sotto:

- Nulla va in produzione prima della masterclass del 1 ottobre 2026: la demo usa il flusso attuale (`/f/phc26`, `/sala`, Chiedi, account demo). Si costruisce su `feat/research` con PR in bozza `[doc:user-2026-09-28-research-modello-e-deroga-3]`.
- Ogni stringa nuova è una chiave dei cataloghi in italiano e in inglese; l'output dell'AI segue la lingua dell'interfaccia `[code:src/i18n/messages/index.ts]` `[code:src/app/(app)/themes/actions.ts]`.
- Il sistema visivo è quello di `DESIGN.md` alla radice. Qui non si inventa uno stile: si spostano pagine che esistono dentro la Research e si dicono le estensioni che servono.

Tutte le scelte marcate **[D]** sono "Deciso dal modello per delega di Mario (2026-09-28)" `[doc:user-2026-09-28-research-round1]`.

**Parola nell'interfaccia.** Il glossario di `PRODUCT.md` chiama "Feedback" il messaggio di un cliente, e i cataloghi lo usano ovunque. L'interfaccia continua a dire "feedback" anche per le note di intervista **[D]**: passare a "voci" cambierebbe ogni catalogo, la sala e i test, ed è un cambio di nome che nessuno ha chiesto. In questo documento "voci" compare solo dove cito la scommessa.

## Placement

**Today:** barra dell'app con cinque schede, tutte sul workspace intero `[code:src/components/app-tabs.tsx]`

```
[Voce] Acme   Temi | Chiedi | Feedback | Raccolta | Piano    [Free] Feedback: 37 di 100. Analisi di settembre: 1 di 3   IT/EN   Esci
```

- `/themes`: temi dell'ultima analisi del workspace, ultimi 90 giorni, massimo 500 feedback `[code:src/app/(app)/themes/page.tsx]` `[code:src/lib/analysis.ts]`
- `/ask`: Chiedi su tutto il workspace, stessa finestra `[code:src/app/(app)/ask/page.tsx]`
- `/feedback`: la casella generica, filtrabile per canale `[code:src/app/(app)/feedback/page.tsx]`
- `/collect`: un solo modulo pubblico per workspace (slug, domanda, acceso o spento sulla riga del workspace), CSV, inserimento manuale `[code:src/app/(app)/collect/page.tsx]` `[code:supabase/migrations/20260924225437_create_core_schema.sql]`
- `/sala`: schermo proiettato del workspace, fuori dalla barra `[code:src/app/sala/page.tsx]`
- `/f/[slug]`: modulo pubblico, sempre in italiano `[code:src/components/public-form.tsx]` `[code:src/i18n/locale.ts]`
- Dopo l'accesso l'app porta su `/themes` `[code:src/app/(auth)/actions.ts]` `[code:src/app/auth/callback/route.ts]`

**Proposed:** due livelli. La barra dell'app ha due schede, **Research** e **Piano**. Dentro una Research, una seconda fila di schede con le quattro pagine di oggi, limitate a quella Research **[D]**

```
[Voce] Acme   Research | Piano                               [Free] Feedback: 37 di 100. Analisi di ottobre: 1 di 3   IT/EN   Esci
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
← Tutte le Research
Perché i team piccoli non passano a Pro dopo la prova?                                          [ Analizza 37 feedback ]
Sintesi | Chiedi | Feedback | Raccolta
```

**Perché due livelli e non un selettore di Research nella barra.**

- **Dove se l'aspetta il PM.** La Research è il contenitore di tutto: domanda, raccolta, temi, ipotesi, Chiedi `[doc:user-2026-09-28-research-round1]`. Chi lavora su più domande pensa "apro la mia domanda e guardo cosa è arrivato", non "cambio contesto in alto e le schede di prima cambiano contenuto". Un selettore nella barra lascerebbe le schede identiche ma con dati diversi a seconda di una scelta poco visibile: il modo più facile per leggere i temi di una Research credendo che siano di un'altra.
- **Accanto a cosa.** Le quattro schede interne sono le pagine di oggi con lo stesso ordine (temi prima, poi Chiedi, poi feedback, poi raccolta). Chi ha visto la demo del 1 ottobre ritrova lo stesso schema, un livello più in basso.
- **Cosa si sposta.** Temi e ipotesi stanno insieme nella scheda **Sintesi**, perché un solo clic li produce entrambi (sotto, F7). Una scheda "Ipotesi" separata dividerebbe il risultato di un'unica azione su due pagine.
- **Criterio di stop 4.** Se le ipotesi si tolgono (`03-solution-bet.md`, Kill criteria), si toglie una sezione della scheda Sintesi, non una scheda né una rotta.
- **Costo della strada comoda, detto.** Aggiungere un filtro "Research" alle pagine di oggi costerebbe meno, ma lascerebbe viva la casella generica, che Mario ha tolto `[doc:user-2026-09-28-research-round1]`.

**Rotte** (in inglese come le altre) **[D]**:

| Rotta | Cosa | Sostituisce |
|---|---|---|
| `/research` | Elenco delle Research; nel workspace vuoto è il primo accesso con il campo della domanda | `/themes` come pagina d'arrivo |
| `/research/new` | Crea una Research (un campo) | niente |
| `/research/[id]` | Scheda Sintesi: ipotesi e verdetti, poi temi | `/themes` |
| `/research/[id]/themes/[themeId]` | Dettaglio di un tema | `/themes/[id]` |
| `/research/[id]/ask` | Chiedi limitato alla Research | `/ask` |
| `/research/[id]/feedback` | Feedback della Research, filtro per canale | `/feedback` |
| `/research/[id]/collect` | Modulo e QR della Research, note di intervista, CSV, elimina la Research | `/collect` |
| `/research/[id]/qr` | Scarica il QR code | `/collect/qr` |
| `/research/[id]/sala` | Schermo della sala della Research | `/sala` |
| `/research/[id]/sala/status` | Conteggio dal vivo | `/sala/status` |
| `/f/[slug]` | Modulo pubblico, uno per Research, sempre in italiano | lo stesso, ma lo slug sta sulla Research |

**Moves:**

| Cosa cambia | Dove | Perché |
|---|---|---|
| `TABS` passa a Research e Piano | `src/components/app-tabs.tsx` | Unico ingresso alle Research; le pagine di oggi scendono di un livello |
| `APP_PATHS` diventa `["/research", "/billing"]`; l'eccezione della server action di `/ask` passa a `/research/[id]/ask` | `src/proxy.ts` | Stato di permesso di ogni pagina nuova. `/themes`, `/ask`, `/feedback`, `/collect`, `/sala` si cancellano, senza reindirizzamenti **[D]**: niente compatibilità all'indietro `[doc:user-2026-09-28-research-round1]` |
| Dopo l'accesso e dalla conferma email si arriva su `/research` | `src/app/(auth)/actions.ts`, `src/app/auth/callback/route.ts`, `AUTH_PATHS` in `src/proxy.ts` | La pagina d'arrivo di oggi non esiste più |
| Slug, stato acceso/spento e domanda del modulo passano dalla riga del workspace alla Research | `workspaces.form_*` in `supabase/migrations/20260924225437_create_core_schema.sql` | Un modulo per Research `[doc:user-2026-09-28-research-round1]` |
| Il limite Free di 100 feedback resta **per workspace**, sommando tutte le Research **[D]** | `private.feedback_limit` | Cambiare limiti e piani è riservato a Mario `[code:AGENTS.md]` |
| Nessun limite al numero di Research, né su Free né su Pro **[D]** | niente da cambiare | Stesso motivo: un limite nuovo è una decisione di piano |
| Riga dei piani: "Il verdetto delle ipotesi usa 1 analisi" | `src/app/(app)/billing/page.tsx`, prezzi della landing in `src/app/page.tsx` | Il costo del verdetto è parte del piano `[doc:user-2026-09-28-research-costo-verdetto-e-deroga-aggiornata]`: se non è scritto dove si sceglie il piano, il primo "hai usato le 3 analisi" dopo un solo clic è una sorpresa |
| La quota nella barra dell'app resta com'è (feedback del workspace, analisi del mese) | `src/components/app-bar.tsx` | Le quote sono del workspace, non della Research |

## Dati esistenti dopo la migrazione (demo della masterclass)

Nulla si unisce prima del 1 ottobre 2026. Dopo, la migrazione che introduce la Research sposta i dati di ogni workspace esistente in **una Research iniziale** **[D]**:

| Oggi, sul workspace | Dopo, sulla Research iniziale |
|---|---|
| `form_question`, oppure niente | Domanda della Research: la domanda del modulo se c'è, altrimenti "Cosa dicono i clienti di {workspace}?" (in italiano, come il modulo) |
| `form_slug`, `form_enabled`, `form_question` | Gli stessi valori sulla Research: `/f/phc26` e il suo QR code continuano a funzionare |
| Tutti i feedback | `research_id` della Research iniziale, poi `not null` |
| Analisi, temi con priorità e stato, domande di Chiedi, righe di costo | Legati alla Research iniziale |
| Nessuna ipotesi | Nessuna ipotesi |

Perché spostare invece di ricreare, anche se Mario ha detto che i dati si possono ricreare `[doc:user-2026-09-28-research-round1]`:

- **Il QR code di `/f/phc26`** sarà sulle slide e nelle foto della masterclass. Chi lo inquadra dopo il rilascio trova ancora il modulo.
- **Le risposte della sala** (circa 230 PM `[doc:user-2026-09-26-init]`) sono i primi feedback veri su Voce: cancellarle toglie a Mario materiale per il seguito della masterclass.
- **Non è compatibilità all'indietro.** È una migrazione di dati una tantum: dopo, nessun percorso del codice conosce un feedback senza Research.

Cosa non sopravvive: `/sala` (ora `/research/[id]/sala`) e ogni segnalibro alle pagine di oggi. Il workspace della demo resta escluso dalla metrica come già scritto in `03-solution-bet.md`. I dati di sviluppo (`supabase/seed.sql`) si riscrivono con le Research: almeno un workspace con due Research, una con ipotesi e verdetti, una senza. Il test `e2e/english.spec.ts` che reclama lo slug `phc26` sul workspace va riscritto sulla Research.

**Irreversibile, detto.** La migrazione in produzione cambia la forma di ogni feedback e toglie le colonne del modulo dal workspace. AGENTS.md riserva a Mario le migrazioni remote `[code:AGENTS.md]`: la data la decide lui dopo la masterclass.

## Information architecture

```
/research                                   elenco (o primo accesso)
├── Intestazione        "Le tue Research" + riga + pulsante "Nuova Research"
└── Righe               una per Research, dalla più recente per attività
    ├── Numero          feedback della Research (il numero guida, 48 px)
    ├── Domanda         link alla Research
    └── Stato           temi, ipotesi e verdetti, feedback arrivati dopo l'ultima analisi, modulo spento

/research/[id]                              una Research
├── Testata comune      "← Tutte le Research", domanda (h1, modificabile), riga dei conteggi,
│                       pulsante "Analizza N feedback" con la nota della quota (solo in Sintesi)
├── Schede              Sintesi | Chiedi | Feedback | Raccolta
└── Sintesi (default)
    ├── Ipotesi         h2; fino a 5; per ciascuna: frase del PM, verdetto, conteggi a favore e contro,
    │                   citazioni verificate, feedback arrivati dopo l'ipotesi, Modifica, Elimina;
    │                   campo "Aggiungi un'ipotesi"; pulsante "Solo il verdetto" quando serve
    └── Temi            h2; riga "cosa è cambiato dall'analisi precedente"; filtri di oggi; ThemeRow
                        con la variazione di ogni tema
```

**Ordine della Sintesi: ipotesi sopra, temi sotto** **[D]**. Quando ci sono ipotesi, il verdetto risponde a ciò che il PM voleva sapere e va letto per primo. Quando non ce ne sono, la sezione è una riga con un pulsante secondario: pesa poco e resta nello stesso posto, così la pagina non cambia ordine quando si scrive la prima ipotesi.

**Regola tipografica che regge la lettura.** Come in Chiedi: la serif è solo per le parole dei clienti, verificate. La domanda della Research e le ipotesi sono parole del PM e stanno in sans; il ragionamento del verdetto è di Voce e sta in sans, in `ink-muted`. Da lontano si leggono, in ordine: la parola del verdetto, i conteggi, la frase evidenziata della prima citazione.

**Verdetto senza colore.** I tre colori dei tipi di tema non si usano per altro (`DESIGN.md`, Colori). Il verdetto si distingue con una parola e un segno: "✓ Confermata", "✕ Smentita", "? Da rivedere", in inchiostro **[D]**. Il segno è decorativo (`aria-hidden`), la parola porta il significato.

**Perimetro di lettura** **[D]**. Analisi, verdetto e Chiedi leggono tutti i feedback della Research, fino ai 500 più recenti (`ANALYSIS_MAX_FEEDBACK` `[code:src/lib/analysis.ts]`), senza la finestra dei 90 giorni. La Research è delimitata dalla domanda, non dal tempo; e le note di intervista incollate portano spesso date vecchie, che la finestra toglierebbe senza dirlo.

## Flows

### F1. Primo accesso, workspace vuoto

**Entry points:** registrazione con email confermata o Google (arrivo su `/research`); accesso di un utente senza Research; ultima Research eliminata (F12); URL diretto `/research`.

| Step | User action | System response | Branches |
|---|---|---|---|
| 1. Arrivo | Apre `/research` senza Research | Stato vuoto: titolo serif, una riga, il campo "La tua domanda" già sulla pagina con il focus, il pulsante "Crea la Research". Nessun pulsante "Nuova Research" in testata: il campo è già qui | Ha già Research → elenco (F2.1) |
| 2. Domanda | Scrive la domanda e invia (Invio o pulsante) | Come F2.3 | Errori RC1, RC2, RC3, RC4 |
| 3. Arrivo nella Research | | Porta su `/research/[id]`: la Sintesi senza feedback mostra le tre strade di raccolta (F4, F5, F6) | |

**Abandonment:** prima dell'invio il testo si perde; nessuna bozza **[D]** (una frase, riscriverla costa meno di un meccanismo). **Reversible:** la domanda si modifica dopo (F12).

Perché il campo è nello stato vuoto e non dietro un pulsante: il North Star misura la prima analisi entro 24 ore dalla registrazione, e la Research aggiunge passi prima della prima analisi (`02-definition.md`, guardrail). Qui il passo aggiunto è un campo solo.

### F2. Creare una Research

**Entry points:** "Nuova Research" nella testata dell'elenco; URL diretto `/research/new`; F1 (stesso campo, nello stato vuoto).

| Step | User action | System response | Branches |
|---|---|---|---|
| 1. Elenco | Apre `/research` | Righe dalla più recente per attività (ultimo feedback, ultima analisi o creazione) | Nessuna Research → F1 |
| 2. Apertura | Preme "Nuova Research" | `/research/new`: titolo, riga, campo con il focus, pulsante "Crea la Research", link "Annulla" all'elenco | |
| 3. Invio | Scrive e invia | Il server valida (1-200 caratteri dopo il trim **[D]**), crea la Research con uno slug nuovo per il modulo (stessa regola di oggi, `private.new_form_slug`), modulo acceso, domanda del modulo vuota (il modulo mostra la domanda di default). Il pulsante dice "Creo…" | Vuota: RC1. Troppo lunga: RC2. Errore di salvataggio: RC3. Sessione scaduta: RC4 |
| 4. Uscita | | Va a `/research/[id]` | |

**Domanda della Research e domanda del modulo sono due campi** **[D]**. La prima è del PM ("Perché i team piccoli non passano a Pro?"), la seconda è mostrata a sconosciuti e spesso non si può porre così ai clienti. La creazione chiede solo la prima; la seconda si sceglie in Raccolta, con il default di oggi.

**Le ipotesi non si chiedono alla creazione** **[D]**. Si entra dalla domanda, non dall'ipotesi: è la tesi della scommessa (`03-solution-bet.md`, Why). Chi ne ha una la scrive nella Sintesi, un clic dopo.

**Abandonment:** "Annulla", indietro o chiusura: niente viene creato, il testo si perde. **Reversible:** la domanda si modifica, la Research si elimina (F12).

### F3. Aggiungere, modificare, eliminare un'ipotesi

**Entry points:** "Scrivi un'ipotesi" nella sezione Ipotesi vuota; campo "Aggiungi un'ipotesi" sotto le ipotesi esistenti; "Modifica" ed "Elimina" su ogni ipotesi. Nessun altro ingresso **[D]**: né alla creazione, né dalla pagina di un tema.

| Step | User action | System response | Branches |
|---|---|---|---|
| 1. Apertura | Preme "Scrivi un'ipotesi" (sezione vuota) | Il pulsante lascia il posto al campo con il focus, suggerimento con un esempio, "Aggiungi l'ipotesi", "Annulla" | Già 5 ipotesi: il campo non compare, al suo posto H3 |
| 2. Invio | Scrive e invia | Il server valida (1-200 caratteri **[D]**, massimo 5 per Research **[D]**) e salva con l'ora di scrittura. L'ipotesi compare in fondo con "Nessun verdetto ancora" e la nota "Il verdetto arriva con la prossima analisi, o con «Solo il verdetto»". Il campo si svuota e resta aperto con il focus | H1, H2, H3, H4, sessione scaduta (E-SESS). Analisi in corso sulla Research: H7 |
| 3. Modifica | Preme "Modifica" | Il testo diventa un campo con "Salva" e "Annulla". Se l'ipotesi ha un verdetto, sopra il campo: H5 | Salva con verdetto → il verdetto si toglie (era sulla frase di prima) e l'ora di scrittura riparte da adesso, così il conto dei feedback arrivati dopo resta onesto |
| 4. Eliminazione | Preme "Elimina" | Conferma nella riga: H6 con "Elimina l'ipotesi" e "Annulla" | Conferma → l'ipotesi e il suo verdetto spariscono |

**Abandonment:** testo non salvato nel campo si perde lasciando la pagina **[D]**. Una modifica aperta e non salvata non tocca il verdetto. **Reversible:** aggiunta sì (si elimina); modifica e eliminazione no: il verdetto tolto non torna, si rifà con un'analisi. La conferma H6 e l'avviso H5 lo dicono prima.

### F4. Raccogliere con il modulo pubblico e il QR code

**Entry points (PM):** scheda Raccolta; stato vuoto della Sintesi (card gialla del modulo); "Riaccendi il link in Raccolta" dallo schermo della sala. **Entry points (chi risponde):** link `/f/[slug]`, QR code stampato o proiettato.

| Step | User action | System response | Branches |
|---|---|---|---|
| 1. Raccolta | Apre la scheda | Card del modulo come oggi (`Card` highlight, `media`): stato, link, "Copia il link", "Scarica il QR code", "Apri lo schermo della sala", QR a destra. Sotto: accendi/spegni, nuovo link, domanda del modulo | Modulo spento: card neutra con il testo di oggi. Workspace Free a 100 feedback: testo `limitReached` di oggi |
| 2. Condivisione | Copia il link o scarica il QR | Come oggi, con percorso della Research | |
| 3. Risposta | Chi risponde apre `/f/[slug]` | Modulo di oggi, in italiano, con la domanda del modulo della Research e il nome del workspace. L'invio crea un feedback in quella Research, canale "Modulo pubblico" | Research eliminata o slug rigenerato: 404 come oggi. Modulo spento o workspace pieno: `FormUnavailable` di oggi |
| 4. Arrivo | Il PM torna sulla Research | La riga dei conteggi e la Sintesi mostrano i feedback nuovi arrivati dopo l'ultima analisi | |

**Abandonment:** il PM non ha niente da perdere; chi risponde perde il testo come oggi. **Reversible:** spegnere il link sì; generare un nuovo link no, e la conferma di oggi lo dice (`collect.formLink.regenerateWarning`).

### F5. Incollare note di intervista

**Entry points:** scheda Raccolta, sezione "Incolla le note di un'intervista" (`#notes`); card "Incolla le note" nello stato vuoto della Sintesi; link "Aggiungi feedback" negli stati vuoti di Chiedi e Feedback.

Il modulo manuale di oggi diventa questo **[D]**: stessi campi (testo, canale, cliente facoltativo, data facoltativa), con il canale precompilato "Intervista" e il limite del testo alzato da 2.000 a 10.000 caratteri solo qui **[D]**. Un'intervista è un feedback: una persona, un insieme di note. Si incolla un'intervista alla volta, e resta la strada per un feedback copiato da un'email o da Slack cambiando il canale.

| Step | User action | System response | Branches |
|---|---|---|---|
| 1. Scrittura | Incolla le note, sceglie canale, persona, data | Contatore sempre visibile "{n} / 10.000" | |
| 2. Invio | Preme "Aggiungi le note" | Il server valida e salva nella Research. "Aggiunte a questa Research. Le trovi in Feedback." Il testo e la persona si svuotano, canale e data restano per la prossima | N1, N2, N3 (limite Free), N4 (data futura), sessione scaduta |

**Da verificare nella spec:** con note fino a 10.000 caratteri, 500 feedback possono superare il contesto del modello. La spec fissa un tetto sul totale dei caratteri letti, e il perimetro parziale lo dice (stato Partial di F7).

**Abandonment:** il testo si perde lasciando la pagina **[D]**. Per note lunghe è un rischio vero; nessuna bozza in questa versione, e lo stato Empty del campo lo dice ("Le note non si salvano finché non le aggiungi"). **Reversible:** il feedback si elimina dalla scheda Feedback come oggi.

### F6. Importare un CSV

**Entry points:** scheda Raccolta, sezione CSV (`#csv`); card "Importa un CSV" nello stato vuoto della Sintesi.

Flusso di oggi senza cambi di passi (`src/components/csv-import.tsx`: scegli, anteprima, importa), con due differenze: i feedback vanno nella Research aperta, e i duplicati si cercano solo nella stessa Research **[D]** (lo stesso ticket può servire a due domande). Il risultato dice "Importati {n} feedback in questa Research" e il pulsante porta alla scheda Feedback della Research.

**Abandonment:** prima di "Importa" non si salva niente, come oggi. **Reversible:** nessun annullamento dell'import in blocco; i feedback si eliminano uno per uno. Come oggi.

### F7. Avviare l'analisi (temi e verdetto): flusso principale

**Entry points:** pulsante "Analizza N feedback" nella testata della scheda Sintesi; pulsante nello stato "feedback senza analisi" della Sintesi; "Solo il verdetto" nella sezione Ipotesi (F8); "Analizza le risposte" nello schermo della sala (F10, solo temi).

| Step | User action | System response | Branches |
|---|---|---|---|
| 1. Apertura | Apre la Sintesi | Il server legge i feedback della Research (fino ai 500 più recenti), le ipotesi, l'ultima analisi e la quota. Il pulsante dice "Analizza 37 feedback"; sotto, la nota della quota con il costo: 1 analisi senza ipotesi, 2 con ipotesi (temi e verdetto) | Nessun feedback → stato vuoto con le tre strade di raccolta. Quota finita → F11. Quota a 1 con ipotesi → Partial (sotto) |
| 2. Avvio | Preme il pulsante | Un solo clic avvia i temi e, se ci sono ipotesi, il verdetto di tutte le ipotesi in una chiamata **[D]**. Il server controlla quota e che non ci sia un'altra analisi in corso nel workspace (come `start_analysis`). Pulsante "Analisi in corso…" con `aria-disabled`, nota "Può volerci qualche minuto. Temi e verdetti compaiono qui appena è finita." Le ipotesi non si modificano durante l'analisi (H7) | Occupato: S2. Sessione: E-SESS. Connessione: S10 |
| 3. Attesa | Aspetta, o lascia la pagina | Come l'analisi di oggi, fino a 4 minuti `[code:TECH.md]`. L'analisi continua sul server anche se si chiude la pagina | Tempo scaduto o errore: S5, S6 o S7 a seconda di cosa è fallito |
| 4. Risultato | Legge | La pagina si aggiorna: verdetti nella sezione Ipotesi (F8), temi con la variazione dall'analisi precedente, riga "Dall'analisi del {data}: {n} feedback in più, {m} temi nuovi". La nota della quota si aggiorna. Annuncio nella regione di stato | Nessun tema con almeno 2 feedback: S8. Verdetto senza citazioni verificate per un'ipotesi: "Da rivedere" con "Nessuno dei {n} feedback ne parla" (esito, non errore) |

**Quota** (firmata da Mario `[doc:user-2026-09-28-research-costo-verdetto-e-deroga-aggiornata]`, dettagli **[D]**): i temi usano 1 analisi, il verdetto di tutte le ipotesi della Research usa 1 analisi, qualunque sia il numero di ipotesi. Come oggi, una parte che fallisce non conta. Il pulsante dice il costo prima del clic, mai dopo.

**Solo temi quando resta 1 analisi e ci sono ipotesi** **[D]**: il pulsante diventa "Analizza solo i temi di 37 feedback" e la nota lo spiega (S4). Il verdetto si fa il mese dopo o con Pro. Scegliere i temi e non il verdetto: i temi sono la base della Research, e il verdetto su feedback non ancora raggruppati vale di meno. Da confermare con Mario.

**Abandonment:** lasciata la pagina durante l'attesa, l'analisi finisce sul server e conta nella quota se riesce; tornando, la Sintesi mostra il risultato o, se è ancora in corso, il pulsante spento con "Analisi in corso…". **Reversible:** un'analisi avviata non si annulla; l'analisi precedente resta leggibile finché la nuova non è finita.

### F8. Leggere il verdetto con le citazioni, e "Solo il verdetto"

**Entry points:** sezione Ipotesi della Sintesi dopo F7; riga dell'elenco con "2 ipotesi: 1 confermata, 1 da rivedere" (porta alla Sintesi); "Solo il verdetto".

**Cosa mostra ogni ipotesi con verdetto:**

1. La frase del PM (sans, 20 px, grassetto).
2. Il verdetto: "✓ Confermata", "✕ Smentita", "? Da rivedere" (24 px, grassetto, inchiostro), e sotto i conteggi fatti dal server sui collegamenti verificati: "18 a favore · 3 contro · su 37 letti".
3. Due o tre frasi di ragionamento, generate, nella lingua dell'interfaccia al momento dell'analisi (sans, `ink-muted`).
4. Le citazioni verificate carattere per carattere come nell'analisi `[code:src/lib/analysis.ts]`: fino a 3 "A favore" e fino a 2 "Contro" **[D]**, con la frase chiave evidenziata, canale e data, mai il nome del cliente.
5. **I feedback arrivati dopo l'ipotesi** (vincolo di fase 3 `03-solution-bet.md`): "Scritta il 14 ott. Dei 37 feedback letti, 9 sono arrivati dopo." Con zero: "Tutti i 37 feedback letti erano già arrivati quando l'hai scritta: il verdetto li rilegge, non la mette alla prova con feedback nuovi." Sempre visibile, mai nascosto dietro un clic.
6. Se dopo il verdetto sono arrivati feedback: "Dopo questo verdetto sono arrivati 6 feedback."

**"Solo il verdetto"** (pulsante secondario sotto le ipotesi) **[D]**: compare quando c'è almeno un'ipotesi senza verdetto, o con feedback arrivati dopo il verdetto, e nessun feedback è arrivato dopo l'ultima analisi dei temi. Rifà solo il verdetto di tutte le ipotesi, 1 analisi. Serve al caso che la scommessa descrive: il PM legge i temi, scrive un'ipotesi, vuole il verdetto senza pagare di nuovo i temi.

| Step | User action | System response | Branches |
|---|---|---|---|
| 1. Lettura | Scorre le ipotesi | Verdetti come sopra. Ipotesi senza verdetto: "Nessun verdetto ancora" | |
| 2. Solo il verdetto | Preme "Solo il verdetto di 2 ipotesi" | Come F7.2-4, solo per il verdetto; nota "Userai 1 delle 3 analisi di ottobre." | S2, S6, S3/F11, E-SESS, S10 |

**Abandonment:** come F7. **Reversible:** no; il verdetto precedente resta visibile fino all'arrivo del nuovo.

### F9. Chiedi in una Research

**Entry points:** scheda Chiedi della Research; URL diretto `/research/[id]/ask`.

Il flusso di Chiedi di oggi, invariato nei passi e negli stati (`.builderos/initiatives/chiedi-ai-feedback/DESIGN.md`, F1-F3), con tre differenze:

- Legge solo i feedback della Research, fino ai 500 più recenti, senza la finestra dei 90 giorni **[D]**. Le stringhe che nominano i 90 giorni cambiano: "Letti {n} feedback di questa Research."
- Lo stato "nessun feedback" ha una sola variante (non esiste più "solo feedback vecchi") e porta alla Raccolta della Research.
- La quota delle domande resta del workspace (Free 10, Pro 100) `[code:src/lib/plans.ts]`.

### F10. Schermo della sala per una Research

**Entry points:** "Apri lo schermo della sala" nella card del modulo in Raccolta; URL diretto `/research/[id]/sala`.

Lo schermo di oggi (`src/components/room-screen.tsx`) con la domanda del modulo della Research, il QR della Research, il conteggio delle risposte del modulo di quella Research (canale "Modulo pubblico") e i temi dell'ultima analisi della Research.

- "Analizza le risposte" fa la stessa analisi della Sintesi: con ipotesi, temi e verdetto (2 analisi). Lo schermo mostra bolle di temi e, nella vista Verdetto, testo dell'ipotesi, parola e conteggi; mai testo dei feedback né citazioni. Sotto il pulsante, se ci sono ipotesi: "Con i temi arriva anche il verdetto delle ipotesi." (dal 2026-09-29; prima solo i temi, con "Il verdetto delle ipotesi lo trovi nella Research."; vedi `DESIGN.md` alla radice e `docs/plans/2026-09-29-verdetto-in-sala.md`)
- "Riaccendi il link in Raccolta" e "Passa a Pro" portano a `/research/[id]/collect` e `/billing`.
- "Esci dallo schermo" torna a `/research/[id]/collect`.

**Abandonment e reversibilità:** come oggi.

### F11. Quota raggiunta

**Entry points:** apertura della Sintesi o della sala con analisi finite; ultima analisi appena usata; invio da un'altra scheda; limite Free dei 100 feedback raggiunto (modulo, note, CSV); domande di Chiedi finite (F2 del disegno di Chiedi, invariato).

| Caso | Cosa si vede | Dove |
|---|---|---|
| Analisi finite, Free | Pulsante spento, nota `common.analysisLimit.free` di oggi. "Solo il verdetto" spento con la stessa nota | Testata della Sintesi, sezione Ipotesi, sala |
| Analisi finite, Pro | Nota `common.analysisLimit.pro` | Come sopra |
| Resta 1 analisi e ci sono ipotesi | S4, pulsante "Analizza solo i temi di {n} feedback" | Testata della Sintesi |
| 100 feedback su Free | `LimitWarning` di oggi in cima a Sintesi, Feedback e Raccolta, con testo sul workspace: "Hai raggiunto 100 feedback, il limite del piano Free" · "Il limite vale per tutte le tue Research: i moduli pubblici non accettano nuovi feedback. Con Pro i feedback sono illimitati e le analisi diventano 100 al mese." | Research, sala (stato "Il modulo è pieno") |

"Passa a Pro" porta a `/billing`, flusso di pagamento esistente. **Abandonment:** niente da perdere.

### F12. Modificare la domanda, eliminare una Research

**Entry points:** "Modifica" accanto alla domanda nella testata della Research; "Elimina la Research" in fondo alla scheda Raccolta.

| Step | User action | System response | Branches |
|---|---|---|---|
| 1. Modifica | Preme "Modifica" | La domanda diventa un campo con "Salva" e "Annulla" | RC1, RC2, RC3 |
| 2. Salva | | La domanda cambia. Temi, ipotesi e verdetti restano: la domanda è il nome della Research, non entra nel prompt dei temi | |
| 3. Elimina | Preme "Elimina la Research" | Conferma nella riga (stesso schema di `FormLinkControls`): D1 con "Elimina la Research" e "Annulla" | |
| 4. Conferma | Preme "Elimina la Research" | Cancella Research, feedback, analisi, temi, ipotesi, verdetti, domande di Chiedi; il link del modulo smette di funzionare. Porta a `/research` con "Research eliminata." | Errore: D2. Era l'ultima → F1 |

**Reversible:** la modifica sì; l'eliminazione no, e D1 lo dice con i numeri.

## States

Sei stati per passo. La colonna Permission copre chi non ha fatto l'accesso, la Research di un altro workspace e i limiti del piano. Dove uno stato non si applica, la cella dice perché.

| Flow / step | Empty | Loading | Partial | Error | Success | Permission |
|---|---|---|---|---|---|---|
| F1 Primo accesso | Titolo serif, riga, campo con il focus, "Crea la Research" | Rendering sul server come le altre pagine | Non si applica: nessuna Research o almeno una | Lettura fallita: pagina di errore di Next.js esistente | Porta alla Research creata, Sintesi vuota con le strade di raccolta | Non autenticato: `/login` |
| F2.1 Elenco | Vedi F1 | Rendering sul server | Research senza feedback: riga con "Nessun feedback ancora" al posto del numero; Research con modulo spento: "Modulo spento" nella riga | Come F1 | Righe | Non autenticato: `/login` |
| F2.3 Creazione | Campo vuoto: nessun errore finché non si invia | "Creo…", pulsante `aria-disabled`, campo in sola lettura | Non si applica: la Research si crea intera o no | RC1, RC2, RC3, RC4 | Arrivo su `/research/[id]` | Non autenticato: `/login` |
| Testata Research | Research senza feedback: riga "Ancora nessun feedback. Il modulo è attivo." | Rendering sul server | Feedback arrivati dopo l'ultima analisi: "Ultima analisi il {data}: {n} feedback arrivati dopo." | Come F1 | Riga "{n} feedback da {c} canali, dal {inizio} al {fine}." | Research di un altro workspace o eliminata: pagina NF (sotto), non un 404 generico |
| F3 Ipotesi | Sezione vuota: una riga e "Scrivi un'ipotesi" | "Aggiungo…" / "Salvo…" / "Elimino…" sul pulsante, `aria-disabled` | Non si applica: un'ipotesi si salva intera | H1, H2, H4, E-SESS; H7 durante un'analisi | Ipotesi in fondo con "Nessun verdetto ancora"; annuncio "Ipotesi aggiunta" | 5 ipotesi: H3 al posto del campo |
| F4 Modulo (PM) | Non si applica: il modulo esiste dalla creazione | Copia: "Link copiato" come oggi | Workspace pieno: link attivo ma chi apre trova il messaggio gentile, testo di oggi | Accendi, spegni, nuovo link, domanda: `collect.formLink.failed`, `collect.formQuestion.failed` di oggi | Stati di oggi | Free pieno: `LimitWarning` |
| F4 Modulo (chi risponde) | Modulo con la domanda della Research | "Invio…" di oggi | Non si applica | `form.feedbackError`, `form.rateLimited` di oggi | `form.sent` di oggi | Spento o pieno: `FormUnavailable`. Slug sconosciuto o Research eliminata: 404 |
| F5 Note | Campo vuoto, suggerimento "Le note non si salvano finché non le aggiungi." | "Aggiungo…" | Non si applica | N1, N2, N4, E-SESS | "Aggiunte a questa Research. Le trovi in Feedback." | Free pieno: N3 |
| F6 CSV | Stato di oggi con la riga d'introduzione | "Leggo {file}…", "Importo…" di oggi | Righe non valide, duplicate nella Research, oltre il limite: stati di oggi | Errori di file di oggi (`collect.csvImport.*`) | "Importati {n} feedback in questa Research" + "Vedi i feedback" | Free pieno: card `freeLimitTitle` di oggi |
| F7.1 Sintesi, apertura | Nessun feedback: titolo serif, riga, tre card (modulo con QR, CSV, note) come `EmptyNoFeedback`. Feedback senza analisi: titolo "{n} feedback, ancora nessun tema", card soft "Pronti per la prima analisi" con il pulsante | Rendering sul server | Più di 500 feedback: pulsante "Analizza i 500 feedback più recenti", nota "su {totale} di questa Research". Meno di 5 feedback: nota "Con meno di 5 feedback i temi dicono poco: puoi analizzarli lo stesso." **[D]** | Come F1 | Pulsante pronto con la nota del costo | Analisi finite: F11. 1 analisi e ipotesi: S4 |
| F7.2 Avvio | Non si applica: senza feedback non c'è pulsante | "Analisi in corso…", `aria-disabled`, nota di attesa | Non si applica prima della chiamata | S2, S10, E-SESS | Accettata, si passa all'attesa | Quota finita da un'altra scheda: F11, nessuna quota spesa |
| F7.3 Attesa | Non si applica | Nota di attesa. Dopo 2 minuti: "Ci vuole più del solito. Temi e verdetti compaiono qui: puoi lasciare la pagina e tornare." **[D]** Il server interrompe a 4 minuti come oggi | Non si applica: temi e verdetto arrivano interi o non arrivano | S5, S6, S7 | Si passa al risultato | Non si applica: permessi controllati all'avvio |
| F7.4 Risultato | Non si applica: se l'analisi è finita c'è un risultato o un errore | Non si applica | Temi sì, verdetto no: S6. Verdetto sì, temi no: S5. Citazioni scartate dalla verifica: non si mostrano, i conteggi contano solo i collegamenti verificati | S7, S8 | Verdetti, temi con variazione, riga "cosa è cambiato", nota quota aggiornata, annuncio | Ultima analisi del mese: risultato visibile, poi pulsante spento con la nota di F11 |
| F8 Verdetto | Ipotesi senza verdetto: "Nessun verdetto ancora. Arriva con la prossima analisi." | "Solo il verdetto": "Verdetto in corso…" | Verdetto con feedback arrivati dopo: "Dopo questo verdetto sono arrivati {n} feedback." Zero feedback arrivati dopo l'ipotesi: nota V2 | S6, S2, S10, E-SESS | Parola, conteggi, ragionamento, citazioni, nota V1 o V2 | Analisi finite: "Solo il verdetto" spento con la nota di F11 |
| F9 Chiedi | Nessun feedback nella Research: stato vuoto di oggi, testo A, azione verso la Raccolta della Research | Come oggi | Più di 500 feedback: perimetro parziale di oggi, riferito alla Research | E1-E9 di oggi; E9 dice "In questa Research non ci sono più feedback su cui rispondere." | Come oggi | Domande finite: E3/E4 di oggi |
| F10 Sala | "Si accende con la prima risposta." di oggi | Analisi: onda sul mucchio di oggi | Nessun tema aperto dopo l'analisi: `room.pile.noOpenThemes`, con "Li trovi nella Research." | Errori dell'analisi di oggi; Research eliminata mentre lo schermo è aperto: R1 | Bolle dei temi di oggi | Modulo spento o pieno: riquadri di oggi, link alla Raccolta della Research |
| F12 Elimina | Non si applica | "Elimino…" | Non si applica: si elimina tutto o niente | D2 | Elenco con "Research eliminata." | Research di un altro workspace: NF |

**Error copy** (stringhe esatte in italiano; ognuna ha la sua chiave anche nel catalogo inglese):

| Id | Quando | Dove | Testo |
|---|---|---|---|
| RC1 | Domanda vuota alla creazione o alla modifica | Sotto il campo, rosso, `aria-invalid` | "Scrivi la domanda a cui vuoi rispondere. Per esempio: perché i team piccoli non passano a Pro dopo la prova?" |
| RC2 | Domanda oltre 200 caratteri | Sotto il campo, con il contatore | "La domanda supera i 200 caratteri: tienila a una domanda sola." |
| RC3 | Salvataggio non riuscito | Nota sotto il pulsante, rossa | "Non sono riuscito a salvare la Research. Riprova tra poco: la domanda è ancora qui." |
| RC4 / E-SESS | Sessione scaduta su qualunque azione della Research | Nota sotto il pulsante, rossa, con link "Accedi" | "La sessione è scaduta. Accedi di nuovo per continuare: copia prima il testo che hai scritto, qui non resta." |
| H1 | Ipotesi vuota | Sotto il campo | "Scrivi l'ipotesi come una frase che i feedback possono confermare o smentire. Per esempio: i team piccoli non passano a Pro perché il prezzo è per utente." |
| H2 | Ipotesi oltre 200 caratteri | Sotto il campo | "L'ipotesi supera i 200 caratteri: tienila a un'affermazione sola." |
| H3 | Già 5 ipotesi | Al posto del campo, `ink-muted` | "Questa Research ha già 5 ipotesi, il massimo. Eliminane una per scriverne un'altra." |
| H4 | Salvataggio o eliminazione non riusciti | Nota sotto il pulsante | "Non sono riuscito a salvare l'ipotesi. Riprova tra poco: il testo è ancora qui." · Eliminazione: "Non sono riuscito a eliminare l'ipotesi. Riprova tra poco." |
| H5 | Modifica di un'ipotesi con verdetto (avviso, non errore) | Sopra il campo, `ink-muted` | "Se cambi il testo, il verdetto attuale si toglie: era sulla frase di prima. Il nuovo arriva con la prossima analisi." |
| H6 | Conferma di eliminazione | Nella riga | "Elimini l'ipotesi e il suo verdetto. Non si può annullare." |
| H7 | Aggiunta, modifica o eliminazione durante un'analisi della Research | Nota sotto il pulsante | "C'è un'analisi in corso su questa Research: le ipotesi si cambiano quando è finita." |
| N1 | Note vuote | Sotto il campo | "Incolla le note prima di aggiungerle." |
| N2 | Note oltre 10.000 caratteri | Sotto il campo, con il contatore | "Le note superano i 10.000 caratteri. Tieni le parti che riportano cosa ha detto la persona." |
| N3 | Limite Free raggiunto | Nota sotto il pulsante | "Hai raggiunto 100 feedback, il limite del piano Free per tutte le tue Research: queste note non sono state salvate." |
| N4 | Data nel futuro | Sotto il campo | `collect.manualForm.errors.receivedAt` di oggi: "Scegli una data di oggi o del passato." |
| S2 | Un'altra analisi in corso nel workspace | Nota sotto il pulsante | "C'è già un'analisi in corso, forse in un'altra Research o in un'altra scheda. Ricarica la pagina tra un minuto." |
| S3 | Analisi finite | Nota sotto il pulsante | `common.analysisLimit.free` / `.pro` di oggi |
| S4 | Resta 1 analisi e ci sono ipotesi | Nota sotto il pulsante | "Ti resta 1 analisi di {mese}: basta per i temi, non per il verdetto, che ne usa un'altra. Il verdetto delle ipotesi torna disponibile il 1 {mese successivo}, o subito con Pro." |
| S5 | Temi falliti, verdetto riuscito | Nota sotto il pulsante, rossa | "I temi non sono stati aggiornati e non contano nel limite del mese: restano quelli del {data}. Il verdetto delle ipotesi è pronto qui sotto." |
| S6 | Verdetto fallito, temi riusciti (o "Solo il verdetto" fallito) | Nota nella sezione Ipotesi, rossa | "Il verdetto non è arrivato e non conta nel limite del mese: le ipotesi mostrano ancora il verdetto precedente. Riprova con «Solo il verdetto»." |
| S7 | Tutto fallito | Nota sotto il pulsante, rossa | `themes.analyzeButton.failures.failed` di oggi: "L'analisi non è riuscita e non conta nel limite del mese. Non è cambiato nulla: riprova tra poco." |
| S8 | Nessun tema con almeno 2 feedback | Nota sotto il pulsante | `themes.analyzeButton.failures.no_themes` di oggi |
| S10 | La richiesta non arriva o la risposta si perde | Nota sotto il pulsante, rossa | "Non riesco a raggiungere Voce. Se l'analisi era già partita, il risultato compare qui quando è finita: ricarica la pagina tra qualche minuto." |
| D1 | Conferma di eliminazione della Research | In fondo alla Raccolta, nella riga | "Elimini «{domanda}» con i suoi {n} feedback, i temi, le ipotesi e i verdetti. Il link del modulo e il QR code smettono di funzionare. Non si può annullare." |
| D2 | Eliminazione non riuscita | Nota sotto il pulsante | "Non sono riuscito a eliminare la Research. Non è cambiato nulla: riprova tra poco." |
| NF | Research di un altro workspace, eliminata, o id sbagliato | Pagina `not-found` di `/research/[id]` | Titolo serif: "Non trovo questa Research." · Riga: "Forse è stata eliminata, o il link è di un altro account." · Azione: "Tutte le Research" |
| R1 | Research eliminata mentre la sala è aperta | Al posto del QR, riquadro inchiostro come "modulo spento" | Titolo: "Questa Research non c'è più." · Testo: "Il modulo non accetta risposte." · Link: "Torna alle Research" |

Lo stato NF non distingue "non esiste" da "è di un altro": dire che esiste rivelerebbe dati di un altro workspace `[code:AGENTS.md]`.

**Copy degli stati non di errore:**

| Stato | Testo |
|---|---|
| Scheda nella barra | "Research" |
| Elenco, titolo | "Le tue Research" |
| Elenco, riga | "Una Research parte da una domanda sui clienti e raccoglie i feedback che servono a rispondere." |
| Elenco, pulsante | "Nuova Research" |
| Riga dell'elenco, stato | "{n} temi" · "{h} ipotesi: {c} confermate, {s} smentite, {r} da rivedere" (solo le parti diverse da zero) · "{k} feedback nuovi da analizzare" · "Modulo spento" · senza feedback: "Nessun feedback ancora" |
| Primo accesso, titolo (serif) | "Qui tieni le tue domande sui clienti, con le loro risposte." |
| Primo accesso, riga | "Parti da una domanda a cui vuoi rispondere prima di una decisione. Poi raccogli i feedback: modulo con QR code, note di intervista, CSV." |
| Campo della domanda | Etichetta "La tua domanda" · suggerimento "Per esempio: perché i team piccoli non passano a Pro dopo la prova?" · pulsante "Crea la Research" · attesa "Creo…" |
| Testata, ritorno | "Tutte le Research" |
| Testata, modifica | "Modifica" · "Salva" · "Annulla" |
| Schede interne | "Sintesi" · "Chiedi" · "Feedback" · "Raccolta" |
| Pulsante analisi | "Analizza {n} feedback" · con più di 500: "Analizza i 500 feedback più recenti" · con 1 analisi e ipotesi: "Analizza solo i temi di {n} feedback" · attesa: "Analisi in corso…" |
| Nota del costo | Senza ipotesi: "Userai 1 delle {limite} analisi di {mese}." · con ipotesi: "Userai 2 delle {limite} analisi di {mese}: una per i temi, una per il verdetto delle ipotesi." · dopo la prima: "Ti restano {n} analisi di {mese}." |
| Ipotesi, titolo sezione | "Ipotesi" |
| Ipotesi, sezione vuota | "Hai un'idea da mettere alla prova? Scrivila come ipotesi: i feedback diranno se la confermano." · pulsante "Scrivi un'ipotesi" |
| Campo dell'ipotesi | Etichetta "Nuova ipotesi" · suggerimento "Una frase che si può confermare o smentire." · "Aggiungi l'ipotesi" · "Annulla" |
| Verdetto | "Confermata" · "Smentita" · "Da rivedere" · conteggi "{f} a favore · {c} contro · su {n} letti" · titoli delle citazioni "A favore" · "Contro" |
| Verdetto, nessuna prova | "Da rivedere" · "Nessuno dei {n} feedback letti ne parla." |
| V1, feedback dopo l'ipotesi | "Scritta il {data}. Dei {n} feedback letti, {k} sono arrivati dopo." |
| V2, nessuno dopo | "Scritta il {data}. Tutti i {n} feedback letti erano già arrivati quando l'hai scritta: il verdetto li rilegge, non la mette alla prova con feedback nuovi." |
| Verdetto superato | "Dopo questo verdetto sono arrivati {k} feedback." |
| Solo il verdetto | "Solo il verdetto di {h} ipotesi" · attesa "Verdetto in corso…" · nota "Userai 1 delle {limite} analisi di {mese}." |
| Temi, cosa è cambiato | "Dall'analisi del {data}: {n} feedback in più, {m} temi nuovi." · prima analisi: nessuna riga · per tema: "+{k} dal {data}" oppure "Nuovo" |
| Attesa | "Può volerci qualche minuto. Temi e verdetti compaiono qui appena è finita." · dopo 2 minuti: "Ci vuole più del solito. Temi e verdetti compaiono qui: puoi lasciare la pagina e tornare." |
| Annuncio a fine analisi | "Analisi finita: {m} temi. {h} verdetti: {c} confermate, {s} smentite, {r} da rivedere." |
| Raccolta, note | Titolo "Incolla le note di un'intervista" · riga "Un'intervista alla volta: le note di una persona sono un feedback. Va bene anche un messaggio copiato da un'email o da Slack: cambia il canale." · canale di default "Intervista" · etichetta del cliente "Persona o ruolo" · pulsante "Aggiungi le note" · "Aggiungo…" |
| Raccolta, eliminazione | "Elimina la Research" (link testuale in fondo) |
| Sala con ipotesi | "Il verdetto delle ipotesi lo trovi nella Research." |

## Main screens (ascii)

Stato di successo, 1280x720 con zoom al 125% (circa 1024x576 punti CSS), come la prova del proiettore di Chiedi.

**Elenco delle Research:**

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [V] Acme   Research   Piano             [Free] Feedback: 58 di 100. Analisi …  Esci│
│            ‾‾‾‾‾‾‾‾                                                              │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Le tue Research                                            ┌─────────────────┐  │
│  Una Research parte da una domanda sui clienti e            │ Nuova Research  │  │
│  raccoglie i feedback che servono a rispondere.             └─────────────────┘  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│   37           Perché i team piccoli non passano a Pro dopo la prova?   24 px    │
│  feedback      5 temi · 2 ipotesi: 1 confermata, 1 da rivedere ·                 │
│                6 feedback nuovi da analizzare                   14 px, muted     │
│  ──────────────────────────────────────────────────────────────────────────────  │
│   21           Cosa blocca l'import dei dati al primo accesso?                   │
│  feedback      3 temi · Modulo spento                                            │
│  ──────────────────────────────────────────────────────────────────────────────  │
│                Come usano l'export in Excel i clienti Pro?                       │
│                Nessun feedback ancora                                            │
└──────────────────────────────────────────────────────────────────────────────────┘
  Il numero (48 px, Stat) è il primo elemento della riga; la domanda è il link.
```

**Primo accesso (workspace vuoto):**

```
│  Qui tieni le tue domande sui clienti,                          40 px, serif    │
│  con le loro risposte.                                                          │
│  Parti da una domanda a cui vuoi rispondere prima di una decisione. Poi         │
│  raccogli i feedback: modulo con QR code, note di intervista, CSV.  16 px muted │
│                                                                                 │
│  La tua domanda                                                                 │
│  ┌──────────────────────────────────────────────────────┐ ┌──────────────────┐  │
│  │ |                                                     │ │ Crea la Research │  │
│  └──────────────────────────────────────────────────────┘ └──────────────────┘  │
│  Per esempio: perché i team piccoli non passano a Pro dopo la prova?            │
```

**Research, scheda Sintesi, con ipotesi e verdetto:**

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [V] Acme   Research   Piano             [Free] Feedback: 58 di 100. Analisi …  Esci│
├──────────────────────────────────────────────────────────────────────────────────┤
│  ← Tutte le Research                                                             │
│  Perché i team piccoli non passano a Pro dopo la prova?  Modifica  ┌───────────┐ │
│  37 feedback da 3 canali, dal 2 al 14 ott.                         │Analizza 37│ │
│  Ultima analisi il 12 ott: 6 feedback arrivati dopo.               │ feedback  │ │
│                                                                    └───────────┘ │
│                                              Userai 2 delle 3 analisi di ottobre:│
│                                              una per i temi, una per il verdetto.│
│  Sintesi   Chiedi   Feedback   Raccolta                                          │
│  ‾‾‾‾‾‾‾                                                                         │
│  Ipotesi                                                          20 px, bold h2 │
│  ──────────────────────────────────────────────────────────────────────────────  │
│  ✓ Confermata     I team piccoli non passano a Pro perché il prezzo è per utente │
│  18 a favore      Chi ha 2-3 persone trova il costo per utente sproporzionato    │
│  3 contro         rispetto a quanto usa. Chi è contrario parla di funzioni.      │
│  su 37 letti                                                    15 px, muted     │
│                   A favore                                                       │
│  24 px + 13 px    "Siamo in due, ██pagare a testa non ha senso██ per noi."       │
│                   Intervista, 9 ott 2026                        20 px, serif     │
│                   … fino a 3                                                     │
│                   Contro                                                         │
│                   "Il prezzo va bene, ██mi manca l'export██."                    │
│                   Modulo pubblico, 11 ott 2026                  … fino a 2       │
│                   Scritta il 3 ott. Dei 37 feedback letti, 29 sono arrivati dopo.│
│                   Dopo questo verdetto sono arrivati 6 feedback.                 │
│                   Modifica   Elimina                                             │
│  ──────────────────────────────────────────────────────────────────────────────  │
│  ? Da rivedere    Chi prova Voce da solo non capisce a cosa serve il modulo      │
│                   Nessuno dei 37 feedback letti ne parla.                        │
│                   Scritta il 12 ott. Tutti i 37 feedback letti erano già …       │
│  ──────────────────────────────────────────────────────────────────────────────  │
│  Nuova ipotesi                                                                   │
│  ┌──────────────────────────────────────────────┐ ┌────────────────┐             │
│  │                                              │ │Aggiungi l'ipot.│  (secondario)│
│  └──────────────────────────────────────────────┘ └────────────────┘             │
│  Una frase che si può confermare o smentire.                                     │
│                                                                                  │
│  Temi                                                                            │
│  Dall'analisi dell'8 ott: 14 feedback in più, 2 temi nuovi.                      │
│  [Tutti 5] [Problemi 2] [Opportunità 2] [Apprezzamenti 1] | Stato: aperti        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│   14          ● Problema                                                         │
│  feedback     Prezzo per utente troppo alto per i team piccoli                   │
│  +5 dall'8 ott  …ThemeRow di oggi                                                │
└──────────────────────────────────────────────────────────────────────────────────┘
  ██…██ = frase chiave in <mark> giallo, una per citazione
  La colonna del verdetto è larga 148 px come la colonna del numero di ThemeRow.
```

Sopra la piega, a 125%: domanda, pulsante con il costo, prima ipotesi con verdetto e conteggi. Il verdetto è il contenuto che il PM porta a chi chiede "su quali prove?" `[doc:mined-reddit-georgeharter]`.

**Scheda Raccolta** (ordine delle sezioni): card gialla del modulo con QR (oggi) · controlli del link e domanda del modulo (oggi) · "Incolla le note di un'intervista" · "Importa un CSV" · linea sottile · "Elimina la Research" come link testuale.

## Components

| Component | Exists / Extend / New | Affects | Justification (new only) |
|---|---|---|---|
| `Page`, `PageHeader`, `PageTitle`, `PageLede`, `PageMore` (`src/components/page.tsx`) | Exists | Nessuno | |
| `AppTabs` (`src/components/app-tabs.tsx`) | Extend: riceve le voci e il criterio di pagina attiva come props, invece della costante `TABS` | Barra dell'app (Research, Piano) e schede interne della Research (Sintesi, Chiedi, Feedback, Raccolta) usano lo stesso componente. La scheda Sintesi è attiva solo su `/research/[id]` e sui temi, non su tutte le rotte che iniziano con quel percorso: il criterio `startsWith` di oggi la accenderebbe ovunque | |
| `Stat` (da `src/components/theme-row.tsx`) | Exists | Nessuno | |
| `ThemeRow` (`src/components/theme-row.tsx`) | Extend: prop facoltativa per la variazione ("+5 dall'8 ott", "Nuovo") sotto il numero; link al dettaglio con il percorso della Research | Tutte le righe dei temi. Senza la prop resta com'è | |
| `Quote` (`src/components/quote.tsx`) | Exists | Nessuno | |
| `Badge` (`src/components/ui/badge.tsx`) | Exists: variante neutra per "Nuovo" | Nessuno | |
| `Card` highlight, soft, `media`, `row` (`src/components/ui/card.tsx`) | Exists | Nessuno | |
| `Field`, `FieldLabel`, `FieldHint`, `FieldCount`, `FieldError` (`src/components/ui/field.tsx`), `Input`, `Textarea`, `Button` | Exists | Nessuno | |
| `ChipCount`, `FilterBar` (`src/components/ui/chip.tsx`), `StatusMenu`, `ThemeControls`, `Trend` | Exists | Nessuno | |
| `AnalyzeButton` (`src/components/analyze-button.tsx`) | Extend: riceve la Research, il costo (temi, temi e verdetto, solo temi) e gli esiti parziali S5 e S6; passa da `disabled` ad `aria-disabled` durante l'attesa | La sala usa lo stesso pulsante: con il passaggio ad `aria-disabled` il focus non cade più sul `body` all'avvio, anche lì. Da verificare nel browser su Sintesi e sala | |
| `LimitWarning` (`src/components/limit-warning.tsx`) | Extend: il testo dice che il limite vale per tutte le Research | Sintesi, Feedback, Raccolta | |
| `CsvImport`, `FormLinkControls`, `FormQuestionField`, `CopyLinkButton`, `QrCode`, `DeleteFeedbackButton`, `AskForm`, `AskAnswer` | Extend: ricevono l'id della Research; stringhe dei 90 giorni cambiate in Chiedi | Solo le pagine della Research, che sostituiscono quelle di oggi | |
| `ManualFeedbackForm` (`src/components/manual-feedback-form.tsx`) | Extend: diventa il modulo delle note (canale di default "Intervista", 10.000 caratteri, contatore sempre visibile, etichetta "Persona o ruolo") | Era usato solo in `/collect`, che sparisce | |
| `RoomScreen`, `RoomDots` (`src/components/room-screen.tsx`, `src/components/room-dots.tsx`) | Extend: percorsi della Research (stato, raccolta, uscita), stato R1, nota sulle ipotesi | Solo la sala | |
| `ResearchForm` (campo della domanda con invio) | New | | Serve in tre posti: primo accesso, `/research/new`, modifica della domanda. Un campo, un pulsante, gli errori RC: composto da `Field`, `Input`, `Button`, nessuna primitiva nuova |
| `ResearchRow` (riga dell'elenco) | New | | Composizione di `Stat` e testo; nessun pezzo di oggi mostra una riga con numero, titolo-link e stato. Presentazione pura |
| `HypothesisList` (sezione Ipotesi: elenco, verdetti, campo, "Solo il verdetto", conferme) | New | | Client: tiene aggiunta, modifica, eliminazione con conferma nella riga, stato del verdetto e annunci. Nessun pezzo di oggi gestisce un elenco modificabile. La parte del verdetto (colonna di 148 px come `ThemeRow`, parola e conteggi, citazioni con `Quote`) è presentazione pura dentro lo stesso file o accanto, come `AskAnswer` |

Conto: 0 primitive nuove, estensioni a pezzi esistenti (di cui una con effetto fuori dalla Research: `aria-disabled` di `AnalyzeButton` anche nella sala), 3 pezzi di schermata nuovi composti dal kit. Il segno del verdetto (✓ ✕ ?) è testo, non un'icona nuova.

## Accessibility floor

**Keyboard path** (flusso principale: aprire una Research, scrivere un'ipotesi, analizzare, leggere il verdetto):

1. Barra: logo non focalizzabile → "Research" → "Piano" → selettore di lingua → "Esci".
2. "Tutte le Research" (link di ritorno).
3. "Modifica" della domanda.
4. Pulsante "Analizza {n} feedback".
5. Schede interne: Sintesi → Chiedi → Feedback → Raccolta.
6. Solo con `LimitWarning`: "Passa a Pro" (nel DOM tra le schede e il contenuto).
7. Sezione Ipotesi, per ogni ipotesi: "Modifica" → "Elimina". Le citazioni non hanno controlli.
8. Campo "Nuova ipotesi" → "Aggiungi l'ipotesi" → "Solo il verdetto" (se presente).
9. Temi: chip dei filtri → menu Stato → per ogni tema i controlli di oggi.

- Invio nel campo della domanda e dell'ipotesi invia; Esc in un campo di modifica equivale ad "Annulla" e riporta il focus a "Modifica". Invio durante la composizione di un metodo di input non invia.
- Nelle conferme nella riga (H6, D1) Tab va da "Annulla" al pulsante che elimina; Esc annulla.
- Titoli per navigare: h1 domanda, h2 "Ipotesi" e "Temi", h3 per ogni ipotesi (il testo dell'ipotesi), h3 per ogni tema come oggi.
- Nessuna azione richiede il mouse. Nessuna scorciatoia globale nuova.

**Contrast:** WCAG 2.2 AA come pavimento, 7:1 per ciò che si legge dalla sala.

| Elemento | Colori | Rapporto | Obiettivo |
|---|---|---|---|
| Domanda, ipotesi, parola del verdetto, conteggi, citazioni | `ink` su `paper` | 16,1:1 | ≥ 7:1 |
| Ragionamento del verdetto, note V1 e V2, riga dei conteggi, "cosa è cambiato", nota della quota, `<cite>` | `ink-muted` su `paper` | 5,9:1 | ≥ 4,5:1 |
| Errori | `problem` su `paper` | 5,9:1 | ≥ 4,5:1 |
| Testo nella card del modulo e nell'avviso del limite | `on-highlight` su `highlight` / `highlight-soft` | già nel kit | ≥ 4,5:1 |
| Frase evidenziata | `ink` su `highlight` | 12,7:1 | ≥ 4,5:1 |
| Anello di focus | `ink`, 2 px | 16,1:1 | ≥ 3:1 |
| Non usare per testo da leggere | `ink-subtle` su `paper` | 3,0:1 | Solo metadati come oggi |

Rapporti dal disegno di Chiedi, calcolati sui token di `src/app/globals.css`; nessun colore nuovo.

**Focus:**

- **On open:** `/research` vuoto: nel campo della domanda. `/research/new`: nel campo. Elenco con Research e pagine della Research: nessun focus automatico, primo Tab sulla barra. Sezione Ipotesi aperta con "Scrivi un'ipotesi": nel campo nuovo. Conferma nella riga: su "Annulla" **[D]**, la scelta che non distrugge.
- **On submit / attesa:** pulsanti con `aria-disabled`, non `disabled`, così il focus resta dov'è; campi in sola lettura, non spenti.
- **On error:** RC1, RC2, H1, H2, N1, N2 riportano il focus nel campo, con `aria-invalid` e l'errore collegato con `aria-describedby`. Gli errori di rete, sessione, occupato e analisi lasciano il focus sul pulsante che li ha causati, con il testo intatto.
- **On completion:** Research creata: la pagina nuova parte dall'inizio, focus sull'h1 (`tabIndex=-1`) perché l'arrivo sia annunciato. Ipotesi aggiunta: il focus resta nel campo vuoto per la successiva. Ipotesi eliminata: focus sull'h2 "Ipotesi". Analisi finita: il focus resta sul pulsante, il risultato si annuncia. Research eliminata: elenco con focus sull'h1 e annuncio "Research eliminata."
- **On close:** nessun dialog. "Annulla" di una modifica o di una conferma riporta il focus sul pulsante che l'ha aperta ("Modifica", "Elimina", "Elimina la Research").

**Annunci:** una regione `role="status"` per zona, come `AnalyzeButton`: sotto il pulsante di analisi (attesa, 2 minuti, fine con il riassunto di temi e verdetti, errori), sotto il campo dell'ipotesi ("Ipotesi aggiunta. Il verdetto arriva con la prossima analisi."), sotto i controlli della Raccolta come oggi.

**Oltre il pavimento, già deciso:**

- Ogni controllo ha un nome dal testo visibile; "Modifica" ed "Elimina" di un'ipotesi hanno un nome accessibile completo ("Modifica l'ipotesi: {testo}"), perché ce ne sono fino a cinque sulla pagina.
- Nessuna informazione solo nel colore: il verdetto è una parola con un segno, in inchiostro; "Nuovo" è una parola.
- `prefers-reduced-motion` come oggi nella sala; nessuna animazione nuova nelle pagine della Research.

## Chiavi dei cataloghi (proposta di namespace)

Un file per area, un namespace per file, italiano fonte e inglese con le stesse chiavi e gli stessi segnaposto, controllati da `src/i18n/messages.test.ts` `[code:src/i18n/messages/index.ts]`.

**Namespace nuovo `research`** (`src/i18n/messages/it/research.json`, `src/i18n/messages/en/research.json`):

```
research.metadata.title
research.list.title | lede | newResearch | row.feedbackLabel | row.themes | row.hypotheses
         | row.newFeedback | row.formOff | row.noFeedback | deleted
research.firstRun.title | lede
research.form.label | hint | create | creating | save | saving | cancel | count
research.form.errors.empty | tooLong | failed | session | sessionLink        (RC1-RC4)
research.header.back | edit | ledeCount | ledeEmpty | lastAnalysis
research.tabs.synthesis | ask | feedback | collect
research.synthesis.analyze.label | labelPartial | labelThemesOnly | running
         | cost.one | cost.two | cost.left | runningNote | slowNote | announcement
         | failures.busy | themesFailed | verdictFailed | network | themesOnlyNote   (S2-S10)
         | lowFeedbackNote | changes.line | changes.themeDelta | changes.newTheme
research.hypotheses.title | emptyText | write | label | hint | add | adding | cancel
         | edit | editName | save | editWarning | delete | deleteName | deleteConfirm
         | deleteConfirmAction | added | noVerdict | maxReached | busy
         | errors.empty | tooLong | failed | deleteFailed                         (H1-H7)
         | verdictOnly.label | running | note
research.verdict.confirmed | refuted | toReview | counts | inFavour | against
         | noEvidence | writtenAfter | writtenBefore | arrivedAfterVerdict        (V1, V2)
research.delete.action | confirm | confirmAction | cancel | deleting | failed  (D1, D2)
research.notFound.title | text | action                                         (NF)
```

**Namespace esistenti che cambiano:**

| Namespace | Cambio |
|---|---|
| `app.tabs` | Tolte `themes`, `ask`, `feedback`, `collect`; aggiunta `research` |
| `themes` | `emptyNoFeedback` e `emptyNoAnalysis` riferiti alla Research; `limitWarning.title` / `text` sul limite di tutte le Research; `analyzeButton.failures.no_feedback` senza i 90 giorni |
| `ask` | `nothingToAsk.titleOld` / `bodyOld` tolte; `perimeterFull`, `perimeterPartial`, `noEvidenceBody`, `summary.noEvidence`, `errors.noFeedbackText` senza i 90 giorni, riferite alla Research |
| `feedback` | `page.ledeEmpty` riferita alla Research |
| `collect` | `manualForm` diventa `notes` (titolo, riga, canale di default "Intervista", "Persona o ruolo", errori N1-N3); `csvImport.imported` e `seeFeedback` riferiti alla Research |
| `room` | `pile.formOff.action` verso la Raccolta della Research; `pile.noOpenThemes` "Li trovi nella Research."; nuove `deleted.title` / `text` / `action` (R1), `hypothesesNote` |
| `billing` | `page.freeDescription` / `proDescription` con "Il verdetto delle ipotesi usa 1 analisi" |
| `landing` | Riga dei prezzi come `billing` |
| `form` | Nessun cambio; resta fissato all'italiano |

**Lingua dell'output dell'AI** **[D]**: temi, ragionamento del verdetto e risposte di Chiedi si scrivono nella lingua dell'interfaccia al momento dell'avvio, come oggi `[code:src/app/(app)/themes/actions.ts]`. Le parole "Confermata", "Smentita", "Da rivedere" vengono dal catalogo, non dal modello: il modello restituisce un valore fra tre. Domanda e ipotesi restano come le ha scritte il PM. Un'analisi in inglese dopo una in italiano cambia la lingua dei titoli dei temi, ed è così già oggi.

## Decisioni prese per delega

Tutte "Deciso dal modello per delega di Mario (2026-09-28)" `[doc:user-2026-09-28-research-round1]`, da rivedere da lui:

1. Due livelli di navigazione: barra con Research e Piano; dentro la Research le schede Sintesi, Chiedi, Feedback, Raccolta. Rotte sotto `/research/[id]`; le rotte di oggi si cancellano senza reindirizzamenti, `/sala` compresa.
2. Temi e ipotesi nella stessa scheda Sintesi, ipotesi sopra; la sezione Ipotesi vuota è una riga con un pulsante secondario.
3. Migrazione dei dati di ogni workspace esistente in una Research iniziale (domanda dal modulo o di default, slug e stato del modulo compresi), per tenere vivi `/f/phc26` e le risposte della masterclass. La data della migrazione in produzione resta di Mario.
4. L'interfaccia continua a dire "feedback", anche per le note di intervista.
5. Primo accesso con il campo della domanda già nello stato vuoto; creazione con un solo campo (1-200 caratteri), senza ipotesi; dopo la creazione si arriva sulla Sintesi con le strade di raccolta.
6. Domanda della Research e domanda del modulo separate; il modulo mostra la seconda.
7. Ipotesi: 1-200 caratteri, al massimo 5 per Research; modificarne il testo toglie il verdetto e fa ripartire l'ora di scrittura; niente modifiche durante un'analisi.
8. Un clic avvia temi e verdetto di tutte le ipotesi; temi 1 analisi, verdetto 1 analisi qualunque sia il numero di ipotesi; con 1 analisi rimasta si fanno solo i temi; "Solo il verdetto" quando i temi sono aggiornati.
9. La sala avvia solo i temi e non mostra verdetti.
10. Analisi, verdetto e Chiedi leggono tutti i feedback della Research fino ai 500 più recenti, senza la finestra dei 90 giorni.
11. Verdetto senza colore: parola e segno in inchiostro; fino a 3 citazioni a favore e 2 contro; conteggi dal server; feedback arrivati dopo l'ipotesi e dopo il verdetto sempre visibili.
12. Il modulo manuale diventa il modulo delle note: canale "Intervista", 10.000 caratteri; duplicati del CSV cercati solo nella Research.
13. Limite Free dei 100 feedback per workspace, sommando le Research; nessun limite al numero di Research.
14. Variazione dei temi rispetto all'analisi precedente della stessa Research, per tema e in una riga sopra i temi.
15. Eliminazione della Research in fondo alla Raccolta con conferma nella riga; pagina NF che non distingue "eliminata" da "di un altro".
16. Nota "con meno di 5 feedback i temi dicono poco", senza bloccare l'analisi; attesa lunga annunciata a 2 minuti.
17. Focus sulla scelta che non distrugge nelle conferme; `aria-disabled` al posto di `disabled` anche in `AnalyzeButton`.

## Da passare a `04-spec.md` (flow list)

- **F1** Primo accesso, workspace vuoto: RC1-RC4.
- **F2** Creare una Research: RC1-RC4.
- **F3** Aggiungere, modificare, eliminare un'ipotesi: H1-H7, E-SESS.
- **F4** Raccogliere con modulo pubblico e QR code per Research (lato PM e lato chi risponde): errori di oggi, `FormUnavailable`, 404.
- **F5** Incollare note di intervista: N1-N4.
- **F6** Importare un CSV nella Research: errori di oggi, duplicati nella Research.
- **F7** Avviare l'analisi (temi e verdetto con un clic): S2-S10, costo 1 o 2 analisi, solo temi con 1 analisi rimasta.
- **F8** Leggere il verdetto con le citazioni, e "Solo il verdetto": V1, V2, verdetto superato, S6.
- **F9** Chiedi in una Research: E1-E9 di oggi con le stringhe della Research.
- **F10** Schermo della sala per una Research: stati di oggi, R1, solo temi.
- **F11** Quota raggiunta: analisi (Free, Pro, 1 rimasta con ipotesi), 100 feedback per workspace, domande di Chiedi.
- **F12** Modificare la domanda, eliminare una Research: D1, D2, NF.
- **Migrazione:** Research iniziale per ogni workspace esistente, `research_id not null`, colonne del modulo spostate; seed e `e2e/english.spec.ts` riscritti.
- **Numeri da fissare nella spec, qui proposti:** domanda 200 caratteri, ipotesi 200 caratteri e 5 per Research, note 10.000 caratteri, 500 feedback letti con un tetto sul totale dei caratteri da fissare, 3 citazioni a favore e 2 contro, attesa lunga a 2 minuti, interruzione a 4 minuti, soglia della nota a 5 feedback.
- **Da decidere nella spec per la metrica:** `research_synthesized` parte anche con "Solo il verdetto" e dalla sala? `hypothesis_count` = ipotesi della Research all'avvio (`03-solution-bet.md`); `first_analysis_completed` alla prima analisi di qualunque Research (`02-definition.md`, guardrail); `first_research_collected` al quinto feedback di una Research.
- **Candidati alla lista "fuori ambito", già esclusi da questo disegno:** ipotesi alla creazione, spostare un feedback tra Research, archiviare una Research, duplicare una Research, bozze di note o ipotesi, cronologia dei verdetti, verdetto in sala, selettore di Research nella barra, reindirizzamenti dalle rotte di oggi, lingua del modulo per Research, limite al numero di Research, parola "voci" nell'interfaccia, layout per telefono.

## Not covered here

- **Rifinitura visiva.** Il disegno usa solo token e componenti di `DESIGN.md`. Lo skill `impeccable` è installato, ma questo passaggio è solo struttura per richiesta: nessun passaggio di qualità visiva, nessuna tavola in `design/`. Resta da fare la verifica a occhio nel browser a 1280x720 con zoom al 125% e al 150%, in particolare la colonna del verdetto e la testata con il costo sotto il pulsante.
- **Layout per telefono.** L'app resta pensata per il desktop; solo il modulo pubblico è per telefono, come oggi.
- **Contesto del modello con note lunghe.** Il tetto sul totale dei caratteri letti (F5) è un vincolo tecnico che la spec deve fissare con una misura, non una scelta di disegno.
- **Prompt e evals del verdetto.** Il disegno fissa cosa si mostra (parola fra tre, conteggi, citazioni verificate, ragionamento breve); prompt, schema e set di evals con verdetti etichettati a mano sono della spec e della costruzione (`03-solution-bet.md`, Cheapest test).

## DESIGN COMPLETE

**Placement:** barra con Research e Piano; dentro la Research le schede Sintesi, Chiedi, Feedback, Raccolta sotto `/research/[id]`; rotte di oggi cancellate; Research iniziale per ogni workspace esistente, `/f/phc26` vivo dopo la migrazione · **Flows:** 12 (F1 primo accesso, F2 crea, F3 ipotesi, F4 modulo e QR, F5 note, F6 CSV, F7 analisi temi e verdetto, F8 verdetto e "Solo il verdetto", F9 Chiedi, F10 sala, F11 quota, F12 modifica ed elimina), ogni ingresso e abbandono dichiarato · **States:** 17 righe per 6 stati, 27 testi di errore reali · **Components:** 0 primitive nuove, estensioni a pezzi esistenti, 3 pezzi di schermata nuovi (`ResearchForm`, `ResearchRow`, `HypothesisList`) · **Accessibility floor:** ordine di tabulazione del flusso principale, contrasto ≥ 4,5:1 per il testo e ≥ 7:1 per ciò che si legge dalla sala, ≥ 3:1 per focus e confini, focus su "Annulla" nelle conferme e sull'h1 all'arrivo, annunci tramite `role="status"`
