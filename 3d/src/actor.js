// ============================================================
//  FIXING GOOD 3D - characters, weapons, reloads, AI, ragdolls
// ============================================================
import { THREE, V3, col, gunModel, magModel, scene, box, cyl } from './gfx.js';
import { PI, TAU, clamp, lerp, rand, choose, sign, ease, angDiff, G, Input, Audio, Settings } from './core.js';
import { LOOKS, lookOf } from './ui2d.js';

const UP = V3(0, 1, 0);
const tmpV = V3(), tmpV2 = V3(), tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion();

// ---------- weapons ----------
export const WEAPONS = {
  pistol: { name: 'M9 Sidearm', art: 'pistol', ammo: '9mm', mag: 15, dmg: 26, rate: 0.17, auto: false, spread: 0.012, bullets: 1, recoil: 0.06, hold: [0.03, -0.06, 0.45], reloadType: 'mag', reload: 1.3, magKind: 'pistol', sound: 'pistol', shake: 0.25, knock: 2.2, desc: 'Reliable 9mm sidearm. Fast reloads.' },
  gold: { name: 'Gold Pistols', art: 'pistol', gold: true, ammo: '9mm', mag: 18, dmg: 30, rate: 0.12, auto: false, spread: 0.016, bullets: 1, recoil: 0.06, hold: [0.03, -0.06, 0.45], reloadType: 'mag', reload: 1.1, magKind: 'pistol', sound: 'pistol', shake: 0.25, knock: 2.4, desc: 'Rafa\'s gaudy gold-plated 9mm.' },
  revolver: { name: '.357 Magnum', art: 'revolver', ammo: '357', mag: 6, dmg: 70, rate: 0.42, auto: false, spread: 0.006, bullets: 1, recoil: 0.16, hold: [0.03, -0.06, 0.45], reloadType: 'revolver', reload: 2.2, magKind: 'loader', sound: 'revolver', shake: 0.6, knock: 5, pierce: 1, price: 1800, desc: 'Six shots. Each one ends an argument.' },
  shotgun: { name: '12ga Pump', art: 'shotgun', ammo: '12ga', mag: 6, dmg: 14, rate: 0.78, auto: false, spread: 0.06, bullets: 9, recoil: 0.2, hold: [0.0, -0.08, 0.12], reloadType: 'shell', shellTime: 0.42, reload: 0.3, magKind: 'shell', sound: 'shotgun', shake: 0.8, knock: 7, price: 2600, desc: 'Pump-action. Loads shell by shell.' },
  smg: { name: 'Uzi-9', art: 'smg', ammo: '9mm', mag: 32, dmg: 15, rate: 0.065, auto: true, spread: 0.03, bullets: 1, recoil: 0.03, hold: [0.03, -0.07, 0.36], reloadType: 'mag', reload: 1.5, magKind: 'pistol', sound: 'smg', shake: 0.15, knock: 1.4, price: 3200, desc: 'Sprays 9mm at 900 rounds a minute.' },
  rifle: { name: 'AKM Rifle', art: 'rifle', ammo: '762', mag: 30, dmg: 34, rate: 0.105, auto: true, spread: 0.014, bullets: 1, recoil: 0.045, hold: [0.0, -0.08, 0.14], reloadType: 'mag', reload: 1.9, magKind: 'rifle', sound: 'rifle', shake: 0.3, knock: 3, pierce: 1, price: 5200, desc: 'The cartel\'s favourite.' },
  mg: { name: 'M60 "Trunk Gun"', art: 'mg', ammo: '762', mag: 100, dmg: 36, rate: 0.075, auto: true, spread: 0.022, bullets: 1, recoil: 0.04, hold: [0.0, -0.12, 0.12], reloadType: 'belt', reload: 3.2, magKind: 'mg', sound: 'mg', shake: 0.4, knock: 4, pierce: 2, heavy: true, desc: 'Belt-fed. Tears through cover.' },
  bat: { name: 'Bat', melee: true, art: 'bat', dmg: 22, rate: 0.9, reach: 1.6 },
  knife: { name: 'Knife', melee: true, art: 'knife', dmg: 18, rate: 0.6, reach: 1.2 },
  axe: { name: 'Axe', melee: true, art: 'axe', dmg: 34, rate: 1.1, reach: 1.8 },
};
export const AMMO_NAMES = { '9mm': '9mm', '357': '.357', '12ga': '12 gauge', '762': '7.62mm' };
// left-hand keyframes in gun-local space; 'pouch' is a point on the belt
const TRACKS = {
  mag: { hand: [[0, 'support'], [0.1, 'well'], [0.16, 'well'], [0.36, 'pouch'], [0.42, 'pouch'], [0.62, 'wellLow'], [0.72, 'well'], [0.8, 'rack'], [0.88, 'rackBack'], [0.92, 'rackBack'], [1, 'support']], tilt: [[0, 0], [0.12, 0.55], [0.78, 0.5], [0.9, 0.2], [1, 0]], roll: [[0, 0], [0.12, 0.5], [0.78, 0.45], [1, 0]], events: [[0.15, 'magOut'], [0.42, 'grab'], [0.72, 'magIn'], [0.88, 'rack']], carry: [0.42, 0.72] },
  revolver: { hand: [[0, 'support'], [0.1, 'cyl'], [0.2, 'cylPush'], [0.26, 'cyl'], [0.46, 'pouch'], [0.5, 'pouch'], [0.7, 'cylLow'], [0.76, 'cylLow'], [0.86, 'cyl'], [1, 'support']], tilt: [[0, 0], [0.1, 1.0], [0.3, 1.15], [0.5, 0.5], [0.8, 0.5], [0.9, 0.2], [1, 0]], roll: [[0, 0], [0.1, 0.7], [0.85, 0.7], [1, 0]], events: [[0.14, 'cylOut'], [0.26, 'eject'], [0.5, 'grab'], [0.76, 'loader'], [0.88, 'cylIn']], carry: [0.5, 0.76] },
  belt: { hand: [[0, 'support'], [0.08, 'cover'], [0.16, 'coverUp'], [0.22, 'well'], [0.3, 'well'], [0.48, 'pouch'], [0.52, 'pouch'], [0.7, 'wellLow'], [0.76, 'well'], [0.82, 'coverUp'], [0.88, 'cover'], [0.93, 'rack'], [0.97, 'rackBack'], [1, 'support']], tilt: [[0, 0], [0.1, 0.3], [0.85, 0.3], [1, 0]], roll: [[0, 0], [0.1, 0.3], [0.85, 0.3], [1, 0]], events: [[0.12, 'coverOpen'], [0.26, 'magOut'], [0.52, 'grab'], [0.76, 'magIn'], [0.88, 'coverClose'], [0.96, 'rack']], carry: [0.52, 0.76] },
};
function track(tr, t) { for (let i = 0; i < tr.length - 1; i++) if (t <= tr[i + 1][0]) { const a = tr[i], b = tr[i + 1]; return [a[1], b[1], ease((t - a[0]) / Math.max(1e-4, b[0] - a[0]))]; } const l = tr[tr.length - 1]; return [l[1], l[1], 1]; }
const trackNum = (tr, t) => { const [a, b, k] = track(tr, t); return lerp(a, b, k); };

