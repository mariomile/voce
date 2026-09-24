# Voce: brief di prodotto

Questo è il contesto strategico del prodotto. Non è una specifica completa: le scelte di dettaglio si prendono costruendo, mostrando il prodotto e ascoltando chi lo usa.

## Il problema

Un product manager riceve feedback dai clienti da molti canali: ticket di supporto, call di vendita, sondaggi NPS, recensioni, messaggi su Slack. I feedback finiscono in fogli di calcolo e thread diversi. Leggerli tutti richiede ore, gli schemi ricorrenti sfuggono e la roadmap finisce per seguire il cliente che si lamenta più forte, non il problema più frequente.

## Per chi

Product manager di startup e scaleup (team di prodotto da 1 a 10 persone), in Italia, che raccolgono feedback senza uno strumento dedicato.

## Il job

Quando accumulo feedback da canali diversi, voglio vedere in pochi minuti quali problemi e opportunità emergono più spesso, con le parole dei clienti, per decidere cosa mettere in roadmap e spiegarlo al team.

## Cosa fa Voce

1. **Raccoglie** i feedback in un unico posto:
   - inserimento manuale (incolla un testo);
   - importazione da file CSV;
   - un link pubblico con un modulo, da condividere con i clienti (anche come QR code). Chi risponde non ha bisogno di un account.
2. **Analizza** i feedback con l'AI: li raggruppa in temi (problemi, opportunità, apprezzamenti), con un titolo, una sintesi, il numero di feedback collegati e le citazioni più rappresentative.
3. **Aiuta a decidere**: il PM assegna a ogni tema una priorità (alta, media, bassa) e uno stato (da valutare, in roadmap, fatto, scartato). I temi si ordinano per numero di feedback.

## Piani

| | Free | Pro |
|---|---|---|
| Prezzo | 0 € | 19 € al mese |
| Feedback | fino a 100 | illimitati |
| Analisi AI | 3 al mese | 100 al mese |

Il pagamento avviene con Stripe. Il piano di un workspace si legge dai dati di fatturazione aggiornati da Stripe, mai da un valore che l'utente può modificare.

## Chi può fare cosa

| Chi | Cosa può fare |
|---|---|
| Visitatore anonimo | Inviare un feedback tramite il link pubblico di un workspace. Non può leggere nulla. |
| Utente registrato | Ha un proprio workspace, creato alla registrazione. Legge e gestisce solo i dati del proprio workspace. |
| Owner del workspace | Tutto quanto sopra, più la gestione dell'abbonamento. |

Nessun utente può vedere o modificare i dati di un altro workspace, nemmeno chiamando direttamente le API.

## Fuori scope per ora

- Inviti e team con più membri (il modello dati deve permetterli in futuro).
- Integrazioni dirette con Intercom, Zendesk, Slack.
- Notifiche email, app mobile, SSO aziendale.
- Prompt dell'AI personalizzabili dall'utente.

## Vincoli

- Interfaccia in italiano.
- Dati in Unione Europea. Il modulo pubblico non chiede dati personali obbligatori.
- Chiavi e segreti solo lato server, mai nel browser e mai nel repository.
- Ogni tabella del database ha regole di accesso (Row Level Security) prima di contenere dati.
- Il testo dei feedback non finisce negli strumenti di analytics.
- I costi dell'AI hanno un tetto per piano. Il testo dei feedback è un input non fidato: può contenere istruzioni che l'AI deve ignorare.

## Come sappiamo che funziona

- Attivazione: quota di nuovi workspace che eseguono la prima analisi AI entro 24 ore dalla registrazione.
- Qualità: i temi proposti dall'AI sono riconoscibili e utili per chi conosce i feedback. Questo va misurato con valutazioni dedicate (evals), non a sensazione.

## Decisioni

Scelte di dettaglio prese il 2026-09-25. Dove precisano il resto del brief, valgono queste.

### Analisi AI

1. **Ogni analisi riparte da zero.** Usa tutti i feedback degli ultimi 90 giorni (massimo 500) e produce un nuovo insieme di temi. Priorità e stato passano in automatico ai nuovi temi con lo stesso titolo: per questo l'AI riceve i titoli dei temi esistenti e li riusa quando il tema è lo stesso.
2. **Un feedback può stare in più temi, massimo 3.** In questa versione il PM non modifica i temi a mano: imposta priorità e stato, e può scartarli.
3. **Modello:** Claude tramite Vercel AI Gateway. Il modello si legge da una variabile d'ambiente, con default `anthropic/claude-sonnet-5`. L'elaborazione in UE non è garantita: è tra le cose da risolvere prima dei clienti reali (`docs/prima-dei-clienti-reali.md`).
4. **Evals** in `evals/`: un set sintetico di 60 feedback su un prodotto finto, con i temi attesi scritti a mano. Per ora bastano controlli automatici: ogni tema ha almeno 2 feedback esistenti collegati e le citazioni compaiono davvero nei feedback. La valutazione della qualità si approfondisce dopo.

### Piani e limiti

5. **Il limite Free di 100 feedback è totale, non mensile.** Il feedback numero 101 inviato dal modulo pubblico viene rifiutato con un messaggio gentile; il PM vede un avviso per passare a Pro.
6. **Se un workspace torna Free**, i dati restano tutti leggibili, ma non entrano nuovi feedback oltre i 100 e le analisi tornano a 3 al mese.

### Raccolta dei feedback

7. **Modulo pubblico:** testo obbligatorio, email facoltativa. Testo massimo 2.000 caratteri. Limiti: 10 invii al minuto per IP, 300 all'ora per workspace. Un campo nascosto anti-bot, niente captcha per ora.
8. **Link pubblico:** il PM può disattivarlo e generarne uno nuovo.
9. **CSV:** colonna `testo` obbligatoria, colonne facoltative `canale`, `cliente`, `data`. Massimo 1 MB e 2.000 righe. I duplicati esatti nello stesso workspace vengono ignorati.
10. **Canale di origine:** si salva per ogni feedback e si può filtrare.

### Workspace e utenti

11. **Oggi owner e utente coincidono.** Il modello dati prepara solo i team futuri.

### Fuori scope in modalità test

12. **Legale e fiscale** restano fuori scope finché siamo in modalità test. Si tiene traccia di cosa manca in `docs/prima-dei-clienti-reali.md`.
13. **Eventi di analytics:** si definiscono nel passo dedicato agli analytics.
