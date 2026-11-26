// 3D-weergave van de landschapslijn Oud Meer: echt AHN-terrein, echte punten.
// Niets in dit beeld is verzonnen: lagen verschijnen pas als ze in
// _landschapslijn/lagen.csv staan.
import { laadTerrein, route, HORIZONT, fmt } from './landschapslijn-terrein.js';

const stage = document.getElementById('l3d-stage');
const kaartje = document.getElementById('l3d-kaartje');
const overzichtUrl = document.getElementById('l3d-script').dataset.overzicht;
const fout = () => { document.getElementById('l3d-fout').style.display = 'grid'; };

let THREE, OrbitControls;
try {
  THREE = await import('three');
  ({ OrbitControls } = await import('three/addons/controls/OrbitControls.js'));
} catch (e) { fout(); throw e; }

const data = JSON.parse(document.getElementById('ll-data').textContent);
const punten = data.punten.filter(p => p.RD_x != null);
const T = await laadTerrein(stage.dataset.terrein);

// --- coördinaten: 1 eenheid = 10 m, noord = -z ---
const S = 10;
const cx = (T.xmin + T.xmax) / 2, cy = (T.ymin + T.ymax) / 2;
const basis = Math.floor(T.lo) - 0.5;
let ex = 8;
const wx = x => (x - cx) / S;
const wz = y => (cy - y) / S;
const wy = h => (h - basis) * ex / S;
const halfB = (T.xmax - T.xmin) / S / 2, halfD = (T.ymax - T.ymin) / S / 2;

// --- renderer ---
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { fout(); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
stage.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 2000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.49; controls.minDistance = 6; controls.maxDistance = 400;
scene.add(new THREE.HemisphereLight(0xffffff, 0x6b5a40, 1.6));
const zon = new THREE.DirectionalLight(0xffffff, 1.6); zon.position.set(-60, 80, -40); scene.add(zon);

// --- terrein (geschaald in y met de overdrijving) ---
const land = new THREE.Group(); scene.add(land);
const LAAG = new THREE.Color('#9cbf7f'), HOOG = new THREE.Color('#e9d6a0'), BODEM = new THREE.Color('#6d6650');
{
  const pos = new Float32Array(T.nx * T.ny * 3), col = new Float32Array(T.nx * T.ny * 3);
  for (let r = 0; r < T.ny; r++) for (let k = 0; k < T.nx; k++) {
    const i = r * T.nx + k, [x, y] = T.rd(r, k);
    pos.set([wx(x), (T.h[i] - basis) / S, wz(y)], i * 3);
    const c = T.water[i] ? BODEM : LAAG.clone().lerp(HOOG, Math.min(1, Math.max(0, (T.h[i] - T.lo) / (T.hi - T.lo))));
    col.set([c.r, c.g, c.b], i * 3);
  }
  const idx = [];
  for (let r = 0; r < T.ny - 1; r++) for (let k = 0; k < T.nx - 1; k++) {
    const a = r * T.nx + k, b = a + 1, c = a + T.nx, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  land.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })));

  // zijkanten: neutrale grond, zonder verzonnen lagen
  const onder = (T.lo - 3 - basis) / S, zij = [];
  const rand = (r, k) => { const [x, y] = T.rd(r, k); return [wx(x), (T.h[r * T.nx + k] - basis) / S, wz(y)]; };
  const strook = cellen => { for (let i = 0; i < cellen.length - 1; i++) {
    const a = rand(...cellen[i]), b = rand(...cellen[i + 1]);
    zij.push(...a, ...b, b[0], onder, b[2], ...a, b[0], onder, b[2], a[0], onder, a[2]); } };
  strook([...Array(T.nx).keys()].map(k => [0, k]));
  strook([...Array(T.nx).keys()].map(k => [T.ny - 1, k]).reverse());
  strook([...Array(T.ny).keys()].map(r => [r, 0]).reverse());
  strook([...Array(T.ny).keys()].map(r => [r, T.nx - 1]));
  const zg = new THREE.BufferGeometry(); zg.setAttribute('position', new THREE.Float32BufferAttribute(zij, 3)); zg.computeVertexNormals();
  land.add(new THREE.Mesh(zg, new THREE.MeshLambertMaterial({ color: '#c2a878', side: THREE.DoubleSide })));

  // open water per plas, op het geschatte peil
  T.plassen.forEach((p, n) => {
    const w = [], y = (p.peil - basis) / S;
    for (let r = 0; r < T.ny; r++) for (let k = 0; k < T.nx; k++) {
      if (T.water[r * T.nx + k] !== n + 1) continue;
      const [x, yy] = T.rd(r, k), h = T.cel / S / 2 + 0.05, X = wx(x), Z = wz(yy);
      w.push(X - h, y, Z - h, X - h, y, Z + h, X + h, y, Z + h, X - h, y, Z - h, X + h, y, Z + h, X + h, y, Z - h);
    }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(w, 3));
    land.add(new THREE.Mesh(wg, new THREE.MeshBasicMaterial({ color: '#2f78a8', transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false })));
  });

  // de route als lijn over het terrein
  const { monsters } = route(punten, T, 5);
  const lp = monsters.map(s => new THREE.Vector3(wx(s.x), ((s.water ? s.water.peil : s.h) - basis) / S + 0.03, wz(s.y)));
  const lijn = new THREE.Line(new THREE.BufferGeometry().setFromPoints(lp), new THREE.LineDashedMaterial({ color: '#191c16', dashSize: 0.8, gapSize: 0.5 }));
  lijn.computeLineDistances();
  land.add(lijn);
}

