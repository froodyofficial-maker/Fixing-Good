'use strict';
// ============================================================
//  FIXING GOOD - level runtime: world, combat, scripting, HUD
// ============================================================
const ICON = {};

class Level {
  constructor(def, opts = {}) {
    this.def = def; this.width = def.width || 3000; this.noDecals = !!def.noDecals;
    this.theme = THEMES[def.theme] || THEMES.day; this.dark = def.dark !== undefined ? def.dark : this.theme.dark;
    this.solids = []; this.backProps = []; this.frontProps = []; this.barrels = []; this.staticLights = [];
    this.actors = []; this.ragdolls = []; this.bullets = []; this.pickups = []; this.fires = []; this.projectiles = []; this.floaters = [];
    this.named = {}; this.minX = 0; this.maxX = this.width;
    this.fx = new FX(this);
    this.cam = { x: 0, y: 0, shake: 0, target: null };
    this.Z = def.zoom || 1.2; this.VW = W / this.Z; this.OFFY = GROUND * this.Z - 640; // world->screen: (x-camX)*Z, y*Z-OFFY
    this.time = 0; this.stepI = 0; this.stepStarted = false; this.stepT = 0; this.vars = {};
    this.dialog = null; this.banters = []; this.toasts = []; this.objective = ''; this.bossId = null; this.title = null;
    this.cinematic = false; this.letterbox = 0; this.fade = opts.fadeIn === false ? 0 : 1; this.fadeTarget = 0;
    this.hitstop = 0; this.slowmo = 0; this.hurtVignette = 0; this.hitMarker = 0; this.hitHead = false;
    this.done = false; this.failed = false; this.failT = 0; this.checkpoint = opts.checkpoint || null;
    this.stats = { kills: 0, heads: 0, cash: 0, time: 0 };
    this.steps = def.steps || [];
    this.build();
    if (this.checkpoint) { this.stepI = this.checkpoint.step; }
    this.spawnHeroes();
    this.snapCamera();
  }
  // ---------- building helpers ----------
  build() {
    const L = this, d = this.def;
    const api = {
      crate: (x, w = 60, h = 60, style = 'wood', y) => { const s = { x, y: (y !== undefined ? y : GROUND) - h, w, h, style, hp: style === 'cardboard' ? 40 : style === 'wood' ? 220 : 0 }; L.solids.push(s); return s; },
      stack: (x, style = 'wood') => { api.crate(x, 64, 64, style); api.crate(x + 6, 52, 52, style, GROUND - 64); },
      plat: (x, y, w, style = 'beam') => { const s = { x, y, w, h: 12, oneway: true, style }; L.solids.push(s); return s; },
      wall: (x, y, w, h, style = 'metal') => { const s = { x, y, w, h, style }; L.solids.push(s); return s; },
      barrel: (x, kind = 'red', y = GROUND) => { const b = { x, y, kind, hp: kind === 'red' || kind === 'propane' ? 30 : 9999, alive: true }; L.barrels.push(b); if (kind !== 'red' && kind !== 'propane') L.solids.push({ x: x - 18, y: y - 56, w: 36, h: 56, style: 'none' }); return b; },
      car: (x, col = '#7a2a2a', kind = 'sedan', f = 1, w = 230) => { L.solids.push({ x: x + 8, y: GROUND - 58, w: w - 16, h: 58, style: 'none', car: true }); L.backProps.push({ kind: 'car', x, col, ck: kind, f, w }); },
      rv: (x, o = {}) => L.backProps.push({ kind: 'rv', x, o }),
      lamp: (x, h = 260, on = true) => { L.backProps.push({ kind: 'lamp', x, h, on }); if (on) L.staticLights.push({ x: x + 27, y: GROUND - h, r: 360, col: '255,220,150', a: 0.95, flicker: Math.random() < 0.3 }); },
      light: (x, y, r, col = '255,210,150', a = 0.9) => L.staticLights.push({ x, y, r, col, a }),
      cactus: (x, h = 100) => L.backProps.push({ kind: 'cactus', x, h }),
      prop: (fn, front = false) => (front ? L.frontProps : L.backProps).push({ kind: 'fn', fn }),
      sign: (x, text, col = '#e8d070') => L.backProps.push({ kind: 'sign', x, text, col }),
      table: (x, w = 120) => { L.solids.push({ x, y: GROUND - 54, w, h: 8, oneway: true, style: 'table' }); },
      fire: (x, w = 40, life = 9999) => L.fires.push({ x, w, t: life, y: GROUND }),
      pickup: (x, kind, type, amount) => L.pickups.push({ x, y: GROUND - 20, vy: 0, kind, type, amount }),
    };
    if (d.build) d.build(api, this);
  }
  spawnHeroes() {
    const d = this.def, st = Game.state;
    const startX = this.checkpoint ? this.checkpoint.x : (d.start || 160);
    if (!d.noPlayer) {
      const guns = d.unarmed ? [] : st.weapons.slice();
      const p = new Actor({ kind: 'player', team: 'player', x: startX, look: d.playerLook || 'jace', guns, armor: st.armor, id: 'player' });
      p.maxHp = 100 + (st.upgrades.health ? 40 : 0); p.hp = p.maxHp;
      p.reloadMul = st.upgrades.reload ? 0.72 : 1;
      // carry over magazine contents between levels
      p.guns.forEach(g => { if (st.mags[g.key] !== undefined) g.mag = st.mags[g.key]; });
      const gi = p.guns.findIndex(g => g.key === st.lastGun); if (gi >= 0) p.gi = gi;
      this.player = p; this.actors.push(p); this.named.player = p;
    }
    if (d.walter) {
      const w = new Actor({ kind: 'walter', team: 'ally', x: startX - 90, look: d.walterLook || 'walter', guns: d.walterUnarmed ? [] : ['pistol'], id: 'walter', invuln: true });
      this.walter = w; this.actors.push(w); this.named.walter = w;
    }
    if (d.npcs) for (const n of d.npcs) this.addNPC(n);
  }
  addNPC(n) {
    const a = new Actor({ kind: n.kind || 'npc', team: n.team || 'npc', x: n.x, y: n.y, look: n.look, guns: n.guns || [], id: n.id, face: n.face || -1, passive: n.passive !== false, name: n.name, hp: n.hp, boss: n.boss });
    if (n.id) this.named[n.id] = a; this.actors.push(a); return a;
  }
  spawn(spec) {
    const list = Array.isArray(spec) ? spec : [spec];
    const out = [];
    for (const s of list) {
      let x = s.x;
      if (s.from === 'right') x = this.cam.x + this.VW + rand(40, 160);
      if (s.from === 'left') x = this.cam.x - rand(40, 160);
      if (s.near) x = this.player.x + s.near;
      x = clamp(x, this.minX + 20, this.maxX - 20);
      const A = ARCH[s.t] || ARCH.gunner;
      const look = s.look || A.look || this.def.enemyLook || 'thug';
      const a = new Actor({ kind: s.t, team: 'enemy', x, y: s.y || GROUND, look, guns: s.w ? [s.w] : undefined, face: s.face || (x > (this.player ? this.player.x : 0) ? -1 : 1), alert: s.alert !== false && !s.idle, patrol: s.patrol, name: s.name, hp: s.hp, armor: s.armor, id: s.id, passive: s.passive });
      if (s.id) this.named[s.id] = a;
      if (s.from) a.ai.state = 'alert';
      this.actors.push(a); out.push(a);
    }
    return out;
  }
  enemiesAlive() { return this.actors.filter(a => a.alive && a.team === 'enemy' && !a.passive).length; }
  nearestHostile(me, maxD = 1400) {
    let best = null, bd = maxD;
    for (const a of this.actors) {
      if (!a.alive || a === me || a.downed > 0 || a.passive) continue;
      const hostile = me.team === 'enemy' ? (a.team === 'player' || a.team === 'ally') : a.team === 'enemy';
      if (!hostile) continue;
      const d = Math.abs(a.x - me.x) + Math.abs(a.y - me.y) * 0.5 + (a.team === 'ally' ? 120 : 0);
      if (d < bd) { bd = d; best = a; }
    }
    return best;
  }
  countHostilesNear(x, r) { return this.actors.filter(a => a.alive && a.team === 'enemy' && Math.abs(a.x - x) < r).length; }
  los(x1, y1, x2, y2) {
    for (const s of this.solids) { if (s.oneway || s.dead || s.h < 40) continue; const t = segRect(x1, y1, x2, y2, s); if (t >= 0 && t < 1) return false; }
    return true;
  }
  solidAt(x, y) { for (const s of this.solids) if (!s.dead && x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h) return s; return null; }
  noise(x, team) { if (team === 'enemy') return; for (const a of this.actors) if (a.alive && a.team === 'enemy' && a.ai.state === 'idle' && Math.abs(a.x - x) < 900) { a.ai.heard = true; a.ai.react = Math.min(a.ai.react, rand(0.15, 0.5)); } }
  shake(n) { this.cam.shake = Math.min(26, this.cam.shake + n * Settings.shake); }
  toast(t) { this.toasts.push({ t, life: 2.2 }); if (this.toasts.length > 3) this.toasts.shift(); }
  banter(who, text) { if (!text) return; this.banters.push({ who, text, life: 3.6 }); if (this.banters.length > 2) this.banters.shift(); }
  shout(a, text) { this.floaters.push({ a, text, life: 1.8 }); }

