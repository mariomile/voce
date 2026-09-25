# Analisi AI dei feedback

## Cosa è stato fatto

- **Pulsante Analizza** nello stato vuoto ("Analizza N feedback") e nella dashboard ("Nuova analisi"). Mentre lavora dice "Analisi in corso…" e che può volerci qualche minuto. A quota finita è spento e dice perché (con l'invito a Pro sul piano Free). Errori mostrati sotto il pulsante: nessun feedback negli ultimi 90 giorni, analisi già in corso, quota finita, analisi non riuscita.
- **Temi** con titolo, sintesi, tipo, sentiment (nuovo: "Tono positivo/neutro/negativo/misto" accanto al tipo, in dashboard e nella pagina del tema), feedback collegati e 2-3 citazioni evidenziate. Priorità e stato passano ai temi con lo stesso titolo.
- `src/lib/analysis.ts`: istruzioni, schema, chiamata con AI SDK 7 (`generateText` + `Output.object`), controlli sull'output, costo stimato. Modello da `AI_MODEL`, default `anthropic/claude-sonnet-5`, via Vercel AI Gateway.
- Migrazione `…_ai_analysis.sql`: stato delle analisi (in corso, riuscita, fallita), sentiment dei temi, registro `analysis_runs`, funzioni `start_analysis`, `finish_analysis`, `fail_analysis` chiamabili solo dal server.
- `evals/`: set sintetico (60 feedback su "Ritmo", app di prenotazioni per palestre; 8 temi attesi; 6 feedback fuori tema; 3 tentativi di prompt injection; 4 titoli di un'analisi precedente), script `pnpm evals`, risultati in `evals/results/`.
- Dipendenza nuova: `ai` (AI SDK 7), già prevista dallo stack.

## Decisioni

- **Il modello vede numeri, non id.** I feedback arrivano numerati da 1 a N e il modello risponde con i numeri: meno token in uscita, e un numero inventato si riconosce subito. Il server li riporta agli id.
- **Feedback come dato.** Le istruzioni stanno solo nelle `instructions`. Feedback e titoli esistenti arrivano nel messaggio utente come JSON dentro `<feedback_data>` e `<existing_titles>`, con `<` codificato: nessun testo può chiudere il blocco. Le istruzioni dicono di non eseguire richieste contenute nei feedback.
- **Schema largo, controlli nel codice.** Lo schema controlla forma ed enum. Poi il server scarta e annota: numeri inesistenti, feedback oltre il terzo tema, temi con meno di 2 feedback, citazioni non trovate carattere per carattere nel feedback citato o di feedback fuori dal tema, citazioni oltre la terza o doppie sullo stesso feedback, titoli vuoti o ripetuti. `finish_analysis` ricontrolla le citazioni sui testi salvati. Con uno schema stretto una citazione di troppo farebbe fallire tutta l'analisi.
- **Scrive solo il server**, con la chiave segreta, attraverso tre funzioni del database. `start_analysis` blocca il workspace, chiude come fallite le analisi "in corso" da più di 10 minuti, rifiuta se ce n'è un'altra in corso o se la quota del mese (calendario italiano) è finita, e salva l'input. Due clic insieme fanno una sola analisi.
- **Le analisi fallite non contano nella quota**, quelle in corso sì. Se il modello sbaglia, va in timeout o la risposta non ha la forma giusta, l'analisi è segnata come fallita e la dashboard continua a mostrare l'ultima riuscita.
- **Tetto ai tentativi falliti:** costano token anche se non danno temi, quindi al massimo tanti quanti la quota del mese (3 Free, 100 Pro). Senza, un workspace grande che va sempre in timeout potrebbe riprovare all'infinito. Il tetto è una scelta mia, non scritta nel brief: da confermare.
- **Un'analisi senza temi è fallita** ("nessun tema con almeno 2 feedback"): non sostituisce la precedente, non consuma la quota e non fa perdere priorità e stato.
- **Un tema con meno di 2 citazioni valide resta.** Le citazioni sbagliate si scartano, il tema no: perdere un tema vero per un errore di copia sarebbe peggio. Le evals misurano quante citazioni si perdono.
- **Registro in `analysis_runs`**: istruzioni, messaggio e id dei feedback in ordine; output grezzo del modello (anche quando non ha la forma giusta); scarti con il motivo; modello, token, durata, costo stimato, errore. RLS attiva e nessun permesso per gli utenti. Nei log del server va solo il nome dell'errore: i messaggi possono contenere testo dei feedback.
- **Costo stimato** dai prezzi di Sonnet 5 (2 $ e 10 $ per milione di token in entrata e in uscita). Per un modello non in tabella resta vuoto.
- **Periodo**: i feedback ricevuti negli ultimi 90 giorni, i 500 più recenti. L'inizio del periodo è la data del feedback più vecchio analizzato.
- **Evals sull'output grezzo**, prima dei controlli dell'app: è quello che misura modello e prompt. Controlli automatici del brief (almeno 2 feedback esistenti per tema, citazioni presenti davvero) più uno sulle istruzioni nascoste nei feedback. I temi attesi si stampano accanto a quelli prodotti per leggerli a mano.

## Verifica

- `supabase db reset` da zero e `supabase db advisors`: nessun problema.
- `pnpm typecheck`, `pnpm lint`: zero errori. `pnpm build`: riuscito. `pnpm test`: 152 test, 0 falliti. Nuovi, tutti con modello finto:
  - 11 su analisi e controlli: numeri inesistenti o non interi, temi con un solo feedback, citazioni cambiate di un carattere o vuote, citazioni di feedback fuori dal tema, quarta citazione, feedback in un quarto tema, titoli vuoti e ripetuti, blocco dati che nessun feedback può chiudere, istruzioni separate dai dati, costo, risposta non JSON o incompleta.
  - 13 sull'azione, contro il database locale: salvataggio completo con registro; priorità e stato portati (titolo con maiuscole e spazi diversi) e analisi precedente intatta; scarti annotati; errore e timeout che lasciano i temi di prima e la quota; risposta nella forma sbagliata salvata grezza; quota Free 3 con fallite e mesi precedenti che non contano; tetto ai tentativi falliti; analisi senza temi (vuota o tutta scartata) che lascia la precedente e la quota; Pro 100 e ritorno a Free; analisi in corso che blocca, bloccata da più di 10 minuti che si sblocca; due clic insieme; niente feedback negli ultimi 90 giorni (oggi compreso, il 90° giorno fa è fuori); 500 più recenti su 511.
  - 3 di accesso: anonimo e utenti non chiamano le tre funzioni, non leggono né scrivono il registro, non cambiano lo stato di un'analisi.
- Controprova: aperti apposta la funzione di avvio agli utenti e il registro in lettura, 2 test falliti. Database ripristinato.
- Revisione indipendente da un subagente: nessuna falla di accesso, quota o injection. Corretti: analisi senza temi che svuotava la dashboard e consumava la quota, tentativi falliti illimitati, finestra di 91 giorni invece di 90, errore che sovrascriveva il registro di un'analisi già chiusa come bloccata, scarti non salvati sulle analisi fallite.
- Browser (Playwright): stato vuoto con "Analizza 9 feedback", stato "Analisi in corso…", errore del Gateway mostrato sotto il pulsante, quota ancora "0 di 3" dopo il ricaricamento; dashboard con il tono accanto al tipo e pagina del tema; quota finita con pulsante spento e messaggio per il Free.

## Cosa resta

- **Evals non eseguite con il modello vero**: il Gateway risponde 403 "requires a valid credit card on file" finché sul team Vercel non c'è una carta. Per lo stesso motivo oggi ogni analisi nell'app finisce in "non è riuscita". Con la carta: `pnpm evals`, primo risultato di riferimento in `evals/results/`.
- La valutazione della qualità dei temi oltre i controlli automatici (brief, decisione 4).
