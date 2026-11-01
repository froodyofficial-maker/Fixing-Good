// ============================================================
//  FIXING GOOD 3D - highway chase: the RV stays put, the desert scrolls by
// ============================================================
import { THREE, V3, scene, col, box, cyl, car, rvModel, cactus, Tex, shadowed } from './gfx.js';
import { PI, TAU, clamp, lerp, rand, choose, G, Audio } from './core.js';
import { Actor } from './actor.js';

const SPEED = 24;
function bikeModel(color) {
  const g = new THREE.Group(), dark = col('tire', 0x151515), chrome = col('chrome', 0xb8bec4, { metalness: 0.9, roughness: 0.25 }), body = col('bike' + color, color, { metalness: 0.5, roughness: 0.4 });
  for (const x of [-0.75, 0.8]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.1, 8, 18), dark); w.position.set(x, 0.43, 0); w.name = 'wheel'; g.add(w); const h = cyl(0.1, 0.1, 0.12, chrome, 8); h.rotation.x = PI / 2; h.position.set(x, 0.43, 0); g.add(h); }
  g.add(box(0.9, 0.3, 0.3, body, 0.05, 0.75, 0)); g.add(box(0.55, 0.12, 0.3, col('seat', 0x2a2a2a), -0.35, 0.86, 0)); g.add(box(0.4, 0.35, 0.28, col('engine', 0x555555, { metalness: 0.7 }), 0.05, 0.5, 0));
  const fork = box(0.05, 0.7, 0.05, chrome, 0.72, 0.75, 0); fork.rotation.z = 0.35; g.add(fork); g.add(box(0.05, 0.05, 0.75, chrome, 0.6, 1.08, 0));
  g.add(box(0.7, 0.06, 0.06, chrome, -0.5, 0.42, 0.18));
  return shadowed(g);
}
class Vehicle {
  constructor(kind, lv, o = {}) {
    this.kind = kind; this.lv = lv; this.alive = true; this.team = o.team || 'enemy'; this.riders = [];
    this.hp = this.maxHp = kind === 'truck' ? 420 : kind === 'rv' ? 1400 : 90;
    this.offset = o.offset || 0; this.z = (o.lane || 1) * (kind === 'truck' ? 4.3 : 3.6); this.x = o.from === 'ahead' ? 60 : -50; this.vx = 0; this.y = 0; this.vy = 0; this.rot = 0; this.crash = 0; this.wob = rand(TAU);
    if (kind === 'bike') this.mesh = bikeModel(choose([0x7a2a2a, 0x2a3a5a, 0x3a3a3a, 0x5a4a2a]));
    else if (kind === 'truck') this.mesh = car(choose([0x5a3a2a, 0x3a3a3a, 0x6a6a5a, 0x2a3a2a]), 'pickup');
    if (this.mesh) scene.add(this.mesh);
  }
  box() {
    if (this.kind === 'bike') return { min: V3(this.x - 1, 0.25, this.z - 0.35), max: V3(this.x + 1, 1.15, this.z + 0.35) };
    if (this.kind === 'truck') return { min: V3(this.x - 2.3, 0.2, this.z - 0.95), max: V3(this.x + 2.3, 1.2, this.z + 0.95) };
    return { min: V3(0, 0.7, -1.2), max: V3(8.5, 3.3, 1.2) };
  }
  damage(d, lv) {
    if (!this.alive) return;
    if (this.kind === 'rv') { this.hp -= d * 0.25; if (this.hp <= 0) { this.hp = 0; lv.failed = true; lv.failReason = 'The RV is wrecked.'; lv.explode(V3(4, 1.5, 0), { r: 7 }); } return; }
    this.hp -= d * (this.kind === 'bike' ? 0.6 : 1); if (this.hp <= 0) this.destroy(lv);
  }
  destroy(lv) {
    this.alive = false; this.crash = 0.001;
    for (const r of this.riders) if (r.alive) { r.vel.set(this.vx, 3, rand(-2, 2)); r.mounted = null; r.hurt(999, { kind: this.kind === 'truck' ? 'blast' : 'bullet', p: r.center(), dir: V3(-1, 0.6, 0), knock: 8, close: this.kind === 'truck' }, lv); }
    if (this.kind === 'truck') { lv.explode(V3(this.x, 1, this.z), { r: 6, dmg: 60 }); this.vy = 6; } else { Audio.play('crash', 0, 0.7); this.vy = 4; }
  }
  update(dt, lv) {
    this.wob += dt * 3;
    if (this.mesh) this.mesh.traverse(o => { if (o.name === 'wheel') o.rotation.z -= dt * (SPEED + this.vx) / 0.4; });
    if (this.kind === 'rv') return;
    if (this.crash > 0) {
      this.crash += dt; this.vx = lerp(this.vx, -SPEED, dt * 1.5); this.vy -= 12 * dt; this.y += this.vy * dt; if (this.y < 0) { this.y = 0; this.vy *= -0.3; if (Math.abs(this.vy) > 1) { lv.fx.spark(V3(this.x, 0.1, this.z), 10); Audio.play('clank', 0, 0.4); } }
      this.rot += dt * (this.kind === 'bike' ? 6 : 1.2); this.x += this.vx * dt;
      if (Math.random() < 0.5) lv.fx.smoke(V3(this.x, 0.8, this.z), 1, 0.8, 0.85, 1.5);
      if (this.kind === 'truck' && Math.random() < 0.6) lv.fx.flame(V3(this.x + rand(-2, 2), 1.2, this.z + rand(-0.8, 0.8)), 1, 0.6, 0.2);
      if (Math.random() < 0.3) lv.fx.spark(V3(this.x, 0.05, this.z), 3);
      if (this.x < -120) { scene.remove(this.mesh); this.dead = true; }
    } else {
      this.vx = clamp((this.offset - this.x) * 1.2, -14, 14); this.x += this.vx * dt;
      if (Math.random() < 0.1) lv.fx.dust(V3(this.x - 1, 0, this.z), 1);
    }
    const bob = Math.sin(this.wob * 5) * 0.02;
    this.mesh.position.set(this.x, this.y + bob, this.z); this.mesh.rotation.set(this.crash ? this.rot * 0.3 : 0, 0, this.crash ? this.rot : Math.sin(this.wob) * 0.04);
    this.riders.forEach((r, i) => {
      if (!r.alive || !r.mounted) return;
      if (this.kind === 'bike') { r.pos.set(this.x - 0.35, 0.45 + bob, this.z); }
      else if (i === 0) r.pos.set(this.x + 0.9, 0.55, this.z - 0.4);
      else r.pos.set(this.x - 0.6 - (i - 1) * 0.8, 1.15 + bob, this.z + (i % 2 ? 0.35 : -0.35));
      r.vel.set(this.vx, 0, 0);
    });
    if (this.kind === 'bike' && this.riders.every(r => !r.alive)) this.destroy(lv);
    if (this.kind === 'truck' && this.riders[0] && !this.riders[0].alive && this.alive) this.destroy(lv);
  }
}

