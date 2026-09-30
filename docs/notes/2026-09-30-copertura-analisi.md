# Copertura dell'analisi e conteggi onesti

Piano: `docs/plans/2026-09-30-copertura-analisi.md`. Difetti trovati sulla Research Jira in produzione (`be400e32`, 200 feedback simulati).

## Cosa è cambiato

- **Temi: una riga per ogni feedback.** Il modello scrive i temi numerati e poi `assignments`, una riga per feedback con i numeri dei temi (0-3). Il server costruisce i temi dalle righe, scarta i numeri che non esistono, elenca i feedback senza riga (`feedback_without_row`) e ordina i temi per numero di feedback. Il database riceve gli stessi temi controllati di prima: nessuna migrazione.
- **Prompt dei temi:** unire i temi sovrapposti, coprire anche le voci neutre e positive, "praise" solo per ciò che chi scrive apprezza, con il controesempio del vincolo (audit, obbligo, costo di uscita: "problem"), tono secondo come scrivono.
- **Verdetto: una riga di evidenza per ogni feedback.** Il modello scrive prima il verdetto di ogni ipotesi (verdetto, ragionamento, citazioni), poi `evidence`: per ogni feedback i numeri delle ipotesi che sostiene e che contraddice. I conteggi "a favore / contro" sono queste righe, verificate lato server come prima. Nell'interfaccia: "{n} feedback a favore · {m} contro · su {r} letti", e sopra le citazioni "Alcuni a favore" / "Alcuni contro" (EN: "Some for" / "Some against").
- **Parole neutre** nei prompt di temi, verdetto e Chiedi: "le persone" / "chi ha scritto", mai clienti o utenti.
- **Ipotesi:** suggerimento "Una sola affermazione per ipotesi, che si può confermare o smentire." e, quando il testo contiene " e non ", " non per ", " and not ", " not because ", la nota "Sembrano due affermazioni: il verdetto è più chiaro se le scrivi come due ipotesi." Non blocca nulla. Il prompt del verdetto chiede di sostenere un'ipotesi doppia solo con feedback che sostengono entrambe le parti.
- **Import CSV:** dopo un import con feedback nuovi, `router.refresh()`. In locale (dev e build) l'intestazione si aggiornava già: il nuovo E2E passa anche senza la correzione, il difetto si vede solo in produzione. La verifica vera è in produzione.
- `maxOutputTokens` da 16.000 a 32.000 per temi e verdetto: con 500 feedback le righe sono circa 7.500 token. Si pagano solo i token scritti.

## Evals, prima e dopo

Modello `claude-sonnet-5-5`, thinking adattivo a effort basso. Prima: commit `0c507ad`. Dopo: questo branch.

| Eval | Prima | Dopo |
|---|---|---|
| Analisi (60 feedback) | 8 temi, copertura 1,0, 22 citazioni, 0 fuori testo, 0 istruzioni eseguite, 3 titoli riusati, 13,0 s, 0,037 $ | 8 temi, copertura 1,0, 23 citazioni, 0 fuori testo, 0 istruzioni eseguite, 3 titoli riusati, 16,2 s, 0,046 $ |
| Chiedi (20 casi) | 17/20 (0,85), G1 0, 0,300 $ | 18/20 (0,90), G1 0, 0,304 $ |
| Verdetto (20 casi) | 19/20 (0,95), must-pass fallito v11, G1 0, 0,320 $ | 20/20, nessun must-pass fallito, G1 0, 0,548 $ |
| Copertura (Jira, 200) | copertura 0,67 (64 in tema mancanti), 2 temi "praise" fatti di vincoli, "Jira è lento" 6/7, discovery 9 a favore, temi 21,8 s, verdetto 9,7 s, 0,121 $ | copertura 0,912 (17), 0 vincoli come praise, 6/7, discovery 15 a favore, temi 35,8 s, verdetto 28,8 s, 0,197 $ |

Conteggi dei verdetti sulla Research Jira (a favore/contro), prima → dopo: lento e complesso 10/4 → 16/6; roadmap e discovery 9/2 → 15/1; compliance "non per scelta" 4/5 → 15/5; "Jira è lento" 7/3 → 8/5.

La copertura sui 200 varia tra un run e l'altro: 0,938, 0,969, 0,918, 0,912 nei quattro run del nuovo prompt, sempre sopra la soglia di 0,9. Restano fuori soprattutto feedback con un punto unico (le scorciatoie da tastiera, l'editor che perde la formattazione) e qualche positivo generico ("Va bene così").

**Un tentativo scartato.** Con le righe di evidenza prima dei verdetti, il modello metteva quasi tutto "da rivedere" (anche discovery 14 a favore e 2 contro) e l'eval del verdetto scendeva a 17/20 con il must-pass v07 fallito e una citazione non esatta. Con il verdetto prima e le righe dopo: 20/20.

**Costo e durata.** Su 200 feedback una sintesi (temi più verdetto, in parallelo) passa da circa 0,12 $ a 0,20 $ e da circa 22 a 36 secondi (la più lunga delle due chiamate). Stesso modello.

Spesa delle evals: circa 3,0 $ in tutto (prima 0,78 $, due run intermedi della sola copertura 0,35 $, dopo 1,10 $, secondo run di verdetto e copertura dopo il riordino 0,75 $).

## Nuove eval

- `evals/coverage.eval.ts` con `evals/coverage.json`: i 200 feedback della Research Jira con l'argomento di ogni feedback dal generatore. Soglie: copertura almeno 0,9, nessun tema "praise" fatto di vincoli, "Jira è lento" almeno 85% dei feedback lenti, discovery almeno 12 a favore. Riporta anche `customerWords` (riassunti e ragionamenti con "clienti"/"customers": 0 dopo).
- `evals/analysis.eval.ts`: copertura sui 60, soglia 0,9.
- `evals/verdicts.json`: `min_for_links` su v01 (notifiche: almeno 9 feedback a favore collegati).

## Verifica locale

`pnpm typecheck` pulito, `pnpm lint` pulito, `pnpm test` 49 file e 594 test passati, `pnpm build` riuscito. E2E su build di produzione in locale (porta 3008, Supabase isolato): 69 passati, 5 falliti, tutti al passo della email di conferma (Mailpit dello stack isolato riceve la mail con il template di default, non quello del repo): da verificare in CI.

## Resta

- Verifica in produzione: nuova sintesi sulla Research `be400e32` e import CSV.
- Una nuova Research ha il modulo pubblico attivo di default: non toccato.
