// Piccole funzioni di servizio usate in tutto il gioco.
const Utili = {
  caso(min, max) { return min + Math.random() * (max - min); },
  intero(min, max) { return Math.floor(Utili.caso(min, max + 1)); },

  mescola(lista) {
    const a = lista.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // Sostituisce {nome}, {colpi}... con i valori del gioco.
  riempi(testo, valori) {
    return testo.replace(/\{(\w+)\}/g, (m, k) => (k in valori ? valori[k] : m));
  },

  // Crea un elemento HTML: el('div', {class: 'x'}, 'testo', altroElemento)
  el(tag, attributi, ...figli) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attributi || {})) {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    }
    for (const f of figli.flat()) {
      if (f == null || f === false) continue;
      e.append(f instanceof Node ? f : document.createTextNode(String(f)));
    }
    return e;
  },

  impronta(testo) {
    let h = 0x811c9dc5;
    for (const b of new TextEncoder().encode(testo)) {
      h ^= b;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  },

  // Memoria del dispositivo: può non funzionare (navigazione privata), quindi mai obbligatoria.
  leggi(chiave, predefinito) {
    try {
      const v = localStorage.getItem('isola-assediata.' + chiave);
      return v == null ? predefinito : JSON.parse(v);
    } catch (e) { return predefinito; }
  },
  scrivi(chiave, valore) {
    try { localStorage.setItem('isola-assediata.' + chiave, JSON.stringify(valore)); } catch (e) { /* niente */ }
  },

  // Carica un'immagine se esiste; altrimenti il gioco usa il disegno provvisorio.
  immagini: {},
  caricaImmagine(nome, percorso) {
    return new Promise((ok) => {
      const img = new Image();
      img.onload = () => { Utili.immagini[nome] = img; ok(img); };
      img.onerror = () => ok(null);
      img.src = percorso;
    });
  },

  dataOggi() {
    return new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  },
};
