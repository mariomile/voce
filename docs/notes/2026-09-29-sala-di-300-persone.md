# Una sala di 300 persone sul modulo pubblico

Prova di carico in produzione per la masterclass PHC26 (1 ottobre 2026, circa 300 persone in sala). Workspace di prova Pro dedicato (`qa-load@voce-demo.it`, pagato con la carta di test 4242), tutto da un solo IP: il caso peggiore, la sala intera dietro il Wi-Fi del centro congressi.

## Cosa si è rotto

- **Il 301° feedback dell'ora veniva rifiutato, da qualunque rete.** 300 invii in 2 minuti: 300 accettati. I 20 successivi: 20 "Riprova più tardi". Anche un invio da un altro IP (i dati mobili) rifiutato, perché il tetto di 300 all'ora vale anche per workspace. Una sala di 300 non poteva mandare un secondo feedback.
- **I telefoni si aspettavano a vicenda.** 100 invii in 5 secondi: mediana 0,9 s, ma il 20% tra 5 e 6,5 secondi. Nei log di Supabase la chiamata al database arrivava a 6,4 s: ogni invio bloccava la riga del workspace e gli altri facevano la coda.

## Cosa è stato fatto

Migrazione `20261003090000_public_form_for_big_rooms.sql`, solo database:

- Limiti del modulo da 300 a **1.000 all'ora per IP** (su tutti i moduli) e **1.000 all'ora per workspace**: 500 persone che mandano due feedback a testa.
- Il blocco sulla riga del workspace resta **solo per i workspace con il limite Free**, dove serve a non superare i 100 feedback. Su Pro gli invii non si aspettano più.
- Brief (decisione 7) e `docs/prima-dei-clienti-reali.md` aggiornati.

## Decisioni

- **Perché 1.000 e non "senza limite".** Una sala dietro un Wi-Fi e uno script da un solo IP sono indistinguibili senza captcha. 1.000 all'ora fa passare una sala di 500 con due feedback a testa e tiene un tetto a quello che un solo IP può mandare, su tutti i moduli insieme. Il prezzo: uno script può mandare fino a 1.000 invii all'ora in un workspace Pro e spingere fuori dall'analisi (gli ultimi 500) i feedback veri. Un Free si riempiva già da un solo IP con il limite di prima.
- **Perché togliere il blocco su Pro.** Serviva solo a non superare il limite Free. Su Pro i limiti orari possono essere superati dagli invii che arrivano nello stesso istante (con 100 insieme, fino a 1.100): accettato.

## Verifica

- Test prima della correzione, rossi in CI (3 su 9 nel nuovo `supabase/tests/public_form.test.sql`: Pro bloccato, 1.000° invio da un IP, 1.000° di un workspace). Dopo la correzione CI verde: typecheck e lint, test unitari e di database, E2E.
- In produzione, migrazione applicata con i permessi delle due funzioni identici a prima (confrontati prima e dopo).
- Ripetuta la prova: 300 su 300 accettati in 2 minuti, poi altri 20 accettati, e accettato anche l'invio da un altro IP.

## Cosa resta

- Con 100 invii insieme il collo di bottiglia si è spostato sulla CPU del database Supabase (piano Free, istanza Nano): nei minuti del picco la CPU media sale al 49%, e le latenze sono variabili (95° percentile tra 3,3 e 17,8 secondi su due prove). Ogni invio fa 6 chiamate al database (5 per gli eventi di analytics) e ogni apertura del modulo 2: si riducono nel passo successivo.
