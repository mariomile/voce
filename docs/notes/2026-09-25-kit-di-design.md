# Kit di design dalla direzione B

## Cosa è stato fatto

- Scelta la direzione B. Nel brief (decisione 8): la domanda del modulo pubblico la sceglie il PM, con default "Cosa vuoi dire al team di …?".
- `design/kit.css`: token (colori, tipografia, spaziature, raggi, ombre) e componenti (pulsanti, filtri, campi, select, card, badge, tabella, stato vuoto, citazione evidenziata), più i pezzi di schermata della B (barra dell'app, pagina, tema, modulo pubblico).
- `design/kit.html`: catalogo di token e componenti con i loro stati.
- `design/b-voci.html`: ricostruita con le sole classi del kit. Nessun `<style>`, nessun attributo `style`. La cornice di presentazione sta in `design/presentation.css`.
- `DESIGN.md`: token, componenti, regole d'uso, corrispondenza con le variabili di shadcn/ui.

## Decisioni

- **Nomi in inglese** (`--color-ink`, `.btn-secondary`): la B usava nomi italiani (`--inchiostro`, `--velo`), ma il codice va in inglese.
- **Valori consolidati.** La B aveva molte misure fuori scala (14, 22, 26, 36, 44 px) e sei grigi diversi per il testo. Ora una scala a base 4, 11 taglie di testo, tre grigi di testo. Le schermate cambiano di pochi pixel, non di aspetto.
- **Select nativa** per priorità e stato, con tono legato al valore: "In roadmap" in inchiostro, "Fatto" in verde. Più vicina a quello che sarà in shadcn/ui.
- **Campi in due forme:** con fondo velo nell'app, a riga nel modulo pubblico. La B aveva solo la seconda, ma l'app ne avrà bisogno (per esempio per scrivere la domanda del modulo).
- **Tabella e ombre** non comparivano nella B: sono nel kit e nel catalogo, non nelle schermate.
- **Modulo pubblico:** il secondo telefono mostra una domanda scelta dal PM, più lunga del default, per verificare che vada a capo bene.

## Verifica

- Controllo automatico (script eseguito a mano, non nel repo): ogni classe usata in `b-voci.html` è definita in `kit.css` o, per la sola cornice, in `presentation.css`; zero `<style>` e zero `style=` nel markup.
- Screenshot con Playwright di B originale e ricostruita, sezione per sezione: dashboard e stati vuoti quasi identici; nel modulo pubblico corretti due problemi trovati così (telefono che sforava in altezza, sfondo giallo mancante nello stato "Inviato"). Zero errori in console su `b-voci.html` e `kit.html`.
- Revisione indipendente (subagente): nessuna regressione visiva. Corretti: contrasto di "Da impostare" nella select, focus del modulo pubblico, colori di hover e interlinee fuori dai token, regole di DESIGN.md non allineate al CSS.
- Nessun em dash nei file toccati.
- `pnpm typecheck/lint/test/build` non applicabili: l'app non esiste ancora.

## Cosa resta

- La lunghezza massima della domanda scelta dal PM non è decisa: servirà per la validazione lato server.
- `design/a-registro.html` resta come riferimento della direzione scartata.
