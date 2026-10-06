# Analisi del gioco Scratch "L'Isola Assediata"

Analisi del file `LIsola_Assediata.sb3`: 35 sprite, 16 sfondi, 124 risorse (circa 28 MB, quasi tutto PNG e WAV).

## 1. Il concetto

Il giocatore è un **Capitano di ventura** ingaggiato dal Re di un'isola attaccata dalle flotte delle quattro scuole musicali. Prima di ogni battaglia un **mercante** fa 4 domande sulla scuola nemica: ogni risposta procura **munizioni**. Poi si combatte: con un cannone si affondano le navi prima che raggiungano la costa. Alla fine il Re giudica il Capitano in base al punteggio.

## 2. Flusso delle schermate

```
Istruzioni → click sul cannone (miccia, sparo) → MAPPA con 4 torri
   → click su una torre → schermata "arrivo" + mercante (nome del giocatore, dialogo)
   → tasto P / R / O / F → 4 domande a risposta scritta
   → battaglia (sfondo del livello) → fine livello → MAPPA
   → dopo il livello 4: discorso del Re → 4 finali possibili → "Restart?"
```

| Livello | Scuola | Sfondo | Tasto domande | Resistenza forte | Ricarica cannone |
|---|---|---|---|---|---|
| 1 | Fiandre | colline | P | 100 | 2,0 s |
| 2 | Roma (Stato Pontificio) | nuvole | R | 200 | 2,0 s |
| 3 | Firenze (Granducato di Toscana) | campi | O | 350 | 1,9 s |
| 4 | Venezia | notte | F | 500 | 1,6 s |

La mappa mostra quattro torri, ma **l'ordine è di fatto fisso** (Fiandre → Roma → Firenze → Venezia): ogni livello sblocca il successivo. Una torre già giocata appare chiusa con un lucchetto, oppure in fiamme se la battaglia è persa.

## 3. Meccaniche di gioco

**Domande (mercanti)**
- 4 domande per scuola, 16 in totale. La risposta si **scrive a tastiera** e viene confrontata con una o poche stringhe esatte.
- Una risposta giusta vale il massimo delle munizioni, una sbagliata comunque circa il 60%:

| Livello | Giusta | Sbagliata | Munizioni possibili |
|---|---|---|---|
| 1 | 8 | 5 | 20–32 |
| 2 | 16 | 10 | 40–64 |
| 3 | 28 | 17 | 68–112 |
| 4 | 30 | 20 | 80–120 |

- Dopo un errore il mercante dà la risposta giusta ("Forse intendevate…"): è già un feedback didattico, da conservare.

**Battaglia**
- Il cannone segue il mouse; si spara col tasto sinistro. I colpi hanno una deviazione casuale di ±15° ("il nostro cannone non è precisissimo").
- Tre tipi di nave (brigantino, galea, galeone), ognuna con una velocità diversa (circa 8 / 4 / 2 nel livello 1, un po' più veloci nei livelli successivi). Ne parte una per tipo ogni 5,3 secondi.
- Una nave che supera la linea di difesa toglie 9–11 punti di resistenza al forte. Il forte cambia aspetto in 4 stati (integro, danneggiato, molto danneggiato, distrutto).
- Il livello finisce quando le munizioni sono esaurite (vittoria se il forte regge) o quando il forte cade (torre in fiamme sulla mappa).

**Punteggio e finali**
- `Punteggio` = somma delle munizioni guadagnate con le risposte. Massimo 328, minimo 208.
- Finali: sotto 267 "isola perduta"; 268–296 "discreto"; 298–327 "ottimo"; 328 "Campione dell'Isola" (sala del trono).

## 4. Problemi da risolvere nella nuova versione

**Di design**
1. **La battaglia non conta per il risultato.** Il finale dipende solo dalle risposte; navi affondate e torri perse non cambiano nulla. La variabile `hits` (3/5/2 punti per nave colpita) viene calcolata ma mai usata.
2. **Risposte scritte a mano.** "Despres" passa, "Des Prez" o "Josquin" no; un errore di battitura vale come risposta sbagliata. Meglio passare a risposte a scelta (multipla, vero/falso, abbinamenti).
3. **L'errore costa poco** (60% delle munizioni). Inoltre le stesse 16 domande escono sempre nello stesso ordine: alla seconda partita si ricordano a memoria.
4. **Funziona solo da computer** (mouse e tasti P/R/O/F), non da tablet o LIM.
5. **Dialoghi lunghi** a tempo fisso (fino a 8 secondi per battuta), che non si possono saltare né accelerare.
6. La scelta della torre sulla mappa è solo apparente, perché l'ordine è fisso.

**Bug**
- Con punteggio esattamente **267 o 297** non parte nessun finale (i confronti escludono quei valori).
- Livello 1: il cannone si blocca con forte < 6, mentre il forte viene dichiarato distrutto con < 5. Soglie incoerenti.
- Nel proiettile c'è una condizione che non si verifica mai (suono di tonfo in acqua).
- Tasto `k` nascosto per sbloccare tutte le torri e script di debug che impostano il punteggio a 269 o 328: utili per i test, da sostituire con una modalità docente.

## 5. Contenuti: le 16 domande

Trascritte in `data/domande-originali.json`, con note di verifica. Da rivedere nella chat del Progetto:

- **Firenze, "La forma più nota era: il Madrigale".** Il madrigale non è tipicamente fiorentino. Il contributo distintivo di Firenze è la Camerata de' Bardi, la monodia accompagnata e la **nascita del melodramma**, che nel quiz compare come risposta *sbagliata*. È la correzione più importante.
- **Firenze, "luoghi della musica oltre alle chiese"**: è una domanda generale, non sulla scuola fiorentina. Inoltre con la risposta scritta è quasi impossibile indovinare la formulazione esatta.
- **Venezia, "a Venezia si stampò la prima partitura".** Con Ottaviano Petrucci (Odhecaton, 1501) Venezia ebbe la prima stampa di musica polifonica a caratteri mobili, ma non si trattava di una "partitura" nel senso moderno. Va riformulata.
- **Venezia, "Andrea Gabrieli allievo di Willaert"**: lo riportano molti testi scolastici, ma non è documentato con certezza. Inoltre "Gabrilei" è un refuso.
- **Roma, "copiare i fiamminghi"**: meglio "partire dalla polifonia fiamminga rendendola più chiara, perché si capissero le parole" (il legame col Concilio di Trento, che oggi manca).
- **Roma, Missa Papae Marcelli**: l'opzione corretta è vaga. Si può chiedere invece che cos'è una messa polifonica (le parti dell'Ordinarium).
- Mancano concetti chiave: **cori spezzati** (Venezia), **Concilio di Trento** (Roma), **imitazione/canone** (Fiandre), **recitar cantando, Peri, Caccini** (Firenze).

## 6. Cosa riutilizzare

- **Da tenere**: la cornice narrativa (isola, Capitano, mercante, Re); la struttura "domande → munizioni → battaglia"; la progressione di difficoltà; i 4 finali; il feedback dopo l'errore; le navi diverse per ogni scuola (le vele hanno croci di colori diversi).
- **Da rifare**: tutte le grafiche (come previsto); l'audio, verificando le licenze. Alcuni suoni vengono dalla libreria di Scratch, uno da Freesound (`131554__shaynecantly`).
- **Idea da sviluppare**: far contare la battaglia nel punteggio (per esempio punti per le navi affondate e un bonus se il forte resta integro) e far scegliere davvero l'ordine delle torri.
