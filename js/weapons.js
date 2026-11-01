'use strict';
// ============================================================
//  FIXING GOOD - weapons + reload animation system
// ============================================================
const WEAPONS = {
  pistol: { name: 'M9 Sidearm', art: 'pistol', ammo: '9mm', mag: 15, dmg: 26, rate: 0.17, auto: false, spread: 0.025, bullets: 1, speed: 2600, recoil: 0.10, hold: [24, 2], support: [0, 2], muzzle: [19, -7.5], eject: [6, -11], well: [-3, 10], rack: [-4, -8], rackBack: [-11, -8], magKind: 'pistol', reloadType: 'mag', reload: 1.3, sound: 'pistol', shake: 2.5, knock: 90, price: 0, desc: 'Reliable 9mm sidearm. Fast reloads.' },
  gold: { name: 'Gold Pistols', art: 'pistol', gold: true, ammo: '9mm', mag: 18, dmg: 30, rate: 0.12, auto: false, spread: 0.035, bullets: 1, speed: 2600, recoil: 0.10, hold: [24, 2], support: [0, 2], muzzle: [19, -7.5], eject: [6, -11], well: [-3, 10], rack: [-4, -8], rackBack: [-11, -8], magKind: 'pistol', reloadType: 'mag', reload: 1.1, sound: 'pistol', shake: 2.5, knock: 100, price: 0, desc: 'Rafa\'s gaudy gold-plated 9mm. Loud and proud.' },
  revolver: { name: '.357 Magnum', art: 'revolver', ammo: '357', mag: 6, dmg: 70, rate: 0.42, auto: false, spread: 0.015, bullets: 1, speed: 3000, recoil: 0.28, hold: [24, 2], support: [0, 2], muzzle: [27, -8], cylPos: [4, -6], well: [4, -2], magKind: 'loader', reloadType: 'revolver', reload: 2.2, sound: 'revolver', shake: 6, knock: 260, pierce: 1, price: 1800, desc: 'Six shots. Each one ends an argument. Punches through.' },
  shotgun: { name: '12ga Pump', art: 'shotgun', ammo: '12ga', mag: 6, dmg: 14, rate: 0.78, auto: false, spread: 0.13, bullets: 9, speed: 2200, recoil: 0.32, hold: [20, 4], support: [22, -1], muzzle: [46, -6.5], eject: [4, -9], port: [4, 1], pump: [22, -1], magKind: 'shell', reloadType: 'shell', shellTime: 0.42, reload: 0.3, sound: 'shotgun', shake: 8, knock: 380, price: 2600, desc: 'Pump-action. Loads shell by shell. Turns rooms red.' },
  smg: { name: 'Uzi-9', art: 'smg', ammo: '9mm', mag: 32, dmg: 15, rate: 0.065, auto: true, spread: 0.07, bullets: 1, speed: 2500, recoil: 0.05, hold: [22, 2], support: [13, 1], muzzle: [27, -6], eject: [8, -11], well: [-1, 17], rack: [8, -11], rackBack: [1, -11], magKind: 'pistol', reloadType: 'mag', reload: 1.5, sound: 'smg', shake: 1.6, knock: 50, price: 3200, desc: 'Sprays 9mm at 900 rounds a minute. Shares pistol ammo.' },
  rifle: { name: 'AKM Rifle', art: 'rifle', ammo: '762', mag: 30, dmg: 34, rate: 0.105, auto: true, spread: 0.035, bullets: 1, speed: 3200, recoil: 0.07, hold: [18, 4], support: [24, -1], muzzle: [50, -5.5], eject: [10, -10], well: [11, 2], rack: [14, -8], rackBack: [5, -8], magKind: 'rifle', reloadType: 'mag', reload: 1.9, sound: 'rifle', shake: 3, knock: 140, pierce: 1, price: 5200, desc: 'The cartel\'s favourite. Hits hard, walks a little.' },
  mg: { name: 'M60 "Trunk Gun"', art: 'mg', ammo: '762', mag: 100, dmg: 36, rate: 0.075, auto: true, spread: 0.05, bullets: 1, speed: 3300, recoil: 0.06, hold: [16, 6], support: [28, 0], muzzle: [56, -7.5], eject: [12, -12], well: [9, 4], rack: [10, -10], rackBack: [0, -10], cover: [6, -15], magKind: 'mg', reloadType: 'belt', reload: 3.2, sound: 'mg', shake: 4, knock: 200, pierce: 2, price: 0, heavy: true, desc: 'Belt-fed. Tears through cover and everything behind it.' },
  // melee for enemies
  bat: { name: 'Bat', melee: true, art: 'bat', dmg: 22, rate: 0.9, reach: 62 },
  knife: { name: 'Knife', melee: true, art: 'knife', dmg: 18, rate: 0.6, reach: 46 },
  axe: { name: 'Axe', melee: true, art: 'axe', dmg: 34, rate: 1.1, reach: 72 },
};
const AMMO_NAMES = { '9mm': '9mm', '357': '.357', '12ga': '12 gauge', '762': '7.62mm' };

