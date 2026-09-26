# Eliminare un feedback, registrazioni chiuse

Per la demo in sala: togliere in pochi secondi una risposta inappropriata prima di mostrare i temi, e una pagina di registrazione chiara quando le registrazioni sono spente.

## Cosa è stato fatto

- **Elimina nella lista dei feedback.** Ogni riga ha "Elimina"; il primo clic chiede "Eliminare questo feedback?" con "Annulla" e "Sì, elimina". La server action `deleteFeedback` valida l'id, elimina come utente collegato e aggiorna tutte le pagine.
- **Migrazione `20260926090000_delete_feedback.sql`:** policy di delete limitata ai workspace dell'utente e `grant delete` su `feedback`. I collegamenti in `theme_feedback` hanno già `on delete cascade`: il feedback sparisce subito da temi, citazioni, conteggi e trend, senza una nuova analisi.
- **Temi vuoti nascosti.** Un tema che resta senza feedback non compare più tra i temi (`getDashboard`).
- **Registrazioni chiuse.** Se Supabase Auth risponde `signup_disabled` (registrazioni spente) o `email_provider_disabled` (email spenta), la registrazione mostra "Le registrazioni sono chiuse in questo momento." Accesso invariato.

## Decisioni

- Conferma in linea nella riga, non una finestra: niente componenti nuovi, e sul proiettore resta leggibile.
- Nessun conteggio salvato da correggere: i numeri dei temi vengono dalla vista `theme_stats`, calcolata sui collegamenti rimasti.
- Il numero di feedback analizzati nell'intestazione dei temi ("N feedback dal … al …") resta quello dell'analisi: è ciò che l'AI ha letto.
- Eliminare libera un posto nel limite Free di 100, coerente con "limite totale".

## Verifica

Typecheck e lint senza errori, 199 test passati (13 file), build riuscita. Nuovi test: `src/app/(app)/feedback/actions.test.ts` (due account), `src/app/(auth)/actions.test.ts`, due casi in `src/test/rls.test.ts`.
Supabase locale con `enable_signup = false`: `/auth/v1/signup` risponde `422 signup_disabled`; nel browser la registrazione mostra il messaggio e `fatturino@voce.test` entra. Eliminazione provata nel browser: da 55 a 54 feedback, testo sparito dalla pagina dei temi.

## Cosa resta

- Con le registrazioni chiuse, un nuovo utente che prova "Continua con Google" arriva al login con "Il link non è valido o è scaduto". Google oggi non è attivo.

## Correzioni dalla revisione della PR #3

- **Eliminazione durante un'analisi.** Prima l'analisi falliva quando un feedback che il modello aveva letto veniva eliminato prima del salvataggio. La migrazione `20260926120000_finish_analysis_skips_deleted_feedback.sql` fa saltare a `finish_analysis` i collegamenti ai feedback che non esistono più; il salvataggio resta in una sola transazione. Il blocco `for key share` sui feedback aspetta un'eliminazione in corso e poi salta la riga eliminata, invece di fallire sulla chiave esterna.
- **Pagina di un tema vuoto.** `getTheme` restituisce null quando il tema non ha più feedback, quindi la pagina risponde "pagina non trovata", come la dashboard che già lo nasconde.
- **Feedback già eliminato.** `deleteFeedback` risponde ok anche se non trova il feedback (due schede aperte): la lista si aggiorna. Un errore del database risponde "non eliminato" e finisce nei log con il solo codice. Con RLS un feedback di un altro workspace è indistinguibile da uno già eliminato: anche lì la risposta è ok e non si elimina nulla.
- **Regola di eliminazione verificata da sola.** Dalle API ogni eliminazione filtra per colonna, quindi vale anche la regola di lettura, che da sola nasconde i feedback degli altri workspace: il test in `rls.test.ts` passerebbe anche con una regola di eliminazione troppo larga. Nuovo test SQL `supabase/tests/feedback_delete_policy.test.sql` (pgTAP, `supabase test db`): un `delete` senza filtri, dove vale solo la regola di eliminazione. Provato: con la regola allargata a `true` il test fallisce. Aggiunto alla CI e al controllo rilascio.
