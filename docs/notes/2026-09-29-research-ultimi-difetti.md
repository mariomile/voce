# Research: gli ultimi due difetti della revisione

**Cosa.** Chiusi i due difetti bassi lasciati aperti dalla revisione della fase 5, test prima.

1. **Verdetto salvato, rilettura fallita.** Se la rilettura dei verdetti appena salvati falliva (errore passeggero del database), l'analisi mostrava l'errore di rete e `research_synthesized` non partiva, anche se temi e verdetti erano salvati e contati. Ora il conteggio per l'annuncio viene dai verdetti controllati sul server, l'errore va nel log (solo l'id dell'analisi) e l'evento parte. Test: `synthesize.test.ts`, "a database error reading the saved verdicts back...".
2. **Note su una Research eliminata in un'altra scheda.** L'inserimento falliva sulla chiave esterna e l'azione lanciava un errore non gestito. Ora `addNotes` risponde `not_found` e il modulo mostra "Non trovo questa Research." con il link "Tutte le Research"; il testo scritto resta nel campo. Stessa risposta per una Research di un altro workspace (prima lanciava). Test: `collect/actions.test.ts` e `e2e/research.spec.ts`.

**Verifica.** typecheck e lint a 0; vitest 576 su 576 in 46 file; pgTAP 185 PASS; migration-test 12 PASS; build riuscita; E2E 64 su 64.

**Resta.** L'import CSV su una Research eliminata lancia ancora un errore non gestito: non era tra i due difetti.
