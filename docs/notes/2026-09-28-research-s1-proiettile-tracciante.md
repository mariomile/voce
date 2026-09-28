# Research, S1: la Research nasce e raccoglie

Primo passo della Research (piano: `docs/plans/2026-09-28-research.md`, slice S1 di `.builderos/initiatives/research/05-build-plan.md`). Criteri, interi o in parte: 1 (parte), 2, 3 (parte: feedback), 4, 5, 6, 8 (parte: `research`), 9 (parte: `research` e `feedback`), 11, 12, 13, 14 (parte), 15 (parte), 16 (parte), 17, 22, 23, 24, 71, 72 (parte).

## Cosa è stato fatto

- **Migrazione** `supabase/migrations/20261001090000_research.sql`, parte 1 (cresce in place nelle slice dopo): tabella `research` con RLS, policy di lettura, modifica ed eliminazione per i membri e grant per colonna; nessun insert diretto, si crea con `create_research(ws, question)` (appartenenza, domanda 1-200 caratteri, slug da `private.new_form_slug`). Una Research iniziale per ogni workspace (domanda del modulo o "Cosa dicono i clienti di {nome}?", slug, stato, domanda del modulo, `created_at` del workspace), `feedback.research_id` obbligatorio con chiave composta sul workspace e indice, colonne del modulo tolte da `workspaces`, `handle_new_user` senza slug. Riscritte sulla Research: `get_public_form`, `submit_public_feedback` (limiti per IP e per workspace invariati), `regenerate_form_link(research)`, `import_feedback(ws, research, rows, dry_run)`. Vista `research_feedback_stats` (`security_invoker`) per numero di feedback, canali e date di ogni Research.
- **Pagine**: `/research` (primo accesso con il campo della domanda, oppure elenco con numero, domanda come link, "Nessun feedback ancora", "Modulo spento"), `/research/new`, `/research/[id]` con testata (ritorno, domanda come h1, riga dei conteggi) e schede Sintesi e Raccolta, Sintesi vuota con le tre strade di raccolta, pagina NF uguale per Research di altri, eliminate o id sbagliati (404).
- **Raccolta, QR e sala spostati** sotto la Research con il comportamento di oggi: `/research/[id]/collect` (le action ricevono l'id della Research), `/research/[id]/qr`, `/research/[id]/sala` e `/sala/status`. `/collect` e `/sala` cancellate, senza reindirizzamenti.
- **Navigazione**: `AppTabs` riceve le schede come props (barra: Research, Piano; dentro la Research: Sintesi esatta, Raccolta), `APP_PATHS` con `/research`, arrivo su `/research` dopo accesso, Google e conferma email.
- **Componenti nuovi**: `ResearchForm`, `ResearchRow`, `ResearchTitle` (h1 che prende il focus solo dopo una creazione), `CollectionPaths` (le tre card che prima stavano nello stato vuoto di `/themes`).
- **Cataloghi**: namespace `research` in italiano e inglese; `app.tabs` con `research`; tolte `collect.page.title` e `lede` (la pagina ora sta sotto la testata della Research).
- **Seed** con una Research per workspace e una seconda Research vuota per Fatturino. Fixture dei test (`src/test/supabase.ts`, `e2e/helpers.ts`) con una Research per utente; Mailpit sulla porta dell'API più 3 (P2 del piano), così le E2E con la posta passano anche sullo stack isolato.
- **Test della migrazione dei dati** (P3): `supabase/migration-tests/run.sh` porta il database a `20260927120000`, carica `research_before.sql`, migra e lancia `research_after.test.sql` (pgTAP), poi fa un reset completo. Gira in CI (passo nuovo in `.github/workflows/ci.yml`) e in locale con `/Users/mariomiletta/.cache/voce-research-db.sh migration-test` (comando aggiunto allo script, fuori dal repository).

## Visti fallire prima del codice

- `voce-research-db.sh test`: `research.test.sql` "Bad plan. You planned 24 tests but ran 0" (la tabella non c'era).
- `voce-research-db.sh migration-test`: `research_after.test.sql` "You planned 9 tests but ran 0".
- vitest: 3 file nuovi senza modulo (`research/actions`, `research/page`, `research-row`) e 8 test esistenti rossi sui percorsi nuovi (`redirect /themes` invece di `/research`, `href="/collect"`, `workspaces.form_slug does not exist`).
- vitest: 3 test sul modulo spento (`accepting: false` invece di nessuna riga) prima di cambiare `get_public_form`.
- E2E `research.spec.ts`: 3 rossi al primo giro (focus sull'h1 dopo la creazione, pagina NF non raccolta dal layout), corretti come scritto sotto.

## Decisioni

- **Il modulo spento mostra `FormUnavailable`**, non più 404 (AC 22): `get_public_form` restituisce la riga con `accepting = false`. Il 404 resta per slug sconosciuti, rigenerati o di Research eliminate.
- **`createResearch` restituisce l'id** e il browser va su `/research/{id}`: con un `redirect` nella server action la promessa nel browser veniva rifiutata prima dell'arrivo, e il focus sull'h1 si perdeva.
- **La pagina NF sta in `src/app/(app)/research/not-found.tsx`**: un `notFound()` lanciato dal layout di `[id]` lo raccoglie il segmento sopra, non `[id]/not-found.tsx`.
- **Il proxy lascia passare senza sessione anche le server action di `/research` e `/research/new`**, come già `/ask`, perché `createResearch` possa rispondere `session` (RC4). Aggiornato il trap in `TECH.md`.
- **Due gruppi di rotte sullo stesso `[id]`** (P7): `src/app/research/[id]/sala` accanto a `src/app/(app)/research/[id]` passa `pnpm build`, la sala resta senza barra.
- **La sala conta le risposte del modulo di quella Research** e il 404 di `/sala/status` per una Research non leggibile: il modulo ora è della Research, contarle sul workspace sarebbe stato sbagliato. Analisi e temi della sala restano quelli del workspace fino a S3 e S10.
- **Duplicati del CSV ancora cercati nel workspace** e check del testo a 2.000 caratteri: cambiano in S2 con i loro test (AC 25, 27).

## Stato intermedio, da sapere

- `/themes`, `/ask` e `/feedback` restano sul workspace e raggiungibili solo dall'URL: la barra ha solo Research e Piano. Tornano dentro la Research in S2 (Feedback), S3 (Sintesi con temi, al posto di `/themes`) e S4 (Chiedi). I loro link a `/collect` portano a `/research`; `/themes` senza feedback rimanda alle Research.
- La Sintesi di una Research con feedback per ora è vuota sotto le schede: i temi arrivano in S3.

## Revisione indipendente

Un revisore sulla migrazione (sola lettura) ha segnalato due punti, entrambi di S2 per piano: duplicati del CSV cercati nel workspace invece che nella Research (AC 27) e milestone `first_research_collected` non inserita dalla migrazione né ammessa dal vincolo (AC 7, 66). Nessun difetto sui dati spostati, su RLS e grant o sulle funzioni riscritte. Ha ricordato un rischio vero per il rilascio: la migrazione toglie colonne che il codice di oggi legge, quindi in produzione migrazione e codice nuovo vanno applicati insieme, non la migrazione prima come per le migrazioni additive.

## Cosa resta

S2-S12 del piano. In S1 non c'è niente di ipotesi, verdetti, analisi per Research, domande per Research, milestone `first_research_collected`, modifica o eliminazione di una Research.
