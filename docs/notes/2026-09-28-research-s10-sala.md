# Research, S10: la sala della Research

Decimo passo della Research (piano: `docs/plans/2026-09-28-research.md`, slice S10 di `.builderos/initiatives/research/05-build-plan.md`). Criteri, interi o in parte: 52, 53, 54 (resto: il pulsante della sala), 63 (parte: la sala), 64 (parte: `hypothesis_count` 0 dalla sala), più il contrasto 7:1 di DESIGN.md per ciò che si legge dalla sala.

## Cosa è stato fatto

- **`synthesize(researchId, "room")`**: "Analizza le risposte" fa solo i temi, 1 analisi, anche quando la Research ha ipotesi. Il server tratta la Research come senza ipotesi: una riga `themes`, una chiamata, verdetto `skipped`, `hypothesis_count` 0 in `research_synthesized`. A quota finita il database risponde `limit` e il modello non viene chiamato.
- **Schermo della sala** (`room-screen.tsx`): sotto il pulsante, con ipotesi, "Il verdetto delle ipotesi lo trovi nella Research." (`room.hypothesesNote`). Il pulsante usa `aria-disabled` e non `disabled`, anche durante l'analisi e a quota finita, con la nota del piano: il focus resta sul pulsante e un Invio da tastiera non avvia nulla. Quando `/sala/status` risponde 404 (Research eliminata a schermo aperto) lo schermo smette di chiedere e mostra R1 al posto del QR, nel riquadro inchiostro del modulo spento, con "Torna alle Research" verso `/research`.
- **Pagina della sala**: conta le ipotesi con `countHypotheses` (solo il numero), mai verdetti né collegamenti.
- **Contrasto 7:1**: via `ink-muted` dalla sala (riassunto dei temi, "Altro", "Esci dallo schermo" sui temi, interruttore Bolle/Elenco), errore sul giallo in `ink` al posto di `problem` (4,7:1), parola del tipo di tema in `ink` con il pallino del suo colore. Coppie usate: `ink` su `highlight` 12,7:1, `on-highlight` su `highlight` 7,6:1, `ink` su `paper` 16,1:1, `paper` e `highlight` su `ink` 16,1:1 e 12,7:1.
- **Cataloghi** IT ed EN: `room.hypothesesNote`, `room.deleted.*` (R1), `room.pile.noOpenThemes` che rimanda alla Research.

## Visti fallire prima del codice

- vitest: "room mode reserves only themes with hypotheses" (`synthesize.test.ts`), "the room with hypotheses: … hypothesis_count 0" (`analytics.test.ts`), 3 su 5 in `room-screen.test.tsx` (pulsante `aria-disabled`, nota delle ipotesi, colori sotto 7:1).
- E2E `room.spec.ts` sul componente di prima (`git show HEAD:` al posto dei file nuovi, poi rimessi): 3 rossi (solo temi con la nota, R1, pulsante spento a quota finita).
- Passati subito, perché il comportamento c'era già: "room mode with the analyses used up: limit…" (quota nel database) e il conteggio delle sole risposte del modulo della Research (fatto in S1), ora con una risposta di un'altra Research dello stesso workspace nel test.

## Decisioni

- **La modalità "room" azzera le ipotesi sul server**, non dal browser: la sala non può chiedere il verdetto nemmeno con una richiesta forzata.
- **Dopo il 404 lo schermo smette di interrogare**: una Research eliminata non torna.
- **Il pulsante resta attivo accanto a R1**: se qualcuno lo preme riceve "Non trovo questa Research.", il testo di `not_found` di oggi.

## Cosa resta

- S11 (elenco completo, modifica ed eliminazione), S12.
- "Esci dallo schermo" su una Research eliminata porta alla pagina NF della sua Raccolta.
