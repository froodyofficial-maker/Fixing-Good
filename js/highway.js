'use strict';
// ============================================================
//  FIXING GOOD - highway chase mode (RV roof shooter)
// ============================================================
const RV_ROOF = 176;
class Vehicle {
  constructor(kind, x, o = {}) {
    this.kind = kind; this.x = x; this.y = GROUND; this.vx = 0; this.alive = true; this.team = o.team || 'enemy';
    this.hp = this.maxHp = kind === 'truck' ? 420 : kind === 'rv' ? 1400 : 90;
    this.offset = o.offset || 0; this.wheel = 0; this.riders = []; this.col = o.col || choose(['#7a2a2a', '#2a3a5a', '#3a3a3a', '#5a4a2a']);
    this.wob = rand(TAU); this.crashT = 0; this.rot = 0; this.vy = 0; this.yoff = 0;
    this.w = kind === 'truck' ? 230 : kind === 'rv' ? 394 : 90;
  }
  box() {
    if (this.kind === 'bike') return { x: this.x - 40, y: this.y - 44, w: 80, h: 40 };
    if (this.kind === 'truck') return { x: this.x, y: this.y - 92, w: 230, h: 70 };
    return { x: this.x + 4, y: this.y - 176, w: 390, h: 136 };
  }
  damage(d, lv) {
    if (!this.alive) return;
    this.hp -= this.kind === 'rv' ? d * 0.25 : d * (this.kind === 'bike' ? 0.6 : 1);
    if (this.kind === 'rv') { if (Math.random() < 0.3) { (this.holes = this.holes || []).push([rand(20, 380), rand(-160, -50)]); if (this.holes.length > 40) this.holes.shift(); } if (this.hp <= 0) { this.hp = 0; lv.failed = true; lv.failReason = 'The RV is wrecked.'; lv.explode(this.x + 200, GROUND - 80, { r: 260 }); } return; }
    if (this.hp <= 0) this.destroy(lv);
  }
  destroy(lv) {
    this.alive = false; this.crashT = 0.001;
    for (const r of this.riders) if (r.alive) { r.vx = this.vx; r.vy = -300; r.hurt(999, { kind: this.kind === 'truck' ? 'blast' : 'bullet', x: r.x, y: r.y - 50, dx: -1, dy: -0.6, knock: 600, close: this.kind === 'truck' }, lv); }
    if (this.kind === 'truck') { lv.explode(this.x + 115, GROUND - 60, { r: 240, dmg: 60 }); this.vy = -350; }
    else { Audio.play('crash', 0, 0.7); this.vy = -260; }
  }
  update(dt, lv) {
    this.wob += dt * 3; this.wheel += this.vx * dt / 22;
    if (this.kind === 'rv') return;
    if (this.crashT > 0) {
      this.crashT += dt; this.vx *= 1 - dt * 1.2; this.vy += 1500 * dt; this.yoff += this.vy * dt; if (this.yoff > 0) { this.yoff = 0; this.vy *= -0.3; if (Math.abs(this.vy) > 60) { lv.fx.spark(this.x, GROUND, 10, 1, -1); Audio.play('clank', 0, 0.4); } }
      this.rot += dt * (this.kind === 'bike' ? 7 : 1.2) * Math.min(1, this.vx / 300); this.x += this.vx * dt;
      if (Math.random() < 0.6) lv.fx.smoke(this.x + this.w / 2, GROUND - 30, 1, 20, 0.85, -60);
      if (this.kind === 'truck' && Math.random() < 0.6) lv.fx.flame(this.x + rand(20, 210), GROUND - rand(30, 80), 1, 14, 10);
      if (Math.random() < 0.3) lv.fx.spark(this.x, GROUND - 2, 3, -1, -0.5);
      return;
    }
    const rv = lv.rv, want = rv.x + this.offset;
    this.vx = rv.vx + clamp((want - this.x) * 1.4, -360, 420);
    this.x += this.vx * dt;
    if (Math.random() < 0.15) lv.fx.dust(this.x - 10, GROUND, 1, 'rgba(120,110,100,');
    // place riders
    const bob = Math.sin(this.wob * 5) * 1.5;
    this.riders.forEach((r, i) => {
      if (!r.alive) return;
      if (this.kind === 'bike') { r.x = this.x - 6; r.y = GROUND - 40 + bob; }
      else { if (i === 0) { r.x = this.x + 150; r.y = GROUND - 56; } else { r.x = this.x + 30 + i * 46; r.y = GROUND - 62 + bob; } }
      r.vx = 0; r.vy = 0;
    });
    if (this.riders.every(r => !r.alive) && this.kind === 'bike') this.destroy(lv);
    if (this.kind === 'truck' && this.riders[0] && !this.riders[0].alive) this.destroy(lv); // driver down: truck goes out of control
  }
  draw(c) {
    c.save(); c.translate(this.x + (this.kind === 'bike' ? 0 : this.w / 2), this.y + this.yoff); c.rotate(this.rot); c.translate(-(this.kind === 'bike' ? 0 : this.w / 2), 0);
    if (this.kind === 'bike') drawBike(c, 0, 0, this.wheel, this.col);
    else if (this.kind === 'truck') { drawCar(c, 0, 0, 230, this.crashT > 0 ? '#2a2420' : this.col, 'pickup', 1); }
    c.restore();
  }
}
function drawBike(c, x, y, rot, col) {
  c.save(); c.translate(x, y); c.strokeStyle = INK; c.lineWidth = 2;
  for (const wx of [-30, 32]) { c.fillStyle = '#151515'; c.beginPath(); c.arc(wx, -16, 16, 0, TAU); c.fill(); c.fillStyle = '#888'; c.beginPath(); c.arc(wx, -16, 6, 0, TAU); c.fill(); c.save(); c.translate(wx, -16); c.rotate(rot); c.strokeStyle = '#555'; c.beginPath(); c.moveTo(-12, 0); c.lineTo(12, 0); c.moveTo(0, -12); c.lineTo(0, 12); c.stroke(); c.restore(); }
  c.fillStyle = col; c.beginPath(); c.moveTo(-26, -30); c.lineTo(10, -34); c.lineTo(22, -44); c.lineTo(30, -40); c.lineTo(32, -18); c.lineTo(-4, -18); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#2a2a2a'; c.fillRect(-22, -38, 26, 7); c.fillStyle = '#9aa0a6'; c.fillRect(-36, -22, 20, 5);
  c.strokeStyle = '#9aa0a6'; c.lineWidth = 3; c.beginPath(); c.moveTo(22, -44); c.lineTo(32, -16); c.moveTo(22, -44); c.lineTo(14, -54); c.stroke();
  c.restore();
}

