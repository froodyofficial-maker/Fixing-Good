// ============================================================
//  FIXING GOOD 3D - level runtime: world, combat, scripting, camera, HUD
// ============================================================
import { THREE, V3, scene, camera, setEnv, placeSun, clearScene, buildTerrain, crate, barrel, car, rvModel, cactus, lampPost, platform, fence, facade, tank, palm, table, col, box, cyl, Tex, ENV, gunModel, magModel, shadowed } from './gfx.js';
import { W, H, PI, TAU, clamp, lerp, rand, randi, choose, sign, ease, angDiff, fmtMoney, G, Input, Audio, Settings } from './core.js';
import { LOOKS, GUN_ART, drawPortrait, rrect, wrapText, UI, FONT } from './ui2d.js';
import { Actor, Gun, WEAPONS, ARCH, AMMO_NAMES, Body as BodyCtor } from './actor.js';
import { FX } from './fx.js';

const tmp = V3(), tmp2 = V3(), UP = V3(0, 1, 0);
const ray = new THREE.Ray();
function rayBox(o, d, b, maxT) { // slab test; returns {t, n}
  let tmin = 0, tmax = maxT, nx = 0, ny = 0, nz = 0;
  for (const ax of ['x', 'y', 'z']) {
    const od = d[ax], oo = o[ax], mn = b.min[ax], mx = b.max[ax];
    if (Math.abs(od) < 1e-9) { if (oo < mn || oo > mx) return null; continue; }
    let t1 = (mn - oo) / od, t2 = (mx - oo) / od, s = -1; if (t1 > t2) { const tt = t1; t1 = t2; t2 = tt; s = 1; }
    if (t1 > tmin) { tmin = t1; nx = ny = nz = 0; if (ax === 'x') nx = s; else if (ax === 'y') ny = s; else nz = s; }
    if (t2 < tmax) tmax = t2; if (tmin > tmax) return null;
  }
  if (tmin <= 0 && (o.x > b.min.x && o.x < b.max.x && o.y > b.min.y && o.y < b.max.y && o.z > b.min.z && o.z < b.max.z)) return { t: 0, n: V3(-d.x, -d.y, -d.z) };
  return { t: tmin, n: V3(nx, ny, nz) };
}
function raySphere(o, d, c, r) { tmp.subVectors(o, c); const b = tmp.dot(d), cc = tmp.lengthSq() - r * r, h = b * b - cc; if (h < 0) return -1; const t = -b - Math.sqrt(h); return t >= 0 ? t : (cc < 0 ? 0 : -1); }
function rayCapsule(o, d, a, b, r) { let best = -1; for (let i = 0; i <= 4; i++) { tmp2.lerpVectors(a, b, i / 4); const t = raySphere(o, d, tmp2, r); if (t >= 0 && (best < 0 || t < best)) best = t; } return best; }

