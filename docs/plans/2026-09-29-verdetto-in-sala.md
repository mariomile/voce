# Schermo della sala: il verdetto delle ipotesi

## Obiettivo

Alla masterclass PHC26 (1 ottobre 2026) la storia sul palco è: all'inizio Mario dice un'ipotesi ("quello che ti blocca di più è la parte tecnica"), la sala risponde dal QR, parte l'analisi e la sala vede la propria ipotesi confermata, smentita o da rivedere, con i numeri: "48 a favore · 12 contro · su 230 letti".

Oggi lo schermo della sala fa solo i temi e dice "Il verdetto delle ipotesi lo trovi nella Research." (spec della Research, fuori scope "Verdetto in sala": le citazioni del verdetto sono testo dei feedback). Questo passo porta il verdetto in sala **senza citazioni**: solo la parola del verdetto, i conteggi e il testo dell'ipotesi scritto dal PM. Il motivo del fuori scope resta rispettato: nessun testo dei feedback lascia il server per questa pagina.

## Scelte

- **La sala fa la stessa analisi della Sintesi.** "Analizza le risposte" chiama `synthesize(researchId)`: temi e, se la Research ha ipotesi, verdetto, le due chiamate che esistono già. Sparisce la modalità `"room"`, che azzerava le ipotesi e sarebbe identica a quella completa. Nessuna chiamata AI nuova, nessun limite cambiato: con ipotesi il clic usa 2 analisi (come "Analizza" nella Sintesi), con 1 sola analisi rimasta fa solo i temi (S4), senza ipotesi è identico a oggi.
- **Il verdetto si mostra solo se è di questo clic.** Se il verdetto non arriva (`failed`) o non parte per la quota (`limit`), la sala lo dice e non mostra il verdetto precedente (per esempio quello di una prova).
- **Il server manda solo ciò che lo schermo mostra.** Nuova azione `roomVerdicts(researchId)` accanto a `roomThemes`: legge le ipotesi come la Sintesi (`listHypotheses`, RLS dell'utente) e le riduce con una funzione pura (`roomVerdicts` in `src/lib/room.ts`) a `{ id, text, verdict, supporting, contradicting, feedbackRead }`. Mai motivazione, citazioni o testo dei feedback.
- **Stessa regola di parola della Sintesi.** Senza feedback collegati il verdetto si legge "Da rivedere" con "Nessuno dei N feedback letti ne parla.", come `VerdictWord` in `hypothesis-list.tsx`. Etichette e conteggi riusano `research.verdict.*`, così sala e Sintesi dicono le stesse parole.
- **Una terza vista nel secondo atto.** L'interruttore "Bolle / Elenco" diventa "Bolle / Elenco / Verdetto" quando la Research ha ipotesi. Dopo l'analisi si vedono le bolle come oggi; il relatore sceglie quando rivelare il verdetto. Nella vista Verdetto i pallini si nascondono come nell'Elenco.
- **Aspetto:** fondo carta, solo inchiostro (contrasto 7:1 della sala). Per ogni ipotesi una riga: a sinistra la parola con il segno (✓ Confermata, ✕ Smentita, ? Da rivedere) a scala da titolo, a destra il testo dell'ipotesi a scala di titolo di tema e sotto i conteggi. Nessun colore per il verdetto, come nella Sintesi.
- **Nel primo atto** la nota sotto il pulsante cambia: "Con i temi arriva anche il verdetto delle ipotesi."
- Rimovibile: una funzione pura, un'azione, un componente di vista, pochi testi. Togliendoli e rimettendo la modalità `"room"` si torna a oggi.

## Passi

1. **Riduzione pura** `roomVerdicts` in `src/lib/room.ts`, test prima in `src/lib/room.test.ts`: solo i campi dello schermo, ipotesi senza verdetto escluse, parola "da rivedere" senza collegamenti, ordine delle ipotesi.
2. **Azione `roomVerdicts`** in `src/app/research/[id]/sala/actions.ts`, test contro il Supabase locale in `actions.test.ts`: dopo un'analisi con verdetto manda parola e conteggi, mai citazioni o motivazione; vuoto per un id sbagliato e per un altro workspace.
3. **La sala fa anche il verdetto**: `synthesize` senza modalità `"room"`, `RoomScreen` chiama l'analisi completa e poi `roomThemes` e `roomVerdicts`; vista Verdetto, testi IT ed EN, DESIGN.md. Test: `synthesize.test.ts` e `analytics.test.ts` aggiornati (la modalità "room" non esiste più), `room-screen.test.tsx` (nota, vista Verdetto, stati `failed` e `limit`, contrasto), E2E `e2e/room.spec.ts` (verdetto con conteggi, nessun testo dei feedback, due analisi).
4. **Verifica**: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, E2E della sala in locale, screenshot a 1920x1080 e 853x480.
5. **Nota** in `docs/notes/2026-09-29-verdetto-in-sala.md`.
