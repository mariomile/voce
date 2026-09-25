# App Next.js con il design e dati finti

## Obiettivo

L'app Next.js con le schermate della direzione B, cliccabile, costruita con shadcn/ui personalizzato sui token di `DESIGN.md`. Niente database e niente login veri: i dati finti stanno in un solo file, e il passo successivo li sostituisce con Supabase toccando il meno possibile.

## Scelte

- **Un solo punto di accesso ai dati:** `src/lib/data.ts`, funzioni asincrone per workspace (`getCurrentWorkspace`, `getDashboard`, `listFeedback`, `getTheme`, `getPublicForm`). Le pagine sono server component e chiamano solo queste. Oggi leggono da `src/lib/mock-data.ts`; con Supabase cambia il corpo delle funzioni e il file dei dati finti si cancella.
- **Forma dei dati come le future tabelle:** `workspaces`, `feedback`, `analyses`, `themes`, `theme_feedback` (con la frase evidenziata per le citazioni). Conteggi e andamento si calcolano dai collegamenti, non si scrivono a mano.
- **Nessun salvataggio.** Priorità, stato e modulo pubblico passano da server action con validazione zod: oggi validano e rispondono, niente memoria né localStorage. Il passo Supabase aggiunge la scrittura lì dentro.
- **Filtri nell'URL** (`?type=`, `?status=`, `?channel=`): il filtro avviene in `data.ts`, come farà la query.
- **Token come tema Tailwind** (`@theme` in `globals.css`, stessi nomi di `kit.css`), variabili di shadcn/ui mappate come da `DESIGN.md`. Varianti dei componenti con gli stessi nomi del kit.
- Rotte in inglese: `/`, `/login`, `/signup`, `/themes`, `/themes/[id]`, `/feedback`, `/f/[slug]`. Raccolta e Abbonamento non sono in questo passo.

## Passi

1. Scaffold Next.js (pnpm, TypeScript strict, Tailwind, ESLint), shadcn/ui, font con `next/font`, script `typecheck` e `test` (Vitest).
2. Token e componenti ui: Button, Input, Textarea, NativeSelect, Card, Badge, Table, più i pezzi di schermata (barra dell'app, tema, citazione, modulo pubblico).
3. `mock-data.ts` e `data.ts`, con test sulle funzioni di lettura (conteggi, filtri, isolamento per workspace, modulo pieno o disattivato).
4. Schermate: landing con prezzi, accesso e registrazione, dashboard (con i due stati vuoti), feedback con filtro per canale, dettaglio tema, modulo pubblico nei suoi stati.

## Verifica

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
- Ogni schermata aperta nel browser, flussi provati a mano, screenshot confrontati con `design/b-voci.html`.
- Revisione indipendente da un subagente.
