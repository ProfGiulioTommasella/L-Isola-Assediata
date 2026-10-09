// La battaglia: le navi arrivano da sinistra, il cannone sul forte spara dove si tocca.
class Battaglia {
  // opzioni: { livello, colpi, prova, testi, adatta, ui, alTermine }
  constructor(o) {
    this.o = o;
    this.liv = o.livello;
    this.colpi = o.colpi;
    this.resistenza = this.liv.resistenza;
    this.forte = this.resistenza;
    this.navi = [];
    this.palle = [];
    this.effetti = [];
    this.punti = 0;
    this.affondate = 0;
    this.t = 0;
    this.pronto = 0;          // istante in cui il cannone è di nuovo carico
    this.ultimoSparo = 0;
    this.angolo = -0.15;
    this.rinculo = 0;
    this.scossa = 0;
    this.pausa = false;
    this.finita = false;
    this.fineTra = null;
    this.manoFino = 0;
    this.manoPos = [700, 700];
    this.stato = o.prova ? 'prova' : 'battaglia';
    this.timer = CONFIG.navi.map((n) => n.ritardo);
    this.barili = o.prova ? [[420, 640, 0.9], [760, 820, 1.05], [1020, 540, 0.8]].map(([x, y, s]) => ({ x, y, x0: x, y0: y, s, colpito: false, fase: Utili.caso(0, 6.28) })) : [];
    this.corrente = null;   // istante in cui la corrente comincia a spostare i barili
    this.creaHud();
    if (o.prova) {
      this.messaggio(this.o.adatta(this.o.testi.aiuti_sparo.colpi_di_prova));
      this.manoPos = [this.barili[0].x, this.barili[0].y - 20];
      this.manoFino = Infinity;
    } else {
      this.iniziaFlotta();
    }
  }

  get statoForte() {
    const r = this.forte / this.resistenza;
    if (r <= 0) return 3;
    if (r <= 0.33) return 2;
    if (r <= 0.66) return 1;
    return 0;
  }

  iniziaFlotta() {
    this.stato = 'battaglia';
    this.timer = CONFIG.navi.map((n) => this.t + n.ritardo);
    this.ultimoSparo = this.t;
    this.messaggio(this.o.adatta(this.o.testi.aiuti_sparo.inizio_battaglia), 3);
    this.manoPos = [650, 720];
    this.manoFino = this.t + 3;
    Audio_.corno();
  }

  // ---------- Interfaccia ----------
  creaHud() {
    const el = Utili.el;
    this.hudColpi = el('span', { class: 'valore' });
    this.hudPunti = el('span', { class: 'valore' });
    this.hudForte = el('div', { class: 'barra-riempimento' });
    this.hudRicarica = el('div', { class: 'ricarica' }, 'Ricarica…');
    this.fumetto = el('div', { class: 'fumetto nascosto' });
    this.hud = el('div', { class: 'hud' },
      el('div', { class: 'hud-box' }, el('span', { class: 'icona-palla' }), 'Colpi: ', this.hudColpi),
      el('div', { class: 'hud-box' }, 'Forte ', el('div', { class: 'barra' }, this.hudForte)),
      el('div', { class: 'hud-box' }, 'Punti: ', this.hudPunti),
      el('button', { class: 'tondo aiuto', 'aria-label': 'Aiuto', onclick: (e) => { e.stopPropagation(); this.mostraAiuto(); } }, '?'),
    );
    this.o.ui.append(this.hud, this.fumetto, this.hudRicarica);
    this.aggiornaHud();
  }

  aggiornaHud() {
    this.hudColpi.textContent = this.stato === 'prova' ? '∞' : this.colpi;
    this.hudPunti.textContent = this.punti;
    this.hudForte.style.width = (100 * this.forte / this.resistenza) + '%';
    this.hudForte.style.background = this.statoForte >= 2 ? '#c8372d' : this.statoForte === 1 ? '#e0a030' : '#5aa04a';
    this.hudRicarica.classList.toggle('visibile', this.t < this.pronto && !this.finita);
  }

  messaggio(testo, secondi) {
    this.fumetto.textContent = testo;
    this.fumetto.classList.remove('nascosto');
    clearTimeout(this._timerFumetto);
    if (secondi) this._timerFumetto = setTimeout(() => this.fumetto.classList.add('nascosto'), secondi * 1000);
  }

