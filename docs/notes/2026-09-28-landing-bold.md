# Landing più decisa, testo e grafica

## Cosa è stato fatto

La landing è stata riscritta per la sala di PHC26 del 1 ottobre: circa 230 PM la vedono da un proiettore e dal telefono. Deve dire cosa fa Voce in pochi secondi e non sembrare un modello di SaaS.

- Titolo: "Chi si lamenta più forte non decide la roadmap." a 96 px, con "non decide la roadmap" evidenziato. È il problema del brief (la roadmap segue il cliente più rumoroso) detto come lo direbbe un PM.
- L'idea della pagina è l'evidenziatore del sistema: cinque clienti scrivono lo stesso problema con parole diverse, ognuno ha la sua frase evidenziata, e Voce li conta in un tema ("58 feedback"). L'esempio dice che i feedback sono inventati.
- I tre passi diventano tre verbi a tutta scala (Raccogli, Analizza, Decidi), senza numeri: la sequenza la dice già l'ordine.
- Nuova sezione Chiedi su fascia inchiostro, l'unica scura della pagina: domanda, conteggio in giallo, risposta e due citazioni.
- Prezzi: il titolo dice il fatto ("Gratis fino a 100 feedback."), prezzi a 96 px. Righe dei piani invariate e lette da `PLAN_LIMITS`.
- Chiusura con il trigger dell'ICP: "Porta i temi alla prossima riunione di roadmap."
- La pagina ora è responsive: prima a 390 px il layout a due colonne usciva dallo schermo.

## Decisioni

- Nessun font, colore o dipendenza nuova. Aggiunte solo tre taglie da display (`--text-7xl` 64, `--text-8xl` 80, `--text-9xl` 96) e `--tracking-display`, solo per la landing, documentate in `DESIGN.md` e in `design/kit.css`. Tetto a 96 px.
- Un solo movimento: l'evidenziatore passa sul titolo al caricamento, spento con `prefers-reduced-motion`. Il testo è sempre visibile.
- Niente numeri, loghi o testimonianze inventate. "Non serve una carta" viene dalla pagina di registrazione, che lo dice già.
- Il test `src/test/plan-pages.test.tsx` e l'e2e "billing and landing show the question quota" cercano le righe delle domande: sono rimaste identiche, nessun test cambiato.

## Verifica

`pnpm typecheck` e `pnpm lint` puliti. Unit test senza Supabase: 93 passati, 10 file saltano perché serve Supabase locale (Docker non parte), come su main. `pnpm build` riuscito, `/` resta statica. Screenshot prima e dopo in `/tmp/voce-landing/` a 1440x900, 1280x720 al 150% e 390x844.

## Cosa resta

- Le e2e girano solo in CI.