export class Gun {
  constructor(key) { this.key = key; this.def = WEAPONS[key]; this.mag = this.def.mag || 0; this.cd = 0; this.reload = null; this.slide = 0; this.pump = 0; this.pumpT = 0; this.cyl = 0; this.cover = 0; this.magIn = true; this.carry = null; this.model = null; }
  get melee() { return !!this.def.melee; }
  ensureModel() { if (!this.model) { this.model = gunModel(this.def.art, { gold: this.def.gold }); this.parts = this.model.userData.parts; } return this.model; }
  canReload(o) { const d = this.def; return !d.melee && !this.reload && this.mag < d.mag && o.reserve(d.ammo) > 0; }
  startReload(o) { if (!this.canReload(o)) return false; const d = this.def; this.reload = d.reloadType === 'shell' ? { phase: 'start', t: 0, dur: d.reload } : { phase: 'main', t: 0, dur: d.reload * (o.reloadMul || 1), fired: {} }; return true; }
  cancelReload() { if (this.reload && this.def.reloadType === 'shell') { this.reload = null; this.carry = null; this.pumpT = 0.36; return true; } return false; }
  abort() { this.reload = null; this.carry = null; this.magIn = true; this.slide = 0; this.cyl = 0; this.cover = 0; }
  weight() { const R = this.reload; if (!R) return 0; if (this.def.reloadType === 'shell') return R.phase === 'start' ? ease(clamp(R.t / R.dur, 0, 1)) : R.phase === 'shell' ? 1 : 1 - ease(clamp(R.t / R.dur, 0, 1)); const k = R.t / R.dur; return k < 0.1 ? ease(k / 0.1) : k > 0.9 ? ease((1 - k) / 0.1) : 1; }
  tilt() { const R = this.reload; if (!R) return [0, 0]; if (this.def.reloadType === 'shell') { const w = this.weight(); return [0.3 * w, 0.5 * w]; } const k = clamp(R.t / R.dur, 0, 1), tr = TRACKS[this.def.reloadType]; return [trackNum(tr.tilt, k), trackNum(tr.roll, k)]; }
  progress() { const R = this.reload; if (!R) return 0; return this.def.reloadType === 'shell' ? this.mag / this.def.mag : clamp(R.t / R.dur, 0, 1); }
  update(dt, o, lv) {
    this.cd -= dt; if (this.slide > 0 && !this.reload) this.slide = Math.max(0, this.slide - dt * 18);
    if (this.pumpT > 0) { this.pumpT -= dt; const k = 1 - this.pumpT / 0.36; this.pump = Math.sin(clamp(k, 0, 1) * PI); if (k > 0.45 && !this._ps) { this._ps = true; Audio.play('pump', o.pan(), o.vol()); lv && lv.fx.casing(o.gunPoint('eject'), o, 'shell'); } if (this.pumpT <= 0) this.pump = 0; } else this._ps = false;
    const R = this.reload; if (!R) return;
    const d = this.def; R.t += dt;
    if (d.reloadType === 'shell') {
      if (R.phase === 'start' && R.t >= R.dur) { R.phase = 'shell'; R.t = 0; R.dur = d.shellTime * (o.reloadMul || 1); }
      else if (R.phase === 'shell') { const k = R.t / R.dur; this.carry = k > 0.35 && k < 0.85 ? 'shell' : null; if (R.t >= R.dur) { this.mag++; o.useReserve(d.ammo, 1); Audio.play('shell', o.pan(), o.vol()); R.t = 0; if (this.mag >= d.mag || o.reserve(d.ammo) <= 0) { R.phase = 'pump'; R.dur = 0.36; this.carry = null; } } }
      else if (R.phase === 'pump') { const k = R.t / R.dur; this.pump = Math.sin(clamp(k, 0, 1) * PI); if (k > 0.45 && !R.pumped) { R.pumped = true; Audio.play('pump', o.pan(), o.vol()); } if (R.t >= R.dur) { this.pump = 0; this.reload = null; } }
      return;
    }
    const tr = TRACKS[d.reloadType], k = R.t / R.dur;
    for (const [et, ev] of tr.events) if (k >= et && !R.fired[ev]) { R.fired[ev] = true; this.event(ev, o, lv); }
    this.carry = k >= tr.carry[0] && k < tr.carry[1] ? d.magKind : null;
    if (d.reloadType === 'mag') this.slide = k > 0.8 && k < 0.9 ? clamp((k - 0.8) / 0.07, 0, 1) : (this.mag === 0 && k < 0.8 ? 1 : 0);
    if (d.reloadType === 'revolver') this.cyl = k < 0.1 ? 0 : k < 0.16 ? (k - 0.1) / 0.06 : k < 0.86 ? 1 : k < 0.9 ? 1 - (k - 0.86) / 0.04 : 0;
    if (d.reloadType === 'belt') this.cover = k < 0.08 ? 0 : k < 0.16 ? (k - 0.08) / 0.08 : k < 0.82 ? 1 : k < 0.88 ? 1 - (k - 0.82) / 0.06 : 0;
    if (k >= 1) this.abort();
  }
  event(ev, o, lv) {
    const d = this.def, pan = o.pan(), vol = o.vol();
    switch (ev) {
      case 'magOut': this.magIn = false; Audio.play('magout', pan, vol); if (lv && this.parts.mag) lv.fx.dropMag(this.parts.mag, d.magKind, o); break;
      case 'magIn': { this.magIn = true; Audio.play('magin', pan, vol); const got = Math.min(d.mag - this.mag, o.reserve(d.ammo)); o.useReserve(d.ammo, got); this.mag += got; break; }
      case 'rack': Audio.play('rack', pan, vol); break;
      case 'grab': Audio.play('clank', pan, vol * 0.3); break;
      case 'cylOut': case 'cylIn': Audio.play('cylinder', pan, vol); break;
      case 'eject': Audio.play('clank', pan, vol * 0.5); if (lv) for (let i = 0; i < d.mag; i++) lv.fx.casing(o.gunPoint('eject'), o, 'brass', true); o.useReserve(d.ammo, -this.mag); this.mag = 0; break;
      case 'loader': { Audio.play('magin', pan, vol); const got = Math.min(d.mag, o.reserve(d.ammo)); o.useReserve(d.ammo, got); this.mag = got; break; }
      case 'coverOpen': case 'coverClose': Audio.play('clank', pan, vol); break;
    }
  }
  // animate the gun's moving parts
  pose() {
    const P = this.parts; if (!P) return;
    if (P.slide) P.slide.position.z = P.slide.userData.base.z - this.slide * 0.045;
    if (P.mag) P.mag.visible = this.magIn;
    if (P.pump) P.pump.position.z = P.pump.userData.base.z - this.pump * 0.1;
    if (P.cyl) P.cyl.position.x = P.cyl.userData.base.x + this.cyl * 0.045;
    if (P.cover) { P.cover.rotation.x = -this.cover * 1.1; P.cover.position.y = P.cover.userData.base.y + this.cover * 0.06; }
  }
}

// ---------- archetypes ----------
export const ARCH = {
  player: { hp: 100, speed: 5.2 },
  walter: { hp: 400, speed: 5.0, acc: 0.02 },
  npc: { hp: 100, speed: 4 },
  thug: { hp: 60, speed: 5.0, weapon: 'bat', melee: true },
  knifer: { hp: 50, speed: 5.4, weapon: 'knife', melee: true },
  brawler: { hp: 75, speed: 4.8, melee: true },
  gunner: { hp: 70, speed: 3.6, weapon: 'pistol', dist: [8, 18], acc: 0.045, react: 0.7 },
  smg: { hp: 75, speed: 3.8, weapon: 'smg', dist: [7, 15], acc: 0.06, react: 0.65 },
  shotgunner: { hp: 100, speed: 4.0, weapon: 'shotgun', dist: [3.5, 8], acc: 0.03, react: 0.65 },
  rifleman: { hp: 95, speed: 3.4, weapon: 'rifle', dist: [12, 24], acc: 0.035, react: 0.6 },
  heavy: { hp: 240, armor: 120, speed: 2.4, weapon: 'mg', dist: [10, 20], acc: 0.045, react: 0.8, armorLook: true },
  kev: { hp: 90, speed: 5.4, weapon: 'knife', melee: true, look: 'kev' },
  dimitri: { hp: 160, speed: 3.6, weapon: 'pistol', dist: [7, 15], acc: 0.04, react: 0.5, look: 'dimitri' },
  rafa: { hp: 750, speed: 5.0, weapon: 'gold', dist: [7, 15], acc: 0.03, react: 0.3, boss: true, look: 'rafa' },
  marco: { hp: 650, speed: 5.4, weapon: 'axe', melee: true, boss: true, look: 'twinA' },
  leo: { hp: 480, speed: 3.8, weapon: 'revolver', dist: [9, 18], acc: 0.022, react: 0.35, boss: true, look: 'twinB' },
  esteban: { hp: 950, armor: 250, speed: 3.6, weapon: 'shotgun', dist: [4, 10], acc: 0.025, react: 0.35, boss: true, look: 'esteban' },
  dutch: { hp: 1150, armor: 300, speed: 2.6, weapon: 'mg', dist: [9, 18], acc: 0.045, react: 0.4, boss: true, look: 'dutch' },
};

// ---------- body mesh (joint-driven) ----------
const geoCyl = new THREE.CylinderGeometry(1, 0.88, 1, 10), geoSph = new THREE.SphereGeometry(1, 12, 10), geoBox = new THREE.BoxGeometry(1, 1, 1), geoCap = new THREE.CapsuleGeometry(1, 1, 4, 10);
const skinMat = c => col('skin' + c, c, { roughness: 0.7 }), cloth = c => col('cloth' + c, c, { roughness: 0.9 });
function mk(geo, m) { const o = new THREE.Mesh(geo, m); o.castShadow = true; o.receiveShadow = true; o.matrixAutoUpdate = false; return o; }
// place a unit mesh between a and b with radius r (and optional side vector for flattening)
const _ax = V3(), _sd = V3(), _fw = V3(), _mid = V3(), _sc = V3();
function between(o, a, b, rx, rz = rx, side = null) {
  _ax.subVectors(b, a); const len = _ax.length() || 1e-4; _ax.divideScalar(len);
  if (side) _sd.copy(side); else _sd.set(1, 0, 0);
  _sd.addScaledVector(_ax, -_sd.dot(_ax)); if (_sd.lengthSq() < 1e-6) _sd.set(0, 0, 1).addScaledVector(_ax, -_ax.z); _sd.normalize();
  _fw.crossVectors(_sd, _ax);
  tmpM.makeBasis(_sd, _ax, _fw); _mid.addVectors(a, b).multiplyScalar(0.5);
  tmpM.scale(_sc.set(rx, len, rz)); tmpM.setPosition(_mid); o.matrix.copy(tmpM); o.matrixWorldNeedsUpdate = true; o.visible = true;
}
function at(o, p, r, ry = r, rz = r) { tmpM.makeScale(r, ry, rz); tmpM.setPosition(p); o.matrix.copy(tmpM); o.matrixWorldNeedsUpdate = true; o.visible = true; }

