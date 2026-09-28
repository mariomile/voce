# Chiedi, S8: attesa, testo sicuro e kit

Slice S8 di `.builderos/initiatives/chiedi-ai-feedback/05-build-plan.md`. Criteri: 19, 20, 21, 36.

## Cosa è stato fatto

- **Risposta** (`AskAnswer`): "feedback ne parla" con 1; "Cosa hanno scritto: {k} dei {n} feedback" quando i collegati sono più delle citazioni; perimetro parziale oltre 500 feedback; con `no_evidence` il titolo serif "Non trovo feedback che ne parlano." e la riga del design, senza numero, testo del modello o citazioni. Tutto come testo: nessun `dangerouslySetInnerHTML` nei file di Chiedi.
- **Attesa** (`AskForm`): pulsante "Risposta in arrivo…" con `aria-disabled`, casella `readOnly` che tiene il focus, "Sto leggendo {n} feedback…", dopo 15 secondi "Ci vuole più del solito. La risposta arriva: resta su questa pagina."; un invio alla volta con un blocco sincrono (due Invio di seguito fanno una chiamata anche prima che React ridisegni).
- **Pulsante**: "Chiedi ai {n} feedback", "Chiedi a 1 feedback", "Chiedi ai 500 feedback più recenti".
- **Annuncio**: alla risposta la regione `role="status"` legge il riassunto del design ("Risposta pronta. N feedback ne parlano. {testo} Sotto ci sono K citazioni." oppure "Non trovo feedback che ne parlano. Letti N feedback degli ultimi 90 giorni."), visivamente nascosto.
- **Scorrimento**: se la risposta arriva sotto la piega, la pagina porta l'intestazione della risposta in vista, senza animazione (regola del design per il proiettore).
- **Kit**: variante `ask` di `Textarea` (carta, bordo interno 1,5 px `ink-muted`, sans 20, niente ridimensionamento) usata dalla casella di Chiedi; `<cite>` di `Quote` da `ink-subtle` a `ink-muted` in tutta l'app. Aggiornati `DESIGN.md` della radice (tabella colori, Campi, Citazione evidenziata), `design/kit.css` (`.textarea-ask`, colore di `.quote cite`) e `design/kit.html` (esempio della casella).
- **E2E**: attesa con orologio finto di Playwright e finto gateway lento (`LENTA`), e due invii ravvicinati contati sulle richieste con intestazione `next-action`.

## Visti fallire prima del codice

```
     × the button names how many feedback it reads
     × after 15 seconds the longer message
     × the status region sums up the answer
     × Textarea ask: paper, 1.5 px ink-muted inner border, 20 px sans, no resize
     × the cite of a quote is ink-muted, readable at 13 px
     × one feedback: feedback ne parla
     × more linked feedback than quotes: Cosa hanno scritto: k dei n feedback
     × over 500 feedback in the window: the partial perimeter
     × no_evidence shows the sentence without number, text or quotes
      Tests  9 failed | 14 passed (23)
```

Passati al primo giro: intestazione, numero, testo e citazioni (di S1); nessun nome del cliente (il risultato non l'ha mai avuto); testo del modello come testo (React lo scappa da sé); nessun `dangerouslySetInnerHTML`. Per AC 21 la prova è per mutazione: con il testo della risposta reso come HTML

```
     × never use dangerouslySetInnerHTML
     × model markup is shown as text
      Tests  2 failed | 10 passed (12)
```

## Verifica

```
pnpm typecheck   exit 0
pnpm lint        exit 0
pnpm test        Test Files  22 passed (22)   Tests  267 passed (267)
pnpm build       ✓ Compiled successfully
```

E2E scritti ma **non eseguiti**: porta 3000 occupata (worktree `voce-prova-live`).

**Verifica a mano nel browser non fatta.** Ho avviato un server di sviluppo mio sulla porta 3001 con il finto gateway sulla 4011, ma in questa sessione non c'è l'host dell'anteprima di T3 Code ("No preview automation host is available"), e il browser Playwright è bloccato dall'hook `t3-browser-guard.sh`. Non ho aggirato l'hook. Server fermati. Restano da guardare a occhio: `/ask` a 1280×720 con zoom 125% e 150%, e il nuovo colore di `<cite>` su `/themes`, `/themes/[id]` e sull'anteprima prima dell'analisi.
