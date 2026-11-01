'use strict';
// ============================================================
//  FIXING GOOD - actors (player, enemies, allies) + ragdolls
// ============================================================
const ARCH = {
  player: { hp: 100, speed: 280 },
  walter: { hp: 400, speed: 270, dist: [80, 160], acc: 0.03 },
  thug: { hp: 60, speed: 235, weapon: 'bat', melee: true },
  knifer: { hp: 50, speed: 260, weapon: 'knife', melee: true },
  gunner: { hp: 70, speed: 170, weapon: 'pistol', dist: [260, 520], acc: 0.085, react: 0.7 },
  smg: { hp: 75, speed: 180, weapon: 'smg', dist: [220, 440], acc: 0.11, react: 0.65 },
  shotgunner: { hp: 100, speed: 190, weapon: 'shotgun', dist: [110, 260], acc: 0.05, react: 0.65 },
  rifleman: { hp: 95, speed: 160, weapon: 'rifle', dist: [340, 640], acc: 0.065, react: 0.6 },
  heavy: { hp: 240, armor: 120, speed: 105, weapon: 'mg', dist: [280, 580], acc: 0.08, react: 0.8, armorLook: true },
  rafa: { hp: 750, speed: 250, weapon: 'gold', dist: [200, 420], acc: 0.05, react: 0.3, boss: true, look: 'rafa' },
  marco: { hp: 650, speed: 260, weapon: 'axe', melee: true, boss: true, look: 'twinA' },
  leo: { hp: 480, speed: 190, weapon: 'revolver', dist: [260, 520], acc: 0.035, react: 0.35, boss: true, look: 'twinB' },
  esteban: { hp: 950, armor: 250, speed: 170, weapon: 'shotgun', dist: [140, 300], acc: 0.04, react: 0.35, boss: true, look: 'esteban' },
  dutch: { hp: 1150, armor: 300, speed: 120, weapon: 'mg', dist: [260, 520], acc: 0.075, react: 0.4, boss: true, look: 'dutch' },
  npc: { hp: 100, speed: 200 },
};
const HEIGHT = 88, CROUCH_H = 62;

class Actor {
  constructor(o) {
    const A = ARCH[o.kind] || ARCH.npc;
    this.kind = o.kind; this.arch = A; this.team = o.team || 'enemy';
    this.name = o.name || null; this.id = o.id || null; this.boss = !!(o.boss || A.boss);
    this.x = o.x; this.y = o.y || GROUND; this.vx = 0; this.vy = 0; this.facing = o.face || 1;
    this.aimAng = this.facing > 0 ? 0 : PI; this.aimX = this.x + this.facing * 100; this.aimY = this.y - 60;
    this.maxHp = o.hp || A.hp; this.hp = this.maxHp; this.armor = o.armor !== undefined ? o.armor : (A.armor || 0); this.maxArmor = Math.max(1, this.armor);
    this.look = o.look ? (typeof o.look === 'string' ? lookOf(o.look) : o.look) : lookOf(A.look || 'thug');
    if (A.armorLook || this.armor > 0 && this.team === 'enemy' && !this.boss) this.look = Object.assign({}, this.look, { armor: true });
    const guns = o.guns || (A.weapon ? [A.weapon] : []);
    this.guns = guns.map(k => new Gun(k)); this.gi = 0;
    this.onGround = true; this.crouching = false; this.crouch = 0; this.walkPh = rand(TAU); this.stepT = 0;
    this.roll = 0; this.rollDir = 1; this.melee = null; this.combo = 0; this.queued = false; this.meleeCd = 0;
    this.stagger = 0; this.hurtFlash = 0; this.burn = 0; this.kick = 0; this.alive = true; this.hurtT = 9;
    this.moveX = 0; this.wantJump = false; this.wantFire = false; this.dropThrough = 0;
    this.ai = { state: o.alert ? 'alert' : 'idle', t: rand(0, 1), react: A.react || 0.5, burst: 0, pause: rand(0.3, 1), strafeT: 0, strafe: 0, aimErrX: 0, aimErrY: 0, patrol: o.patrol || 0, home: o.x, blockT: 0 };
    this.downed = 0; this.invuln = o.invuln || false; this.passive = !!o.passive; this.frozen = false;
    this.cine = null; // scripted target x
    this.J = null; this.G = [this.x, this.y - 60]; this.gAng = 0; this.f = this.facing;
    this.reloadMul = 1; this.bangCd = 12;
    this.pose();
  }
  get gun() { return this.guns[this.gi] || null; }
  isPlayer() { return this.team === 'player' && this.kind === 'player'; }
  reserve(t) { return this.isPlayer() ? (Game.state.ammo[t] || 0) : 999; }
  useReserve(t, n) { if (this.isPlayer()) Game.state.ammo[t] = Math.max(0, (Game.state.ammo[t] || 0) - n); }
  pan() { const lv = Game.level; return lv ? clamp((this.x - lv.cam.x - lv.VW / 2) / lv.VW * 1.6, -1, 1) : 0; }
  vol() { if (this.isPlayer()) return 1; const lv = Game.level; return lv ? clamp(1 - Math.abs(this.x - lv.cam.x - lv.VW / 2) / 1500, 0.12, 0.9) : 0.6; }
  pouch() { const J = this.J; return [J.pelvis[0] - this.f * 3, J.pelvis[1] - 4]; }
  L2W(lx, ly) { const c = Math.cos(this.gAng), s = Math.sin(this.gAng), f = this.f; return [this.G[0] + c * lx - s * ly * f, this.G[1] + s * lx + c * ly * f]; }
  height() { return this.crouching || this.roll > 0 ? CROUCH_H : HEIGHT; }
  box() { const h = this.height(); return { x: this.x - 12, y: this.y - h, w: 24, h }; }
  center() { return [this.x, this.y - this.height() * 0.55]; }
  headPos() { return this.J ? this.J.head : [this.x, this.y - 82]; }