export function setupHighway(lv) {
  lv.groundDrift = SPEED; lv.vehicles = []; lv.half = 1.15; lv.minX = 0.4; lv.maxX = 8.1;
  lv.solids = lv.solids.filter(s => !s.invisible);
  // road + scrolling roadside
  const roadTex = Tex.road().clone(); roadTex.needsUpdate = true; roadTex.repeat.set(1400 / 8, 1); roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
  const road = new THREE.Mesh(new THREE.PlaneGeometry(1400, 14), new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.9 })); road.rotation.x = -PI / 2; road.position.y = 0.02; road.receiveShadow = true; scene.add(road);
  const ground = lv.terrain.children[0]; const gtex = ground.material.map;
  const side = new THREE.Group(); scene.add(side); const props = [];
  for (let i = 0; i < 60; i++) { const s = i % 2 ? 1 : -1, z = s * rand(9, 45); const m = i % 5 === 0 ? (() => { const g = new THREE.Group(); const p = cyl(0.12, 0.14, 8, col('pole', 0x5a4636), 6); p.position.y = 4; g.add(p); g.add(box(2.2, 0.12, 0.12, col('pole', 0x5a4636), 0, 7.6, 0)); return g; })() : cactus(2.5 + rand(3)); m.position.set(rand(-150, 150), 0, i % 5 === 0 ? s * 9 : z); side.add(m); props.push(m); }
  // the RV + Walter at the wheel
  const rv = new Vehicle('rv', lv, { team: 'player' }); rv.mesh = rvModel({ dirty: true }); scene.add(rv.mesh); lv.rv = rv; lv.vehicles.push(rv);
  lv.addSolid(V3(0, 0.7, -1.2), V3(8.5, 3.3, 1.2), { style: 'car' });
  const w = lv.addNPC({ id: 'driver', kind: 'npc', team: 'npc', x: 7.6, z: 0.5, look: 'walter', yaw: PI / 2 }); w.mounted = rv; w.sit = true; w.frozen = true; w.pos.set(7.5, 0.6, 0.5);
  if (lv.player) { lv.player.pos.set(4.2, 3.3, 0); }
  lv.camYaw = PI / 2 + 0.35;
  lv.spawnVehicle = (kind, o = {}) => {
    const v = new Vehicle(kind, lv, o); const look = o.look || 'biker';
    if (kind === 'bike') { const r = new Actor({ kind: o.rider || choose(['gunner', 'smg']), team: 'enemy', x: v.x, z: v.z, look, alert: true, yaw: PI / 2 }); r.sit = true; r.mounted = v; v.riders.push(r); lv.actors.push(r); }
    else {
      const d = new Actor({ kind: 'gunner', team: 'enemy', x: v.x, z: v.z, look, alert: true, yaw: PI / 2 }); d.sit = true; d.mounted = v; v.riders.push(d); lv.actors.push(d);
      for (let i = 0; i < (o.gunners || 2); i++) { const g = new Actor({ kind: choose(['rifleman', 'shotgunner', 'smg']), team: 'enemy', x: v.x, z: v.z, look, alert: true, yaw: PI / 2 }); g.mounted = v; v.riders.push(g); lv.actors.push(g); }
    }
    lv.vehicles.push(v); return v;
  };
  lv.highwayClamp = (a) => {
    if (a.isPlayer() && a.pos.y < 2.6 && a.alive) { a.hurt(30, { kind: 'melee', p: a.center() }, lv); a.pos.set(4.2, 3.4, 0); a.vel.set(0, 0, 0); lv.toast('Stay on the roof!'); }
  };
  lv.updateExtra = (dt) => {
    roadTex.offset.x += dt * SPEED / 8; if (gtex) gtex.offset.x += dt * SPEED / 8;
    for (const m of props) { m.position.x -= SPEED * dt; if (m.position.x < -150) m.position.x += 300; }
    for (const v of lv.vehicles) v.update(dt, lv);
    lv.vehicles = lv.vehicles.filter(v => !v.dead);
    lv._eng = (lv._eng || 0) - dt; if (lv._eng <= 0) { lv._eng = 0.38; Audio.play('engine', 0, 0.25); }
    if (Math.random() < 0.4) lv.fx.smoke(V3(-0.2, 0.6, 0.6), 1, 0.3, 0.5, 0.3);
    // RV sways a little
    rv.mesh.position.y = Math.sin(lv.time * 9) * 0.015; rv.mesh.rotation.x = Math.sin(lv.time * 3.1) * 0.006;
  };
  const baseHUD = lv.drawHUD.bind(lv);
  lv.drawHUD = (c) => {
    baseHUD(c); if (lv.cinematic) return;
    const x = 640 - 160; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(x - 10, 14, 340, 36);
    c.font = 'bold 13px Oswald, sans-serif'; c.fillStyle = '#ddd'; c.fillText('RV', x, 37);
    c.fillStyle = '#222'; c.fillRect(x + 26, 26, 290, 12); c.fillStyle = rv.hp / rv.maxHp < 0.3 ? '#e04030' : '#e0b050'; c.fillRect(x + 26, 26, 290 * rv.hp / rv.maxHp, 12);
  };
}
