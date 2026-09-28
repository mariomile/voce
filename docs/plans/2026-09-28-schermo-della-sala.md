# Schermo della sala

## Obiettivo

Una pagina a schermo intero da proiettare durante una sessione dal vivo (masterclass PHC26, 1 ottobre 2026, circa 230 PM che rispondono al modulo pubblico dal telefono). Mostra la domanda, il QR code del modulo e il numero di risposte che sale in diretta. Un pulsante lancia l'analisi già esistente e mostra i temi in grande.

Mai il testo dei feedback su questo schermo: Mario controlla le risposte dal telefono prima di proiettare qualcosa. Solo conteggi e titoli dei temi.

## Scelte

- **Pagina `/sala`**, fuori dal gruppo `(app)`: niente barra dell'app, lo schermo è tutto della sala. Protetta dal proxy come le altre pagine dell'app; i dati si leggono come l'utente, quindi RLS li limita al suo workspace.
- **Il conteggio è il totale delle risposte arrivate dal modulo pubblico** nel workspace: i feedback con canale `Modulo pubblico`, che è fissato dal database in `submit_public_feedback`. Non "da quando la pagina è aperta": ricaricare la pagina non deve azzerare il numero. I feedback non sono legati al link (un nuovo link non azzera il conteggio). Un feedback inserito a mano o da CSV con canale "Modulo pubblico" conta anche lui: accettato, è un caso limite.
- **Aggiornamento ogni 3 secondi** con una route `GET /sala/status` che risponde solo con due valori: numero di risposte e stato del modulo (aperto, spento, pieno per il limite Free). Una chiamata alla volta: la successiva parte 3 secondi dopo la fine della precedente. Non un'azione server: le azioni di una pagina girano una alla volta, e durante un'analisi di qualche minuto il numero si sarebbe fermato.
- **Analisi**: il pulsante chiama la stessa azione `analyze` di Temi, con gli stessi controlli di quota e gli stessi messaggi. Nessun codice AI nuovo. L'analisi legge tutti i feedback del workspace degli ultimi 90 giorni, non solo quelli del modulo: è quella di Temi, detto nella nota e nella PR.
- **Temi sullo schermo**: un'altra azione (`roomThemes`) legge i temi aperti dell'ultima analisi e manda al browser solo tipo, titolo e numero di feedback, al massimo 5. Né sintesi né citazioni escono dal server per questa pagina.
- I temi compaiono dopo aver premuto il pulsante in questa sessione della pagina. Ricaricando si torna al conteggio.
- Stile: quello della landing (giallo a tutto schermo, Hanken 900 a scala da manifesto). Le regole stanno in `src/app/landing.css`, che la pagina importa, più poche classi `room-*` nello stesso file. Il conteggio fa un piccolo balzo quando sale, spento con `prefers-reduced-motion`.
- Nessuna tabella, migrazione, dipendenza o prompt nuovo.

## Passi

1. **Logica pura** in `src/lib/room.ts`: stato del modulo (aperto, spento, pieno) e riduzione dei temi a tipo, titolo e conteggio, primi 5 per numero di feedback.
   - Verifica: test unitari (`src/lib/room.test.ts`).
2. **Lettura dal database** in `src/lib/data.ts` (`getRoomStatus`): conta solo le risposte del modulo pubblico del proprio workspace. Route `src/app/sala/status/route.ts` e azione `roomThemes` in `src/app/sala/actions.ts`.
   - Verifica: test contro il Supabase locale: conta solo il canale del modulo; un altro utente che passa l'id del workspace legge 0 (RLS); la route risponde `private, no-store`; `roomThemes` restituisce solo `kind`, `title`, `feedbackCount`.
3. **Pagina `/sala`** con i suoi stati (modulo spento, pieno, nessuna risposta, analisi in corso, analisi fallita, quota finita, temi), link "Apri lo schermo della sala" dalla Raccolta, `/sala` tra le pagine protette del proxy, DESIGN.md.
   - Verifica: typecheck, lint, build; E2E nella suite Playwright con l'API Anthropic finta: apre /sala, invia una risposta dal modulo pubblico in un'altra pagina, vede il numero salire, lancia l'analisi e vede il titolo del tema, senza testo dei feedback. /sala senza sessione va al login. Screenshot a 1920x1080 e 1280x720 al 150%.
4. **Nota** in `docs/notes/2026-09-28-schermo-della-sala.md`.