// reload keyframes: [t, target] targets: support|well|wellLow|pouch|rack|rackBack|cyl|eject|cover|[x,y]
const RELOAD_TRACKS = {
  mag: {
    hand: [[0, 'support'], [0.1, 'well'], [0.16, 'well'], [0.36, 'pouch'], [0.42, 'pouch'], [0.62, 'wellLow'], [0.72, 'well'], [0.8, 'rack'], [0.88, 'rackBack'], [0.92, 'rackBack'], [1, 'support']],
    tilt: [[0, 0], [0.12, 0.5], [0.78, 0.45], [0.9, 0.2], [1, 0]],
    events: [[0.15, 'magOut'], [0.42, 'grab'], [0.72, 'magIn'], [0.88, 'rack']],
    carry: [0.42, 0.72]
  },
  revolver: {
    hand: [[0, 'support'], [0.1, 'cyl'], [0.2, [14, -4]], [0.26, [4, -4]], [0.46, 'pouch'], [0.5, 'pouch'], [0.7, 'cylLow'], [0.76, 'cylLow'], [0.86, 'cyl'], [1, 'support']],
    tilt: [[0, 0], [0.1, 1.05], [0.3, 1.2], [0.5, 0.6], [0.8, 0.6], [0.9, 0.2], [1, 0]],
    events: [[0.14, 'cylOut'], [0.26, 'eject'], [0.5, 'grab'], [0.76, 'loader'], [0.88, 'cylIn']],
    carry: [0.5, 0.76]
  },
  belt: {
    hand: [[0, 'support'], [0.08, 'cover'], [0.16, [6, -30]], [0.22, 'well'], [0.3, 'well'], [0.48, 'pouch'], [0.52, 'pouch'], [0.7, 'wellLow'], [0.76, 'well'], [0.82, [6, -30]], [0.88, 'cover'], [0.93, 'rack'], [0.97, 'rackBack'], [1, 'support']],
    tilt: [[0, 0], [0.1, 0.3], [0.85, 0.3], [1, 0]],
    events: [[0.12, 'coverOpen'], [0.26, 'magOut'], [0.52, 'grab'], [0.76, 'magIn'], [0.88, 'coverClose'], [0.96, 'rack']],
    carry: [0.52, 0.76]
  }
};

function trackVal(tr, t) {
  for (let i = 0; i < tr.length - 1; i++) {
    if (t <= tr[i + 1][0]) { const a = tr[i], b = tr[i + 1]; const k = ease((t - a[0]) / Math.max(1e-4, b[0] - a[0])); return [a[1], b[1], k]; }
  }
  const l = tr[tr.length - 1]; return [l[1], l[1], 1];
}