// --- markeringen op het terrein ---
const merken = new THREE.Group(); scene.add(merken);
const plaats = [];
for (const p of punten) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.12, 20),
    new THREE.MeshLambertMaterial({ color: p.soort === 'wandje' ? '#c47a0e' : '#4a9130' }));
  merken.add(m); plaats.push({ obj: m, p, lift: 0.06 });
  if (p.water_m_NAP != null) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 8, 28), new THREE.MeshBasicMaterial({ color: '#1a6a96' }));
    w.rotation.x = Math.PI / 2; merken.add(w); plaats.push({ obj: w, p, lift: 0.1 });
  }
}
function zetHoogte() {
  land.scale.y = ex;
  for (const q of plaats) q.obj.position.set(wx(q.p.RD_x), wy(T.hoogte(q.p.RD_x, q.p.RD_y)) + q.lift, wz(q.p.RD_y));
}

// --- boorkern (1 eenheid = 13 cm), opgetild boven het geselecteerde punt ---
const kern = new THREE.Group(); scene.add(kern);
const CM = 1 / 13;
let kernT = 0, huidig = 0;
function bouwKern(p) {
  kern.clear(); kernT = 0;
  const diepte = Math.max(120, ...p.lagen.map(l => l.tot_cm || 0));
  if (p.lagen.length) {
    for (const l of p.lagen) {
      const h = ((l.tot_cm ?? l.van_cm) - l.van_cm) * CM;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, h, 24),
        new THREE.MeshLambertMaterial({ color: horizont(l)[1] }));
      m.position.y = (diepte - l.tot_cm) * CM + h / 2; kern.add(m);
    }
  } else {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, diepte * CM, 24),
      new THREE.MeshLambertMaterial({ color: '#9a958a', transparent: true, opacity: 0.5 }));
    m.position.y = diepte * CM / 2; kern.add(m);
  }
  if (p.water_cm_onder_maaiveld != null) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.1, 8, 28), new THREE.MeshBasicMaterial({ color: '#1a6a96' }));
    r.rotation.x = Math.PI / 2; r.position.y = (diepte - p.water_cm_onder_maaiveld) * CM; kern.add(r);
  }
  kern.userData.top = diepte * CM;
}

// --- pinnen en kaartje ---
// Alles in het kaartje wordt met DOM-elementen en textContent gebouwd:
// tekst uit de CSV komt nooit als HTML in de pagina.
function maak(tag, attrs = {}, ...kinderen) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v);
  }
  for (const kind of kinderen) if (kind != null && kind !== false) e.append(kind);
  return e;
}
const leeg = () => maak('span', { class: 'll-leeg', text: 'nog aan te vullen' });
const veld = v => (v == null || v === '' ? leeg() : String(v));
const slug = v => String(v).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
const horizont = l => HORIZONT[l.klasse] || HORIZONT[l.horizont] || HORIZONT.onbekend;

