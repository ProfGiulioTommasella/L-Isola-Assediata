// Il filo del gioco: titolo, mappa, abitante con le domande, battaglia, finale del Re, diario di bordo.
const tela = document.getElementById('tela');
const ctx = tela.getContext('2d');
const ui = document.getElementById('ui');
const palco = document.getElementById('palco');
const el = Utili.el;

const G = {
  domande: [], testi: null,
  scena: null,              // { disegna(ctx, t), aggiorna?(dt), tocco?(x, y) }
  mouse: null,              // true se il primo comando è stato col mouse
  t: 0,
};

// ---------- Avvio ----------
async function avvia() {
  adattaPalco();
  window.addEventListener('resize', adattaPalco);
  document.addEventListener('pointerdown', () => Audio_.sblocca(), { capture: true });
  tela.addEventListener('pointerdown', toccoTela);
  tela.addEventListener('pointermove', puntaTela);
  palco.addEventListener('pointerdown', (e) => { if (G.mouse == null) G.mouse = e.pointerType === 'mouse'; }, { capture: true });
  const audio = document.getElementById('pulsante-audio');
  audio.textContent = Audio_.attivo ? '🔊' : '🔇';
  audio.addEventListener('click', () => { audio.textContent = Audio_.cambia() ? '🔊' : '🔇'; });

  const [d, t] = await Promise.all([
    fetch('data/domande.json').then((r) => r.json()),
    fetch('data/testi.json').then((r) => r.json()),
  ]);
  G.domande = d.domande;
  G.testi = t;
  document.getElementById('ruota-testo').textContent = t.interfaccia.ruota;

  // Immagini definitive: immagini/elenco.json dice quali ci sono già.
  // Quelle che mancano vengono disegnate dal gioco.
  const elenco = await fetch('immagini/elenco.json').then((r) => r.json()).catch(() => ({}));
  await Promise.all(Object.entries(elenco).filter(([n]) => !n.startsWith('_'))
    .map(([nome, percorso]) => Utili.caricaImmagine(nome, percorso)));

  requestAnimationFrame(ciclo);
  titolo();
}

function adattaPalco() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  palco.style.transform = `translate(-50%, -50%) scale(${s})`;
}

let ultimo = performance.now();
function ciclo(ora) {
  const dt = Math.min(0.05, (ora - ultimo) / 1000);
  ultimo = ora;
  G.t += dt;
  if (G.scena) {
    if (G.scena.aggiorna) G.scena.aggiorna(dt);
    G.scena.disegna(ctx, G.t);
  }
  requestAnimationFrame(ciclo);
}

function puntoTela(e) {
  const r = tela.getBoundingClientRect();
  return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height];
}

function toccoTela(e) {
  if (G.scena && G.scena.tocco) G.scena.tocco(...puntoTela(e));
}

// Col mouse il cannone segue il puntatore anche senza cliccare.
function puntaTela(e) {
  if (G.scena && G.scena.punta) G.scena.punta(...puntoTela(e));
}

// "Toccate" diventa "Cliccate" per chi usa il mouse.
function adatta(testo) {
  if (testo.includes('(o cliccate)')) return testo;
  testo = testo.replace(' (col mouse: Cliccate)', '');
  if (!G.mouse) return testo;
  return testo.replace(/\bToccate\b/g, 'Cliccate').replace(/\btoccate\b/g, 'cliccate');
}

const I = () => G.testi.interfaccia;

function pulisci() {
  ui.replaceChildren();
}

function scenaFissa(disegno) {
  G.scena = { disegna: disegno };
}

function bannerAllenamento() {
  let b = document.getElementById('banner');
  if (!b) {
    b = el('div', { id: 'banner' });
    palco.append(b);
  }
  b.textContent = G.testi.docente.avviso_allenamento;
  b.style.display = P.allenamento ? 'block' : 'none';
}

// ---------- Partita ----------
const P = {};   // stato della partita in corso

