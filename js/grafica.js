// Disegni del gioco. Ogni funzione usa l'immagine definitiva se è già in immagini/,
// altrimenti fa un disegno provvisorio con forme semplici.
const W = 1920, H = 1080;
const ORIZZONTE = 330;          // linea dell'orizzonte nelle battaglie
const MARE_ALTO = 430, MARE_BASSO = 960;   // corsie delle navi
const LINEA_DIFESA = 1290;      // la nave che arriva qui danneggia il forte
const FORTE = { x: 1660, y: 585 };     // base del forte, sulla rupe
const CANNONE = { x: 1480, y: 492 };   // perno del cannone
const BOCCA = 100;                      // distanza della bocca dal perno
// Dove poggiano forte e cannone. Senza immagine di sfondo valgono i numeri qui sopra (rupe disegnata);
// ogni sfondo dipinto ha la sua scogliera, quindi le sue posizioni (misurate sull'immagine).
const RUPE_DISEGNATA = { forte: [FORTE.x, FORTE.y], cannone: [CANNONE.x, CANNONE.y] };
const RUPI_DIPINTE = {
  fiandre: { forte: [1700, 410], cannone: [1548, 352] },
  roma: { forte: [1730, 450], cannone: [1578, 408] },
  firenze: { forte: [1720, 406], cannone: [1562, 367] },
  venezia: { forte: [1720, 410], cannone: [1565, 368] },
};
// batteria: la canna intera ruota attorno ai perni (px, py) e sta tra gli artiglieri (dietro) e il muro (davanti);
// (bx, by) è il punto del muro, nelle sue immagini, dove stanno i perni
const BATTERIA = { px: 204, py: 43, scala: BOCCA / 203, bx: 148, by: 154, scalaMuro: 0.5 };
const CANNONE_IMMAGINE = { px: 320, py: 265, scala: BOCCA / 295, inclinazione: 0.2633 };   // vedi cannone()

const PALETTE = {
  fiandre: { cielo: ['#7fb8e0', '#d8eef8'], mare: ['#3a8ba3', '#1c566a'], costa: '#7aa35a', luce: 'rgba(255,240,200,0.25)' },
  roma: { cielo: ['#7f95aa', '#d2dbe2'], mare: ['#4d7385', '#27475a'], costa: '#6f8a86', luce: 'rgba(255,255,255,0.12)' },
  firenze: { cielo: ['#eeb46a', '#fbe4b0'], mare: ['#2d6a8a', '#163c55'], costa: '#c9a24a', luce: 'rgba(255,210,140,0.25)' },
  venezia: { cielo: ['#0c1636', '#2a3d75'], mare: ['#1a2d57', '#0a152e'], costa: '#1d2440', luce: 'rgba(200,210,255,0.10)' },
};

// Che tipo di nave disegnare per ogni scuola (vedi docs/regole.md).
const ARMAMENTO = {
  fiandre: { piccola: 'latina', media: 'tonda', grande: 'caracca' },
  roma: { piccola: 'galeotta', media: 'galea', grande: 'capitana' },
  firenze: { piccola: 'latina', media: 'galea', grande: 'tonda3' },
  venezia: { piccola: 'latina', media: 'galea', grande: 'galeazza' },
};