export class Level {
  constructor(def, opts = {}) {
    clearScene(); G.level = this;
    this.def = def; this.len = def.len || 120; this.half = def.half || 12;
    this.minX = 0; this.maxX = this.len; this.solids = []; this.barrels = []; this.actors = []; this.ragdolls = []; this.shots = []; this.projectiles = []; this.pickups = []; this.fires = []; this.floaters = []; this.interacts = []; this.staticLights = [];
    this.named = {}; this.time = 0; this.stepI = 0; this.stepStarted = false; this.stepT = 0; this.vars = {};
    this.dialog = null; this.banters = []; this.toasts = []; this.objective = ''; this.bossId = null; this.title = null;
    this.cinematic = false; this.letterbox = 0; this.fade = 1; this.fadeTarget = 0; this.hitstop = 0; this.slowmo = 0; this.hurtVignette = 0; this.hitMarker = 0; this.hitHead = false; this.healFlash = 0; this.dmgDirs = [];
    this.done = false; this.failed = false; this.failT = 0; this.checkpoint = opts.checkpoint || null; this.stats = { kills: 0, heads: 0, cash: 0, time: 0 };
    this.steps = def.steps || []; this.groundDrift = 0;
    this.camYaw = def.camYaw !== undefined ? def.camYaw : PI / 2; this.camPitch = -0.08; this.camPos = V3(); this.camShake = 0; this.camDist = 3.4; this.fov = 60; this.camTarget = null;
    setEnv(def.env || 'day');
    this.terrain = buildTerrain(ENV, { ground: def.ground, cx: this.len / 2, flatHalfZ: this.half + 6, noMesas: def.noMesas, mesaTint: def.mesaTint }); scene.add(this.terrain);
    this.fx = new FX(this);
    this.build();
    if (this.checkpoint) this.stepI = this.checkpoint.step;
    this.spawnHeroes();
    if (def.flashlight) { this.torch = new THREE.SpotLight(0xfff2d8, 60, 45, 0.42, 0.45, 1.4); this.torch.castShadow = true; this.torch.shadow.mapSize.set(512, 512); scene.add(this.torch); scene.add(this.torch.target); }
    this.updateCamera(1, true);
  }
  // ---------- building ----------
  addSolid(min, max, o = {}) { const s = Object.assign({ min, max }, o); this.solids.push(s); return s; }
  build() {
    const L = this, d = this.def;
    const place = (m, x, z, y = 0, ry = 0) => { m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m; };
    const api = {
      crate: (x, z, w = 1.2, h = 1.2, dd = w, style = 'wood', y = 0) => { const m = place(crate(w, h, dd, style), x, z, y); return L.addSolid(V3(x - w / 2, y, z - dd / 2), V3(x + w / 2, y + h, z + dd / 2), { mesh: m, style, hp: style === 'cardboard' ? 40 : style === 'wood' ? 220 : 0 }); },
      stack: (x, z, style = 'wood') => { api.crate(x, z, 1.3, 1.3, 1.3, style); api.crate(x + 0.1, z, 1.0, 1.0, 1.0, style, 1.3); },
      wallBox: (x, z, w, h, dd, style = 'metal') => { const m = place(crate(w, h, dd, style), x, z); return L.addSolid(V3(x - w / 2, 0, z - dd / 2), V3(x + w / 2, h, z + dd / 2), { mesh: m, style }); },
      dock: (x, z, w = 6, dd = 3, h = 1.1) => { const m = place(shadowed(box(w, h, dd, L._mat('dock', 0x6a6a66))), x, z, h / 2); return L.addSolid(V3(x - w / 2, 0, z - dd / 2), V3(x + w / 2, h, z + dd / 2), { mesh: m, style: 'concrete' }); },
      plat: (x, z, w = 6, h = 3, dd = 2.4) => { place(platform(w, h, dd), x, z); return L.addSolid(V3(x - w / 2, h - 0.08, z - dd / 2), V3(x + w / 2, h + 0.08, z + dd / 2), { style: 'metal', thin: true }); },
      barrel: (x, z, kind = 'red') => { const m = place(barrel(kind), x, z); const b = { pos: V3(x, 0.5, z), kind, hp: kind === 'red' || kind === 'propane' ? 30 : 9999, alive: true, mesh: m }; b.solid = L.addSolid(V3(x - 0.3, 0, z - 0.3), V3(x + 0.3, kind === 'propane' ? 1.3 : 0.9, z + 0.3), { barrel: b, style: 'metal' }); L.barrels.push(b); return b; },
      car: (x, z, color = 0x7a2a2a, kind = 'sedan', ry = 0) => { const m = place(car(color, kind), x, z, 0, ry); const along = Math.abs(Math.sin(ry)) < 0.5; const hw = along ? 2.3 : 0.9, hd = along ? 0.9 : 2.3; L.addSolid(V3(x - hw, 0.15, z - hd), V3(x + hw, 1.1, z + hd), { mesh: m, style: 'car' }); if (kind !== 'pickup') L.addSolid(V3(x - (along ? 1.2 : 0.85), 1.1, z - (along ? 0.85 : 1.2)), V3(x + (along ? 1.1 : 0.85), 1.75, z + (along ? 0.85 : 1.1)), { style: 'car' }); else L.addSolid(V3(x + (along ? 0.05 : -0.85), 1.1, z - 0.85), V3(x + (along ? 1.75 : 0.85), 1.83, z + 0.85), { style: 'car' }); return m; },
      rv: (x, z, o = {}, ry = 0) => { const m = place(rvModel(o), x, z, 0, ry); L.addSolid(V3(x, 0.7, z - 1.2), V3(x + 8.5, 3.3, z + 1.2), { mesh: m, style: 'car' }); return m; },
      lamp: (x, z, h = 6, lit = true) => { place(lampPost(h), x, z, 0, z > 0 ? PI : 0); if (lit && L.staticLights.length < 6) { const l = new THREE.PointLight(0xffd8a0, 18, 22, 1.6); l.position.set(x + (z > 0 ? -0.9 : 0.9), h - 0.3, z); scene.add(l); L.staticLights.push(l); } },
      light: (x, y, z, color = 0xffd8a0, i = 14, dist = 20) => { if (L.staticLights.length >= 8) return; const l = new THREE.PointLight(color, i, dist, 1.6); l.position.set(x, y, z); scene.add(l); L.staticLights.push(l); return l; },
      cactus: (x, z, h = 3.5) => place(cactus(h), x, z, 0, rand(TAU)),
      palm: (x, z, h = 7) => place(palm(h), x, z),
      rock: (x, z, s = 1) => { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), col('rock', 0x9a7a5a)); m.scale.y = 0.6; m.castShadow = m.receiveShadow = true; place(m, x, z, s * 0.25); },
      facade: (x, z, kind, w, h, ry = 0, dd = 1) => { const m = facade(kind, w, h, dd); place(m, x, z, 0, ry); const along = Math.abs(Math.sin(ry)) < 0.5; L.addSolid(V3(x - (along ? w / 2 : dd / 2), 0, z - (along ? dd / 2 : w / 2)), V3(x + (along ? w / 2 : dd / 2), h, z + (along ? dd / 2 : w / 2)), { mesh: m, style: 'wall' }); return m; },
      fence: (x, z, len, ry = 0) => place(fence(len), x, z, 0, ry),
      tank: (x, z, h = 6) => { place(tank(h), x, z); L.addSolid(V3(x - 1.4, 0, z - 1.4), V3(x + 1.4, h + 1.5, z + 1.4), { style: 'metal' }); },
      table: (x, z, w = 2, dd = 1) => { place(table(w, dd), x, z); L.addSolid(V3(x - w / 2, 0.86, z - dd / 2), V3(x + w / 2, 0.94, z + dd / 2), { style: 'wood', thin: true }); },
      sign: (x, z, text, color = '#e8d070', ry = 0, h = 3) => { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const c = cv.getContext('2d'); c.fillStyle = '#222'; c.fillRect(0, 0, 512, 128); c.strokeStyle = color; c.lineWidth = 8; c.strokeRect(6, 6, 500, 116); c.fillStyle = color; c.font = 'bold 56px Oswald, Impact, sans-serif'; c.textAlign = 'center'; c.fillText(text, 256, 84); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.35 })); p.position.y = h; g.add(p); const back = p.clone(); back.rotation.y = PI; g.add(back); for (const s of [-1.5, 1.5]) { const pole = cyl(0.05, 0.05, h, col('pole', 0x3a3a3a)); pole.position.set(s, h / 2 - 0.2, -0.02); g.add(pole); } place(g, x, z, 0, ry); },
      neon: (x, y, z, text, color = '#ff6aa0', ry = 0) => { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 192; const c = cv.getContext('2d'); c.fillStyle = '#111'; c.fillRect(0, 0, 1024, 192); c.shadowColor = color; c.shadowBlur = 30; c.strokeStyle = color; c.lineWidth = 8; c.strokeRect(12, 12, 1000, 168); c.fillStyle = color; c.font = 'bold 110px Oswald, Impact, sans-serif'; c.textAlign = 'center'; c.fillText(text, 512, 140); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; const p = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.5), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 1.2 })); place(p, x, z, y, ry); api.light(x, y, z + 1.5, new THREE.Color(color).getHex(), 16, 18); },
      fire: (x, z, w = 1.5, life = 9999) => L.fires.push({ p: V3(x, 0, z), w, t: life }),
      pickup: (x, z, kind, type, amount) => L.addPickup(V3(x, 0.3, z), kind, type, amount),
      interact: (x, z, text, fn) => { const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 32), new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); ring.rotation.x = -PI / 2; ring.position.set(x, 0.03, z); scene.add(ring); const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), new THREE.MeshBasicMaterial({ color: 0xffd060 })); gem.position.set(x, 2.1, z); scene.add(gem); L.interacts.push({ p: V3(x, 0, z), text, fn, done: false, ring, gem }); },
      room: (style, h = 9) => { const m = L._mat('room' + style, 0xffffff, style === 'lab' ? Tex.panel() : Tex.brick()); m.map.repeat.set(this.len / 8, 2); m.side = THREE.BackSide; const r = new THREE.Mesh(new THREE.BoxGeometry(this.len + 20, h, this.half * 2 + 6), m); r.position.set(this.len / 2, h / 2 - 0.01, 0); r.receiveShadow = true; scene.add(r); const ceil = new THREE.Mesh(new THREE.PlaneGeometry(this.len + 20, this.half * 2 + 6), col('ceil', 0x2a2c30)); ceil.rotation.x = PI / 2; ceil.position.set(this.len / 2, h - 0.05, 0); scene.add(ceil); for (let x = 6; x < this.len; x += 14) { const beam = box(0.4, 0.5, this.half * 2 + 6, col('beam', 0x3a3e42, { metalness: 0.6 }), x, h - 0.4, 0); scene.add(beam); } },
      prop: fn => fn(scene, L),
    };
    if (d.build) d.build(api, this);
    // invisible boundary walls
    this.addSolid(V3(-5, 0, -this.half - 3), V3(this.len + 5, 30, -this.half), { invisible: true, style: 'none' });
    this.addSolid(V3(-5, 0, this.half), V3(this.len + 5, 30, this.half + 3), { invisible: true, style: 'none' });
  }
  _mat(k, c, map) { return col(k, c, map ? { map } : {}); }
  spawnHeroes() {
    const d = this.def, st = G.state;
    const sx = this.checkpoint ? this.checkpoint.x : (d.start || 4), sz = this.checkpoint ? this.checkpoint.z : (d.startZ || 0);
    if (!d.noPlayer) {
      const p = new Actor({ kind: 'player', team: 'player', x: sx, z: sz, look: d.playerLook || 'jace', guns: d.unarmed ? [] : st.weapons.slice(), armor: st.armor, id: 'player', yaw: PI / 2 });
      p.maxHp = 100 + (st.upgrades.health ? 40 : 0); p.hp = p.maxHp; p.reloadMul = st.upgrades.reload ? 0.72 : 1;
      p.guns.forEach(g => { if (st.mags[g.key] !== undefined) g.mag = st.mags[g.key]; });
      const gi = p.guns.findIndex(g => g.key === st.lastGun); if (gi >= 0) p.gi = gi;
      this.player = p; this.actors.push(p); this.named.player = p;
    }
    if (d.walter) { const w = new Actor({ kind: 'walter', team: 'ally', x: sx - 2, z: sz + 1.5, look: d.walterLook || 'walter', guns: d.walterUnarmed ? [] : ['pistol'], id: 'walter', invuln: true, yaw: PI / 2 }); this.walter = w; this.actors.push(w); this.named.walter = w; }
    if (d.npcs) for (const n of d.npcs) this.addNPC(n);
  }
  addNPC(n) { const a = new Actor({ kind: n.kind || 'npc', team: n.team || 'npc', x: n.x, z: n.z || 0, y: n.y || 0, look: n.look, guns: n.guns || [], id: n.id, yaw: n.yaw !== undefined ? n.yaw : -PI / 2, passive: n.passive !== false, name: n.name, hp: n.hp, boss: n.boss }); if (n.id) this.named[n.id] = a; this.actors.push(a); return a; }
  spawn(spec) {
    const out = [];
    for (const s of (Array.isArray(spec) ? spec : [spec])) {
      let x = s.x, z = s.z !== undefined ? s.z : rand(-this.half + 2, this.half - 2);
      const px = this.player ? this.player.pos.x : 0;
      if (s.from === 'ahead') x = px + rand(24, 34); if (s.from === 'behind') x = px - rand(18, 26);
      if (s.from === 'side') { x = px + rand(-6, 10); z = choose([-1, 1]) * (this.half - 1); }
      x = clamp(x, this.minX + 1, this.maxX - 1);
      const A = ARCH[s.t] || ARCH.gunner;
      const a = new Actor({ kind: s.t, team: 'enemy', x, z, y: s.y || 0, look: s.look || A.look || this.def.enemyLook || 'thug', guns: s.w ? [s.w] : undefined, yaw: x > px ? -PI / 2 : PI / 2, alert: s.alert !== false && !s.idle, patrol: s.patrol, name: s.name, hp: s.hp, armor: s.armor, id: s.id, passive: s.passive });
      if (s.id) this.named[s.id] = a; if (s.from) a.ai.state = 'alert';
      this.actors.push(a); out.push(a);
    }
    return out;
  }
  hostile(a, b) { if (a.team === 'enemy') return b.team === 'player' || b.team === 'ally'; if (a.team === 'player' || a.team === 'ally') return b.team === 'enemy'; return false; }
  enemiesAlive() { let n = 0; for (const a of this.actors) if (a.alive && a.team === 'enemy' && !a.passive) n++; return n; }
  nearestHostile(me, maxD = 50) { let best = null, bd = maxD; for (const a of this.actors) { if (!a.alive || a === me || a.downed > 0 || a.passive || !this.hostile(me, a)) continue; const d = a.pos.distanceTo(me.pos) + (a.team === 'ally' ? 5 : 0); if (d < bd) { bd = d; best = a; } } return best; }
  countHostilesNear(p, r) { let n = 0; for (const a of this.actors) if (a.alive && a.team === 'enemy' && a.pos.distanceTo(p) < r) n++; return n; }

  // ---------- collision ----------
  groundAt(x, z, fromY = 99) { let g = 0; for (const s of this.solids) { if (s.dead || s.invisible) continue; if (x > s.min.x && x < s.max.x && z > s.min.z && z < s.max.z && s.max.y <= fromY + 0.01 && s.max.y > g) g = s.max.y; } return g; }
  pushOutOfSolids(p, r) {
    for (const s of this.solids) {
      if (s.dead) continue;
      if (p.x > s.min.x - r && p.x < s.max.x + r && p.z > s.min.z - r && p.z < s.max.z + r && p.y > s.min.y && p.y < s.max.y) {
        const dx1 = p.x - (s.min.x - r), dx2 = (s.max.x + r) - p.x, dz1 = p.z - (s.min.z - r), dz2 = (s.max.z + r) - p.z, dy = s.max.y - p.y;
        const m = Math.min(dx1, dx2, dz1, dz2, dy);
        if (m === dy) p.y = s.max.y; else if (m === dx1) p.x = s.min.x - r; else if (m === dx2) p.x = s.max.x + r; else if (m === dz1) p.z = s.min.z - r; else p.z = s.max.z + r;
      }
    }
  }
  moveActor(a, dt) {
    const r = a.radius, h = a.height(); a.blocked = false;
    const tryAxis = (ax) => {
      a.pos[ax] += a.vel[ax] * dt;
      for (const s of this.solids) {
        if (s.dead) continue;
        if (a.pos.x + r > s.min.x && a.pos.x - r < s.max.x && a.pos.z + r > s.min.z && a.pos.z - r < s.max.z && a.pos.y + h > s.min.y && a.pos.y < s.max.y - 0.001) {
          if (s.max.y - a.pos.y <= 0.4 && !s.invisible) { a.pos.y = s.max.y; continue; } // step up
          if (ax === 'x') a.pos.x = a.vel.x > 0 ? s.min.x - r : s.max.x + r; else a.pos.z = a.vel.z > 0 ? s.min.z - r : s.max.z + r;
          a.blocked = true;
        }
      }
    };
    tryAxis('x'); tryAxis('z');
    a.pos.x = clamp(a.pos.x, this.minX + 0.5, this.maxX - 0.5); a.pos.z = clamp(a.pos.z, -this.half + 0.5, this.half - 0.5);
    const prevY = a.pos.y; a.pos.y += a.vel.y * dt; a.onGround = false;
    const g = this.groundAt(a.pos.x, a.pos.z, prevY + 0.05);
    if (a.pos.y <= g) { a.pos.y = g; a.vel.y = 0; a.onGround = true; }
    for (const s of this.solids) if (!s.dead && a.vel.y > 0 && a.pos.x > s.min.x && a.pos.x < s.max.x && a.pos.z > s.min.z && a.pos.z < s.max.z && a.pos.y + h > s.min.y && prevY + h <= s.min.y + 0.01) { a.pos.y = s.min.y - h; a.vel.y = 0; }
    if (this.rv && this.def.mode === 'highway') this.highwayClamp(a);
  }
  raycast(o, d, maxT = 200, opts = {}) {
    let best = { t: maxT, type: null };
    for (const s of this.solids) { if (s.dead || (opts.skipInvisible && s.invisible)) continue; const h = rayBox(o, d, s, best.t); if (h && h.t < best.t) best = { t: h.t, type: s.barrel ? 'barrel' : 'solid', s, n: h.n, barrel: s.barrel }; }
    if (this.vehicles) for (const v of this.vehicles) { if (!v.alive || v.team === opts.team) continue; const h = rayBox(o, d, v.box(), best.t); if (h && h.t < best.t) best = { t: h.t, type: 'veh', v, n: h.n }; }
    if (opts.actors) for (const a of this.actors) {
      if (!a.alive || a.downed > 0 || a.passive || (opts.ignore && opts.ignore.has(a)) || (opts.team && !this.hostile({ team: opts.team }, a))) continue;
      if (a.pos.distanceTo(o) > best.t + 2) continue;
      const J = a.J; let t = raySphere(o, d, J.head, 0.14), head = t >= 0;
      const tb = rayCapsule(o, d, J.pelvis, J.neck, 0.21); if (tb >= 0 && (t < 0 || tb < t)) { t = tb; head = false; }
      const tl = rayCapsule(o, d, J.hipL, J.ftL, 0.11); if (tl >= 0 && (t < 0 || tl < t)) { t = tl; head = false; }
      const tr = rayCapsule(o, d, J.hipR, J.ftR, 0.11); if (tr >= 0 && (t < 0 || tr < t)) { t = tr; head = false; }
      if (t >= 0 && t < best.t) best = { t, type: 'actor', a, head };
    }
    if (d.y < 0 && !opts.noGround) { const t = (0 - o.y) / d.y; if (t > 0 && t < best.t) best = { t, type: 'ground', n: V3(0, 1, 0) }; }
    best.p = o.clone().addScaledVector(d, best.t);
    return best;
  }
  los(a, b) { tmp.subVectors(b, a); const len = tmp.length(); const d = tmp.clone().divideScalar(len); for (const s of this.solids) { if (s.dead || s.invisible || s.thin) continue; if ((s.max.y - s.min.y) < 0.5) continue; const h = rayBox(a, d, s, len); if (h && h.t < len - 0.05) return false; } return true; }

  // ---------- combat ----------
  fire(a) {
    const g = a.gun, d = g.def;
    if (g.cd > 0 || g.pumpT > 0) return;
    if (g.reload) { if (d.reloadType === 'shell' && g.mag > 0) g.cancelReload(); else return; }
    if (g.mag <= 0) { g.cd = 0.25; Audio.play('dry', a.pan(), a.vol()); if (a.isPlayer() && a.reserve(d.ammo) <= 0) this.toast('Out of ' + AMMO_NAMES[d.ammo] + ' ammo'); g.startReload(a); return; }
    g.mag--; g.cd = d.rate * (a.team === 'enemy' ? 1.15 : 1);
    const muzzle = a.gunPoint('muzzle');
    let dir;
    if (a.isPlayer() && this.aimPoint) dir = this.aimPoint.clone().sub(muzzle).normalize();
    else dir = V3(Math.sin(a.aimYaw) * Math.cos(a.aimPitch), Math.sin(a.aimPitch), Math.cos(a.aimYaw) * Math.cos(a.aimPitch));
    // don't shoot through a wall the muzzle is poking into
    const sh = a.J.shR, toM = muzzle.clone().sub(sh), toML = toM.length(); const blk = this.raycast(sh, toM.normalize(), toML, { skipInvisible: true, noGround: true });
    const origin = blk.type ? sh : muzzle;
    const spreadMul = (a.crouching ? 0.6 : 1) * (a.onGround ? 1 : 1.6) * (Math.hypot(a.vel.x, a.vel.z) > 1 ? 1.25 : 1) * (a.isPlayer() && a.aiming ? 0.45 : 1);
    const fireRounds = a.isPlayer() && d.ammo === '12ga' && G.state.upgrades.dragon;
    const baseErr = a.team === 'enemy' ? (a.arch.acc || 0.04) : a.team === 'ally' ? (a.arch.acc || 0.02) : 0;
    const be = V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(baseErr);
    for (let i = 0; i < d.bullets; i++) {
      const dd = dir.clone().add(be).add(V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(d.spread * spreadMul)).normalize();
      const dmg = d.dmg * (a.team === 'enemy' ? (a.boss ? 0.42 : 0.4) * (d.bullets > 1 ? 0.6 : 1) : a.team === 'ally' ? 1.4 : 1) * (a.isPlayer() && G.state.upgrades.hollow ? 1.2 : 1);
      if (a.team === 'enemy') this.shots.push({ p: origin.clone(), v: dd.multiplyScalar(70), dmg, owner: a, life: 1.2, knock: d.knock / d.bullets, shotgun: d.bullets > 1, travelled: 0, mesh: null });
      else this.hitscan(origin, dd, { dmg, owner: a, pierce: d.pierce || 0, knock: d.knock / d.bullets, shotgun: d.bullets > 1, fire: fireRounds });
    }
    this.fx.muzzle(muzzle, dir, d.bullets > 1 ? 1.5 : d.heavy ? 1.3 : 1, fireRounds);
    if (d.reloadType !== 'shell' && d.reloadType !== 'revolver') this.fx.casing(a.gunPoint('eject'), a);
    if (d.reloadType === 'shell') { g.pumpT = 0.36; g._ps = false; g.cd = Math.max(g.cd, 0.4); }
    g.slide = 1; a.kick = Math.min(0.4, a.kick + d.recoil);
    if (a.isPlayer()) { this.shake(d.shake); this.camPitch += d.recoil * 0.25; G.state.stats.shots++; }
    Audio.play(d.sound, a.pan(), a.vol());
    if (a.team !== 'enemy') for (const e of this.actors) if (e.alive && e.team === 'enemy' && e.ai.state === 'idle' && e.pos.distanceTo(a.pos) < 35) { e.ai.heard = true; e.ai.react = Math.min(e.ai.react, rand(0.15, 0.5)); }
  }
  hitscan(o, d, b) {
    const ignore = new Set([b.owner]); let pierce = b.pierce, dmg = b.dmg, from = o.clone(), travelled = 0;
    for (let k = 0; k < 4; k++) {
      const h = this.raycast(from, d, 160, { actors: true, team: b.owner.team, ignore, skipInvisible: true });
      travelled += h.t;
      if (k === 0) this.fx.tracer(o, h.p, b.fire ? 'fire' : 'player');
      if (!h.type) return;
      if (h.type === 'actor') {
        const a = h.a; ignore.add(a);
        const close = b.shotgun && travelled < 7, mul = h.head ? 2.6 : 1, dm = dmg * mul * (close ? 1.25 : 1);
        const killed = a.hurt(dm, { kind: 'bullet', p: h.p, dir: d.clone(), head: h.head, knock: b.knock * (close ? 1.6 : 1), power: dm, from: b.owner, shotgunClose: close, ignite: b.fire }, this);
        if (b.owner.isPlayer()) { this.hitMarker = killed ? 0.3 : 0.18; this.hitHead = h.head; }
        if (h.head) { Audio.play('headshot', a.pan(), a.vol()); if (killed && b.owner.isPlayer()) { this.stats.heads++; G.state.stats.heads++; } } else Audio.play('hit', a.pan(), a.vol() * 0.8);
        const behind = this.raycast(h.p, d, 4, { skipInvisible: true }); if (behind.type === 'solid' || behind.type === 'ground') { if (Settings.gore >= 2) this.fx.decalBlood(behind.p, rand(0.3, 0.6), behind.n); }
        if (pierce > 0) { pierce--; dmg *= 0.7; from = h.p.clone().addScaledVector(d, 0.05); continue; }
        return;
      }
      if (h.type === 'barrel') { this.fx.spark(h.p, 6); this.hitBarrel(h.barrel, b.fire ? 40 : dmg); Audio.play('clank', 0, 0.4); return; }
      if (h.type === 'veh') { this.fx.spark(h.p, 6); h.v.damage(dmg, this); Audio.play('clank', 0, 0.3); return; }
      // solid or ground
      this.fx.spark(h.p, 5); if (h.n) this.fx.decalHole(h.p, h.n);
      if (h.type === 'ground') this.fx.dust(h.p, 3);
      if (h.s && (h.s.style === 'wood' || h.s.style === 'cardboard')) this.fx.debris(h.p, 4); else if (Math.random() < 0.3) Audio.play('ric', 0, 0.5);
      if (h.s && h.s.hp) { h.s.hp -= dmg; if (h.s.hp <= 0) this.breakSolid(h.s); }
      if (b.fire) this.fx.flame(h.p, 3);
      return;
    }
  }
  updateShots(dt) {
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i]; s.life -= dt;
      const sp = s.v.length(), d = s.v.clone().divideScalar(sp), stepLen = sp * dt;
      const h = this.raycast(s.p, d, stepLen, { actors: true, team: 'enemy', skipInvisible: true });
      if (!s.mesh) { s.mesh = new THREE.Mesh(this.fx.tg, this.fx.tracerMatEnemy); scene.add(s.mesh); }
      const end = h.type ? h.p : s.p.clone().addScaledVector(d, stepLen);
      s.mesh.position.copy(end); s.mesh.lookAt(s.p); s.mesh.scale.set(1.3, 1.3, Math.min(2.2, s.travelled + 0.3));
      if (h.type || s.life <= 0) {
        scene.remove(s.mesh); this.shots.splice(i, 1);
        if (h.type === 'actor') { const a = h.a, mul = h.head ? 1.4 : 1, close = s.shotgun && s.travelled < 7; a.hurt(s.dmg * mul, { kind: 'bullet', p: h.p, dir: d, head: h.head, knock: s.knock, power: s.dmg * mul, from: s.owner, shotgunClose: close }, this); Audio.play('hit', a.pan(), a.vol() * 0.6); }
        else if (h.type === 'barrel') this.hitBarrel(h.barrel, s.dmg);
        else if (h.type === 'veh') h.v.damage(s.dmg, this);
        else if (h.type) { this.fx.spark(h.p, 4); if (h.n) this.fx.decalHole(h.p, h.n); if (h.type === 'ground') this.fx.dust(h.p, 2); }
        // near-miss whizz
        continue;
      }
      if (this.player && s.p.distanceTo(this.player.center()) < 1.2 && !s.whizz) { s.whizz = true; Audio.play('whoosh', 0, 0.25); }
      s.p.copy(end); s.travelled += stepLen;
    }
  }
  hitBarrel(b, dmg) { if (!b.alive || (b.kind !== 'red' && b.kind !== 'propane')) return; b.hp -= dmg; if (b.hp <= 0 && b.fuse === undefined) b.fuse = 0.1; }
  breakSolid(s) { s.dead = true; if (s.mesh) scene.remove(s.mesh); Audio.play('crash', 0, 0.5); const c = s.min.clone().add(s.max).multiplyScalar(0.5); this.fx.debris(c, 22, s.style === 'cardboard' ? [0.79, 0.64, 0.42] : [0.55, 0.4, 0.22]); this.fx.dust(c, 8); }
  explode(p, o = {}) {
    const r = o.r || 5.5, dmg = o.dmg || 150;
    Audio.play('explode'); this.shake(o.small ? 0.8 : 1.6); this.hitstop = 0.05;
    this.fx.light(p.clone().add(V3(0, 1, 0)), 0xff9a40, 40, 0.5, 30);
    for (let i = 0; i < (o.small ? 25 : 70); i++) { const a = rand(TAU), b = rand(-0.3, PI / 2), sp = rand(1, 7); this.fx.add_.add({ x: p.x, y: p.y + 0.3, z: p.z, vx: Math.cos(a) * Math.cos(b) * sp, vy: Math.sin(b) * sp + 1, vz: Math.sin(a) * Math.cos(b) * sp, life: rand(0.3, 0.9), max: 0.9, s: rand(0.4, 1.0), c: [1, rand(0.4, 0.7), 0.1], a: 0.9, t: 'fire' }); }
    this.fx.smoke(p.clone().add(V3(0, 1, 0)), o.small ? 10 : 26, 1.2, 0.85, 2); this.fx.spark(p, 30, [1, 0.7, 0.3]); this.fx.debris(p, 14, [0.2, 0.2, 0.2]);
    this.fx.decalScorch(p, r * 0.6);
    for (const a of this.actors) {
      if (!a.alive || a.downed > 0 || a.passive) continue;
      const c = a.center(), d = c.distanceTo(p); if (d > r) continue;
      const k = Math.pow(1 - d / r, 0.7); let dm = dmg * k;
      if (a.team === 'player' && (!o.owner || o.owner.team !== 'enemy')) dm *= 0.35;
      if (a.id === 'walter') dm *= 0.3;
      const dir = c.clone().sub(p).normalize(); dir.y += 0.6;
      const killed = a.hurt(dm, { kind: 'blast', p: c, dir, knock: 14 * k, close: d < r * 0.55, ignite: o.fire, from: o.owner }, this);
      if (!killed && a.alive) { a.vel.addScaledVector(dir, 6 * k); a.vel.y = 4 * k; a.onGround = false; a.stagger = 0.5; }
    }
    for (const rd of this.ragdolls) for (const n in rd.P) { const q = rd.P[n]; const d = q.p.distanceTo(p); if (d < r * 1.2) { const k = 1 - d / (r * 1.2); q.o.addScaledVector(q.p.clone().sub(p).normalize().add(V3(0, 0.8, 0)), -0.12 * k); rd.t = Math.min(rd.t, 6); } }
    for (const b of this.barrels) if (b.alive && b.pos.distanceTo(p) < r * 0.9) this.hitBarrel(b, 100);
    for (const s of this.solids) if (s.hp && !s.dead) { const c = s.min.clone().add(s.max).multiplyScalar(0.5); if (c.distanceTo(p) < r * 0.7) { s.hp -= dmg; if (s.hp <= 0) this.breakSolid(s); } }
    if (o.fire) for (let i = 0; i < 3; i++) this.fires.push({ p: V3(p.x + rand(-2.5, 2.5), 0, p.z + rand(-2.5, 2.5)), w: rand(1, 2), t: rand(5, 8) });
  }
  throwItem(a, kind, target) {
    const s = a.J.shR.clone().add(V3(0, 0.1, 0)), T = 0.75, g = 12;
    const v = target.clone().sub(s).divideScalar(T); v.y += 0.5 * g * T; if (v.length() > 22) v.multiplyScalar(22 / v.length());
    const m = kind === 'bang' ? new THREE.Mesh(new THREE.OctahedronGeometry(0.08), col('bang', 0x7fd8f0, { emissive: 0x2a8ab0, emissiveIntensity: 0.8, roughness: 0.2 })) : shadowed(cyl(0.04, 0.05, 0.22, col('molotov', 0x4a7a2a)));
    scene.add(m); this.projectiles.push({ p: s, v, kind, owner: a, mesh: m, t: 0 }); Audio.play('whoosh'); a.melee = null;
  }
  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]; p.t += dt; p.v.y -= 12 * dt; p.p.addScaledVector(p.v, dt); p.mesh.position.copy(p.p); p.mesh.rotation.x += dt * 10; p.mesh.rotation.z += dt * 7;
      if (p.kind === 'molotov' && Math.random() < 0.8) this.fx.flame(p.p.clone().add(V3(0, 0.12, 0)), 1, 0.12, 0.02);
      if (p.kind === 'bang' && Math.random() < 0.5) this.fx.spark(p.p, 1, [0.6, 0.9, 1]);
      let boom = p.p.y <= this.groundAt(p.p.x, p.p.z, p.p.y + 0.2) + 0.05 || p.t > 3;
      if (!boom) for (const s of this.solids) if (!s.dead && !s.invisible && p.p.x > s.min.x && p.p.x < s.max.x && p.p.y > s.min.y && p.p.y < s.max.y && p.p.z > s.min.z && p.p.z < s.max.z) { boom = true; break; }
      if (!boom && p.t > 0.12) for (const a of this.actors) if (a.alive && this.hostile(p.owner, a) && a.center().distanceTo(p.p) < 0.6) { boom = true; break; }
      if (boom) {
        scene.remove(p.mesh); this.projectiles.splice(i, 1);
        if (p.kind === 'bang') this.explode(p.p, { r: 5.5, dmg: 170, owner: p.owner });
        else { Audio.play('crash', 0, 0.6); Audio.play('fire'); this.explode(p.p, { r: 2.5, dmg: 20, small: true, fire: true, owner: p.owner }); for (let k = 0; k < 4; k++) this.fires.push({ p: V3(p.p.x + rand(-1.8, 1.8), 0, p.p.z + rand(-1.8, 1.8)), w: 1.4, t: rand(6, 9) }); }
      }
    }
  }
  updateFires(dt) {
    for (let i = this.fires.length - 1; i >= 0; i--) {
      const f = this.fires[i]; f.t -= dt; if (f.t <= 0) { this.fires.splice(i, 1); continue; }
      const k = Math.min(1, f.t / 2); f.p.y = this.groundAt(f.p.x, f.p.z, 5);
      for (let j = 0; j < 2; j++) if (Math.random() < 0.9 * k) this.fx.flame(V3(f.p.x + rand(-f.w / 2, f.w / 2), f.p.y + 0.05, f.p.z + rand(-f.w / 2, f.w / 2)), 1, 0.5, 0.05);
      if (Math.random() < 0.06) this.fx.smoke(f.p.clone().add(V3(0, 1, 0)), 1, 0.6, 0.7, 1.5);
      if (Math.random() < 0.15) this.fx.light(f.p.clone().add(V3(0, 1, 0)), 0xff8030, 8 * k, 0.2, 10);
      for (const a of this.actors) if (a.alive && a.downed <= 0 && !a.passive && Math.abs(a.pos.x - f.p.x) < f.w / 2 + 0.2 && Math.abs(a.pos.z - f.p.z) < f.w / 2 + 0.2 && Math.abs(a.pos.y - f.p.y) < 0.6) { if (a.burn <= 0) a.hurt(6, { kind: 'fire', p: a.center(), ignite: true }, this); }
    }
  }
  addPickup(p, kind, type, amount) {
    let m;
    if (kind === 'ammo') { m = new THREE.Group(); m.add(box(0.3, 0.18, 0.2, col('ammocrate', 0x4a5a2a))); m.add(box(0.31, 0.05, 0.21, col('ammolid', 0xe8d070), 0, 0.06, 0)); }
    else if (kind === 'cash') { m = new THREE.Group(); for (let i = 0; i < 3; i++) m.add(box(0.16, 0.03, 0.08, col('cash', 0x5a8a3a), 0, i * 0.035, 0)); }
    else if (kind === 'med') { m = new THREE.Group(); m.add(box(0.3, 0.22, 0.14, col('medbox', 0xeeeeee))); m.add(box(0.06, 0.16, 0.15, col('medred', 0xc0281c, { emissive: 0x400000 }))); m.add(box(0.16, 0.06, 0.15, col('medred', 0xc0281c, { emissive: 0x400000 }))); }
    else if (kind === 'gun') { m = gunModel(WEAPONS[type].art, { gold: WEAPONS[type].gold }); m.scale.setScalar(1.6); }
    else m = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), col('bang', 0x7fd8f0, { emissive: 0x2a8ab0 }));
    shadowed(m); scene.add(m);
    const glow = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.4, 24), new THREE.MeshBasicMaterial({ color: kind === 'med' ? 0x60ff60 : 0xffd070, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); glow.rotation.x = -PI / 2; scene.add(glow);
    this.pickups.push({ p: p.clone(), v: V3(rand(-1, 1), 3, rand(-1, 1)), kind, type, amount, mesh: m, glow });
  }
  updatePickups(dt) {
    const p = this.player;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const k = this.pickups[i];
      k.v.y -= 12 * dt; k.p.addScaledVector(k.v, dt); const g = this.groundAt(k.p.x, k.p.z, k.p.y + 0.3) + 0.15; if (k.p.y < g) { k.p.y = g; k.v.set(0, 0, 0); }
      k.p.x -= this.groundDrift * dt;
      k.mesh.position.set(k.p.x, k.p.y + 0.15 + Math.sin(this.time * 3 + i) * 0.06, k.p.z); k.mesh.rotation.y += dt * 2;
      k.glow.position.set(k.p.x, g - 0.13, k.p.z); k.glow.material.opacity = 0.35 + Math.sin(this.time * 6) * 0.15;
      if (p && p.alive && p.pos.distanceTo(V3(k.p.x, p.pos.y, k.p.z)) < 1.3 && Math.abs(p.pos.y - k.p.y) < 1.5) {
        const st = G.state;
        if (k.kind === 'ammo') { st.ammo[k.type] = (st.ammo[k.type] || 0) + k.amount; this.toast('+' + k.amount + ' ' + AMMO_NAMES[k.type]); Audio.play('pickup'); }
        else if (k.kind === 'cash') { st.money += k.amount; this.stats.cash += k.amount; this.toast('+' + fmtMoney(k.amount)); Audio.play('cash'); }
        else if (k.kind === 'med') { if (p.hp < p.maxHp * 0.6) { p.hp = Math.min(p.maxHp, p.hp + 45); this.toast('+45 HP'); this.healFlash = 0.6; } else if (st.medkits < 5) { st.medkits++; this.toast('+1 Medkit'); } else continue; Audio.play('pickup'); }
        else if (k.kind === 'gun') { if (!st.weapons.includes(k.type)) { st.weapons.push(k.type); p.guns.push(new Gun(k.type)); st.ammo[WEAPONS[k.type].ammo] += WEAPONS[k.type].mag; this.toast('NEW WEAPON: ' + WEAPONS[k.type].name + '  [' + p.guns.length + ']'); Audio.play('uiok'); } }
        scene.remove(k.mesh); scene.remove(k.glow); this.pickups.splice(i, 1);
      }
    }
  }
  onDeath(a, o) {
    if (a.team === 'enemy') {
      this.stats.kills++; G.state.stats.kills++;
      const pl = this.player;
      if (pl && pl.alive) pl.hp = Math.min(pl.maxHp, pl.hp + 6);
      if (o.from && o.from.id === 'walter' && Math.random() < 0.3) this.banter('walter', choose(['Got him.', 'That one\'s mine.', 'Applied science.', 'Stay behind cover, Jace!']));
      if (pl) {
        const st = G.state, g = a.gun, at = a.center();
        if (g && !g.melee && !st.weapons.includes(g.key)) this.addPickup(at, 'gun', g.key);
        if (g && !g.melee && Math.random() < 0.65) this.addPickup(at, 'ammo', g.def.ammo, g.def.ammo === '12ga' || g.def.ammo === '357' ? randi(3, 6) : randi(10, 24));
        if (Math.random() < 0.3 || a.boss) this.addPickup(at, 'cash', null, a.boss ? 1500 : randi(30, 120));
        const frac = pl.hp / pl.maxHp, ch = frac < 0.25 ? 0.75 : frac < 0.5 ? 0.4 : frac < 0.75 ? 0.15 : 0.05;
        if (!this.pickups.some(k => k.kind === 'med') && (Math.random() < ch || (frac < 0.3 && st.medkits === 0))) this.addPickup(at, 'med');
      }
      if (a.boss) this.slowmo = 1.6; else if (this.enemiesAlive() === 0) this.slowmo = 0.7;
    }
    if (a === this.player) { this.failed = true; this.failT = 0; this.slowmo = 1.5; Audio.play('bad'); }
  }
  shake(n) { this.camShake = Math.min(1.2, this.camShake + n * Settings.shake * 0.3); }
  toast(t) { this.toasts.push({ t, life: 2.2 }); if (this.toasts.length > 3) this.toasts.shift(); }
  banter(who, text) { if (!text) return; this.banters.push({ who, text, life: 3.6 }); if (this.banters.length > 2) this.banters.shift(); }
  shout(a, text) { this.floaters.push({ a, text, life: 1.8 }); }
  damageDir(from) { if (!from || !from.pos || !this.player) return; const d = from.pos.clone().sub(this.player.pos); const ang = Math.atan2(d.x, d.z); this.dmgDirs.push({ a: ang, life: 1 }); if (this.dmgDirs.length > 4) this.dmgDirs.shift(); }

  // ---------- player control + camera ----------
  playerControl(p, dt) {
    const I = Input, st = G.state;
    const sens = 0.0023 * (Settings.sens || 1) * (p.aiming ? 0.6 : 1);
    this.camYaw -= I.dx * sens; this.camPitch = clamp(this.camPitch - I.dy * sens, -1.1, 0.9);
    if (!I.locked) { const ex = (I.mx - W / 2) / W; if (Math.abs(ex) > 0.42 && I.mx > 0) this.camYaw -= sign(ex) * dt * 1.4; }
    const fwd = V3(Math.sin(this.camYaw), 0, Math.cos(this.camYaw)), right = V3(-Math.cos(this.camYaw), 0, Math.sin(this.camYaw));
    const mf = (I.down('KeyW') || I.down('ArrowUp') ? 1 : 0) - (I.down('KeyS') || I.down('ArrowDown') ? 1 : 0), mr = (I.down('KeyD') || I.down('ArrowRight') ? 1 : 0) - (I.down('KeyA') || I.down('ArrowLeft') ? 1 : 0);
    p.move.set(0, 0, 0).addScaledVector(fwd, mf).addScaledVector(right, mr); if (p.move.lengthSq() > 1) p.move.normalize();
    p.aiming = I.rdown && !!p.gun && !p.gun.melee;
    p.sprint = (I.down('ShiftLeft') || I.down('ShiftRight')) && mf > 0 && !p.aiming;
    p.crouching = I.down('KeyC') || I.down('ControlLeft');
    if (I.hit('Space')) p.wantJump = true;
    if (I.hit('KeyX') && p.onGround && p.roll <= 0 && !p.melee) { p.roll = 0.42; p.rollDir.copy(p.move.lengthSq() > 0.01 ? p.move : fwd).normalize(); Audio.play('whoosh'); const g = p.gun; if (g && g.def.reloadType === 'shell') g.cancelReload(); }
    // body faces the camera direction
    p.yaw += angDiff(p.yaw, this.camYaw) * Math.min(1, dt * 14);
    if (this.aimPoint) { const sh = p.J.shR; p.aimYaw = Math.atan2(this.aimPoint.x - sh.x, this.aimPoint.z - sh.z); p.aimPitch = Math.atan2(this.aimPoint.y - sh.y, Math.hypot(this.aimPoint.x - sh.x, this.aimPoint.z - sh.z)); }
    const g = p.gun;
    p.wantFire = !!g && !g.melee && (g.def.auto ? I.mdown : I.mclick);
    if (g && g.melee && I.mclick) p.startMelee(this);
    p.autoReload = I.mdown;
    if (g && g.reload && I.mclick && g.def.reloadType === 'shell' && g.mag > 0) g.cancelReload();
    if (I.hit('KeyR') && g && !g.melee) { if (!g.startReload(p) && g.mag < g.def.mag && p.reserve(g.def.ammo) <= 0) this.toast('No ' + AMMO_NAMES[g.def.ammo] + ' ammo left'); }
    if (I.hit('KeyF')) { if (p.melee) p.queued = true; else p.startMelee(this); }
    ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].forEach((k, i) => { if (I.hit(k) && i < p.guns.length && i !== p.gi) p.switchGun(i); });
    if (I.wheel && p.guns.length > 1) p.switchGun((p.gi + (I.wheel > 0 ? 1 : -1) + p.guns.length) % p.guns.length);
    if (I.hit('KeyQ') && p.guns.length > 1) p.switchGun(p._lastGi !== undefined && p._lastGi < p.guns.length ? p._lastGi : (p.gi + 1) % p.guns.length);
    const tgt = this.aimPoint || p.pos.clone().addScaledVector(fwd, 10);
    if (I.hit('KeyG')) { if (st.bangs > 0) { st.bangs--; this.throwItem(p, 'bang', tgt); } else this.toast('No Bang Crystals'); }
    if (I.hit('KeyV')) { if (st.molotovs > 0) { st.molotovs--; this.throwItem(p, 'molotov', tgt); } else this.toast('No Molotovs'); }
    if (I.hit('KeyH')) { if (st.medkits > 0 && p.hp < p.maxHp) { st.medkits--; p.hp = Math.min(p.maxHp, p.hp + 60); Audio.play('pickup'); this.toast('+60 HP'); this.healFlash = 0.6; } else if (st.medkits <= 0) this.toast('No medkits'); }
  }
  speakerActor() {
    if (!this.dialog || this.dialog.finished) return null; const who = this.dialog.line[0];
    if (who === 'jace') return this.player; if (who && who.startsWith('walter')) return this.walter || this.named.walter; return this.named[who] || null;
  }
  updateCamera(dt, snap = false) {
    const p = this.player;
    let target, pos, look;
    const sp = this.speakerActor();
    if (this.cinematic && (sp || this.camTarget)) {
      // cinematic framing: over the shoulder of whoever is listening, looking at the speaker
      const subj = sp || (typeof this.camTarget === 'string' ? this.named[this.camTarget] : null);
      if (subj) {
        const f = subj.fwd(V3()), r = subj.side; const h = subj.J.head.clone();
        pos = h.clone().addScaledVector(f, 2.4).addScaledVector(r, 1.0).add(V3(0, -0.05, 0)); look = h.clone().addScaledVector(r, 0.25);
      } else if (Array.isArray(this.camTarget)) { pos = V3(...this.camTarget[0]); look = V3(...this.camTarget[1]); }
    }
    if (!pos && p) {
      const aim = p.aiming ? 1 : 0; this.aimBlend = lerp(this.aimBlend || 0, aim, Math.min(1, dt * 10));
      const dist = lerp(3.3, 1.7, this.aimBlend), shoulder = lerp(0.55, 0.62, this.aimBlend);
      target = V3(p.pos.x, p.pos.y + 1.55 - p.crouch * 0.4, p.pos.z);
      const fwd = V3(Math.sin(this.camYaw) * Math.cos(this.camPitch), Math.sin(this.camPitch), Math.cos(this.camYaw) * Math.cos(this.camPitch));
      const right = V3(-Math.cos(this.camYaw), 0, Math.sin(this.camYaw));
      const piv = target.clone().addScaledVector(right, shoulder);
      let want = piv.clone().addScaledVector(fwd, -dist);
      // camera collision
      const dir = want.clone().sub(piv), L = dir.length(); dir.normalize();
      const h = this.raycast(piv, dir, L, { skipInvisible: true, noGround: true }); if (h.type && h.type !== 'veh') want = piv.clone().addScaledVector(dir, Math.max(0.3, h.t - 0.2));
      if (want.y < this.groundAt(want.x, want.z, want.y + 1) + 0.25) want.y = this.groundAt(want.x, want.z, want.y + 1) + 0.25;
      pos = want; look = piv.clone().addScaledVector(fwd, 10);
      this.fov = lerp(60, 46, this.aimBlend);
    }
    if (!pos) { pos = V3(this.len / 2, 5, 15); look = V3(this.len / 2, 1, 0); }
    if (snap || !this._cp) { this._cp = pos.clone(); this._cl = look.clone(); }
    const k = this.cinematic ? Math.min(1, dt * 3) : 1;
    this._cp.lerp(pos, k); this._cl.lerp(look, k);
    camera.position.copy(this._cp); camera.lookAt(this._cl);
    if (this.camShake > 0.001) { camera.position.add(V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(this.camShake * 0.08)); camera.rotateZ(rand(-1, 1) * this.camShake * 0.01); }
    this.camShake = Math.max(0, this.camShake - dt * 3);
    if (camera.fov !== this.fov) { camera.fov = this.fov; camera.updateProjectionMatrix(); }
    this.camPos.copy(camera.position);
    for (const a of this.actors) { const near = !a.isPlayer() ? a.center().distanceTo(this.camPos) < 1.9 : (a.center().distanceTo(this.camPos) < 0.9 || a.J.head.distanceTo(this.camPos) < 0.55); a.body.group.visible = !near; a.gunHolder.visible = a.gunHolder.visible && !near; }
    placeSun(p ? p.pos : V3(this.len / 2, 0, 0));
    // aim point: what the crosshair is over
    if (p && !this.cinematic) {
      const d = V3(); camera.getWorldDirection(d);
      const h = this.raycast(camera.position, d, 200, { actors: true, team: 'player', ignore: new Set([p]), skipInvisible: true });
      // ignore hits between camera and player
      this.aimPoint = h.type ? h.p : camera.position.clone().addScaledVector(d, 200);
      this.aimActor = h.type === 'actor' ? h.a : null;
    }
  }

  // ---------- scripting ----------
  runScript(dt) {
    let guard = 0;
    while (this.stepI < this.steps.length && guard++ < 50) {
      const s = this.steps[this.stepI];
      if (!this.stepStarted) { this.stepStarted = true; this.stepT = 0; this.startStep(s); }
      if (!this.stepDone(s)) { this.stepT += dt; return; }
      this.stepI++; this.stepStarted = false;
    }
  }
  startStep(s) {
    if (s.say) { this.dialog = new Dialogue(s.say); this.cinematic = true; }
    if (s.banter) this.banter(s.banter[0], s.banter[1]);
    if (s.spawn) this.spawn(s.spawn);
    if (s.objective !== undefined) { this.objective = s.objective; if (s.objective) Audio.play('ui'); }
    if (s.cp) { this.checkpoint = { step: this.stepI + 1, x: this.player ? this.player.pos.x : 0, z: this.player ? this.player.pos.z : 0 }; this.toast('Checkpoint'); }
    if (s.cine !== undefined) this.cinematic = s.cine;
    if (s.walk) { const [id, x, z, walk] = s.walk; const a = this.named[id]; if (a) { a.cine = V3(x, 0, z === undefined || z === null ? a.pos.z : z); a.cineWalk = !!walk; a.cineT = 0; } }
    if (s.title) this.title = { text: s.title, sub: s.sub || '', t: 0 };
    if (s.boss !== undefined) this.bossId = s.boss;
    if (s.music) Audio.music(s.music);
    if (s.cam !== undefined) this.camTarget = s.cam;
    if (s.arena) { this.minX = s.arena[0]; this.maxX = s.arena[1]; }
    if (s.unlock) { this.minX = 0; this.maxX = this.len; }
    if (s.fade) this.fadeTarget = s.fade === 'out' ? 1 : 0;
    if (s.face) { for (const [id, tid] of s.face) { const a = this.named[id], t = this.named[tid]; if (a && t) { a.yaw = Math.atan2(t.pos.x - a.pos.x, t.pos.z - a.pos.z); a.aimYaw = a.yaw; } } }
    if (s.do) s.do(this);
    if (s.end) this.done = true;
    if (s.npc) this.addNPC(s.npc);
  }
  stepDone(s) {
    if (s.say) { if (this.dialog && !this.dialog.finished) return false; this.dialog = null; if (!s.keepCine) this.cinematic = false; }
    if (s.wait !== undefined && this.stepT < s.wait) return false;
    if (s.reach !== undefined && (!this.player || this.player.pos.x < s.reach)) return false;
    if (s.clear && this.enemiesAlive() > 0) return false;
    if (s.until && !s.until(this)) return false;
    if (s.walk && s.walk[4] !== false) { const a = this.named[s.walk[0]]; if (a && a.cine) return false; }
    if (s.fade && Math.abs(this.fade - this.fadeTarget) > 0.02) return false;
    return true;
  }
  takeBarrel(x, z) { for (const b of this.barrels) if (b.kind === 'blue' && Math.abs(b.pos.x - x) < 0.5 && Math.abs(b.pos.z - z) < 0.5) { b.alive = false; b.solid.dead = true; scene.remove(b.mesh); } Audio.play('uiok'); }
  swapLook(a, key) { a.body.dispose(); a.look = LOOKS[key]; a.body = new BodyCtor(a.look); scene.add(a.body.group); a.pose(0); }
  buildCage(x, z) { const g = new THREE.Group(), m = col('cagebar', 0x555555, { metalness: 0.7 }); for (let i = 0; i < 9; i++) for (const s of [-1, 1]) { const b = cyl(0.03, 0.03, 2.6, m, 6); b.position.set(x - 1.3 + i * 0.32, 1.3, z + s * 1.3); g.add(b); const c = cyl(0.03, 0.03, 2.6, m, 6); c.position.set(x + s * 1.3, 1.3, z - 1.3 + i * 0.32); g.add(c); } g.add(box(2.7, 0.08, 2.7, m, x, 2.6, z)); scene.add(g); this.cage = g; this.cageSolid = this.addSolid(V3(x - 1.35, 0, z - 1.35), V3(x + 1.35, 2.65, z + 1.35), { style: 'metal', thin: true }); }
  openCage() { if (this.cage) { scene.remove(this.cage); this.cageSolid.dead = true; Audio.play('clank'); } }
  remove(id) { const a = this.named[id]; if (a) { a.alive = false; a.dispose(); this.actors = this.actors.filter(x => x !== a); } }
  hostilize(ids) { for (const id of ids) { const a = this.named[id]; if (!a) continue; a.passive = false; a.team = 'enemy'; a.ai.state = 'alert'; a.ai.react = 0; a.cine = null; } }
  fists(on) { const p = this.player; if (!p) return; if (on) { this.vars.savedGuns = p.guns; this.vars.savedGi = p.gi; p.guns = []; p.gi = 0; } else if (this.vars.savedGuns) { p.guns = this.vars.savedGuns; p.gi = this.vars.savedGi || 0; this.vars.savedGuns = null; } }

  // ---------- frame ----------
  update(rdt) {
    if (this.hitstop > 0) { this.hitstop -= rdt; this.updateCamera(rdt); return; }
    let dt = rdt; if (this.slowmo > 0) { this.slowmo -= rdt; dt *= 0.3; }
    this.time += dt; if (!this.done && !this.failed) this.stats.time += rdt;
    if (this.dialog) this.dialog.update(rdt);
    if (!this.failed) this.runScript(dt);
    if (this.updateExtra) this.updateExtra(dt);
    for (const a of this.actors) a.update(dt, this);
    if (this.walter && this.walter.alive && this.walter.hp < this.walter.maxHp && this.walter.downed <= 0) this.walter.hp = Math.min(this.walter.maxHp, this.walter.hp + dt * 8);
    this.updateShots(dt); this.updateProjectiles(dt); this.updateFires(dt); this.updatePickups(dt);
    for (const b of this.barrels) if (b.alive && b.fuse !== undefined) { b.fuse -= dt; if (Math.random() < 0.5) this.fx.flame(b.pos.clone().add(V3(0, 0.5, 0)), 1); if (b.fuse <= 0) { b.alive = false; b.solid.dead = true; scene.remove(b.mesh); this.explode(b.pos.clone(), { r: b.kind === 'propane' ? 6.5 : 5.5, dmg: 170, fire: true }); } }
    for (const r of this.ragdolls) r.update(dt, this);
    this.fx.update(dt);
    for (const a of this.actors) if (!a.alive && !a.isPlayer()) { a.gunHolder.visible = false; }
    this.actors = this.actors.filter(a => a.alive || a.isPlayer());
    for (const t of this.toasts) t.life -= rdt; this.toasts = this.toasts.filter(t => t.life > 0);
    for (const t of this.banters) t.life -= rdt; this.banters = this.banters.filter(t => t.life > 0);
    for (const f of this.floaters) f.life -= rdt; this.floaters = this.floaters.filter(t => t.life > 0);
    for (const d of this.dmgDirs) d.life -= rdt; this.dmgDirs = this.dmgDirs.filter(d => d.life > 0);
    if (this.title) { this.title.t += rdt; if (this.title.t > 4) this.title = null; }
    this.hurtVignette = Math.max(0, this.hurtVignette - rdt); this.hitMarker -= rdt; this.healFlash -= rdt;
    this.letterbox = lerp(this.letterbox, this.cinematic ? 1 : 0, Math.min(1, rdt * 5));
    this.fade = lerp(this.fade, this.fadeTarget, Math.min(1, rdt * 3)); if (Math.abs(this.fade - this.fadeTarget) < 0.01) this.fade = this.fadeTarget;
    if (this.failed) this.failT += rdt;
    this.prompt = null;
    for (const it of this.interacts) if (!it.done && it.gem) { it.gem.rotation.y += rdt * 2; it.gem.position.y = 2.1 + Math.sin(this.time * 3) * 0.12; it.ring.material.opacity = 0.4 + Math.sin(this.time * 5) * 0.2; }
    if (this.player && this.player.alive && !this.cinematic) for (const it of this.interacts) { if (it.done) continue; if (Math.hypot(this.player.pos.x - it.p.x, this.player.pos.z - it.p.z) < 2.8) { this.prompt = it; if (Input.hit('KeyE')) { it.done = true; if (it.ring) { scene.remove(it.ring); scene.remove(it.gem); } it.fn(this); } break; } }
    if (this.def.failIf && !this.failed && !this.done) { const r = this.def.failIf(this); if (r) { this.failed = true; this.failT = 0; this.failReason = r; Audio.play('bad'); } }
    this.updateCamera(rdt);
    if (this.torch && this.player) { this.torch.position.copy(this.player.gunPoint('muzzle')); if (this.aimPoint) this.torch.target.position.copy(this.aimPoint); else this.torch.target.position.copy(this.player.pos).add(V3(Math.sin(this.player.yaw) * 10, 1, Math.cos(this.player.yaw) * 10)); }
  }
  project(p) { const v = p.clone().project(camera); return v.z > 1 ? null : [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; }
  dispose() { clearScene(); }

  // ---------- HUD (2D overlay) ----------
  drawHUD(c) {
    const p = this.player, st = G.state;
    // floaters + prompt (projected)
    c.font = `bold 16px ${FONT}`; c.textAlign = 'center';
    for (const f of this.floaters) { if (!f.a.alive) continue; const s = this.project(f.a.J.head.clone().add(V3(0, 0.45, 0))); if (!s) continue; c.globalAlpha = Math.min(1, f.life * 2); c.fillStyle = '#000'; c.fillText(f.text, s[0] + 1, s[1] + 1); c.fillStyle = '#ffe9b0'; c.fillText(f.text, s[0], s[1]); }
    c.globalAlpha = 1;
    if (this.prompt) { const s = this.project(this.prompt.p.clone().add(V3(0, 1.4, 0))); if (s) { c.fillStyle = 'rgba(0,0,0,.6)'; rrect(c, s[0] - 110, s[1] - 22, 220, 32, 6); c.fill(); c.fillStyle = '#ffe08a'; c.fillText(this.prompt.text, s[0], s[1]); } }
    c.textAlign = 'left';
    if (this.letterbox > 0.01) { const h = 70 * this.letterbox; c.fillStyle = '#000'; c.fillRect(0, 0, W, h); c.fillRect(0, H - h, W, h); }
    if (p && (this.hurtVignette > 0 || p.hp < p.maxHp * 0.35)) { const a = Math.max(this.hurtVignette, p.hp < p.maxHp * 0.35 ? 0.35 + Math.sin(this.time * 6) * 0.1 : 0); const g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85); g.addColorStop(0, 'rgba(120,0,0,0)'); g.addColorStop(1, `rgba(150,0,0,${a})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    const showHud = p && !this.cinematic && this.letterbox < 0.5 && !this.def.noHud;
    if (showHud) {
      c.save(); c.translate(24, H - 92); c.fillStyle = 'rgba(10,10,10,.6)'; rrect(c, 0, 0, 320, 72, 8); c.fill();
      drawPortrait(c, 8, 8, 56, LOOKS.jace, p.hp < 40 ? 'worried' : 'neutral');
      c.font = `bold 13px ${FONT}`; c.fillStyle = '#ddd'; c.fillText('JACE', 74, 22);
      c.fillStyle = '#300'; c.fillRect(74, 28, 230, 14); c.fillStyle = p.hp < 35 ? '#e03020' : '#c8302a'; c.fillRect(74, 28, 230 * clamp(p.hp / p.maxHp, 0, 1), 14);
      if ((p.regenerating && p.hp < p.maxHp) || this.healFlash > 0) { c.fillStyle = `rgba(120,240,120,${0.35 + Math.sin(this.time * 8) * 0.2})`; c.fillRect(74, 28, 230 * clamp(p.hp / p.maxHp, 0, 1), 14); c.font = `bold 11px ${FONT}`; c.fillStyle = '#9fe88a'; c.textAlign = 'right'; c.fillText(this.healFlash > 0 ? 'HEALED' : 'REGENERATING', 304, 22); c.textAlign = 'left'; }
      c.fillStyle = '#123'; c.fillRect(74, 46, 230, 7); c.fillStyle = '#5ab0e0'; c.fillRect(74, 46, 230 * clamp(p.armor / 150, 0, 1), 7);
      c.font = `12px ${FONT}`; c.fillStyle = '#ccc'; c.fillText(`[G] Bang ×${st.bangs}   [V] Molotov ×${st.molotovs}   [H] Medkit ×${st.medkits}`, 74, 67);
      c.restore();
      const g = p.gun;
      if (g && !g.melee) {
        c.save(); c.translate(W - 324, H - 112); c.fillStyle = 'rgba(10,10,10,.6)'; rrect(c, 0, 0, 300, 92, 8); c.fill();
        c.save(); c.translate(70, 50); c.scale(2.1, 2.1); if (g.def.heavy || g.def.art === 'rifle' || g.def.art === 'shotgun') c.scale(0.75, 0.75); c.rotate(-g.tilt()[0] * 0.6); GUN_ART[g.def.art](c, { slide: g.slide, magIn: g.magIn, cyl: g.cyl, pump: g.pump, cover: g.cover, gold: g.def.gold }); c.restore();
        c.textAlign = 'right'; c.font = `13px ${FONT}`; c.fillStyle = '#ddd'; c.fillText(g.def.name.toUpperCase() + '  ·  ' + (p.gi + 1) + '/' + p.guns.length, 288, 19);
        const rs = '/ ' + p.reserve(g.def.ammo); c.font = `bold 18px ${FONT}`; const rw = c.measureText(rs).width;
        c.font = `bold 36px ${FONT}`; c.fillStyle = g.mag === 0 ? '#e04030' : g.mag <= g.def.mag * 0.25 ? '#f0b040' : '#fff'; c.fillText(g.mag, 282 - rw, 60);
        c.font = `bold 18px ${FONT}`; c.fillStyle = '#aaa'; c.fillText(rs, 288, 60);
        const n = Math.min(g.def.mag, 32), pw = Math.min(6, 150 / n); for (let i = 0; i < n; i++) { c.fillStyle = i < (g.mag / g.def.mag) * n ? '#e8c060' : 'rgba(255,255,255,.15)'; c.fillRect(288 - (i + 1) * (pw + 1.5), 68, pw, 6); }
        if (g.reload) { c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(140, 79, 148, 4); c.fillStyle = '#ffd060'; c.fillRect(140, 79, 148 * g.progress(), 4); c.font = `bold 11px ${FONT}`; c.fillStyle = '#ffd060'; c.fillText('RELOADING', 132, 86); }
        else if (g.mag === 0) { c.font = `bold 12px ${FONT}`; c.fillStyle = '#ff6040'; c.fillText(p.reserve(g.def.ammo) > 0 ? 'PRESS R TO RELOAD' : 'NO AMMO', 288, 88); }
        c.textAlign = 'left'; c.restore();
      }
      c.font = `bold 22px ${FONT}`; c.textAlign = 'right'; c.fillStyle = '#000'; c.fillText(fmtMoney(st.money), W - 22, 38); c.fillStyle = '#8fe07a'; c.fillText(fmtMoney(st.money), W - 24, 36); c.textAlign = 'left';
      if (this.objective) { c.font = `bold 15px ${FONT}`; const w = c.measureText(this.objective).width; c.fillStyle = 'rgba(0,0,0,.55)'; rrect(c, 18, 18, w + 44, 30, 6); c.fill(); c.fillStyle = '#ffd060'; c.fillRect(28, 28, 10, 10); c.fillStyle = '#fff'; c.fillText(this.objective, 48, 38); }
      const left = this.enemiesAlive(); if (left > 0) { c.font = `13px ${FONT}`; c.fillStyle = '#e8a090'; c.fillText('Hostiles: ' + left, 22, 68); }
      if (this.walter) { const w = this.walter; c.save(); c.translate(24, H - 132); c.fillStyle = 'rgba(10,10,10,.55)'; rrect(c, 0, 0, 200, 32, 6); c.fill(); drawPortrait(c, 3, 3, 26, LOOKS.walter); c.fillStyle = '#bbb'; c.font = `11px ${FONT}`; c.fillText(w.downed > 0 ? 'WALTER — DOWN (' + Math.ceil(w.downed) + ')' : 'WALTER', 36, 13); c.fillStyle = '#222'; c.fillRect(36, 18, 154, 6); c.fillStyle = w.downed > 0 ? '#c84' : '#7ab060'; c.fillRect(36, 18, 154 * clamp(w.hp / w.maxHp, 0, 1), 6); c.restore(); }
      // enemy markers: arrows around the crosshair for off-screen hostiles
      for (const a of this.actors) {
        if (!a.alive || a.team !== 'enemy' || a.passive) continue;
        const v = a.center().project(camera); if (v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1) continue;
        const d = a.pos.clone().sub(this.camPos); const ang = Math.atan2(d.x, d.z) - this.camYaw;
        const ax = W / 2 - Math.sin(ang) * 130, ay = H / 2 - Math.cos(ang) * 130;
        c.save(); c.translate(ax, ay); c.rotate(-ang + PI); c.globalAlpha = 0.6 + Math.sin(this.time * 6) * 0.3; c.fillStyle = '#ff4a3a'; c.strokeStyle = '#000'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -10); c.lineTo(9, 6); c.lineTo(0, 2); c.lineTo(-9, 6); c.closePath(); c.fill(); c.stroke(); c.restore();
      }
      for (const dd of this.dmgDirs) { const ang = dd.a - this.camYaw; c.save(); c.translate(W / 2, H / 2); c.rotate(-ang); c.globalAlpha = dd.life * 0.8; c.strokeStyle = '#ff2a1a'; c.lineWidth = 8; c.beginPath(); c.arc(0, 0, 170, -PI / 2 - 0.3, -PI / 2 + 0.3); c.stroke(); c.restore(); }
    }
    const boss = this.bossId && this.named[this.bossId];
    if (boss && boss.alive && !this.cinematic) { const bw = 560, x = (W - bw) / 2; c.fillStyle = 'rgba(0,0,0,.6)'; rrect(c, x - 10, 56, bw + 20, 44, 6); c.fill(); c.font = `bold 15px ${FONT}`; c.textAlign = 'center'; c.fillStyle = '#f0d8a0'; c.fillText((boss.name || boss.look.name || 'BOSS').toUpperCase(), W / 2, 74); c.textAlign = 'left'; c.fillStyle = '#300'; c.fillRect(x, 80, bw, 12); c.fillStyle = '#c0281c'; c.fillRect(x, 80, bw * clamp(boss.hp / boss.maxHp, 0, 1), 12); if (boss.armor > 0) { c.fillStyle = '#5ab0e0'; c.fillRect(x, 92, bw * clamp(boss.armor / boss.maxArmor, 0, 1), 4); } }
    this.banters.forEach((b, idx) => { const look = b.who ? LOOKS[b.who] : null; c.globalAlpha = Math.min(1, b.life * 2); c.font = `16px ${FONT}`; const w = c.measureText(b.text).width + (look ? 70 : 30); const x = (W - w) / 2, y = H - 190 - (this.banters.length - 1 - idx) * 54; c.fillStyle = 'rgba(0,0,0,.65)'; rrect(c, x, y, w, 46, 8); c.fill(); if (look) { drawPortrait(c, x + 6, y + 5, 36, look); c.fillStyle = '#ffd060'; c.font = `bold 12px ${FONT}`; c.fillText(look.name.toUpperCase(), x + 52, y + 18); c.fillStyle = '#fff'; c.font = `16px ${FONT}`; c.fillText(b.text, x + 52, y + 37); } else { c.fillStyle = '#fff'; c.fillText(b.text, x + 15, y + 29); } c.globalAlpha = 1; });
    const ty = boss && boss.alive ? 140 : 96; c.textAlign = 'center';
    this.toasts.forEach((t, i) => { c.globalAlpha = Math.min(1, t.life * 2); c.font = `bold 18px ${FONT}`; c.fillStyle = '#000'; c.fillText(t.t, W / 2 + 1, ty + i * 26 + 1); c.fillStyle = '#ffe9a8'; c.fillText(t.t, W / 2, ty + i * 26); });
    c.globalAlpha = 1; c.textAlign = 'left';
    if (this.title) { const t = this.title.t, a = t < 0.6 ? t / 0.6 : t > 3.2 ? Math.max(0, 1 - (t - 3.2) / 0.8) : 1; c.globalAlpha = a; c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, H / 2 - 70, W, 140); c.textAlign = 'center'; c.font = `18px ${FONT}`; c.fillStyle = '#9fd88a'; c.fillText(this.title.sub, W / 2, H / 2 - 28); c.font = `bold 54px ${FONT}`; c.fillStyle = '#fff'; c.fillText(this.title.text, W / 2, H / 2 + 28); c.textAlign = 'left'; c.globalAlpha = 1; }
    if (this.dialog) this.dialog.draw(c);
    if (showHud && p.alive) this.drawCrosshair(c, p);
    if (this.vars.alarm) { c.fillStyle = `rgba(255,0,0,${0.07 + Math.sin(this.time * 8) * 0.05})`; c.fillRect(0, 0, W, H); }
    if (this.fade > 0.001) { c.fillStyle = `rgba(0,0,0,${this.fade})`; c.fillRect(0, 0, W, H); }
  }
  drawCrosshair(c, p) {
    const g = p.gun; c.save(); c.translate(W / 2, H / 2);
    const spread = g && !g.melee ? 6 + g.def.spread * 400 * (p.aiming ? 0.45 : 1) + p.kick * 40 + (p.onGround ? 0 : 8) : 6;
    const lines = () => { c.beginPath(); c.moveTo(-spread - 9, 0); c.lineTo(-spread, 0); c.moveTo(spread, 0); c.lineTo(spread + 9, 0); c.moveTo(0, -spread - 9); c.lineTo(0, -spread); c.moveTo(0, spread); c.lineTo(0, spread + 9); c.stroke(); };
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 4; lines(); c.strokeStyle = this.aimActor && this.aimActor.team === 'enemy' ? '#ff6a5a' : '#fff'; c.lineWidth = 2; lines();
    c.fillStyle = '#fff'; c.fillRect(-1, -1, 2, 2);
    if (g && g.reload) { c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, spread + 16, 0, TAU); c.stroke(); c.strokeStyle = '#ffd060'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, spread + 16, -PI / 2, -PI / 2 + TAU * g.progress()); c.stroke(); }
    if (this.hitMarker > 0) { c.strokeStyle = this.hitHead ? '#ff3020' : '#fff'; c.lineWidth = 2.5; const s = 7, o = 5; c.beginPath(); c.moveTo(-o - s, -o - s); c.lineTo(-o, -o); c.moveTo(o + s, -o - s); c.lineTo(o, -o); c.moveTo(-o - s, o + s); c.lineTo(-o, o); c.moveTo(o + s, o + s); c.lineTo(o, o); c.stroke(); }
    c.restore();
  }
}

export class Dialogue {
  constructor(lines) { this.lines = lines; this.i = 0; this.chars = 0; this.finished = false; }
  get line() { return this.lines[this.i]; }
  update(dt) {
    if (this.finished) return;
    const full = this.line[1].length, prev = Math.floor(this.chars); this.chars = Math.min(full, this.chars + dt * 52);
    if (Math.floor(this.chars) > prev && Math.floor(this.chars) % 3 === 0) Audio.play('type');
    if (Input.hit('Space') || Input.mclick || Input.hit('Enter') || Input.hit('KeyE')) { if (this.chars < full) this.chars = full; else { this.i++; this.chars = 0; Audio.play('ui', 0, 0.4); if (this.i >= this.lines.length) this.finished = true; } }
  }
  draw(c) {
    if (this.finished) return;
    const [who, text, expr] = this.line, look = LOOKS[who];
    const x = 90, y = H - 216, w = W - 180, h = 140;
    c.fillStyle = 'rgba(8,8,10,.86)'; rrect(c, x, y, w, h, 12); c.fill(); c.strokeStyle = 'rgba(255,220,140,.35)'; c.lineWidth = 2; c.stroke();
    let tx = x + 26; if (look) { drawPortrait(c, x + 12, y + 10, 120, look, expr || 'neutral'); tx = x + 152; }
    c.font = `bold 18px ${FONT}`; c.fillStyle = who && who.startsWith('walter') ? '#9fd88a' : who === 'jace' ? '#ffb070' : '#ffd060';
    c.fillText(look ? look.name.toUpperCase() : '', tx, y + 32);
    c.font = `19px ${FONT}`; c.fillStyle = '#f2ece0'; wrapText(c, text.slice(0, Math.floor(this.chars)), tx, y + 62, w - (tx - x) - 30, 26);
    if (this.chars >= text.length) { c.fillStyle = `rgba(255,220,140,${0.5 + Math.sin(performance.now() / 200) * 0.4})`; c.font = `13px ${FONT}`; c.textAlign = 'right'; c.fillText('SPACE ▸', x + w - 18, y + h - 12); c.textAlign = 'left'; }
  }
}
