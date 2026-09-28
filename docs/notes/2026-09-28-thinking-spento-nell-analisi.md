# Ragionamento spento nell'analisi

**Cosa è successo.** Primo test in produzione dopo il passaggio all'API Anthropic: analisi di 360 feedback sull'account demo Fatturino, fallita dopo 171 secondi con `AI_NoOutputGeneratedError`, senza token né costo registrati.

**Causa.** Claude Sonnet 5 ragiona di default quando la richiesta non dice niente, e i token del ragionamento contano nel tetto `maxOutputTokens` (16.000). Su un insieme grande il modello ha finito il tetto prima di scrivere il JSON.

**Cosa è stato fatto.**
- `MODEL_OPTIONS` in `src/lib/analysis.ts`: `thinking: { type: "disabled" }`, passato a `generateText`. Raggruppare e citare feedback non ha bisogno di ragionamento lungo, e la risposta arriva prima: sul palco conta.
- Se il modello si ferma prima di finire (per esempio `length`), l'errore dice il motivo e i token usati, invece di un generico "No output generated".
- `fakeModel` accetta un motivo di stop per provarlo.

**Verifica.**
- `pnpm vitest run src/lib/analysis.test.ts`: prima 2 falliti (thinking non passato, errore senza motivo), poi 13 su 13.
- `pnpm typecheck`, `pnpm lint`: exit 0. `pnpm build`: compilato.
- Test con database e E2E: su GitHub CI, perché Docker locale (Colima) dà errori di I/O.

**Cosa resta.** Rifare l'analisi in produzione e leggere costo e durata reali. Chiedi deve usare lo stesso `MODEL_OPTIONS`.