  // ---------- pose ----------
  pose() {
    const f = this.facing; this.f = f;
    const sp = clamp(Math.abs(this.vx) / (this.arch.speed || 260), 0, 1.2);
    const cr = this.crouch, x = this.x, y = this.y;
    const bob = this.onGround ? Math.abs(Math.sin(this.walkPh)) * 2.5 * sp : 0;
    const J = {};
    let pelvisY = y - 47 + cr * 17 + bob;
    if (this.downed > 0) pelvisY = y - 18;
    const lean = f * sp * 5 + (this.melee && this.melee.kind === 'kick' ? -f * 6 : 0) + (this.stagger > 0 ? -f * 5 : 0);
    if (this.sit) pelvisY = y - 4;
    J.pelvis = [x, pelvisY];
    J.neck = [x + lean + (this.downed > 0 ? -f * 8 : 0), pelvisY - 33 + cr * 3 + (this.downed > 0 ? 6 : 0)];
    // head looks toward aim a little
    let look = clamp(angDiff(f > 0 ? 0 : PI, this.aimAng) * f, -0.6, 0.6);
    J.head = [J.neck[0] + f * 1.5, J.neck[1] - 13];
    J.headAng = look * 0.5 + (this.stagger > 0 ? -0.35 : 0) + (this.downed > 0 ? 0.4 : 0);
    // legs
    let fF, fB;
    if (this.sit) { fF = [x + f * 26, y + 26]; fB = [x + f * 20, y + 24]; }
    else if (this.downed > 0) { fF = [x + f * 30, y]; fB = [x + f * 22, y]; }
    else if (!this.onGround) { fF = [x + f * 12, pelvisY + 34]; fB = [x - f * 8, pelvisY + 40]; }
    else if (this.melee && this.melee.kind === 'kick') { const e = this.meleeExt(); fF = [x + f * (14 + 40 * e), y - 12 - 46 * e]; fB = [x - f * 8, y]; }
    else if (sp > 0.05) {
      const p = this.walkPh, st = (14 + 8 * sp) * (1 - cr * 0.3);
      fF = [x + f * Math.sin(p) * st + f * 3, y - Math.max(0, Math.cos(p)) * 11 * sp];
      fB = [x - f * Math.sin(p) * st - f * 1, y - Math.max(0, -Math.cos(p)) * 11 * sp];
    } else { fF = [x + f * (7 + cr * 9), y]; fB = [x - f * (5 + cr * 9), y]; }
    J.fF = fF; J.fB = fB;
    J.kF = ik(J.pelvis[0], J.pelvis[1], fF[0], fF[1], 24, 24, -f);
    J.kB = ik(J.pelvis[0], J.pelvis[1], fB[0], fB[1], 24, 24, -f);
    // arms + gun
    const S = [J.neck[0] - f * 2, J.neck[1] + 5];
    const g = this.gun;
    let hF, hB;
    this.meleeHand = null;
    if (this.melee && !this.melee.armed) {
      const e = this.meleeExt(), k = this.melee.kind;
      const guardF = [S[0] + f * 14, S[1] + 2], guardB = [S[0] + f * 10, S[1] - 2];
      if (k === 'jab') { hF = [S[0] + f * (14 + 26 * e), S[1] - 2 + 2 * e]; hB = guardB; }
      else if (k === 'cross') { hB = [S[0] + f * (12 + 30 * e), S[1] - 3]; hF = guardF; }
      else { hF = guardF; hB = [S[0] - f * 10, S[1] + 14]; }
      this.gAng = this.aimAng; this.G = S;
    } else if (g && g.melee) {
      let a = 0.9; // hand angle in facing-right space
      if (this.melee) { const k = this.melee.t / this.melee.dur; a = k < 0.35 ? lerp(0.9, -2.3, ease(k / 0.35)) : k < 0.55 ? lerp(-2.3, 1.0, (k - 0.35) / 0.2) : lerp(1.0, 0.9, (k - 0.55) / 0.45); }
      else if (this.ai.state === 'alert' && this.team === 'enemy') a = 0.2 + Math.sin(this.walkPh) * 0.15;
      hB = [S[0] + f * Math.cos(a) * 30, S[1] + Math.sin(a) * 30];
      hF = [S[0] + f * 12, S[1] + 20 - (this.melee ? 6 : 0)];
      this.meleeHand = { p: hB, a };
      this.gAng = this.aimAng; this.G = S;
    } else if (g && !this.downed) {
      const d = g.def; const tilt = g.tilt() + this.kick;
      let th = this.aimAng;
      // clamp the aim into the facing half
      const rel = clamp(angDiff(f > 0 ? 0 : PI, th) * f, -1.35, 1.25);
      th = (f > 0 ? 0 : PI) + rel * f;
      if (g.reload) { const rest = (f > 0 ? 0 : PI) + 0.45 * f; th += angDiff(th, rest) * g.weight(); }
      if (this.roll > 0 || this.cineLower) th = (f > 0 ? 0 : PI) + 0.9 * f;
      const ga = th - f * tilt;
      this.gAng = ga;
      const c = Math.cos(ga), s = Math.sin(ga), ho = d.hold;
      const hold0 = ho[0] - (d.heavy ? 0 : 0) - this.kick * 18;
      this.G = [S[0] + c * hold0 - s * ho[1] * f, S[1] + s * hold0 + c * ho[1] * f];
      hB = this.G.slice();
      hF = g.supportTarget(this) || hB;
    } else {
      // empty hands: swing
      const sw = Math.sin(this.walkPh) * 12 * sp;
      hF = [S[0] + f * (4 - sw), S[1] + 34 - Math.abs(sw) * 0.2]; hB = [S[0] - f * (2 - sw), S[1] + 34 - Math.abs(sw) * 0.2];
      if (this.downed > 0) { hF = [S[0] + f * 18, y - 4]; hB = [S[0] + f * 8, y - 2]; }
      if (this.cineGesture) { hF = [S[0] + f * 30, S[1] + 4]; }
      this.gAng = this.aimAng; this.G = S;
    }
    J.hF = hF; J.hB = hB;
    J.eF = ik(S[0], S[1], hF[0], hF[1], 19, 19, f);
    J.eB = ik(S[0], S[1], hB[0], hB[1], 19, 19, f);
    this.J = J;
  }
  meleeExt() { if (!this.melee) return 0; const k = this.melee.t / this.melee.dur; return k < 0.35 ? ease(k / 0.35) : k < 0.6 ? 1 : 1 - ease((k - 0.6) / 0.4); }

