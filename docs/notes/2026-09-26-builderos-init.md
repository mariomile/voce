# BuilderOS: memoria del progetto e prima iniziativa

**Cosa è stato fatto.** `bos-init` su Voce per l'iniziativa "Chiedi ai tuoi feedback": `PRODUCT.md`, `TECH.md`, `.builderos/ROADMAP.md`, due file di evidenza, il blocco BuilderOS in `AGENTS.md`, `.builderos/local.json` ignorato da git.

**Prompt di partenza.**

```
/bos-init "Chiedi ai tuoi feedback": il PM fa una domanda in linguaggio naturale sui feedback raccolti in Voce e riceve una risposta con le citazioni. --initiative chiedi-ai-feedback
```

L'intervista è stata un solo round di 8 domande, ognuna con una risposta consigliata presa da `BRIEF.md` e `AGENTS.md`. Risposta di Mario: "ok".

**Decisioni.**
- Stadio pre-PMF, modalità lite, `.builderos/` nel repository pubblico.
- Problema, cliente tipo e costo del problema restano `[assumption:unvalidated]`: vengono dal brief, non da utenti.

**Controllo di copertura (gate C).** Proposta come `feature`, rifiutata su C.3: "no primary-source tag on: The Problem, Who has it, What that costs them". Il controllo di copertura non si può forzare. L'iniziativa diventa `product` e parte dalla fase 0 Frame.

**Cosa resta.** Fase 0: problema, cliente tipo, perché adesso e l'assunzione più rischiosa della nuova funzione.
