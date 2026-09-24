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
