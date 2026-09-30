# DESIGN.md

Il sistema visivo di Voce. Nasce dalla direzione B (Voci): ogni tema si legge con le parole dei clienti, e la frase che conta è evidenziata come su carta.

- Token e componenti: `design/kit.css`
- Catalogo di tutti i componenti e stati: `design/kit.html`
- Schermate costruite solo con il kit: `design/b-voci.html`
- `design/presentation.css` è solo la cornice delle tavole (sfondo, finto browser, finto telefono). Non è prodotto.
- Nell'app: token in `src/app/globals.css`, componenti in `src/components/ui/` (shadcn/ui con le varianti del kit), pezzi di schermata in `src/components/`.

Una schermata nuova si costruisce con il kit. Se manca un pezzo, si aggiunge al kit e a questo file, non alla schermata. Da quando esiste l'app, il kit vivo sono i componenti in `src/components/`: `design/` resta come riferimento.

## Principi

1. **Le parole dei clienti sono il contenuto principale.** Citazioni in serif (Literata), interfaccia in sans (Hanken Grotesk). La serif si usa solo per ciò che dice o scrive una persona, e per i pochi titoli di tono (stato vuoto, domanda e messaggi del modulo pubblico).
2. **Il giallo significa "guarda qui".** Evidenzia la frase chiave di una citazione, l'azione consigliata, il modulo pubblico. Mai decorativo, mai per più di una cosa per zona.
3. **Superfici piatte.** Separazioni con linee e grigio velo, non con ombre. Le ombre servono solo a ciò che galleggia sopra la pagina.
4. **Il numero guida.** I temi si ordinano per numero di feedback, e il numero è l'elemento più grande della riga.

## Token

### Colori

| Token | Valore | Uso |
|---|---|---|
| `--color-paper` | #FFFFFF | Fondo della pagina |
| `--color-veil` | #F3F3F0 | Superfici secondarie: card, campi, select, chip, pulsante secondario |
| `--color-ink` | #1E2127 | Testo principale, pulsante primario, stato attivo |
| `--color-ink-hover` | #000000 | Pulsante primario al passaggio del mouse |
| `--color-ink-muted` | #5F6470 | Testo di supporto: sintesi, descrizioni, suggerimenti, fonti delle citazioni |
| `--color-ink-subtle` | #9095A0 | Etichette leggere, placeholder, contatori |
| `--color-line` | #E4E4DF | Divisori tra righe |
| `--color-line-strong` | #C4C6C0 | Barre dell'andamento |
| `--color-highlight` | #FFE45C | Evidenziatore, azione consigliata, testata del modulo pubblico |
| `--color-highlight-hover` | #F5D83A | Pulsante giallo al passaggio del mouse |
| `--color-highlight-soft` | #FFF4B8 | Avvisi che invitano ad agire |
| `--color-on-highlight` | #4A4520 | Testo secondario su giallo |
| `--color-problem` | #B8322A | Temi di tipo problema. Anche errori dei campi |
| `--color-opportunity` | #2A56C6 | Temi di tipo opportunità |
| `--color-praise` | #2B7D52 | Temi di tipo apprezzamento |
| `--color-praise-soft` / `--color-praise-ink` | #E1F0E7 / #1F5E3C | Stato "Fatto" |

Regole:
- Testo secondario su giallo sempre in `--color-on-highlight`, mai in grigio: il grigio sul giallo sporca.
- I tre colori dei tipi si usano solo per il tipo di tema (e il rosso per gli errori). Non per pulsanti o decorazioni.
- `--color-ink-subtle` non regge testo che serve leggere: solo metadati, placeholder, contatori.

### Tipografia

Due famiglie: `--font-sans` (Hanken Grotesk) per l'interfaccia, `--font-serif` (Literata) per le parole dei clienti e i titoli di tono.

