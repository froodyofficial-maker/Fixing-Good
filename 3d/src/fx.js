// ============================================================
//  FIXING GOOD 3D - effects: particles, decals, tracers, debris, lights
// ============================================================
import { THREE, V3, scene, col, magModel, Tex } from './gfx.js';
import { PI, TAU, clamp, lerp, rand, choose, makeCanvas, Settings, Audio, G } from './core.js';

const pVS = `attribute float size; attribute vec4 rgba; varying vec4 vC; void main(){ vC = rgba; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * (420.0 / -mv.z); gl_Position = projectionMatrix * mv; }`;
const pFS = `varying vec4 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard; float a = smoothstep(0.5, 0.15, r); gl_FragColor = vec4(vC.rgb, vC.a * a); }`;
class PSys {
  constructor(n, additive) {
    this.n = n; this.list = [];
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 3); this.size = new Float32Array(n); this.rgba = new Float32Array(n * 4);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('size', new THREE.BufferAttribute(this.size, 1)); g.setAttribute('rgba', new THREE.BufferAttribute(this.rgba, 4));
    this.mesh = new THREE.Points(g, new THREE.ShaderMaterial({ vertexShader: pVS, fragmentShader: pFS, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = additive ? 5 : 4; scene.add(this.mesh);
  }
  add(p) { if (this.list.length < this.n) this.list.push(p); return p; }
  sync() {
    const L = this.list, n = L.length;
    for (let i = 0; i < n; i++) { const p = L[i], k = p.life / p.max; this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z; this.size[i] = p.s * (p.grow ? (1 + (1 - k) * p.grow) : 1); const c = p.c; this.rgba[i * 4] = c[0]; this.rgba[i * 4 + 1] = c[1]; this.rgba[i * 4 + 2] = c[2]; this.rgba[i * 4 + 3] = (p.a || 1) * (p.fade === false ? 1 : Math.min(1, k * 2)); }
    const g = this.mesh.geometry; g.setDrawRange(0, n); for (const k of ['position', 'size', 'rgba']) g.attributes[k].needsUpdate = true;
  }
}
function splatTex() {
  const cv = makeCanvas(128, 128), c = cv.getContext('2d');
  for (let i = 0; i < 14; i++) { const a = Math.random() * TAU, d = Math.random() * 40, r = 8 + Math.random() * 22; c.fillStyle = `rgba(${110 + Math.random() * 30 | 0},0,0,${0.55 + Math.random() * 0.4})`; c.beginPath(); c.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, r, 0, TAU); c.fill(); }
  for (let i = 0; i < 20; i++) { const a = Math.random() * TAU, d = 30 + Math.random() * 30; c.fillStyle = 'rgba(120,0,0,.7)'; c.beginPath(); c.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 2 + Math.random() * 4, 0, TAU); c.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function scorchTex() { const cv = makeCanvas(128, 128), c = cv.getContext('2d'); const g = c.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(10,8,6,.9)'); g.addColorStop(0.6, 'rgba(20,14,10,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(cv); }
class Decals {
  constructor(n, tex, opts = {}) {
    this.n = n; this.i = 0;
    this.mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, roughness: opts.rough ?? 0.3, color: opts.color || 0xffffff }), n);
    this.mesh.count = 0; this.mesh.receiveShadow = true; this.mesh.frustumCulled = false; this.mesh.renderOrder = 2; scene.add(this.mesh);
    this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.s = V3();
  }
  add(p, normal, size, rot = Math.random() * TAU) {
    this.q.setFromUnitVectors(V3(0, 0, 1), normal); const qr = new THREE.Quaternion().setFromAxisAngle(V3(0, 0, 1), rot); this.q.multiply(qr);
    this.m.compose(p.clone().addScaledVector(normal, 0.012 + (this.i % 50) * 0.0004), this.q, this.s.set(size, size, 1));
    this.mesh.setMatrixAt(this.i % this.n, this.m); this.i++; this.mesh.count = Math.min(this.n, this.i); this.mesh.instanceMatrix.needsUpdate = true;
  }
}
export class FX {
  constructor(lv) {
    this.lv = lv; this.norm = new PSys(2500, false); this.add_ = new PSys(2000, true); this.bits = []; this.tracers = [];
    this.bloodD = new Decals(500, splatTex()); this.holes = new Decals(300, (() => { const cv = makeCanvas(32, 32), c = cv.getContext('2d'); c.fillStyle = 'rgba(0,0,0,.85)'; c.beginPath(); c.arc(16, 16, 6, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 2; c.beginPath(); c.arc(16, 16, 9, 0, TAU); c.stroke(); return new THREE.CanvasTexture(cv); })());
    this.scorch = new Decals(60, scorchTex(), { rough: 1 });
    this.lights = []; for (let i = 0; i < 6; i++) { const l = new THREE.PointLight(0xffc070, 0, 12, 2); l.userData.life = 0; scene.add(l); this.lights.push(l); }
    const tg = new THREE.BoxGeometry(0.025, 0.025, 1); tg.translate(0, 0, -0.5);
    this.tracerMat = new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    this.tracerMatEnemy = new THREE.MeshBasicMaterial({ color: 0xff9a50, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    this.tracerMatFire = new THREE.MeshBasicMaterial({ color: 0xff7020, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    this.tg = tg;
    const fg = new THREE.PlaneGeometry(0.5, 0.5); this.flashMat = new THREE.MeshBasicMaterial({ map: (() => { const cv = makeCanvas(64, 64), c = cv.getContext('2d'); const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(0.25, 'rgba(255,200,90,.9)'); g.addColorStop(1, 'rgba(255,120,20,0)'); c.fillStyle = g; c.beginPath(); for (let i = 0; i < 12; i++) { const a = i * TAU / 12, r = i % 2 ? 12 : 32; c.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } c.fill(); return new THREE.CanvasTexture(cv); })(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.flashes = []; this.fg = fg;
  }
  gore() { return Settings.gore; }
  light(p, color, intensity, life, dist = 12) {
    let l = this.lights.find(x => x.userData.life <= 0) || this.lights.reduce((a, b) => a.userData.life < b.userData.life ? a : b);
    l.position.copy(p); l.color.set(color); l.intensity = intensity; l.distance = dist; l.userData.life = life; l.userData.max = life; l.userData.i0 = intensity;
  }
  blood(p, dir, n = 14, force = 1) {
    if (this.gore() === 0) { for (let i = 0; i < n / 2; i++) this.norm.add({ x: p.x, y: p.y, z: p.z, vx: rand(-1, 1), vy: rand(0, 2), vz: rand(-1, 1), life: 0.5, max: 0.5, s: 0.12, c: [0.7, 0.65, 0.55], a: 0.5, grow: 1, t: 'dust' }); return; }
    n = Math.round(n * (this.gore() === 1 ? 0.45 : 1));
    for (let i = 0; i < n; i++) { const sp = rand(1, 6) * force; this.norm.add({ x: p.x, y: p.y, z: p.z, vx: dir.x * sp + rand(-1.5, 1.5), vy: dir.y * sp + rand(-0.5, 2.5), vz: dir.z * sp + rand(-1.5, 1.5), life: rand(0.6, 1.3), max: 1.3, s: rand(0.035, 0.07), c: [0.55, 0.02, 0.02], t: 'blood', fade: false }); }
    for (let i = 0; i < n / 3; i++) this.norm.add({ x: p.x, y: p.y, z: p.z, vx: dir.x * rand(0.3, 1) + rand(-0.4, 0.4), vy: rand(-0.2, 0.4), vz: dir.z * rand(0.3, 1) + rand(-0.4, 0.4), life: rand(0.25, 0.5), max: 0.5, s: rand(0.18, 0.32), c: [0.6, 0.04, 0.04], a: 0.45, grow: 1.4, t: 'mist' });
  }
  gib(p, dir, n = 6) {
    if (this.gore() < 2) return this.blood(p, dir, 20, 1.3);
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.04, 0.08), 0), col('gib', 0x8a1a14, { roughness: 0.4 })); m.castShadow = true; scene.add(m); this.bits.push({ mesh: m, p: p.clone(), v: V3(dir.x * rand(2, 6) + rand(-3, 3), rand(3, 7), dir.z * rand(2, 6) + rand(-3, 3)), w: V3(rand(-10, 10), rand(-10, 10), rand(-10, 10)), life: 20, kind: 'gib', r: 0.05 }); }
    this.blood(p, V3(0, 1, 0), 30, 1.4);
  }
  spark(p, n = 6, col_ = [1, 0.85, 0.5]) { for (let i = 0; i < n; i++) this.add_.add({ x: p.x, y: p.y, z: p.z, vx: rand(-4, 4), vy: rand(0, 5), vz: rand(-4, 4), life: rand(0.1, 0.3), max: 0.3, s: 0.05, c: col_, t: 'spark' }); }
  dust(p, n = 6) { for (let i = 0; i < n; i++) this.norm.add({ x: p.x + rand(-0.2, 0.2), y: p.y + 0.05, z: p.z + rand(-0.2, 0.2), vx: rand(-1, 1), vy: rand(0.3, 1.2), vz: rand(-1, 1), life: rand(0.4, 0.8), max: 0.8, s: rand(0.2, 0.4), c: [0.78, 0.66, 0.5], a: 0.4, grow: 1.5, t: 'dust' }); }
  debris(p, n = 6, c = [0.55, 0.4, 0.22]) { for (let i = 0; i < n; i++) this.norm.add({ x: p.x, y: p.y, z: p.z, vx: rand(-4, 4), vy: rand(1, 6), vz: rand(-4, 4), life: rand(0.8, 1.5), max: 1.5, s: rand(0.04, 0.09), c, t: 'chip', fade: false }); }
  smoke(p, n = 1, s = 0.6, dark = 0.4, vy = 1) { for (let i = 0; i < n; i++) { const v = lerp(0.8, 0.15, dark); this.norm.add({ x: p.x + rand(-0.2, 0.2), y: p.y, z: p.z + rand(-0.2, 0.2), vx: rand(-0.4, 0.4), vy: vy * rand(0.6, 1.4), vz: rand(-0.4, 0.4), life: rand(1, 2.2), max: 2.2, s: s * rand(0.7, 1.3), c: [v, v, v], a: 0.35, grow: 2.2, t: 'smoke' }); } }
  flame(p, n = 1, s = 0.35, spread = 0.2) { for (let i = 0; i < n; i++) this.add_.add({ x: p.x + rand(-spread, spread), y: p.y, z: p.z + rand(-spread, spread), vx: rand(-0.3, 0.3), vy: rand(1, 2.5), vz: rand(-0.3, 0.3), life: rand(0.3, 0.7), max: 0.7, s: s * rand(0.6, 1.3), c: [1, rand(0.35, 0.7), 0.1], a: 0.85, t: 'fire', shrink: true }); }
  muzzle(p, dir, big = 1, fire = false) {
    const m = new THREE.Mesh(this.fg, this.flashMat); m.position.copy(p); m.lookAt(p.clone().add(dir)); m.scale.setScalar(big * rand(0.8, 1.2)); m.rotation.z = rand(TAU); scene.add(m);
    const m2 = new THREE.Mesh(this.fg, this.flashMat); m2.position.copy(p).addScaledVector(dir, 0.12 * big); m2.quaternion.setFromUnitVectors(V3(0, 0, 1), V3(0, 1, 0)); m2.lookAt(p.clone().add(V3(0, 1, 0))); m2.rotateY(Math.atan2(dir.x, dir.z)); m2.rotateX(PI / 2); m2.scale.set(big * 0.6, big * 1.4, 1); scene.add(m2);
    this.flashes.push({ m, life: 0.05 }, { m: m2, life: 0.05 });
    this.light(p, fire ? 0xff8030 : 0xffc070, 6 * big, 0.06, 10);
    for (let i = 0; i < 3; i++) this.norm.add({ x: p.x, y: p.y, z: p.z, vx: dir.x * rand(0.5, 1.5), vy: dir.y * rand(0.5, 1.5) + 0.3, vz: dir.z * rand(0.5, 1.5), life: rand(0.4, 0.8), max: 0.8, s: rand(0.1, 0.18), c: [0.8, 0.8, 0.8], a: 0.25, grow: 2, t: 'smoke' });
  }
  tracer(a, b, kind = 'player') {
    const m = new THREE.Mesh(this.tg, kind === 'fire' ? this.tracerMatFire : kind === 'enemy' ? this.tracerMatEnemy : this.tracerMat);
    m.position.copy(b); m.lookAt(a); const len = a.distanceTo(b); m.scale.set(1, 1, Math.min(len, 6)); scene.add(m);
    this.tracers.push({ m, life: kind === 'enemy' ? 0.02 : 0.06, max: 0.06 });
  }
  casing(p, owner, kind = 'brass', drop = false) {
    const m = kind === 'shell' ? magModel('shell') : new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.024, 6), col('brass', 0xd8b040, { metalness: 0.9, roughness: 0.3 }));
    scene.add(m); const r = owner.side;
    this.bits.push({ mesh: m, p: p.clone(), v: drop ? V3(rand(-0.4, 0.4), rand(-0.5, 0.3), rand(-0.4, 0.4)) : V3(r.x * rand(1.5, 2.5) + rand(-0.3, 0.3), rand(2, 3.2), r.z * rand(1.5, 2.5) + rand(-0.3, 0.3)), w: V3(rand(-20, 20), rand(-20, 20), rand(-20, 20)), life: 20, kind: 'casing', r: 0.01 });
    this.trim();
  }
  dropMag(part, kind, owner) {
    const m = magModel(kind === 'loader' ? 'loader' : kind); const wp = V3(); part.getWorldPosition(wp); m.position.copy(wp); part.getWorldQuaternion(m.quaternion); scene.add(m);
    this.bits.push({ mesh: m, p: wp, v: V3(owner.vel.x * 0.3 + rand(-0.2, 0.2), -0.5, owner.vel.z * 0.3 + rand(-0.2, 0.2)), w: V3(rand(-4, 4), rand(-2, 2), rand(-4, 4)), life: 30, kind: 'mag', r: 0.04 });
    this.trim();
  }
  dropGun(model, owner) {
    const m = model.clone(); const wp = V3(); model.getWorldPosition(wp); model.getWorldQuaternion(m.quaternion); m.position.copy(wp); scene.add(m);
    this.bits.push({ mesh: m, p: wp, v: V3(owner.vel.x * 0.5 + rand(-1, 1), rand(1, 2), owner.vel.z * 0.5 + rand(-1, 1)), w: V3(rand(-6, 6), rand(-6, 6), rand(-6, 6)), life: 30, kind: 'gun', r: 0.05 });
  }
  trim() { while (this.bits.length > 160) { const b = this.bits.shift(); scene.remove(b.mesh); } }
  decalBlood(p, size = 0.6, normal = V3(0, 1, 0)) { if (this.gore() === 0) return; const q = p.clone(); if (normal.y > 0.9) q.y = this.lv.groundAt(p.x, p.z, p.y + 0.5); this.bloodD.add(q, normal, size * rand(0.7, 1.3)); }
  decalHole(p, n) { this.holes.add(p, n, 0.07); }
  decalScorch(p, r) { const q = p.clone(); q.y = this.lv.groundAt(p.x, p.z, p.y + 0.5); this.scorch.add(q, V3(0, 1, 0), r * 2); }
  update(dt) {
    const lv = this.lv, drift = lv.groundDrift || 0;
    for (const sys of [this.norm, this.add_]) {
      const L = sys.list;
      for (let i = L.length - 1; i >= 0; i--) {
        const p = L[i]; p.life -= dt; if (p.life <= 0) { L[i] = L[L.length - 1]; L.pop(); continue; }
        switch (p.t) {
          case 'blood': case 'chip': {
            p.vy -= 12 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
            const gy = lv.groundAt(p.x, p.z, p.y + 0.2);
            if (p.y <= gy) { if (p.t === 'blood') { if (!drift && Math.random() < 0.6) this.decalBlood(V3(p.x, gy, p.z), rand(0.12, 0.3)); L[i] = L[L.length - 1]; L.pop(); continue; } p.y = gy; p.vy *= -0.3; p.vx *= 0.5; p.vz *= 0.5; p.x -= drift * dt; }
            break;
          }
          case 'spark': p.vy -= 6 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; break;
          case 'fire': p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.s *= 1 - dt * 1.3; p.x -= drift * dt; if (Math.random() < 0.04) this.smoke(V3(p.x, p.y, p.z), 1, 0.4, 0.6, 1.2); break;
          default: p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vx *= 0.97; p.vz *= 0.97; p.x -= drift * dt * 0.8;
        }
      }
      sys.sync();
    }
    for (let i = this.bits.length - 1; i >= 0; i--) {
      const b = this.bits[i]; b.life -= dt;
      if (b.life <= 0) { scene.remove(b.mesh); this.bits.splice(i, 1); continue; }
      if (!b.rest) {
        b.v.y -= 12 * dt; b.p.addScaledVector(b.v, dt);
        b.mesh.rotation.x += b.w.x * dt; b.mesh.rotation.y += b.w.y * dt; b.mesh.rotation.z += b.w.z * dt;
        const gy = lv.groundAt(b.p.x, b.p.z, b.p.y + 0.3) + b.r;
        if (b.p.y < gy) { b.p.y = gy; b.v.y *= -0.35; b.v.x *= 0.55; b.v.z *= 0.55; b.w.multiplyScalar(0.5); if (Math.abs(b.v.y) > 0.6) Audio.play(b.kind === 'casing' ? 'tink' : 'clank', 0, b.kind === 'casing' ? 0.6 : 0.35); if (Math.abs(b.v.y) < 0.4 && !drift) { b.rest = true; b.mesh.rotation.x = Math.round(b.mesh.rotation.x / (PI / 2)) * (PI / 2); b.mesh.rotation.z = Math.round(b.mesh.rotation.z / (PI / 2)) * (PI / 2); if (b.kind === 'gib') this.decalBlood(b.p, 0.25); } }
      }
      if (drift) b.p.x -= drift * dt * (b.p.y < 0.3 ? 1 : 0);
      b.mesh.position.copy(b.p);
    }
    for (let i = this.tracers.length - 1; i >= 0; i--) { const t = this.tracers[i]; t.life -= dt; t.m.material.opacity = 0.9; if (t.life <= 0) { scene.remove(t.m); this.tracers.splice(i, 1); } }
    for (let i = this.flashes.length - 1; i >= 0; i--) { const f = this.flashes[i]; f.life -= dt; if (f.life <= 0) { scene.remove(f.m); this.flashes.splice(i, 1); } }
    for (const l of this.lights) { if (l.userData.life > 0) { l.userData.life -= dt; l.intensity = l.userData.i0 * Math.max(0, l.userData.life / l.userData.max); } else l.intensity = 0; }
  }
}