  // ---------- combat ----------
  hitBarrel(b, dmg) {
    if (!b.alive || (b.kind !== 'red' && b.kind !== 'propane')) return;
    b.hp -= dmg; if (b.hp <= 0 && !b.fuse) { b.fuse = 0.08; }
  }
  updateBullets(dt) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life -= dt; if (b.life <= 0) { this.bullets.splice(i, 1); continue; }
      const x1 = b.x, y1 = b.y, x2 = b.x + b.vx * dt, y2 = b.y + b.vy * dt;
      let best = 1.01, hit = null;
      for (const s of this.solids) {
        if (s.oneway || s.dead) continue; const t = segRect(x1, y1, x2, y2, s);
        if (t >= 0 && t < best) { best = t; hit = { type: 'solid', s }; }
      }
      for (const br of this.barrels) {
        if (!br.alive) continue; const r = { x: br.x - 18, y: br.y - 56, w: 36, h: 56 }; const t = segRect(x1, y1, x2, y2, r);
        if (t >= 0 && t < best) { best = t; hit = { type: 'barrel', br }; }
      }
      if (this.vehicles) for (const v of this.vehicles) {
        if (!v.alive || v.team === b.team) continue; const t = segRect(x1, y1, x2, y2, v.box());
        if (t >= 0 && t < best) { best = t; hit = { type: 'veh', v }; }
      }
      for (const a of this.actors) {
        if (!a.alive || a.downed > 0 || b.hitSet.has(a) || a.passive) continue;
        if (b.team === 'enemy' ? (a.team !== 'player' && a.team !== 'ally') : a.team !== 'enemy') continue;
        if (Math.abs(a.x - x1) > Math.abs(x2 - x1) + 60 && Math.abs(a.x - x2) > 60) continue;
        const J = a.J;
        const th = segCircle(x1, y1, x2, y2, J.head[0], J.head[1], 11.5);
        const tb = segCapsule(x1, y1, x2, y2, J.neck[0], J.neck[1] + 4, J.pelvis[0], J.pelvis[1], 13);
        const tl = segCapsule(x1, y1, x2, y2, J.pelvis[0], J.pelvis[1], (J.fF[0] + J.fB[0]) / 2, J.fF[1] - 6, 10);
        let t = -1, head = false;
        for (const [tt, hh] of [[th, true], [tb, false], [tl, false]]) if (tt >= 0 && (t < 0 || tt < t)) { t = tt; head = hh; }
        if (t >= 0 && t < best) { best = t; hit = { type: 'actor', a, head }; }
      }
      if (best <= 1 && hit) {
        const hx = lerp(x1, x2, best), hy = lerp(y1, y2, best), sp = Math.hypot(b.vx, b.vy), dx = b.vx / sp, dy = b.vy / sp;
        if (hit.type === 'solid') {
          const s = hit.s;
          this.fx.spark(hx, hy, 5, -dx, -dy); if (s.style !== 'none') this.fx.decalHole(hx, hy);
          if (s.style === 'wood' || s.style === 'cardboard' || s.style === 'table') this.fx.debris(hx, hy, 3, s.style === 'cardboard' ? '#c9a26a' : '#8a6a3a'); else if (Math.random() < 0.3) Audio.play('ric', 0, 0.6);
          if (s.hp) { s.hp -= b.dmg; if (s.hp <= 0) this.breakSolid(s); }
          if (b.fire) this.fx.flame(hx, hy, 3, 8);
          b.trailEnd = [hx, hy]; this.bullets.splice(i, 1); continue;
        } else if (hit.type === 'barrel') {
          this.fx.spark(hx, hy, 6, -dx, -dy); this.hitBarrel(hit.br, b.fire ? 40 : b.dmg); Audio.play('clank', 0, 0.4);
          this.bullets.splice(i, 1); continue;
        } else if (hit.type === 'veh') {
          this.fx.spark(hx, hy, 6, -dx, -dy); hit.v.damage(b.dmg, this); Audio.play('clank', 0, 0.3);
          this.bullets.splice(i, 1); continue;
        } else {
          const a = hit.a; b.hitSet.add(a);
          const mul = hit.head ? (b.team === 'enemy' ? 1.4 : 2.6) : 1;
          const close = b.shotgun && b.travelled < 200;
          const dmg = b.dmg * mul * (close ? 1.25 : 1);
          const killed = a.hurt(dmg, { kind: 'bullet', x: hx, y: hy, dx, dy, head: hit.head, knock: b.knock * (close ? 1.6 : 1), power: dmg, from: b.owner, shotgunClose: close, ignite: b.fire }, this);
          if (b.team === 'player') { this.hitMarker = 0.18; this.hitHead = hit.head; if (killed) this.hitMarker = 0.3; }
          if (hit.head) { Audio.play('headshot', a.pan(), a.vol()); if (killed && b.team === 'player') { this.stats.heads++; Game.state.stats.heads++; } } else Audio.play('hit', a.pan(), a.vol() * 0.8);
          // exit spray onto whatever is behind
          for (const s of this.solids) { if (s.oneway || s.dead) continue; const t = segRect(hx, hy, hx + dx * 140, hy + dy * 140, s); if (t >= 0) { this.fx.decalSpray(hx + dx * 140 * t, hy + dy * 140 * t, dx, dy); break; } }
          if (b.pierce > 0) { b.pierce--; b.dmg *= 0.7; b.x = hx + dx * 2; b.y = hy + dy * 2; continue; }
          this.bullets.splice(i, 1); continue;
        }
      }
      if (y2 > GROUND) { const t = (GROUND - y1) / (y2 - y1); const hx = lerp(x1, x2, t); this.fx.dust(hx, GROUND, 3); this.fx.spark(hx, GROUND, 2, 0, -1); this.bullets.splice(i, 1); continue; }
      b.px = b.x; b.py = b.y; b.x = x2; b.y = y2; b.travelled += sp_(b) * dt;
    }
    function sp_(b) { return Math.hypot(b.vx, b.vy); }
  }
  breakSolid(s) {
    s.dead = true; Audio.play('crash', 0, 0.5);
    this.fx.debris(s.x + s.w / 2, s.y + s.h / 2, 18, s.style === 'cardboard' ? '#c9a26a' : '#8a6a3a'); this.fx.dust(s.x + s.w / 2, s.y + s.h, 10);
  }
  explode(x, y, o = {}) {
    const r = o.r || 180, dmg = o.dmg || 150;
    Audio.play('explode'); this.shake(o.small ? 10 : 20); this.hitstop = 0.05;
    this.fx.light(x, y - 20, r * 3.2, '255,160,60', 1, 0.5);
    for (let i = 0; i < (o.small ? 18 : 46); i++) { const a = rand(TAU), sp = rand(60, 420); this.fx.add({ t: 'fire', x: x + Math.cos(a) * 10, y: y + Math.sin(a) * 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, life: rand(0.3, 0.8), max: 0.8, s: rand(10, 26) }); }
    this.fx.smoke(x, y - 20, o.small ? 8 : 20, 26, 0.8, -60); this.fx.spark(x, y, 20, 0, -1, '#ffb040'); this.fx.debris(x, y, 10, '#3a3a3a');
    this.fx.decalScorch(x, y > GROUND - 120 ? GROUND + 6 : y + 10, r * 0.8);
    for (const a of this.actors) {
      if (!a.alive || a.downed > 0) continue;
      const c = a.center(), d = Math.hypot(c[0] - x, c[1] - y); if (d > r) continue;
      let k = Math.pow(1 - d / r, 0.7), dm = dmg * k;
      if (a.team === 'player' && o.owner && o.owner.team !== 'enemy') dm *= 0.35;
      if (a.id === 'walter') dm *= 0.3;
      if (a.passive) continue;
      const dx = (c[0] - x) / (d || 1), dy = (c[1] - y) / (d || 1) - 0.6;
      const killed = a.hurt(dm, { kind: 'blast', x: c[0], y: c[1], dx, dy, knock: 1100 * k, close: d < r * 0.55, ignite: o.fire }, this);
      if (!killed && a.alive) { a.vx += dx * 500 * k; a.vy = -380 * k; a.onGround = false; a.stagger = 0.5; }
    }
    for (const rd of this.ragdolls) for (const p of rd.pts) { const d = Math.hypot(p.x - x, p.y - y); if (d < r * 1.2) { const k = 1 - d / (r * 1.2); p.ox -= (p.x - x) / (d || 1) * 22 * k; p.oy -= ((p.y - y) / (d || 1) - 0.8) * 22 * k; rd.t = Math.min(rd.t, 6); } }
    for (const b of this.barrels) if (b.alive && Math.hypot(b.x - x, b.y - 28 - y) < r * 0.9) this.hitBarrel(b, 100);
    for (const s of this.solids) if (s.hp && !s.dead && Math.abs(s.x + s.w / 2 - x) < r * 0.7 && Math.abs(s.y + s.h / 2 - y) < r * 0.7) { s.hp -= dmg; if (s.hp <= 0) this.breakSolid(s); }
    if (o.fire) for (let i = 0; i < 3; i++) this.fires.push({ x: x + rand(-90, 90) - 30, w: rand(40, 80), t: rand(5, 8), y: GROUND });
  }
  throwItem(a, kind, tx, ty) {
    const sx = a.x + a.facing * 10, sy = a.y - 80, T = 0.75, g = 1500;
    let vx = (tx - sx) / T, vy = (ty - sy) / T - 0.5 * g * T;
    const sp = Math.hypot(vx, vy), max = 1050; if (sp > max) { vx *= max / sp; vy *= max / sp; }
    this.projectiles.push({ x: sx, y: sy, vx, vy, kind, owner: a, rot: 0, t: 0 });
    Audio.play('whoosh'); a.melee = null;
  }
  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]; p.t += dt; p.vy += 1500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 12;
      if (p.kind === 'molotov' && Math.random() < 0.8) this.fx.flame(p.x - Math.cos(p.rot) * 6, p.y - Math.sin(p.rot) * 6, 1, 5, 1);
      if (p.kind === 'bang' && Math.random() < 0.5) this.fx.add({ t: 'spark', x: p.x, y: p.y, vx: rand(-40, 40), vy: rand(-40, 40), life: 0.2, max: 0.2, col: '#9fe8ff' });
      let boom = p.y >= GROUND || !!this.solidAt(p.x, p.y) || p.t > 3;
      if (!boom && p.t > 0.12) for (const a of this.actors) if (a.alive && a.team !== p.owner.team && !(p.owner.team !== 'enemy' && a.team !== 'enemy') && Math.abs(a.x - p.x) < 16 && p.y > a.y - 88 && p.y < a.y) { boom = true; break; }
      if (boom) {
        this.projectiles.splice(i, 1);
        const y = Math.min(p.y, GROUND - 4);
        if (p.kind === 'bang') this.explode(p.x, y - 10, { r: 190, dmg: 170, owner: p.owner });
        else { Audio.play('crash', 0, 0.6); Audio.play('fire'); this.explode(p.x, y, { r: 90, dmg: 20, small: true, fire: true, owner: p.owner }); for (let k = -1; k <= 1; k++) this.fires.push({ x: p.x + k * 55 - 25, w: 60, t: rand(6, 9), y: GROUND }); }
      }
    }
  }
  updateFires(dt) {
    for (let i = this.fires.length - 1; i >= 0; i--) {
      const f = this.fires[i]; f.t -= dt; if (f.t <= 0) { this.fires.splice(i, 1); continue; }
      const k = Math.min(1, f.t / 2);
      for (let j = 0; j < 2; j++) if (Math.random() < 0.9 * k) this.fx.flame(f.x + rand(0, f.w), f.y - 4, 1, 12, 2);
      if (Math.random() < 0.08) this.fx.smoke(f.x + rand(0, f.w), f.y - 40, 1, 14, 0.7, -50);
      this.fx.light(f.x + f.w / 2, f.y - 30, 260 * k, '255,140,50', 0.7 * k, 0.05);
      for (const a of this.actors) if (a.alive && a.downed <= 0 && !a.passive && a.x > f.x - 8 && a.x < f.x + f.w + 8 && Math.abs(a.y - f.y) < 24) { if (a.burn <= 0) a.hurt(6, { kind: 'fire', x: a.x, y: a.y - 40, ignite: true }, this); }
    }
  }
  onDeath(a, o) {
    if (a.team === 'enemy') {
      this.stats.kills++; Game.state.stats.kills++;
      if (this.player) {
        const st = Game.state, g = a.gun;
        if (g && !g.melee && !st.weapons.includes(g.key)) this.pickups.push({ x: a.x, y: a.y - 40, vy: -300, vx: rand(-80, 80), kind: 'gun', type: g.key });
        if (g && !g.melee && Math.random() < 0.65) this.pickups.push({ x: a.x + rand(-10, 10), y: a.y - 40, vy: -250, vx: rand(-100, 100), kind: 'ammo', type: g.def.ammo, amount: g.def.ammo === '12ga' ? randi(3, 6) : g.def.ammo === '357' ? randi(3, 6) : randi(10, 24) });
        if (Math.random() < 0.3 || a.boss) this.pickups.push({ x: a.x, y: a.y - 40, vy: -280, vx: rand(-100, 100), kind: 'cash', amount: a.boss ? 1500 : randi(30, 120) });
        if (Math.random() < 0.07) this.pickups.push({ x: a.x, y: a.y - 40, vy: -280, vx: rand(-100, 100), kind: 'med' });
      }
      if (a.boss) { this.slowmo = 1.6; Audio.play('explode', 0, 0.3); }
      else if (this.enemiesAlive() === 0 && this.vars.slowLast !== false) this.slowmo = 0.7;
    }
    if (a === this.player) { this.failed = true; this.failT = 0; this.slowmo = 1.5; Audio.play('bad'); }
  }
  updatePickups(dt) {
    const p = this.player;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const k = this.pickups[i];
      k.vy = (k.vy || 0) + 1500 * dt; k.y += k.vy * dt; k.x += (k.vx || 0) * dt; if (k.vx) k.vx *= 0.97;
      const s = this.solidAt(k.x, k.y); const floor = s && !s.oneway ? s.y : GROUND;
      if (k.y >= floor - 8) { k.y = floor - 8; k.vy = 0; k.vx = 0; }
      if (p && p.alive && Math.abs(p.x - k.x) < 40 && Math.abs(p.y - 30 - k.y) < 60) {
        const st = Game.state;
        if (k.kind === 'ammo') { st.ammo[k.type] = (st.ammo[k.type] || 0) + k.amount; this.toast('+' + k.amount + ' ' + AMMO_NAMES[k.type]); Audio.play('pickup'); }
        else if (k.kind === 'cash') { st.money += k.amount; this.stats.cash += k.amount; this.toast('+' + fmtMoney(k.amount)); Audio.play('cash'); }
        else if (k.kind === 'med') { if (st.medkits >= 5) continue; st.medkits++; this.toast('+1 Medkit'); Audio.play('pickup'); }
        else if (k.kind === 'gun') { if (!st.weapons.includes(k.type)) { st.weapons.push(k.type); p.guns.push(new Gun(k.type)); st.ammo[WEAPONS[k.type].ammo] += WEAPONS[k.type].mag; this.toast('NEW WEAPON: ' + WEAPONS[k.type].name + '  [' + p.guns.length + ']'); Audio.play('uiok'); } }
        else if (k.kind === 'bang') { st.bangs++; this.toast('+1 Bang Crystal'); Audio.play('pickup'); }
        this.pickups.splice(i, 1);
      }
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
    if (s.cp) { this.checkpoint = { step: this.stepI + 1, x: this.player ? this.player.x : 0 }; this.toast('Checkpoint'); Game.saveMags(this); }
    if (s.cine !== undefined) this.cinematic = s.cine;
    if (s.walk) { const [id, x, walk] = s.walk; const a = this.named[id]; if (a) { a.cine = x; a.cineWalk = !!walk; } }
    if (s.stopWalk) { for (const id of s.stopWalk) { const a = this.named[id]; if (a) { a.cine = null; a.cineLower = false; } } }
    if (s.title) this.title = { text: s.title, sub: s.sub || '', t: 0 };
    if (s.boss !== undefined) this.bossId = s.boss;
    if (s.music) Audio.music(s.music);
    if (s.cam !== undefined) this.cam.target = s.cam;
    if (s.arena) { this.minX = s.arena[0]; this.maxX = s.arena[1]; }
    if (s.unlock) { this.minX = 0; this.maxX = this.width; }
    if (s.fade) this.fadeTarget = s.fade === 'out' ? 1 : 0;
    if (s.do) s.do(this);
    if (s.end) { this.done = true; }
    if (s.npc) this.addNPC(s.npc);
  }
  stepDone(s) {
    if (s.say) { if (this.dialog && !this.dialog.finished) return false; this.dialog = null; if (!s.keepCine) this.cinematic = false; }
    if (s.wait !== undefined && this.stepT < s.wait) return false;
    if (s.reach !== undefined && (!this.player || this.player.x < s.reach)) return false;
    if (s.clear && this.enemiesAlive() > 0) return false;
    if (s.until && !s.until(this)) return false;
    if (s.walk && s.walk[3] !== false) { const a = this.named[s.walk[0]]; if (a && Math.abs(a.x - s.walk[1]) > 8) { if (this.stepT < 7) return false; a.x = s.walk[1]; a.cine = null; a.cineLower = false; } }
    if (s.fade && Math.abs(this.fade - this.fadeTarget) > 0.02) return false;
    return true;
  }

  // ---------- frame ----------
  update(rdt) {
    if (this.hitstop > 0) { this.hitstop -= rdt; return; }
    let dt = rdt;
    if (this.slowmo > 0) { this.slowmo -= rdt; dt *= 0.3; }
    this.time += dt; if (!this.done && !this.failed) this.stats.time += rdt;
    if (this.dialog) this.dialog.update(rdt);
    if (!this.failed) this.runScript(dt);
    for (const a of this.actors) a.update(dt, this);
    if (this.walter && this.walter.alive && this.walter.hp < this.walter.maxHp && this.walter.downed <= 0) this.walter.hp = Math.min(this.walter.maxHp, this.walter.hp + dt * 8);
    if (this.updateExtra) this.updateExtra(dt);
    this.updateBullets(dt); this.updateProjectiles(dt); this.updateFires(dt); this.updatePickups(dt);
    for (const b of this.barrels) if (b.alive && b.fuse !== undefined) { b.fuse -= dt; if (Math.random() < 0.5) this.fx.flame(b.x, b.y - 56, 1, 8); if (b.fuse <= 0) { b.alive = false; this.explode(b.x, b.y - 30, { r: b.kind === 'propane' ? 220 : 190, dmg: 170, fire: true }); } }
    for (const r of this.ragdolls) r.update(dt, this);
    this.fx.update(dt);
    // remove dead actors (ragdolls took over)
    this.actors = this.actors.filter(a => a.alive || a.isPlayer());
    for (const t of this.toasts) t.life -= rdt; this.toasts = this.toasts.filter(t => t.life > 0);
    for (const t of this.banters) t.life -= rdt; this.banters = this.banters.filter(t => t.life > 0);
    for (const f of this.floaters) f.life -= rdt; this.floaters = this.floaters.filter(t => t.life > 0);
    if (this.title) { this.title.t += rdt; if (this.title.t > 4) this.title = null; }
    this.hurtVignette = Math.max(0, this.hurtVignette - rdt); this.hitMarker -= rdt;
    this.letterbox = lerp(this.letterbox, this.cinematic ? 1 : 0, Math.min(1, rdt * 5));
    this.fade = lerp(this.fade, this.fadeTarget, Math.min(1, rdt * 3)); if (Math.abs(this.fade - this.fadeTarget) < 0.01) this.fade = this.fadeTarget;
    if (this.failed) this.failT += rdt;
    // interactables
    this.prompt = null;
    if (this.interacts && this.player && this.player.alive && !this.cinematic) {
      for (const it of this.interacts) {
        if (it.done) continue;
        if (Math.abs(this.player.x - it.x) < 60) { this.prompt = { x: it.x, y: it.y - 70, text: it.text }; if (Input.hit('KeyE')) { it.done = true; it.fn(this); } break; }
      }
    }
    if (this.def.failIf && !this.failed && !this.done) { const r = this.def.failIf(this); if (r) { this.failed = true; this.failT = 0; this.failReason = r; Audio.play('bad'); } }
    this.updateCamera(rdt);
  }
  toWorld(mx, my) { return [this.cam.x + mx / this.Z, (my + this.OFFY) / this.Z]; }
  toScreen(x, y) { return [(x - this.cam.x) * this.Z, y * this.Z - this.OFFY]; }
  snapCamera() { const t = this.camTargetX(); this.cam.x = t; }
  camTargetX() {
    if (this.cam.target !== null && this.cam.target !== undefined) return clamp((typeof this.cam.target === 'string' ? (this.named[this.cam.target] || this.player).x : this.cam.target) - this.VW / 2, 0, Math.max(0, this.width - this.VW));
    const p = this.player; if (!p) return 0;
    const look = this.cinematic ? 0 : clamp((Input.mx - W / 2) * 0.28, -200, 200);
    return clamp(p.x - this.VW / 2 + look / this.Z, this.minX > 0 ? Math.min(this.minX, p.x - this.VW / 2) : 0, Math.max(0, this.width - this.VW));
  }
  updateCamera(dt) {
    const t = this.camTargetX();
    this.cam.x = lerp(this.cam.x, t, Math.min(1, dt * 6));
    this.cam.shake = Math.max(0, this.cam.shake - dt * 40);
  }

  draw(c) {
    const camX = Math.round(this.cam.x), sh = this.cam.shake;
    const sx = rand(-sh, sh) * 0.6, sy = rand(-sh, sh) * 0.6;
    c.save(); c.translate(sx, sy);
    const Z = this.Z, VW = this.VW;
    drawBackdrop(c, this.theme, camX * Z, 640 - GROUND);
    if (this.drawBackExtra) this.drawBackExtra(c, camX);
    c.save(); c.translate(0, -this.OFFY); c.scale(Z, Z); c.translate(-camX, 0);
    { const g = this.theme.ground, gw = g.width; for (let x = Math.floor(camX / gw) * gw; x < camX + VW + 2; x += gw) c.drawImage(g, x, GROUND); }
    for (const p of this.backProps) this.drawProp(c, p, camX);
    if (this.fx.decalCanvas) c.drawImage(this.fx.decalCanvas, camX, 0, Math.min(VW + 2, this.fx.decalCanvas.width - camX), H, camX, 0, Math.min(VW + 2, this.fx.decalCanvas.width - camX), H);
    for (const s of this.solids) if (!s.dead && s.x + s.w > camX - 50 && s.x < camX + VW + 50) this.drawSolid(c, s);
    for (const b of this.barrels) if (b.alive) drawBarrel(c, b.x, b.y, b.kind);
    for (const f of this.fires) { c.fillStyle = 'rgba(20,10,5,.35)'; c.fillRect(f.x, f.y - 3, f.w, 5); }
    if (this.drawMidExtra) this.drawMidExtra(c, camX);
    this.fx.draw(c);
    for (const k of this.pickups) this.drawPickup(c, k);
    for (const r of this.ragdolls) r.draw(c);
    const order = this.actors.slice().sort((a, b) => (a.team === 'player' ? 2 : a.team === 'ally' ? 1 : 0) - (b.team === 'player' ? 2 : b.team === 'ally' ? 1 : 0));
    for (const a of order) if (a.x > camX - 120 && a.x < camX + VW + 120) a.draw(c);
    if (this.drawFrontExtra) this.drawFrontExtra(c, camX);
    for (const p of this.projectiles) { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); if (p.kind === 'bang') { c.fillStyle = '#7fd8f0'; c.strokeStyle = '#1a4a5a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -7); c.lineTo(5, 0); c.lineTo(0, 7); c.lineTo(-5, 0); c.closePath(); c.fill(); c.stroke(); } else { c.fillStyle = '#4a7a2a'; c.fillRect(-4, -8, 8, 14); c.fillStyle = '#e8e0d0'; c.fillRect(-2, -13, 4, 6); } c.restore(); }
    // bullets
    c.lineCap = 'round';
    for (const b of this.bullets) {
      const sp = Math.hypot(b.vx, b.vy), len = Math.min(70, b.travelled + 10);
      const x0 = b.x - b.vx / sp * len, y0 = b.y - b.vy / sp * len;
      const g = c.createLinearGradient(x0, y0, b.x, b.y);
      const col = b.fire ? '255,130,40' : b.team === 'enemy' ? '255,190,120' : '255,240,190';
      g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},.95)`);
      c.strokeStyle = g; c.lineWidth = b.fire ? 3 : 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(b.x, b.y); c.stroke();
      if (b.fire && Math.random() < 0.5) this.fx.flame(b.x, b.y, 1, 5, 2);
    }
    for (const p of this.frontProps) this.drawProp(c, p, camX);
    // floaters (shouts)
    c.font = 'bold 15px "Oswald", Impact, sans-serif'; c.textAlign = 'center';
    for (const f of this.floaters) { if (!f.a.alive) continue; c.globalAlpha = Math.min(1, f.life * 2); c.fillStyle = '#000'; c.fillText(f.text, f.a.x + 1, f.a.y - 112 - (1.8 - f.life) * 12 + 1); c.fillStyle = '#ffe9b0'; c.fillText(f.text, f.a.x, f.a.y - 112 - (1.8 - f.life) * 12); }
    c.globalAlpha = 1; c.textAlign = 'left';
    // interaction prompts
    if (this.prompt) { const p = this.prompt; c.font = 'bold 16px "Oswald", Impact, sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(0,0,0,.6)'; rrect(c, p.x - 90, p.y - 22, 180, 30, 6); c.fill(); c.fillStyle = '#ffe08a'; c.fillText(p.text, p.x, p.y); c.textAlign = 'left'; }
    c.restore();
    let lights = this.staticLights;
    if (this.def.flashlight && this.player && this.player.alive) { const p = this.player, m = p.L2W(30, -6); lights = lights.concat([{ x: m[0], y: m[1], r: 640, a: 0.95, cone: p.gAng, max: 0 }, { x: p.x, y: p.y - 50, r: 170, a: 0.6, max: 0 }]); }
    this.fx.drawLighting(c, camX, this.dark, lights, Z, this.OFFY);
    if (this.vars.alarm) { c.fillStyle = `rgba(255,0,0,${0.08 + Math.sin(this.time * 8) * 0.06})`; c.fillRect(0, 0, W, H); }
    c.restore();
    this.drawHUD(c);
  }
  drawProp(c, p, camX) {
    switch (p.kind) {
      case 'car': if (p.x + p.w > camX - 50 && p.x < camX + this.VW + 50) drawCar(c, p.x, GROUND, p.w, p.col, p.ck, p.f); break;
      case 'rv': if (p.x + 420 > camX && p.x < camX + this.VW + 20) drawRV(c, p.x, GROUND, p.o); break;
      case 'lamp': drawLamp(c, p.x, GROUND, p.h, p.on); break;
      case 'cactus': drawCactus(c, p.x, GROUND, p.h); break;
      case 'sign': c.save(); c.fillStyle = '#5a4a3a'; c.fillRect(p.x - 3, GROUND - 120, 6, 120); c.fillStyle = '#2a2a2a'; rrect(c, p.x - 90, GROUND - 170, 180, 56, 6); c.fill(); c.strokeStyle = p.col; c.lineWidth = 3; c.stroke(); c.fillStyle = p.col; c.font = 'bold 20px "Oswald", Impact, sans-serif'; c.textAlign = 'center'; c.fillText(p.text, p.x, GROUND - 134); c.textAlign = 'left'; c.restore(); break;
      case 'fn': p.fn(c, this, camX); break;
    }
  }
  drawSolid(c, s) {
    if (s.style === 'none') return;
    if (s.oneway) {
      if (s.style === 'table') { c.fillStyle = '#6a5a4a'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(s.x, s.y, s.w, 8); c.strokeRect(s.x, s.y, s.w, 8); c.fillRect(s.x + 6, s.y + 8, 6, GROUND - s.y - 8); c.fillRect(s.x + s.w - 12, s.y + 8, 6, GROUND - s.y - 8); return; }
      c.fillStyle = '#5a5e62'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(s.x, s.y, s.w, 10); c.strokeRect(s.x, s.y, s.w, 10);
      c.strokeStyle = '#d8b020'; c.lineWidth = 3; c.beginPath(); c.moveTo(s.x, s.y - 26); c.lineTo(s.x + s.w, s.y - 26); c.stroke();
      c.lineWidth = 2; for (let x = s.x + 4; x < s.x + s.w; x += 40) { c.beginPath(); c.moveTo(x, s.y); c.lineTo(x, s.y - 26); c.stroke(); }
      c.strokeStyle = '#3a3e42'; c.lineWidth = 4; for (let x = s.x + 20; x < s.x + s.w; x += 160) { c.beginPath(); c.moveTo(x, s.y + 10); c.lineTo(x, GROUND); c.stroke(); }
      return;
    }
    drawCrate(c, s.x, s.y, s.w, s.h, s.style);
  }
  drawPickup(c, k) {
    const bob = Math.sin(this.time * 4 + k.x) * 2; c.save(); c.translate(k.x, k.y + bob);
    c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,220,120,.15)'; c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over';
    if (k.kind === 'ammo') { c.fillStyle = '#4a5a2a'; c.strokeStyle = INK; c.lineWidth = 1.5; c.fillRect(-10, -7, 20, 13); c.strokeRect(-10, -7, 20, 13); c.fillStyle = '#e8d070'; c.font = 'bold 8px monospace'; c.fillText(AMMO_NAMES[k.type].replace('mm', ''), -9, 3); }
    else if (k.kind === 'cash') { c.fillStyle = '#5a8a3a'; c.strokeStyle = '#2a4a1a'; c.lineWidth = 1.5; c.fillRect(-11, -6, 22, 11); c.strokeRect(-11, -6, 22, 11); c.fillStyle = '#c8e0a0'; c.beginPath(); c.arc(0, -0.5, 3, 0, TAU); c.fill(); }
    else if (k.kind === 'med') { c.fillStyle = '#eee'; c.strokeStyle = INK; c.lineWidth = 1.5; c.fillRect(-10, -8, 20, 15); c.strokeRect(-10, -8, 20, 15); c.fillStyle = '#c0281c'; c.fillRect(-2, -6, 4, 11); c.fillRect(-6, -2, 12, 4); }
    else if (k.kind === 'gun') { c.scale(0.9, 0.9); c.translate(-10, 0); GUN_ART[WEAPONS[k.type].art](c, { magIn: true, gold: WEAPONS[k.type].gold }); }
    else if (k.kind === 'bang') { c.fillStyle = '#7fd8f0'; c.beginPath(); c.moveTo(0, -8); c.lineTo(6, 0); c.lineTo(0, 8); c.lineTo(-6, 0); c.closePath(); c.fill(); }
    c.restore();
  }

  // ---------- HUD ----------
  drawHUD(c) {
    const p = this.player, st = Game.state;
    // letterbox
    if (this.letterbox > 0.01) { const h = 70 * this.letterbox; c.fillStyle = '#000'; c.fillRect(0, 0, W, h); c.fillRect(0, H - h * 0.8, W, h); }
    // hurt vignette
    if (p && (this.hurtVignette > 0 || p.hp < p.maxHp * 0.35)) {
      const a = Math.max(this.hurtVignette, p.hp < p.maxHp * 0.35 ? 0.35 + Math.sin(this.time * 6) * 0.1 : 0);
      const g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85); g.addColorStop(0, 'rgba(120,0,0,0)'); g.addColorStop(1, `rgba(150,0,0,${a})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
    const showHud = p && !this.cinematic && this.letterbox < 0.5 && !this.def.noHud;
    if (showHud) {
      // health / armor
      c.save(); c.translate(24, H - 92);
      c.fillStyle = 'rgba(10,10,10,.6)'; rrect(c, 0, 0, 320, 72, 8); c.fill();
      drawPortrait(c, 8, 8, 56, LOOKS.jace, p.hp < 40 ? 'worried' : 'neutral');
      c.font = 'bold 13px "Oswald", Impact, sans-serif'; c.fillStyle = '#ddd'; c.fillText('JACE', 74, 22);
      c.fillStyle = '#300'; c.fillRect(74, 28, 230, 14); c.fillStyle = p.hp < 35 ? '#e03020' : '#c8302a'; c.fillRect(74, 28, 230 * clamp(p.hp / p.maxHp, 0, 1), 14);
      c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(74, 28, 230 * clamp(p.hp / p.maxHp, 0, 1), 4);
      c.fillStyle = '#123'; c.fillRect(74, 46, 230, 7); c.fillStyle = '#5ab0e0'; c.fillRect(74, 46, 230 * clamp(p.armor / 150, 0, 1), 7);
      c.font = '12px "Oswald", sans-serif'; c.fillStyle = '#ccc';
      c.fillText(`[G] Bang ×${st.bangs}   [V] Molotov ×${st.molotovs}   [H] Medkit ×${st.medkits}`, 74, 67);
      c.restore();
      // weapon panel
      const g = p.gun;
      if (g) {
        c.save(); c.translate(W - 324, H - 112);
        c.fillStyle = 'rgba(10,10,10,.6)'; rrect(c, 0, 0, 300, 92, 8); c.fill();
        c.save(); c.translate(70, 50); c.scale(2.1, 2.1); if (g.def.heavy || g.def.art === 'rifle' || g.def.art === 'shotgun') c.scale(0.75, 0.75); c.rotate(-g.tilt() * 0.6);
        GUN_ART[g.def.art](c, g.drawState()); c.restore();
        c.textAlign = 'right';
        c.font = '13px "Oswald", sans-serif'; c.fillStyle = '#ddd'; c.fillText(g.def.name.toUpperCase() + '  ·  ' + (p.gi + 1) + '/' + p.guns.length, 288, 19);
        c.font = 'bold 36px "Oswald", Impact, sans-serif'; const rs = '/ ' + p.reserve(g.def.ammo);
        c.save(); c.font = 'bold 18px "Oswald", Impact, sans-serif'; const rw = c.measureText(rs).width; c.restore();
        c.fillStyle = g.mag === 0 ? '#e04030' : g.mag <= g.def.mag * 0.25 ? '#f0b040' : '#fff'; c.fillText(g.mag, 282 - rw, 60);
        c.font = 'bold 18px "Oswald", Impact, sans-serif'; c.fillStyle = '#aaa'; c.fillText(rs, 288, 60);
        // round pips
        const n = Math.min(g.def.mag, 32), pw = Math.min(6, 150 / n);
        for (let i = 0; i < n; i++) { c.fillStyle = i < (g.mag / g.def.mag) * n ? '#e8c060' : 'rgba(255,255,255,.15)'; c.fillRect(288 - (i + 1) * (pw + 1.5), 68, pw, 6); }
        if (g.reload) { c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(140, 79, 148, 4); c.fillStyle = '#ffd060'; c.fillRect(140, 79, 148 * g.progress(), 4); c.font = 'bold 11px "Oswald", sans-serif'; c.fillStyle = '#ffd060'; c.fillText('RELOADING', 132, 86); }
        else if (g.mag === 0) { c.font = 'bold 12px "Oswald", sans-serif'; c.fillStyle = '#ff6040'; c.fillText(p.reserve(g.def.ammo) > 0 ? 'PRESS R TO RELOAD' : 'NO AMMO', 288, 88); }
        c.textAlign = 'left'; c.restore();
      }
      // money
      c.font = 'bold 22px "Oswald", Impact, sans-serif'; c.textAlign = 'right'; c.fillStyle = '#000'; c.fillText(fmtMoney(st.money), W - 22, 38); c.fillStyle = '#8fe07a'; c.fillText(fmtMoney(st.money), W - 24, 36); c.textAlign = 'left';
      // objective
      if (this.objective) { c.font = 'bold 15px "Oswald", Impact, sans-serif'; const w = c.measureText(this.objective).width; c.fillStyle = 'rgba(0,0,0,.55)'; rrect(c, 18, 18, w + 44, 30, 6); c.fill(); c.fillStyle = '#ffd060'; c.fillRect(28, 28, 10, 10); c.fillStyle = '#fff'; c.fillText(this.objective, 48, 38); }
      // enemies left
      const left = this.enemiesAlive(); if (left > 0 && this.def.showCount !== false) { c.font = '13px "Oswald", sans-serif'; c.fillStyle = '#e8a090'; c.fillText('Hostiles: ' + left, 22, 68); }
      // walter health
      if (this.walter) { const w = this.walter; c.save(); c.translate(24, H - 132); c.fillStyle = 'rgba(10,10,10,.55)'; rrect(c, 0, 0, 200, 32, 6); c.fill(); drawPortrait(c, 3, 3, 26, LOOKS.walter); c.fillStyle = '#bbb'; c.font = '11px "Oswald", sans-serif'; c.fillText(w.downed > 0 ? 'WALTER — DOWN (' + Math.ceil(w.downed) + ')' : 'WALTER', 36, 13); c.fillStyle = '#222'; c.fillRect(36, 18, 154, 6); c.fillStyle = w.downed > 0 ? '#c84' : '#7ab060'; c.fillRect(36, 18, 154 * clamp(w.hp / w.maxHp, 0, 1), 6); c.restore(); }
    }
    // boss bar
    const boss = this.bossId && this.named[this.bossId];
    if (boss && boss.alive && !this.cinematic) {
      const bw = 560, x = (W - bw) / 2; c.fillStyle = 'rgba(0,0,0,.6)'; rrect(c, x - 10, 56, bw + 20, 44, 6); c.fill();
      c.font = 'bold 15px "Oswald", Impact, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#f0d8a0'; c.fillText((boss.name || boss.look.name || 'BOSS').toUpperCase(), W / 2, 74); c.textAlign = 'left';
      c.fillStyle = '#300'; c.fillRect(x, 80, bw, 12); c.fillStyle = '#c0281c'; c.fillRect(x, 80, bw * clamp(boss.hp / boss.maxHp, 0, 1), 12);
      if (boss.armor > 0) { c.fillStyle = '#5ab0e0'; c.fillRect(x, 92, bw * clamp(boss.armor / boss.maxArmor, 0, 1), 4); }
    }
    // banter (radio lines)
    let by = 110;
    for (const b of this.banters) {
      const look = b.who ? LOOKS[b.who] : null; c.globalAlpha = Math.min(1, b.life * 2);
      c.font = '16px "Oswald", sans-serif'; const w = c.measureText(b.text).width + (look ? 70 : 30);
      const x = (W - w) / 2, y = H - 190 - (this.banters.length - 1 - this.banters.indexOf(b)) * 54;
      c.fillStyle = 'rgba(0,0,0,.65)'; rrect(c, x, y, w, 46, 8); c.fill();
      if (look) { drawPortrait(c, x + 6, y + 5, 36, look); c.fillStyle = '#ffd060'; c.font = 'bold 12px "Oswald", sans-serif'; c.fillText(look.name.toUpperCase(), x + 52, y + 18); c.fillStyle = '#fff'; c.font = '16px "Oswald", sans-serif'; c.fillText(b.text, x + 52, y + 37); }
      else { c.fillStyle = '#fff'; c.fillText(b.text, x + 15, y + 29); }
      c.globalAlpha = 1; by += 50;
    }
    // toasts
    c.textAlign = 'center';
    const ty = (boss && boss.alive) || this.rv ? 140 : 96;
    this.toasts.forEach((t, i) => { c.globalAlpha = Math.min(1, t.life * 2); c.font = 'bold 18px "Oswald", Impact, sans-serif'; c.fillStyle = '#000'; c.fillText(t.t, W / 2 + 1, ty + i * 26 + 1); c.fillStyle = '#ffe9a8'; c.fillText(t.t, W / 2, ty + i * 26); });
    c.globalAlpha = 1; c.textAlign = 'left';
    // chapter title card
    if (this.title) {
      const t = this.title.t, a = t < 0.6 ? t / 0.6 : t > 3.2 ? Math.max(0, 1 - (t - 3.2) / 0.8) : 1;
      c.globalAlpha = a; c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, H / 2 - 70, W, 140);
      c.textAlign = 'center'; c.font = '18px "Oswald", sans-serif'; c.fillStyle = '#9fd88a'; c.fillText(this.title.sub, W / 2, H / 2 - 28);
      c.font = 'bold 54px "Oswald", Impact, sans-serif'; c.fillStyle = '#fff'; c.fillText(this.title.text, W / 2, H / 2 + 28); c.textAlign = 'left'; c.globalAlpha = 1;
    }
    // dialogue
    if (this.dialog) this.dialog.draw(c);
    // crosshair
    if (showHud && p.alive) drawCrosshair(c, p, this);
    if (this.fade > 0.001) { c.fillStyle = `rgba(0,0,0,${this.fade})`; c.fillRect(0, 0, W, H); }
  }
}