  draw(c) {
    if (!this.J) return;
    const opts = { flash: this.hurtFlash > 0.06, burning: this.burn > 0, angry: this.team === 'enemy' && this.ai.state === 'alert' };
    const g = this.gun;
    if (g && !this.melee || (g && g.melee)) {
      opts.gun = (c) => {
        if (g.melee) {
          if (!this.meleeHand) return;
          c.save(); c.translate(this.meleeHand.p[0], this.meleeHand.p[1]); c.scale(this.f, 1); c.rotate(this.meleeHand.a + 0.4); GUN_ART[g.def.art](c); c.restore(); return;
        }
        c.save(); c.translate(this.G[0], this.G[1]); c.rotate(this.gAng); c.scale(1, this.f);
        GUN_ART[g.def.art](c, g.drawState());
        c.restore();
        // carried mag / shell in the support hand
        if (g.carry) {
          const h = this.J.hF; c.save(); c.translate(h[0], h[1]); c.rotate(this.gAng + (g.carry === 'rifle' ? 0.2 : 0)); c.scale(1, this.f);
          if (g.carry === 'shell') { c.fillStyle = '#c02a1c'; c.fillRect(-2, -3, 8, 5); c.fillStyle = '#d8b040'; c.fillRect(-4, -3, 3, 5); }
          else if (g.carry === 'loader') { c.fillStyle = '#333'; c.beginPath(); c.arc(0, -2, 5, 0, TAU); c.fill(); c.fillStyle = '#d8b040'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(Math.cos(i) * 3, -2 + Math.sin(i) * 3, 1.2, 0, TAU); c.fill(); } }
          else { c.translate(0, 6); drawMag(c, g.carry); }
          c.restore();
        }
      };
    }
    if (this.iframes > 0 && Math.floor(this.iframes * 20) % 2) c.globalAlpha = 0.45;
    if (this.roll > 0) {
      const k = 1 - this.roll / 0.42; c.save(); c.translate(this.x, this.y - 30); c.rotate(this.rollDir * k * TAU); c.translate(-this.x, -(this.y - 30));
      drawFigure(c, this.J, this.look, this.f, opts); c.restore();
    } else drawFigure(c, this.J, this.look, this.f, opts);
    c.globalAlpha = 1;
  }

  // ---------- update ----------
  update(dt, lv) {
    if (!this.alive) return;
    this.hurtFlash -= dt; this.stagger -= dt; this.iframes = (this.iframes || 0) - dt; this.lastStandCd = (this.lastStandCd || 0) - dt; this.burstDmg = Math.max(0, (this.burstDmg || 0) - dt * 26); this.meleeCd -= dt; this.hurtT += dt; this.kick = Math.max(0, this.kick - dt * 3);
    if (this.downed > 0) { this.downed -= dt; this.vx = 0; if (this.downed <= 0) { this.hp = this.maxHp * 0.5; lv.banter(this.id === 'walter' ? 'walter' : null, choose(['I\'m... I\'m alright. Keep moving.', 'Ugh. I\'m up. I\'m up.', 'That was... unpleasant.'])); } this.physics(dt, lv); this.pose(); return; }
    if (this.burn > 0) { this.burn -= dt; if (Math.random() < 0.7) lv.fx.flame(this.x + rand(-8, 8), this.y - rand(10, 80), 1, 9); if (this._burnTick === undefined || (this._burnTick -= dt) <= 0) { this._burnTick = 0.25; this.hurt(4, { kind: 'fire', x: this.x, y: this.y - 50 }, lv); } }
    // regen for the player
    if (this.isPlayer()) { this.regenerating = this.hurtT > 2.5; if (this.regenerating && this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + dt * 20); }
    if (this.cine !== null && this.cine !== undefined) this.cineControl(dt, lv);
    else if (this.isPlayer() && !lv.cinematic && !lv.failed && !lv.done) this.playerControl(dt, lv);
    else if (!this.isPlayer() && !this.frozen && !lv.cinematic) this.aiControl(dt, lv);
    else { this.moveX = 0; this.wantFire = false; this.crouching = false; }
    if (this.stagger > 0) { this.moveX = 0; this.wantFire = false; }
    // melee timing
    if (this.melee) {
      this.melee.t += dt; const k = this.melee.t / this.melee.dur;
      if (!this.melee.hit && k >= (this.melee.armed ? 0.45 : 0.38)) { this.melee.hit = true; this.meleeStrike(lv); }
      if (k >= 1) { const q = this.queued; this.melee = null; this.queued = false; if (q) this.startMelee(lv); else this.combo = 0; }
    }
    if (this.mounted) { this.onGround = true; this.crouching = false; this.moveX = 0; } else this.physics(dt, lv);
    this.pose();
    const g = this.gun;
    if (g) g.update(dt, this, lv);
    if (this.wantFire && g && !g.melee && !this.melee && this.roll <= 0) this.tryFire(lv);
    if (g && !g.melee && g.mag === 0 && !g.reload && this.roll <= 0 && g.cd <= 0 && (this.team !== 'player' || this.wantAutoReload)) g.startReload(this);
  }
  physics(dt, lv) {
    const A = this.arch, sp = (A.speed || 260) * (this.crouching ? 0.45 : 1) * (this.burn > 0 && this.team === 'enemy' ? 1.3 : 1);
    if (this.roll > 0) { this.roll -= dt; this.vx = this.rollDir * 470; }
    else {
      const target = this.moveX * sp, acc = this.onGround ? 2600 : 1200;
      if (this.vx < target) this.vx = Math.min(target, this.vx + acc * dt); else if (this.vx > target) this.vx = Math.max(target, this.vx - acc * dt);
    }
    if (this.wantJump && this.onGround && !this.crouching) { this.vy = -760; this.onGround = false; Audio.play('whoosh', this.pan(), this.vol() * 0.5); }
    this.wantJump = false;
    this.vy += 2100 * dt; if (this.vy > 1400) this.vy = 1400;
    const h = this.height();
    // horizontal
    this.x += this.vx * dt; this.blocked = 0;
    for (const s of lv.solids) {
      if (s.oneway || s.dead) continue;
      if (this.x + 12 > s.x && this.x - 12 < s.x + s.w && this.y > s.y + 1 && this.y - h < s.y + s.h) {
        if (this.vx > 0 || this.x < s.x + s.w / 2) { this.x = s.x - 12; this.blocked = 1; } else { this.x = s.x + s.w + 12; this.blocked = -1; }
      }
    }
    this.x = clamp(this.x, lv.minX + 14, lv.maxX - 14);
    // vertical
    const prevY = this.y; this.y += this.vy * dt; const wasGround = this.onGround; this.onGround = false;
    if (this.y >= GROUND) { this.y = GROUND; this.vy = 0; this.onGround = true; }
    for (const s of lv.solids) {
      if (s.dead) continue;
      if (this.x + 11 > s.x && this.x - 11 < s.x + s.w) {
        if (this.vy >= 0 && prevY <= s.y + 2 && this.y >= s.y) {
          if (s.oneway && this.dropThrough > 0) continue;
          this.y = s.y; this.vy = 0; this.onGround = true;
        } else if (!s.oneway && this.vy < 0 && this.y - h < s.y + s.h && prevY - h >= s.y + s.h - 2) { this.y = s.y + s.h + h; this.vy = 0; }
      }
    }
    this.dropThrough -= dt;
    if (this.onGround && !wasGround && this.vy === 0 && prevY < this.y - 0.5) { }
    if (!wasGround && this.onGround) { Audio.play('land', this.pan(), this.vol() * 0.6); lv.fx.dust(this.x, this.y, 4); }
    // walk cycle
    if (this.onGround && Math.abs(this.vx) > 10) {
      this.walkPh += dt * Math.abs(this.vx) / 15 * (sign(this.vx) === this.facing ? 1 : -1);
      this.stepT -= dt; if (this.stepT <= 0) { this.stepT = 0.3; if (this.isPlayer()) Audio.play('step', 0, 0.6); }
    }
    this.crouch = lerp(this.crouch, this.crouching && this.onGround ? 1 : 0, Math.min(1, dt * 14));
  }
  playerControl(dt, lv) {
    const I = Input, st = Game.state;
    this.moveX = (I.down('KeyD') || I.down('ArrowRight') ? 1 : 0) - (I.down('KeyA') || I.down('ArrowLeft') ? 1 : 0);
    this.crouching = I.down('KeyS') || I.down('ArrowDown') || I.down('ControlLeft');
    if (I.hit('KeyW') || I.hit('Space') || I.hit('ArrowUp')) { if (this.crouching) this.dropThrough = 0.25; else this.wantJump = true; }
    if ((I.hit('ShiftLeft') || I.hit('ShiftRight')) && this.onGround && this.roll <= 0 && !this.melee) { this.roll = 0.42; this.rollDir = this.moveX || this.facing; Audio.play('whoosh'); const g = this.gun; if (g && g.def.reloadType === 'shell') g.cancelReload(); }
    const [mx, my] = lv.toWorld(I.mx, I.my);
    this.aimX = mx; this.aimY = my;
    if (this.roll <= 0 && !this.melee) this.facing = mx >= this.x ? 1 : -1;
    const S = this.J ? [this.J.neck[0], this.J.neck[1] + 5] : [this.x, this.y - 70];
    this.aimAng = Math.atan2(my - S[1], mx - S[0]);
    const g = this.gun;
    this.wantFire = g && (g.def.auto ? I.mdown : I.mclick);
    this.wantAutoReload = I.mdown;
    if (g && g.reload && I.mclick && g.def.reloadType === 'shell' && g.mag > 0) g.cancelReload();
    if (I.hit('KeyR') && g) { if (g.startReload(this)) { } else if (g.mag < g.def.mag && this.reserve(g.def.ammo) <= 0) lv.toast('No ' + AMMO_NAMES[g.def.ammo] + ' ammo left'); }
    if (I.hit('KeyF') || I.rclick) { if (this.melee) this.queued = true; else this.startMelee(lv); }
    // weapon switching
    const keys = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'];
    keys.forEach((k, i) => { if (I.hit(k) && i < this.guns.length && i !== this.gi) this.switchGun(i); });
    if (I.wheel && this.guns.length > 1) this.switchGun((this.gi + (I.wheel > 0 ? 1 : -1) + this.guns.length) % this.guns.length);
    if (I.hit('KeyQ') && this.guns.length > 1) this.switchGun(this._lastGi !== undefined && this._lastGi < this.guns.length ? this._lastGi : (this.gi + 1) % this.guns.length);
    if (I.hit('KeyG')) { if (st.bangs > 0) { st.bangs--; lv.throwItem(this, 'bang', mx, my); } else lv.toast('No Bang Crystals'); }
    if (I.hit('KeyV')) { if (st.molotovs > 0) { st.molotovs--; lv.throwItem(this, 'molotov', mx, my); } else lv.toast('No Molotovs'); }
    if (I.hit('KeyH')) { if (st.medkits > 0 && this.hp < this.maxHp) { st.medkits--; this.hp = Math.min(this.maxHp, this.hp + 60); Audio.play('pickup'); lv.toast('+60 HP'); } else if (st.medkits <= 0) lv.toast('No medkits'); }
  }
  switchGun(i) { const g = this.gun; if (g && g.reload) { g.reload = null; g.carry = null; g.magIn = true; g.slide = 0; g.cyl = 0; g.cover = 0; } this._lastGi = this.gi; this.gi = i; Audio.play('clank', 0, 0.4); }
  cineControl(dt, lv) {
    this.cineT = (this.cineT || 0) + dt; if (this.cineT > 9) { this.cine = null; this.cineLower = false; this.cineT = 0; return; }
    const dx = this.cine - this.x;
    if (Math.abs(dx) < 6) { this.moveX = 0; this.cine = null; this.cineLower = false; this.cineT = 0; return; }
    else { this.moveX = sign(dx) * (this.cineWalk ? 0.45 : 0.8); this.facing = sign(dx); if (this.blocked && this.onGround) this.wantJump = true; }
    this.aimAng = this.facing > 0 ? 0.6 : PI - 0.6; this.wantFire = false; this.cineLower = true;
  }
  startMelee(lv) {
    if (this.meleeCd > 0 && !this.melee) return;
    const g = this.gun;
    if (g && g.melee) { this.melee = { t: 0, dur: g.def.rate, armed: true, kind: 'swing', hit: false }; this.meleeCd = g.def.rate + 0.3; Audio.play('whoosh', this.pan(), this.vol()); return; }
    if (g && g.reload && g.def.reloadType === 'shell') g.cancelReload();
    const kinds = ['jab', 'cross', 'kick'];
    const kind = kinds[this.combo % 3]; this.combo++;
    this.melee = { t: 0, dur: kind === 'kick' ? 0.42 : 0.26, kind, hit: false };
    this.meleeCd = 0.15; Audio.play('whoosh', this.pan(), this.vol() * 0.7);
  }
  meleeStrike(lv) {
    const m = this.melee, f = this.facing;
    const reach = m.armed ? this.gun.def.reach : m.kind === 'kick' ? 64 : 54;
    const dmg = m.armed ? this.gun.def.dmg : m.kind === 'kick' ? 30 : m.kind === 'cross' ? 22 : 16;
    let hitAny = false;
    for (const a of lv.actors) {
      if (!a.alive || a === this || a.team === this.team || a.downed > 0 || (a.team === 'ally' && this.team === 'player') || (a.team === 'player' && this.team === 'ally')) continue;
      const dx = (a.x - this.x) * f;
      if (dx > -8 && dx < reach + 14 && Math.abs(a.y - this.y) < 70) {
        if (a.roll > 0) continue;
        hitAny = true;
        const hp = [a.x - f * 8, a.y - (m.kind === 'kick' ? 55 : 72)];
        let mul = this.team === 'enemy' && a.team !== 'enemy' ? 0.7 : 1;
        if (this.isPlayer() && a.ai.state === 'idle' && !a.boss) { mul = 8; lv.toast('Takedown'); }
        a.hurt(dmg * mul * (this.isPlayer() ? 1 + (Game.state.upgrades.fists ? 0.5 : 0) : 1), { kind: 'melee', x: hp[0], y: hp[1], dx: f, dy: -0.2, knock: m.kind === 'kick' ? 520 : 220, from: this }, lv);
        if (a.alive) { a.stagger = m.kind === 'kick' ? 0.55 : 0.3; a.vx = f * (m.kind === 'kick' ? 360 : 140); if (m.kind === 'kick') a.vy = -200; const ag = a.gun; if (ag && ag.reload) { ag.reload = null; ag.carry = null; ag.magIn = true; } }
      }
    }
    // melee also smashes barrels
    for (const b of lv.barrels) if (b.alive && Math.abs(b.x - (this.x + f * 40)) < 40 && Math.abs(b.y - this.y) < 30) { lv.hitBarrel(b, 40); hitAny = true; }
    if (hitAny) { Audio.play('punch', this.pan(), this.vol()); lv.shake(m.kind === 'kick' || m.armed ? 6 : 3); lv.hitstop = m.kind === 'kick' ? 0.07 : 0.035; }
  }
  tryFire(lv) {
    const g = this.gun, d = g.def;
    if (g.cd > 0 || g.pumpT > 0) return;
    if (g.reload) { if (d.reloadType === 'shell' && g.mag > 0) g.cancelReload(); else return; }
    if (g.mag <= 0) { g.cd = 0.25; Audio.play('dry', this.pan(), this.vol()); if (this.isPlayer() && this.reserve(d.ammo) <= 0) lv.toast('Out of ' + AMMO_NAMES[d.ammo] + ' ammo'); g.startReload(this); return; }
    g.mag--; g.cd = d.rate * (this.team === 'enemy' ? 1.15 : 1);
    const muzzle = this.L2W(d.muzzle[0], d.muzzle[1]);
    // make sure we're not shooting through a wall right next to us
    const S = [this.J.neck[0], this.J.neck[1] + 5];
    const spreadMul = (this.crouching ? 0.55 : 1) * (this.onGround ? 1 : 1.6) * (Math.abs(this.vx) > 40 ? 1.25 : 1);
    let baseA = this.gAng;
    if (this.team !== 'player') baseA += rand(-1, 1) * (this.arch.acc || 0.06);
    const fireRounds = this.isPlayer() && d.ammo === '12ga' && Game.state.upgrades.dragon;
    for (let i = 0; i < d.bullets; i++) {
      const a = baseA + rand(-1, 1) * d.spread * spreadMul;
      const spd = d.speed * (this.team === 'enemy' ? 0.62 : 1) * rand(0.95, 1.05);
      lv.bullets.push({ x: S[0], y: S[1], sx: muzzle[0], sy: muzzle[1], vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, dmg: d.dmg * (this.team === 'enemy' ? (this.boss ? 0.42 : 0.4) * (d.bullets > 1 ? 0.6 : 1) : this.team === 'ally' ? 1.4 : 1) * (this.isPlayer() && Game.state.upgrades.hollow ? 1.2 : 1), team: this.team, owner: this, life: 0.9, pierce: d.pierce || 0, fire: fireRounds, knock: d.knock / d.bullets, travelled: 0, shotgun: d.bullets > 1, hitSet: new Set() });
    }
    lv.fx.muzzle(muzzle[0], muzzle[1], this.gAng, d.bullets > 1 ? 1.5 : d.heavy ? 1.3 : 1, fireRounds);
    if (d.reloadType !== 'shell' && d.reloadType !== 'revolver') lv.fx.casing(this.L2W(d.eject[0], d.eject[1]), this.f);
    if (d.reloadType === 'shell') { g.pumpT = 0.36; g._pumpSnd = false; g.cd = Math.max(g.cd, 0.4); }
    g.slide = 1; g.flash = 0.05;
    this.kick = Math.min(0.5, this.kick + d.recoil);
    if (this.isPlayer()) { lv.shake(d.shake); Game.state.stats.shots++; }
    Audio.play(d.sound, this.pan(), this.vol());
    lv.noise(this.x, this.team);
  }

  aiControl(dt, lv) {
    const ai = this.ai, A = this.arch;
    this.wantFire = false; this.moveX = 0; this.crouching = false;
    if (this.passive) return;
    if (this.team === 'ally') return this.allyControl(dt, lv);
    const tgt = lv.nearestHostile(this) || (this.ai.state === 'alert' ? lv.nearestHostile(this, 1e9) : null);
    if (!tgt) { this.aimAng = this.facing > 0 ? 0.3 : PI - 0.3; return; }
    const dx = tgt.x - this.x, d = Math.abs(dx);
    const eye = [this.x, this.y - 78 + this.crouch * 18]; let tc = tgt.center();
    let los = d < 1100 && lv.los(eye[0], eye[1], tc[0], tc[1]);
    if (!los && d < 1100) { const h = tgt.headPos(); if (lv.los(eye[0], eye[1], h[0], h[1] + 4)) { los = true; tc = [h[0], h[1] + 6]; } }
    if (ai.state === 'idle') {
      if (ai.patrol) { ai.t += dt; this.moveX = Math.sin(ai.t * 0.6) > 0 ? 0.35 : -0.35; this.facing = sign(this.moveX); if (Math.abs(this.x - ai.home) > ai.patrol) this.moveX = sign(ai.home - this.x) * 0.35; }
      this.aimAng = this.facing > 0 ? 0.5 : PI - 0.5;
      const sight = lv.def.stealth ? 430 : 760, close = lv.def.stealth ? 110 : 260;
      if ((los && d < sight && sign(dx) === this.facing) || (los && d < close) || ai.heard) { ai.react -= dt; if (ai.react <= 0) { this.alert(lv); } }
      return;
    }
    // burning: panic
    if (this.burn > 0 && !this.boss) { this.moveX = Math.sin(lv.time * 3 + this.x) > 0 ? 1 : -1; this.facing = this.moveX; return; }
    this.facing = dx >= 0 ? 1 : -1;
    const g = this.gun;
    if (A.melee || (g && g.melee)) {
      const reach = g ? g.def.reach : 50;
      if (d > reach * 0.8) this.moveX = sign(dx);
      if (this.blocked && this.onGround && Math.random() < 0.08) this.wantJump = true;
      if (d < reach + 6 && Math.abs(tgt.y - this.y) < 60 && !this.melee && this.meleeCd <= 0) this.startMelee(lv);
      // boss charge
      if (this.kind === 'marco' && !this.melee && d > 260 && (ai.chargeCd = (ai.chargeCd || 3) - dt) <= 0) { ai.chargeCd = rand(3, 5); this.vx = sign(dx) * 760; this.vy = -380; this.onGround = false; Audio.play('whoosh'); lv.banter(null, ''); }
      this.aimAng = this.facing > 0 ? 0 : PI;
      return;
    }
    // aim: track target with lag and error
    ai.aimErrX = lerp(ai.aimErrX, rand(-1, 1) * 30, dt * 2); ai.aimErrY = lerp(ai.aimErrY, rand(-1, 1) * 22, dt * 2);
    const aimY = tc[1] - (Math.random() < 0.15 ? 18 : 0) + ai.aimErrY;
    const want = Math.atan2(aimY - (this.y - 70), tc[0] + ai.aimErrX - this.x);
    this.aimAng += angDiff(this.aimAng, want) * Math.min(1, dt * 7);
    // movement
    const [dmin, dmax] = A.dist || [250, 500];
    ai.strafeT -= dt;
    if (ai.strafeT <= 0) { ai.strafeT = rand(0.8, 2.2); ai.strafe = Math.random() < 0.45 ? choose([-1, 1]) * 0.6 : 0; ai.crouch = Math.random() < (this.boss ? 0.1 : 0.3); }
    if (!los) this.moveX = sign(dx) * 0.9;
    else if (d > dmax) this.moveX = sign(dx);
    else if (d < dmin) this.moveX = -sign(dx) * 0.7;
    else { this.moveX = ai.strafe; this.crouching = ai.crouch && this.onGround; }
    if (this.blocked && this.onGround && !los && Math.random() < 0.02) this.wantJump = true;
    if (this.blocked && los) this.moveX = 0;
    // keep a little spacing from friends
    for (const o of lv.actors) if (o !== this && o.alive && o.team === this.team && !o.mounted && Math.abs(o.x - this.x) < 38 && Math.abs(o.y - this.y) < 40) { this.moveX = clamp(this.moveX + (this.x >= o.x ? 0.6 : -0.6), -1, 1); break; }
    if (g && g.reload) { this.moveX = -sign(dx) * 0.5; this.crouching = true; }
    // shooting
    if (los && g && !g.reload && d < 1000) {
      ai.pause -= dt;
      if (ai.pause <= 0) {
        if (g.def.auto) { this.wantFire = true; ai.burst -= dt; if (ai.burst <= 0) { ai.burst = rand(0.25, 0.6) * (this.boss ? 1.7 : 1); ai.pause = rand(0.8, 1.7) * (this.boss ? 0.6 : 1); } }
        else { this.wantFire = true; ai.pause = rand(0.75, 1.5) * (this.boss ? 0.5 : 1) * (g.def.reloadType === 'shell' ? 1.15 : 1); }
      }
    }
    // boss specials
    if (this.kind === 'rafa' && (ai.dashCd = (ai.dashCd || 4) - dt) <= 0) { ai.dashCd = rand(3, 5); this.roll = 0.42; this.rollDir = choose([-1, 1]); }
    if (this.kind === 'dutch' && this.hp < this.maxHp * 0.5 && !ai.enraged) { ai.enraged = true; this.arch = Object.assign({}, A, { speed: 170 }); lv.banter('dutch', 'You think a little lead scares me, boy?!'); }
  }
  allyControl(dt, lv) {
    const ai = this.ai, p = lv.player;
    this.wantFire = false; this.crouching = false;
    const enemy = lv.nearestHostile(this, 1300);
    let los = false, tc = null;
    if (enemy) {
      const eye = [this.x, this.y - 78]; tc = enemy.center(); los = lv.los(eye[0], eye[1], tc[0], tc[1]);
      if (!los) { const h = enemy.headPos(); if (lv.los(eye[0], eye[1], h[0], h[1] + 4)) { los = true; tc = [h[0], h[1] + 6]; } }
    }
    if (p) {
      // stay with Jace; step up beside him when cover blocks the shot; back away from anyone with a bat
      let goal = p.x - p.facing * 100;
      if (enemy && !los) goal = p.x + sign(enemy.x - p.x) * 30;
      if (enemy && (enemy.arch.melee || (enemy.gun && enemy.gun.melee)) && Math.abs(enemy.x - this.x) < 150) goal = this.x - sign(enemy.x - this.x) * 220;
      const dx = goal - this.x;
      this.moveX = Math.abs(dx) > 40 ? sign(dx) * (Math.abs(dx) > 240 ? 1 : 0.65) : 0;
      if (this.blocked && this.onGround) this.wantJump = true;
      if (Math.abs(p.x - this.x) > 1100) { this.x = p.x - p.facing * 160; this.y = p.y; this.vy = 0; }
    }
    if (enemy) {
      this.facing = enemy.x >= this.x ? 1 : -1;
      const want = Math.atan2(tc[1] - (this.y - 70), tc[0] - this.x);
      this.aimAng += angDiff(this.aimAng, want) * Math.min(1, dt * 10);
      ai.pause -= dt;
      const g = this.gun;
      if (los && g && !g.reload && ai.pause <= 0 && Math.abs(angDiff(this.aimAng, want)) < 0.3) { this.wantFire = true; ai.pause = rand(0.28, 0.55); }
      this.bangCd -= dt;
      const bangsOk = Game.state.walterBangs || Game.state.chapter >= 1;
      if (this.bangCd <= 0 && bangsOk && lv.countHostilesNear(enemy.x, 260) >= 2 && Math.abs(enemy.x - this.x) < 650 && Math.abs(enemy.x - p.x) > 170) {
        this.bangCd = rand(14, 20); lv.throwItem(this, 'bang', enemy.x, enemy.y - 40);
        lv.banter('walter', choose(['Stand back.', 'Chemistry, gentlemen.', 'Let me handle this.', 'Fire in the hole!']));
      }
    } else { this.bangCd = Math.min(this.bangCd, 8); this.facing = p ? (p.x >= this.x ? 1 : -1) : this.facing; this.aimAng = this.facing > 0 ? 0.6 : PI - 0.6; }
  }
  alert(lv) {
    if (this.ai.state === 'alert') return;
    this.ai.state = 'alert'; this.ai.pause = rand(0.6, 1.3) * (this.boss ? 0.5 : 1);
    if (Math.random() < 0.25 && this.team === 'enemy' && !this.boss) lv.shout(this, choose(['There he is!', 'Get him!', '¡Ahí está!', 'Light him up!', 'Over here!', 'Kill that punk!']));
  }

  hurt(dmg, o, lv) {
    if (!this.alive) return false;
    if (this.invuln && this.team !== 'enemy' && this.id === 'walter') { if (this.downed > 0) return false; }
    if (this.roll > 0 && o.kind === 'bullet' && this.isPlayer()) return false;
    if (this.downed > 0) return false;
    if (this.isPlayer() && Game.cheatGod) dmg = 0;
    if (this.isPlayer()) {
      if (this.iframes > 0) return false;
      dmg *= Game.diffMul();
      if (o.kind === 'fire') dmg *= 0.5;
      if (o.kind === 'bullet') dmg = Math.min(dmg, 20); else if (o.kind === 'melee') dmg = Math.min(dmg, 22);
      // burst limiter: past ~35 damage in a short window, extra damage is mostly soaked (no instant shredding)
      const allowed = Math.max(0, 35 - this.burstDmg); dmg = Math.min(dmg, allowed) + Math.max(0, dmg - allowed) * 0.15;
      this.burstDmg += dmg;
    }
    if (this.team === 'ally' && o.kind !== 'fire') dmg *= 0.5;
    let absorbed = 0;
    if (this.armor > 0 && o.kind !== 'fire') { absorbed = Math.min(this.armor, dmg * 0.65); this.armor -= absorbed; }
    if (this.isPlayer()) Game.state.armor = this.armor;
    const real = dmg - absorbed;
    this.hp -= real; if (o.kind !== 'fire') this.hurtFlash = 0.1; this.hurtT = 0;
    if (o.kind === 'fire' && this.burn <= 0 && o.ignite !== false) this.burn = 3;
    if (o.ignite) this.burn = 3.5;
    if (this.team === 'enemy') { this.alert(lv); this.ai.react = 0; }
    if (this.isPlayer()) { lv.hurtVignette = Math.max(lv.hurtVignette, o.kind === 'fire' ? 0.3 : 0.6); if (o.kind !== 'fire' || Math.random() < 0.3) Audio.play('hurt'); if (o.kind !== 'fire') lv.shake(4); }
    if (o.kind !== 'fire') {
      const bl = o.kind === 'melee' ? 8 : o.head ? 22 : 12;
      if (absorbed > real) lv.fx.spark(o.x, o.y, 6, -(o.dx || 0), -(o.dy || 0), '#ddd');
      else lv.fx.blood(o.x, o.y, o.dx || 0, o.dy || 0, bl, 0.6);
    }
    if (this.isPlayer() && this.hp <= 0 && this.lastStandCd <= 0 && !Game.cheatGod) { this.hp = 1; this.iframes = 1.5; this.lastStandCd = 20; this.hurtT = 0; lv.toast('CLOSE CALL!'); lv.slowmo = 0.45; }
    if (this.hp <= 0) {
      if (this.id === 'walter' || this.invuln) { this.hp = 0; this.downed = 5; this.burn = 0; this.melee = null; lv.banter('walter', choose(['Agh! I\'m hit!', 'Jace! I\'m down!', 'Ngh... give me a moment...'])); return false; }
      this.die(o, lv); return true;
    }
    return false;
  }
  die(o, lv) {
    this.alive = false;
    if (this.mounted) { this.vx = this.mounted.vx; this.vy = -200; }
    const rd = new Ragdoll(this, o, lv);
    lv.ragdolls.push(rd); if (lv.ragdolls.length > 40) lv.ragdolls.shift();
    lv.onDeath(this, o);
  }
}

