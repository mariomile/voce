# Chiedi, S9: chiusura della costruzione

Ultimo passo di `docs/plans/2026-09-27-chiedi-ai-feedback.md`. Dettaglio in `.builderos/initiatives/chiedi-ai-feedback/05-build-plan.md` (sezioni "Test output", "Scope check", "Deviations from spec", "Log").

## Stato

| Slice | Commit | Stato |
|---|---|---|
| S1 proiettile tracciante | `21be87c` | fatta, E2E non eseguito |
| S3 regole del database | `43b319c` | fatta |
| S4 guardie e fallimenti | `e7c9583` | fatta, E2E non eseguito |
| S6 quota a vista | `2760a2f` | fatta, E2E non eseguito |
| S5 evento e riservatezza | `7e66b21` | fatta |
| S7 nessun feedback | `6150e2b` | fatta, E2E non eseguito |
| S8 attesa, testo sicuro, kit | `41af370` | fatta, E2E e verifica a mano non eseguiti |
| S2 evals | nessuno | rimandata per decisione di Mario (2026-09-27) |

## Verifica finale, da zero

```
supabase db reset   Applying migration 20260927120000_questions.sql... Finished supabase db reset on branch main.
supabase test db    Files=2, Tests=52, Result: PASS
pnpm typecheck      exit 0
pnpm lint           exit 0
pnpm test           Test Files  22 passed (22)   Tests  267 passed (267)
pnpm build          ✓ Compiled successfully, ƒ /ask
pnpm test:e2e       non eseguito: porta 3000 occupata (node 27760, voce-prova-live)
pnpm evals          non eseguito: rimandato per decisione di Mario
```

## Cosa resta prima di "finito"

- `pnpm test:e2e` con la porta 3000 libera: `e2e/ask.spec.ts` ha 21 test scritti e mai eseguiti (AC 32-38 lato pagina), più `main-flow.spec.ts` che ora importa `confirmationLink` da `e2e/helpers.ts`.
- Verifica a mano nel browser: `/ask` a 1280×720 con zoom 125% e 150%, e il nuovo colore di `<cite>` su `/themes`, `/themes/[id]` e sull'anteprima prima dell'analisi.
- Revisione indipendente (`build-reviewer`) e gate 5.
- Evals di S2, quando Mario le riapre.
