# BuilderOS fase 4: Shape

**Prompt:** `/bos-shape` (delega di Mario). Due agenti in parallelo: `spec-writer` scrive `04-spec.md`, `ux-architect` scrive `DESIGN.md`.

**Risultato.** Pagina nuova `/ask`, scheda "Chiedi" tra Temi e Feedback. 40 criteri di accettazione, 18 voci fuori ambito, 5 flussi con stati di errore e vuoto (errori E1-E9 con testo vero). Due tabelle nuove (`questions`, `question_runs`) con RLS nella stessa migrazione, leggibili solo dal server. Evento ripetibile `question_answered` con solo `citation_count` e `outcome`. Evals: `evals/questions.json`, 20 casi (10 rappresentativi, 10 avversari), soglia 85%, zero citazioni inventate.

**Gate 4.** Tutte le condizioni passate senza deroga. 4.1 e 4.4 giudicate dal modello e confermate da due revisori separati.

**Allineamento.** Il testo del perimetro in `DESIGN.md` è stato corretto in "La risposta non resta su questa pagina: se ti serve, copiala.", perché il registro lato server salva domanda e risposta.

**Per Mario entro il 1 ottobre:** id del workspace della demo da escludere dalla metrica; `POSTHOG_KEY` in produzione; mettere il workspace della demo su Pro, altrimenti le prove consumano le 10 domande Free.