// ---------- verlet ragdoll ----------
const RD_NAMES = ['head', 'neck', 'pelvis', 'eF', 'hF', 'eB', 'hB', 'kF', 'fF', 'kB', 'fB'];
const RD_STICKS = [[0, 1, 'head'], [1, 2], [1, 3, 'armF'], [3, 4], [1, 5, 'armB'], [5, 6], [2, 7, 'legF'], [7, 8], [2, 9, 'legB'], [9, 10], [0, 2, 'head'], [3, 2, 'armF', 0.4], [5, 2, 'armB', 0.4]];
class Ragdoll {
  constructor(a, o, lv) {
    this.look = a.look; this.f = a.f; this.t = 0; this.cut = {}; this.burn = a.burn; this.isPlayer = a.isPlayer();
    this.gunKey = a.gun && !a.gun.melee ? a.gun.key : null;
    const J = a.J; this.pts = RD_NAMES.map(n => { const p = J[n]; return { x: p[0], y: p[1], ox: p[0] - a.vx / 60, oy: p[1] - a.vy / 60 }; });
    this.sticks = RD_STICKS.map(([i, j, tag, stiff]) => ({ i, j, tag, stiff: stiff || 1, len: Math.hypot(this.pts[i].x - this.pts[j].x, this.pts[i].y - this.pts[j].y) }));
    // impulse from the killing blow
    const k = (o.knock || 150) / 60, dx = o.dx || 0, dy = o.dy || 0;
    const hit = o.head ? 0 : o.kind === 'melee' ? 1 : 2;
    this.push(hit, dx * k * 1.6, dy * k * 1.6 - 1);
    for (const p of this.pts) { p.ox -= dx * k * 0.4; p.oy -= (dy * k * 0.4 - 1.5); }
    // gore: headshots by heavy rounds pop heads, blasts remove limbs
    const gore = Settings.gore;
    if (gore >= 2) {
      if (o.head && (o.power || 0) >= 60) this.sever('head', lv, dx, dy);
      if (o.kind === 'blast' && o.close) { for (const part of ['armF', 'armB', 'legF', 'legB', 'head']) if (Math.random() < 0.45) this.sever(part, lv, dx, dy); lv.fx.gib(a.x, a.y - 50, dx * 300, -300, 8); }
      if (o.shotgunClose && Math.random() < 0.6) this.sever(choose(['armF', 'head', 'armB']), lv, dx, dy);
    }
    this.pool = 0; this.spurt = o.head ? 1.6 : 0.8;
  }
  push(i, vx, vy) { const p = this.pts[i]; p.ox -= vx; p.oy -= vy; }
  sever(part, lv, dx = 0, dy = 0) {
    if (this.cut[part]) return; this.cut[part] = true;
    const idx = { head: 0, armF: 3, armB: 5, legF: 7, legB: 9 }[part];
    const p = this.pts[idx]; p.ox -= dx * 6 + rand(-3, 3); p.oy -= dy * 6 + 6;
    if (part === 'head') { this.pts[0].ox -= rand(-4, 4); }
    lv.fx.blood(p.x, p.y, dx, -0.5, 26, 1.4, 1.2);
    this.spurt = 2.2; this.spurtFrom = part === 'head' ? 1 : part.startsWith('arm') ? 1 : 2;
    Audio.play('splat');
  }
  update(dt, lv) {
    this.t += dt;
    if (this.burn > 0) { this.burn -= dt; if (Math.random() < 0.6) lv.fx.flame(this.pts[2].x + rand(-15, 15), this.pts[2].y - 6, 1, 9); }
    if (this.spurt > 0 && Settings.gore > 0) { this.spurt -= dt; if (Math.random() < 0.5) { const p = this.pts[this.spurtFrom || 1]; lv.fx.blood(p.x, p.y, rand(-0.5, 0.5), -1, 2, 0.5, 0.6); } }
    if (this.t > 12) return; // settled; stop simulating
    const g = 1500 * dt * dt;
    for (const p of this.pts) {
      const vx = (p.x - p.ox) * 0.985, vy = (p.y - p.oy) * 0.985;
      p.ox = p.x; p.oy = p.y; p.x += vx; p.y += vy + g;
    }
    for (let it = 0; it < 6; it++) {
      for (const s of this.sticks) {
        if (s.tag && this.cut[s.tag]) continue;
        const a = this.pts[s.i], b = this.pts[s.j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001;
        if (s.stiff < 1 && d > s.len * 0.75 && d < s.len * 1.25) continue;
        const diff = (d - s.len) / d * 0.5 * s.stiff;
        a.x += dx * diff; a.y += dy * diff; b.x -= dx * diff; b.y -= dy * diff;
      }
      for (let k = 0; k < this.pts.length; k++) {
        const p = this.pts[k], r = k === 0 ? 10 : 4;
        if (p.y > GROUND - r) { p.y = GROUND - r; const vx = p.x - p.ox; p.ox = p.x - vx * 0.7; }
        for (const s of lv.solids) {
          if (s.dead || s.oneway && p.oy > s.y) continue;
          if (p.x > s.x && p.x < s.x + s.w && p.y > s.y - r && p.y < s.y + s.h) {
            if (p.oy <= s.y - r + 2) { p.y = s.y - r; const vx = p.x - p.ox; p.ox = p.x - vx * 0.7; }
            else if (!s.oneway) { if (p.ox < s.x) p.x = s.x; else if (p.ox > s.x + s.w) p.x = s.x + s.w; }
          }
        }
        p.x = clamp(p.x, lv.minX, lv.maxX);
      }
    }
    // pooling blood under the body once it settles
    const pel = this.pts[2];
    if (this.t > 0.8 && this.t < 6 && pel.y > GROUND - 14 && Settings.gore > 0) {
      this.pool += dt; if (this.pool > 0.25) { this.pool = 0; lv.fx.decalBlood(pel.x + rand(-10, 10), GROUND + 2, 8 + this.t * 3); }
    }
  }
  draw(c) {
    const P = this.pts, J = {};
    RD_NAMES.forEach((n, i) => J[n] = [P[i].x, P[i].y]);
    const hx = P[0].x - P[1].x, hy = P[0].y - P[1].y;
    J.headAng = (Math.atan2(hy, hx) + PI / 2) * this.f;
    const flip = (P[2].x - P[1].x) * this.f;
    drawFigure(c, J, this.look, this.f, { cut: this.cut, noHood: false, burning: this.burn > 0 });
    // severed pieces
    if (this.cut.head) drawHead(c, P[0].x, P[0].y, this.look, this.f, this.t * 3 % TAU * 0 + J.headAng, {});
    const b = this.look.build || 1;
    if (this.cut.armF) { limb(c, P[3].x, P[3].y, P[4].x, P[4].y, 8 * b, this.look.jacket || this.look.shirt); dot(c, P[4].x, P[4].y, 4.5, this.look.skin); dot(c, P[3].x, P[3].y, 3, '#8a0f0f', false); }
    if (this.cut.armB) { limb(c, P[5].x, P[5].y, P[6].x, P[6].y, 8 * b, shade(this.look.jacket || this.look.shirt, -0.2)); dot(c, P[6].x, P[6].y, 4.5, this.look.skin); dot(c, P[5].x, P[5].y, 3, '#8a0f0f', false); }
    if (this.cut.legF) { limb(c, P[7].x, P[7].y, P[8].x, P[8].y, 9.5 * b, this.look.pants); dot(c, P[7].x, P[7].y, 3.5, '#8a0f0f', false); }
    if (this.cut.legB) { limb(c, P[9].x, P[9].y, P[10].x, P[10].y, 9.5 * b, shade(this.look.pants, -0.2)); dot(c, P[9].x, P[9].y, 3.5, '#8a0f0f', false); }
  }
}
