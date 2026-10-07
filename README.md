# L'Isola Assediata
Gioco sulle 4 scuole musicali rinascimentali, per la seconda media. Si gioca nel browser, su PC, tablet o LIM, senza installare nulla.

## Come si gioca
Si apre `index.html` da un indirizzo web (per esempio GitHub Pages). Aperto con un doppio clic dal computer non funziona, perché il browser blocca la lettura delle domande.

Per provarlo sul proprio computer: `python3 -m http.server` nella cartella del gioco, poi si apre `http://localhost:8000`.

## Dove sono le cose
- `data/domande.json`: le domande, con risposte e spiegazioni.
- `data/testi.json`: tutti i testi del gioco.
- `docs/regole.md`: le regole decise con il docente.
- `js/config.js`: i numeri del gioco (munizioni, velocità delle navi, resistenza del forte, soglie dei gradi, musica).
- `immagini/`: le immagini definitive. `immagini/elenco.json` dice quali sono già pronte; quelle che mancano il gioco le disegna da sé con forme semplici.
- `immagini/originali/`: le immagini come sono uscite dal generatore, prima della conversione.
- `audio/`: la musica dei livelli. Autori e licenze in `audio/CREDITI.md`.

## Area docente
Si entra dal pulsante in basso a destra della schermata iniziale. La parola d'ordine la conosce il docente; nel codice c'è solo la sua impronta.
