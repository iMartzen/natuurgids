// Overzichtspagina landschapslijn: kaart en hoogteprofiel uit de echte data.
import { laadTerrein, route, fmt } from './landschapslijn-terrein.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};
const tekst = (parent, x, y, s, attrs = {}) => { const t = el('text', { x, y, ...attrs }, parent); t.textContent = s; return t; };

const LAAG = [207, 226, 190], HOOG = [233, 214, 160], WATER = [92, 154, 196];

function terreinBeeld(t) {
  const c = document.createElement('canvas');
  c.width = t.nx; c.height = t.ny;
  const ctx = c.getContext('2d'), img = ctx.createImageData(t.nx, t.ny);
  for (let r = 0; r < t.ny; r++) for (let k = 0; k < t.nx; k++) {
    const i = r * t.nx + k, o = i * 4;
    if (t.water[i]) { img.data.set([...WATER, 255], o); continue; }
    const n = Math.min(1, Math.max(0, (t.h[i] - t.lo) / (t.hi - t.lo)));
    // eenvoudige reliëfschaduw: licht uit het noordwesten
    const dzx = t.h[r * t.nx + Math.min(t.nx - 1, k + 1)] - t.h[r * t.nx + Math.max(0, k - 1)];
    const dzy = t.h[Math.min(t.ny - 1, r + 1) * t.nx + k] - t.h[Math.max(0, r - 1) * t.nx + k];
    const schaduw = Math.max(0.72, Math.min(1.18, 1 - (dzx - dzy) * 0.35));
    const kleur = LAAG.map((a, j) => Math.round(Math.min(255, (a + (HOOG[j] - a) * n) * schaduw)));
    img.data.set([...kleur, 255], o);
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

function kaart(houder, t, punten) {
  const B = t.xmax - t.xmin, H = t.ymax - t.ymin;
  const svg = el('svg', { viewBox: `0 0 ${B} ${H}`, role: 'img', 'aria-label': 'Kaart van de boorpunten op het AHN-reliëf' });
  el('image', { href: terreinBeeld(t), x: 0, y: 0, width: B, height: H, preserveAspectRatio: 'none' }, svg);
  const px = x => x - t.xmin, py = y => t.ymax - y;

  const grootste = t.plassen.reduce((a, b) => (b.cellen > a.cellen ? b : a), t.plassen[0]);
  if (grootste) tekst(svg, grootste.kolom * t.cel, grootste.rij * t.cel + 8, 'Oud Meer', { class: 'll-kaart__water' });

  const p = punten.filter(q => q.RD_x != null);
  el('polyline', { points: p.map(q => `${px(q.RD_x)},${py(q.RD_y)}`).join(' '), class: 'll-kaart__route' }, svg);
  for (const q of p) {
    const g = el('g', { class: 'll-kaart__punt' + (q.soort === 'wandje' ? ' is-wandje' : '') }, svg);
    if (q.soort === 'wandje') el('rect', { x: px(q.RD_x) - 9, y: py(q.RD_y) - 9, width: 18, height: 18, transform: `rotate(45 ${px(q.RD_x)} ${py(q.RD_y)})` }, g);
    else el('circle', { cx: px(q.RD_x), cy: py(q.RD_y), r: 10 }, g);
    tekst(g, px(q.RD_x), py(q.RD_y) - 18, q.punt);
  }
  // schaalbalk en noordpijl
  const sb = el('g', { class: 'll-kaart__schaal' }, svg);
  el('rect', { x: 24, y: H - 34, width: 100, height: 8 }, sb);
  tekst(sb, 74, H - 42, '100 m');
  const np = el('g', { class: 'll-kaart__noord' }, svg);
  el('path', { d: `M ${B - 40} 64 L ${B - 52} 92 L ${B - 40} 84 L ${B - 28} 92 Z` }, np);
  tekst(np, B - 40, 52, 'N');
  houder.replaceChildren(svg);
}

function profiel(houder, t, punten) {
  const { monsters, knopen, lengte } = route(punten, t);
  const W = 720, Hh = 300, m = { l: 52, r: 16, t: 34, b: 44 };
  const hoogtes = monsters.filter(s => s.h != null).map(s => s.h)
    .concat(punten.map(p => p.hoogte_AHN_m_NAP), punten.map(p => p.water_m_NAP)).filter(v => v != null);
  const ylo = Math.floor(Math.min(...hoogtes) * 2) / 2 - 0.5, yhi = Math.ceil(Math.max(...hoogtes) * 2) / 2 + 0.5;
  const X = d => m.l + (d / lengte) * (W - m.l - m.r);
  const Y = v => m.t + (1 - (v - ylo) / (yhi - ylo)) * (Hh - m.t - m.b);
  const svg = el('svg', { viewBox: `0 0 ${W} ${Hh}`, role: 'img', 'aria-label': 'Hoogteprofiel langs de route van west naar oost' });

  const as = el('g', { class: 'll-profiel__as' }, svg);
  for (let v = Math.ceil(ylo); v <= yhi; v += 0.5) {
    el('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v) }, as);
    tekst(as, m.l - 6, Y(v) + 4, fmt(v, 1), { 'text-anchor': 'end' });
  }
  for (let d = 0; d <= lengte; d += 200) tekst(as, X(d), Hh - m.b + 18, `${d}`, { 'text-anchor': 'middle' });
  tekst(as, m.l, 16, 'm NAP', { 'text-anchor': 'start' });
  tekst(as, W - m.r, Hh - 6, 'afstand langs de route (m)', { 'text-anchor': 'end' });

  // terrein als gevuld vlak, onderbroken bij open water
  let stuk = [];
  const sluit = () => {
    if (stuk.length > 1) {
      const d = `M ${X(stuk[0].afstand)} ${Y(ylo)} ` + stuk.map(s => `L ${X(s.afstand)} ${Y(s.h)}`).join(' ') + ` L ${X(stuk.at(-1).afstand)} ${Y(ylo)} Z`;
      el('path', { d, class: 'll-profiel__grond' }, svg);
    }
    stuk = [];
  };
  const plassen = [];
  let water = null;
  for (const s of monsters) {
    if (s.h == null) {
      sluit();
      if (!water) { water = { van: s.afstand, peil: s.water.peil }; plassen.push(water); }
      water.tot = s.afstand + 5;
    } else {
      water = null;
      stuk.push(s);
    }
  }
  sluit();
  for (const w of plassen) {
    el('rect', { x: X(w.van), width: Math.max(2, X(w.tot) - X(w.van)), y: Y(w.peil), height: Y(ylo) - Y(w.peil), class: 'll-profiel__water' }, svg);
  }
  // één label, boven het breedste stuk open water
  const breedste = plassen.reduce((a, b) => (!a || b.tot - b.van > a.tot - a.van ? b : a), null);
  if (breedste) tekst(svg, (X(breedste.van) + X(breedste.tot)) / 2, Y(ylo) - 8, 'open water', { class: 'll-profiel__waterlabel' });

  for (const { punt: p, afstand } of knopen) {
    if (p.hoogte_AHN_m_NAP == null) continue;
    const g = el('g', { class: 'll-profiel__punt' + (p.soort === 'wandje' ? ' is-wandje' : '') }, svg);
    if (p.water_m_NAP != null) {
      el('line', { x1: X(afstand), x2: X(afstand), y1: Y(p.hoogte_AHN_m_NAP), y2: Y(p.water_m_NAP), class: 'll-profiel__pijl' }, svg);
      el('path', { d: `M ${X(afstand) - 5} ${Y(p.water_m_NAP) - 8} L ${X(afstand) + 5} ${Y(p.water_m_NAP) - 8} L ${X(afstand)} ${Y(p.water_m_NAP)} Z`, class: 'll-profiel__pijlkop' }, svg);
      tekst(svg, X(afstand) + 8, Y(p.water_m_NAP) + 4, `water ${fmt(p.water_m_NAP)}`, { class: 'll-profiel__waterlabel', 'text-anchor': 'start' });
    }
    el('circle', { cx: X(afstand), cy: Y(p.hoogte_AHN_m_NAP), r: 6 }, g);
    tekst(g, X(afstand), Y(p.hoogte_AHN_m_NAP) - 12, p.punt, { 'text-anchor': 'middle' });
  }
  houder.replaceChildren(svg);
}

async function start() {
  const data = JSON.parse(document.getElementById('ll-data').textContent);
  const k = document.getElementById('ll-kaart'), p = document.getElementById('ll-profiel');
  try {
    const t = await laadTerrein(k.dataset.terrein);
    kaart(k, t, data.punten);
    profiel(p, t, data.punten);
  } catch (e) {
    k.textContent = 'De kaart kon niet laden.';
    console.error(e);
  }
}
start();