function drawCrosshair(c, p, lv) {
  const g = p.gun, x = Input.mx, y = Input.my;
  c.save(); c.translate(x, y);
  const spread = g && !g.melee ? 8 + g.def.spread * 160 + p.kick * 30 + (p.onGround ? 0 : 8) : 8;
  c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 4;
  const lines = () => { c.beginPath(); c.moveTo(-spread - 9, 0); c.lineTo(-spread, 0); c.moveTo(spread, 0); c.lineTo(spread + 9, 0); c.moveTo(0, -spread - 9); c.lineTo(0, -spread); c.moveTo(0, spread); c.lineTo(0, spread + 9); c.stroke(); };
  lines(); c.strokeStyle = '#fff'; c.lineWidth = 2; lines();
  c.fillStyle = '#fff'; c.fillRect(-1, -1, 2, 2);
  if (g && g.reload) { c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, spread + 16, 0, TAU); c.stroke(); c.strokeStyle = '#ffd060'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, spread + 16, -PI / 2, -PI / 2 + TAU * g.progress()); c.stroke(); }
  if (lv.hitMarker > 0) { c.strokeStyle = lv.hitHead ? '#ff3020' : '#fff'; c.lineWidth = 2.5; const s = 7, o = 5; c.beginPath(); c.moveTo(-o - s, -o - s); c.lineTo(-o, -o); c.moveTo(o + s, -o - s); c.lineTo(o, -o); c.moveTo(-o - s, o + s); c.lineTo(-o, o); c.moveTo(o + s, o + s); c.lineTo(o, o); c.stroke(); }
  c.restore();
}