function nuovaPartita(opzioni) {
  Object.assign(P, {
    nome: '', livello: 0, giuste: [0, 0, 0, 0], esiti: [], puntiTotali: 0,
    sbagliate: [], generaliUsate: new Set(), provaFatta: false,
    allenamento: false, soloLivello: null,
  }, opzioni || {});
  bannerAllenamento();
}

function grado(punti, battaglie) {
  if (battaglie === 0) return CONFIG.gradi[0];
  const rif = CONFIG.riferimentoPunti.slice(0, battaglie).reduce((a, b) => a + b, 0);
  const r = punti / rif;
  return CONFIG.gradi[CONFIG.sogliaGradi.filter((s) => r >= s).length];
}

function valori(extra) {
  return Object.assign({
    nome: P.nome,
    giuste: P.giuste.reduce((a, b) => a + b, 0),
    punti: P.puntiTotali,
    grado: grado(P.puntiTotali, P.esiti.length),
  }, extra || {});
}

// ---------- Schermate ----------
function titolo() {
  Audio_.ferma();
  nuovaPartita();
  pulisci();
  scenaFissa((c, t) => Grafica.inizio(c, t));
  const stat = Utili.leggi('statistiche', null);
  ui.append(el('div', { class: 'titolo' },
    el('h1', {}, "L'Isola Assediata"),
    el('p', { class: 'sottotitolo' }, I().sottotitolo),
    el('button', { class: 'pulsante grande', onclick: () => { Audio_.clic(); intro(); } }, I().inizia),
    stat ? el('p', { class: 'record' }, Utili.riempi(I().record, stat)) : null,
  ));
  ui.append(el('button', { class: 'pulsante piccolo angolo', onclick: () => docenteAccesso() }, I().area_docente));
}

function intro() {
  dialogo(G.testi.inizio.intro, { sfondo: (c, t) => Grafica.inizio(c, t), poi: chiediNome });
}

function chiediNome() {
  pulisci();
  const campo = el('input', { type: 'text', maxlength: 20, autocomplete: 'off', value: Utili.leggi('nome', '') });
  const ok = el('button', { class: 'pulsante', onclick: conferma }, I().conferma);
  function conferma() {
    const nome = campo.value.trim();
    if (!nome) { campo.focus(); return; }
    Audio_.clic();
    P.nome = nome.charAt(0).toUpperCase() + nome.slice(1);
    if (!P.allenamento) Utili.scrivi('nome', P.nome);
    mappa();
  }
  campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') conferma(); });
  ui.append(el('div', { class: 'pergamena centrata' },
    el('label', { class: 'grande' }, G.testi.inizio.chiedi_nome), campo, ok));
  setTimeout(() => campo.focus(), 50);
}

function mappa() {
  pulisci();
  Audio_.ferma();
  const prossima = CONFIG.livelli[P.livello];
  const stati = {};
  CONFIG.livelli.forEach((l, i) => {
    stati[l.scuola] = i < P.esiti.length ? (P.esiti[i].vittoria ? 'difesa' : 'caduta') : 'libera';
  });
  G.scena = {
    disegna: (c, t) => Grafica.mappa(c, stati, prossima.scuola, t),
    tocco: (x, y) => {
      const [tx, ty] = Grafica.POSIZIONI_TORRI[prossima.scuola];
      if (Math.hypot(x - tx, y - (ty - 50)) < 130) { Audio_.clic(); livello(P.livello); }
    },
  };
  ui.append(el('div', { class: 'indicazione' }, adatta(Utili.riempi(I().mappa_indicazione, { torre: prossima.torre }))));
  if (P.esiti.length) ui.append(el('div', { class: 'stato-partita' }, Utili.riempi(I().mappa_stato, valori())));
}

function livello(i) {
  P.livello = i;
  const cfg = CONFIG.livelli[i];
  const testi = G.testi.livelli[i];
  Audio_.suona(cfg.scuola);
  const righe = [testi.arrivo[0]];
  const ultimo = P.esiti[i - 1];
  if (testi.commento_battaglia && ultimo) {
    righe.push(ultimo.vittoria ? testi.commento_battaglia.forte_retto : testi.commento_battaglia.forte_caduto);
    righe.push(testi.grado_attuale);
  }
  righe.push(...testi.arrivo.slice(1));
  P.colpi = cfg.base;
  dialogo(righe.map((r) => Utili.riempi(r, valori())), {
    sfondo: (c) => Grafica.scena(c, cfg.scuola),
    poi: () => quiz(i),
    colpi: true,
  });
}

