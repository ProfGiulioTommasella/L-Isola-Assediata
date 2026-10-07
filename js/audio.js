// Effetti sonori generati dal gioco stesso (niente file, niente diritti da gestire).
// La musica di sottofondo si elenca in CONFIG.musica (js/config.js).
const Audio_ = {
  ctx: null,
  master: null,
  attivo: Utili.leggi('audio', true),
  musica: null,

  // I browser permettono l'audio solo dopo il primo tocco o clic.
  sblocca() {
    if (this.ctx) return;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    this.ctx = new C();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.attivo ? 0.8 : 0;
    this.master.connect(this.ctx.destination);
  },

  cambia() {
    this.attivo = !this.attivo;
    Utili.scrivi('audio', this.attivo);
    if (this.master) this.master.gain.value = this.attivo ? 0.8 : 0;
    if (this.musica) this.musica.muted = !this.attivo;
    return this.attivo;
  },

  rumore(durata) {
    const n = Math.floor(this.ctx.sampleRate * durata);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    return s;
  },

  inviluppo(volume, attacco, durata) {
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume, t + attacco);
    g.gain.exponentialRampToValueAtTime(0.0001, t + durata);
    g.connect(this.master);
    return g;
  },

  // Colpo sordo con rumore filtrato: cannone, esplosione, tonfo.
  botto(durata, freq, volume, freqTono) {
    if (!this.ctx) return;
    const s = this.rumore(durata);
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(freq, this.ctx.currentTime);
    f.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + durata);
    s.connect(f);
    f.connect(this.inviluppo(volume, 0.005, durata));
    s.start();
    if (freqTono) {
      const o = this.ctx.createOscillator();
      o.frequency.setValueAtTime(freqTono, this.ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + durata * 0.6);
      o.connect(this.inviluppo(volume * 0.8, 0.005, durata * 0.6));
      o.start();
      o.stop(this.ctx.currentTime + durata);
    }
  },

  nota(freq, inizio, durata, tipo, volume) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    o.type = tipo || 'triangle';
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime + inizio;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume || 0.2, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + durata);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + durata + 0.05);
  },

  sparo() { this.botto(0.7, 1800, 0.9, 120); },
  esplosione() { this.botto(1.2, 900, 0.8, 70); },
  tonfo() {
    if (!this.ctx) return;
    const s = this.rumore(0.6);
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(1400, this.ctx.currentTime);
    f.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.5);
    s.connect(f);
    f.connect(this.inviluppo(0.5, 0.01, 0.6));
    s.start();
  },
  colpoForte() { this.botto(0.9, 500, 0.9, 55); },
  clic() { this.nota(880, 0, 0.06, 'square', 0.05); },
  giusta() { this.nota(660, 0, 0.18, 'triangle', 0.25); this.nota(990, 0.12, 0.3, 'triangle', 0.25); },
  sbagliata() { this.nota(300, 0, 0.2, 'triangle', 0.2); this.nota(220, 0.15, 0.35, 'triangle', 0.2); },
  lucchetto() { this.nota(1500, 0, 0.05, 'square', 0.08); this.nota(900, 0.08, 0.08, 'square', 0.08); },
  corno() {
    this.nota(196, 0, 0.6, 'sawtooth', 0.12);
    this.nota(294, 0.55, 1.0, 'sawtooth', 0.12);
  },
  fanfara() {
    [[392, 0], [523, 0.18], [659, 0.36], [784, 0.54], [659, 0.9], [784, 1.08]].forEach(([f, t]) =>
      this.nota(f, t, 0.3, 'square', 0.08));
  },

  // Musica di sottofondo, se il file esiste. Se manca non succede nulla.
  suona(nome) {
    if (this.musica && this.musica.dataset.nome === nome) return;
    this.ferma();
    const file = CONFIG.musica[nome];
    if (!file) return;
    const a = new Audio(file);
    a.dataset.nome = nome;
    a.loop = true;
    a.volume = 0.35;
    a.muted = !this.attivo;
    a.play().catch(() => {});
    this.musica = a;
  },
  ferma() {
    if (this.musica) { this.musica.pause(); this.musica = null; }
  },
};
