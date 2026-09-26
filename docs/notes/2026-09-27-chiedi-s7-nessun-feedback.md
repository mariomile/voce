# Chiedi, S7: nessun feedback su cui rispondere

Slice S7 di `.builderos/initiatives/chiedi-ai-feedback/05-build-plan.md`. Criterio: 33.

## Cosa è stato fatto

- `/ask` senza feedback negli ultimi 90 giorni mostra, al posto della casella, lo stato vuoto del design: titolo serif, una riga, "Aggiungi feedback" verso `/collect`. Testo A con 0 feedback nel workspace; testo B quando i feedback ci sono ma sono tutti più vecchi di 90 giorni, con il loro numero. Nessuna casella: una domanda senza feedback spenderebbe quota per niente.
- `src/app/(app)/ask/page.test.tsx`: la pagina renderizzata sul server con dati fissi (i tre stati di apertura).
- E2E: testo A e testo B, senza casella.

## Visti fallire prima del codice

```
     × no feedback: text A and Aggiungi feedback, no field
     × only feedback older than 90 days: text B with their number, no field
AssertionError: expected '<main class="mx-auto w-full max-w-[11…' to contain 'Qui farai domande ai tuoi feedback e …'
AssertionError: expected '<main class="mx-auto w-full max-w-[11…' to contain 'Negli ultimi 90 giorni non è arrivato…'
      Tests  2 failed | 1 passed (3)
```

## Verifica

```
pnpm typecheck   exit 0
pnpm lint        exit 0
pnpm test        Test Files  20 passed (20)   Tests  254 passed (254)
pnpm build       ✓ Compiled successfully
```

E2E scritti ma **non eseguiti**: porta 3000 occupata (worktree `voce-prova-live`).

## Decisioni

- Il titolo serif dello stato vuoto è un `h2`: l'`h1` della pagina resta "Chiedi ai tuoi feedback", così la gerarchia dei titoli è la stessa in tutti gli stati.