// ---------- Dialoghi ----------
// Mostra le battute una alla volta sulla pergamena; "Salta" le salta tutte.
function dialogo(righe, o) {
  let k = 0;
  pulisci();
  if (o.sfondo) scenaFissa(o.sfondo);
  const testo = el('p', { class: 'battuta' });
  const avanti = el('button', { class: 'pulsante' }, I().avanti);
  const salta = el('button', { class: 'pulsante piccolo secondario' }, I().salta);
  const box = el('div', { class: 'pergamena dialogo' }, testo, el('div', { class: 'riga-pulsanti' }, salta, avanti));
  const mostra = () => { testo.textContent = righe[k]; salta.style.visibility = k < righe.length - 1 ? 'visible' : 'hidden'; };
  const fine = () => { Audio_.clic(); o.poi(); };
  avanti.onclick = (e) => {
    e.stopPropagation();
    Audio_.clic();
    if (++k >= righe.length) o.poi(); else mostra();
  };
  salta.onclick = (e) => { e.stopPropagation(); fine(); };
  box.addEventListener('click', () => avanti.click());
  ui.append(box);
  if (o.colpi) mostraColpi();
  mostra();
}

let contatoreColpi = null;
function mostraColpi(aggiunta) {
  if (!contatoreColpi || !ui.contains(contatoreColpi)) {
    contatoreColpi = el('div', { class: 'hud-box contatore' });
    ui.append(contatoreColpi);
  }
  contatoreColpi.replaceChildren(el('span', { class: 'icona-palla' }), `${I().colpi}: ${P.colpi}`,
    aggiunta ? el('span', { class: 'aggiunta' }, ' +' + aggiunta) : '');
}

// ---------- Domande ----------
function scegliDomande(cfg) {
  const scuola = Utili.mescola(G.domande.filter((q) => q.scuola === cfg.domandeScuola)).slice(0, CONFIG.domandePerLivello);
  let generali = G.domande.filter((q) => q.scuola === 'Generale' && !P.generaliUsate.has(q.id));
  if (!generali.length) generali = G.domande.filter((q) => q.scuola === 'Generale');
  const g = Utili.mescola(generali)[0];
  P.generaliUsate.add(g.id);
  const lista = scuola.slice();
  lista.splice(Utili.intero(0, lista.length), 0, g);
  return lista;
}

function quiz(i) {
  const cfg = CONFIG.livelli[i];
  const domande = scegliDomande(cfg);
  let k = 0, giuste = 0;
  const prossima = () => {
    if (k >= domande.length) {
      P.giuste[i] = giuste;
      const t = G.testi.livelli[i];
      const v = valori({ giuste, colpi: P.colpi });
      dialogo([Utili.riempi(G.testi.domande.fine, v), ...t.prima_della_battaglia.map((r) => Utili.riempi(r, v))], {
        sfondo: (c) => Grafica.scena(c, cfg.scuola), poi: () => battaglia(i), colpi: true,
      });
      return;
    }
    mostraDomanda(domande[k++], (giusta) => {
      if (giusta) { giuste++; P.colpi += cfg.perGiusta; mostraColpi(cfg.perGiusta); }
    }, prossima);
  };
  prossima();
}

function testoRisposta(q) {
  if (q.tipo === 'multipla') return q.opzioni[q.risposte_accettate[0]];
  if (q.tipo === 'vero_falso') return q.risposte_accettate[0] === 'vero' ? I().vero : I().falso;
  return q.coppie.map((c) => `${c.sinistra} → ${c.destra}`).join('; ');
}

