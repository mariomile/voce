---
name: controllo-rilascio
description: Controllo pre-rilascio di Voce. Esegue typecheck, lint, test, test del database (migrazioni da zero e RLS), build, ricerca di segreti nel codice, migrazioni non applicate e variabili d'ambiente mancanti rispetto a .env.example, poi restituisce una tabella con l'esito di ogni voce e un verdetto finale (si può rilasciare: sì o no, e perché). Usala ogni volta che Mario chiede se si può rilasciare, fare il deploy, andare in produzione, o chiede un controllo pre-rilascio o "è tutto a posto per il rilascio?", anche se non nomina la skill.
---

# Controllo rilascio

Risponde a una sola domanda: **questo commit si può rilasciare in produzione?** La risposta deve poggiare su output reali, mai su "dovrebbe funzionare".

## Esegui

```bash
bash .claude/skills/controllo-rilascio/scripts/controllo.sh
```

Lo script dura qualche minuto (build e reset del database): lancialo con un timeout di 10 minuti. Esegue otto controlli e stampa una riga per ciascuno:

```
RISULTATO|<controllo>|<OK|FALLITO|NON VERIFICABILE>|<dettaglio>
```

L'output completo di ogni controllo sta in `LOG_DIR` (prima riga dell'output). Per ogni voce non OK, apri il log e trova la causa concreta: il file e la riga dell'errore, il test che fallisce, la variabile che manca. È questa la parte utile del report.

Cosa fa ogni controllo, per poterlo spiegare:

| Controllo | Comando | Note |
|---|---|---|
| test-database | `supabase db reset` + `src/test/rls.test.ts` | Migrazioni applicate da zero in locale e test di accesso RLS. Richiede Supabase locale avviato. Cancella i dati locali e ricarica il seed. |
| typecheck | `pnpm typecheck` | |
| lint | `pnpm lint` | |
| test | `vitest run` escluso il file RLS | Legge dal seed locale, quindi dipende dal reset. |
| build | `pnpm build` | |
| segreti | `gitleaks` su storia git e modifiche non committate, più nessun file `.env*` tracciato | Output redatto. |
| migrazioni | `supabase migration list` locale e sul progetto collegato | Senza progetto remoto collegato non si sa cosa c'è in produzione. |
| variabili-ambiente | nomi in `.env.example` contro `vercel env ls production`; variabili usate nel codice ma assenti da `.env.example` | Solo nomi, mai valori. |

## Regole

- **Non stampare mai valori di segreti**, nemmeno se compaiono in un log: citali per nome.
- **Non correggere nulla durante il controllo.** Il controllo fotografa lo stato del commit. Le correzioni vanno proposte dopo il verdetto, e fatte solo se Mario lo chiede.
- **NON VERIFICABILE conta come bloccante.** Un controllo che non si è potuto fare non dà garanzie: rilasciare lo stesso è una scelta di Mario, non tua.
- Non avviare Supabase o Docker da solo se sono spenti: segnala il controllo come non verificabile e scrivi come sbloccarlo.

## Report

Rispondi in italiano con questo formato:

```markdown
## Controllo rilascio: <hash breve del commit> (<branch>)

| Controllo | Esito | Dettaglio |
|---|---|---|
| Typecheck | ✅ | 0 errori |
| Lint | ✅ | 0 errori |
| Test | ✅ | 78 passati, 0 falliti |
| Test del database | ✅ | migrazioni da zero ok, 43 test RLS passati |
| Build | ✅ | riuscita |
| Segreti nel codice | ✅ | nessuno trovato |
| Migrazioni non applicate | ⚠️ | non verificabile: nessun progetto remoto collegato |
| Variabili d'ambiente | ❌ | mancano su Vercel production: STRIPE_SECRET_KEY, … |

**Si può rilasciare: NO.** <una o due frasi: quali voci bloccano e perché contano per il rilascio>

**Per sbloccare:**
- <un'azione concreta per ogni voce bloccante, nell'ordine in cui conviene farle>
```

Legenda esiti: ✅ OK, ❌ FALLITO, ⚠️ NON VERIFICABILE. Nel dettaglio metti numeri veri presi dai log (test passati e falliti, errori, nomi delle variabili), non il testo grezzo dello script.

Il verdetto è **SÌ** solo se tutte e otto le voci sono ✅. Altrimenti **NO**. Nessuna via di mezzo: se Mario vuole rilasciare lo stesso, lo decide lui leggendo il perché.
