# Chiedi: correzione dei 5 difetti della revisione di fase 5

Segue `.builderos/initiatives/chiedi-ai-feedback/05-build-plan.md` ("Revisione", R1-R5) e `docs/notes/2026-09-27-chiedi-s9-chiusura.md`. Gate 5 era **FAILED**: due E2E rosse (R1, R2) e tre difetti trovati dal revisore senza test (R3, R4, R5). Corretti tutti e cinque, con test-first per ciascuno.

## R1 (AC 37, E4): il piano letto all'apertura della pagina

`src/app/(app)/ask/actions.ts`: quando `start_question` restituisce `limit`, la action ora rilegge quota e piano dal server (`getUsage`) prima di rispondere, invece di lasciare che la pagina usi il `plan` e la `quota` letti all'apertura. `src/components/ask-form.tsx`: nuovo stato `currentPlan`, aggiornato insieme a `usage` quando il motivo è `limit`; l'avviso E3/E4 e la sua notifica nella regione di stato (R4) usano questo stato, non le prop iniziali.

Test: `ask/actions.test.ts`, due casi in "ask: guards before the model" (quota Free invariata, e piano portato a Pro dopo l'apertura). Rosso prima della correzione (`{ok:false, reason:"limit"}` senza `usage`/`plan`), verde dopo. E2E: `e2e/ask.spec.ts` "E4: Pro quota used up from another tab" era rosso 5/5 in revisione, ora verde.

## R2 (AC 36): il test "due invii ravvicinati" era scritto male

Il finto gateway rispondeva in ~54 ms: il terzo evento del vecchio test (un clic sul pulsante) arrivava dopo che la prima risposta era già tornata, quindi produceva una seconda domanda legittima, non un doppio invio. Riscritto in `e2e/ask.spec.ts` ("two quick submits make one model call") con il marcatore `LENTA` del finto gateway (risposta dopo 20 secondi reali): due `Enter` ravvicinati mentre la prima domanda è ancora in corso, poi verifica sul finto gateway stesso, non sulla rete del browser.

`e2e/fake-gateway.mts` ora tiene un elenco dei prompt ricevuti ed espone `GET /calls?marker=X`: conta quanti prompt contengono `X`. Porta letta da `FAKE_GATEWAY_PORT` (default 4010), stessa variabile in `e2e/ask.spec.ts`, così una copia della configurazione di Playwright su un'altra porta continua a funzionare.

## R3: il proxy dava 500 invece di reindirizzare

`src/proxy.ts:35`: l'eccezione per la server action `ask` senza sessione ora richiede `request.method === "POST"`. Prima, una `GET /ask` senza sessione con un header `next-action` forzato saltava il redirect e arrivava alla pagina, che falliva con `42501` (permesso negato su `workspaces` per `anon`) invece di andare a `/login`.

Test nuovo in `e2e/ask.spec.ts`: "GET /ask with a forged next-action header still redirects to /login". Verificato rosso (500) col codice precedente (`git stash` temporaneo solo su `src/proxy.ts`, poi ripristinato), verde dopo la correzione.

Spec aggiornata (`04-spec.md`): riga sull'eccezione POST in "In scope" voce 1, e `src/components/ask-copy.ts` più l'eccezione del proxy aggiunti all'elenco "Rimozione", come chiesto dal revisore.

## R4: l'avviso di quota esaurita non veniva annunciato

`src/components/ask-form.tsx`: `FailureNote` aveva un `default: return null` per il motivo `limit`. Ora un caso dedicato ripete lì il testo dell'avviso (`notice.title` e `notice.text`, la stessa card mostrata sopra la casella), così la regione `role="status"` non resta muta per chi usa un lettore di schermo.

Test: `e2e/ask.spec.ts`, aggiunta un'asserzione su `status(page)` alle due prove E3 ed E4 esistenti, col testo esatto atteso nella regione.

## R5: una lettura della quota fallita trasformava una risposta in "non arrivata"

`src/app/(app)/ask/actions.ts`: `questionUsage(workspace.id)`, chiamata dopo che `finish_question` ha già chiuso la domanda, ora ha il proprio `.catch(() => null)` invece di lasciar propagare l'errore al blocco che tratta un fallimento del modello. Se la lettura fallisce, la action restituisce comunque `outcome: "answered"` (o `no_evidence`) con `usage: null`; la pagina mostra la risposta e omette solo la nota della quota (`ask-form.tsx`: lo stato `usage` diventa `AskUsage | null`, la nota sotto il pulsante non compare se `usage` è `null`).

Test: `ask/actions.test.ts`, "shows the answer even if the quota cannot be read after the question is closed" (mock di `questionUsage` che rifiuta una volta sola). Rosso prima (la action tornava `{ok:false, reason:"failed"}`), verde dopo.

## Verifica

```
supabase db reset     Applying migration 20260927120000_questions.sql... Finished. exit 0
supabase test db      Files=2, Tests=52, Result: PASS. exit 0
pnpm typecheck        exit 0
pnpm lint             exit 0
pnpm test             Test Files  22 passed (22)   Tests  269 passed (269)
pnpm build            ✓ Compiled successfully, ƒ /ask
```

E2E, porta 3001 (la 3000 resta di `voce-prova-live`, PID non toccato), con `playwright.review-3001.config.ts` temporaneo (copia di `playwright.config.ts`: `baseURL` e i due `webServer` su 3001, finto gateway su 4011 invece di 4010), cancellato subito dopo la corsa:

```
$ FAKE_GATEWAY_PORT=4011 pnpm exec playwright test --config playwright.review-3001.config.ts
  23 passed (1.1m)
```

23 su 23, incluso `main-flow.spec.ts`. Il link di conferma email dei due test che si registrano (`main-flow.spec.ts`, `ask.spec.ts` "ask a question…") punta ancora al `site_url` sulla 3000: come nella revisione precedente, la conferma è servita dal dev server dell'altro worktree (stesso database locale, i cookie di `localhost` valgono su entrambe le porte); non è una prova di `/auth/confirm` di questo branch.

Non eseguiti: `pnpm evals` (rimandato per decisione di Mario, `evals/questions.eval.ts` non esiste, invariato rispetto alla revisione). Nessun gate 5 rieseguito, nessuna deroga scritta: non richiesti per questo passo.

## Criteri interessati

- **AC 36**: ora provato correttamente ("two quick submits make one model call" verde per il motivo giusto).
- **AC 37**: E4 ora verde; aggiunta la copertura di accessibilità (R4) sulle stesse prove E3/E4.

Vedi tabella aggiornata in `05-build-plan.md`, "Acceptance criteria to tests".
