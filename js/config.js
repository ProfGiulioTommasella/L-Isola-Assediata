// Numeri del gioco, presi da docs/regole.md. Sono un punto di partenza da tarare provando il gioco.
const CONFIG = {
  livelli: [
    {
      scuola: 'fiandre', nome: 'Fiandre', torre: 'delle Fiandre',
      base: 12, perGiusta: 3, resistenza: 80, ricarica: 1.8,
      velocita: 1.0, intervallo: 9.0, notte: false,
      domandeScuola: 'Fiandre',
    },
    {
      scuola: 'roma', nome: 'Roma', torre: 'di Roma',
      base: 16, perGiusta: 4, resistenza: 100, ricarica: 1.6,
      velocita: 1.15, intervallo: 8.0, notte: false,
      domandeScuola: 'Roma',
    },
    {
      scuola: 'firenze', nome: 'Firenze', torre: 'di Firenze',
      base: 20, perGiusta: 5, resistenza: 120, ricarica: 1.5,
      velocita: 1.3, intervallo: 7.5, notte: false,
      domandeScuola: 'Firenze',
    },
    {
      scuola: 'venezia', nome: 'Venezia', torre: 'di Venezia',
      base: 24, perGiusta: 6, resistenza: 150, ricarica: 1.4,
      velocita: 1.45, intervallo: 7.0, notte: true,
      domandeScuola: 'Venezia',
    },
  ],

  domandePerLivello: 3,   // domande sulla scuola, più 1 generale

  // Tre navi per scuola: piccola e veloce, media, grande e lenta.
  // "attraversamento" = secondi per arrivare alla linea di difesa nel livello 1.
  navi: [
    { tipo: 'piccola', punti: 5, attraversamento: 7, larghezza: 130, ritardo: 0 },
    { tipo: 'media', punti: 3, attraversamento: 10, larghezza: 200, ritardo: 2.5 },
    { tipo: 'grande', punti: 2, attraversamento: 14, larghezza: 240, ritardo: 5 },
  ],

  danno: [9, 11],   // punti di resistenza tolti al forte da ogni nave che supera la linea
  bonusForte: [20, 10, 5, 0],   // integro, danneggiato, molto danneggiato, distrutto

  gradi: ['Mozzo', 'Nostromo', 'Capitano', 'Ammiraglio'],
  // Il grado dipende da quanti punti si hanno rispetto a un riferimento che cresce a ogni battaglia.
  riferimentoPunti: [45, 55, 65, 75],
  sogliaGradi: [0.25, 0.5, 0.75],

  // Finali del Re: risposte giuste minime per ogni fascia (vedi testi.json).
  totaleDomande: 16,

  // Parola d'ordine dell'area docente (ne è salvata solo un'impronta).
  impronta: '099766da',

  // Musica di sottofondo per livello: brani ascoltati in classe, in registrazioni libere.
  // Esempio: fiandre: 'audio/fiandre.mp3'. Se manca, il livello è senza musica.
  musica: {},

  // Colori delle flotte, usati finché non ci sono le immagini definitive delle navi.
  flotte: {
    fiandre: { vela: '#e3b331', emblema: '#1b1b1b', fascia: '#e3b331', bandiera: '#e3b331' },
    roma: { vela: '#f3ecdc', emblema: '#b3262a', fascia: '#b3262a', bandiera: '#b3262a' },
    firenze: { vela: '#f3ecdc', emblema: '#c0392b', fascia: '#c0392b', bandiera: '#f3ecdc' },
    venezia: { vela: '#9c1d1d', emblema: '#e2b53e', fascia: '#e2b53e', bandiera: '#9c1d1d' },
  },
};
