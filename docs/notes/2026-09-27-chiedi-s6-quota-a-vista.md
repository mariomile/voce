# Chiedi, S6: quota a vista

Slice S6 di `.builderos/initiatives/chiedi-ai-feedback/05-build-plan.md`. Criteri: 34, 35, 39.

## Cosa è stato fatto

- `PLAN_LIMITS` ha `questionsPerMonth` (Free 10, Pro 100); un test controlla che rispecchi `private.questions_limit` della migrazione, che è la regola vera.
- Nota della quota sotto il pulsante: "Userai 1 delle {limite} domande di {mese}." prima della prima domanda del mese, poi "Ti restano {n} domande di {mese}." (con 1: "Ti resta 1 domanda di {mese}."), con i numeri letti dal server (`question_usage`) all'apertura e restituiti dalla action dopo ogni risposta.
- Avviso di quota finita (E3 Free con "Passa a Pro", E4 Pro senza) all'apertura, con pulsante `aria-disabled` e senza focus automatico, e dopo la decima (o centesima) risposta, con la risposta ancora visibile sotto: l'avviso dipende dai numeri della quota, non da un evento.
- E3 legge "100" da `PLAN_LIMITS`.
- Righe dei piani in `/billing` e sulla landing: "10 domande ai feedback al mese" (Free), "100 domande ai feedback al mese" (Pro).
- Riga in `docs/prima-dei-clienti-reali.md` sul testo delle domande che passa dal Vercel AI Gateway e sul registro `question_runs`.
- E2E: nota prima e dopo, Free a 10, Pro a 100, decima risposta sotto l'avviso, piani su `/billing` e landing.

## Visti fallire prima del codice

```
     × PLAN_LIMITS mirrors private.questions_limit
     × lists the question text that goes through the Vercel AI Gateway
     × before the first question of the month, then what is left, with numbers from the server
     × E3 names the Pro quota from PLAN_LIMITS
     × the landing shows the question quota of Free and Pro
     × /billing shows the question quota of Free and Pro
TypeError: quotaNote is not a function
AssertionError: expected undefined to be 10 // Object.is equality
AssertionError: expected [ 100, 10 ] to deeply equal [ undefined, undefined ]
AssertionError: expected '# Prima dei clienti reali\n\nCose da …' to match /\*\*Testo delle domande[^\n]*Vercel A…/
AssertionError: expected '<header class="mx-auto flex h-16 w-fu…' to contain '10 domande ai feedback al mese'
AssertionError: expected '<main class="mx-auto w-full max-w-[11…' to contain '10 domande ai feedback al mese'
      Tests  6 failed | 5 passed (11)
```

## Verifica

```
pnpm typecheck   exit 0
pnpm lint        exit 0
pnpm test        Test Files  18 passed (18)   Tests  245 passed (245)
pnpm build       ✓ Compiled successfully
```

E2E scritti ma **non eseguiti**: porta 3000 occupata (worktree `voce-prova-live`).

## Decisioni

- `src/test/plan-pages.test.tsx` renderizza landing e `/billing` con `renderToStaticMarkup` e i dati finti: è la prova che gira qui, visto che l'E2E è fermo. Nessuna dipendenza nuova.
- La nota della quota non sta nella regione `role="status"`: si legge, non si annuncia. L'annuncio della risposta arriva in S8.