const Grafica = {
  sfumatura(ctx, y0, y1, colori) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, colori[0]);
    g.addColorStop(1, colori[1]);
    return g;
  },

  // Immagine a tutto schermo (16:9), se c'è.
  immagineSfondo(ctx, nome) {
    const img = Utili.immagini[nome];
    if (!img) return false;
    ctx.drawImage(img, 0, 0, W, H);
    return true;
  },

  // ---------- Battaglia ----------
  posizionaRupe(scuola) {
    const r = (Utili.immagini['battaglia-' + scuola] && RUPI_DIPINTE[scuola]) || RUPE_DISEGNATA;
    [FORTE.x, FORTE.y] = r.forte;
    [CANNONE.x, CANNONE.y] = r.cannone;
  },

  sfondoBattaglia(ctx, scuola, t) {
    this.posizionaRupe(scuola);
    if (this.immagineSfondo(ctx, 'battaglia-' + scuola)) return;
    const p = PALETTE[scuola];
    ctx.fillStyle = this.sfumatura(ctx, 0, ORIZZONTE, p.cielo);
    ctx.fillRect(0, 0, W, ORIZZONTE + 2);

    if (scuola === 'venezia') {
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 70; i++) {
        const x = (i * 263) % W, y = (i * 97) % (ORIZZONTE - 40);
        ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t * 2 + i);
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#f6f1d8';
      ctx.beginPath(); ctx.arc(420, 120, 48, 0, Math.PI * 2); ctx.fill();
    } else {
      // nuvole
      const n = scuola === 'roma' ? 9 : 4;
      ctx.fillStyle = scuola === 'roma' ? 'rgba(240,244,248,0.85)' : 'rgba(255,255,255,0.8)';
      for (let i = 0; i < n; i++) {
        const x = ((i * 397 + t * 8) % (W + 400)) - 200, y = 50 + (i * 53) % 180;
        const s = scuola === 'roma' ? 1.6 : 1;
        for (let k = 0; k < 4; k++) {
          ctx.beginPath();
          ctx.ellipse(x + k * 45 * s, y + (k % 2) * 10, 60 * s, 28 * s, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // costa lontana
    ctx.fillStyle = p.costa;
    ctx.beginPath();
    ctx.moveTo(0, ORIZZONTE);
    for (let x = 0; x <= 1300; x += 20) {
      ctx.lineTo(x, ORIZZONTE - 18 - 14 * Math.sin(x / 130) - 8 * Math.sin(x / 47));
    }
    ctx.lineTo(1300, ORIZZONTE);
    ctx.fill();
    if (scuola === 'firenze') {
      ctx.fillStyle = '#3d4f2a';
      for (let x = 80; x < 1250; x += 110) {
        ctx.beginPath();
        ctx.ellipse(x, ORIZZONTE - 40, 5, 20, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (scuola === 'venezia') {
      ctx.fillStyle = '#ffd98a';
      for (let x = 100; x < 1250; x += 140) ctx.fillRect(x, ORIZZONTE - 14, 3, 3);
    }

    // mare
    ctx.fillStyle = this.sfumatura(ctx, ORIZZONTE, H, p.mare);
    ctx.fillRect(0, ORIZZONTE, W, H - ORIZZONTE);
    ctx.strokeStyle = p.luce;
    ctx.lineWidth = 3;
    for (let i = 0; i < 40; i++) {
      const y = ORIZZONTE + 20 + (i * 37) % (H - ORIZZONTE - 20);
      const x = ((i * 211 + t * 20 * (0.5 + (y - ORIZZONTE) / 600)) % (W + 200)) - 100;
      const l = 30 + (y - ORIZZONTE) / 8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + l / 2, y - 5, x + l, y);
      ctx.stroke();
    }
    if (scuola === 'venezia') {
      ctx.fillStyle = 'rgba(246,241,216,0.18)';
      for (let i = 0; i < 12; i++) ctx.fillRect(380 + Math.sin(t + i) * 20, ORIZZONTE + 10 + i * 24, 80 - i * 3, 4);
    }

    this.rupe(ctx, scuola);
  },

  rupe(ctx, scuola) {
    const scuro = scuola === 'venezia';
    ctx.fillStyle = scuro ? '#2b2a3a' : '#8a7356';
    ctx.beginPath();
    ctx.moveTo(1330, H);
    ctx.lineTo(1345, 820);
    ctx.lineTo(1370, 700);
    ctx.lineTo(1395, 610);
    ctx.lineTo(1420, 575);
    ctx.lineTo(1800, 570);
    ctx.lineTo(1850, 640);
    ctx.lineTo(W, 700);
    ctx.lineTo(W, H);
    ctx.fill();
    ctx.fillStyle = scuro ? '#22212e' : '#6d5a43';
    ctx.beginPath();
    ctx.moveTo(1400, H); ctx.lineTo(1430, 760); ctx.lineTo(1500, 680); ctx.lineTo(1560, 900); ctx.lineTo(1620, H);
    ctx.fill();
    ctx.fillStyle = scuro ? '#2f4030' : '#6f9a4a';
    ctx.fillRect(1415, 565, 390, 14);
  },

  lineaDifesa(ctx, t) {
    // Una cima con galleggianti di sughero segna il limite oltre il quale le navi colpiscono il forte.
    const punti = [];
    for (let y = MARE_ALTO - 30; y < H + 40; y += 70) {
      const s = 0.6 + 0.4 * (y - MARE_ALTO) / (MARE_BASSO - MARE_ALTO);
      punti.push([LINEA_DIFESA + Math.sin(t * 1.3 + y * 0.05) * 3, y + Math.sin(t * 2 + y) * 3, s]);
    }
    const tronco = Utili.immagini['tronco-sbarramento'];
    if (tronco) { this.catenaSbarramento(ctx, tronco, t); return; }
    ctx.save();
    ctx.lineCap = 'round';
    // la cima, che pesca un poco tra un galleggiante e l'altro
    for (let i = 1; i < punti.length; i++) {
      const [x0, y0, s0] = punti[i - 1], [x1, y1, s1] = punti[i];
      ctx.strokeStyle = 'rgba(60,40,22,0.75)'; ctx.lineWidth = 2.2 * s1;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + 7 * s1, (y0 + y1) / 2, x1, y1); ctx.stroke();
    }
    for (const [x, y, s] of punti) {
      // riflesso scuro nell'acqua, galleggiante di sughero, luce in alto e schiuma ai lati
      ctx.fillStyle = 'rgba(10,40,70,0.25)';
      ctx.beginPath(); ctx.ellipse(x, y + 4 * s, 15 * s, 4 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9a6a38';
      ctx.beginPath(); ctx.ellipse(x, y, 12 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c99a5e';
      ctx.beginPath(); ctx.ellipse(x - 2 * s, y - 2.5 * s, 7 * s, 3 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(50,32,16,0.8)'; ctx.lineWidth = 1.5 * s;
      ctx.beginPath(); ctx.ellipse(x, y, 12 * s, 7 * s, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(240,250,255,0.6)'; ctx.lineWidth = 1.6 * s;
      ctx.beginPath(); ctx.ellipse(x, y + 3 * s, 15 * s, 4 * s, 0, 0.15, Math.PI - 0.15); ctx.stroke();
    }
    ctx.restore();
  },

  // Catena di sbarramento: tronchi galleggianti, un po' sfalsati come una catena vista in prospettiva,
  // uniti da maglie di ferro che passano dietro i tronchi.
  catenaSbarramento(ctx, tronco, t) {
    // punti della linea dall'orizzonte verso chi guarda, con un leggero serpeggiare
    const punti = [];
    for (let i = 0, y = MARE_ALTO - 30; y < H + 80; i++) {
      const s = 0.55 + 0.45 * (y - MARE_ALTO) / (MARE_BASSO - MARE_ALTO);
      punti.push({ x: LINEA_DIFESA + Math.sin(i * 1.9) * 10 * s + Math.sin(t * 1.1 + i) * 2, y: y + Math.sin(t * 1.8 + i * 1.3) * 2, s });
      y += 92 * s;
    }
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 1; i < punti.length; i++) {
      const a = punti[i - 1], b = punti[i];
      const dx = b.x - a.x, dy = b.y - a.y, lungo = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
      const s = (a.s + b.s) / 2, maglia = 8 * s, buco = maglia * 2.2;   // spazio per due maglie tra un tronco e l'altro
      ctx.save();
      ctx.translate(a.x, a.y); ctx.rotate(ang);
      // maglie di ferro all'inizio del tratto (collegano al tronco precedente)
      for (let k = 0; k < 2; k++) {
        const mx = maglia * (0.5 + k * 1.05);
        ctx.strokeStyle = '#2e2420'; ctx.lineWidth = 3 * s;
        ctx.beginPath();
        if (k % 2) { ctx.moveTo(mx - maglia * 0.55, 0); ctx.lineTo(mx + maglia * 0.55, 0); }
        else ctx.ellipse(mx, 0, maglia * 0.6, maglia * 0.36, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // il tronco, accorciato dalla prospettiva: lungo quanto il tratto, spesso in proporzione alla distanza
      const lt = lungo - buco, spesso = 17 * s;
      // ombra e schiuma sull'acqua lungo il tronco
      ctx.fillStyle = 'rgba(10,40,70,0.22)';
      ctx.beginPath(); ctx.ellipse(buco + lt / 2, spesso * 0.15, lt / 2 + 2 * s, spesso * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(tronco, buco, -spesso / 2, lt, spesso);
      ctx.restore();
    }
    ctx.restore();
  },

  forte(ctx, stato, scossa) {
    const img = Utili.immagini['forte-' + stato];
    const dx = scossa ? Utili.caso(-6, 6) : 0;
    if (img) {
      const w = 330, h = w * img.height / img.width;
      ctx.drawImage(img, FORTE.x - w / 2 + dx, FORTE.y - h + 10, w, h);
      return;
    }
    ctx.save();
    ctx.translate(FORTE.x + dx, FORTE.y);
    const pietra = '#cbbfa6', ombra = '#a39579';
    if (stato === 3) {
      ctx.fillStyle = ombra;
      ctx.beginPath();
      ctx.moveTo(-150, 0); ctx.lineTo(-120, -40); ctx.lineTo(-60, -25); ctx.lineTo(-20, -70);
      ctx.lineTo(30, -50); ctx.lineTo(80, -80); ctx.lineTo(130, -30); ctx.lineTo(150, 0);
      ctx.fill();
      ctx.restore();
      return;
    }
    // muro
    ctx.fillStyle = pietra;
    ctx.fillRect(-150, -110, 170, 110);
    // torre
    ctx.fillStyle = '#d8cdb5';
    ctx.fillRect(10, -230, 130, 230);
    // merli
    const merli = (x0, y0, n, mancanti) => {
      for (let i = 0; i < n; i++) {
        if (mancanti.includes(i)) continue;
        ctx.fillRect(x0 + i * 26, y0 - 22, 16, 22);
      }
    };
    ctx.fillStyle = pietra;
    merli(-150, -110, 7, stato >= 1 ? [2, 5] : []);
    ctx.fillStyle = '#d8cdb5';
    merli(10, -230, 5, stato >= 2 ? [1, 3] : stato >= 1 ? [3] : []);
    // porta
    ctx.fillStyle = '#5a3b22';
    ctx.beginPath(); ctx.moveTo(-90, 0); ctx.lineTo(-90, -50); ctx.arc(-70, -50, 20, Math.PI, 0); ctx.lineTo(-50, 0); ctx.fill();
    // finestre
    ctx.fillStyle = '#3b3326';
    ctx.fillRect(65, -180, 18, 34);
    ctx.fillRect(65, -110, 18, 34);
    // bandiera
    if (stato < 2) {
      ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(75, -252); ctx.lineTo(75, -330); ctx.stroke();
      ctx.fillStyle = '#2f5fa8'; ctx.fillRect(77, -330, 60, 20);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(77, -310, 60, 18);
    }
    // danni
    ctx.strokeStyle = '#5b4f3c'; ctx.lineWidth = 4;
    if (stato >= 1) {
      ctx.beginPath(); ctx.moveTo(30, -200); ctx.lineTo(50, -160); ctx.lineTo(38, -130); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-120, -90); ctx.lineTo(-100, -60); ctx.stroke();
    }
    if (stato >= 2) {
      ctx.fillStyle = '#3d3427';
      ctx.beginPath(); ctx.ellipse(-30, -60, 35, 28, 0.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  },

  cannone(ctx, angolo, rinculo) {
    const canna = Utili.immagini['cannone-canna'], affusto = Utili.immagini['cannone-affusto'];
    const intera = Utili.immagini['cannone-canna-intera'], muro = Utili.immagini['batteria-muro'], artiglieri = Utili.immagini['batteria-artiglieri'];
    ctx.save();
    ctx.translate(CANNONE.x, CANNONE.y);
    if (intera && muro && artiglieri) {
      const B = BATTERIA, k = B.scalaMuro;
      const fondo = (img) => ctx.drawImage(img, -B.bx * k, -B.by * k, img.width * k, img.height * k);
      fondo(artiglieri);
      ctx.save();
      ctx.rotate(angolo);
      ctx.translate(rinculo * 18, 0);
      ctx.drawImage(intera, -B.px * B.scala, -B.py * B.scala, intera.width * B.scala, intera.height * B.scala);
      ctx.restore();
      fondo(muro);
      ctx.restore();
      return;
    }
    if (canna && affusto) {
      // le due immagini hanno la stessa tela: il perno della canna è in (px, py),
      // la bocca è a BOCCA px dal perno e nel disegno la canna è già alzata di 'inclinazione'
      const { px, py, scala, inclinazione } = CANNONE_IMMAGINE;
      const w = canna.width * scala, h = canna.height * scala;
      ctx.save();
      ctx.rotate(angolo);
      ctx.translate(rinculo * 18, 0);
      ctx.rotate(-inclinazione);
      ctx.drawImage(canna, -px * scala, -py * scala, w, h);
      ctx.restore();
      ctx.drawImage(affusto, -px * scala, -py * scala, w, h);
      ctx.restore();
      return;
    }
    // canna
    ctx.save();
    ctx.rotate(angolo);
    ctx.translate(rinculo * 18, 0);
    ctx.fillStyle = '#b58a3c';
    ctx.beginPath();
    ctx.moveTo(-110, -11); ctx.lineTo(10, -17); ctx.lineTo(10, 17); ctx.lineTo(-110, 11);
    ctx.fill();
    ctx.fillStyle = '#8c6a2c';
    ctx.fillRect(-114, -14, 10, 28);
    ctx.restore();
    // affusto e ruote
    ctx.fillStyle = '#5a3b22';
    ctx.fillRect(-20, 0, 70, 22);
    ctx.fillStyle = '#3e2a19';
    ctx.beginPath(); ctx.arc(-5, 28, 16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(40, 28, 16, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },

  // ---------- Navi ----------
  // (x, y) = centro della linea di galleggiamento; prua a destra.
  nave(ctx, scuola, tipo, x, y, larghezza, stato, progresso, t) {
    const nome = (stato === 'affonda' ? 'relitto-' : 'nave-') + scuola + '-' + tipo;
    const img = Utili.immagini[nome];
    ctx.save();
    ctx.translate(x, y);
    if (stato === 'affonda') {
      // la nave si inclina e scende sotto il pelo dell'acqua
      ctx.beginPath(); ctx.rect(-larghezza, -larghezza * 2, larghezza * 2, larghezza * 2 + 4); ctx.clip();
      ctx.translate(0, progresso * larghezza * 0.55);
      ctx.rotate(progresso * 0.35);
    } else {
      ctx.rotate(Math.sin(t * 2 + x / 90) * 0.02);
    }
    if (img) {
      const h = larghezza * img.height / img.width;
      ctx.drawImage(img, -larghezza / 2, -h * 0.96, larghezza, h);   // lo scafo è tagliato alla linea di galleggiamento
    } else {
      this.naveDisegnata(ctx, scuola, ARMAMENTO[scuola][tipo], larghezza, t);
    }
    ctx.restore();
    if (stato === 'fuoco') this.fiamme(ctx, x, y - larghezza * 0.12, larghezza * 0.38, t, 1);   // il fuoco parte dal ponte
    else if (stato === 'affonda') {
      // le fiamme si inclinano e scendono con il ponte, e spariscono sotto il pelo dell'acqua
      ctx.save();
      ctx.beginPath(); ctx.rect(x - larghezza * 2, y - larghezza * 3, larghezza * 4, larghezza * 3 + 4); ctx.clip();
      ctx.translate(x, y + progresso * larghezza * 0.55);
      ctx.rotate(progresso * 0.35);
      this.fiamme(ctx, 0, -larghezza * 0.12, larghezza * 0.38, t, 1 - progresso * 0.6);
      ctx.restore();
    }
  },

  naveDisegnata(ctx, scuola, armo, w, t) {
    const c = CONFIG.flotte[scuola];
    const legno = '#5b3a20', legnoScuro = '#3f2714';
    const scafo = (h, alto) => {
      ctx.fillStyle = legno;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h * (alto ? 1.6 : 1));
      ctx.lineTo(-w / 2 + w * 0.08, 0);
      ctx.lineTo(w / 2 - w * 0.12, 0);
      ctx.lineTo(w / 2, -h * (alto ? 1.3 : 1));
      ctx.lineTo(w / 2 - w * 0.2, -h);
      ctx.lineTo(-w / 2 + w * 0.2, -h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = c.fascia;
      ctx.fillRect(-w / 2 + w * 0.12, -h * 0.75, w * 0.68, h * 0.18);
    };
    const albero = (x, h) => {
      ctx.strokeStyle = legnoScuro; ctx.lineWidth = Math.max(3, w * 0.018);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, -h); ctx.stroke();
    };
    const latina = (x, h, larg) => {
      albero(x, h);
      ctx.fillStyle = c.vela;
      ctx.beginPath();
      ctx.moveTo(x + larg * 0.45, -h * 1.05);
      ctx.lineTo(x - larg * 0.55, -h * 0.25);
      ctx.lineTo(x + larg * 0.05, -h * 0.25);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.stroke();
    };
    const quadra = (x, h, larg) => {
      albero(x, h);
      ctx.fillStyle = c.vela;
      ctx.beginPath();
      ctx.moveTo(x - larg / 2, -h * 0.92);
      ctx.quadraticCurveTo(x + larg * 0.1, -h * 0.75, x - larg / 2, -h * 0.45);
      ctx.lineTo(x + larg / 2, -h * 0.45);
      ctx.quadraticCurveTo(x + larg * 0.65, -h * 0.7, x + larg / 2, -h * 0.92);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.stroke();
    };
    const emblema = (x, y, r) => {
      ctx.fillStyle = c.emblema;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      if (scuola === 'roma') {
        ctx.strokeStyle = '#e2b53e'; ctx.lineWidth = Math.max(2, r * 0.25);
        ctx.beginPath(); ctx.moveTo(x - r * 0.6, y - r * 0.6); ctx.lineTo(x + r * 0.6, y + r * 0.6); ctx.stroke();
        ctx.strokeStyle = '#e8e8e8';
        ctx.beginPath(); ctx.moveTo(x + r * 0.6, y - r * 0.6); ctx.lineTo(x - r * 0.6, y + r * 0.6); ctx.stroke();
      }
    };
    const bandiera = (x, y) => {
      const s = w * 0.07;
      ctx.fillStyle = c.bandiera;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - s * 1.4, y + s * 0.2 + Math.sin(t * 6) * 3);
      ctx.lineTo(x, y + s * 0.6);
      ctx.fill();
    };
    const remi = (n, h) => {
      ctx.strokeStyle = '#7a5532'; ctx.lineWidth = Math.max(2, w * 0.008);
      for (let i = 0; i < n; i++) {
        const x = -w * 0.32 + i * (w * 0.6 / n);
        const a = Math.sin(t * 3 + i * 0.1) * 6;
        ctx.beginPath(); ctx.moveTo(x, -h * 0.5); ctx.lineTo(x - 10 + a, h * 0.6); ctx.stroke();
      }
    };

    if (armo === 'latina') {
      const h = w * 0.13;
      scafo(h);
      latina(w * 0.12, w * 0.75, w * 0.6);
      latina(-w * 0.22, w * 0.55, w * 0.45);
      emblema(w * 0.08, -w * 0.48, w * 0.07);
      bandiera(w * 0.12, -w * 0.78);
    } else if (armo === 'galea' || armo === 'galeotta' || armo === 'capitana' || armo === 'galeazza') {
      const h = w * (armo === 'galeazza' ? 0.11 : 0.075);
      remi(armo === 'galeotta' ? 8 : armo === 'galea' ? 14 : 18, h);
      scafo(h);
      // sperone a prua
      ctx.strokeStyle = legnoScuro; ctx.lineWidth = Math.max(3, w * 0.012);
      ctx.beginPath(); ctx.moveTo(w / 2 - w * 0.05, -h); ctx.lineTo(w / 2 + w * 0.12, -h * 1.2); ctx.stroke();
      if (armo === 'galeazza') {
        ctx.fillStyle = legno;
        ctx.fillRect(-w / 2 + w * 0.02, -h * 2.2, w * 0.2, h * 1.3);
        ctx.fillRect(w / 2 - w * 0.22, -h * 2, w * 0.16, h * 1.1);
      }
      latina(w * 0.1, w * 0.5, w * 0.45);
      latina(-w * 0.18, w * 0.38, w * 0.32);
      if (armo === 'galeazza') latina(-w * 0.36, w * 0.3, w * 0.22);
      emblema(w * 0.07, -w * 0.32, w * 0.05);
      bandiera(w * 0.1, -w * 0.52);
      if (armo === 'capitana' || armo === 'galeazza') {
        ctx.fillStyle = '#f0c75e';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.arc(-w / 2 + w * 0.06 + i * w * 0.05, -h * 2.4, w * 0.015, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else {
      // navi tonde: urca, caracca, galeone
      const alti = armo !== 'tonda';
      const h = w * (alti ? 0.16 : 0.14);
      scafo(h, alti);
      if (alti) {
        ctx.fillStyle = '#3a2412';
        for (let i = 0; i < 5; i++) ctx.fillRect(-w * 0.25 + i * w * 0.11, -h * 0.55, w * 0.04, h * 0.2);
      }
      const n = armo === 'tonda' ? 2 : 3;
      const hAlbero = w * (alti ? 0.85 : 0.7);
      for (let i = 0; i < n; i++) {
        const x = w * 0.18 - i * w * 0.24;
        quadra(x, hAlbero * (i === 0 ? 1 : 0.85), w * 0.3);
      }
      emblema(w * 0.18, -hAlbero * 0.68, w * 0.06);
      bandiera(w * 0.18, -hAlbero - 4);
    }
  },

  // Disegna un effetto dipinto con la base (o il centro) in (x, y); false se l'immagine manca.
  effetto(ctx, nome, x, y, largo, alto = 0, ancora = 0.5) {
    const img = Utili.immagini['effetto-' + nome];
    if (!img) return false;
    const h = alto || largo * img.height / img.width;
    ctx.drawImage(img, x - largo / 2, y - h * ancora, largo, h);
    return true;
  },

  fiamme(ctx, x, y, dim, t, forza) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, forza));
    const largo = dim * 1.5;
    // due strati di fuoco sfasati per far tremolare le fiamme
    if (Utili.immagini['effetto-fiamme']) {
      const alto = largo * 1.16;
      this.effetto(ctx, 'fiamme', x, y + dim * 0.1, largo, alto * (1 + 0.07 * Math.sin(t * 9)), 1);
      ctx.globalAlpha *= 0.45 + 0.25 * Math.sin(t * 13 + 1);
      this.effetto(ctx, 'fiamme', x + dim * 0.05, y + dim * 0.1, -largo, alto * (1 + 0.07 * Math.sin(t * 11 + 2)), 1);
      ctx.restore();
      return;
    }
    for (let i = 0; i < 7; i++) {
      const fx = x + Math.sin(i * 2.1) * dim * 0.4;
      const fh = dim * (0.5 + 0.35 * Math.sin(t * 12 + i * 1.7));
      ctx.fillStyle = i % 2 ? '#ffb43a' : '#f0602a';
      ctx.beginPath();
      ctx.moveTo(fx - dim * 0.12, y);
      ctx.quadraticCurveTo(fx, y - fh * 1.4, fx + dim * 0.12, y);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(60,55,55,0.35)';
    for (let i = 0; i < 4; i++) {
      const fy = y - dim - ((t * 60 + i * 30) % (dim * 1.5));
      ctx.beginPath(); ctx.arc(x + Math.sin(t + i) * 15, fy, dim * 0.25, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  },

  palla(ctx, x, y, r) {
    if (this.effetto(ctx, 'palla', x, y, r * 2.2)) return;
    ctx.fillStyle = '#1d1d1d';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, Math.PI * 2); ctx.fill();
  },

  spruzzo(ctx, x, y, s, p) {
    ctx.save();
    ctx.globalAlpha = 1 - p;
    if (Utili.immagini['effetto-spruzzo']) {
      // la colonna d'acqua sale in fretta e poi ricade
      const largo = 110 * s, alto = 160 * s * (0.35 + 0.65 * Math.sin(Math.min(1, p * 1.6) * Math.PI / 2));
      this.effetto(ctx, 'spruzzo', x, y + 8 * s, largo * (1 + 0.3 * p), alto, 1);
      ctx.restore();
      return;
    }
    ctx.fillStyle = '#e6f3f8';
    for (let i = -3; i <= 3; i++) {
      const h = (60 - Math.abs(i) * 12) * s * Math.sin(p * Math.PI);
      ctx.beginPath(); ctx.ellipse(x + i * 9 * s, y - h / 2, 6 * s, h / 2 + 1, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  },

  esplosione(ctx, x, y, s, p) {
    ctx.save();
    ctx.globalAlpha = 1 - p;
    if (this.effetto(ctx, 'esplosione', x, y, (100 + 100 * p) * s)) { ctx.restore(); return; }
    ctx.fillStyle = '#ffcf4a';
    ctx.beginPath(); ctx.arc(x, y, (20 + 50 * p) * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f0602a';
    ctx.beginPath(); ctx.arc(x, y, (12 + 35 * p) * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(80,75,70,0.6)';
    ctx.beginPath(); ctx.arc(x + 20 * s, y - 30 * p * s, 30 * p * s, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },

  vampata(ctx, angolo, p) {
    ctx.save();
    ctx.translate(CANNONE.x, CANNONE.y);
    ctx.rotate(angolo);
    ctx.globalAlpha = 1 - p;
    const largo = 150 + 50 * p;
    // la vampata dipinta ha la bocca del cannone sul lato destro
    if (this.effetto(ctx, 'vampata', -BOCCA - largo / 2 + 6, Utili.immagini['cannone-canna-intera'] ? 0 : -16, largo)) { ctx.restore(); return; }
    ctx.fillStyle = '#ffd25a';
    ctx.beginPath(); ctx.arc(-BOCCA, 0, 26 + 20 * p, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(230,230,230,0.7)';
    ctx.beginPath(); ctx.arc(-BOCCA - 25 - 40 * p, -10 * p, 22 + 30 * p, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },

  barile(ctx, x, y, s, t, fase = 0) {
    ctx.save();
    // il dondolio usa una fase fissa del barile, non la sua posizione: così non trema mentre la corrente lo sposta
    ctx.translate(x, y + Math.sin(t * 2 + fase * 3) * 4);
    ctx.scale(s, s);
    if (Utili.immagini['effetto-barile']) {
      // il barile galleggia: la parte sotto il pelo dell'acqua non si vede, attorno c'è un po' di schiuma
      const pelo = 2, onda = (u) => pelo + Math.sin(u * 0.12 + t * 3) * 2;
      ctx.save();
      ctx.beginPath(); ctx.moveTo(-60, -60);
      for (let u = -60; u <= 60; u += 6) ctx.lineTo(u, onda(u));
      ctx.lineTo(60, -60); ctx.closePath(); ctx.clip();
      ctx.rotate(Math.sin(t * 1.7 + fase * 5) * 0.04);
      this.effetto(ctx, 'barile', 0, -10, 96);
      ctx.restore();
      // velo d'acqua sul bordo immerso e anello di schiuma
      ctx.fillStyle = 'rgba(30,90,130,0.35)';
      ctx.beginPath(); ctx.ellipse(0, pelo + 2, 50, 6, 0, 0, Math.PI * 2); ctx.fill();
      // sottile linea di schiuma che segue l'onda, più qualche riflesso chiaro
      ctx.strokeStyle = 'rgba(235,248,255,0.55)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let u = -50; u <= 50; u += 5) ctx[u === -50 ? 'moveTo' : 'lineTo'](u, onda(u) + 1);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(235,248,255,0.3)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const u = -58 + i * 34 + Math.sin(t * 1.3 + i) * 4;
        ctx.beginPath(); ctx.moveTo(u, pelo + 7 + (i % 2) * 3); ctx.lineTo(u + 14, pelo + 7 + (i % 2) * 3); ctx.stroke();
      }
      ctx.restore();
      return;
    }
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath(); ctx.ellipse(0, -16, 42, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3b3b3b'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-18, -38); ctx.lineTo(-18, 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(18, -38); ctx.lineTo(18, 6); ctx.stroke();
    ctx.restore();
  },

  // Mano che indica dove toccare.
  mano(ctx, x, y, t) {
    const dy = Math.abs(Math.sin(t * 4)) * 25;
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(x, y, 18 + (dy < 5 ? 14 : 0), 0, Math.PI * 2); ctx.fill();
    const img = Utili.immagini.mano;
    if (img) {
      // la punta dell'indice è nell'angolo in basso a sinistra; la mano batte lungo la direzione del dito
      const w = 130, h = w * img.height / img.width;
      ctx.drawImage(img, x - w * 0.05 + dy * 0.55, y - h * 0.96 - dy * 0.85, w, h);
      ctx.restore();
      return;
    }
    ctx.font = '110px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('👇', x, y - 5 - dy);
    ctx.restore();
  },

  // ---------- Mappa ----------
  // base di ogni torre: sulla mappa disegnata dal codice e su quella dipinta (misurate sull'immagine)
  TORRI_DISEGNATE: { fiandre: [960, 250], roma: [640, 720], firenze: [1290, 670], venezia: [1400, 290] },
  TORRI_DIPINTE: { fiandre: [899, 190], roma: [487, 755], firenze: [1414, 790], venezia: [1513, 340] },
  get POSIZIONI_TORRI() { return Utili.immagini.mappa ? this.TORRI_DIPINTE : this.TORRI_DISEGNATE; },

  mappa(ctx, stati, prossima, t) {
    if (!this.immagineSfondo(ctx, 'mappa')) {
      ctx.fillStyle = this.sfumatura(ctx, 0, H, ['#3f9ab3', '#1f5f78']);
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 60; i++) {
        const x = (i * 331) % W, y = (i * 173) % H;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 20, y - 6, x + 40, y); ctx.stroke();
      }
      // isola
      ctx.fillStyle = '#e8d6a0';
      this.isola(ctx, 1.06);
      ctx.fillStyle = '#7aa35a';
      this.isola(ctx, 1);
      ctx.fillStyle = '#5f8a45';
      for (let i = 0; i < 9; i++) {
        ctx.beginPath(); ctx.ellipse(800 + (i * 97) % 380, 420 + (i * 61) % 260, 50, 26, 0, 0, Math.PI * 2); ctx.fill();
      }
      // villaggio
      ctx.fillStyle = '#c4643c';
      for (let i = 0; i < 7; i++) ctx.fillRect(900 + (i % 4) * 34, 520 + Math.floor(i / 4) * 30, 24, 18);
      // rosa dei venti
      ctx.save(); ctx.translate(200, 880); ctx.fillStyle = 'rgba(250,240,210,0.9)';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath(); ctx.moveTo(0, -90); ctx.lineTo(14, 0); ctx.lineTo(-14, 0); ctx.fill();
      }
      ctx.restore();
    }
    // flotte nemiche vicino a ogni torre
    const lontano = { fiandre: [0, -170], roma: [-260, 170], firenze: [250, 200], venezia: [300, -150] };
    for (const [scuola, [tx, ty]] of Object.entries(this.POSIZIONI_TORRI)) {
      if (!Utili.immagini.mappa) {
        const [ox, oy] = lontano[scuola];
        for (let i = 0; i < 3; i++) {
          ctx.save();
          ctx.translate(tx + ox + (i - 1) * 70, ty + oy + (i % 2) * 30);
          this.naveDisegnata(ctx, scuola, i === 1 ? ARMAMENTO[scuola].grande : 'latina', 80, t);
          ctx.restore();
        }
      }
      this.torre(ctx, scuola, tx, ty, stati[scuola], scuola === prossima, t);
    }
  },

  isola(ctx, s) {
    ctx.save();
    ctx.translate(960, 520);
    ctx.scale(s, s);
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.1) {
      const r = 1 + 0.12 * Math.sin(a * 3) + 0.08 * Math.sin(a * 7 + 1);
      const x = Math.cos(a) * 520 * r, y = Math.sin(a) * 330 * r;
      a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.fill();
    ctx.restore();
  },

  torre(ctx, scuola, x, y, stato, evidenziata, t) {
    // stato: 'libera' | 'difesa' (forte retto) | 'caduta'
    if (!Utili.immagini.mappa) {
      ctx.fillStyle = '#d8cdb5';
      ctx.fillRect(x - 30, y - 90, 60, 90);
      ctx.fillStyle = '#cbbfa6';
      for (let i = 0; i < 3; i++) ctx.fillRect(x - 30 + i * 24, y - 104, 14, 14);
      ctx.fillStyle = '#2f5fa8'; ctx.fillRect(x, y - 140, 34, 14);
      ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y - 104); ctx.lineTo(x, y - 142); ctx.stroke();
    }
    const k = Utili.immagini.mappa ? 0.65 : 1;   // le torri dipinte sono più piccole
    if (evidenziata) {
      ctx.save();
      ctx.strokeStyle = '#ffe28a';
      ctx.lineWidth = 8;
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4);
      ctx.beginPath(); ctx.arc(x, y - 55 * k, 95 * k, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    if (stato === 'caduta') {
      const fuoco = Utili.immagini['fuoco-torre'];
      if (fuoco) {
        // fiamme e fumo che escono dalla cima della torre, con un leggero tremolio
        const w = 78 * k, h = w * fuoco.height / fuoco.width * (1 + 0.05 * Math.sin(t * 9));
        // la base delle fiamme dipinte è spostata a sinistra nel disegno: la riallineo al centro della cima
        ctx.drawImage(fuoco, x - w / 2 + w * 0.08 + 4 * k, y - 62 * k - h, w, h);
      } else this.fiamme(ctx, x, y - 75 * k, 90 * k, t, 1);
    }
    // il lucchetto chiude solo le torri non ancora combattute (non la prossima, che è aperta)
    if (stato === 'libera' && !evidenziata) {
      const img = Utili.immagini.lucchetto;
      if (img) {
        const w = 50 * k, h = w * img.height / img.width;
        ctx.drawImage(img, x - w / 2, y + 22 * k - h, w, h);
      }
      else {
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(x - 22 * k, y - 30 * k, 44 * k, 34 * k);
        ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 7 * k;
        ctx.beginPath(); ctx.arc(x, y - 30 * k, 14 * k, Math.PI, 0); ctx.stroke();
      }
    }
  },

  // ---------- Schermate ----------
  inizio(ctx, t) {
    if (this.immagineSfondo(ctx, 'inizio')) return;
    this.sfondoBattaglia(ctx, 'fiandre', t);
    this.forte(ctx, 0, false);
    const flotte = ['fiandre', 'roma', 'firenze', 'venezia'];
    flotte.forEach((s, i) => {
      for (let k = 0; k < 2; k++) {
        ctx.save();
        ctx.translate(120 + i * 290 + k * 90, ORIZZONTE + 25 + k * 8);
        this.naveDisegnata(ctx, s, k ? 'latina' : ARMAMENTO[s].grande, 60, t);
        ctx.restore();
      }
    });
  },

  scena(ctx, scuola) {
    if (this.immagineSfondo(ctx, 'scena-' + scuola)) return;
    ctx.fillStyle = '#6b5236';
    ctx.fillRect(0, 0, W, H);
  },

  salaDelRe(ctx, t) {
    if (this.immagineSfondo(ctx, 're')) return;
    ctx.fillStyle = this.sfumatura(ctx, 0, H, ['#6e4a2a', '#3a2615']);
    ctx.fillRect(0, 0, W, H);
    // finestre ad arco con il mare
    for (let i = 0; i < 3; i++) {
      const x = 700 + i * 300;
      ctx.fillStyle = this.sfumatura(ctx, 180, 520, ['#86c2e0', '#2d6a8a']);
      ctx.beginPath(); ctx.moveTo(x, 520); ctx.lineTo(x, 260); ctx.arc(x + 70, 260, 70, Math.PI, 0); ctx.lineTo(x + 140, 520); ctx.fill();
    }
    // stendardi
    ctx.fillStyle = '#9c1d1d';
    [620, 1200, 1500].forEach((x) => { ctx.fillRect(x, 120, 70, 260); });
    // tappeto e trono
    ctx.fillStyle = '#8f1f24';
    ctx.beginPath(); ctx.moveTo(1450, 700); ctx.lineTo(1610, 700); ctx.lineTo(1800, H); ctx.lineTo(1250, H); ctx.fill();
    ctx.fillStyle = '#5a3418';
    ctx.fillRect(1440, 380, 180, 340);
    ctx.fillStyle = '#a52a2a';
    ctx.fillRect(1465, 520, 130, 120);
    // corona
    ctx.fillStyle = '#e2b53e';
    ctx.beginPath();
    ctx.moveTo(1480, 460); ctx.lineTo(1480, 410); ctx.lineTo(1505, 435); ctx.lineTo(1530, 395);
    ctx.lineTo(1555, 435); ctx.lineTo(1580, 410); ctx.lineTo(1580, 460); ctx.fill();
  },
};