function mostraDomanda(q, risultato, poi) {
  pulisci();
  mostraColpi();
  const box = el('div', { class: 'pergamena quiz' });
  box.append(el('p', { class: 'domanda' }, q.domanda));
  ui.append(box);

  const rispondi = (giusta, pulsanti) => {
    Audio_[giusta ? 'giusta' : 'sbagliata']();
    risultato(giusta);
    if (!giusta && !P.allenamento) {
      P.sbagliate.push({ scuola: q.scuola, domanda: q.domanda, risposta: testoRisposta(q), spiegazione: q.spiegazione });
    }
    const frasi = G.testi.domande[giusta ? 'giusta' : 'sbagliata'];
    const fb = el('div', { class: 'riscontro ' + (giusta ? 'ok' : 'no') },
      el('p', {}, el('strong', {}, Utili.mescola(frasi)[0] + ' '), q.spiegazione));
    if (!giusta && q.tipo === 'abbinamento') {
      fb.append(el('p', { class: 'piccolo' }, I().abbinamenti_giusti + ' ' + testoRisposta(q)));
    }
    fb.append(el('div', { class: 'riga-pulsanti' }, el('button', { class: 'pulsante', onclick: () => { Audio_.clic(); poi(); } }, I().avanti)));
    box.append(fb);
    if (pulsanti) pulsanti.forEach((p) => { p.disabled = true; });
  };

  if (q.tipo === 'multipla' || q.tipo === 'vero_falso') {
    const scelte = q.tipo === 'multipla'
      ? Utili.mescola(Object.keys(q.opzioni)).map((k) => [k, q.opzioni[k]])
      : [['vero', I().vero], ['falso', I().falso]];
    const griglia = el('div', { class: q.tipo === 'multipla' ? 'opzioni' : 'opzioni due' });
    const pulsanti = scelte.map(([k, testo]) => el('button', {
      class: 'opzione',
      onclick: () => {
        const giusta = q.risposte_accettate.includes(k);
        pulsanti.forEach((p, j) => { if (q.risposte_accettate.includes(scelte[j][0])) p.classList.add('giusta'); });
        if (!giusta) pulsanti[scelte.findIndex((s) => s[0] === k)].classList.add('sbagliata');
        rispondi(giusta, pulsanti);
      },
    }, testo));
    griglia.append(...pulsanti);
    box.append(griglia);
    return;
  }

  // Abbinamento: si tocca una voce a sinistra e poi una a destra.
  box.append(el('p', { class: 'piccolo' }, adatta(I().abbinamento_istruzioni)));
  const destra = Utili.mescola(q.coppie.map((c) => c.destra));
  const scelta = new Array(q.coppie.length).fill(null);     // indice a destra scelto per ogni voce a sinistra
  let attiva = null;
  const colori = ['c0', 'c1', 'c2', 'c3'];
  const sx = q.coppie.map((c, i) => el('button', { class: 'opzione', onclick: () => { attiva = i; aggiorna(); } }, c.sinistra));
  const dx = destra.map((testo, j) => el('button', {
    class: 'opzione',
    onclick: () => {
      if (attiva == null) return;
      scelta.forEach((v, i) => { if (v === j) scelta[i] = null; });
      scelta[attiva] = j;
      attiva = scelta.findIndex((v) => v == null);
      if (attiva < 0) attiva = null;
      Audio_.clic();
      aggiorna();
    },
  }, testo));
  const conferma = el('button', {
    class: 'pulsante', disabled: true,
    onclick: () => {
      const giusta = scelta.every((j, i) => destra[j] === q.coppie[i].destra);
      sx.forEach((b, i) => b.classList.add(destra[scelta[i]] === q.coppie[i].destra ? 'giusta' : 'sbagliata'));
      conferma.remove();
      rispondi(giusta, [...sx, ...dx]);
    },
  }, I().conferma);
  function aggiorna() {
    sx.forEach((b, i) => {
      b.className = 'opzione' + (scelta[i] != null ? ' ' + colori[i] : '') + (attiva === i ? ' attiva' : '');
    });
    dx.forEach((b, j) => {
      const i = scelta.indexOf(j);
      b.className = 'opzione' + (i >= 0 ? ' ' + colori[i] : '');
    });
    conferma.disabled = scelta.some((v) => v == null);
  }
  attiva = 0;
  aggiorna();
  box.append(el('div', { class: 'abbinamento' }, el('div', {}, ...sx), el('div', {}, ...dx)),
    el('div', { class: 'riga-pulsanti' }, conferma));
}

