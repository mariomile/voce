# App Next.js con il design e dati finti

## Cosa è stato fatto

- App Next.js 16 (App Router, TypeScript strict, Tailwind 4, shadcn/ui su base-ui), `pnpm`.
- Token del kit come tema Tailwind in `src/app/globals.css`, con gli stessi nomi di `design/kit.css`. Colori, taglie di testo, interlinee, raggi e ombre di default di Tailwind spenti. Variabili di shadcn/ui mappate come da `DESIGN.md`. Font con `next/font`.
- Componenti in `src/components/ui/` con le varianti del kit: Button (`secondary`, `highlight`, `link`, `lg`), Input e Textarea (`line`), NativeSelect (`empty`, `strong`, `positive`), Card (`highlight`, `soft`, `row`, `media`), Badge (tre tipi di tema), Table, Field, Chip, DropdownMenu.
- Schermate: landing con prezzi (`/`), accesso (`/login`) e registrazione (`/signup`) solo interfaccia, dashboard dei temi (`/themes`) con i due stati vuoti e l'avviso di limite Free, feedback con filtro per canale (`/feedback`), dettaglio tema (`/themes/[id]`), modulo pubblico (`/f/[slug]`) con scrittura, errore email, inviato, non disponibile.
- Brief, decisione 8: la domanda del modulo pubblico è lunga al massimo 140 caratteri (commit separato).

## Decisioni

- **Un solo punto di accesso ai dati:** `src/lib/data.ts`. Le pagine chiamano solo le sue funzioni asincrone, mai `mock-data.ts`. Il passo Supabase riscrive i corpi di quelle funzioni e cancella `mock-data.ts`; le pagine non cambiano.
- **Tipi come le future tabelle** (`src/lib/types.ts`): `workspaces`, `subscriptions` (scritta solo dal webhook Stripe), `feedback`, `analyses`, `themes`, `theme_feedback` con la frase evidenziata. Conteggi e andamento a 13 settimane si calcolano dai collegamenti.
- **Nessun salvataggio.** Priorità, stato e invio del modulo passano da server action con validazione zod (`src/app/actions.ts`): validano e rispondono, niente memoria né localStorage. Ricaricando la pagina priorità e stato tornano ai valori dei dati finti.
- **Filtri nell'URL** (`?type=`, `?status=`, `?channel=`). Filtro stato di default: aperti (da valutare e in roadmap).
- **Modulo pubblico:** validazione del browser spenta (`noValidate`) perché gli errori siano quelli del kit, controllati lato server. Campo anti-bot nascosto con `hidden`: se è pieno, finto successo. Link disattivato o inesistente: 404.
- **Dashboard:** il pulsante "Passa a Pro" nell'avviso di limite è primario, non giallo: il kit vieta il giallo dentro una superficie gialla.
- `agentRules: false` in `next.config.ts`: `next dev` altrimenti aggiunge un suo blocco in `AGENTS.md`.
- Lingua delle rotte: inglese, come il resto del codice.

## Verifica

- `pnpm typecheck` e `pnpm lint`: zero errori. `pnpm test`: 22 test, 0 falliti (lettura dei dati, isolamento tra workspace, validazione delle server action). `pnpm build`: riuscito, 8 rotte.
- Browser (Playwright, 1440 px e 390 px): tutte le schermate, filtri per tipo, stato e canale, cambio di priorità e stato con il tono giusto, accesso che porta alla dashboard, modulo pubblico in tutti gli stati, stati vuoti cambiando per un attimo il workspace corrente. Zero errori in console.
- Revisione indipendente da un subagente: nessun problema di sicurezza. Corretti: campo anti-bot letto prima della validazione, mese delle quote calcolato in UTC invece che sull'ora italiana, priorità e stato non ripristinati se il salvataggio fallisce, workspace e quote letti due volte per richiesta (ora in cache), filtro per tipo che richiudeva l'elenco completo, due imprecisioni in `DESIGN.md`.

## Cosa resta

- Supabase: tabelle, RLS, auth vera, scritture nelle server action, limiti di invio del modulo (10 al minuto per IP, 300 all'ora per workspace).
- Non ancora costruiti: pagine Raccolta (domanda del modulo, link, QR vero, CSV, inserimento manuale) e Abbonamento. I pulsanti "Nuova analisi", "Analizza N feedback", "Scegli il file", "Incolla un testo" e "Passa a Pro" per ora non fanno nulla.
- Il QR della dashboard vuota è finto, come nel design.
- Per vedere gli stati vuoti: cambiare `CURRENT_WORKSPACE_ID` in `src/lib/data.ts` (`ws_nuovo`, `ws_orto`, `ws_ordinalo`).
