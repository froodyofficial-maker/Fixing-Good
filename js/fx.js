'use strict';
// ============================================================
//  FIXING GOOD - effects: particles, blood, decals, casings, lights
// ============================================================
class FX {
  constructor(lv) {
    this.lv = lv; this.p = []; this.bits = []; this.lights = [];
    this.decalCanvas = lv.noDecals ? null : makeCanvas(Math.min(lv.width, 12000), H);
    this.dc = this.decalCanvas ? this.decalCanvas.getContext('2d') : null;
  }
  gore() { return Settings.gore; }
  add(o) { if (this.p.length < 1600) this.p.push(o); return o; }
  light(x, y, r, col, a = 1, life = 0) { this.lights.push({ x, y, r, col, a, life, max: life }); }

  blood(x, y, dx, dy, n = 14, spread = 0.7, force = 1) {
    const g = this.gore();
    if (g === 0) { for (let i = 0; i < n / 2; i++) this.add({ t: 'dust', x, y, vx: rand(-80, 80), vy: rand(-120, 0), life: 0.5, max: 0.5, s: rand(3, 6) }); return; }
    n = Math.round(n * (g === 1 ? 0.45 : 1));
    const base = Math.atan2(dy, dx);
    for (let i = 0; i < n; i++) {
      const a = base + rand(-spread, spread), sp = rand(80, 520) * force;
      this.add({ t: 'blood', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(0, 120), life: rand(0.6, 1.4), max: 1.4, s: rand(1.5, 3.8) });
    }
    // mist
    for (let i = 0; i < n / 3; i++) this.add({ t: 'mist', x, y, vx: dx * rand(20, 80) + rand(-30, 30), vy: dy * rand(20, 80) + rand(-30, 10), life: rand(0.25, 0.5), max: 0.5, s: rand(6, 12) });
  }
  gib(x, y, vx, vy, n = 6) {
    if (this.gore() < 2) return this.blood(x, y, vx, vy, 20, PI);
    for (let i = 0; i < n; i++) this.add({ t: 'gib', x, y, vx: vx * rand(0.3, 1) + rand(-250, 250), vy: vy * rand(0.3, 1) - rand(150, 450), life: 6, max: 6, s: rand(3, 7), rot: rand(TAU), vr: rand(-12, 12) });
    this.blood(x, y, vx, vy - 200, 30, PI, 1.3);
  }
  spark(x, y, n = 6, dx = 0, dy = -1, col) {
    const base = Math.atan2(dy, dx);
    for (let i = 0; i < n; i++) { const a = base + rand(-1.2, 1.2), sp = rand(150, 500); this.add({ t: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.1, 0.3), max: 0.3, col: col || '#ffd27a' }); }
  }
  dust(x, y, n = 6, col = 'rgba(200,170,120,') {
    for (let i = 0; i < n; i++) this.add({ t: 'dust', x: x + rand(-8, 8), y, vx: rand(-60, 60), vy: rand(-90, -10), life: rand(0.4, 0.8), max: 0.8, s: rand(4, 9), col });
  }
  debris(x, y, n = 6, col = '#8a6a3a') { for (let i = 0; i < n; i++) this.add({ t: 'chip', x, y, vx: rand(-220, 220), vy: rand(-380, -60), life: rand(0.8, 1.5), max: 1.5, s: rand(2, 5), col, rot: rand(TAU), vr: rand(-15, 15) }); }
  smoke(x, y, n = 1, s = 14, dark = 0.4, vy = -40) { for (let i = 0; i < n; i++) this.add({ t: 'smoke', x: x + rand(-6, 6), y: y + rand(-6, 6), vx: rand(-20, 20), vy: vy * rand(0.6, 1.4), life: rand(1, 2.2), max: 2.2, s: s * rand(0.7, 1.3), dark }); }
  flame(x, y, n = 1, s = 10, spread = 6) { for (let i = 0; i < n; i++) this.add({ t: 'fire', x: x + rand(-spread, spread), y: y + rand(-4, 4), vx: rand(-25, 25), vy: rand(-140, -60), life: rand(0.3, 0.7), max: 0.7, s: s * rand(0.6, 1.3) }); }
  muzzle(x, y, ang, big = 1, fire) {
    this.add({ t: 'flash', x, y, ang, life: 0.05, max: 0.05, s: 14 * big, fire });
    this.light(x, y, 200 * big, fire ? '255,140,40' : '255,200,120', 0.95, 0.06);
    for (let i = 0; i < 3; i++) this.add({ t: 'smoke', x: x + Math.cos(ang) * 6, y: y + Math.sin(ang) * 6, vx: Math.cos(ang) * rand(30, 90), vy: Math.sin(ang) * rand(30, 90) - 20, life: rand(0.4, 0.8), max: 0.8, s: rand(5, 9), dark: 0.15 });
  }
  casing([x, y], f, kind = 'brass', drop = false) {
    const o = { t: 'casing', kind, x, y, vx: drop ? rand(-40, 40) : -f * rand(80, 160), vy: drop ? rand(-40, 30) : rand(-320, -200), rot: rand(TAU), vr: rand(-25, 25), life: 25, max: 25, bounces: 0 };
    this.bits.push(o); if (this.bits.length > 260) this.bits.shift();
  }
  droppedMag([x, y], owner, kind) {
    const o = { t: 'mag', kind, x, y, vx: owner.vx * 0.3 + rand(-20, 20), vy: rand(20, 80), rot: owner.aimAng || 0, vr: rand(-6, 6) * owner.facing, life: 30, max: 30, bounces: 0 };
    this.bits.push(o); if (this.bits.length > 260) this.bits.shift();
  }
  // ---- decals ----
  decalBlood(x, y, r = 6, ground = true) {
    if (!this.dc || this.gore() === 0) return;
    const c = this.dc;
    for (let i = 0; i < 3; i++) {
      c.fillStyle = `rgba(${randi(90, 130)},${randi(0, 12)},${randi(0, 10)},${rand(0.5, 0.85)})`;
      c.beginPath(); c.ellipse(x + rand(-r, r), y + (ground ? rand(-1, 2) : rand(-r, r)), r * rand(0.4, 1.1), ground ? r * rand(0.2, 0.35) : r * rand(0.4, 1), 0, 0, TAU); c.fill();
    }
  }
  decalHole(x, y) { if (!this.dc) return; const c = this.dc; c.fillStyle = 'rgba(0,0,0,.75)'; c.beginPath(); c.arc(x, y, 2.4, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 3.5, 0, TAU); c.stroke(); }
  decalScorch(x, y, r) { if (!this.dc) return; const c = this.dc; const g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, 'rgba(10,8,6,.85)'); g.addColorStop(1, 'rgba(10,8,6,0)'); c.fillStyle = g; c.save(); c.translate(x, y); c.scale(1, 0.12); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.restore(); }
  decalSpray(x, y, dx, dy) { // exit-wound spray on a wall behind the target
    if (!this.dc || this.gore() < 2) return; const c = this.dc;
    for (let i = 0; i < 14; i++) { const d = rand(0, 26); c.fillStyle = `rgba(${randi(100, 140)},0,0,${rand(0.4, 0.8)})`; c.beginPath(); c.arc(x + dx * d + rand(-6, 6), y + dy * d + rand(-6, 6), rand(1, 3.5), 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(110,0,0,.5)'; c.fillRect(x - 1, y, 2, rand(10, 30));
  }

  update(dt) {
    const lv = this.lv, G = 1500;
    for (let i = this.p.length - 1; i >= 0; i--) {
      const o = this.p[i]; o.life -= dt;
      if (o.life <= 0) { this.p.splice(i, 1); continue; }
      switch (o.t) {
        case 'blood': case 'gib': case 'chip': {
          o.vy += G * dt; o.x += o.vx * dt; o.y += o.vy * dt; if (o.rot !== undefined) o.rot += o.vr * dt;
          const s = lv.solidAt(o.x, o.y);
          if (o.y >= GROUND || s) {
            if (o.t === 'blood') { this.decalBlood(o.x, s ? o.y : GROUND + rand(0, 6), o.s * 1.6, !s || o.y - s.y < 6); this.p.splice(i, 1); }
            else if (o.t === 'gib') { if (o.y >= GROUND) o.y = GROUND - 2; else o.y = s.y - 2; o.vy *= -0.25; o.vx *= 0.6; o.vr *= 0.5; if (Math.abs(o.vy) < 40) { o.vy = 0; o.vx *= 0.8; } if (!o.painted && Math.random() < 0.3) { this.decalBlood(o.x, o.y + 2, 6); } }
            else { o.y = s ? s.y - 1 : GROUND - 1; o.vy *= -0.3; o.vx *= 0.5; }
          }
          break;
        }
        case 'spark': o.vy += G * 0.5 * dt; o.x += o.vx * dt; o.y += o.vy * dt; break;
        case 'mist': o.x += o.vx * dt; o.y += o.vy * dt; o.vx *= 0.9; o.vy *= 0.9; break;
        case 'dust': o.x += o.vx * dt; o.y += o.vy * dt; o.vx *= 0.95; o.vy *= 0.95; break;
        case 'smoke': o.x += o.vx * dt; o.y += o.vy * dt; o.vx *= 0.98; o.s += dt * 14; break;
        case 'fire': o.x += o.vx * dt; o.y += o.vy * dt; o.s *= 1 - dt * 1.4; if (Math.random() < 0.05) this.smoke(o.x, o.y, 1, 8, 0.6); break;
        case 'flash': break;
      }
    }
    for (const o of this.bits) {
      if (o.rest) continue;
      o.vy += G * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt;
      const s = lv.solidAt(o.x, o.y), floor = s ? s.y : GROUND;
      if (o.y >= floor - 2 && (s || o.y >= GROUND - 2)) {
        o.y = floor - 2; o.vy *= -0.4; o.vx *= 0.55; o.vr *= 0.5; o.bounces++;
        if (o.bounces < 3 && Math.abs(o.vy) > 30) Audio.play(o.t === 'mag' ? 'clank' : 'tink', 0, o.t === 'mag' ? 0.5 : 1);
        if (Math.abs(o.vy) < 40) { o.vy = 0; o.rest = true; o.rot = Math.round(o.rot / PI) * PI; }
      }
    }
    for (let i = this.lights.length - 1; i >= 0; i--) { const L = this.lights[i]; if (L.max > 0) { L.life -= dt; if (L.life <= 0) this.lights.splice(i, 1); } }
  }
  draw(c, back = false) {
    // persistent bits first
    for (const o of this.bits) {
      c.save(); c.translate(o.x, o.y); c.rotate(o.rot);
      if (o.t === 'mag') drawMag(c, o.kind);
      else if (o.kind === 'shell') { c.fillStyle = '#c02a1c'; c.fillRect(-4, -2, 6, 4); c.fillStyle = '#d8b040'; c.fillRect(2, -2, 2.5, 4); }
      else { c.fillStyle = '#d8b040'; c.fillRect(-2.5, -1, 5, 2.2); }
      c.restore();
    }
    for (const o of this.p) {
      const k = o.life / o.max;
      switch (o.t) {
        case 'blood': c.fillStyle = '#9a0c0c'; c.fillRect(o.x - o.s / 2, o.y - o.s / 2, o.s, o.s); break;
        case 'mist': c.fillStyle = `rgba(150,10,10,${0.35 * k})`; c.beginPath(); c.arc(o.x, o.y, o.s * (1.6 - k), 0, TAU); c.fill(); break;
        case 'gib': c.save(); c.translate(o.x, o.y); c.rotate(o.rot); c.fillStyle = '#8a1a14'; c.strokeStyle = '#4a0606'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, 0, o.s, o.s * 0.7, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#d8c0b0'; c.fillRect(-1, -1, o.s * 0.6, 2); c.restore(); break;
        case 'chip': c.save(); c.translate(o.x, o.y); c.rotate(o.rot); c.fillStyle = o.col; c.fillRect(-o.s, -o.s / 2, o.s * 2, o.s); c.restore(); break;
        case 'spark': c.strokeStyle = o.col; c.globalAlpha = k * 1.5; c.lineWidth = 2; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x - o.vx * 0.02, o.y - o.vy * 0.02); c.stroke(); c.globalAlpha = 1; break;
        case 'dust': c.fillStyle = (o.col || 'rgba(200,170,120,') + (0.4 * k) + ')'; c.beginPath(); c.arc(o.x, o.y, o.s * (1.5 - k * 0.5), 0, TAU); c.fill(); break;
        case 'smoke': { const d = o.dark; const v = Math.round(lerp(200, 40, d)); c.fillStyle = `rgba(${v},${v},${v},${0.32 * k})`; c.beginPath(); c.arc(o.x, o.y, o.s, 0, TAU); c.fill(); break; }
        case 'fire': c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,${Math.round(90 + 140 * k)},${Math.round(30 * k)},${0.75 * k})`; c.beginPath(); c.arc(o.x, o.y, Math.max(0.5, o.s), 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over'; break;
        case 'flash': {
          c.save(); c.translate(o.x, o.y); c.rotate(o.ang); c.globalCompositeOperation = 'lighter';
          c.fillStyle = o.fire ? 'rgba(255,120,30,.95)' : 'rgba(255,220,120,.95)'; c.beginPath(); c.moveTo(0, -o.s * 0.35); c.lineTo(o.s * 2.4, 0); c.lineTo(0, o.s * 0.35); c.closePath(); c.fill();
          c.beginPath(); c.moveTo(o.s * 0.3, 0); c.lineTo(o.s * 0.9, -o.s); c.lineTo(o.s * 1.1, 0); c.lineTo(o.s * 0.9, o.s); c.closePath(); c.fill();
          c.fillStyle = 'rgba(255,255,230,1)'; c.beginPath(); c.arc(o.s * 0.3, 0, o.s * 0.45, 0, TAU); c.fill();
          c.globalCompositeOperation = 'source-over'; c.restore(); break;
        }
      }
    }
  }
  // darkness + light holes
  drawLighting(c, camX, dark, statics, Z = 1, OFFY = 0) {
    if (!this._lc) { this._lc = makeCanvas(W / 2, H / 2); this._lx = this._lc.getContext('2d'); }
    const L = this._lx, all = statics.concat(this.lights);
    if (dark > 0.01) {
      L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, W / 2, H / 2);
      L.fillStyle = `rgba(4,6,18,${dark})`; L.fillRect(0, 0, W / 2, H / 2);
      L.globalCompositeOperation = 'destination-out';
      for (const l of all) {
        const x = (l.x - camX) * Z / 2, y = (l.y * Z - OFFY) / 2, r = l.r * Z / 2; if (x < -r || x > W / 2 + r) continue;
        const a = l.max > 0 ? l.a * (l.life / l.max) : l.a * (l.flicker ? rand(0.85, 1) : 1);
        if (l.cone) { // flashlight cone
          L.save(); L.translate(x, y); L.rotate(l.cone); const g = L.createRadialGradient(0, 0, 4, 0, 0, r); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); L.fillStyle = g; L.beginPath(); L.moveTo(0, 0); L.arc(0, 0, r, -0.35, 0.35); L.closePath(); L.fill(); L.restore();
          continue;
        }
        const g = L.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.5, `rgba(0,0,0,${a * 0.6})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        L.fillStyle = g; L.fillRect(x - r, y - r, r * 2, r * 2);
      }
      c.drawImage(this._lc, 0, 0, W, H);
    }
    // colored glow
    c.globalCompositeOperation = 'lighter';
    for (const l of all) {
      const x = (l.x - camX) * Z, y = l.y * Z - OFFY, r = l.r * Z; if (x < -r || x > W + r || !l.col) continue;
      const a = (l.max > 0 ? l.a * (l.life / l.max) : l.a) * (dark > 0.3 ? 0.35 : 0.18);
      if (l.cone) continue;
      const g = c.createRadialGradient(x, y, 0, x, y, r * 0.7); g.addColorStop(0, `rgba(${l.col},${a})`); g.addColorStop(1, `rgba(${l.col},0)`);
      c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    c.globalCompositeOperation = 'source-over';
  }
}