// ---------- Battaglia ----------
function battaglia(i) {
  pulisci();
  const cfg = CONFIG.livelli[i];
  const prova = !P.provaFatta;
  P.provaFatta = true;
  const b = new Battaglia({
    livello: cfg, colpi: P.colpi, prova, testi: G.testi, adatta, ui,
    alTermine: (esito) => {
      b.chiudi();
      P.esiti[i] = esito;
      P.puntiTotali += esito.punti;
      if (P.soloLivello != null) { docenteMenu(); return; }
      if (i < CONFIG.livelli.length - 1) { P.livello = i + 1; mappa(); } else finale();
    },
  });
  G.scena = { disegna: (c) => b.disegna(c), aggiorna: (dt) => b.aggiorna(dt), tocco: (x, y) => b.tocco(x, y), punta: (x, y) => b.punta(x, y) };
}

// ---------- Finale del Re ----------
function finale() {
  Audio_.ferma();
  const f = G.testi.finale;
  const v = valori();
  const esito = f.esiti.find((e) => v.giuste >= e.da && v.giuste <= e.a);
  Audio_.fanfara();
  dialogo([f.apertura, esito.testo, f.commento_battaglia, f.chiusura].map((r) => Utili.riempi(r, v)), {
    sfondo: (c, t) => Grafica.salaDelRe(c, t), poi: diario,
  });
}

