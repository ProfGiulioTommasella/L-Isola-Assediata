# Regole di gioco

Regole de «L'Isola Assediata», decise con il docente il 6 ottobre 2026. I numeri (munizioni, velocità delle navi, resistenza del forte, soglie dei gradi) sono un punto di partenza da tarare provando il gioco.

## 0. Principi
- Si gioca **da soli**, in laboratorio di informatica o a casa, su PC, tablet o LIM. Si mira e si spara toccando o cliccando; i dialoghi vanno avanti con un clic e si possono saltare.
- **Stessi comandi su ogni dispositivo.** Il gioco non ha bisogno di sapere se è su PC, tablet o LIM: mouse, dito e penna della LIM funzionano allo stesso modo.
  - *Schermo:* la scena si adatta alle dimensioni dello schermo e i pulsanti restano abbastanza grandi per un dito.
  - *Mira:* il cannone mira nel punto toccato o cliccato e spara subito. Non segue il puntatore come in Scratch, perché col dito non c'è un puntatore che si muove.
  - *Orientamento:* si gioca in orizzontale; se un tablet è tenuto in verticale, compare l'invito a ruotarlo.
- Le quattro scuole si affrontano in **ordine fisso**: Fiandre → Roma → Firenze → Venezia.
- Le domande vengono da `data/domande.json`: scelta multipla, vero/falso e abbinamento, mai risposte scritte. Le opzioni sono mescolate e dopo ogni risposta il mercante mostra la spiegazione.
- Le domande seguono la verifica di classe e la presentazione usata in classe: non si chiede nulla che non sia stato spiegato.

## 1. Due punteggi separati
- **Punteggio del Sapere: salva l'isola.** Conta le risposte giuste, 4 per livello e 16 in tutto. È quello che vale di più: decide il finale del Re.
- **Valore in combattimento.** Conta le navi affondate e lo stato del forte. Dà al Capitano un grado, ma non decide se l'isola è salva.

## 2. Com'è fatto un livello
1. **Il mercante.** Fa 4 domande: 3 sulla scuola e 1 generale, estratte a caso dalla banca.
2. **Le munizioni.** Ogni livello ha una dotazione base, alla quale ogni risposta giusta aggiunge colpi. Una risposta sbagliata non aggiunge nulla.
3. **La battaglia, come in Scratch.** Le navi arrivano senza sosta. La battaglia finisce quando i colpi sono esauriti (vittoria, se il forte regge) o quando il forte è distrutto (sconfitta, con la torre in fiamme sulla mappa). Si prosegue comunque al livello successivo.

**Munizioni**, ricavate dai valori del prototipo: un colpo per munizione, stessi tempi di ricarica.

| Livello | Base (tutto sbagliato) | + per risposta giusta | Colpi (min–max) | Durata della battaglia | Resistenza del forte |
|---|---|---|---|---|---|
| 1 Fiandre | 16 | +4 | 16–32 | da 30 s a 1 min | 100 |
| 2 Roma | 32 | +8 | 32–64 | da 1 a 2 min | 200 |
| 3 Firenze | 56 | +14 | 56–112 | da 1 min 45 s a 3 min 30 s | 350 |
| 4 Venezia | 64 | +14 | 64–120 | da 1 min 40 s a 3 min | 500 |

**Perché queste munizioni:**
- Chi sbaglia tutto ha comunque metà dei colpi: la battaglia è più breve e frutta meno punti, ma non è persa in partenza.
- Chi risponde bene combatte più a lungo e può affondare più navi, quindi il sapere aiuta anche in battaglia.

## 3. Valore in combattimento
- Ogni nave affondata vale punti in base alla velocità: **brigantino** (veloce) 5, **galea** 3, **galeone** (lento) 2. Il prototipo calcolava già questi punti nella variabile `hits` senza usarli.
- Bonus per lo stato del forte a fine battaglia: integro +20, danneggiato +10, molto danneggiato +5, distrutto 0.
- **Gradi** in base al totale delle 4 battaglie: Mozzo, Nostromo, Capitano, Ammiraglio. Le soglie si fissano dopo le prime prove di gioco.

## 4. Fine partita: il Re giudica il Sapere
Le fasce ricalcano il prototipo, dove l'isola era salva con circa metà delle risposte giuste.

| Risposte giuste (su 16) | Finale |
|---|---|
| 0–7 | **Isola perduta.** "Raccogliete più informazioni sui nemici e tornate." |
| 8–11 | **Discreto.** L'isola è salva, ma a fatica. |
| 12–15 | **Ottimo.** Il nemico è davvero battuto. |
| 16 | **Campione dell'Isola**, nella sala del trono, come nel prototipo. |

Poi il Re commenta il valore in combattimento: per esempio "E in battaglia vi siete guadagnato il grado di Ammiraglio!".

**Riepilogo finale.** Contiene:
- le risposte giuste di ogni scuola;
- il grado e il punteggio di combattimento;
- le domande sbagliate, con la spiegazione, sotto "Da ripassare prima della verifica".

La singola battaglia non si rigioca; l'intera partita sì, quante volte si vuole, con domande nuove. Il dispositivo ricorda il risultato migliore e il numero di partite giocate.

## 5. Risultati e modalità docente
- **Niente server e nessun dato online.** Il nome dello studente (basta il nome di battesimo) e i risultati restano sul dispositivo.
- **Riepilogo da consegnare.** Alla fine lo studente scarica o stampa il riepilogo e lo consegna al docente, anche da casa (per esempio su Classroom). In laboratorio il docente può vederlo direttamente sullo schermo. Il riepilogo contiene:
  - nome e data;
  - le risposte giuste per scuola;
  - il grado e il punteggio di combattimento;
  - il risultato migliore e il numero di partite giocate;
  - le domande da ripassare.
- **Modalità docente**, protetta da una parola d'ordine, al posto del tasto `k` nascosto del prototipo. Serve per:
  - sbloccare qualsiasi livello, per esempio alla LIM;
  - vedere tutte le domande con risposte e spiegazioni;
  - giocare in modalità allenamento, senza punteggio.
