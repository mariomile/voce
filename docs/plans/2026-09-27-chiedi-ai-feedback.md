# Chiedi ai tuoi feedback

## Obiettivo

Una scheda "Chiedi" dove il PM scrive una domanda sui feedback degli ultimi 90 giorni e legge una risposta breve, il numero di feedback che ne parlano (contato dal server) e fino a 5 citazioni verificate carattere per carattere. Senza citazioni verificate la risposta è "Non trovo feedback che ne parlano". Una domanda, una risposta: niente conversazione, niente cronologia. Quota separata dalle analisi: Free 10, Pro 100 domande al mese, contata su ogni domanda che parte. Pronta e verificata entro il 30 settembre 2026, per la demo del 1 ottobre.

Il cosa è in `.builderos/initiatives/chiedi-ai-feedback/04-spec.md` (40 criteri numerati) e in `.builderos/initiatives/chiedi-ai-feedback/DESIGN.md` (testi, stati, componenti). L'ordine di lavoro, le dipendenze tra i passi, la baseline dei test e la tabella criterio per test sono in `.builderos/initiatives/chiedi-ai-feedback/05-build-plan.md`: questo file non li ripete.

## Decisioni

Tutte prese nella spec, qui solo quelle che guidano il codice:

- **Tutto rimovibile in un commit.** Una scheda, una rotta `/ask`, un file di logica `src/lib/questions.ts`, una migrazione. Niente di Chiedi entra nel codice dell'analisi o dei temi: si importano `analysisModel()`, `estimateCost` e i componenti del kit, non si modificano.
- **Tabelle leggibili solo dal server.** `questions` (numeri e stati, senza testo) e `question_runs` (registro con prompt e output): RLS attiva nella stessa migrazione, nessuna policy, nessun permesso a `anon` e `authenticated`. Quattro funzioni `security definer` solo per `service_role`: `start_question`, `finish_question`, `fail_question`, `question_usage`.
- **Prompt fisso**, domanda e feedback come JSON dentro `<question_data>` e `<feedback_data>` con `<` codificato. Stesso modello dell'analisi, massimo 1.500 token in uscita, timeout 60 secondi, `maxDuration` della pagina 90.
- **Il conteggio lo fa il server**, le citazioni si controllano due volte: nel codice come `checkOutput` e nel database con `strpos`.
- **Evento `question_answered`** ripetibile, con sole `citation_count` e `outcome`, tramite una `trackEvent` che condivide il corpo della richiesta con `trackMilestone` e non passa da `analytics_milestones`.

## Passi

Uno per slice di `05-build-plan.md`. Ogni passo lascia l'app funzionante, finisce con una nota in `docs/notes/` e un commit verificato.

1. **S1, proiettile tracciante:** migrazione, `questions.ts`, action `ask`, pagina `/ask` essenziale, scheda e proxy, evento, finto gateway esteso, E2E da tastiera. Prima di toccare `e2e/`, baseline di `pnpm test:e2e` a porta 3000 libera.
2. **S2, evals:** `evals/questions.eval.ts` e primo run col modello vero. Serve una credenziale del Gateway valida in `.env.local` (vedi i prerequisiti in `05-build-plan.md`).
3. **S3, regole del database:** `supabase/tests/questions.test.sql`.
4. **S4, guardie e fallimenti:** motivi della action, controlli dell'output, finestra dei feedback, log senza testo, `getUsage`, messaggi E1-E9.
5. **S6, quota a vista:** nota della quota, avviso di quota finita, righe dei piani in `/billing` e landing, riga in `docs/prima-dei-clienti-reali.md`.
6. **S5, evento e riservatezza:** test sul corpo verso PostHog, `docs/analytics.md`.
7. **S7, nessun feedback:** stati vuoti A e B.
8. **S8, attesa, testo sicuro e kit:** stato d'attesa, messaggio dei 15 secondi, variante `ask` di `Textarea`, `<cite>` in `ink-muted`, `DESIGN.md` e `design/kit.*`.
9. **S9, chiusura:** tutti i comandi da zero, controllo del diff contro il fuori scope, revisione indipendente, nota finale.

## Verifica

Per ogni passo i test dei criteri che quel passo possiede, visti fallire prima del codice e passare dopo (tabella in `05-build-plan.md`). Alla fine, con output riportato:

```bash
supabase db reset
supabase test db
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm evals        # analysis.eval.ts e questions.eval.ts, col modello vero
pnpm test:e2e
```

- Evals: almeno 17 casi su 20, tutti i must-pass (q11, q12, q13, q14, q15, q16, q20), G1 a 0 violazioni; risultato in `evals/results/`.
- Browser: `/ask` a mano da tastiera, con risposta, senza prove, quota finita e nessun feedback; `/themes` e `/themes/[id]` per il nuovo colore di `<cite>`.
- Diff letto contro le 18 voci fuori scope della spec.