| Token | px | Uso tipico |
|---|---|---|
| `--text-6xl` | 48 | Numero di feedback di un tema |
| `--text-5xl` | 40 | Titolo dello stato vuoto, messaggio del modulo (serif) |
| `--text-4xl` | 32 | Titolo di pagina, domanda del modulo pubblico |
| `--text-3xl` | 24 | Titolo di un tema |
| `--text-2xl` | 20 | Citazione, testo scritto nel modulo pubblico (serif) |
| `--text-xl` | 18 | Titolo di card, citazione piccola |
| `--text-lg` | 16 | Testo introduttivo, valore dei campi |
| `--text-base` | 15 | Interfaccia: pulsanti, sintesi, testo delle card |
| `--text-md` | 14 | Etichette, chip, tipo di tema |
| `--text-sm` | 13 | Fonti, suggerimenti, contatori, badge |
| `--text-xs` | 12 | Il minimo: note a margine, piè di pagina del modulo |

Pesi: 400 testo e titolo dello stato vuoto (più calmo), 500 domanda e messaggi del modulo pubblico, 600 etichette e pulsanti, 700 titoli sans. Interlinea: `--leading-relaxed` (1.55) per testo lungo e citazioni, `--leading-normal` (1.5) per l'interfaccia, `--leading-snug`/`--leading-tight` per i titoli sans, `--leading-heading` (1.2) e `--leading-display` (1.1) per i titoli serif grandi.

Regole:
- I campi di testo non scendono sotto 16 px: sotto, iOS ingrandisce la pagina quando si tocca il campo.
- Numeri che si confrontano in colonna: `font-variant-numeric: tabular-nums` (già in `.stat-value`, `.field-count`, `.table-num`).

### Spaziature

Scala a base 4: `--space-1` 4, `-2` 8, `-3` 12, `-4` 16, `-5` 20, `-6` 24, `-8` 32, `-10` 40, `-12` 48, `-16` 64, `-24` 96.

- Dentro un componente: 4-16. Tra componenti: 16-32. Tra sezioni di pagina: 32-64.
- Niente margini, padding o gap fuori scala. Se serve un valore nuovo, si discute qui prima.
- Le dimensioni fisse di un componente (altezza della barra, lato di logo e avatar, larghezza delle colonne di un tema) stanno nel componente e non seguono la scala.

### Raggi

| Token | px | Uso |
|---|---|---|
| `--radius-sm` | 8 | Campi, select, avatar |
| `--radius-md` | 12 | Riquadri piccoli (QR code) |
| `--radius-lg` | 16 | Card |
| `--radius-full` | 999 | Pulsanti, chip, badge |

### Ombre

| Token | Uso |
|---|---|
| `--shadow-sm` | Menu aperti, tooltip, toast |
| `--shadow-md` | Dialog e pannelli sopra la pagina |

Card, righe e campi non hanno ombra.

## Componenti

Ogni componente è in `design/kit.css` e in `design/kit.html` con tutti i suoi stati.

### Pulsanti

