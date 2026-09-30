# Copertura dell'analisi e conteggi onesti

## Obiettivo

Correggere i difetti trovati facendo girare una Research vera in produzione (Research `be400e32`, account demo A, 200 feedback simulati su Jira, 29 settembre), prima della masterclass del 1 ottobre:

1. **Copertura.** 59 feedback su 200 in nessun tema, solo 6 davvero fuori tema. Cadono soprattutto i neutri e i positivi: il risultato pende verso il negativo.
2. **Conteggi bassi.** Temi sovrapposti si dividono i feedback ("Lentezza" 7, "Interfaccia complessa" 12, su 44 feedback di lentezza e complessità).
3. **Tipo sbagliato.** "Cambiare strumento è bloccato da audit e conformità" etichettato come apprezzamento: è un vincolo.
4. **Conteggi del verdetto.** "7 a favore · 6 contro" sembra un voto, ma il modello elenca solo un campione dei feedback.
5. **"Clienti".** Il ragionamento del verdetto e i riassunti chiamano "clienti" chi scrive, anche quando la Research parla di uno strumento di terzi.
6. **Intestazione dopo l'import CSV.** Resta "Ancora nessun feedback" finché non si ricarica.
7. **Ipotesi doppie.** "per compliance e non per scelta" sono due affermazioni: il verdetto si confonde.

## Decisioni

- **Ogni feedback passa per il modello, uno per uno.** Lo schema dei temi cambia: il modello scrive i temi (numerati, con titolo, riassunto, tipo, tono, citazioni) e poi una riga per ogni feedback con i numeri dei temi a cui appartiene, da 0 a 3. Oggi scrive per ogni tema la lista dei suoi feedback, e con 200 feedback si ferma presto: le liste sono un campione. Obbligarlo a passare ogni feedback risolve insieme copertura e conteggi bassi, con una sola chiamata: nessun secondo giro, nessun tempo in più di attesa oltre ai token delle righe (circa 10 token per feedback). Il server costruisce i temi dalle righe, controlla le citazioni come prima e ordina i temi per numero di feedback. Se dopo questo passo la copertura resta sotto la soglia, il secondo giro sui feedback rimasti fuori è il passo successivo, non prima.
- **Prompt dei temi**: unire i temi che dicono la stessa cosa; creare temi anche per le voci neutre e positive; "praise" solo per ciò che chi scrive apprezza, con il controesempio del vincolo (regola, audit, obbligo, costo di uscita: "problem" se ostacola, mai "praise"); tono secondo come scrivono, non secondo la conclusione.
- **Verdetto: conteggi completi, verificati come oggi.** Lo schema del verdetto già restituisce i numeri dei feedback a favore e contro, controllati lato server e salvati come link: i conteggi mostrati sono già quei link. Il difetto è nel prompt, che non chiede la lista completa. Il prompt ora chiede tutti i feedback di ciascun lato, "non un campione, il product manager legge il numero come quante persone lo dicono". Nell'interfaccia: "{n} feedback a favore · {m} contro · su {r} letti" e le citazioni sotto diventano "Alcuni a favore" / "Alcuni contro", così è chiaro che le citazioni sono esempi e i numeri sono totali. Scartata la sola rietichettatura ("7 citazioni tra le più chiare"): lascerebbe un numero inutile accanto al verdetto.
- **Parole neutre.** Nei prompt di temi, verdetto e Chiedi: chi scrive i feedback si chiama "le persone" / "chi ha scritto", mai "clienti" o "utenti", perché la Research può essere su un prodotto di terzi. Nei cataloghi IT/EN della sezione ipotesi e verdetto nessun "clienti" (oggi non ce ne sono: la parola arrivava dal modello).
- **Ipotesi**: suggerimento sotto il campo "Una sola affermazione per ipotesi: si può confermare o smentire." e un avviso leggero, non bloccante, quando il testo contiene " e non " o " non per " (IT) / " and not " / " not because " (EN).
- **Intestazione dopo l'import**: capire perché la revalidazione non arriva al layout e correggere con `router.refresh()` dopo un import andato a buon fine, se la revalidazione della action non basta.
- Nessuna migrazione: il database riceve gli stessi temi controllati di prima.

## Costo

Temi: circa 2.000 token di uscita in più su 200 feedback (una riga per feedback), circa 0,02 dollari in più per analisi. Verdetto: le liste complete aggiungono qualche centinaio di token. Nessun cambio di modello. I numeri veri sono nel confronto delle evals e nella nota.

## Evals

Nuova eval `evals/coverage.eval.ts` sui 200 feedback della Research Jira (`evals/coverage.json`, con l'argomento di ogni feedback dal generatore): una chiamata temi e una verdetto.

- copertura dei feedback in tema (argomento diverso da `off_topic`) almeno 0,9 (prima: 0,67);
- nessun tema "praise" fatto di vincoli (prima: 2);
- "Jira è lento" collega a favore almeno l'85% dei feedback che dicono che è lento;
- l'ipotesi su roadmap e discovery ha almeno 12 feedback a favore (l'argomento ne ha 20; prima: 9);
- nessun "clienti"/"customers" nei riassunti e nei ragionamenti.

`evals/analysis.eval.ts` aggiunge la copertura sul set di 60 (feedback dei temi attesi in almeno un tema). `evals/verdicts.json` aggiunge `min_for_links` a v01 (notifiche: almeno 9 feedback a favore collegati).

Tutte le evals (analisi, Chiedi, verdetto, copertura) girano una volta prima e una dopo; il confronto e il costo vanno nella nota.

## Passi

1. Eval di copertura e risultato di partenza (fatto: copertura 0,67, 2 vincoli come apprezzamento, discovery 9 a favore).
2. Temi: test di `checkOutput` sul nuovo schema (rossi), poi schema, controlli e prompt. Aggiornare il finto modello dei test unitari e il finto Anthropic degli E2E.
3. Verdetto: prompt con liste complete e parole neutre; `min_for_links` nella eval; copy dei conteggi IT/EN.
4. Chiedi: parole neutre nel prompt.
5. Ipotesi: suggerimento e avviso, con test del componente.
6. Intestazione dopo l'import CSV: riprodurre in locale, test, correzione.
7. Evals dopo, confronto; typecheck, lint, test, build, E2E toccati; PR; CI; merge; produzione; nuova sintesi sulla Research `be400e32` e confronto prima/dopo.

## Verifica

`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, gli E2E della Research e della sala, `pnpm evals` prima e dopo. In produzione, come demo A: temi, feedback fuori tema, conteggio del tema della lentezza, tipi, conteggi dei verdetti, durata e costo della sintesi, prima e dopo, con screenshot a 1440.
