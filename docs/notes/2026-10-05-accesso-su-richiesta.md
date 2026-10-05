# Accesso su richiesta

## Cosa è stato fatto

- `AccessContact` (`src/components/access-contact.tsx`): "Gli accessi sono chiusi per ora. Per provare Voce scrivi a Mario", con l'email `mario@buildrs.xyz` (mailto con oggetto "Voce") e il suo LinkedIn.
- Landing: tolto "Accedi" dal menu. I tre bottoni (hero, prezzi, chiusura) diventano "Chiedi l'accesso" e aprono l'email; sotto i bottoni di hero e chiusura, al posto di "Gratis fino a 100 feedback", c'è `AccessContact`.
- `/signup` chiusa: titolo "Gli accessi sono chiusi" e il contatto al posto del testo di prima.
- `/login`: il modulo resta per gli account esistenti (le demo). Sotto, con le registrazioni chiuse, il contatto al posto di "Non hai un account? Crea il tuo workspace".

## Decisioni

- **`/signup` e `/login` seguono l'interruttore di Supabase, la landing no.** È una scelta di Mario "ad oggi": tenere nella landing le due versioni sarebbe codice in più per un caso che oggi non c'è. Quando si riapre, la landing va rimessa a mano.
- **Il login resta raggiungibile da `/login`**, anche se la landing non lo mostra più: servono gli accessi alle demo (Fatturino, PHC26).