function setupHighway(lv) {
  lv.vehicles = []; lv.width = 1e9; lv.maxX = 1e9;
  const rv = new Vehicle('rv', 300, { team: 'player' }); rv.vx = 640; lv.rv = rv; lv.vehicles.push(rv);
  const roof = { x: rv.x + 20, y: GROUND - RV_ROOF, w: 330, h: 10, oneway: true, style: 'none' };
  lv.solids.push(roof); lv.roof = roof;
  if (lv.player) { lv.player.x = rv.x + 180; lv.player.y = roof.y; }
  lv.cam.target = rv.x + 200;
  lv.spawnVehicle = (kind, o = {}) => {
    const v = new Vehicle(kind, lv.rv.x + (o.from === 'right' ? 1300 : -900), o);
    v.offset = o.offset !== undefined ? o.offset : (kind === 'truck' ? -520 : rand(-420, -200));
    const look = o.look || 'biker';
    if (kind === 'bike') { const r = new Actor({ kind: o.rider || choose(['gunner', 'smg']), team: 'enemy', x: v.x, look, alert: true, face: 1 }); r.sit = true; r.mounted = v; v.riders.push(r); lv.actors.push(r); }
    else {
      const d = new Actor({ kind: 'gunner', team: 'enemy', x: v.x, look, alert: true, face: 1 }); d.sit = true; d.mounted = v; d.passiveShoot = true; v.riders.push(d); lv.actors.push(d);
      for (let i = 0; i < (o.gunners || 2); i++) { const g = new Actor({ kind: choose(['rifleman', 'shotgunner', 'smg']), team: 'enemy', x: v.x, look, alert: true, face: 1 }); g.mounted = v; v.riders.push(g); lv.actors.push(g); }
    }
    lv.vehicles.push(v); return v;
  };
  lv.updateExtra = (dt) => {
    const rv = lv.rv; rv.x += rv.vx * dt; rv.update(dt, lv);
    const roof = lv.roof; roof.x = rv.x + 20;
    // carry anyone on the roof
    for (const a of lv.actors) if (!a.mounted && a.alive && Math.abs(a.y - roof.y) < 2 && a.x > roof.x - 14 && a.x < roof.x + roof.w + 14) a.x += rv.vx * dt;
    lv.minX = rv.x + 24; lv.maxX = rv.x + 360;
    const p = lv.player;
    if (p && p.alive && p.y >= GROUND - 1) { p.hurt(30, { kind: 'melee', x: p.x, y: p.y - 40 }, lv); p.x = rv.x + 180; p.y = roof.y - 40; p.vy = 0; lv.toast('Stay on the roof!'); }
    for (const v of lv.vehicles) if (v !== rv) v.update(dt, lv);
    lv.vehicles = lv.vehicles.filter(v => v === rv || v.x > lv.cam.x - 1500);
    lv.cam.target = rv.x + 240;
    // engine rumble + exhaust
    if (Math.random() < 0.4) lv.fx.smoke(rv.x - 4, GROUND - 40, 1, 8, 0.5, -10);
    lv._eng = (lv._eng || 0) - dt; if (lv._eng <= 0) { lv._eng = 0.38; Audio.play('engine', 0, 0.25); }
    // mounted riders' ragdolls keep their speed
    for (const r of lv.ragdolls) if (r.t < 0.05 && !r.boosted) { r.boosted = true; }
  };
  lv.drawMidExtra = (c) => {
    for (const v of lv.vehicles) if (v !== lv.rv) v.draw(c);
    const rv = lv.rv;
    drawRV(c, rv.x, GROUND, { wheel: rv.wheel, bob: Math.sin(lv.time * 9) * 1.2, driver: LOOKS.walter, holes: rv.holes, dirty: true });
  };
  lv.drawFrontExtra = (c) => {
    // speed lines
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2;
    for (let i = 0; i < 8; i++) { const y = GROUND + 20 + (i * 37) % 90, x = lv.cam.x + ((-lv.time * 1600 + i * 290) % (lv.VW + 200) + lv.VW + 200) % (lv.VW + 200) - 100; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 80, y); c.stroke(); }
  };
  const baseHUD = lv.drawHUD.bind(lv);
  lv.drawHUD = (c) => {
    baseHUD(c);
    if (lv.cinematic) return;
    const rv = lv.rv, x = W / 2 - 160;
    c.fillStyle = 'rgba(0,0,0,.6)'; rrect(c, x - 10, 14, 340, 36, 6); c.fill();
    c.font = 'bold 13px "Oswald", sans-serif'; c.fillStyle = '#ddd'; c.fillText('RV', x, 37);
    c.fillStyle = '#222'; c.fillRect(x + 26, 26, 290, 12); c.fillStyle = rv.hp / rv.maxHp < 0.3 ? '#e04030' : '#e0b050'; c.fillRect(x + 26, 26, 290 * rv.hp / rv.maxHp, 12);
  };
}