// ---------- dialogue ----------
class Dialogue {
  constructor(lines) { this.lines = lines; this.i = 0; this.chars = 0; this.finished = false; this.t = 0; }
  get line() { return this.lines[this.i]; }
  update(dt) {
    if (this.finished) return;
    const L = this.line, full = L[1].length;
    const prev = Math.floor(this.chars);
    this.chars = Math.min(full, this.chars + dt * 52);
    if (Math.floor(this.chars) > prev && Math.floor(this.chars) % 3 === 0) Audio.play('type');
    if (Input.hit('Space') || Input.mclick || Input.hit('Enter') || Input.hit('KeyE')) {
      if (this.chars < full) this.chars = full;
      else { this.i++; this.chars = 0; Audio.play('ui', 0, 0.4); if (this.i >= this.lines.length) this.finished = true; }
    }
    if (Input.hit('Escape') && false) this.finished = true;
  }
  draw(c) {
    if (this.finished) return;
    const [who, text, expr] = this.line, look = LOOKS[who];
    const x = 90, y = 82, w = W - 180, h = 150;
    c.fillStyle = 'rgba(8,8,10,.86)'; rrect(c, x, y, w, h, 12); c.fill(); c.strokeStyle = 'rgba(255,220,140,.35)'; c.lineWidth = 2; c.stroke();
    let tx = x + 26;
    if (look) { drawPortrait(c, x + 14, y + 12, 126, look, expr || 'neutral'); tx = x + 160; }
    c.font = 'bold 18px "Oswald", Impact, sans-serif'; c.fillStyle = who === 'walter' || who === 'walterHat' ? '#9fd88a' : who === 'jace' ? '#ffb070' : '#ffd060';
    c.fillText(look ? look.name.toUpperCase() : (who === 'narrator' ? '' : who.toUpperCase()), tx, y + 34);
    c.font = '19px "Oswald", sans-serif'; c.fillStyle = '#f2ece0';
    wrapText(c, text.slice(0, Math.floor(this.chars)), tx, y + 66, w - (tx - x) - 30, 26);
    if (this.chars >= text.length) { c.fillStyle = `rgba(255,220,140,${0.5 + Math.sin(performance.now() / 200) * 0.4})`; c.font = '13px "Oswald", sans-serif'; c.textAlign = 'right'; c.fillText('SPACE ▸', x + w - 18, y + h - 14); c.textAlign = 'left'; }
  }
}
function wrapText(c, text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '', yy = y;
  for (const w of words) { const test = line ? line + ' ' + w : w; if (c.measureText(test).width > maxW && line) { c.fillText(line, x, yy); line = w; yy += lh; } else line = test; }
  if (line) c.fillText(line, x, yy);
  return yy;
}
