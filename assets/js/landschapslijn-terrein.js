// Gedeelde terreinlogica voor de landschapslijn (overzicht en 3D).
// Leest het AHN-grid (assets/data/oud-meer-terrein.json) en maakt er een
// doorlopend terrein van: kleine gaten zonder AHN-data worden opgevuld met de
// hoogte eromheen, grote gaten zijn open water. Het waterpeil wordt geschat
// uit de laagste oevers; de bodem onder water is niet gemeten.

const MIN_WATER_CELLEN = 50; // kleiner = gat in de data, geen water

export async function laadTerrein(url) {
  // Alleen terreindata van de eigen site laden.
  const bron = new URL(url, location.href);
  if (bron.origin !== location.origin) throw new Error('Terreindata moet van dezelfde site komen');
  const antwoord = await fetch(bron, { credentials: 'omit' });
  if (!antwoord.ok) throw new Error(`Terreindata niet gevonden (${antwoord.status})`);
  const t = await antwoord.json();
  if (!Number.isInteger(t.nx) || !Number.isInteger(t.ny) || !Array.isArray(t.hoogtes_cm) || t.hoogtes_cm.length !== t.nx * t.ny) {
    throw new Error('Terreindata heeft een onverwacht formaat');
  }
  const { nx, ny, cel, x0, y0 } = t;
  const n = nx * ny;
  const h = new Float32Array(n);
  for (let i = 0; i < n; i++) h[i] = t.hoogtes_cm[i] == null ? NaN : t.hoogtes_cm[i] / 100;

  const water = new Int32Array(n); // 0 = land, anders nummer van het water
  const plassen = [];
  const label = new Int32Array(n);
  let k = 0;
  for (let s = 0; s < n; s++) {
    if (!Number.isNaN(h[s]) || label[s]) continue;
    k++;
    const cellen = [s], oever = [];
    label[s] = k;
    for (let q = 0; q < cellen.length; q++) {
      const c = cellen[q], r = Math.floor(c / nx), col = c % nx;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const rr = r + dr, cc = col + dc;
        if (rr < 0 || rr >= ny || cc < 0 || cc >= nx) continue;
        const j = rr * nx + cc;
        if (Number.isNaN(h[j])) { if (!label[j]) { label[j] = k; cellen.push(j); } }
        else oever.push(h[j]);
      }
    }
    oever.sort((a, b) => a - b);
    if (cellen.length < MIN_WATER_CELLEN) {
      const gem = oever.length ? oever.reduce((a, b) => a + b, 0) / oever.length : 0;
      for (const c of cellen) h[c] = gem;
    } else {
      const peil = oever[Math.floor(oever.length * 0.05)];
      let sr = 0, sc = 0;
      for (const c of cellen) { h[c] = peil - 1; water[c] = plassen.length + 1; sr += Math.floor(c / nx); sc += c % nx; }
      plassen.push({ peil, cellen: cellen.length, rij: sr / cellen.length, kolom: sc / cellen.length });
    }
  }

  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < n; i++) if (!water[i]) { lo = Math.min(lo, h[i]); hi = Math.max(hi, h[i]); }

  // RD -> fractionele rij/kolom
  const rc = (x, y) => [(y0 - y) / cel, (x - x0) / cel];
  const at = (r, c) => h[Math.min(ny - 1, Math.max(0, r)) * nx + Math.min(nx - 1, Math.max(0, c))];
  function hoogte(x, y) {
    const [r, c] = rc(x, y);
    const r0 = Math.floor(r), c0 = Math.floor(c), fr = r - r0, fc = c - c0;
    return at(r0, c0) * (1 - fr) * (1 - fc) + at(r0, c0 + 1) * (1 - fr) * fc +
           at(r0 + 1, c0) * fr * (1 - fc) + at(r0 + 1, c0 + 1) * fr * fc;
  }
  function waterOp(x, y) {
    const [r, c] = rc(x, y);
    const ri = Math.round(r), ci = Math.round(c);
    if (ri < 0 || ri >= ny || ci < 0 || ci >= nx) return null;
    const w = water[ri * nx + ci];
    return w ? plassen[w - 1] : null;
  }
  const rd = (r, c) => [x0 + c * cel, y0 - r * cel];

  return {
    nx, ny, cel, x0, y0, h, water, plassen, lo, hi, hoogte, waterOp, rd, bron: t.bron,
    xmin: x0 - cel / 2, xmax: x0 + (nx - 0.5) * cel, ymin: y0 - (ny - 0.5) * cel, ymax: y0 + cel / 2,
  };
}

// Route langs de punten (van west naar oost), bemonsterd elke `stap` meter.
export function route(punten, terrein, stap = 5) {
  const p = punten.filter(q => q.RD_x != null);
  const uit = [];
  const knopen = [];
  let afstand = 0;
  for (let i = 0; i < p.length; i++) {
    knopen.push({ punt: p[i], afstand });
    if (i === p.length - 1) break;
    const a = p[i], b = p[i + 1];
    const len = Math.hypot(b.RD_x - a.RD_x, b.RD_y - a.RD_y);
    for (let s = 0; s < len; s += stap) {
      const f = s / len, x = a.RD_x + (b.RD_x - a.RD_x) * f, y = a.RD_y + (b.RD_y - a.RD_y) * f;
      const w = terrein.waterOp(x, y);
      uit.push({ afstand: afstand + s, x, y, h: w ? null : terrein.hoogte(x, y), water: w });
    }
    afstand += len;
  }
  const last = p[p.length - 1];
  uit.push({ afstand, x: last.RD_x, y: last.RD_y, h: terrein.hoogte(last.RD_x, last.RD_y), water: null });
  return { monsters: uit, knopen, lengte: afstand };
}

// Kleuren per horizont, gedeeld met de CSS van de puntkaarten.
export const HORIZONT = {
  A1: ['Humuslaag (A1)', '#3b2a1e'],
  A2: ['Uitspoelingslaag (A2)', '#bdb8ae'],
  B: ['Inspoelingslaag (B)', '#7a3f1d'],
  C: ['Moedermateriaal (C)', '#d9b566'],
  veen: ['Veen', '#2a2119'],
  onbekend: ['Laag', '#9a958a'],
};

export const fmt = (v, d = 2) => v == null ? '' : Number(v).toLocaleString('nl-NL', { minimumFractionDigits: d, maximumFractionDigits: d });