`.btn` primario (inchiostro) · `.btn-secondary` (velo; su una card diventa bianco da solo) · `.btn-highlight` (giallo) · `:disabled` · taglie `.btn-lg`, `.btn-sm` (azioni piccole accanto al contenuto, per esempio Copia) e `.btn-block` · `.link` e `.link-text` per le azioni testuali (nell'app: varianti `link` e `text` del Button).

- Un solo pulsante primario per zona dello schermo.
- `.btn-highlight` solo per spingere un'azione di valore quando il primario è già usato (per esempio "Passa a Pro"). Mai dentro una superficie gialla.
- Il testo del pulsante dice cosa succede, con il numero se c'è: "Analizza 37 feedback", non "Continua".
- `.link` (sottolineatura gialla) per azioni che portano altrove ("Leggi tutti i 58 feedback"), non per azioni che cambiano dati.
- `.link-text` (sottolineatura `--color-ink-subtle`, inchiostro al passaggio del mouse) per le azioni sul posto: Modifica, Elimina, Annulla, Esci, "Spegni il link". Così il giallo resta un segnale: una pagina con 50 "Elimina" non diventa gialla.
- Un pulsante primario che rifarebbe lo stesso lavoro scende a secondario e dice perché: "Analizza" quando dall'ultima analisi non è arrivato nessun feedback.

### Filtri

`.filter-bar` con `.chip` (`aria-pressed` per lo stato), `.chip-count`, `.chip-menu` per i filtri a menu, `.filter-bar-sep` tra gruppi.

- I chip filtrano, non eseguono azioni.
- La barra chiude con una linea inchiostro: sotto inizia l'elenco filtrato. Se sotto c'è una tabella, la linea è quella della sua intestazione: la barra non ne disegna una seconda.

### Campi

`.field` contiene `.field-label` (con `.field-optional` se facoltativo), il campo, poi `.field-hint`, `.field-count` o `.field-error`.

- `.input` e `.textarea` (fondo velo) nell'app.
- `.input-line` e `.textarea-line` (a riga, textarea in serif) solo nel modulo pubblico, dove si scrive come su un foglio. Riga di 2 px: col focus diventa inchiostro, ed è l'unico segno del focus (niente anello, che sopra la riga fa una doppia linea). Segnaposto in `--color-ink-muted`, in corsivo nella textarea: in `ink-subtle` (3,0:1) su un telefono non si legge.
- `.textarea-ask` per la domanda di Chiedi: fondo carta, bordo interno di 1,5 px in `--color-ink-muted`, testo sans 20, `rows="2"`, niente ridimensionamento. Il velo su carta (1,11:1) da un proiettore non si vede; il bordo `ink-muted` regge 5,9:1, sopra i 3:1 dei confini di un controllo.
- Errore: `aria-invalid="true"` sul campo, `.field-error` sotto, collegato con `aria-describedby`. Il messaggio dice come rimediare.
- `.field-quiet` rende l'etichetta leggera: quando il valore conta più del nome (priorità e stato di un tema).
- L'altezza di una textarea si dà con `rows`, non con CSS.

### Select

`.select` nativo, con `.select-empty` quando non c'è un valore e due toni legati al valore scelto:

- `.select-strong` per "In roadmap": è la decisione che si deve vedere da lontano.
- `.select-positive` per "Fatto".
- Tutti gli altri valori restano neutri. Il tono segue il valore, non si sceglie a mano.

### Card

`.card` (velo) con `.card-title`, `.card-text`, `.card-meta`, `.card-actions` (in fondo alla card).

- `.card-highlight` (giallo): l'azione consigliata. Una per schermata.
- `.card-soft` (giallo chiaro): un avviso che invita ad agire, con il pulsante sulla destra (`.card-row`).
- `.card-media`: testo a sinistra dentro `.card-body`, un oggetto a destra (il QR code in `.qr-code`).

### Badge

- Tipo di tema: `.badge-problem`, `.badge-opportunity`, `.badge-praise`. Pallino e colore, senza fondo.
- `.badge` neutro (pillola velo): piano (Free, Pro) e conteggi.
- Un badge è un'etichetta, non si clicca.

### Tabella

`.table` con `.table-num` per numeri e date allineati a destra, `.table-muted` per le colonne di contorno.

- La prima colonna è quella che si legge (il testo del feedback): nessun troncamento a una riga, va a capo.
- Intestazione leggera, linea inchiostro sotto, linee sottili tra le righe. Niente righe alterne.

### Stato vuoto

`.empty` con `.empty-title` (serif grande), `.empty-text` e le azioni.

- Il titolo dice cosa si vedrà qui, non che manca qualcosa.
- `.empty-actions` mette in fila le strade per uscire dallo stato vuoto. La prima è quella consigliata: più larga e in `.card-highlight`.

### Citazione evidenziata

`.quote` (serif 20) o `.quote-sm` (serif 18), con `<cite>` per canale e data, in `--color-ink-muted`: a 13 px `ink-subtle` (3,0:1) non si legge, e su un proiettore sparisce. `.quote-stack` per impilarle, `.quote-grid` per due colonne con linee, `.quote-bar` per riportare il testo appena scritto.

- La citazione è sempre il testo del cliente, tra virgolette tipografiche, senza modifiche. Se si accorcia, i puntini lo dicono.
- Un solo `<mark>` per citazione: la frase che riassume il tema. Se tutto è evidenziato, niente lo è.
- Il testo dei feedback è input non fidato: si inserisce sempre come testo, mai come HTML. L'unico markup è il `<mark>` che l'app aggiunge attorno alla frase chiave.

## Pezzi di schermata

Composti dai componenti sopra, servono alle schermate della B.

- **Barra dell'app**: `.appbar`, `.appbar-brand` con `.logo` (il marchio di Voce), `.tabs` con `.tab` (`aria-current="page"` per la pagina attiva), `.appbar-meta` con piano e quote.
- **Pagina**: `.page`, `.page-header` con `.page-title` e `.page-lede`, `.page-section`, `.page-more`.
- **Sezione di una Research** (`SectionHeading` in `src/components/page.tsx`): titolo 24 px in peso 800, accanto la riga di sintesi in `--color-ink-muted` (per esempio "2 ipotesi: 1 confermata, 1 smentita"), sotto una linea inchiostro di 2 px. Ipotesi, Temi e i passi di una Research vuota usano lo stesso titolo.
- **Passi di una Research vuota** (`StepNumber`): un cerchio inchiostro con il numero in giallo prima del titolo. Solo dove l'ordine è l'informazione: 1 Ipotesi (facoltative), 2 Raccogli i feedback, 3 Analizza.
- **Fascia dell'analisi**: in cima alla Sintesi, lo stato a sinistra e "Analizza" a destra su `--color-highlight-soft` quando c'è qualcosa da leggere (prima analisi, feedback arrivati dopo l'ultima); senza fondo quando è tutto analizzato.
- **Verdetto**: la risposta della Research, quindi il testo più pesante dell'app: parola in peso 900 a 20 px, sopra un cerchio inchiostro con l'icona in giallo (Lucide `Check`, `X`); "Da rivedere" in `--color-ink-muted` su velo. Sotto la frase dell'ipotesi, il ragionamento e la prima citazione a favore e contro affiancate (una colonna sotto i 1024 px); le altre dietro "Mostra altre N citazioni" (`aria-expanded`).
- **Tema**: `.theme` a tre colonne (numero e andamento, contenuto, controlli); su telefono numero e andamento stanno su una riga. `.theme-compact` dal quarto tema in poi: niente sintesi, una citazione. Il tono ("Tono negativo") compare solo quando il tipo non lo dice già; la nota dell'andamento solo sul primo tema della lista. `.stat-value`/`.stat-label` per il numero, `.trend` per l'andamento a 13 settimane (le ultime 2 in inchiostro) con `.trend-note`, `.theme-controls` per priorità e stato.
- **Chiedi** (`src/components/ask-*.tsx`): il campo della domanda, sotto le domande della visita, la più recente in cima.
  - Stato vuoto: "Prova a chiedere", righe cliccabili con domande costruite da ipotesi (prima) e temi (i più grandi), a modelli fissi, con la fonte a destra ("Dall'ipotesi", "Dal tema"). Riempiono il campo, non inviano: ogni domanda conta. Non sono chip: i chip filtrano.
  - Attesa: la domanda sale in cima con tre passi (leggo, cerco, controllo le citazioni); il passo in corso ha l'evidenziatore che scorre (`highlighter-sweep`), i passi fatti un cerchio inchiostro con la spunta gialla. Con `prefers-reduced-motion` l'evidenziatore è fermo.
  - Risposta: la domanda come titolo con "Copia" a destra; numero grande con "su N letti"; la prima frase della risposta a 24 px, il resto sotto in `ink-muted`; citazioni compatte in due colonne (dal lg), la frase chiave con i puntini se è un pezzo di un feedback lungo, "Leggi tutto il feedback" per il testo intero; "Approfondisci" con pulsanti secondari piccoli (`size="sm"`) che riempiono il campo.
  - Le risposte precedenti si chiudono in una riga (numero, domanda, prima frase) che si riapre. Vivono solo nella memoria del browser: restano cambiando scheda, spariscono ricaricando, e la pagina lo dice sotto l'ultima.
  - Una sola regione `status` per la scheda: attesa, risposta pronta, copia ed errori.
- **Modulo pubblico**: `.form-page`; `.form-ask` con `.form-brand` (`.avatar` con l'iniziale del workspace), `.form-ask-title` e `.form-ask-text` su `.surface-highlight`; `.form-body` con i campi a riga e il pulsante in fondo; `.form-foot`. `.form-message` per inviato e non disponibile, `.form-message-title.is-long` quando il messaggio è lungo.
  - La domanda (`.form-ask-title`) la sceglie il PM, con default "Cosa vuoi dire al team di …?". Va a capo su qualsiasi lunghezza; mentre si scrive, `.form-ask.is-compact` la riduce e nasconde il sottotitolo.
  - La domanda è testo scritto dal PM e mostrato a sconosciuti: sempre come testo, mai come HTML. Massimo 140 caratteri.
  - Si apre da telefono, dal QR code: con la tastiera aperta resta visibile circa 400 px di pagina, e "Invia" deve starci. Ordine: il campo del feedback (4 righe, cresce col testo fino a 192 px poi scorre dentro), subito sotto "Invia", poi l'email chiusa dietro "Vuoi essere ricontattato? Lascia la tua email" (quasi nessuno la lascia), in fondo la nota. Il contatore compare solo oltre l'80% del limite.
  - Tastiera: nel feedback iniziale maiuscola, niente correttore rosso (con la tastiera in inglese sottolineerebbe ogni parola italiana), Invio va a capo e non invia. Nell'email tastiera email, niente maiuscole né correzioni, tasto "Invia" che manda il modulo.
  - Se la rete cade durante l'invio, il messaggio sta sopra "Invia" e il testo resta nel campo.
  - Pagina a tutto schermo (`viewport-fit=cover`) con i padding `env(safe-area-inset-*)`, `theme-color` giallo, niente zoom al doppio tocco né lampo grigio al tocco.
- **Landing**: l'unica superficie che esce dal sistema sobrio, perché si guarda da un proiettore e da un telefono e deve arrivare in pochi secondi. Stessi colori e stessi font, a scala da manifesto; le regole stanno in `src/app/landing.css` (classi `l-*`) e non entrano nell'app.
  - Il primo schermo è tutto giallo: il titolo in Hanken 900 fino a 200 px, la frase chiave in una fascia inchiostro con testo giallo (l'evidenziatore rovesciato). Un solo pulsante grande.
  - Il numero guida, alla lettera: "58" alto un terzo dello schermo, a cavallo tra il giallo e il bianco.
  - "Parole diverse, stesso problema.": le cinque citazioni scorrono in un solo paragrafo serif grande, ogni canale in un'etichetta inchiostro, ogni frase chiave evidenziata. L'esempio dice sempre che i feedback sono inventati.
  - I tre verbi larghi quanto lo schermo, una riga di testo sotto ciascuno.
  - Chiedi su fondo inchiostro: la domanda scritta in grande, il conteggio in giallo a scala da manifesto.
  - Movimento: il conteggio sale da 0, gli evidenziatori passano uno dopo l'altro, la domanda si scrive, la risposta sale. Partono una volta quando il blocco entra nello schermo (`InView`), e con `prefers-reduced-motion` non parte niente. Senza JavaScript tutto è già nello stato finale.
  - Nella fascia inchiostro non ci sono elementi con focus: l'anello inchiostro non si vedrebbe.
- **Schermo della sala** (`/sala`): si proietta durante una sessione dal vivo, quindi usa le regole della landing (classi `l-*` e `room-*` in `src/app/landing.css`), non quelle dell'app. Niente barra dell'app.
  - Fondo tutto giallo: la domanda del modulo in Hanken 900, il conteggio "N risposte" a scala da manifesto, a destra il QR code grande su bianco con l'indirizzo breve sotto. Un solo pulsante inchiostro, "Analizza le risposte".
  - Modulo spento o pieno: al posto del QR code un riquadro inchiostro con il titolo in giallo e il link per rimediare.
  - Pallini: ogni risposta è un pallino inchiostro che cade dall'alto e si ammucchia sopra il numero, versato da sinistra come sabbia. Disegnati su un solo canvas dietro al testo (`src/components/room-dots.tsx`), mai con un elemento per pallino. Nessun testo dei feedback: solo pallini.
  - Durante l'analisi un'onda lenta attraversa il mucchio.
  - Temi, "le risposte diventano temi": il fondo passa al bianco e i pallini volano in una bolla per tema, del colore del tipo, con un alone dello stesso colore al 10%. Ogni pallino ha la stessa taglia ovunque, quindi l'area di una bolla è il numero dei feedback. Bolle in fila dalla più grande, appoggiate sullo stesso pavimento; sotto ognuna numero, tipo e titolo. L'ultima bolla, grigia e senza numero, è "Altro". Una riga sotto il titolo dice il conto: "230 risposte, 5 temi: 2 problemi, 2 opportunità, 1 apprezzamento." L'interruttore "Bolle / Elenco" mostra gli stessi temi come righe con numero, tipo e titolo. Mai sintesi, citazioni o testo dei feedback.
  - Verdetto: se la Research ha ipotesi, "Analizza le risposte" fa anche il loro verdetto (la stessa analisi della Sintesi) e l'interruttore diventa "Bolle / Elenco / Verdetto". Il relatore sceglie quando mostrarlo. Per ogni ipotesi una riga su carta: il testo scritto dal PM a scala di titolo di tema, sotto la parola del verdetto con il suo segno (✓ Confermata, ✕ Smentita, ? Da rivedere) a scala di titolo e accanto i conteggi, "48 feedback a favore · 12 contro · su 230 letti". Con una sola ipotesi, il caso del palco, la parola va a scala da manifesto (`.room-verdict`) e i conteggi sotto, a scala di titolo di tema. Solo inchiostro, come nella Sintesi: il verdetto non ha colore. Mai motivazione né citazioni del verdetto: sono testo dei feedback. Mostra solo i verdetti dell'ultima analisi del verdetto: se il verdetto di questo clic non arriva o non parte per la quota, la vista lo dice e non mostra quello di prima. Se arriva il verdetto ma non i temi di questo clic, il verdetto si vede da solo, con una riga che lo dice, e mai i temi di prima.
  - Ogni taglia segue sia la larghezza sia l'altezza (`vw` e `svh`): tutto sta in uno schermo da 853x480 (1280x720 al 150%) a 1920x1080.
  - Movimento: il numero fa un piccolo balzo quando sale; i pallini cadono uno alla volta (all'apertura una cascata breve), ogni pallino arrivato dal vivo lascia un anello; nel passaggio ai temi volano su un arco e le etichette entrano quando sono atterrati. Con `prefers-reduced-motion` niente cade, vola o respira: si vedono subito le disposizioni finali.
- **Accesso e registrazione**: colonna stretta, marchio in alto, campi `.input` con fondo velo, un solo pulsante primario a tutta larghezza.

## Nell'app

Il kit è nato in CSS semplice per essere provato senza app. In Next.js con Tailwind e shadcn/ui:

- I token diventano il tema di Tailwind (`@theme` in `globals.css`), con gli stessi nomi.
- Le variabili di shadcn/ui puntano ai token:

| shadcn/ui | Token |
|---|---|
| `--background` | `--color-paper` |
| `--foreground` | `--color-ink` |
| `--muted` | `--color-veil` |
| `--muted-foreground` | `--color-ink-muted` |
| `--border`, `--input` | `--color-line` |
| `--primary` / `--primary-foreground` | `--color-ink` / `--color-paper` |
| `--secondary` / `--secondary-foreground` | `--color-veil` / `--color-ink` |
| `--accent` / `--accent-foreground` | `--color-veil` / `--color-ink` |
| `--destructive` | `--color-problem` |
| `--ring` | `--color-ink` |
| `--radius` | `--radius-sm` |

- `--accent` di shadcn/ui colora gli stati hover dei menu: resta velo. Il giallo non entra nelle variabili di shadcn/ui, si usa solo attraverso i componenti del kit.
- I componenti del kit diventano varianti dei componenti shadcn/ui corrispondenti (Button, Input, Textarea, NativeSelect, Card, Badge, Table), con gli stessi nomi di variante: `secondary`, `highlight`, `line`, `strong`, `positive`. Per NativeSelect il nome della prop è `tone` (i valori sono quelli del kit). `field.tsx` (etichetta, suggerimento, contatore, errore) è scritto a mano sulle classi del kit invece di usare il Field di shadcn/ui, più ricco del necessario; `chip.tsx` (barra dei filtri e chip) non ha un equivalente in shadcn/ui.
- Le classi di Tailwind usano i token: `bg-veil`, `text-ink-muted`, `text-md`, `rounded-lg`, `p-6` (la scala di spaziature di Tailwind a passo 4 coincide con `--space-*`). I colori, le taglie di testo, le interlinee, i raggi e le ombre di default di Tailwind sono spenti: fuori dai token non c'è niente da usare.
- I font si caricano con `next/font`, non da Google Fonts a runtime.
