# Chiedi, S4: guardie e fallimenti

Slice S4 di `.builderos/initiatives/chiedi-ai-feedback/05-build-plan.md`. Criteri: 6, 7 (metà unitaria), 9, 10, 11, 12, 15, 16, 22, 26, 37.

## Cosa è stato fatto

- **Action `ask`**: `invalid` (schema zod stretto con il solo campo `question`, vuota, solo spazi, oltre 300 caratteri dopo il trim, input nullo o con campi in più), `session` (nessuna sessione valida, prima di qualsiasi lettura), `no_feedback` (nessun feedback negli ultimi 90 giorni), `failed` (errore del modello, timeout, output fuori schema, errore di `finish_question`) con `fail_question`, testo grezzo salvato e quota contata; nei log solo nome dell'errore e id della domanda.
- **`checkAnswer`**: scarta e scrive in `issues` le citazioni `quote_not_linked`, `second_quote_same_feedback`, `too_many_quotes` oltre la quinta (in S1 c'erano già `unknown_feedback` e `quote_not_in_feedback`).
- **`getUsage`** aggiunge `questionsThisMonth` e `questionsLimit`, letti con `question_usage` dalla chiave segreta per il workspace della sessione: gli utenti non leggono `questions`.
- **Pagina**: messaggi E1-E9 con i testi esatti del design, in `src/components/ask-copy.ts` (testato da solo) e `AskForm`. E1 ed E2 con `aria-invalid` e `aria-describedby`; contatore "N di 300" da 250 caratteri; E2 anche mentre si scrive; E3/E4 come avviso sopra la casella (Card soft, "Passa a Pro" solo su Free); E5-E9 nella regione `role="status"`; la domanda resta e il focus torna nella casella.
- **Proxy**: le richieste della server action su `/ask` senza sessione non vengono più mandate a `/login`, così la action risponde `session` e la pagina mostra E8 con la domanda ancora lì. Solo `/ask`, solo richieste con l'intestazione `next-action`; la action controlla la sessione da sé.
- **Finto gateway**: una domanda con `FUORI_SCHEMA` riceve testo non JSON (per E6), una con `LENTA` risponde dopo 20 secondi (per S8).
- **E2E** in `e2e/ask.spec.ts`: un test per messaggio, E1-E9.

## Visti fallire prima del codice

```
     × drops quote_not_linked
     × drops second_quote_same_feedback
     × drops too_many_quotes after the fifth
     × empty, blank and 301-character questions are invalid, no row, no call
     × needs feedback from the last 90 days, today included
     × without a session returns session, no row, no call
     × model error is failed and counted
     × a model slower than 60 s is failed and counted
     × output out of schema is failed and counted, raw text saved
     × logs only the error name and the question id
     × counts the questions of the month apart from the analyses
AssertionError: expected { plan: 'free', …(4) } to match object { plan: 'free', …(3) }
AssertionError: expected [ { feedbackId: 'id-3', …(1) } ] to deeply equal []
AssertionError: expected { ok: true, outcome: 'answered', …(7) } to deeply equal { ok: false, reason: 'invalid' }
Unknown Error: new row for relation "questions" violates check constraint "questions_feedback_considered_check"
Unknown Error: permission denied for table workspaces
Error: Gateway down
TimeoutError: The operation timed out.
AI_NoObjectGeneratedError: No object generated: could not parse the response.
 Test Files  3 failed (3)
      Tests  11 failed | 37 passed (48)

 FAIL  src/components/ask-copy.test.ts
Error: Cannot find module './ask-copy' imported from .../src/components/ask-copy.test.ts
```

Passati al primo giro, perché il comportamento esisteva da S1 (lo dico, non li conto come prova del rosso): "returns limit without calling the model" e "returns busy without calling the model" (la quota e `busy` sono del database, provati per mutazione in S3), "sends at most the 500 most recent feedback of the last 90 days" (la lettura è nata così in S1), "a second question's prompt carries nothing from the first" e "has the same text for the same question" (il prompt si costruisce solo da domanda e feedback), "drops unknown_feedback".

## Verifica

```
pnpm typecheck     exit 0
pnpm lint          exit 0
pnpm test          Test Files  17 passed (17)   Tests  239 passed (239)
pnpm build         ✓ Compiled successfully, ƒ /ask
supabase test db   Files=2, Tests=52, Result: PASS
```

E2E scritti ma **non eseguiti**: porta 3000 ancora occupata (`node 27760 ... TCP *:hbci (LISTEN)`, worktree `voce-prova-live`).

## Decisioni

- I testi di E1-E9 stanno in `src/components/ask-copy.ts`: con l'E2E fermo, un test unitario sui testi esatti è l'unica prova che gira qui. Il file va tolto insieme al resto di Chiedi.
- E6 al singolare con 1 domanda rimasta ("ti resta 1 domanda di {mese}"), come la nota della quota del design.
- In E3 "Con Pro diventano 100 al mese" è ancora un numero scritto: passa a `PLAN_LIMITS` in S6.

## Cambio di scope ricevuto durante questa slice

Mario, testuale: "lascia stare le evals". S2 non si fa; S2 e AC 23-24 sono segnati in `05-build-plan.md` come rimandati per sua decisione, né fatti né falliti. `evals/questions.json` resta com'è.