function buildHead(look) {
  const g = new THREE.Group(), sk = skinMat(look.skin), hairM = cloth(look.hairColor || '#222'), dark = col('ink', 0x15100c);
  const sph = (r, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geoSph, m); o.scale.set(r * sx, r * sy, r * sz); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  const bx = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(geoBox, m); o.scale.set(w, h, d); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  sph(0.115, sk, 0, 0, 0, 0.92, 1.05, 1); sph(0.09, sk, 0, -0.06, 0.025, 1, 0.8, 1); // skull + jaw
  sph(0.025, sk, 0.105, 0, -0.005, 0.5, 1, 0.8); sph(0.025, sk, -0.105, 0, -0.005, 0.5, 1, 0.8); // ears
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 6), sk); nose.rotation.x = PI / 2; nose.position.set(0, -0.015, 0.12); g.add(nose);
  for (const s of [-1, 1]) { sph(0.017, col('eyewhite', 0xffffff), s * 0.04, 0.02, 0.098); sph(0.009, dark, s * 0.04, 0.02, 0.112); bx(0.04, 0.009, 0.01, cloth(look.hairColor || '#333'), s * 0.042, 0.048, 0.108); }
  bx(0.045, 0.007, 0.01, col('lip', 0x6a3a2a), 0, -0.065, 0.1);
  if (look.hat === 'balaclava') { sph(0.123, cloth(look.hatColor), 0, 0, 0, 0.94, 1.08, 1.02); bx(0.12, 0.035, 0.02, sk, 0, 0.02, 0.11); for (const s of [-1, 1]) sph(0.009, dark, s * 0.04, 0.02, 0.122); return g; }
  // hair
  const cap = (r, m, phiLen = PI * 0.55, tilt = -0.25, y = 0.01) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10, 0, TAU, 0, phiLen), m); o.rotation.x = tilt; o.position.y = y; o.scale.set(0.95, 1.05, 1.02); o.castShadow = true; g.add(o); return o; };
  switch (look.hair) {
    case 'short': cap(0.122, hairM, PI * 0.5); break;
    case 'slick': cap(0.124, hairM, PI * 0.48, -0.15); break;
    case 'buzz': cap(0.119, hairM, PI * 0.47); break;
    case 'long': cap(0.126, hairM, PI * 0.55); bx(0.2, 0.2, 0.06, hairM, 0, -0.08, -0.08); break;
    case 'comb': cap(0.126, hairM, PI * 0.5, -0.1, 0.015); break;
    case 'ring': { const r = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 6, 16, PI * 1.2), hairM); r.rotation.set(PI / 2 + 0.25, 0, PI * -0.1 + PI); r.position.set(0, -0.005, -0.01); g.add(r); break; }
  }
  if (look.beard === 'goatee') { bx(0.04, 0.05, 0.03, cloth(look.beardColor), 0, -0.1, 0.09); bx(0.07, 0.012, 0.02, cloth(look.beardColor), 0, -0.05, 0.11); }
  if (look.beard === 'full') { sph(0.095, cloth(look.beardColor), 0, -0.07, 0.03, 1, 0.75, 0.95); }
  if (look.beard === 'stubble') { const m = new THREE.MeshStandardMaterial({ color: look.beardColor, transparent: true, opacity: 0.35 }); const o = new THREE.Mesh(geoSph, m); o.scale.set(0.092, 0.075, 0.093); o.position.set(0, -0.065, 0.027); g.add(o); }
  if (look.mustache) bx(0.07, 0.014, 0.02, cloth(look.beardColor || look.hairColor), 0, -0.048, 0.112);
  if (look.glasses === 'specs') { const fm = col('frame', 0x222222, { metalness: 0.5 }), lm = new THREE.MeshStandardMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.35, metalness: 0.4, roughness: 0.1 }); for (const s of [-1, 1]) { bx(0.045, 0.032, 0.006, lm, s * 0.042, 0.02, 0.122); const fr = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.004, 4, 12), fm); fr.scale.set(1.05, 0.75, 1); fr.position.set(s * 0.042, 0.02, 0.122); g.add(fr); bx(0.004, 0.004, 0.11, fm, s * 0.098, 0.022, 0.07); } bx(0.02, 0.004, 0.004, fm, 0, 0.022, 0.124); }
  if (look.glasses === 'shades') { const sm = col('shades', 0x0a0a0a, { metalness: 0.6, roughness: 0.15 }); for (const s of [-1, 1]) bx(0.048, 0.03, 0.008, sm, s * 0.042, 0.02, 0.122); bx(0.004, 0.004, 0.11, sm, 0.098, 0.022, 0.07); bx(0.004, 0.004, 0.11, sm, -0.098, 0.022, 0.07); }
  if (look.mask) { const mm = col('resp', 0x2b2b2b); const m = new THREE.Mesh(geoCyl, mm); m.scale.set(0.05, 0.05, 0.05); m.rotation.x = PI / 2; m.position.set(0, -0.05, 0.11); g.add(m); for (const s of [-1, 1]) { const f = new THREE.Mesh(geoCyl, col('filter', 0xd23a2a)); f.scale.set(0.028, 0.03, 0.028); f.rotation.set(PI / 2, 0, s * 0.8); f.position.set(s * 0.06, -0.07, 0.11); g.add(f); } }
  const hc = cloth(look.hatColor || '#333');
  switch (look.hat) {
    case 'beanie': cap(0.13, hc, PI * 0.52, -0.2, 0.02); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.128, 0.05, 18, 1, true), cloth(shadeHex(look.hatColor, -0.25))); b.position.set(0, 0.04, -0.01); b.rotation.x = -0.2; g.add(b); } break;
    case 'porkpie': { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.012, 20), hc); br.position.y = 0.075; g.add(br); const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.115, 0.1, 18), hc); cr.position.y = 0.13; g.add(cr); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.117, 0.117, 0.022, 18), col('band', 0x3a3a3a)); band.position.y = 0.092; g.add(band); break; }
    case 'cap': cap(0.124, hc, PI * 0.5, -0.1, 0.015); { const v = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.01, 14, 1, false, -PI / 2, PI), hc); v.position.set(0, 0.04, 0.1); v.rotation.x = 0.1; g.add(v); } break;
    case 'bandana': cap(0.123, hc, PI * 0.42, -0.25, 0.02); break;
    case 'cowboy': { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.015, 22), hc); br.position.y = 0.08; br.scale.z = 0.85; g.add(br); const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.14, 16), hc); cr.position.y = 0.15; g.add(cr); break; }
    case 'helmet': cap(0.14, hc, PI * 0.55, -0.15, 0.01); break;
  }
  if (look.hazmat) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 12, 0, TAU, 0, PI * 0.62), cloth('#e8c62a')); h.rotation.x = -0.6; h.position.set(0, 0, -0.02); g.add(h); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function shadeHex(hex, amt) { const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, hsl.s, clamp(hsl.l * (1 + amt), 0, 1)); return '#' + c.getHexString(); }

export class Body {
  constructor(look) {
    this.look = look; const b = look.build || 1; this.b = b;
    const shirt = look.hazmat ? '#e8c62a' : look.shirt, top = look.hazmat ? shirt : (look.jacket || look.vest || shirt);
    const sleeve = look.sleeves === 'long' || look.jacket || look.hazmat ? (look.jacket || shirt) : null;
    this.m = {
      torso: mk(geoCyl, cloth(top)), chest: mk(geoSph, cloth(top)), shirtStrip: (look.jacket || look.vest) && !look.hazmat ? mk(geoBox, cloth(shirt)) : null, belly: mk(geoSph, cloth(top)),
      pelvis: mk(geoSph, cloth(look.pants)), neck: mk(geoCyl, skinMat(look.skin)),
      uaL: mk(geoCyl, cloth(look.jacket || shirt)), uaR: mk(geoCyl, cloth(look.jacket || shirt)), faL: mk(geoCyl, sleeve ? cloth(sleeve) : skinMat(look.skin)), faR: mk(geoCyl, sleeve ? cloth(sleeve) : skinMat(look.skin)),
      haL: mk(geoSph, look.hazmat ? col('glove', 0x333333) : skinMat(look.skin)), haR: mk(geoSph, look.hazmat ? col('glove', 0x333333) : skinMat(look.skin)),
      thL: mk(geoCyl, cloth(look.pants)), thR: mk(geoCyl, cloth(look.pants)), shL: mk(geoCyl, cloth(look.pants)), shR: mk(geoCyl, cloth(look.pants)),
      ftL: mk(geoBox, cloth(look.shoes || '#222')), ftR: mk(geoBox, cloth(look.shoes || '#222')),
      knL: mk(geoSph, cloth(look.pants)), knR: mk(geoSph, cloth(look.pants)), elL: mk(geoSph, cloth(look.jacket || shirt)), elR: mk(geoSph, cloth(look.jacket || shirt)), shoL: mk(geoSph, cloth(look.jacket || top)), shoR: mk(geoSph, cloth(look.jacket || top)),
      vest: look.armor ? mk(geoBox, col('armor', 0x3d4434)) : null,
      stumpHead: mk(geoSph, col('gore', 0x8a0f0f)), stumpA: mk(geoSph, col('gore', 0x8a0f0f)), stumpB: mk(geoSph, col('gore', 0x8a0f0f)),
    };
    this.head = buildHead(look); this.head.matrixAutoUpdate = true;
    this.group = new THREE.Group(); for (const k in this.m) if (this.m[k]) this.group.add(this.m[k]); this.group.add(this.head);
    this.m.stumpHead.visible = this.m.stumpA.visible = this.m.stumpB.visible = false;
    this.flashMat = col('flash', 0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 });
  }
  // J: map of Vector3 joints (world). side: body right vector. headQ: quaternion for the head
  render(J, side, headQ, cut = {}) {
    const m = this.m, b = this.b;
    // torso
    const chestTop = J.neck, pelvis = J.pelvis;
    tmpV.subVectors(chestTop, pelvis); const tl = tmpV.length(); tmpV.normalize();
    const tTop = V3().copy(chestTop).addScaledVector(tmpV, -0.06), tBot = V3().copy(pelvis).addScaledVector(tmpV, 0.04);
    between(m.torso, tBot, tTop, 0.17 * b, 0.115 * b, side);
    _mid.copy(chestTop).addScaledVector(tmpV, -0.12); tmpM.makeBasis(side, tmpV, V3().crossVectors(side, tmpV)); tmpM.scale(_sc.set(0.19 * b, 0.13, 0.125 * b)); tmpM.setPosition(_mid); m.chest.matrix.copy(tmpM); m.chest.matrixWorldNeedsUpdate = true; m.chest.visible = true;
    _mid.lerpVectors(pelvis, chestTop, 0.3); at(m.belly, _mid, 0.15 * b, 0.16, 0.12 * b);
    if (m.shirtStrip) { tmpV.subVectors(chestTop, pelvis).normalize(); tmpV2.crossVectors(side, tmpV).normalize(); const a = V3().copy(pelvis).addScaledVector(tmpV2, 0.105 * b).addScaledVector(tmpV, 0.12), c = V3().copy(chestTop).addScaledVector(tmpV2, 0.1 * b).addScaledVector(tmpV, -0.06); between(m.shirtStrip, a, c, 0.05, 0.012, side); }
    if (m.vest) { tmpV.subVectors(chestTop, pelvis).normalize(); const a = V3().copy(pelvis).addScaledVector(tmpV, 0.15), c = V3().copy(chestTop).addScaledVector(tmpV, -0.1); between(m.vest, a, c, 0.36 * b, 0.27 * b, side); }
    at(m.pelvis, pelvis, 0.15 * b, 0.11, 0.12 * b);
    if (!cut.head) { tmpV.copy(J.head).sub(chestTop).multiplyScalar(0.55).add(chestTop); between(m.neck, chestTop, tmpV, 0.05 * b); this.head.visible = true; }
    else { m.neck.visible = false; at(m.stumpHead, chestTop, 0.06); }
    // limbs
    const limb = (ua, fa, el, sh, e, h, hand, cutK, stump) => {
      at(m[sh], J[e === 'elL' ? 'shL' : 'shR'], 0.075 * b);
      if (cut[cutK]) { m[ua].visible = m[el].visible = false; at(m[stump], J[e === 'elL' ? 'shL' : 'shR'], 0.06); between(m[fa], J[e], J[h], 0.045 * b); at(m[hand], J[h], 0.05 * b); return; }
      between(m[ua], J[e === 'elL' ? 'shL' : 'shR'], J[e], 0.06 * b); at(m[el], J[e], 0.055 * b); between(m[fa], J[e], J[h], 0.048 * b); at(m[hand], J[h], 0.052 * b, 0.06 * b, 0.055 * b);
    };
    limb('uaL', 'faL', 'elL', 'shoL', 'elL', 'haL', 'haL', 'armL', 'stumpA');
    limb('uaR', 'faR', 'elR', 'shoR', 'elR', 'haR', 'haR', 'armR', 'stumpB');
    const leg = (th, sh, kn, ft, hip, knee, foot, cutK) => {
      if (cut[cutK]) { m[th].visible = false; at(m[kn], J[knee], 0.07 * b); between(m[sh], J[knee], J[foot], 0.065 * b); }
      else { between(m[th], J[hip], J[knee], 0.085 * b, 0.085 * b); at(m[kn], J[knee], 0.07 * b); between(m[sh], J[knee], J[foot], 0.065 * b); }
      // foot box points along body forward
      tmpV.crossVectors(UP, side).normalize(); const fp = V3().copy(J[foot]).addScaledVector(tmpV, 0.06); fp.y = Math.max(fp.y, J[foot].y);
      between(m[ft], J[foot], fp.addScaledVector(tmpV, 0.12), 0.1 * b, 0.075, UP);
    };
    leg('thL', 'shL', 'knL', 'ftL', 'hipL', 'knL', 'ftL', 'legL');
    leg('thR', 'shR', 'knR', 'ftR', 'hipR', 'knR', 'ftR', 'legR');
    if (!cut.head || this.head.userData.free) { this.head.position.copy(J.head); this.head.quaternion.copy(headQ); this.head.scale.setScalar(b > 1.15 ? 1.06 : 1); }
  }
  flash(on) {
    if (on === this._fl) return; this._fl = on;
    this.group.traverse(o => { if (o.isMesh) { if (on) { o.userData.mat = o.userData.mat || o.material; o.material = this.flashMat; } else if (o.userData.mat) o.material = o.userData.mat; } });
  }
  dispose() { scene.remove(this.group); }
}