class Gun {
  constructor(key) {
    this.key = key; this.def = WEAPONS[key];
    this.mag = this.def.mag || 0; this.cd = 0; this.reload = null;
    this.slide = 0; this.pump = 0; this.cyl = 0; this.cover = 0; this.magIn = true; this.carry = null;
    this.flash = 0; this.pumpT = 0; this.fireMode = false;
  }
  get melee() { return !!this.def.melee; }
  reloading() { return !!this.reload; }
  canReload(owner) { const d = this.def; return !d.melee && !this.reload && this.mag < d.mag && owner.reserve(d.ammo) > 0; }
  startReload(owner) {
    if (!this.canReload(owner)) return false;
    const d = this.def;
    if (d.reloadType === 'shell') this.reload = { phase: 'start', t: 0, dur: d.reload };
    else this.reload = { phase: 'main', t: 0, dur: d.reload * (owner.reloadMul || 1), fired: {} };
    return true;
  }
  cancelReload() { if (this.reload && this.def.reloadType === 'shell') { this.reload = null; this.carry = null; this.pumpT = 0.36; return true; } return false; }
  update(dt, owner, lv) {
    this.cd -= dt; this.flash -= dt;
    if (this.slide > 0 && !this.reload) this.slide = Math.max(0, this.slide - dt * 18);
    if (this.pumpT > 0) { this.pumpT -= dt; const k = 1 - this.pumpT / 0.36; this.pump = Math.sin(clamp(k, 0, 1) * PI); if (this.pumpT <= 0) { this.pump = 0; } if (k > 0.45 && !this._pumpSnd) { this._pumpSnd = true; Audio.play('pump', owner.pan(), owner.vol()); lv && lv.fx.casing(owner.L2W(this.def.eject[0], this.def.eject[1]), owner.facing, 'shell'); } }
    else this._pumpSnd = false;
    const R = this.reload; if (!R) return;
    const d = this.def;
    R.t += dt;
    if (d.reloadType === 'shell') {
      if (R.phase === 'start' && R.t >= R.dur) { R.phase = 'shell'; R.t = 0; R.dur = d.shellTime * (owner.reloadMul || 1); }
      else if (R.phase === 'shell') {
        this.carry = R.t / R.dur > 0.35 && R.t / R.dur < 0.85 ? 'shell' : null;
        if (R.t >= R.dur) {
          this.mag++; owner.useReserve(d.ammo, 1); Audio.play('shell', owner.pan(), owner.vol()); R.t = 0;
          if (this.mag >= d.mag || owner.reserve(d.ammo) <= 0) { R.phase = 'pump'; R.dur = 0.36; this.carry = null; }
        }
      } else if (R.phase === 'pump') {
        const k = R.t / R.dur; this.pump = Math.sin(clamp(k, 0, 1) * PI);
        if (k > 0.45 && !R.pumped) { R.pumped = true; Audio.play('pump', owner.pan(), owner.vol()); }
        if (R.t >= R.dur) { this.pump = 0; this.reload = null; }
      }
      return;
    }
    const tr = RELOAD_TRACKS[d.reloadType], k = R.t / R.dur;
    for (const [et, ev] of tr.events) {
      if (k >= et && !R.fired[ev]) { R.fired[ev] = true; this.event(ev, owner, lv); }
    }
    this.carry = k >= tr.carry[0] && k < tr.carry[1] ? d.magKind : null;
    if (d.reloadType === 'mag') this.slide = k > 0.8 && k < 0.9 ? clamp((k - 0.8) / 0.07, 0, 1) : (this.mag === 0 && k < 0.8 ? 1 : 0);
    if (d.reloadType === 'revolver') this.cyl = k < 0.1 ? 0 : k < 0.16 ? (k - 0.1) / 0.06 : k < 0.86 ? 1 : k < 0.9 ? 1 - (k - 0.86) / 0.04 : 0;
    if (d.reloadType === 'belt') this.cover = k < 0.08 ? 0 : k < 0.16 ? (k - 0.08) / 0.08 : k < 0.82 ? 1 : k < 0.88 ? 1 - (k - 0.82) / 0.06 : 0;
    if (k >= 1) { this.reload = null; this.carry = null; this.slide = 0; this.cyl = 0; this.cover = 0; }
  }
  event(ev, owner, lv) {
    const d = this.def, pan = owner.pan(), vol = owner.vol();
    switch (ev) {
      case 'magOut': this.magIn = false; Audio.play('magout', pan, vol); if (lv) lv.fx.droppedMag(owner.L2W(d.well[0], d.well[1] + 4), owner, d.magKind); break;
      case 'magIn': {
        this.magIn = true; Audio.play('magin', pan, vol);
        const need = d.mag - this.mag, got = Math.min(need, owner.reserve(d.ammo)); owner.useReserve(d.ammo, got); this.mag += got; break;
      }
      case 'rack': Audio.play('rack', pan, vol); break;
      case 'grab': Audio.play('clank', pan, vol * 0.3); break;
      case 'cylOut': case 'cylIn': Audio.play('cylinder', pan, vol); break;
      case 'eject': {
        Audio.play('clank', pan, vol * 0.5);
        if (lv) for (let i = 0; i < d.mag; i++) lv.fx.casing(owner.L2W(d.cylPos[0], d.cylPos[1] + 8), owner.facing, 'brass', true);
        owner.useReserve(d.ammo, -this.mag); this.mag = 0; break;
      }
      case 'loader': { Audio.play('magin', pan, vol); const got = Math.min(d.mag, owner.reserve(d.ammo)); owner.useReserve(d.ammo, got); this.mag = got; if (lv) lv.fx.droppedMag(owner.L2W(d.cylPos[0], d.cylPos[1] + 6), owner, 'loader'); break; }
      case 'coverOpen': case 'coverClose': Audio.play('clank', pan, vol); break;
    }
  }
  // returns the support-hand target in world coords + whether the hand is "busy"
  supportTarget(owner) {
    const d = this.def, R = this.reload;
    const local = (x, y) => owner.L2W(x, y);
    const named = (n) => {
      if (Array.isArray(n)) return local(n[0], n[1]);
      switch (n) {
        case 'support': return local(d.support[0], d.support[1]);
        case 'well': return local(d.well[0], d.well[1] + 2);
        case 'wellLow': return local(d.well[0] - 2, d.well[1] + 16);
        case 'pouch': return owner.pouch();
        case 'rack': return local(d.rack[0], d.rack[1]);
        case 'rackBack': return local(d.rackBack[0], d.rackBack[1]);
        case 'cyl': return local(d.cylPos[0], d.cylPos[1] + 8);
        case 'cylLow': return local(d.cylPos[0] - 4, d.cylPos[1] + 18);
        case 'cover': return local(d.cover[0], d.cover[1]);
        case 'port': return local(d.port[0], d.port[1] + 2);
        case 'pump': return local(d.pump[0] - this.pump * 9, d.pump[1]);
      }
      return local(0, 0);
    };
    if (this.melee) return null;
    if (!R) { if (d.reloadType === 'shell') return named('pump'); return named('support'); }
    if (d.reloadType === 'shell') {
      if (R.phase === 'start') { const a = named('pump'), b = named('port'), k = ease(clamp(R.t / R.dur, 0, 1)); return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; }
      if (R.phase === 'shell') { const k = R.t / R.dur; const a = named('port'), b = owner.pouch(); const m = k < 0.4 ? ease(k / 0.4) : k < 0.5 ? 1 : 1 - ease((k - 0.5) / 0.5); return [lerp(a[0], b[0], m), lerp(a[1], b[1], m)]; }
      return named('pump');
    }
    const tr = RELOAD_TRACKS[d.reloadType];
    const [a, b, k] = trackVal(tr.hand, clamp(R.t / R.dur, 0, 1));
    const pa = named(a), pb = named(b);
    return [lerp(pa[0], pb[0], k), lerp(pa[1], pb[1], k)];
  }
  tilt() {
    const d = this.def, R = this.reload; if (!R) return 0;
    if (d.reloadType === 'shell') return R.phase === 'start' ? ease(clamp(R.t / R.dur, 0, 1)) * 0.25 : R.phase === 'shell' ? 0.25 : 0.25 * (1 - R.t / R.dur);
    const [a, b, k] = trackVal(RELOAD_TRACKS[d.reloadType].tilt, clamp(R.t / R.dur, 0, 1));
    return lerp(a, b, k);
  }
  // how strongly the reload pose overrides the aim (0..1)
  weight() {
    const R = this.reload; if (!R) return 0;
    if (this.def.reloadType === 'shell') return R.phase === 'start' ? ease(clamp(R.t / R.dur, 0, 1)) : R.phase === 'shell' ? 1 : 1 - ease(clamp(R.t / R.dur, 0, 1));
    const k = R.t / R.dur; return k < 0.1 ? ease(k / 0.1) : k > 0.9 ? ease((1 - k) / 0.1) : 1;
  }
  progress() {
    const R = this.reload; if (!R) return 0;
    if (this.def.reloadType === 'shell') return this.mag / this.def.mag;
    return clamp(R.t / R.dur, 0, 1);
  }
  drawState() { return { slide: this.slide, magIn: this.magIn, cyl: this.cyl, pump: this.pump, cover: this.cover, gold: this.def.gold, fire: this.fireMode }; }
}