  mostraAiuto() {
    if (this.finita) return;
    this.pausa = true;
    const el = Utili.el;
    const box = el('div', { class: 'velo' },
      el('div', { class: 'pergamena centrata' },
        el('h2', {}, 'Come si gioca'),
        el('p', {}, this.o.testi.aiuti_sparo.pulsante_aiuto),
        el('button', { class: 'pulsante', onclick: () => { box.remove(); this.pausa = false; this.ultimoSparo = this.t; } }, 'Riprendi'),
      ));
    this.o.ui.append(box);
  }

  // ---------- Comandi ----------
  // Angolo della canna per puntare verso (x, y): la canna guarda a sinistra.
  mira(x, y) {
    let a = Math.atan2(y - CANNONE.y, x - CANNONE.x) - Math.PI;
    if (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  punta(x, y) {
    if (this.pausa || this.finita || x > LINEA_DIFESA + 30) return;
    this.angolo = this.mira(x, Math.max(y, ORIZZONTE + 15));
  }

  tocco(x, y) {
    if (this.pausa || this.finita) return;
    if (y < ORIZZONTE + 15 || x > LINEA_DIFESA + 30) return;
    if (this.t < this.pronto) { Audio_.inceppato(); return; }
    if (this.stato === 'battaglia' && this.colpi <= 0) return;

    if (this.stato === 'battaglia') this.colpi--;
    this.pronto = this.t + this.liv.ricarica;
    this.ultimoSparo = this.t;
    this.manoFino = 0;
    if (this.stato === 'battaglia') this.fumetto.classList.add('nascosto');

    // il cannone "non è precisissimo"
    const tx = x + Utili.caso(-28, 28), ty = y + Utili.caso(-10, 10);
    this.angolo = this.mira(tx, ty);
    const bx = CANNONE.x + Math.cos(this.angolo) * -125, by = CANNONE.y + Math.sin(this.angolo) * -125;
    const dist = Math.hypot(tx - bx, ty - by);
    this.palle.push({ x0: bx, y0: by, tx, ty, p: 0, durata: 0.25 + dist / 4000, arco: dist * 0.1 });
    this.effetti.push({ tipo: 'vampata', p: 0, durata: 0.4, angolo: this.angolo });
    this.rinculo = 1;
    Audio_.sparo();
    this.aggiornaHud();
  }

  // ---------- Aggiornamento ----------
  aggiorna(dt) {
    if (this.pausa || this.finita) return;
    this.t += dt;
    this.rinculo = Math.max(0, this.rinculo - dt * 4);
    this.scossa = Math.max(0, this.scossa - dt);

    if (this.stato === 'battaglia' && this.fineTra == null) this.arrivoNavi();
    if (this.corrente != null) this.bariliALaDeriva();

    for (const n of this.navi) {
      if (n.stato === 'naviga') {
        n.x += n.vel * dt;
        if (n.x + n.w / 2 >= LINEA_DIFESA) this.naveArrivata(n);
      } else if (n.stato === 'fuoco') {
        n.x += n.vel * 0.2 * dt;
        n.p += dt / 0.5;
        if (n.p >= 1) { n.stato = 'affonda'; n.p = 0; }
      } else if (n.stato === 'affonda') {
        n.p += dt / 1.6;
      } else if (n.stato === 'ritira') {
        n.p += dt / 0.8;
      }
    }
    this.navi = this.navi.filter((n) => !((n.stato === 'affonda' || n.stato === 'ritira') && n.p >= 1));

    for (const b of this.palle) {
      b.p += dt / b.durata;
      if (b.p >= 1) this.atterra(b);
    }
    this.palle = this.palle.filter((b) => b.p < 1);

    for (const e of this.effetti) e.p += dt / e.durata;
    this.effetti = this.effetti.filter((e) => e.p < 1);

    // aiuto se non si spara per 5 secondi mentre le navi avanzano
    if (this.stato === 'battaglia' && this.colpi > 0 && this.t - this.ultimoSparo > 5 &&
        this.navi.some((n) => n.stato === 'naviga') && this.t > this.manoFino) {
      const n = this.navi.filter((v) => v.stato === 'naviga').sort((a, b) => b.x - a.x)[0];
      this.manoPos = [Math.min(n.x + n.w * 0.6, LINEA_DIFESA - 60), n.y - n.w * 0.15];
      this.manoFino = this.t + 3;
      this.messaggio(this.o.adatta(this.o.testi.aiuti_sparo.inattivo_5_secondi), 3);
    }

    // fine della battaglia
    if (this.fineTra == null) {
      if (this.forte <= 0) this.fineTra = this.t + 1.5;
      else if (this.stato === 'battaglia' && this.colpi <= 0 && this.palle.length === 0) this.fineTra = this.t + 1.5;
    } else if (this.t >= this.fineTra) {
      this.termina();
    }
    this.aggiornaHud();
  }

  // I barili oscillano avanti e indietro, con un'ampiezza che cresce piano piano.
  bariliALaDeriva() {
    const dt = this.t - this.corrente;
    const ampiezza = 130 * Math.min(1, dt / 1.5);
    const restanti = this.barili.filter((r) => !r.colpito);
    for (const r of restanti) {
      r.x = r.x0 + ampiezza * Math.sin(dt * 1.4 + r.fase) - ampiezza * Math.sin(r.fase) * Math.max(0, 1 - dt / 1.5);
      r.y = r.y0 + ampiezza * 0.2 * Math.sin(dt * 0.9 + r.fase);
    }
    if (restanti.length && this.stato === 'prova') this.manoPos = [restanti[0].x, restanti[0].y - 20];
  }

  arrivoNavi() {
    CONFIG.navi.forEach((tipo, i) => {
      if (this.t < this.timer[i]) return;
      this.timer[i] = this.t + this.liv.intervallo + Utili.caso(-1, 1);
      const y = Utili.caso(MARE_ALTO, MARE_BASSO);
      const s = 0.55 + 0.45 * (y - MARE_ALTO) / (MARE_BASSO - MARE_ALTO);
      const w = tipo.larghezza * s;
      this.navi.push({
        tipo, y, w, s, x: -w / 2 - 20, p: 0, stato: 'naviga',
        vel: (LINEA_DIFESA + 250) / tipo.attraversamento * this.liv.velocita,
      });
    });
  }

  naveArrivata(n) {
    n.stato = 'ritira';
    n.p = 0;
    const danno = Utili.intero(CONFIG.danno[0], CONFIG.danno[1]);
    this.forte = Math.max(0, this.forte - danno);
    this.scossa = 0.4;
    this.effetti.push({ tipo: 'esplosione', x: FORTE.x + Utili.caso(-120, 80), y: FORTE.y - Utili.caso(40, 180), s: 1, p: 0, durata: 0.8 });
    Audio_.colpoForte();
  }

  atterra(b) {
    const x = b.tx, y = b.ty;
    if (this.stato === 'prova') {
      const bar = this.barili.find((r) => !r.colpito && Math.hypot(r.x - x, (r.y - 15) - y) < 60 * r.s);
      if (bar) {
        bar.colpito = true;
        this.effetti.push({ tipo: 'esplosione', x: bar.x, y: bar.y - 15, s: bar.s, p: 0, durata: 0.8 });
        Audio_.esplosione();
        // l'addestramento finisce quando sono stati colpiti tutti e tre i barili
        const restanti = this.barili.filter((r) => !r.colpito);
        if (restanti.length) {
          // dopo il primo colpo la corrente sposta gli altri barili, come poi si muoveranno le navi
          const primo = this.corrente == null;
          if (primo) {
            this.corrente = this.t;
            restanti.forEach((r) => { r.x0 = r.x; r.y0 = r.y; });
          }
          const testi = this.o.testi.aiuti_sparo;
          this.messaggio(primo ? testi.barili_in_movimento : Utili.riempi(testi.barile_mancano, { barili: restanti.length }));
          this.manoPos = [restanti[0].x, restanti[0].y - 20];
          return;
        }
        this.messaggio(this.o.testi.aiuti_sparo.barile_colpito);
        this.stato = 'attesa';
        setTimeout(() => { if (!this.finita) this.iniziaFlotta(); }, 2200);
        return;
      }
    } else {
      // la nave più vicina a chi guarda (più in basso) che si trova sotto il colpo
      const colpite = this.navi
        .filter((n) => n.stato === 'naviga' && Math.abs(x - n.x) < n.w * 0.6 && y > n.y - n.w * 0.55 && y < n.y + 18 * n.s)
        .sort((a, c) => c.y - a.y);
      if (colpite.length) {
        const n = colpite[0];
        n.stato = 'fuoco';
        n.p = 0;
        this.punti += n.tipo.punti;
        this.affondate++;
        this.effetti.push({ tipo: 'esplosione', x, y, s: n.s, p: 0, durata: 0.7 });
        this.effetti.push({ tipo: 'punti', x: n.x, y: n.y - n.w * 0.6, testo: '+' + n.tipo.punti, p: 0, durata: 1.2 });
        Audio_.esplosione();
        return;
      }
    }
    const s = 0.55 + 0.45 * Math.max(0, (y - MARE_ALTO) / (MARE_BASSO - MARE_ALTO));
    this.effetti.push({ tipo: 'spruzzo', x, y, s, p: 0, durata: 0.8 });
    Audio_.tonfo();
  }

  termina() {
    this.finita = true;
    const vittoria = this.forte > 0;
    const bonus = CONFIG.bonusForte[this.statoForte];
    const esito = { vittoria, affondate: this.affondate, puntiNavi: this.punti, bonus, punti: this.punti + bonus };
    this.fumetto.classList.add('nascosto');
    this.hudRicarica.classList.remove('visibile');
    const testi = this.o.testi.fine_battaglia;
    const testo = Utili.riempi(vittoria ? testi.vittoria : testi.sconfitta, { navi: this.affondate });
    const el = Utili.el;
    const righe = [
      el('p', { class: 'grande' }, testo),
      el('p', {}, `Navi affondate: ${this.punti} punti · Forte: +${bonus} · Totale: ${esito.punti} punti`),
    ];
    const box = el('div', { class: 'velo' },
      el('div', { class: 'pergamena centrata' },
        ...righe,
        el('button', { class: 'pulsante', onclick: () => { Audio_.clic(); this.o.alTermine(esito); } }, 'Avanti'),
      ));
    this.o.ui.append(box);
    vittoria ? Audio_.fanfara() : Audio_.colpoForte();
  }

  // ---------- Disegno ----------
  disegna(ctx) {
    const t = this.t;
    Grafica.sfondoBattaglia(ctx, this.liv.scuola, t);
    Grafica.lineaDifesa(ctx, t);
    for (const b of this.barili) if (!b.colpito) Grafica.barile(ctx, b.x, b.y, b.s, t);
    const ordinate = this.navi.slice().sort((a, b) => a.y - b.y);
    for (const n of ordinate) {
      ctx.save();
      if (n.stato === 'ritira') ctx.globalAlpha = 1 - n.p;
      Grafica.nave(ctx, this.liv.scuola, n.tipo.tipo, n.x, n.y, n.w, n.stato === 'ritira' ? 'naviga' : n.stato, n.p, t);
      ctx.restore();
    }
    Grafica.forte(ctx, this.statoForte, this.scossa > 0);
    // il disegno definitivo del forte ha già fuoco e fumo
    if (this.statoForte >= 2 && !Utili.immagini['forte-' + this.statoForte]) Grafica.fiamme(ctx, FORTE.x + 40, FORTE.y - 120, 60, t, 1);
    Grafica.cannone(ctx, this.angolo, this.rinculo);
    for (const b of this.palle) {
      const x = b.x0 + (b.tx - b.x0) * b.p;
      const y = b.y0 + (b.ty - b.y0) * b.p - Math.sin(b.p * Math.PI) * b.arco;
      Grafica.palla(ctx, x, y, 13 - 5 * b.p);
    }
    for (const e of this.effetti) {
      if (e.tipo === 'spruzzo') Grafica.spruzzo(ctx, e.x, e.y, e.s, e.p);
      else if (e.tipo === 'esplosione') Grafica.esplosione(ctx, e.x, e.y, e.s, e.p);
      else if (e.tipo === 'vampata') Grafica.vampata(ctx, e.angolo, e.p);
      else if (e.tipo === 'punti') {
        ctx.save();
        ctx.globalAlpha = 1 - e.p;
        ctx.font = 'bold 44px Alegreya, Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffe28a';
        ctx.strokeStyle = '#3a2412';
        ctx.lineWidth = 6;
        ctx.strokeText(e.testo, e.x, e.y - e.p * 50);
        ctx.fillText(e.testo, e.x, e.y - e.p * 50);
        ctx.restore();
      }
    }
    if (this.liv.notte) {
      ctx.fillStyle = 'rgba(10,20,60,0.22)';
      ctx.fillRect(0, 0, W, H);
    }
    if (t < this.manoFino && !this.finita) Grafica.mano(ctx, this.manoPos[0], this.manoPos[1], t);
  }

  chiudi() {
    clearTimeout(this._timerFumetto);
    this.finita = true;
  }
}