// ---------- Diario di bordo ----------
function diario() {
  pulisci();
  const v = valori();
  let stat = Utili.leggi('statistiche', { partite: 0, migliore: 0 });
  if (!P.allenamento) {
    stat = { partite: stat.partite + 1, migliore: Math.max(stat.migliore, v.giuste) };
    Utili.scrivi('statistiche', stat);
  }
  const r = G.testi.riepilogo;
  const contenuto = () => {
    const e = r.etichette;
    const perScuola = CONFIG.livelli.map((l, i) => `${l.nome} ${P.giuste[i]}/4`).join(' · ');
    const div = el('div', { class: 'diario' },
      el('h1', {}, r.titolo),
      el('table', {},
        el('tr', {}, el('th', {}, e.nome), el('td', {}, P.nome)),
        el('tr', {}, el('th', {}, e.data), el('td', {}, Utili.dataOggi())),
        el('tr', {}, el('th', {}, e.giuste), el('td', {}, `${v.giuste}/16 (${perScuola})`)),
        el('tr', {}, el('th', {}, e.grado), el('td', {}, `${v.grado} (${v.punti} ${e.punti})`)),
        el('tr', {}, el('th', {}, e.migliore), el('td', {}, `${stat.migliore}/16`)),
        el('tr', {}, el('th', {}, e.partite), el('td', {}, String(stat.partite))),
      ),
      el('h2', {}, r.da_ripassare),
      P.sbagliate.length ? null : el('p', {}, '—'),
      ...P.sbagliate.map((s) => el('div', { class: 'ripasso' },
        el('p', {}, el('strong', {}, r.voce_ripasso.domanda + ' '), `(${s.scuola}) ${s.domanda}`),
        el('p', {}, el('strong', {}, r.voce_ripasso.risposta_giusta + ': '), s.risposta),
        el('p', {}, el('strong', {}, r.voce_ripasso.spiegazione + ': '), s.spiegazione))),
    );
    if (P.allenamento) div.prepend(el('p', { class: 'avviso' }, G.testi.docente.avviso_allenamento));
    return div;
  };
  const scarica = () => {
    const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${r.titolo} - ${P.nome}</title>
<style>body{font-family:Georgia,serif;max-width:800px;margin:2em auto;padding:0 1em;line-height:1.4;color:#222}
th{text-align:left;padding-right:1em}td,th{padding:4px 0}.ripasso{border-top:1px solid #ccc;padding:.4em 0}</style></head>
<body>${contenuto().outerHTML}</body></html>`;
    const a = el('a', { href: URL.createObjectURL(new Blob([html], { type: 'text/html' })), download: `diario-di-bordo-${P.nome}.html` });
    document.body.append(a);
    a.click();
    a.remove();
  };
  const stampa = () => {
    document.getElementById('stampa').replaceChildren(contenuto());
    window.print();
  };
  scenaFissa((c, t) => Grafica.salaDelRe(c, t));
  ui.append(el('div', { class: 'pergamena pagina' }, contenuto(),
    el('div', { class: 'riga-pulsanti' },
      el('button', { class: 'pulsante', onclick: scarica }, r.pulsanti.scarica),
      el('button', { class: 'pulsante', onclick: stampa }, r.pulsanti.stampa),
      el('button', { class: 'pulsante', onclick: () => (P.allenamento ? docenteMenu() : titolo()) }, r.pulsanti.ricomincia))));
}

// ---------- Area docente ----------
function docenteAccesso() {
  pulisci();
  const d = G.testi.docente;
  const campo = el('input', { type: 'password', autocomplete: 'off' });
  const errore = el('p', { class: 'errore' });
  const entra = () => {
    if (Utili.impronta(campo.value.trim().toLowerCase()) === CONFIG.impronta) docenteMenu();
    else { errore.textContent = d.errore; campo.select(); }
  };
  campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') entra(); });
  ui.append(el('div', { class: 'pergamena centrata' },
    el('h2', {}, d.titolo), el('label', {}, d.parola_d_ordine), campo, errore,
    el('div', { class: 'riga-pulsanti' },
      el('button', { class: 'pulsante secondario', onclick: titolo }, d.menu.esci),
      el('button', { class: 'pulsante', onclick: entra }, d.entra))));
  setTimeout(() => campo.focus(), 50);
}

function docenteMenu() {
  Audio_.ferma();
  nuovaPartita();
  pulisci();
  scenaFissa((c, t) => Grafica.inizio(c, t));
  const d = G.testi.docente;
  const livelli = el('div', { class: 'riga-pulsanti' }, ...CONFIG.livelli.map((l, i) => el('button', {
    class: 'pulsante',
    onclick: () => { nuovaPartita({ allenamento: true, soloLivello: i, nome: 'Docente' }); livello(i); },
  }, l.nome)));
  ui.append(el('div', { class: 'pergamena centrata' },
    el('h2', {}, d.titolo),
    el('p', {}, d.menu.livello), livelli,
    el('div', { class: 'colonna' },
      el('button', { class: 'pulsante', onclick: tutteLeDomande }, d.menu.domande),
      el('button', { class: 'pulsante', onclick: () => { nuovaPartita({ allenamento: true }); chiediNome(); } }, d.menu.allenamento),
      el('button', { class: 'pulsante secondario', onclick: titolo }, d.menu.esci))));
}

function tutteLeDomande() {
  pulisci();
  const gruppi = ['Generale', ...CONFIG.livelli.map((l) => l.domandeScuola)];
  ui.append(el('div', { class: 'pergamena pagina' },
    el('h1', {}, G.testi.docente.menu.domande),
    ...gruppi.map((g) => el('div', {},
      el('h2', {}, g),
      ...G.domande.filter((q) => q.scuola === g).map((q) => el('div', { class: 'ripasso' },
        el('p', {}, el('strong', {}, q.id + ' '), q.domanda),
        el('p', {}, el('strong', {}, '✔ '), testoRisposta(q)),
        q.tipo === 'multipla' ? el('p', { class: 'piccolo' }, 'Opzioni: ' + Object.values(q.opzioni).join(' · ')) : null,
        el('p', { class: 'piccolo' }, q.spiegazione))))),
    el('div', { class: 'riga-pulsanti' }, el('button', { class: 'pulsante', onclick: docenteMenu }, I().avanti))));
}

avvia();
