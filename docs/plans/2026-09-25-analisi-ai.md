# Analisi AI dei feedback

## Obiettivo

Il pulsante Analizza raggruppa i feedback degli ultimi 90 giorni (massimo 500) in temi: titolo, sintesi, tipo, sentiment, feedback collegati e 2-3 citazioni testuali. Priorità e stato passano ai nuovi temi con lo stesso titolo. Ogni analisi lascia traccia di input, output, modello, token, durata e costo stimato. Limiti del piano, errori e timeout non fanno perdere dati. Le evals in `evals/` misurano l'output del modello su un set sintetico.

## Decisioni

- **AI SDK 7 con `generateText` e `Output.object`**, modello da `AI_MODEL` (default `anthropic/claude-sonnet-5`) via Vercel AI Gateway. Timeout 240 secondi, `maxDuration` della pagina a 300.
- **Feedback numerati, non uuid.** Il modello riceve i feedback con un numero da 1 a N e risponde con i numeri: meno token in uscita, e un numero fuori intervallo si riconosce subito. Il server li riporta agli id veri.
- **Input non fidato.** Istruzioni solo nelle `instructions`; i feedback arrivano nel messaggio utente come JSON dentro un blocco `<feedback_data>`, con `<` codificato così nessun testo può chiudere il blocco. Le istruzioni dicono di trattare tutto come dato e di non eseguire richieste contenute nei feedback. I titoli dei temi esistenti arrivano nello stesso modo: vengono da analisi precedenti, quindi dai feedback.
- **Schema largo, controlli nel codice.** Lo schema valida la forma (tipi ed enum); le regole le applica il server dopo: numeri di feedback esistenti, massimo 3 temi per feedback, almeno 2 feedback per tema, citazioni che compaiono carattere per carattere nel feedback citato e collegate al tema, massimo 3 citazioni, titoli non vuoti e non ripetuti. Quello che non passa si scarta e si annota. Uno schema stretto farebbe fallire un'analisi intera per una citazione di troppo.
- **Registro delle analisi in `analysis_runs`**: input (istruzioni, messaggio, id dei feedback in ordine), output grezzo del modello, cosa è stato scartato e perché, modello, token in entrata e in uscita, durata, costo stimato, errore. RLS attiva e nessun permesso per gli utenti: lo legge solo il server. Il costo si stima dai prezzi per milione di token nel codice; per un modello non in tabella resta vuoto.
- **Scrive solo il server, con la chiave segreta.** Tre funzioni del database chiamabili solo da `service_role`:
  - `start_analysis`: blocca il workspace, chiude come fallite le analisi rimaste "in corso" da più di 10 minuti, rifiuta se ce n'è già una in corso o se la quota del mese (calendario italiano) è finita, poi crea l'analisi "in corso" e salva l'input. Due clic in parallelo non superano la quota.
  - `finish_analysis`: in una transazione salva temi, collegamenti e citazioni, porta priorità e stato dall'ultima analisi riuscita per titolo uguale (senza maiuscole e spazi ai lati), segna l'analisi come riuscita e completa il registro. Ricontrolla che ogni citazione sia nel testo del feedback.
  - `fail_analysis`: segna l'analisi come fallita e salva errore e durata.
  Se un utente potesse chiamarle, potrebbe scrivere temi e costi finti nel registro.
- **Le analisi fallite non contano nella quota.** L'utente non ha avuto temi. Quelle in corso sì, per non superare la quota con clic in parallelo. Ma i tentativi falliti costano token: al massimo tanti quanti la quota del mese (3 Free, 100 Pro), poi anche loro fermano il pulsante.
- **Un'analisi senza temi è fallita.** Se il modello non trova temi, o i controlli li scartano tutti, l'analisi non sostituisce la precedente e non consuma la quota.
- **Niente dati persi.** Finché una nuova analisi non è riuscita, la dashboard mostra l'ultima riuscita. Un errore lascia tutto com'era.
- **Sentiment** nuova colonna dei temi: positivo, neutro, negativo, misto. Il seed prende un valore per ogni tema.
- **Evals**: `pnpm evals` chiama il modello vero sul set sintetico (60 feedback su un prodotto finto, temi attesi scritti a mano, 3 tentativi di prompt injection, titoli di un'analisi precedente). Controlli automatici sull'output grezzo del modello: ogni tema ha almeno 2 feedback esistenti collegati, le citazioni compaiono davvero nei feedback; in più nessun tema segue le istruzioni nascoste nei feedback. Il risultato si salva in `evals/results/` e si confronta con il precedente. `pnpm test` non chiama mai il modello: usa `MockLanguageModelV4`.

## Passi

1. Migrazione: stato delle analisi, sentiment dei temi, `analysis_runs`, le tre funzioni. Seed con il sentiment, tipi rigenerati.
2. `src/lib/analysis.ts`: prompt, schema, chiamata al modello, controlli, costo. Test con modello finto.
3. Azione `analyze` e pulsante Analizza (dashboard e stato vuoto), letture che ignorano le analisi in corso o fallite, quota che non conta le fallite, sentiment nell'interfaccia.
4. Evals: set sintetico, script, prima esecuzione vera.
5. Verifica e revisione indipendente.

## Verifica

- `supabase db reset` da zero, `supabase db advisors`.
- Test (modello finto): output valido salvato con priorità e stato portati; numeri inesistenti, citazioni inventate, citazioni di feedback non collegati, temi con un solo feedback, feedback in più di 3 temi scartati; errore e timeout del modello lasciano i temi di prima e non consumano la quota; quota Free (3) e Pro, analisi in corso che blocca la seconda, analisi bloccata da più di 10 minuti che si sblocca; nessun feedback negli ultimi 90 giorni; massimo 500 feedback; istruzioni nei feedback solo dentro il blocco dati. Accesso: utenti e anonimo non chiamano le funzioni né leggono il registro.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
- `pnpm evals` con il modello vero, risultato riportato.
- Browser: analisi da stato vuoto e da dashboard, priorità conservata, messaggio a quota finita.
