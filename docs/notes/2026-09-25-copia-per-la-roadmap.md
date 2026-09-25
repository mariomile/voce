# Copia per la roadmap

## Cosa è stato fatto

Ogni tema nella pagina Temi ha un pulsante "Copia per la roadmap" sotto priorità e stato. Copia negli appunti, in Markdown: titolo, sintesi, numero di feedback e le prime due citazioni (con canale e data).

## Decisioni

- Il Markdown si compone sul server in `theme-row.tsx`; il componente client riceve solo la stringa e la copia.
- Anche i temi compatti (dal quarto in poi) copiano due citazioni e la sintesi, anche se a schermo ne mostrano meno: chi incolla in roadmap vuole il quadro completo.
- Le citazioni su più righe restano dentro il blockquote.
- Il testo copiato è solo testo, nessun HTML. Nessun evento analytics: non richiesto.

## Verifica

Typecheck, lint, 190 test, build. Flusso provato in Chromium contro Supabase locale: registrazione, due feedback, analisi, clic sul pulsante, lettura degli appunti.

## Cosa resta

Niente.