const pinnen = punten.map((p, i) => {
  const b = document.createElement('button');
  b.className = 'l3d__pin' + (p.soort === 'wandje' ? ' is-wandje' : '');
  b.textContent = p.punt; b.setAttribute('aria-label', `Punt ${p.punt}`);
  b.onclick = () => { stopWandel(); kies(i); };
  stage.appendChild(b); return b;
});
function kies(i) {
  huidig = i; const p = punten[i];
  pinnen.forEach((b, j) => b.setAttribute('aria-pressed', j === i));

  const lagen = p.lagen.length
    ? maak('ul', { class: 'l3d__lagen' }, ...p.lagen.map(l => {
        const kleur = maak('i');
        kleur.style.background = horizont(l)[1];
        const tekst = [`${l.van_cm}–${l.tot_cm} cm · ${horizont(l)[0]}`, l.grondsoort, l.kleur].filter(Boolean).join(', ');
        return maak('li', {}, kleur, tekst);
      }))
    : maak('p', { class: 'll-leeg', text: 'Nog geen lagen ingevoerd.' });
  const water = p.water_cm_onder_maaiveld != null
    ? `${p.water_cm_onder_maaiveld} cm onder maaiveld (${fmt(p.water_m_NAP)} m NAP)`
    : (p.notitie && String(p.notitie).includes('nat') ? String(p.notitie) : leeg());
  const naast = p.naast_lijn_m > 5 ? `, ${p.naast_lijn_m} m ${p.naast_kant}` : '';

  const vorig = maak('button', { class: 'l3d__knop', type: 'button', text: '← Vorig' });
  const volgend = maak('button', { class: 'l3d__knop', type: 'button', text: 'Volgend →' });
  vorig.onclick = () => { stopWandel(); kies((huidig + punten.length - 1) % punten.length); };
  volgend.onclick = () => { stopWandel(); kies((huidig + 1) % punten.length); };
  const link = maak('a', { text: 'Alles over dit punt in het overzicht' });
  link.href = `${overzichtUrl}#punt-${encodeURIComponent(slug(p.punt))}`;

  kaartje.replaceChildren(
    maak('h2', { text: p.soort === 'wandje' ? 'Podzolwandje' : `Boring ${p.punt}` }),
    maak('p', { class: 'l3d__meta', text: `${p.afstand_m} m langs de lijn${naast} · ${fmt(p.hoogte_AHN_m_NAP)} m NAP` }),
    maak('h3', { text: 'Bodemlagen' }),
    lagen,
    maak('dl', { class: 'll-punt__gegevens' },
      maak('dt', { text: 'Bodemtype' }), maak('dd', {}, veld(p.bodemtype)),
      maak('dt', { text: 'Water' }), maak('dd', {}, water),
      maak('dt', { text: 'Begroeiing' }), maak('dd', {}, veld(p.begroeiing)),
      maak('dt', { text: 'Dieren' }), maak('dd', {}, veld(p.dieren))),
    maak('div', { class: 'l3d__nav' }, vorig, volgend),
    maak('p', { class: 'l3d__bron' }, link),
  );
  bouwKern(p);
}

// --- camera ---
function pas(az, el) {
  const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  const doel = new THREE.Vector3(0, wy(T.lo), 0);
  const hoeken = [];
  for (const x of [-halfB, halfB]) for (const y of [wy(T.lo - 3), wy(T.hi)]) for (const z of [-halfD, halfD]) hoeken.push(new THREE.Vector3(x, y, z));
  let lo = 5, hi = 800;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2; camera.position.copy(dir).multiplyScalar(mid).add(doel); camera.lookAt(doel); camera.updateMatrixWorld();
    const past = hoeken.every(c => { const v = c.clone().project(camera); return Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.9; });
    if (past) hi = mid; else lo = mid;
  }
  camera.position.copy(dir).multiplyScalar(hi).add(doel); controls.target.copy(doel); controls.update();
}
const overzicht = () => { const smal = stage.clientWidth / stage.clientHeight < 1.1; pas(smal ? -0.35 : -0.55, smal ? 0.75 : 0.6); };

const pad = route(punten, T, 5).monsters;
let wandelt = false, wandelStart = 0;
const wandelKnop = document.getElementById('l3d-wandel');
function stopWandel() { wandelt = false; wandelKnop.setAttribute('aria-pressed', 'false'); wandelKnop.textContent = 'Wandel de lijn'; controls.enabled = true; }
wandelKnop.onclick = () => {
  if (wandelt) return stopWandel();
  wandelt = true; wandelStart = performance.now(); controls.enabled = false;
  wandelKnop.setAttribute('aria-pressed', 'true'); wandelKnop.textContent = 'Stop de wandeling'; kies(0);
};
document.getElementById('l3d-overzicht').onclick = () => { stopWandel(); overzicht(); };
document.getElementById('l3d-zij').onclick = () => { stopWandel(); pas(0, 0.06); };