// 2-bone IK in 3D: returns the middle joint
export function ik3(a, t, l1, l2, pole, out = V3()) {
  tmpV.subVectors(t, a); let d = tmpV.length(); d = clamp(d, Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  const dir = tmpV.normalize();
  const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
  tmpV2.copy(pole).addScaledVector(dir, -pole.dot(dir)); if (tmpV2.lengthSq() < 1e-6) tmpV2.set(0, -1, 0); tmpV2.normalize();
  return out.copy(a).addScaledVector(dir, cosA * l1).addScaledVector(tmpV2, sinA * l1);
}

// ---------- actor ----------
const JNAMES = ['head', 'neck', 'pelvis', 'shL', 'elL', 'haL', 'shR', 'elR', 'haR', 'hipL', 'knL', 'ftL', 'hipR', 'knR', 'ftR'];
export class Actor {
  constructor(o) {
    const A = ARCH[o.kind] || ARCH.npc;
    this.kind = o.kind; this.arch = A; this.team = o.team || 'enemy'; this.id = o.id || null; this.name = o.name || null; this.boss = !!(o.boss || A.boss);
    this.pos = V3(o.x || 0, o.y || 0, o.z || 0); this.vel = V3(); this.yaw = o.yaw !== undefined ? o.yaw : (this.team === 'enemy' ? -PI / 2 : PI / 2);
    this.aimYaw = this.yaw; this.aimPitch = 0; this.aimPoint = null;
    this.maxHp = o.hp || A.hp; this.hp = this.maxHp; this.armor = o.armor !== undefined ? o.armor : (A.armor || 0); this.maxArmor = Math.max(1, this.armor);
    let look = o.look ? (typeof o.look === 'string' ? lookOf(o.look) : o.look) : lookOf(A.look || 'thug');
    if (A.armorLook || (this.armor > 0 && this.team === 'enemy' && !this.boss)) look = Object.assign({}, look, { armor: true });
    this.look = look; this.body = new Body(look); scene.add(this.body.group);
    const guns = o.guns || (A.weapon ? [A.weapon] : []); this.guns = guns.map(k => new Gun(k)); this.gi = 0;
    this.gunHolder = new THREE.Group(); scene.add(this.gunHolder); this.carryMesh = null;
    this.onGround = true; this.crouching = false; this.crouch = 0; this.walkPh = rand(TAU); this.stepT = 0; this.sprint = false;
    this.roll = 0; this.rollDir = V3(); this.melee = null; this.combo = 0; this.queued = false; this.meleeCd = 0;
    this.stagger = 0; this.hurtFlash = 0; this.burn = 0; this.kick = 0; this.alive = true; this.hurtT = 9; this.iframes = 0; this.lastStandCd = 0; this.burstDmg = 0;
    this.move = V3(); this.wantJump = false; this.wantFire = false;
    this.ai = { state: o.alert ? 'alert' : 'idle', t: rand(0, 1), react: A.react || 0.5, burst: 0, pause: rand(0.3, 1), strafeT: 0, strafe: 0, err: V3(), patrol: o.patrol || 0, home: this.pos.clone() };
    this.downed = 0; this.invuln = !!o.invuln; this.passive = !!o.passive; this.frozen = false; this.cine = null; this.mounted = null; this.sit = false;
    this.reloadMul = 1; this.bangCd = 10; this.J = {}; for (const n of JNAMES) this.J[n] = V3();
    this.side = V3(1, 0, 0); this.headQ = new THREE.Quaternion(); this.gunMat = new THREE.Matrix4();
    this.radius = 0.32; this.pose(0);
  }
  get gun() { return this.guns[this.gi] || null; }
  isPlayer() { return this.kind === 'player'; }
  reserve(t) { return this.isPlayer() ? (G.state.ammo[t] || 0) : 999; }
  useReserve(t, n) { if (this.isPlayer()) G.state.ammo[t] = Math.max(0, (G.state.ammo[t] || 0) - n); }
  pan() { const lv = G.level; if (!lv || this.isPlayer()) return 0; tmpV.subVectors(this.pos, lv.camPos); const r = V3(Math.cos(lv.camYaw), 0, -Math.sin(lv.camYaw)); return clamp(-tmpV.dot(r) / 12, -1, 1); }
  vol() { if (this.isPlayer()) return 1; const lv = G.level; return lv ? clamp(1 - this.pos.distanceTo(lv.camPos) / 60, 0.12, 0.9) : 0.6; }
  height() { return this.crouching || this.roll > 0 ? 1.2 : 1.8; }
  center() { return V3(this.pos.x, this.pos.y + this.height() * 0.55, this.pos.z); }
  headPos() { return this.J.head.clone(); }
  fwd(out = V3()) { return out.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  // local->world
  L(x, y, z, out = V3()) { const s = Math.sin(this.yaw), c = Math.cos(this.yaw); return out.set(this.pos.x - c * x + s * z, this.pos.y + y, this.pos.z + s * x + c * z); }
  gunPoint(name) { const g = this.gun; const p = g && g.parts && g.parts[name]; return p ? p.clone().applyMatrix4(this.gunMat) : this.J.haR.clone(); }
  gunLocal(x, y, z) { return V3(x, y, z).applyMatrix4(this.gunMat); }
  pouch() { return this.L(-0.16, this.J.pelvis.y - this.pos.y + 0.02, 0.1); }

  // ---------- pose ----------
  pose(dt) {
    const J = this.J, b = this.look.build || 1, A = this.arch;
    const s = Math.sin(this.yaw), c = Math.cos(this.yaw);
    // local velocity
    const vf = this.vel.x * s + this.vel.z * c, vr = -(this.vel.x * c - this.vel.z * s);
    const spd = Math.hypot(this.vel.x, this.vel.z), sp = clamp(spd / 5, 0, 1.4);
    const cr = this.crouch;
    const bob = this.onGround ? Math.abs(Math.sin(this.walkPh)) * 0.04 * sp : 0;
    let py = 0.95 - cr * 0.33 + bob; if (this.downed > 0) py = 0.35; if (this.sit) py = 0.55;
    const lean = clamp(vf / 5, -0.6, 1.2) * 0.08 + (this.melee && this.melee.kind === 'kick' ? -0.08 : 0) + (this.stagger > 0 ? -0.1 : 0) + (this.downed > 0 ? -0.2 : 0);
    this.L(0, py, 0, J.pelvis); this.L(0, py + 0.48 - cr * 0.04, lean + cr * 0.12, J.neck);
    // head looks toward aim pitch
    this.L(0, py + 0.65 - cr * 0.04, lean + cr * 0.12 + 0.02, J.head);
    this.L(0.19 * b, py + 0.44 - cr * 0.04, lean + cr * 0.12, J.shR); this.L(-0.19 * b, py + 0.44 - cr * 0.04, lean + cr * 0.12, J.shL);
    this.L(0.1 * b, py - 0.05, 0, J.hipR); this.L(-0.1 * b, py - 0.05, 0, J.hipL);
    this.side.set(-c, 0, s); // body right
    // legs: step along the direction of travel; the lifted foot swings forward
    let fR, fL;
    if (this.sit) { fR = this.L(0.12, 0.05, 0.55); fL = this.L(-0.12, 0.05, 0.5); }
    else if (this.downed > 0) { fR = this.L(0.15, 0.02, 0.7); fL = this.L(-0.15, 0.02, 0.6); }
    else if (!this.onGround) { fR = this.L(0.12, py - 0.62, 0.22); fL = this.L(-0.12, py - 0.7, -0.12); }
    else if (this.melee && this.melee.kind === 'kick') { const e = this.meleeExt(); fR = this.L(0.1, 0.05 + e * 0.75, 0.15 + e * 0.6); fL = this.L(-0.12, 0.02, -0.1); }
    else if (sp > 0.05) {
      const p = this.walkPh, st = (0.28 + 0.2 * Math.min(sp, 1)) * (1 - cr * 0.3), lift = 0.16 * Math.min(sp, 1.2);
      const dl = Math.hypot(vf, vr) || 1, df = vf / dl, dr = vr / dl;
      const sR = Math.sin(p) * st, sL = -Math.sin(p) * st;
      fR = this.L(0.12 + dr * sR, 0.02 + Math.max(0, Math.cos(p)) * lift, df * sR + 0.03);
      fL = this.L(-0.12 + dr * sL, 0.02 + Math.max(0, -Math.cos(p)) * lift, df * sL + 0.03);
    } else { fR = this.L(0.14 + cr * 0.05, 0.02, 0.06 + cr * 0.18); fL = this.L(-0.14 - cr * 0.05, 0.02, -0.06 - cr * 0.12); }
    J.ftR.copy(fR); J.ftL.copy(fL);
    const fwd = this.fwd(V3());
    ik3(J.hipR, J.ftR, 0.45, 0.45, fwd, J.knR); ik3(J.hipL, J.ftL, 0.45, 0.45, fwd, J.knL);
    // arms + gun
    const g = this.gun;
    const poleL = V3().copy(this.side).multiplyScalar(-0.6).add(V3(0, -1, 0)).addScaledVector(fwd, -0.3), poleR = V3().copy(this.side).multiplyScalar(0.6).add(V3(0, -1, 0)).addScaledVector(fwd, -0.3);
    this.gunHolder.visible = false;
    if (this.melee && !this.melee.armed) {
      const e = this.meleeExt(), k = this.melee.kind, chest = this.L(0, py + 0.38, 0.1);
      const guardR = this.L(0.12, py + 0.42, 0.3), guardL = this.L(-0.1, py + 0.45, 0.32);
      if (k === 'jab') { J.haL.copy(this.L(-0.12, py + 0.45, 0.25 + e * 0.42)); J.haR.copy(guardR); }
      else if (k === 'cross') { J.haR.copy(this.L(0.05, py + 0.45, 0.25 + e * 0.48)); J.haL.copy(guardL); }
      else { J.haR.copy(guardR); J.haL.copy(guardL); }
    } else if (g && g.melee) {
      let a = 0.4; if (this.melee) { const k = this.melee.t / this.melee.dur; a = k < 0.35 ? lerp(0.4, -2.0, ease(k / 0.35)) : k < 0.55 ? lerp(-2.0, 1.1, (k - 0.35) / 0.2) : lerp(1.1, 0.4, (k - 0.55) / 0.45); }
      J.haR.copy(this.L(0.24, py + 0.44 - Math.cos(a) * 0.05 + Math.sin(-a) * 0.35, 0.12 + Math.cos(a) * 0.35));
      J.haL.copy(this.L(-0.18, py + 0.15, 0.15));
      this.gunHolder.visible = true; const mdl = g.ensureModel(); if (mdl.parent !== this.gunHolder) { this.gunHolder.clear(); this.gunHolder.add(mdl); }
      const dir = V3(Math.sin(this.yaw) * Math.cos(a), -Math.sin(a), Math.cos(this.yaw) * Math.cos(a)).normalize();
      tmpV.crossVectors(UP, dir).normalize(); tmpV2.crossVectors(dir, tmpV).normalize();
      this.gunMat.makeBasis(tmpV, tmpV2, dir).setPosition(J.haR); this.gunHolder.matrixAutoUpdate = false; this.gunHolder.matrix.copy(this.gunMat); this.gunHolder.matrixWorldNeedsUpdate = true;
    } else if (g && this.downed <= 0) {
      const d = g.def; const [tilt, roll] = g.tilt();
      let yaw = this.aimYaw, pitch = this.aimPitch;
      if (g.reload) { const w = g.weight(); pitch = lerp(pitch, -0.35, w); yaw = this.yaw + angDiff(this.yaw, yaw) * (1 - w); }
      if (this.roll > 0 || this.cineLower || this.sprint && !this.wantFire) { pitch = -0.6; yaw = this.yaw + 0.5; }
      pitch += tilt + this.kick;
      const dir = V3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
      tmpV.crossVectors(UP, dir).normalize(); // gun local +X (character's left)
      tmpV2.crossVectors(dir, tmpV).normalize();
      if (roll) { const q = tmpQ.setFromAxisAngle(dir, roll); tmpV.applyQuaternion(q); tmpV2.applyQuaternion(q); }
      const ho = d.hold, sho = J.shR;
      const origin = V3().copy(sho).addScaledVector(tmpV, -ho[0] + 0.12).addScaledVector(tmpV2, ho[1]).addScaledVector(dir, ho[2] - this.kick * 0.15);
      this.gunMat.makeBasis(tmpV, tmpV2, dir).setPosition(origin);
      const mdl = g.ensureModel(); if (mdl.parent !== this.gunHolder) { this.gunHolder.clear(); this.gunHolder.add(mdl); }
      g.pose(); this.gunHolder.visible = true; this.gunHolder.matrixAutoUpdate = false; this.gunHolder.matrix.copy(this.gunMat); this.gunHolder.matrixWorldNeedsUpdate = true;
      J.haR.copy(origin);
      J.haL.copy(this.supportTarget(g));
    } else {
      const sw = Math.sin(this.walkPh) * 0.22 * Math.min(sp, 1);
      J.haR.copy(this.L(0.24, py - 0.02, -sw)); J.haL.copy(this.L(-0.24, py - 0.02, sw));
      if (this.downed > 0) { J.haR.copy(this.L(0.25, 0.05, 0.3)); J.haL.copy(this.L(-0.25, 0.05, 0.2)); }
      if (this.cineGesture) J.haR.copy(this.L(0.25, py + 0.4, 0.45));
    }
    ik3(J.shR, J.haR, 0.29, 0.28, poleR, J.elR); ik3(J.shL, J.haL, 0.29, 0.28, poleL, J.elL);
    // carried magazine / shell
    if (g && g.carry) { if (!this.carryMesh || this.carryMesh.userData.kind !== g.carry) { if (this.carryMesh) scene.remove(this.carryMesh); this.carryMesh = magModel(g.carry === 'pistol' ? 'pistol' : g.carry); this.carryMesh.userData.kind = g.carry; scene.add(this.carryMesh); } this.carryMesh.visible = true; this.carryMesh.position.copy(J.haL).add(V3(0, -0.05, 0)); this.carryMesh.quaternion.setFromRotationMatrix(this.gunMat); }
    else if (this.carryMesh) this.carryMesh.visible = false;
    // head orientation (yaw + pitch toward aim)
    const hy = this.downed > 0 ? this.yaw : this.yaw + clamp(angDiff(this.yaw, this.aimYaw), -0.8, 0.8);
    const hp = this.downed > 0 ? -0.3 : clamp(this.aimPitch, -0.5, 0.5) * 0.6 + (this.stagger > 0 ? 0.3 : 0);
    this.headQ.setFromEuler(new THREE.Euler(-hp, hy, 0, 'YXZ'));
    this.body.render(J, this.side, this.headQ);
    this.body.flash(this.hurtFlash > 0.05);
  }
  supportTarget(g) {
    const d = g.def, P = g.parts, R = g.reload, loc = v => v.clone().applyMatrix4(this.gunMat);
    const named = n => {
      switch (n) {
        case 'support': return loc(P.support);
        case 'well': return loc(P.well);
        case 'wellLow': return loc(P.well).add(V3(0, -0.12, 0));
        case 'pouch': return this.pouch();
        case 'rack': return loc(P.rack || P.support);
        case 'rackBack': return loc((P.rack || P.support).clone().add(V3(0, 0, -0.07)));
        case 'cyl': return loc(P.well);
        case 'cylPush': return loc(P.well.clone().add(V3(0, 0, 0.08)));
        case 'cylLow': return loc(P.well).add(V3(0, -0.1, 0));
        case 'cover': return loc(P.coverPt || P.support);
        case 'coverUp': return loc((P.coverPt || P.support).clone().add(V3(0, 0.15, 0)));
        case 'pump': return loc(P.support.clone().add(V3(0, 0, -g.pump * 0.1)));
        case 'port': return loc(P.well);
      }
      return loc(P.support);
    };
    if (!R) return d.reloadType === 'shell' ? named('pump') : named('support');
    if (d.reloadType === 'shell') {
      if (R.phase === 'start') return named('pump').lerp(named('port'), ease(clamp(R.t / R.dur, 0, 1)));
      if (R.phase === 'shell') { const k = R.t / R.dur, m = k < 0.4 ? ease(k / 0.4) : k < 0.5 ? 1 : 1 - ease((k - 0.5) / 0.5); return named('port').lerp(this.pouch(), m); }
      return named('pump');
    }
    const [a, b, k] = track(TRACKS[d.reloadType].hand, clamp(R.t / R.dur, 0, 1));
    return named(a).lerp(named(b), k);
  }
  meleeExt() { if (!this.melee) return 0; const k = this.melee.t / this.melee.dur; return k < 0.35 ? ease(k / 0.35) : k < 0.6 ? 1 : 1 - ease((k - 0.6) / 0.4); }

  // ---------- update ----------
  update(dt, lv) {
    if (!this.alive) return;
    this.hurtFlash -= dt; this.stagger -= dt; this.meleeCd -= dt; this.hurtT += dt; this.kick = Math.max(0, this.kick - dt * 2.5);
    this.iframes -= dt; this.lastStandCd -= dt; this.burstDmg = Math.max(0, this.burstDmg - dt * 26);
    if (this.downed > 0) { this.downed -= dt; this.vel.set(0, 0, 0); if (this.downed <= 0) { this.hp = this.maxHp * 0.5; lv.banter('walter', choose(['I\'m alright. Keep moving.', 'Ugh. I\'m up. I\'m up.'])); } this.physics(dt, lv); this.pose(dt); return; }
    if (this.burn > 0) { this.burn -= dt; if (Math.random() < 0.7) lv.fx.flame(V3(this.pos.x + rand(-0.2, 0.2), this.pos.y + rand(0.2, 1.7), this.pos.z + rand(-0.2, 0.2)), 1); this._bt = (this._bt || 0) - dt; if (this._bt <= 0) { this._bt = 0.25; this.hurt(4, { kind: 'fire', p: this.center() }, lv); } }
    if (this.isPlayer()) { this.regenerating = this.hurtT > 2.5; if (this.regenerating && this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + dt * 20); }
    this.wantFire = false;
    if (this.cine) this.cineControl(dt, lv);
    else if (this.isPlayer() && !lv.cinematic && !lv.failed && !lv.done) lv.playerControl(this, dt);
    else if (!this.isPlayer() && !this.frozen && !lv.cinematic) this.aiControl(dt, lv);
    else { this.move.set(0, 0, 0); this.crouching = false; }
    if (this.stagger > 0) { this.move.set(0, 0, 0); this.wantFire = false; }
    if (this.melee) { this.melee.t += dt; const k = this.melee.t / this.melee.dur; if (!this.melee.hit && k >= (this.melee.armed ? 0.45 : 0.38)) { this.melee.hit = true; this.meleeStrike(lv); } if (k >= 1) { const q = this.queued; this.melee = null; this.queued = false; if (q) this.startMelee(lv); else this.combo = 0; } }
    if (this.mounted) { this.onGround = true; this.vel.set(0, 0, 0); } else this.physics(dt, lv);
    this.pose(dt);
    const g = this.gun;
    if (g) g.update(dt, this, lv);
    if (this.wantFire && g && !g.melee && !this.melee && this.roll <= 0) lv.fire(this);
    if (g && !g.melee && g.mag === 0 && !g.reload && this.roll <= 0 && g.cd <= 0 && (!this.isPlayer() || this.autoReload)) g.startReload(this);
  }
  physics(dt, lv) {
    const A = this.arch; let sp = (A.speed || 4) * (this.crouching ? 0.45 : 1) * (this.sprint ? 1.45 : 1) * (this.burn > 0 && this.team === 'enemy' ? 1.3 : 1);
    if (this.isPlayer() && this.aiming) sp *= 0.6;
    if (this.roll > 0) { this.roll -= dt; this.vel.x = this.rollDir.x * 9; this.vel.z = this.rollDir.z * 9; }
    else {
      const tx = this.move.x * sp, tz = this.move.z * sp, acc = (this.onGround ? 40 : 14) * dt;
      this.vel.x += clamp(tx - this.vel.x, -acc, acc); this.vel.z += clamp(tz - this.vel.z, -acc, acc);
    }
    if (this.wantJump && this.onGround && !this.crouching) { this.vel.y = 5.6; this.onGround = false; Audio.play('whoosh', this.pan(), this.vol() * 0.5); }
    this.wantJump = false;
    this.vel.y -= 16 * dt; if (this.vel.y < -30) this.vel.y = -30;
    const was = this.onGround;
    lv.moveActor(this, dt);
    if (!was && this.onGround) { Audio.play('land', this.pan(), this.vol() * 0.6); lv.fx.dust(this.pos, 4); }
    const spd = Math.hypot(this.vel.x, this.vel.z);
    if (this.onGround && spd > 0.3) {
      const vf = this.vel.x * Math.sin(this.yaw) + this.vel.z * Math.cos(this.yaw);
      this.walkPh += dt * spd * 2.4 * (vf < -0.2 ? -1 : 1);
      this.stepT -= dt; if (this.stepT <= 0) { this.stepT = 0.34; if (this.isPlayer()) Audio.play('step', 0, 0.6); }
    }
    this.crouch = lerp(this.crouch, this.crouching && this.onGround ? 1 : 0, Math.min(1, dt * 12));
  }
  cineControl(dt, lv) {
    this.cineT = (this.cineT || 0) + dt;
    const tx = this.cine.x - this.pos.x, tz = this.cine.z - this.pos.z, d = Math.hypot(tx, tz);
    if (d < 0.25 || this.cineT > 10) { this.move.set(0, 0, 0); if (this.cineT > 10) { this.pos.x = this.cine.x; this.pos.z = this.cine.z; } this.cine = null; this.cineT = 0; this.cineLower = false; return; }
    const k = this.cineWalk ? 0.42 : 0.8; this.move.set(tx / d * k, 0, tz / d * k); this.yaw = Math.atan2(tx, tz); this.aimYaw = this.yaw; this.aimPitch = -0.2; this.cineLower = true;
    if (this.blocked && this.onGround) this.wantJump = true;
  }
  startMelee(lv) {
    if (this.meleeCd > 0 && !this.melee) return;
    const g = this.gun;
    if (g && g.melee) { this.melee = { t: 0, dur: g.def.rate, armed: true, kind: 'swing', hit: false }; this.meleeCd = g.def.rate + 0.3; Audio.play('whoosh', this.pan(), this.vol()); return; }
    if (g && g.reload && g.def.reloadType === 'shell') g.cancelReload();
    const kind = ['jab', 'cross', 'kick'][this.combo % 3]; this.combo++;
    this.melee = { t: 0, dur: kind === 'kick' ? 0.42 : 0.26, kind, hit: false }; this.meleeCd = 0.15; Audio.play('whoosh', this.pan(), this.vol() * 0.7);
  }
  meleeStrike(lv) {
    const m = this.melee, f = this.fwd(V3());
    const reach = m.armed ? this.gun.def.reach : m.kind === 'kick' ? 1.5 : 1.3;
    const dmg = m.armed ? this.gun.def.dmg : m.kind === 'kick' ? 30 : m.kind === 'cross' ? 22 : 16;
    let any = false;
    for (const a of lv.actors) {
      if (!a.alive || a === this || a.downed > 0 || a.passive || !lv.hostile(this, a)) continue;
      tmpV.subVectors(a.pos, this.pos); tmpV.y = 0; const d = tmpV.length(); if (d > reach + 0.3 || Math.abs(a.pos.y - this.pos.y) > 1.2) continue;
      if (d > 0.2 && tmpV.normalize().dot(f) < 0.35) continue; if (a.roll > 0) continue;
      any = true;
      let mul = this.team === 'enemy' ? 0.7 : 1;
      if (this.isPlayer() && a.ai.state === 'idle' && !a.boss) { mul = 8; lv.toast('Takedown'); }
      if (this.isPlayer() && G.state.upgrades.fists) mul *= 1.5;
      const hp = a.center().add(V3(0, m.kind === 'kick' ? -0.1 : 0.4, 0));
      a.hurt(dmg * mul, { kind: 'melee', p: hp, dir: f.clone(), knock: m.kind === 'kick' ? 9 : 4, from: this }, lv);
      if (a.alive) { a.stagger = m.kind === 'kick' ? 0.55 : 0.3; a.vel.addScaledVector(f, m.kind === 'kick' ? 7 : 3); if (m.kind === 'kick') a.vel.y = 3; const ag = a.gun; if (ag && ag.reload) ag.abort(); }
    }
    for (const b of lv.barrels) if (b.alive && b.pos.distanceTo(V3().copy(this.pos).addScaledVector(f, 0.9)) < 0.9) { lv.hitBarrel(b, 40); any = true; }
    if (any) { Audio.play('punch', this.pan(), this.vol()); lv.shake(m.kind === 'kick' || m.armed ? 0.5 : 0.25); lv.hitstop = m.kind === 'kick' ? 0.07 : 0.035; }
  }
  switchGun(i) { const g = this.gun; if (g) g.abort(); this._lastGi = this.gi; this.gi = i; Audio.play('clank', 0, 0.4); }

  // ---------- AI ----------
  aiControl(dt, lv) {
    const ai = this.ai, A = this.arch; this.move.set(0, 0, 0); this.crouching = false; this.sprint = false;
    if (this.passive) return;
    if (this.team === 'ally') return this.allyControl(dt, lv);
    const tgt = lv.nearestHostile(this) || (ai.state === 'alert' ? lv.nearestHostile(this, 1e9) : null);
    if (!tgt) return;
    tmpV.subVectors(tgt.pos, this.pos); tmpV.y = 0; const d = tmpV.length(), dir = tmpV.clone().normalize();
    const eye = V3(this.pos.x, this.pos.y + 1.6 - this.crouch * 0.4, this.pos.z);
    let aimAt = tgt.center(), los = d < 45 && lv.los(eye, aimAt);
    if (!los && d < 45) { const h = tgt.headPos(); if (lv.los(eye, h)) { los = true; aimAt = h.add(V3(0, -0.05, 0)); } }
    const yawTo = Math.atan2(dir.x, dir.z);
    if (ai.state === 'idle') {
      if (ai.patrol) { ai.t += dt; const s = Math.sin(ai.t * 0.6) > 0 ? 1 : -1; this.move.set(s * 0.35, 0, 0); this.yaw = s > 0 ? PI / 2 : -PI / 2; if (Math.abs(this.pos.x - ai.home.x) > ai.patrol) this.move.set(sign(ai.home.x - this.pos.x) * 0.35, 0, 0); }
      this.aimYaw = this.yaw; this.aimPitch = -0.4;
      const sight = lv.def.stealth ? 15 : 30, close = lv.def.stealth ? 3.5 : 9, facing = Math.cos(angDiff(this.yaw, yawTo)) > 0.3;
      if ((los && d < sight && facing) || (los && d < close) || ai.heard) { ai.react -= dt; if (ai.react <= 0) this.alert(lv); }
      return;
    }
    if (this.burn > 0 && !this.boss) { this.move.set(Math.sin(lv.time * 3 + this.pos.z), 0, Math.cos(lv.time * 2.3 + this.pos.x)); this.yaw = Math.atan2(this.move.x, this.move.z); return; }
    this.yaw += angDiff(this.yaw, yawTo) * Math.min(1, dt * 8);
    const g = this.gun;
    if (A.melee || (g && g.melee)) {
      const reach = g && g.melee ? g.def.reach : 1.2;
      if (d > reach * 0.8) this.move.copy(dir);
      if (this.blocked && this.onGround && Math.random() < 0.08) this.wantJump = true;
      if (d < reach + 0.2 && Math.abs(tgt.pos.y - this.pos.y) < 1.2 && !this.melee && this.meleeCd <= 0) this.startMelee(lv);
      if (this.kind === 'marco' && !this.melee && d > 8 && (ai.chargeCd = (ai.chargeCd || 3) - dt) <= 0) { ai.chargeCd = rand(3, 5); this.vel.addScaledVector(dir, 12); this.vel.y = 3.5; this.onGround = false; Audio.play('whoosh'); }
      this.aimYaw = this.yaw; this.aimPitch = 0; return;
    }
    // aim with lag and error
    ai.err.lerp(V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(0.7), dt * 2);
    const tp = aimAt.clone().add(ai.err), sh = this.J.shR;
    const wantYaw = Math.atan2(tp.x - sh.x, tp.z - sh.z), wantPitch = Math.atan2(tp.y - sh.y, Math.hypot(tp.x - sh.x, tp.z - sh.z));
    this.aimYaw += angDiff(this.aimYaw, wantYaw) * Math.min(1, dt * 7); this.aimPitch = lerp(this.aimPitch, wantPitch, Math.min(1, dt * 7));
    const [dmin, dmax] = A.dist || [8, 18];
    ai.strafeT -= dt;
    if (ai.strafeT <= 0) { ai.strafeT = rand(0.8, 2.2); ai.strafe = Math.random() < 0.55 ? choose([-1, 1]) * 0.6 : 0; ai.crouch = Math.random() < (this.boss ? 0.1 : 0.3); }
    const perp = V3(dir.z, 0, -dir.x);
    if (!los) this.move.copy(dir).multiplyScalar(0.9).addScaledVector(perp, 0.4 * (ai.strafe || 0.5));
    else if (d > dmax) this.move.copy(dir);
    else if (d < dmin) this.move.copy(dir).multiplyScalar(-0.7);
    else { this.move.copy(perp).multiplyScalar(ai.strafe); this.crouching = ai.crouch && this.onGround; }
    if (this.blocked && this.onGround && !los && Math.random() < 0.02) this.wantJump = true;
    if (g && g.reload) { this.move.copy(dir).multiplyScalar(-0.5); this.crouching = true; }
    for (const o of lv.actors) if (o !== this && o.alive && o.team === this.team && !o.mounted) { tmpV2.subVectors(this.pos, o.pos); tmpV2.y = 0; const dd = tmpV2.length(); if (dd < 1.0 && dd > 0) { this.move.addScaledVector(tmpV2.normalize(), 0.6); break; } }
    if (this.move.lengthSq() > 1) this.move.normalize();
    if (los && g && !g.reload && d < 40) {
      ai.pause -= dt;
      if (ai.pause <= 0) {
        if (g.def.auto) { this.wantFire = true; ai.burst -= dt; if (ai.burst <= 0) { ai.burst = rand(0.25, 0.6) * (this.boss ? 1.7 : 1); ai.pause = rand(0.8, 1.7) * (this.boss ? 0.6 : 1); } }
        else { this.wantFire = true; ai.pause = rand(0.75, 1.5) * (this.boss ? 0.5 : 1) * (g.def.reloadType === 'shell' ? 1.15 : 1); }
      }
    }
    if (this.kind === 'rafa' && (ai.dashCd = (ai.dashCd || 4) - dt) <= 0) { ai.dashCd = rand(3, 5); this.roll = 0.42; this.rollDir.copy(perp).multiplyScalar(choose([-1, 1])); }
    if (this.kind === 'dutch' && this.hp < this.maxHp * 0.5 && !ai.enraged) { ai.enraged = true; this.arch = Object.assign({}, A, { speed: 3.6 }); lv.banter('dutch', 'You think a little lead scares me, boy?!'); }
  }
  allyControl(dt, lv) {
    const ai = this.ai, p = lv.player; this.crouching = false;
    const enemy = lv.nearestHostile(this, 60);
    let los = false, tc = null;
    const eye = V3(this.pos.x, this.pos.y + 1.6, this.pos.z);
    if (enemy) { tc = enemy.center(); los = lv.los(eye, tc); if (!los) { const h = enemy.headPos(); if (lv.los(eye, h)) { los = true; tc = h; } } }
    if (p) {
      const pf = V3(Math.sin(p.yaw), 0, Math.cos(p.yaw)), pr = V3(-Math.cos(p.yaw), 0, Math.sin(p.yaw));
      let goal = V3().copy(p.pos).addScaledVector(pf, -0.6).addScaledVector(pr, -2.4);
      if (enemy && !los) { tmpV.subVectors(enemy.pos, p.pos).setY(0).normalize(); goal = V3().copy(p.pos).addScaledVector(tmpV, 0.8).addScaledVector(pr, -2.0); }
      if (enemy && (enemy.arch.melee || (enemy.gun && enemy.gun.melee)) && enemy.pos.distanceTo(this.pos) < 3.5) { tmpV.subVectors(this.pos, enemy.pos).setY(0).normalize(); goal = V3().copy(this.pos).addScaledVector(tmpV, 4); }
      tmpV.subVectors(goal, this.pos).setY(0); const d = tmpV.length();
      if (d > 0.8) this.move.copy(tmpV.normalize()).multiplyScalar(d > 6 ? 1 : 0.6); else this.move.set(0, 0, 0);
      this.sprint = d > 9;
      if (this.blocked && this.onGround) this.wantJump = true;
      if (this.pos.distanceTo(p.pos) > 35) { this.pos.copy(p.pos).addScaledVector(pf, -3); this.vel.set(0, 0, 0); }
    }
    if (enemy) {
      const sh = this.J.shR, wy = Math.atan2(tc.x - sh.x, tc.z - sh.z), wp = Math.atan2(tc.y - sh.y, Math.hypot(tc.x - sh.x, tc.z - sh.z));
      this.yaw += angDiff(this.yaw, wy) * Math.min(1, dt * 8); this.aimYaw += angDiff(this.aimYaw, wy) * Math.min(1, dt * 10); this.aimPitch = lerp(this.aimPitch, wp, Math.min(1, dt * 10));
      ai.pause -= dt; const g = this.gun;
      if (los && g && !g.reload && ai.pause <= 0 && Math.abs(angDiff(this.aimYaw, wy)) < 0.25) { this.wantFire = true; ai.pause = rand(0.28, 0.55); }
      this.bangCd -= dt;
      if (this.bangCd <= 0 && (G.state.walterBangs || G.state.chapter >= 1) && lv.countHostilesNear(enemy.pos, 5) >= 2 && enemy.pos.distanceTo(this.pos) < 22 && (!p || enemy.pos.distanceTo(p.pos) > 5)) {
        this.bangCd = rand(14, 20); lv.throwItem(this, 'bang', enemy.pos.clone().add(V3(0, 0.5, 0)));
        lv.banter('walter', choose(['Stand back.', 'Chemistry, gentlemen.', 'Let me handle this.', 'Fire in the hole!']));
      }
    } else if (this.move.lengthSq() > 0.01) { this.yaw += angDiff(this.yaw, Math.atan2(this.move.x, this.move.z)) * Math.min(1, dt * 6); this.aimYaw = this.yaw; this.aimPitch = -0.3; }
    else { this.aimYaw = this.yaw; this.aimPitch = -0.3; }
  }
  alert(lv) {
    if (this.ai.state === 'alert') return;
    this.ai.state = 'alert'; this.ai.pause = rand(0.6, 1.3) * (this.boss ? 0.5 : 1);
    if (Math.random() < 0.25 && this.team === 'enemy' && !this.boss) lv.shout(this, choose(['There he is!', 'Get him!', '¡Ahí está!', 'Light him up!', 'Over here!']));
  }

  hurt(dmg, o, lv) {
    if (!this.alive || this.downed > 0) return false;
    if (this.roll > 0 && o.kind === 'bullet' && this.isPlayer()) return false;
    if (this.isPlayer()) {
      if (G.cheatGod) dmg = 0;
      if (this.iframes > 0) return false;
      dmg *= G.diffMul();
      if (o.kind === 'fire') dmg *= 0.5;
      if (o.kind === 'bullet') dmg = Math.min(dmg, 20); else if (o.kind === 'melee') dmg = Math.min(dmg, 22);
      const allowed = Math.max(0, 35 - this.burstDmg); dmg = Math.min(dmg, allowed) + Math.max(0, dmg - allowed) * 0.15; this.burstDmg += dmg;
    }
    if (this.team === 'ally' && o.kind !== 'fire') dmg *= 0.5;
    let absorbed = 0;
    if (this.armor > 0 && o.kind !== 'fire') { absorbed = Math.min(this.armor, dmg * 0.65); this.armor -= absorbed; }
    if (this.isPlayer()) G.state.armor = this.armor;
    const real = dmg - absorbed;
    this.hp -= real; if (o.kind !== 'fire') this.hurtFlash = 0.08; this.hurtT = 0;
    if (o.kind === 'fire' && this.burn <= 0 && o.ignite !== false) this.burn = 3;
    if (o.ignite) this.burn = 3.5;
    if (this.team === 'enemy') { this.alert(lv); this.ai.react = 0; }
    if (this.isPlayer()) { lv.hurtVignette = Math.max(lv.hurtVignette, o.kind === 'fire' ? 0.3 : 0.6); if (o.kind !== 'fire' || Math.random() < 0.3) Audio.play('hurt'); if (o.kind !== 'fire') { lv.shake(0.25); lv.damageDir(o.from); } }
    if (o.kind !== 'fire' && o.p) { if (absorbed > real) lv.fx.spark(o.p, 6); else lv.fx.blood(o.p, o.dir || V3(0, 0, 0), o.head ? 26 : o.kind === 'melee' ? 8 : 14); }
    if (this.isPlayer() && this.hp <= 0 && this.lastStandCd <= 0 && !G.cheatGod) { this.hp = 1; this.iframes = 1.5; this.lastStandCd = 20; this.hurtT = 0; lv.toast('CLOSE CALL!'); lv.slowmo = 0.45; }
    if (this.hp <= 0) {
      if (this.id === 'walter' || this.invuln) { this.hp = 0; this.downed = 5; this.burn = 0; this.melee = null; lv.banter('walter', choose(['Agh! I\'m hit!', 'Jace! I\'m down!', 'Give me a moment...'])); return false; }
      this.die(o, lv); return true;
    }
    return false;
  }
  die(o, lv) {
    this.alive = false; this.gunHolder.visible = false; if (this.carryMesh) this.carryMesh.visible = false;
    if (this.mounted) this.vel.x += this.mounted.vx || 0;
    const rd = new Ragdoll(this, o, lv); lv.ragdolls.push(rd); if (lv.ragdolls.length > 30) lv.ragdolls.shift().dispose();
    // drop the gun as a physical prop
    const g = this.gun; if (g && g.model) lv.fx.dropGun(g.model, this);
    lv.onDeath(this, o);
  }
  dispose() { this.body.dispose(); scene.remove(this.gunHolder); if (this.carryMesh) scene.remove(this.carryMesh); }
}

// ---------- verlet ragdoll ----------
const STICKS = [['head', 'neck', 'head'], ['neck', 'pelvis'], ['shL', 'shR'], ['shL', 'neck'], ['shR', 'neck'], ['shL', 'pelvis'], ['shR', 'pelvis'], ['shL', 'elL', 'armL'], ['elL', 'haL'], ['shR', 'elR', 'armR'], ['elR', 'haR'], ['hipL', 'hipR'], ['hipL', 'pelvis'], ['hipR', 'pelvis'], ['hipL', 'neck'], ['hipR', 'neck'], ['hipL', 'shL'], ['hipR', 'shR'], ['hipL', 'knL', 'legL'], ['knL', 'ftL'], ['hipR', 'knR', 'legR'], ['knR', 'ftR'], ['head', 'shL', 'head', 0.5], ['head', 'shR', 'head', 0.5]];
export class Ragdoll {
  constructor(a, o, lv) {
    this.body = a.body; this.t = 0; this.cut = {}; this.burn = a.burn; this.yaw = a.yaw; this.drift = 0;
    this.P = {}; for (const n of JNAMES) { const p = a.J[n]; this.P[n] = { p: p.clone(), o: p.clone().addScaledVector(a.vel, -1 / 120) }; }
    this.sticks = STICKS.map(([i, j, tag, stiff]) => ({ i, j, tag, stiff: stiff || 1, len: a.J[i].distanceTo(a.J[j]) }));
    const dir = (o.dir || V3()).clone(); const k = (o.knock || 3) / 240;
    const hitPt = o.head ? 'head' : o.kind === 'melee' ? 'neck' : 'pelvis';
    this.push(hitPt, dir.clone().multiplyScalar(k * 1.8).add(V3(0, 0.01, 0)));
    for (const n in this.P) this.P[n].o.addScaledVector(dir, -k * 0.4).add(V3(0, -0.006, 0));
    const gore = Settings.gore;
    if (gore >= 2) {
      if (o.head && (o.power || 0) >= 80) this.sever('head', lv, dir);
      if (o.kind === 'blast' && o.close) { for (const part of ['armL', 'armR', 'legL', 'legR', 'head']) if (Math.random() < 0.45) this.sever(part, lv, dir); lv.fx.gib(a.center(), dir, 8); }
      if (o.shotgunClose && Math.random() < 0.6) this.sever(choose(['armL', 'head', 'armR']), lv, dir);
    }
    this.pool = 0; this.spurt = o.head ? 1.6 : 0.8;
  }
  push(n, v) { this.P[n].o.sub(v); }
  sever(part, lv, dir) {
    if (this.cut[part]) return; this.cut[part] = true;
    const idx = { head: 'head', armL: 'elL', armR: 'elR', legL: 'knL', legR: 'knR' }[part];
    this.P[idx].o.addScaledVector(dir, -0.08).add(V3(rand(-0.04, 0.04), -0.08, rand(-0.04, 0.04)));
    lv.fx.blood(this.P[idx].p, V3(0, 1, 0), 30); this.spurt = 2.2; this.spurtFrom = part === 'head' ? 'neck' : part === 'armL' ? 'shL' : part === 'armR' ? 'shR' : 'pelvis';
    if (part === 'head') this.body.head.userData.free = true;
    Audio.play('splat');
  }
  update(dt, lv) {
    this.t += dt;
    if (this.burn > 0) { this.burn -= dt; if (Math.random() < 0.6) lv.fx.flame(this.P.pelvis.p, 1); }
    if (this.spurt > 0 && Settings.gore > 0) { this.spurt -= dt; if (Math.random() < 0.5) lv.fx.blood(this.P[this.spurtFrom || 'neck'].p, V3(rand(-0.3, 0.3), 1, rand(-0.3, 0.3)), 2, 0.6); }
    if (this.t < 10) {
      const sub = 2, h = dt / sub;
      for (let s = 0; s < sub; s++) {
        for (const n in this.P) { const q = this.P[n]; const vx = (q.p.x - q.o.x) * 0.99, vy = (q.p.y - q.o.y) * 0.99, vz = (q.p.z - q.o.z) * 0.99; q.o.copy(q.p); q.p.x += vx; q.p.y += vy - 9.8 * h * h; q.p.z += vz; }
        for (let it = 0; it < 5; it++) {
          for (const st of this.sticks) {
            if (st.tag && this.cut[st.tag]) continue;
            const a = this.P[st.i].p, b = this.P[st.j].p; tmpV.subVectors(b, a); const d = tmpV.length() || 1e-4; const diff = (d - st.len) / d * 0.5 * st.stiff;
            a.addScaledVector(tmpV, diff); b.addScaledVector(tmpV, -diff);
          }
          for (const n in this.P) { const q = this.P[n], r = n === 'head' ? 0.11 : 0.06; const gy = lv.groundAt(q.p.x, q.p.z, q.p.y + 0.3) + r; if (q.p.y < gy) { q.p.y = gy; const fx = (q.p.x - q.o.x) * 0.35, fz = (q.p.z - q.o.z) * 0.35; q.o.x = q.p.x - fx; q.o.z = q.p.z - fz; if (lv.groundDrift) { q.p.x -= lv.groundDrift * h; q.o.x -= lv.groundDrift * h; } } lv.pushOutOfSolids(q.p, r); }
        }
      }
    } else if (lv.groundDrift) for (const n in this.P) { this.P[n].p.x -= lv.groundDrift * dt; }
    const pel = this.P.pelvis.p;
    if (this.t > 0.8 && this.t < 6 && Settings.gore > 0 && pel.y < lv.groundAt(pel.x, pel.z, pel.y + 0.3) + 0.25 && !lv.groundDrift) { this.pool += dt; if (this.pool > 0.3) { this.pool = 0; lv.fx.decalBlood(V3(pel.x + rand(-0.2, 0.2), 0, pel.z + rand(-0.2, 0.2)), 0.3 + this.t * 0.12); } }
    this.render();
  }
  render() {
    const J = {}; for (const n in this.P) J[n] = this.P[n].p;
    const side = V3().subVectors(J.shR, J.shL).normalize();
    tmpV.subVectors(J.head, J.neck).normalize(); const fw = V3().crossVectors(side, tmpV).normalize();
    const m = new THREE.Matrix4().makeBasis(side.clone().negate(), tmpV, fw.negate()); const q = new THREE.Quaternion().setFromRotationMatrix(m);
    this.body.render(J, side, q, this.cut);
    this.body.flash(false);
  }
  dispose() { this.body.dispose(); }
}
