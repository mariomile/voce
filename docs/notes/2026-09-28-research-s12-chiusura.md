# Research, S12: chiusura

Ultimo passo della Research (piano: `docs/plans/2026-09-28-research.md`, slice S12 di `.builderos/initiatives/research/05-build-plan.md`). Criteri: 16 (resto), 61, 68, 69, 72, 73.

## Cosa è stato fatto

- **Seed riscritto per la demo** (AC 72): Fatturino ha tre Research. "Cosa dicono i clienti di Fatturino?" con i 55 feedback, i temi e due ipotesi con il loro verdetto (una confermata con 3 citazioni, una smentita con 2); "Come usano l'export in Excel i clienti Pro?" con 5 note di intervista, nessuna ipotesi, pronta per la prima analisi; "Perché chi prova Fatturino non passa a Pro?" con un'ipotesi e nessun feedback. Ogni feedback entra in Voce alle 9:00 del giorno in cui è arrivato, così "arrivati dopo" e "feedback nuovi" hanno senso. Verificato nel browser: elenco con i tre stati, Sintesi con i due verdetti e V1.
- **`docs/analytics.md`** (AC 68): `first_research_collected` e `research_synthesized` con momento d'invio e proprietà, `first_analysis_completed` riferito alla prima analisi dei temi in qualunque Research, il vincolo a cinque eventi, la query HogQL della metrica di fase 2.
- **Test di render in inglese** (AC 69, `src/test/english-render.test.tsx`): 11 pagine della Research rese col catalogo `en` senza nessuna frase del catalogo italiano; ogni pagina rifatta in italiano per provare che il controllo trova le frasi.
- **Due difetti delle slice prima:** dalla Raccolta senza sessione note ed eliminazione mostrano E-SESS invece di mandare a `/login` (S11), e il CSV senza sessione risponde con una nota invece di un errore non gestito; S6 non rimanda più a "Solo il verdetto" quando il pulsante non c'è (S9).
- **Documenti:** README (utenti di esempio, evals, eventi), `TECH.md` (proxy, migrazione non additiva, test della migrazione, seed letto dai test), `docs/prima-dei-clienti-reali.md` (ipotesi all'API Anthropic, registri svuotati all'eliminazione, migrazione da applicare insieme al codice), roadmap, piano.
- **Fase 5:** in `05-build-plan.md` output dei comandi, strumentazione, evals, controllo dello scope e tabella criterio per test riallineata ai nomi veri.

## Visti fallire prima del codice

- pgTAP: il test del seed di AC 72 (nessuna Research con 2 ipotesi e verdetti).
- vitest: i due test di `docs/analytics.md`; "previewCsv and importCsv return the session note…" (errore di permesso su `workspaces`); il test di S6 senza pulsante.
- E2E: "the Raccolta without a session…" (la nota non compariva, si finiva su `/login`).
- Il test in inglese è passato subito, perché le pagine usavano già i cataloghi: l'ho provato mettendo una frase italiana nel catalogo inglese, e fallisce su due pagine.

## Decisioni

- **La Raccolta entra tra le pagine le cui action rispondono `session`:** i controlli del link del modulo senza sessione mostrano il loro errore di oggi, senza dati.
- **S6 con una seconda frase** invece di mostrare "Solo il verdetto" fuori dalle condizioni di AC 45.
- **Test di lettura del seed riallineati:** `data.test.ts` e un test di `verdicts.test.sql` leggevano il seed com'era.
- **Un test E2E di S11 era instabile:** cercava il titolo per testo e trovava anche l'annunciatore di rotta di Next. Ora cerca l'h1.

## Cosa resta

- **Evals col modello vero** (AC 60 e 61): manca `ANTHROPIC_API_KEY`. Serve anche il run di partenza su `edac3cf`. Comandi in `05-build-plan.md`, "Eval results". Senza, il gate della fase 5 non passa.
- **Decisioni di Mario:** data della migrazione in produzione (insieme al codice, non prima del 2026-10-01), id del workspace della demo, `POSTHOG_KEY` in Production.
- Niente push, niente merge.
