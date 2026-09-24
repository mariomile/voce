# Kit di design dalla direzione B

## Obiettivo

Trasformare la direzione B (Voci) in un kit riusabile: token e componenti base, documentati in `DESIGN.md`. Le schermate della B vengono ricostruite usando solo il kit, così il kit è verificato su casi reali prima di entrare nell'app.

## Passi

1. `design/kit.css`: token (colori, tipografia, spaziature, raggi, ombre) come variabili CSS, poi i componenti. Nomi in inglese.
2. `design/presentation.css`: solo la cornice di presentazione (tavola, didascalie, finto browser, finto telefono). Non è prodotto e non entra nell'app.
3. `design/kit.html`: catalogo di token e componenti, in tutti gli stati.
4. `design/b-voci.html`: ricostruita con le sole classi del kit, senza `<style>` e senza attributi `style`. Il modulo pubblico mostra anche una domanda scelta dal PM.
5. `DESIGN.md`: token, componenti, regole d'uso, corrispondenza con le variabili di shadcn/ui per quando nasce l'app.

## Verifica

- Uno script controlla che ogni classe usata in `b-voci.html` sia definita in `kit.css` o `presentation.css` (queste ultime solo per la cornice), e che il file non contenga `<style>` né `style=`.
- Screenshot di `b-voci.html` e `kit.html` nel browser, confrontati con la B originale.
- Revisione indipendente da un subagente.