// --- regen ---
const regenKnop = document.getElementById('l3d-regen');
const DRUPPELS = 900, rp = new Float32Array(DRUPPELS * 6);
const druppels = Array.from({ length: DRUPPELS }, () => [(Math.random() * 2 - 1) * halfB, Math.random() * 25, (Math.random() * 2 - 1) * halfD]);
const regenGeo = new THREE.BufferGeometry(); regenGeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
const regen = new THREE.LineSegments(regenGeo, new THREE.LineBasicMaterial({ color: '#4a90c2' }));
regen.visible = false; regen.frustumCulled = false; scene.add(regen);
regenKnop.onclick = () => { regen.visible = !regen.visible; regenKnop.setAttribute('aria-pressed', regen.visible); };

// --- hoogteschuif ---
const schuif = document.getElementById('l3d-hoogte'), schuifUit = document.getElementById('l3d-hoogte-uit');
schuif.oninput = () => { ex = +schuif.value; schuifUit.textContent = ex === 1 ? 'ware hoogte' : `${ex}× overdreven`; zetHoogte(); };

// --- formaat ---
function formaat() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
let vorigeB = 0;
new ResizeObserver(() => { formaat(); if (Math.abs(stage.clientWidth - vorigeB) > 40) { vorigeB = stage.clientWidth; overzicht(); } }).observe(stage);

zetHoogte(); formaat(); overzicht(); vorigeB = stage.clientWidth;
let hash = '';
try { hash = decodeURIComponent(location.hash).toLowerCase(); } catch { /* ongeldig adres: begin bij het eerste punt */ }
const start = punten.findIndex(p => '#punt-' + slug(p.punt) === hash);
kies(Math.max(0, start));

// --- animatie ---
const v = new THREE.Vector3();
let laatst = performance.now();
renderer.setAnimationLoop(nu => {
  const dt = Math.min((nu - laatst) / 1000, 0.05); laatst = nu;
  if (wandelt) {
    const f = Math.min(1, (nu - wandelStart) / 1000 / 28);
    const i = Math.min(pad.length - 1, Math.floor(f * (pad.length - 1)));
    const s = pad[i], d = pad[Math.min(pad.length - 1, i + 6)];
    let dichtst = 0; punten.forEach((p, j) => { if (Math.hypot(p.RD_x - s.x, p.RD_y - s.y) < Math.hypot(punten[dichtst].RD_x - s.x, punten[dichtst].RD_y - s.y)) dichtst = j; });
    if (dichtst !== huidig) kies(dichtst);
    const hs = s.water ? s.water.peil : s.h;
    camera.position.set(wx(s.x) - 6, wy(hs) + 7, wz(s.y) + 14);
    controls.target.set(wx(d.x), wy(T.hoogte(d.x, d.y)), wz(d.y)); camera.lookAt(controls.target);
    if (f >= 1) stopWandel();
  } else controls.update();

  if (regen.visible) {
    druppels.forEach((q, i) => {
      q[1] -= dt * 14;
      const grond = wy(T.hoogte(q[0] * S + cx, cy - q[2] * S));
      if (q[1] < grond) q[1] = grond + 18 + Math.random() * 6;
      rp.set([q[0], q[1], q[2], q[0], q[1] + 0.6, q[2]], i * 6);
    });
    regenGeo.attributes.position.needsUpdate = true;
  }

  const p = punten[huidig];
  kernT = Math.min(1, kernT + dt * 1.6);
  kern.position.set(wx(p.RD_x), wy(T.hoogte(p.RD_x, p.RD_y)) + (1 - Math.pow(1 - kernT, 3)) * 1.4, wz(p.RD_y));
  kern.scale.y = Math.max(0.01, kernT);

  punten.forEach((q, i) => {
    const top = i === huidig ? (kern.userData.top || 5) + 2.2 : 1.6;
    v.set(wx(q.RD_x), wy(T.hoogte(q.RD_x, q.RD_y)) + top, wz(q.RD_y)).project(camera);
    const b = pinnen[i];
    b.hidden = v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05;
    b.style.left = (v.x + 1) / 2 * stage.clientWidth + 'px';
    b.style.top = (1 - v.y) / 2 * stage.clientHeight + 'px';
    b.style.zIndex = i === huidig ? 2 : 1;
  });
  renderer.render(scene, camera);
});
