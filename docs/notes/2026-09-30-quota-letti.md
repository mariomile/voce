# Chiedi: la quota dei feedback letti accanto al conteggio

Sotto il numero grande della risposta, la riga "su N letti" diventa "P% dei N letti" (EN: "P% of N read"). La quota si calcola dai dati già nella risposta (`feedbackCount`, `feedbackConsidered`) con `sharePercent` in `src/components/ask-format.ts`: percentuale intera, "<1%" se è sopra 0 e sotto 1%, nessuna riga se il conteggio è 0.

## Decisioni

- La chiave `answer.of` è sostituita da `answer.share` in it e en, senza tenere la vecchia.
- Il testo di "Copia" non cambia: dice ancora "su N letti".
- Screenshot locale: `/tmp/voce-planb/chiedi-share-it.png`.

## Cosa resta

Niente. Piano B per la demo dal vivo: il prompt per il palco è nella descrizione della PR.
