# Direzioni visive per dashboard e modulo pubblico

## Cosa è stato fatto

Due direzioni visive come HTML statici in `design/`, con dati finti di un prodotto inventato (Fatturino, fatturazione elettronica per freelance):

- `design/a-registro.html`: la classifica dei temi come istogramma, priorità e stato modificabili sulla riga, citazioni nel pannello laterale.
- `design/b-voci.html`: ogni tema si legge con le citazioni dei clienti, la frase chiave evidenziata, andamento a 13 settimane accanto al numero.

Ogni file contiene: dashboard piena, stato vuoto senza feedback, stato vuoto con feedback ma senza analisi, modulo pubblico su telefono in quattro stati (vuoto, in scrittura, inviato, non disponibile).

## Decisioni

- Il secondo stato vuoto (feedback presenti, nessuna analisi) è disegnato apposta perché è il punto della metrica di attivazione.
- Il modulo "non disponibile" non dice al visitatore che il workspace ha finito la quota Free: è un'informazione interna.
- I font arrivano da Google Fonts: per vedere i file serve la connessione.

## Cosa resta

Scelta della direzione da parte di Mario.
