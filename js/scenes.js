'use strict';
// ============================================================
//  FIXING GOOD - scenes: loading, menu, hub, shops, trade, cook,
//  missions, results, ending
// ============================================================
const FONT = '"Oswald", Impact, "Arial Narrow", sans-serif';
const UI = {
  lastHover: null,
  btn(c, x, y, w, h, label, o = {}) {
    const hover = !o.disabled && Input.mx >= x && Input.mx <= x + w && Input.my >= y && Input.my <= y + h;
    if (hover && this.lastHover !== label + x + y) { this.lastHover = label + x + y; Audio.play('ui', 0, 0.35); }
    c.save();
    c.fillStyle = o.disabled ? 'rgba(40,40,40,.6)' : hover ? (o.hot || '#3d7a3a') : (o.bg || 'rgba(20,22,18,.82)'); rrect(c, x, y, w, h, 6); c.fill();
    c.strokeStyle = o.disabled ? 'rgba(255,255,255,.08)' : hover ? '#9fe88a' : (o.border || 'rgba(255,230,160,.3)'); c.lineWidth = 2; c.stroke();
    c.fillStyle = o.disabled ? '#666' : '#f4ecd8'; c.font = `${o.bold === false ? '' : 'bold '}${o.size || 18}px ${FONT}`; c.textAlign = o.align || 'center'; c.textBaseline = 'middle';
    c.fillText(label, o.align === 'left' ? x + 16 : x + w / 2, y + h / 2 + 1);
    if (o.sub) { c.font = `12px ${FONT}`; c.fillStyle = o.disabled ? '#555' : '#c8bfa8'; c.fillText(o.sub, o.align === 'left' ? x + 16 : x + w / 2, y + h - 12); }
    c.restore();
    if (hover && Input.mclick) { Input.mclick = false; Audio.play('uiok'); return true; }
    return false;
  },
  cursor(c) { c.save(); c.translate(Input.mx, Input.my); c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 17); c.lineTo(4.5, 13); c.lineTo(8, 20); c.lineTo(11, 18.5); c.lineTo(7.5, 12); c.lineTo(13, 12); c.closePath(); c.fill(); c.stroke(); c.restore(); },
  panel(c, x, y, w, h, a = 0.85) { c.fillStyle = `rgba(12,12,10,${a})`; rrect(c, x, y, w, h, 10); c.fill(); c.strokeStyle = 'rgba(255,230,160,.22)'; c.lineWidth = 2; c.stroke(); },
  text(c, t, x, y, size = 18, col = '#f4ecd8', align = 'left', bold = false) { c.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`; c.fillStyle = col; c.textAlign = align; c.fillText(t, x, y); c.textAlign = 'left'; },
};

// periodic-table style logo: [Fi]xing [Go]od
function drawElementTile(c, x, y, s, sym, num, mass) {
  const g = c.createLinearGradient(x, y, x + s, y + s); g.addColorStop(0, '#2f7a2a'); g.addColorStop(1, '#174a14');
  c.fillStyle = g; c.fillRect(x, y, s, s); c.strokeStyle = '#d8f0c8'; c.lineWidth = Math.max(2, s / 40); c.strokeRect(x, y, s, s);
  c.fillStyle = '#e8f8e0'; c.font = `bold ${s * 0.18}px ${FONT}`; c.textAlign = 'left'; c.fillText(num, x + s * 0.08, y + s * 0.22);
  c.font = `${s * 0.12}px ${FONT}`; c.textAlign = 'right'; c.fillText(mass, x + s * 0.92, y + s * 0.92);
  c.font = `bold ${s * 0.62}px ${FONT}`; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(sym, x + s * 0.5, y + s * 0.78); c.textAlign = 'left';
}
function drawLogo(c, x, y, s = 1, glow = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (glow) { c.shadowColor = 'rgba(120,255,100,' + glow + ')'; c.shadowBlur = 30; }
  drawElementTile(c, 0, 0, 110, 'Fi', '9', '18.998'); c.shadowBlur = 0;
  c.font = `bold 92px ${FONT}`; c.fillStyle = '#f2f2ea'; c.fillText('xing', 118, 92);
  if (glow) { c.shadowColor = 'rgba(120,255,100,' + glow + ')'; c.shadowBlur = 30; }
  drawElementTile(c, 150, 118, 110, 'Go', '79', '196.97'); c.shadowBlur = 0;
  c.font = `bold 92px ${FONT}`; c.fillStyle = '#f2f2ea'; c.fillText('od', 268, 210);
  c.restore();
}
function smokeField(n, seed) { const r = srand(seed); return Array.from({ length: n }, () => ({ x: r() * W, y: r() * H, s: 40 + r() * 120, v: 6 + r() * 16, a: 0.03 + r() * 0.06 })); }
function drawSmoke(c, field, dt, col = '200,220,200') { for (const p of field) { p.x += p.v * dt; p.y -= p.v * 0.3 * dt; if (p.x > W + p.s) { p.x = -p.s; } if (p.y < -p.s) p.y = H + p.s; const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s); g.addColorStop(0, `rgba(${col},${p.a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(p.x - p.s, p.y - p.s, p.s * 2, p.s * 2); } }

// ---------------------------------------------------------------- LOADING
class LoadingScene {
  constructor() {
    this.steps = buildThemes(); this.i = 0; this.t = 0; this.p = 0; this.ready = false; this.smoke = smokeField(26, 4); this.fontsOk = false;
    this.labels = ['Measuring reagents', 'Polishing the RV', 'Cleaning Walter\'s glasses', 'Loading the desert', 'Counting cash', 'Painting the mesas', 'Hiding from the DEA', 'Sharpening the plot', 'Teaching Jace chemistry', 'Calibrating gunfire', 'Spilling blood (fake)', 'Rolling credits'];
    this.tips = ['TIP: Shotguns load one shell at a time. Click to fire mid-reload.', 'TIP: Headshots deal 2.6× damage. Armored enemies hate them.', 'TIP: Shoot red barrels. Walter says it\'s "basic thermodynamics."', 'TIP: Roll with Shift to dodge bullets.', 'TIP: Higher purity means buyers pay more. Nail the cook minigame.', 'TIP: Undercover cops ask too many questions. Heat attracts trouble.', 'TIP: Sneak up on guards who haven\'t seen you for a one-punch takedown.'];
    this.tip = choose(this.tips);
    if (document.fonts && document.fonts.load) { Promise.race([document.fonts.load('bold 40px Oswald'), new Promise(r => setTimeout(r, 2500))]).then(() => this.fontsOk = true, () => this.fontsOk = true); } else this.fontsOk = true;
  }
  update(dt) {
    this.t += dt;
    if (this.i < this.steps.length) { if (this.t > 0.25 + this.i * 0.22) { const [name, fn] = this.steps[this.i]; THEMES[name] = fn(); this.i++; } }
    const target = (this.i / this.steps.length) * (this.fontsOk ? 1 : 0.92);
    this.p = Math.min(target, this.p + dt * 0.5);
    if (this.p >= 0.999 && this.i >= this.steps.length) this.ready = true;
    if (this.ready && (DEV.has('level') || DEV.has('scene'))) return devStart();
    if (this.ready && Input.anyKey) { Audio.unlock(); Game.setScene(new MenuScene()); }
  }
  draw(c) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05080a'); g.addColorStop(1, '#0d1a10'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    drawSmoke(c, this.smoke, 1 / 60, '120,200,140');
    const glow = 0.3 + Math.sin(this.t * 2) * 0.15;
    drawLogo(c, W / 2 - 190, 150, 1, glow);
    UI.text(c, 'A DESERT CRIME STORY', W / 2, 410, 16, '#9fc890', 'center');
    // bar
    const bw = 520, bx = (W - bw) / 2, by = 500;
    c.fillStyle = '#111'; c.fillRect(bx, by, bw, 10); c.strokeStyle = '#2f5a2a'; c.lineWidth = 1; c.strokeRect(bx - 1, by - 1, bw + 2, 12);
    const bar = c.createLinearGradient(bx, 0, bx + bw, 0); bar.addColorStop(0, '#2f7a2a'); bar.addColorStop(1, '#7fd8f0'); c.fillStyle = bar; c.fillRect(bx, by, bw * this.p, 10);
    // crystal tip on the bar
    c.fillStyle = '#bff4ff'; c.beginPath(); const cx = bx + bw * this.p; c.moveTo(cx, by - 6); c.lineTo(cx + 6, by + 5); c.lineTo(cx, by + 16); c.lineTo(cx - 6, by + 5); c.closePath(); c.fill();
    const label = this.ready ? 'Ready' : this.labels[Math.min(this.labels.length - 1, Math.floor(this.p * this.labels.length))] + '...';
    UI.text(c, label, bx, by + 36, 15, '#aaa');
    UI.text(c, Math.round(this.p * 100) + '%', bx + bw, by + 36, 15, '#aaa', 'right');
    UI.text(c, this.tip, W / 2, 640, 16, '#d8d0b8', 'center');
    if (this.ready) { c.globalAlpha = 0.55 + Math.sin(this.t * 4) * 0.45; UI.text(c, 'PRESS ANY KEY', W / 2, 580, 24, '#fff', 'center', true); c.globalAlpha = 1; }
    UI.text(c, 'v1.0', W - 20, H - 16, 12, '#555', 'right');
  }
}

// ---------------------------------------------------------------- SETTINGS / CONTROLS overlays
function drawSettings(c, close) {
  UI.panel(c, W / 2 - 260, 140, 520, 430, 0.95);
  UI.text(c, 'SETTINGS', W / 2, 190, 30, '#fff', 'center', true);
  const row = (y, label, val, fn) => { UI.text(c, label, W / 2 - 220, y + 28, 18, '#ddd'); if (UI.btn(c, W / 2 + 40, y, 180, 42, val)) fn(); };
  row(220, 'Sound volume', Math.round(Settings.volume * 100) + '%', () => { Settings.volume = (Settings.volume + 0.2) > 1.01 ? 0 : Settings.volume + 0.2; Audio.applyVolume(); });
  row(272, 'Music volume', Math.round(Settings.music * 100) + '%', () => { Settings.music = (Settings.music + 0.25) > 1.01 ? 0 : Settings.music + 0.25; Audio.applyVolume(); });
  row(324, 'Screen shake', Settings.shake ? 'ON' : 'OFF', () => Settings.shake = Settings.shake ? 0 : 1);
  row(376, 'Blood & gore', ['OFF', 'LOW', 'FULL'][Settings.gore], () => Settings.gore = (Settings.gore + 1) % 3);
  if (Game.state) row(428, 'Difficulty', Game.state.difficulty.toUpperCase(), () => { const d = ['easy', 'normal', 'hard']; Game.state.difficulty = d[(d.indexOf(Game.state.difficulty) + 1) % 3]; });
  if (UI.btn(c, W / 2 - 90, 500, 180, 46, 'BACK') || Input.hit('Escape')) { store('settings', Settings); close(); }
}
function drawControls(c, close) {
  UI.panel(c, W / 2 - 340, 90, 680, 540, 0.95);
  UI.text(c, 'CONTROLS', W / 2, 140, 30, '#fff', 'center', true);
  const rows = [['A / D', 'Move'], ['W / Space', 'Jump'], ['S (hold)', 'Crouch · S+Space drops through platforms'], ['Shift', 'Dodge roll (dodges bullets)'], ['Mouse', 'Aim'], ['Left click', 'Shoot (hold for automatics)'], ['R', 'Reload'], ['F / Right click', 'Melee: jab → cross → kick combo'], ['1–6 · Wheel · Q', 'Switch weapon / last weapon'], ['G', 'Throw Bang Crystal (explosive)'], ['V', 'Throw Molotov'], ['H', 'Use medkit'], ['E', 'Interact'], ['Space / Click', 'Advance dialogue'], ['Esc', 'Pause']];
  rows.forEach(([k, v], i) => { const y = 180 + i * 28; c.fillStyle = 'rgba(255,255,255,.06)'; if (i % 2) c.fillRect(W / 2 - 310, y - 19, 620, 28); UI.text(c, k, W / 2 - 290, y, 17, '#ffd060', 'left', true); UI.text(c, v, W / 2 - 100, y, 17, '#ddd'); });
  if (UI.btn(c, W / 2 - 90, 610 - 34, 180, 44, 'BACK') || Input.hit('Escape')) close();
}

// ---------------------------------------------------------------- MENU
class MenuScene {
  constructor() { this.t = 0; this.overlay = null; this.smoke = smokeField(14, 9); this.fx = []; this.hasSave = Game.hasSave(); }
  enter() { Audio.music('menu'); }
  update(dt) {
    this.t += dt;
    if (Math.random() < 0.25) this.fx.push({ x: 1003 + 60 + rand(-3, 3) - 300 + 300, y: GROUND - 192 + 4, s: 6, life: 3, vx: rand(4, 14) });
    for (const p of this.fx) { p.life -= dt; p.y -= 26 * dt; p.x += p.vx * dt; p.s += dt * 9; }
    this.fx = this.fx.filter(p => p.life > 0);
  }
  draw(c) {
    const th = THEMES.night;
    drawBackdrop(c, th, this.t * 12); drawGround(c, th, this.t * 12);
    // the RV with its lights on, smoke from the vent
    drawRV(c, 700, GROUND, { lit: true, foil: false });
    for (const p of this.fx) { c.fillStyle = `rgba(190,200,210,${0.12 * p.life / 3})`; c.beginPath(); c.arc(p.x, p.y, p.s, 0, TAU); c.fill(); }
    // two silhouettes by the RV
    c.save(); c.globalAlpha = 0.95;
    const J1 = poseStatic(1160, GROUND, -1), J2 = poseStatic(1220, GROUND, -1);
    drawFigure(c, J1, LOOKS.jace, -1, {}); drawFigure(c, J2, LOOKS.walterHat, -1, {});
    c.restore();
    // darkness + lamp glow
    const g = c.createRadialGradient(900, 470, 40, 900, 470, 600); g.addColorStop(0, 'rgba(255,190,90,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const v = c.createLinearGradient(0, 0, W, 0); v.addColorStop(0, 'rgba(0,0,0,.85)'); v.addColorStop(0.45, 'rgba(0,0,0,.35)'); v.addColorStop(1, 'rgba(0,0,0,.1)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    drawSmoke(c, this.smoke, 1 / 60, '140,220,160');
    drawLogo(c, 70, 60, 0.82, 0.25 + Math.sin(this.t * 1.5) * 0.1);
    UI.text(c, 'They fixed good. Then good fixed them.', 74, 290, 18, '#b8c8a8');
    if (!this.overlay) {
      let y = 330;
      if (this.hasSave) { if (UI.btn(c, 70, y, 300, 50, 'CONTINUE', { align: 'left', sub: '' })) { Game.loadSave(); if (Game.state.chapter === 0) Story.play(0); else Game.setScene(new HubScene()); } y += 60; }
      if (UI.btn(c, 70, y, 300, 50, 'NEW GAME', { align: 'left' })) this.overlay = 'new'; y += 60;
      if (UI.btn(c, 70, y, 300, 50, 'CONTROLS', { align: 'left' })) this.overlay = 'controls'; y += 60;
      if (UI.btn(c, 70, y, 300, 50, 'SETTINGS', { align: 'left' })) this.overlay = 'settings'; y += 60;
      if (UI.btn(c, 70, y, 300, 50, 'CREDITS', { align: 'left' })) this.overlay = 'credits';
    } else if (this.overlay === 'settings') drawSettings(c, () => this.overlay = null);
    else if (this.overlay === 'controls') drawControls(c, () => this.overlay = null);
    else if (this.overlay === 'credits') {
      UI.panel(c, W / 2 - 300, 160, 600, 380, 0.95); UI.text(c, 'CREDITS', W / 2, 210, 30, '#fff', 'center', true);
      ['FIXING GOOD', 'An original parody action game', '', 'Design, code, art & sound: generated in code', 'Every sprite, sound and note is procedural.', 'No image or audio files were harmed.', '', 'Font: Oswald (SIL Open Font License)'].forEach((l, i) => UI.text(c, l, W / 2, 260 + i * 28, i === 0 ? 22 : 17, i === 0 ? '#9fe88a' : '#ddd', 'center', i === 0));
      if (UI.btn(c, W / 2 - 90, 480, 180, 44, 'BACK') || Input.hit('Escape')) this.overlay = null;
    } else if (this.overlay === 'new') {
      UI.panel(c, W / 2 - 300, 170, 600, 360, 0.95); UI.text(c, 'NEW GAME', W / 2, 220, 30, '#fff', 'center', true);
      if (this.hasSave) UI.text(c, 'This will overwrite your saved game.', W / 2, 252, 15, '#e0a080', 'center');
      const start = d => { Game.state = Game.newState(); Game.state.difficulty = d; Game.save(); Story.play(0); };
      if (UI.btn(c, W / 2 - 250, 280, 500, 56, 'EASY', { sub: 'You take 40% less damage' })) start('easy');
      if (UI.btn(c, W / 2 - 250, 346, 500, 56, 'NORMAL', { sub: 'The way Walter would want it' })) start('normal');
      if (UI.btn(c, W / 2 - 250, 412, 500, 56, 'HARD', { sub: 'Every bullet is a lesson' })) start('hard');
      if (UI.btn(c, W / 2 - 70, 478, 140, 40, 'BACK', { size: 15 }) || Input.hit('Escape')) this.overlay = null;
    }
    UI.text(c, 'v1.0 · Fixing Good', W - 16, H - 14, 12, '#666', 'right');
    UI.cursor(c);
  }
}
function poseStatic(x, y, f, opt = {}) {
  const a = new Actor({ kind: 'npc', team: 'npc', x, y, face: f, look: 'jace' }); if (opt.crouch) a.crouch = 1; a.pose(); return a.J;
}

// ---------------------------------------------------------------- STORY CONTROLLER
const Story = {
  play(ch) {
    const C = CHAPTERS[ch]; if (!C) { Game.setScene(new EndingScene()); return; }
    this.ch = ch; this.seq = C.seq; this.i = -1; this.next();
  },
  next() {
    this.i++;
    if (this.i >= this.seq.length) return this.finish();
    const it = this.seq[this.i]; if (it.onStart) it.onStart(Game.state);
    if (it.level) Game.setScene(new LevelScene(it.level, () => this.next()));
    else if (it.cook) Game.setScene(new CookScene({ tutorial: true, done: () => this.next() }));
    else if (it.ending) { Game.state.chapter = CHAPTERS.length; Game.state.flags.finished = true; Game.save(); Game.setScene(new EndingScene()); }
  },
  finish() { Game.state.chapter = this.ch + 1; Game.save(); Game.setScene(new HubScene({ message: CHAPTERS[this.ch].after, title: 'CHAPTER COMPLETE: ' + CHAPTERS[this.ch].title.toUpperCase() })); },
};

// ---------------------------------------------------------------- LEVEL WRAPPER
class LevelScene {
  constructor(key, onDone, opts = {}) {
    this.key = key; this.def = LEVELS[key]; this.onDone = onDone; this.opts = opts;
    this.snapshot = JSON.stringify(Game.state); this.paused = false; this.overlay = null; this.resultsT = 0; this.results = null;
    this.makeLevel(null);
  }
  makeLevel(cp) {
    const lv = new Level(this.def, { checkpoint: cp }); if (this.def.mode === 'highway') setupHighway(lv);
    this.lv = lv; Game.level = lv; Audio.music(this.def.music || 'action');
  }
  enter() { }
  update(dt) {
    const lv = this.lv;
    if (this.results) { this.resultsT += dt; return; }
    if (Input.hit('Escape') || Input.hit('KeyP')) { if (this.overlay) this.overlay = null; else this.paused = !this.paused; Audio.play('ui'); }
    if (this.paused) return;
    lv.update(dt);
    if (lv.checkpoint && lv.checkpoint !== this._cp) { this._cp = lv.checkpoint; Game.saveMags(lv); this.cpSnap = JSON.stringify(Game.state); }
    if (lv.done && lv.fade >= 0.98 || lv.done && lv.fadeTarget === 0 && lv.stepI >= lv.steps.length) this.complete();
  }
  complete() {
    const lv = this.lv; Game.saveMags(lv);
    if (lv.player) Game.state.armor = lv.player.armor;
    const combat = lv.stats.kills > 0 && !this.opts.noResults;
    if (combat) { this.results = { kills: lv.stats.kills, heads: lv.stats.heads, cash: lv.stats.cash, time: lv.stats.time }; this.resultsT = 0; }
    else { Game.save(); this.onDone(); }
  }
  retry(fromCp) {
    const snap = fromCp && this.cpSnap ? this.cpSnap : this.snapshot;
    Game.state = Object.assign(Game.newState(), JSON.parse(snap));
    this.makeLevel(fromCp ? this.lv.checkpoint : null); this.paused = false;
  }
  draw(c) {
    const lv = this.lv; lv.draw(c);
    if (lv.failed && lv.failT > 1.2) {
      c.fillStyle = `rgba(40,0,0,${Math.min(0.75, (lv.failT - 1.2) * 0.8)})`; c.fillRect(0, 0, W, H);
      UI.text(c, 'GAME OVER', W / 2, 270, 72, '#ff4a3a', 'center', true);
      UI.text(c, lv.failReason || choose0(['"Jace... we were so close." — Walter', '"Get up, Jace. Get UP." — Walter'], lv), W / 2, 320, 20, '#f0d0c0', 'center');
      if (lv.checkpoint && UI.btn(c, W / 2 - 160, 370, 320, 52, 'RETRY FROM CHECKPOINT')) this.retry(true);
      if (UI.btn(c, W / 2 - 160, 432, 320, 52, 'RESTART MISSION')) this.retry(false);
      if (UI.btn(c, W / 2 - 160, 494, 320, 52, 'QUIT TO MENU')) { Game.state = Object.assign(Game.newState(), JSON.parse(this.snapshot)); Game.save(); Game.setScene(new MenuScene()); }
      UI.cursor(c); return;
    }
    if (this.results) return this.drawResults(c);
    if (this.paused) {
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 0, W, H);
      if (this.overlay === 'settings') { drawSettings(c, () => this.overlay = null); UI.cursor(c); return; }
      if (this.overlay === 'controls') { drawControls(c, () => this.overlay = null); UI.cursor(c); return; }
      UI.text(c, 'PAUSED', W / 2, 200, 56, '#fff', 'center', true);
      let y = 250;
      if (UI.btn(c, W / 2 - 150, y, 300, 50, 'RESUME')) this.paused = false; y += 60;
      if (lv.checkpoint && UI.btn(c, W / 2 - 150, y, 300, 50, 'RETRY CHECKPOINT')) this.retry(true); if (lv.checkpoint) y += 60;
      if (UI.btn(c, W / 2 - 150, y, 300, 50, 'RESTART MISSION')) this.retry(false); y += 60;
      if (UI.btn(c, W / 2 - 150, y, 300, 50, 'CONTROLS')) this.overlay = 'controls'; y += 60;
      if (UI.btn(c, W / 2 - 150, y, 300, 50, 'SETTINGS')) this.overlay = 'settings'; y += 60;
      if (UI.btn(c, W / 2 - 150, y, 300, 50, Game.state.chapter > 0 ? 'ABANDON (BACK TO MAP)' : 'QUIT TO MENU')) { Game.state = Object.assign(Game.newState(), JSON.parse(this.snapshot)); Game.save(); Game.setScene(Game.state.chapter > 0 ? new HubScene() : new MenuScene()); }
      UI.cursor(c);
    }
  }
  drawResults(c) {
    const r = this.results, t = this.resultsT;
    c.fillStyle = `rgba(0,0,0,${Math.min(0.8, t * 2)})`; c.fillRect(0, 0, W, H);
    UI.text(c, 'MISSION COMPLETE', W / 2, 200, 60, '#9fe88a', 'center', true);
    const rows = [['Kills', r.kills], ['Headshots', r.heads], ['Cash picked up', fmtMoney(r.cash)], ['Time', Math.floor(r.time / 60) + ':' + String(Math.floor(r.time % 60)).padStart(2, '0')], ['Bank', fmtMoney(Game.state.money)]];
    rows.forEach(([k, v], i) => { if (t < 0.4 + i * 0.25) return; UI.text(c, k, W / 2 - 180, 280 + i * 40, 22, '#ccc'); UI.text(c, String(v), W / 2 + 180, 280 + i * 40, 22, '#fff', 'right', true); });
    if (t > 1.8 && (UI.btn(c, W / 2 - 120, 510, 240, 54, 'CONTINUE') || Input.hit('Space') || Input.hit('Enter'))) { this.results = null; Game.save(); this.onDone(); }
    UI.cursor(c);
  }
}
function choose0(arr, lv) { return arr[Math.floor(lv.def.width) % arr.length]; }

// ---------------------------------------------------------------- HUB MAP
const NODES = {
  rv: { x: 290, y: 440, name: 'RV Camp', sub: 'Cook · rest · stash', icon: 'rv' },
  streets: { x: 640, y: 340, name: 'Del Sombra Streets', sub: 'Sell product to buyers', icon: 'deal' },
  dusty: { x: 790, y: 430, name: "Dusty's Pawn & Guns", sub: 'Weapons · ammo · armor · upgrades', icon: 'gun' },
  hardware: { x: 520, y: 470, name: 'Hardware Barn', sub: 'Precursor · lab gear', icon: 'chem' },
  morty: { x: 720, y: 250, name: 'Morty Goodfellow, Esq.', sub: 'Lose some heat (for a fee)', icon: 'law' },
  junk: { x: 1010, y: 320, name: 'Loco Salvage', sub: "Rafa's junkyard", icon: 'story' },
  chem: { x: 900, y: 560, name: 'Vamonos Chemical', sub: 'Precursor warehouse', icon: 'story' },
  road: { x: 460, y: 620, name: 'Route 9', sub: 'The open road', icon: 'story' },
  motel: { x: 1090, y: 560, name: 'Crossroads Motel', sub: 'Somewhere to lie low', icon: 'story' },
  hen: { x: 600, y: 200, name: 'The Golden Hen', sub: 'Fried chicken. Allegedly.', icon: 'story' },
  ranch: { x: 1160, y: 660, name: 'Rancho Esteban', sub: 'Across the border', icon: 'story' },
  compound: { x: 210, y: 230, name: 'Dust Dogs Compound', sub: 'Uncle Dutch\'s place', icon: 'story' },
};
const ROADS = [['rv', 'hardware'], ['hardware', 'streets'], ['streets', 'dusty'], ['streets', 'morty'], ['morty', 'hen'], ['streets', 'junk'], ['dusty', 'chem'], ['chem', 'motel'], ['hardware', 'road'], ['motel', 'ranch'], ['rv', 'compound'], ['junk', 'motel'], ['hen', 'compound']];
let MAP_CANVAS = null;
function buildMap() {
  const cv = makeCanvas(W, H), c = cv.getContext('2d'), r = srand(77);
  const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#d9b98a'); g.addColorStop(1, '#c49a68'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  // contour lines
  c.strokeStyle = 'rgba(120,80,40,.18)'; c.lineWidth = 1.2;
  for (let k = 0; k < 9; k++) { const cx = r() * W, cy = r() * H; for (let i = 1; i < 8; i++) { c.beginPath(); for (let a = 0; a <= TAU + 0.01; a += 0.2) { const rr = i * 22 * (1 + 0.25 * Math.sin(a * 3 + k)); const x = cx + Math.cos(a) * rr * 1.4, y = cy + Math.sin(a) * rr; a === 0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); } }
  // dry river
  c.strokeStyle = 'rgba(90,120,140,.35)'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 380); for (let x = 0; x <= W; x += 40) c.lineTo(x, 380 + Math.sin(x / 120) * 40 + Math.sin(x / 47) * 10); c.stroke();
  // border
  c.setLineDash([12, 8]); c.strokeStyle = 'rgba(160,40,30,.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 700); c.lineTo(W, 610); c.stroke(); c.setLineDash([]);
  c.fillStyle = 'rgba(160,40,30,.7)'; c.font = `bold 14px ${FONT}`; c.fillText('U.S. / MEXICO', 1060, 600);
  // speckle + cacti
  for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${r() < 0.5 ? '90,60,30' : '255,240,200'},${0.08 + r() * 0.1})`; c.fillRect(r() * W, r() * H, 2, 2); }
  for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * H; c.fillStyle = 'rgba(70,100,50,.5)'; c.fillRect(x, y, 3, 10); c.fillRect(x - 4, y + 3, 4, 2); c.fillRect(x + 3, y + 1, 4, 2); }
  // mesas
  for (let i = 0; i < 7; i++) { const x = r() * W, y = r() * H, w = 60 + r() * 80; c.fillStyle = 'rgba(150,80,50,.35)'; c.beginPath(); c.ellipse(x, y, w, w * 0.4, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(110,60,30,.4)'; c.stroke(); }
  // town block
  c.fillStyle = 'rgba(90,70,50,.25)'; for (let i = 0; i < 30; i++) c.fillRect(560 + r() * 240, 280 + r() * 140, 10 + r() * 14, 8 + r() * 10);
  c.fillStyle = 'rgba(60,40,20,.65)'; c.font = `bold 22px ${FONT}`; c.fillText('DEL SOMBRA', 620, 300);
  c.font = `bold 38px ${FONT}`; c.fillStyle = 'rgba(80,50,25,.35)'; c.fillText('SOMBRA COUNTY, NEW MEXICO', 40, 700);
  // compass
  c.save(); c.translate(1180, 150); c.strokeStyle = 'rgba(60,40,20,.6)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 36, 0, TAU); c.stroke(); c.fillStyle = 'rgba(60,40,20,.7)'; c.beginPath(); c.moveTo(0, -32); c.lineTo(7, 0); c.lineTo(0, 32); c.lineTo(-7, 0); c.closePath(); c.fill(); c.font = `bold 14px ${FONT}`; c.fillText('N', -5, -40); c.restore();
  return cv;
}
function drawNodeIcon(c, kind, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = INK; c.lineWidth = 2;
  switch (kind) {
    case 'rv': c.fillStyle = '#e9e2c9'; rrect(c, -16, -10, 30, 16, 3); c.fill(); c.stroke(); c.fillStyle = '#7a4f2c'; c.fillRect(-15, -2, 28, 3); c.fillStyle = '#222'; c.beginPath(); c.arc(-8, 7, 4, 0, TAU); c.arc(8, 7, 4, 0, TAU); c.fill(); break;
    case 'deal': c.fillStyle = '#5a8a3a'; c.fillRect(-14, -8, 28, 16); c.strokeRect(-14, -8, 28, 16); c.fillStyle = '#c8e0a0'; c.font = `bold 14px ${FONT}`; c.textAlign = 'center'; c.fillText('$', 0, 5); break;
    case 'gun': c.scale(0.9, 0.9); c.translate(-6, 2); GUN_ART.pistol(c, { magIn: true }); break;
    case 'chem': c.fillStyle = '#2a5aa0'; rrect(c, -9, -13, 18, 26, 3); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.fillRect(-9, -3, 18, 3); break;
    case 'law': c.fillStyle = '#c8a040'; c.fillRect(-1.5, -12, 3, 22); c.fillRect(-12, -8, 24, 3); c.beginPath(); c.arc(-10, 2, 5, 0, PI); c.arc(10, 2, 5, 0, PI); c.fill(); break;
    case 'story': c.fillStyle = '#c0281c'; c.beginPath(); c.arc(0, 0, 13, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.font = `bold 18px ${FONT}`; c.textAlign = 'center'; c.fillText('!', 0, 7); break;
  }
  c.restore();
}
class HubScene {
  constructor(o = {}) { this.t = 0; this.sel = null; this.msg = o.message || null; this.msgTitle = o.title || null; this.popup = o.popup || null; this.overlay = null; if (!MAP_CANVAS) MAP_CANVAS = buildMap(); }
  enter() { Audio.music('hub'); Game.save(); Game.level = null; }
  storyNode() { const C = CHAPTERS[Game.state.chapter]; return C ? C.node : null; }
  visible(k) { const n = NODES[k]; if (n.icon !== 'story') return Game.state.chapter >= 1 || k === 'rv'; return k === this.storyNode(); }
  update(dt) { this.t += dt; if (Input.hit('Escape')) { if (this.overlay) this.overlay = null; else this.overlay = 'pause'; } }
  travel(k) {
    const st = Game.state, n = NODES[k];
    const go = () => {
      if (n.icon === 'story') { if (k === 'rv' && CHAPTERS[st.chapter] && CHAPTERS[st.chapter].node === 'rv') return Story.play(st.chapter); return Story.play(st.chapter); }
      if (k === 'rv') return Game.setScene(new CampScene());
      if (k === 'streets') return Game.setScene(new TradeScene());
      if (k === 'dusty') return Game.setScene(new ShopScene('dusty'));
      if (k === 'hardware') return Game.setScene(new ShopScene('hardware'));
      if (k === 'morty') return Game.setScene(new ShopScene('morty'));
    };
    // random events on the road
    const ambush = st.chapter >= 3 && n.icon !== 'story' && Math.random() < 0.1 + st.heat / 500;
    const dea = !ambush && st.heat > 50 && st.bags > 0 && Math.random() < 0.35;
    Game.setScene(new DriveScene(n.name, () => {
      if (ambush) Game.setScene(new LevelScene('ambush', () => Game.setScene(new HubScene({ message: 'You shook off the Dust Dogs. The RV has a few new holes.', title: 'AMBUSH SURVIVED' })), { noResults: false }));
      else if (dea) { const lost = Math.ceil(st.bags * 0.3); st.bags -= lost; st.heat = Math.max(0, st.heat - 25); Game.setScene(new HubScene({ title: 'DEA CHECKPOINT', message: `Agent Brewer's people pulled you over. You ditched ${lost} bags out the back window before they searched the RV. Heat -25.` })); }
      else go();
    }, n.icon === 'story'));
  }
  draw(c) {
    const st = Game.state;
    c.drawImage(MAP_CANVAS, 0, 0);
    // roads
    c.lineCap = 'round';
    for (const [a, b] of ROADS) { const A = NODES[a], B = NODES[b]; c.strokeStyle = 'rgba(70,50,30,.55)'; c.lineWidth = 7; c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke(); c.strokeStyle = 'rgba(240,220,150,.6)'; c.lineWidth = 1.5; c.setLineDash([8, 8]); c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke(); c.setLineDash([]); }
    // nodes
    let hover = null;
    for (const k in NODES) {
      if (!this.visible(k)) continue;
      const n = NODES[k], story = n.icon === 'story', d = dist(Input.mx, Input.my, n.x, n.y), h = d < 28;
      if (h) hover = k;
      const pulse = story ? 1 + Math.sin(this.t * 4) * 0.12 : 1;
      c.fillStyle = story ? 'rgba(200,40,30,.25)' : 'rgba(0,0,0,.18)'; c.beginPath(); c.arc(n.x, n.y, 26 * pulse + (h ? 4 : 0), 0, TAU); c.fill();
      c.fillStyle = h ? '#fff7d8' : '#f2e2b8'; c.strokeStyle = story ? '#c0281c' : '#5a3a1a'; c.lineWidth = 3; c.beginPath(); c.arc(n.x, n.y, 21, 0, TAU); c.fill(); c.stroke();
      drawNodeIcon(c, n.icon, n.x, n.y, 0.95);
      c.font = `bold 15px ${FONT}`; c.textAlign = 'center'; c.fillStyle = 'rgba(255,248,225,.9)'; const tw = c.measureText(n.name).width; rrect(c, n.x - tw / 2 - 6, n.y + 26, tw + 12, 22, 4); c.fill(); c.fillStyle = '#2a1a0a'; c.fillText(n.name, n.x, n.y + 42); c.textAlign = 'left';
      if (story) { c.fillStyle = '#c0281c'; c.font = `bold 12px ${FONT}`; c.textAlign = 'center'; c.fillText('CHAPTER ' + (st.chapter + 1) + ': ' + CHAPTERS[st.chapter].title.toUpperCase(), n.x, n.y - 32); c.textAlign = 'left'; }
      if (h && Input.mclick && !this.msg && !this.overlay) { Input.mclick = false; this.sel = k; Audio.play('uiok'); }
    }
    // top bar
    c.fillStyle = 'rgba(15,12,8,.85)'; c.fillRect(0, 0, W, 54);
    drawLogo(c, 14, 6, 0.19);
    const items = [['CASH', fmtMoney(st.money), '#8fe07a'], ['PRODUCT', st.bags + ' bags' + (st.bags ? ' · ' + st.purity.toFixed(1) + '%' : ''), '#7fd8f0'], ['PRECURSOR', st.precursor + ' units', '#c8b0f0'], ['HEAT', Math.round(st.heat) + '%', st.heat > 60 ? '#ff6040' : st.heat > 30 ? '#f0b040' : '#ddd'], ['DAY', st.day, '#ddd'], ['ARMOR', Math.round(st.armor), '#5ab0e0']];
    items.forEach(([k, v, col], i) => { const x = 110 + i * 158; UI.text(c, k, x, 20, 11, '#aaa'); UI.text(c, String(v), x, 42, 19, col, 'left', true); });
    if (UI.btn(c, W - 110, 9, 96, 36, 'MENU', { size: 14 })) this.overlay = 'pause';
    // heat bar
    c.fillStyle = '#300'; c.fillRect(110 + 3 * 158, 48, 120, 3); c.fillStyle = '#ff6040'; c.fillRect(110 + 3 * 158, 48, 120 * st.heat / 100, 3);
    // story banner
    const C = CHAPTERS[st.chapter];
    UI.panel(c, 16, 70, 330, C ? 96 : 60, 0.78);
    if (C) { UI.text(c, 'NEXT: CHAPTER ' + (st.chapter + 1), 32, 96, 13, '#e07060', 'left', true); UI.text(c, C.title, 32, 124, 24, '#fff', 'left', true); UI.text(c, 'Go to the red marker on the map.', 32, 150, 13, '#bbb'); }
    else UI.text(c, 'Story complete. The desert is yours.', 32, 106, 16, '#9fe88a');
    // selection panel
    if (this.sel && !this.msg) {
      const k = this.sel, n = NODES[k], story = n.icon === 'story';
      const px = clamp(n.x + 40, 20, W - 360), py = clamp(n.y - 80, 70, H - 220);
      UI.panel(c, px, py, 330, 190, 0.94);
      drawNodeIcon(c, n.icon, px + 34, py + 36, 1.3);
      UI.text(c, n.name, px + 62, py + 36, 20, '#fff', 'left', true); UI.text(c, n.sub, px + 62, py + 58, 14, '#bbb');
      if (story) {
        const req = C && C.requires ? C.requires(st) : null;
        UI.text(c, 'Chapter ' + (st.chapter + 1) + ': ' + C.title, px + 20, py + 96, 17, '#ffb070', 'left', true);
        if (req) { c.font = `14px ${FONT}`; c.fillStyle = '#ff9070'; wrapText(c, req, px + 20, py + 120, 290, 18); }
        if (UI.btn(c, px + 20, py + 134, 190, 42, 'START MISSION', { disabled: !!req, hot: '#8a2a1a' })) this.travel(k);
      } else {
        if (UI.btn(c, px + 20, py + 134, 190, 42, 'DRIVE THERE')) this.travel(k);
      }
      if (UI.btn(c, px + 220, py + 134, 90, 42, 'CLOSE', { size: 14 })) this.sel = null;
    }
    if (!this.sel && !this.msg && hover) { const n = NODES[hover]; UI.text(c, 'Click to select', n.x, n.y + 64, 12, '#3a2a1a', 'center'); }
    // message popup
    if (this.msg) {
      c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 0, W, H);
      UI.panel(c, W / 2 - 320, H / 2 - 140, 640, 280, 0.96);
      UI.text(c, this.msgTitle || 'NEWS', W / 2, H / 2 - 90, 26, '#9fe88a', 'center', true);
      c.font = `19px ${FONT}`; c.fillStyle = '#eee'; c.textAlign = 'left'; wrapText(c, this.msg, W / 2 - 280, H / 2 - 40, 560, 28);
      if (UI.btn(c, W / 2 - 90, H / 2 + 72, 180, 48, 'OK') || Input.hit('Space') || Input.hit('Enter')) this.msg = null;
    }
    if (this.overlay === 'pause') {
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 0, W, H); UI.text(c, 'MENU', W / 2, 220, 48, '#fff', 'center', true);
      if (UI.btn(c, W / 2 - 150, 260, 300, 50, 'RESUME')) this.overlay = null;
      if (UI.btn(c, W / 2 - 150, 320, 300, 50, 'SETTINGS')) this.overlay = 'settings';
      if (UI.btn(c, W / 2 - 150, 380, 300, 50, 'CONTROLS')) this.overlay = 'controls';
      if (UI.btn(c, W / 2 - 150, 440, 300, 50, 'SAVE & QUIT TO TITLE')) { Game.save(); Game.setScene(new MenuScene()); }
    } else if (this.overlay === 'settings') { c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 0, W, H); drawSettings(c, () => this.overlay = 'pause'); }
    else if (this.overlay === 'controls') { c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 0, W, H); drawControls(c, () => this.overlay = 'pause'); }
    UI.cursor(c);
  }
}

// ---------------------------------------------------------------- DRIVING (travel)
class DriveScene {
  constructor(dest, done, story) { this.dest = dest; this.done = done; this.t = 0; this.x = 0; this.theme = THEMES[Game.state.day % 3 === 0 ? 'dusk' : 'day']; this.dust = []; this.story = story; }
  enter() { Audio.music('hub'); }
  update(dt) {
    this.t += dt; this.x += dt * 700;
    if (Math.random() < 0.7) this.dust.push({ x: 380, y: GROUND - 6, vx: rand(-260, -120), vy: rand(-40, -10), life: 1, s: rand(6, 14) });
    for (const d of this.dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt * 0.9; d.s += dt * 20; }
    this.dust = this.dust.filter(d => d.life > 0);
    if (this.t > 0.3 && (Math.round(this.t * 3) % 2 === 0) && !this._e) { this._e = true; Audio.play('engine', 0, 0.3); } if (Math.round(this.t * 3) % 2 === 1) this._e = false;
    if (this.t > 3.6 || (this.t > 0.4 && (Input.mclick || Input.hit('Space') || Input.hit('Enter')))) { Input.mclick = false; this.done(); }
  }
  draw(c) {
    drawBackdrop(c, this.theme, this.x); drawGround(c, this.theme, this.x);
    for (const d of this.dust) { c.fillStyle = `rgba(210,180,130,${0.35 * d.life})`; c.beginPath(); c.arc(d.x, d.y, d.s, 0, TAU); c.fill(); }
    drawRV(c, 420, GROUND, { wheel: this.t * 30, bob: Math.sin(this.t * 14) * 1.5, driver: LOOKS.walter, dirty: true });
    c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, W, 90); c.fillRect(0, H - 70, W, 70);
    UI.text(c, 'DRIVING TO', W / 2, 38, 15, '#aaa', 'center'); UI.text(c, this.dest.toUpperCase(), W / 2, 72, 30, '#fff', 'center', true);
    UI.text(c, 'Click to skip', W - 20, H - 28, 13, '#888', 'right');
    // progress
    c.fillStyle = '#333'; c.fillRect(W / 2 - 200, H - 40, 400, 4); c.fillStyle = '#e8c060'; c.fillRect(W / 2 - 200, H - 40, 400 * Math.min(1, this.t / 3.6), 4);
  }
}

// ---------------------------------------------------------------- RV CAMP
class CampScene {
  constructor() { this.t = 0; this.msg = null; }
  enter() { Audio.music('hub'); }
  update(dt) { this.t += dt; if (Input.hit('Escape')) Game.setScene(new HubScene()); }
  draw(c) {
    const th = THEMES.dusk, st = Game.state;
    drawBackdrop(c, th, 300); drawGround(c, th, 300);
    drawRV(c, 380, GROUND, { lit: true, foil: true });
    drawFigure(c, poseStatic(860, GROUND, -1), LOOKS.walter, -1, {}); drawFigure(c, poseStatic(940, GROUND, -1), LOOKS.jace, -1, {});
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, H);
    UI.panel(c, 40, 40, 460, 300, 0.9);
    UI.text(c, 'RV CAMP', 64, 84, 32, '#fff', 'left', true);
    UI.text(c, 'Precursor: ' + st.precursor + '  ·  Product: ' + st.bags + ' bags', 64, 116, 16, '#bbb');
    const canCook = st.precursor >= 2;
    if (UI.btn(c, 64, 140, 412, 56, 'COOK A BATCH', { sub: canCook ? 'Uses 2 precursor · advances the day' : 'Need 2 precursor (Hardware Barn)', disabled: !canCook })) { st.precursor -= 2; Game.setScene(new CookScene({ done: r => Game.setScene(new CampScene()) })); }
    if (UI.btn(c, 64, 206, 412, 56, 'SLEEP IN THE RV', { sub: 'Next day · heat -8 · new buyers' })) { st.day++; st.heat = Math.max(0, st.heat - 8); st.buyers = null; Game.save(); this.msg = 'You sleep badly. Walter snores like a dying carburetor. Day ' + st.day + '.'; }
    if (UI.btn(c, 64, 272, 412, 50, 'BACK TO MAP')) Game.setScene(new HubScene());
    if (this.msg) { UI.panel(c, 40, 360, 460, 70, 0.9); c.font = `16px ${FONT}`; c.fillStyle = '#ddd'; wrapText(c, this.msg, 60, 390, 420, 22); }
    UI.cursor(c);
  }
}

// ---------------------------------------------------------------- SHOPS
const SHOP_ITEMS = {
  dusty: [
    { id: 'revolver', name: '.357 Magnum', price: 1800, ch: 1, type: 'gun' },
    { id: 'shotgun', name: '12ga Pump Shotgun', price: 2600, ch: 1, type: 'gun' },
    { id: 'smg', name: 'Uzi-9', price: 3200, ch: 2, type: 'gun' },
    { id: 'rifle', name: 'AKM Rifle', price: 5200, ch: 3, type: 'gun' },
    { id: 'a9', name: '9mm ×45', price: 90, ch: 0, type: 'ammo', ammo: '9mm', n: 45 },
    { id: 'a357', name: '.357 ×18', price: 130, ch: 1, type: 'ammo', ammo: '357', n: 18 },
    { id: 'a12', name: '12 gauge ×16', price: 150, ch: 1, type: 'ammo', ammo: '12ga', n: 16 },
    { id: 'a762', name: '7.62mm ×60', price: 240, ch: 2, type: 'ammo', ammo: '762', n: 60 },
    { id: 'armor', name: 'Kevlar vest (refill)', price: 550, ch: 0, type: 'armor', desc: '150 armor. Soaks 65% of damage.' },
    { id: 'med', name: 'Medkit', price: 150, ch: 0, type: 'med', desc: '+60 HP with [H]. Carry 5.' },
    { id: 'molotov', name: 'Molotov', price: 120, ch: 1, type: 'molotov', desc: 'Throw with [V]. Fire spreads.' },
    { id: 'bang', name: 'Bang Crystal', price: 280, ch: 1, type: 'bang', desc: 'Walter\'s recipe. Throw with [G].' },
    { id: 'dragon', name: "Dragon's Breath shells", price: 1500, ch: 2, type: 'up', desc: 'Shotgun pellets set enemies on fire.' },
    { id: 'hollow', name: 'Hollow points', price: 2000, ch: 3, type: 'up', desc: '+20% bullet damage, all guns.' },
    { id: 'reload', name: 'Speed-reload training', price: 1800, ch: 1, type: 'up', desc: 'Reload 28% faster.' },
    { id: 'health', name: 'Boxing gym membership', price: 2200, ch: 2, type: 'up', desc: '+40 max health.' },
    { id: 'fists', name: 'Brass knuckles', price: 700, ch: 0, type: 'up', desc: '+50% melee damage.' },
  ],
  hardware: [
    { id: 'pre1', name: 'Precursor ×1', price: 180, ch: 0, type: 'pre', n: 1, desc: 'Two units per cook.' },
    { id: 'pre5', name: 'Precursor ×6', price: 960, ch: 0, type: 'pre', n: 6, desc: 'Bulk discount. Don\'t ask questions.' },
    { id: 'glass', name: 'Lab glassware', price: 1500, ch: 0, type: 'up', desc: '+2 bags per cook.' },
    { id: 'foil', name: 'Mylar insulation', price: 1200, ch: 1, type: 'up', desc: 'Selling raises heat half as much.' },
    { id: 'thermo', name: 'Digital thermometer', price: 900, ch: 0, type: 'up', desc: 'Wider sweet spot when heating.' },
  ],
  morty: [
    { id: 'heat1', name: 'Make a call', price: 400, ch: 0, type: 'heat', n: 25, desc: 'Heat -25. "I know a guy who knows a guy."' },
    { id: 'heat2', name: 'Full disappearing act', price: 1600, ch: 0, type: 'heat', n: 100, desc: 'Heat to zero. Lawyers, judges, a dentist.' },
  ],
};
const SHOPKEEP = {
  dusty: { look: 'dusty', title: "DUSTY'S PAWN & GUNS", lines: ['Cash only. No refunds. No names.', 'That Magnum? Took it off a man who didn\'t need it no more.', 'You look like a fella who needs more bullets.', 'Shotgun\'s good for close conversations.'] },
  hardware: { look: 'goon', title: 'HARDWARE BARN', lines: ['Cleaning supplies, aisle six. Large... "industrial" quantities, aisle nine.', 'Big science project, huh?', 'We\'re out of mops. Everyone\'s buying mops.'] },
  morty: { look: 'morty', title: 'MORTY GOODFELLOW, ATTORNEY AT LAW', lines: ['"Better Hire Morty!" That\'s the slogan. It\'s on a bench.', 'Legally speaking, you were never here. Financially speaking, that\'ll cost you.', 'Heat? What heat? I see sunshine and a client who pays.'] },
};
class ShopScene {
  constructor(kind) { this.kind = kind; this.t = 0; this.line = choose(SHOPKEEP[kind].lines); this.flash = null; this.scroll = 0; }
  enter() { Audio.music('hub'); }
  owned(it) { const st = Game.state; if (it.type === 'gun') return st.weapons.includes(it.id); if (it.type === 'up') return !!st.upgrades[it.id]; return false; }
  canBuy(it) {
    const st = Game.state; if (st.money < it.price) return 'Not enough cash';
    if (it.ch > st.chapter) return 'Not in stock yet'; if (this.owned(it)) return 'Owned';
    if (it.type === 'med' && st.medkits >= 5) return 'Full'; if (it.type === 'molotov' && st.molotovs >= 5) return 'Full'; if (it.type === 'bang' && st.bangs >= 5) return 'Full';
    if (it.type === 'armor' && st.armor >= 150) return 'Full'; if (it.type === 'heat' && st.heat <= 0) return 'No heat';
    return null;
  }
  buy(it) {
    const st = Game.state; st.money -= it.price; Audio.play('cash');
    switch (it.type) {
      case 'gun': st.weapons.push(it.id); st.ammo[WEAPONS[it.id].ammo] += WEAPONS[it.id].mag * 2; break;
      case 'ammo': st.ammo[it.ammo] += it.n; break;
      case 'armor': st.armor = 150; break;
      case 'med': st.medkits++; break; case 'molotov': st.molotovs++; break; case 'bang': st.bangs++; break;
      case 'up': st.upgrades[it.id] = true; break;
      case 'pre': st.precursor += it.n; break;
      case 'heat': st.heat = Math.max(0, st.heat - it.n); break;
    }
    this.flash = { t: 1.4, text: 'Bought: ' + it.name }; Game.save();
  }
  update(dt) { this.t += dt; if (this.flash) { this.flash.t -= dt; if (this.flash.t <= 0) this.flash = null; } if (Input.hit('Escape')) Game.setScene(new HubScene()); this.scroll = clamp(this.scroll + Input.wheel * 40, 0, Math.max(0, this.maxScroll || 0)); }
  draw(c) {
    const K = SHOPKEEP[this.kind], st = Game.state;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1e14'); g.addColorStop(1, '#120c08'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // wall of the shop
    c.fillStyle = 'rgba(255,255,255,.03)'; for (let x = 0; x < W; x += 60) c.fillRect(x, 0, 2, H);
    if (this.kind === 'dusty') { c.globalAlpha = 0.25; for (let i = 0; i < 6; i++) { c.save(); c.translate(80 + i * 70, 470 + (i % 2) * 40); c.scale(2.2, 2.2); GUN_ART[['rifle', 'shotgun', 'smg', 'revolver', 'pistol', 'rifle'][i]](c, { magIn: true }); c.restore(); } c.globalAlpha = 1; }
    drawPortrait(c, 40, 90, 200, LOOKS[K.look], 'neutral', '#3a2a1a');
    UI.text(c, K.title, 40, 60, 26, '#ffd060', 'left', true);
    UI.panel(c, 40, 304, 340, 110, 0.8); c.font = `italic 17px ${FONT}`; c.fillStyle = '#e8dcc0'; wrapText(c, '"' + this.line + '"', 58, 336, 304, 24);
    UI.text(c, 'CASH  ' + fmtMoney(st.money), 40, 450, 24, '#8fe07a', 'left', true);
    if (this.kind === 'dusty') UI.text(c, `Ammo: 9mm ${st.ammo['9mm']} · .357 ${st.ammo['357']} · 12ga ${st.ammo['12ga']} · 7.62 ${st.ammo['762']}`, 40, 480, 14, '#bbb');
    if (this.kind === 'dusty') UI.text(c, `Medkits ${st.medkits}/5 · Molotovs ${st.molotovs}/5 · Bangs ${st.bangs}/5 · Armor ${Math.round(st.armor)}`, 40, 502, 14, '#bbb');
    if (this.kind === 'hardware') UI.text(c, 'Precursor: ' + st.precursor + ' units', 40, 480, 16, '#c8b0f0');
    if (this.kind === 'morty') UI.text(c, 'Heat: ' + Math.round(st.heat) + '%', 40, 480, 18, st.heat > 50 ? '#ff6040' : '#ddd', 'left', true);
    // item grid
    const items = SHOP_ITEMS[this.kind], cols = 2, cw = 400, ch = 96, x0 = 420, y0 = 40;
    c.save(); c.beginPath(); c.rect(x0 - 10, y0 - 10, cols * (cw + 16) + 20, H - 120); c.clip();
    items.forEach((it, i) => {
      const x = x0 + (i % cols) * (cw + 16), y = y0 + Math.floor(i / cols) * (ch + 12) - this.scroll;
      const why = this.canBuy(it), owned = this.owned(it), locked = it.ch > st.chapter;
      UI.panel(c, x, y, cw, ch, 0.85);
      if (it.type === 'gun') { c.save(); c.translate(x + 60, y + 52); c.scale(1.6, 1.6); if (it.id === 'rifle' || it.id === 'shotgun') c.scale(0.8, 0.8); GUN_ART[WEAPONS[it.id].art](c, { magIn: true }); c.restore(); }
      else { c.save(); c.translate(x + 50, y + 48); c.scale(1.6, 1.6); this.icon(c, it); c.restore(); }
      UI.text(c, locked ? '???' : it.name, x + 112, y + 30, 18, locked ? '#777' : '#fff', 'left', true);
      const desc = locked ? 'Available in a later chapter.' : it.type === 'gun' ? WEAPONS[it.id].desc : it.desc || (it.type === 'ammo' ? 'Boxed and untraceable.' : '');
      c.font = `13px ${FONT}`; c.fillStyle = '#bbb'; wrapText(c, desc, x + 112, y + 50, 180, 16);
      if (it.type === 'gun' && !locked) { const d = WEAPONS[it.id]; UI.text(c, `DMG ${d.dmg}${d.bullets > 1 ? '×' + d.bullets : ''} · MAG ${d.mag}`, x + 112, y + 86, 11, '#e8c060'); }
      if (owned) UI.text(c, 'OWNED', x + cw - 20, y + 56, 16, '#9fe88a', 'right', true);
      else if (UI.btn(c, x + cw - 110, y + 30, 96, 40, fmtMoney(it.price), { disabled: !!why, size: 15 })) this.buy(it);
      if (!owned && why && why !== 'Owned' && !locked) UI.text(c, why, x + cw - 62, y + 86, 11, '#e08070', 'center');
    });
    this.maxScroll = Math.max(0, Math.ceil(items.length / cols) * (ch + 12) - (H - 140));
    c.restore();
    if (this.maxScroll > 0) UI.text(c, 'Scroll for more ▾', x0 + 400, H - 66, 13, '#888', 'center');
    if (UI.btn(c, 40, H - 90, 200, 50, 'LEAVE')) Game.setScene(new HubScene());
    if (this.flash) { c.globalAlpha = Math.min(1, this.flash.t * 2); UI.panel(c, W / 2 - 160, H - 92, 320, 46, 0.95); UI.text(c, this.flash.text, W / 2, H - 62, 17, '#9fe88a', 'center', true); c.globalAlpha = 1; }
    UI.cursor(c);
  }
  icon(c, it) {
    c.strokeStyle = INK; c.lineWidth = 1.5;
    switch (it.type) {
      case 'ammo': c.fillStyle = '#4a5a2a'; c.fillRect(-14, -9, 28, 18); c.strokeRect(-14, -9, 28, 18); c.fillStyle = '#d8b040'; for (let i = 0; i < 4; i++) c.fillRect(-11 + i * 6, -15, 4, 7); break;
      case 'armor': c.fillStyle = '#3d4434'; rrect(c, -13, -16, 26, 32, 5); c.fill(); c.stroke(); c.fillStyle = '#2b3024'; c.fillRect(-8, -6, 16, 10); break;
      case 'med': c.fillStyle = '#eee'; c.fillRect(-13, -10, 26, 20); c.strokeRect(-13, -10, 26, 20); c.fillStyle = '#c0281c'; c.fillRect(-3, -7, 6, 14); c.fillRect(-8, -3, 16, 6); break;
      case 'molotov': c.fillStyle = '#4a7a2a'; c.fillRect(-6, -8, 12, 22); c.strokeRect(-6, -8, 12, 22); c.fillStyle = '#e8e0d0'; c.fillRect(-3, -16, 6, 9); c.fillStyle = '#ff9030'; c.beginPath(); c.arc(0, -19, 4, 0, TAU); c.fill(); break;
      case 'bang': c.fillStyle = '#7fd8f0'; c.beginPath(); c.moveTo(0, -14); c.lineTo(10, 0); c.lineTo(0, 14); c.lineTo(-10, 0); c.closePath(); c.fill(); c.stroke(); break;
      case 'pre': c.fillStyle = '#2a5aa0'; rrect(c, -11, -15, 22, 30, 3); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.fillRect(-11, -3, 22, 4); break;
      case 'heat': c.fillStyle = '#c8a040'; c.fillRect(-2, -14, 4, 26); c.fillRect(-14, -10, 28, 4); c.beginPath(); c.arc(-11, 2, 6, 0, PI); c.arc(11, 2, 6, 0, PI); c.fill(); break;
      default: c.fillStyle = '#e8c060'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = i * PI / 5 - PI / 2, r = i % 2 ? 6 : 14; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke();
    }
  }
}

// ---------------------------------------------------------------- STREET TRADING
const BUYER_LINES = ['Yo, is it the blue? Everybody\'s talking about the blue.', 'My cousin said you\'re the guy. Are you the guy?', 'I got cash. Small bills. Very small bills.', 'Quick, man, my bus is in five minutes.', 'Heard it\'s like ninety-nine percent. Is that real?', 'I\'m buying for a... book club.'];
const COP_LINES = ['So, uh, how much narcotics product do you have available, sir?', 'Hello fellow drug enthusiast. I would like to purchase the illegal substance.', 'Before we deal, you\'re not a cop, right? I\'m definitely not.', 'Could you describe, for the record, what exactly you\'re selling?'];
function makeBuyers() {
  const st = Game.state, r = Math.random, out = [];
  const pur = Math.max(st.purity, 60);
  for (let i = 0; i < 3; i++) {
    const cop = r() < (st.heat > 30 ? 0.22 : 0.08);
    const want = randi(2, 5 + st.chapter);
    const price = Math.round((35 + pur * 1.6) * rand(0.85, 1.25) * (1 + st.chapter * 0.07) / 5) * 5;
    out.push({ look: Object.assign(lookOf('thug'), { name: choose(['Skinny Pete', 'Badger', 'Wendy B.', 'Combo', 'Tweaker Ted', 'Dutchie', 'Spooge', 'Gomez Jr.', 'Lil Ricky', 'Marisol']) }), want, price, cop, line: cop ? choose(COP_LINES) : choose(BUYER_LINES), done: false, haggles: 0 });
  }
  return out;
}
class TradeScene {
  constructor() { this.t = 0; const st = Game.state; if (!st.buyers) st.buyers = makeBuyers(); this.buyers = st.buyers; this.log = null; }
  enter() { Audio.music('hub'); }
  update(dt) { this.t += dt; if (Input.hit('Escape')) Game.setScene(new HubScene()); }
  sell(b) {
    const st = Game.state, n = Math.min(b.want, st.bags);
    if (b.cop) { st.bags -= n; st.heat = Math.min(100, st.heat + 35); b.done = true; Audio.play('bad'); this.log = { col: '#ff7050', text: b.look.name + ' flashes a badge! You shove past him and run. You lost ' + n + ' bags. Heat +35.' }; return; }
    const cash = n * b.price; st.bags -= n; st.money += cash; st.stats.earned += cash; st.stats.bagsSold += n;
    st.heat = Math.min(100, st.heat + n * (st.upgrades.foil ? 0.6 : 1.2)); b.done = true; if (st.bags <= 0) st.purity = 0;
    Audio.play('cash'); this.log = { col: '#9fe88a', text: 'Sold ' + n + ' bags to ' + b.look.name + ' for ' + fmtMoney(cash) + '.' };
    Game.save();
  }
  haggle(b) {
    const st = Game.state; b.haggles++;
    const chance = clamp(0.8 - b.haggles * 0.22 + (st.purity - 80) / 100, 0.1, 0.9);
    if (Math.random() < chance) { b.price = Math.round(b.price * 1.15 / 5) * 5; Audio.play('uiok'); this.log = { col: '#ffd060', text: b.look.name + ': "Ugh... fine. ' + fmtMoney(b.price) + ' a bag."' }; }
    else { b.done = true; b.walked = true; Audio.play('bad'); this.log = { col: '#ff9070', text: b.look.name + ': "Forget it, man. I\'ll go to the guy behind the laundromat."' }; }
  }
  draw(c) {
    const th = THEMES.town, st = Game.state;
    drawBackdrop(c, th, 800); drawGround(c, th, 800);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, W, H);
    drawFigure(c, poseStatic(150, GROUND, 1), LOOKS.jace, 1, {});
    UI.panel(c, 20, 20, W - 40, 70, 0.85);
    UI.text(c, 'DEL SOMBRA STREETS', 40, 54, 26, '#fff', 'left', true); UI.text(c, 'Day ' + st.day + ' · ' + (st.bags) + ' bags in hand' + (st.bags ? ' at ' + st.purity.toFixed(1) + '% purity' : ''), 40, 78, 15, '#bbb');
    UI.text(c, 'HEAT ' + Math.round(st.heat) + '%', W - 220, 54, 22, st.heat > 50 ? '#ff6040' : '#ddd', 'left', true); UI.text(c, fmtMoney(st.money), W - 220, 78, 18, '#8fe07a', 'left', true);
    this.buyers.forEach((b, i) => {
      const x = 300 + i * 320, y = 120;
      if (!b.done) drawFigure(c, poseStatic(x + 140, GROUND, -1), b.look, -1, {});
      UI.panel(c, x, y, 290, 300, b.done ? 0.5 : 0.9);
      drawPortrait(c, x + 14, y + 14, 80, b.look, b.done ? 'neutral' : 'smile');
      UI.text(c, b.look.name, x + 108, y + 40, 20, b.done ? '#777' : '#fff', 'left', true);
      if (b.done) { UI.text(c, b.walked ? 'Walked off' : 'Done', x + 108, y + 68, 15, '#888'); return; }
      UI.text(c, 'Wants ' + b.want + ' bags', x + 108, y + 66, 15, '#bbb'); UI.text(c, fmtMoney(b.price) + ' / bag', x + 108, y + 88, 18, '#8fe07a', 'left', true);
      c.font = `italic 15px ${FONT}`; c.fillStyle = '#e8dcc0'; wrapText(c, '"' + b.line + '"', x + 16, y + 130, 258, 20);
      const n = Math.min(b.want, st.bags);
      if (UI.btn(c, x + 16, y + 200, 258, 40, n > 0 ? 'SELL ' + n + ' FOR ' + fmtMoney(n * b.price) : 'NO PRODUCT', { disabled: n <= 0, size: 15 })) this.sell(b);
      if (UI.btn(c, x + 16, y + 248, 124, 38, 'HAGGLE +15%', { disabled: n <= 0, size: 14 })) this.haggle(b);
      if (UI.btn(c, x + 150, y + 248, 124, 38, 'PASS', { size: 14 })) { b.done = true; b.walked = true; }
    });
    if (this.log) { UI.panel(c, 300, 440, 940, 50, 0.9); UI.text(c, this.log.text, 320, 472, 17, this.log.col); }
    if (this.buyers.every(b => b.done)) UI.text(c, 'No more buyers today. Sleep or cook in the RV to bring out new ones.', W / 2 + 120, 520, 16, '#ddd', 'center');
    UI.text(c, 'Tip: purity raises prices. Some "buyers" are a little too curious.', W / 2 + 120, 548, 13, '#aaa', 'center');
    if (UI.btn(c, 40, H - 90, 200, 50, 'LEAVE')) Game.setScene(new HubScene());
    UI.cursor(c);
  }
}

// ---------------------------------------------------------------- COOKING MINIGAME (fictional chemistry)
const COOK_STEPS = [
  { id: 'heat', name: 'HEAT THE FLASK', help: 'Hold the mouse button to raise the temperature. Keep the needle in the green band.', walter: 'Steady heat, Jace. Chemistry punishes impatience.' },
  { id: 'reagent', name: 'ADD THE CATALYST', help: 'Click when the marker crosses the green zone. Three drops.', walter: 'Precisely when I say. Not before. Not after.' },
  { id: 'stir', name: 'STIR', help: 'Move the mouse in circles around the flask. Keep the speed in the green.', walter: 'Smooth circles. You\'re stirring, not whisking eggs.' },
  { id: 'cool', name: 'COOL & CRYSTALLIZE', help: 'Hold A / D (or move the mouse) to keep the needle centered as it drifts.', walter: 'Now we let the crystals form. Gently...' },
  { id: 'bag', name: 'BREAK & BAG', help: 'Click the crystal slabs to break them up before time runs out.', walter: 'Break it, bag it. Look at that colour.' },
];
class CookScene {
  constructor(o = {}) { this.o = o; this.i = -1; this.scores = []; this.t = 0; this.phase = 'intro'; this.bubbles = []; this.result = null; this.next(); }
  enter() { Audio.music('cook'); }
  next() {
    this.i++; this.t = 0;
    if (this.i >= COOK_STEPS.length) { this.finish(); return; }
    const id = COOK_STEPS[this.i].id; this.phase = 'brief';
    const thermo = Game.state.upgrades.thermo;
    this.s = { heat: { v: 0.2, inBand: 0, band: thermo ? [0.55, 0.8] : [0.6, 0.76] }, reagent: { m: 0, dir: 1, hits: [], zone: rand(0.35, 0.65) }, stir: { ang: null, good: 0, speed: 0, total: 0 }, cool: { v: 0.5, drift: 0, good: 0 }, bag: { chunks: Array.from({ length: 9 }, (_, k) => ({ x: 520 + (k % 3) * 90 + rand(-12, 12), y: 330 + Math.floor(k / 3) * 70 + rand(-8, 8), hp: 2, r: rand(26, 34) })) } }[id];
  }
  finish() {
    const avg = this.scores.reduce((a, b) => a + b, 0) / this.scores.length;
    const purity = Math.min(99.1, Math.round((62 + avg * 37.6) * 10) / 10);
    const st = Game.state; const bags = Math.round(5 + avg * 6 + (st.upgrades.glass ? 2 : 0));
    st.purity = st.bags > 0 ? (st.purity * st.bags + purity * bags) / (st.bags + bags) : purity;
    st.bags += bags; st.day++; st.buyers = null; st.stats.cooks++; st.stats.bestPurity = Math.max(st.stats.bestPurity, purity);
    this.result = { purity, bags, avg }; this.phase = 'result'; Game.save();
    Audio.play(purity > 95 ? 'uiok' : 'cash');
  }
  update(dt) {
    this.t += dt;
    if (Math.random() < 0.3) this.bubbles.push({ x: 640 + rand(-40, 40), y: 420, vy: rand(-60, -30), life: 1 }); for (const b of this.bubbles) { b.y += b.vy * dt; b.life -= dt; } this.bubbles = this.bubbles.filter(b => b.life > 0);
    if (Math.random() < 0.06) Audio.play('bubble');
    if (this.phase === 'brief') { if (this.t > 0.3 && (Input.mclick || Input.hit('Space'))) { Input.mclick = false; this.phase = 'play'; this.t = 0; } return; }
    if (this.phase === 'result') { return; }
    if (this.phase !== 'play') return;
    const id = COOK_STEPS[this.i].id, s = this.s, D = 4.5;
    switch (id) {
      case 'heat': s.v += (Input.mdown || Input.down('Space') ? 0.42 : -0.3) * dt + Math.sin(this.t * 3) * 0.02 * dt; s.v = clamp(s.v, 0, 1); if (s.v > s.band[0] && s.v < s.band[1]) s.inBand += dt; if (this.t > D) this.score(s.inBand / (D - 1.2)); break;
      case 'reagent': s.m += s.dir * dt * 1.3; if (s.m > 1) { s.m = 1; s.dir = -1; } if (s.m < 0) { s.m = 0; s.dir = 1; } if (Input.mclick || Input.hit('Space')) { const d = Math.abs(s.m - s.zone); s.hits.push(clamp(1 - d / 0.14, 0, 1)); Audio.play(d < 0.07 ? 'uiok' : 'bad'); s.zone = rand(0.25, 0.75); if (s.hits.length >= 3) this.score(s.hits.reduce((a, b) => a + b, 0) / 3); } break;
      case 'stir': { const a = Math.atan2(Input.my - 400, Input.mx - 640); if (s.ang !== null) { const d = Math.abs(angDiff(s.ang, a)); s.speed = lerp(s.speed, d / dt, dt * 4); } s.ang = a; if (s.speed > 5 && s.speed < 14) s.good += dt; if (this.t > D) this.score(s.good / (D - 0.8)); break; }
      case 'cool': { s.drift += rand(-1, 1) * dt * 2.2; s.drift = clamp(s.drift, -0.9, 0.9); const ctl = (Input.down('KeyD') ? 1 : 0) - (Input.down('KeyA') ? 1 : 0); s.v += (s.drift * 0.35 + ctl * 0.6) * dt + ((Input.mx - (this._lmx || Input.mx)) / 400); this._lmx = Input.mx; s.v = clamp(s.v, 0, 1); if (Math.abs(s.v - 0.5) < 0.12) s.good += dt; if (this.t > D) this.score(s.good / (D - 0.6)); break; }
      case 'bag': if (Input.mclick) { for (const k of s.chunks) if (k.hp > 0 && dist(Input.mx, Input.my, k.x, k.y) < k.r) { k.hp--; Audio.play('clank', 0, 0.5); if (k.hp <= 0) Audio.play('tink'); break; } } { const left = s.chunks.filter(k => k.hp > 0).length; if (left === 0 || this.t > 6) this.score(1 - left / s.chunks.length); } break;
    }
  }
  score(v) { this.scores.push(clamp(v, 0, 1)); this.phase = 'feedback'; this.fb = clamp(v, 0, 1); setTimeout(() => this.next(), 900); }
  draw(c) {
    // RV interior cutaway
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a3226'); g.addColorStop(1, '#1a160e'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#5a4a32'; c.fillRect(0, 560, W, 160); c.fillStyle = '#6a5a3a'; for (let x = 0; x < W; x += 80) c.fillRect(x, 560, 2, 160);
    c.fillStyle = '#7a6a4a'; c.fillRect(0, 60, W, 120); c.strokeStyle = '#3a2a1a'; c.lineWidth = 3; for (let x = 40; x < W; x += 200) { c.strokeRect(x, 70, 180, 100); c.fillStyle = '#c8a050'; c.fillRect(x + 84, 116, 12, 6); }
    c.fillStyle = '#c8ccd0'; c.fillRect(1040, 200, 180, 140); c.fillStyle = 'rgba(0,0,0,.15)'; for (let i = 0; i < 6; i++) c.fillRect(1040, 210 + i * 22, 180, 3);
    // bench
    c.fillStyle = '#8a8a80'; c.fillRect(380, 470, 520, 20); c.fillStyle = '#5a5a52'; c.fillRect(400, 490, 20, 70); c.fillRect(860, 490, 20, 70);
    // flask + burner
    c.fillStyle = '#333'; c.fillRect(610, 450, 60, 20); c.fillStyle = `rgba(80,160,255,${0.4 + Math.sin(this.t * 10) * 0.2})`; c.beginPath(); c.ellipse(640, 448, 18, 6, 0, 0, TAU); c.fill();
    const tint = this.i >= 2 ? '#5ac8f0' : this.i >= 1 ? '#8ac8a0' : '#c8d0a0';
    c.fillStyle = 'rgba(220,240,255,.25)'; c.strokeStyle = '#dfefff'; c.lineWidth = 3; c.beginPath(); c.moveTo(625, 300); c.lineTo(655, 300); c.lineTo(655, 340); c.lineTo(710, 430); c.quadraticCurveTo(640, 450, 570, 430); c.lineTo(625, 340); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = tint; c.beginPath(); c.moveTo(600, 380); c.lineTo(680, 380); c.lineTo(710, 430); c.quadraticCurveTo(640, 450, 570, 430); c.closePath(); c.fill();
    for (const b of this.bubbles) { c.strokeStyle = `rgba(255,255,255,${b.life * 0.6})`; c.lineWidth = 1.5; c.beginPath(); c.arc(b.x, b.y, 3, 0, TAU); c.stroke(); }
    // cooks
    const J1 = poseStatic(330, 560, 1), J2 = poseStatic(960, 560, -1);
    drawFigure(c, J1, LOOKS.walterHaz, 1, {}); drawFigure(c, J2, LOOKS.jaceHaz, -1, {});
    // header
    UI.panel(c, 20, 16, W - 40, 40, 0.8);
    UI.text(c, this.o.tutorial ? 'FIRST COOK' : 'COOKING · DAY ' + Game.state.day, 40, 44, 20, '#9fe88a', 'left', true);
    COOK_STEPS.forEach((s, k) => { const x = 360 + k * 170; c.fillStyle = k < this.scores.length ? '#3d7a3a' : k === this.i ? '#c8a040' : '#333'; rrect(c, x, 24, 160, 24, 5); c.fill(); UI.text(c, (k + 1) + '. ' + s.name, x + 80, 41, 12, '#fff', 'center'); });
    if (this.phase === 'result') return this.drawResult(c);
    const step = COOK_STEPS[this.i]; if (!step) return;
    // walter line
    UI.panel(c, 40, 590, 820, 100, 0.85); drawPortrait(c, 50, 600, 80, LOOKS.walterHaz);
    UI.text(c, 'WALTER', 146, 622, 15, '#9fe88a', 'left', true); c.font = `17px ${FONT}`; c.fillStyle = '#eee'; wrapText(c, step.walter + (this.o.tutorial ? ' ' + step.help : ''), 146, 648, 700, 22);
    if (this.phase === 'brief') {
      UI.panel(c, W / 2 - 300, 180, 600, 180, 0.94); UI.text(c, step.name, W / 2, 230, 34, '#fff', 'center', true); c.font = `18px ${FONT}`; c.fillStyle = '#ddd'; c.textAlign = 'left'; wrapText(c, step.help, W / 2 - 260, 270, 520, 24);
      c.globalAlpha = 0.6 + Math.sin(this.t * 5) * 0.4; UI.text(c, 'CLICK TO START', W / 2, 345, 16, '#ffd060', 'center', true); c.globalAlpha = 1;
      UI.cursor(c); return;
    }
    const s = this.s, D = 4.5;
    // timer
    if (this.phase === 'play' && step.id !== 'reagent') { c.fillStyle = '#222'; c.fillRect(440, 80, 400, 8); c.fillStyle = '#e8c060'; c.fillRect(440, 80, 400 * clamp(1 - this.t / (step.id === 'bag' ? 6 : D), 0, 1), 8); }
    switch (step.id) {
      case 'heat': { const x = 900, y = 200, h = 300; c.fillStyle = '#111'; rrect(c, x, y, 50, h, 8); c.fill(); c.fillStyle = 'rgba(80,220,80,.45)'; c.fillRect(x, y + h * (1 - s.band[1]), 50, h * (s.band[1] - s.band[0])); c.fillStyle = s.v > s.band[1] ? '#ff5030' : '#ff9030'; c.fillRect(x + 12, y + h * (1 - s.v), 26, h * s.v); c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(x, y, 50, h); UI.text(c, Math.round(80 + s.v * 220) + '°', x + 25, y - 12, 18, '#fff', 'center', true); UI.text(c, 'HOLD MOUSE', x + 25, y + h + 26, 14, '#ffd060', 'center', true); break; }
      case 'reagent': { const x = 390, y = 140, w = 500; c.fillStyle = '#111'; rrect(c, x, y, w, 34, 6); c.fill(); c.fillStyle = 'rgba(80,220,80,.55)'; c.fillRect(x + w * (s.zone - 0.07), y, w * 0.14, 34); c.fillStyle = '#fff'; c.fillRect(x + w * s.m - 3, y - 6, 6, 46); UI.text(c, 'CLICK! ' + s.hits.length + '/3', x + w / 2, y + 64, 18, '#ffd060', 'center', true); s.hits.forEach((h, k) => UI.text(c, h > 0.7 ? 'PERFECT' : h > 0.3 ? 'OK' : 'MISS', x + 140 + k * 110, y + 94, 15, h > 0.7 ? '#9fe88a' : h > 0.3 ? '#ffd060' : '#ff6050', 'center', true)); break; }
      case 'stir': { c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2; c.setLineDash([6, 6]); c.beginPath(); c.arc(640, 400, 110, 0, TAU); c.stroke(); c.setLineDash([]); const k = clamp(s.speed / 20, 0, 1); c.fillStyle = '#111'; c.fillRect(440, 110, 400, 18); c.fillStyle = 'rgba(80,220,80,.5)'; c.fillRect(440 + 400 * 5 / 20, 110, 400 * 9 / 20, 18); c.fillStyle = '#fff'; c.fillRect(440 + 400 * k - 3, 104, 6, 30); UI.text(c, 'CIRCLE THE MOUSE AROUND THE FLASK', 640, 160, 16, '#ffd060', 'center', true); break; }
      case 'cool': { const x = 390, y = 140, w = 500; c.fillStyle = '#111'; rrect(c, x, y, w, 30, 6); c.fill(); c.fillStyle = 'rgba(80,180,255,.5)'; c.fillRect(x + w * 0.38, y, w * 0.24, 30); c.fillStyle = '#fff'; c.fillRect(x + w * s.v - 3, y - 6, 6, 42); UI.text(c, 'A / D  or move the mouse to keep it centered', x + w / 2, y + 62, 16, '#ffd060', 'center', true); break; }
      case 'bag': { c.fillStyle = '#9aa0a6'; c.fillRect(440, 290, 400, 220); c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(440, 290, 400, 220); for (const k of s.chunks) { if (k.hp <= 0) { c.fillStyle = '#7fd8f0'; for (let j = 0; j < 5; j++) c.fillRect(k.x + rand(-12, 12), k.y + rand(-10, 10), 6, 6); continue; } c.fillStyle = k.hp === 2 ? '#5ac8f0' : '#8fe0ff'; c.strokeStyle = '#1a4a5a'; c.beginPath(); for (let j = 0; j < 6; j++) { const a = j * TAU / 6 + k.x; c.lineTo(k.x + Math.cos(a) * k.r, k.y + Math.sin(a) * k.r * 0.75); } c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(k.x - 8, k.y - 10, 10, 4); } UI.text(c, 'CLICK THE CRYSTAL SLABS', 640, 280, 16, '#ffd060', 'center', true); break; }
    }
    if (this.phase === 'feedback') { const f = this.fb; UI.text(c, f > 0.8 ? 'PERFECT' : f > 0.5 ? 'GOOD' : f > 0.25 ? 'SLOPPY' : 'BOTCHED', W / 2, 260, 56, f > 0.8 ? '#9fe88a' : f > 0.5 ? '#ffd060' : '#ff6050', 'center', true); }
    UI.cursor(c);
  }
  drawResult(c) {
    const r = this.result;
    c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 0, W, H);
    UI.panel(c, W / 2 - 300, 130, 600, 440, 0.95);
    UI.text(c, 'BATCH COMPLETE', W / 2, 190, 34, '#fff', 'center', true);
    // the product
    for (let i = 0; i < 14; i++) { const x = W / 2 - 120 + (i % 7) * 40, y = 230 + Math.floor(i / 7) * 34; c.fillStyle = i % 2 ? '#5ac8f0' : '#8fe0ff'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 16, y + 6); c.lineTo(x + 10, y + 24); c.lineTo(x - 6, y + 18); c.closePath(); c.fill(); }
    UI.text(c, r.purity.toFixed(1) + '% PURE', W / 2, 360, 50, r.purity >= 95 ? '#7fd8f0' : r.purity >= 85 ? '#9fe88a' : '#ffd060', 'center', true);
    UI.text(c, '+' + r.bags + ' bags', W / 2, 400, 22, '#ddd', 'center');
    const line = r.purity >= 99 ? '"Ninety-nine point one. Jace... that\'s art."' : r.purity >= 92 ? '"That is a respectable batch. Respectable."' : r.purity >= 80 ? '"Adequate. Street-grade adequate. We can do better."' : '"This is... chili powder, Jace. Chili. Powder."';
    UI.text(c, line + ' — Walter', W / 2, 446, 17, '#e8dcc0', 'center');
    if (UI.btn(c, W / 2 - 110, 490, 220, 54, 'CONTINUE')) { if (this.o.done) this.o.done(r); }
    UI.cursor(c);
  }
}

// ---------------------------------------------------------------- ENDING + CREDITS
class EndingScene {
  constructor() { this.t = 0; this.x = 0; this.theme = THEMES.dusk; }
  enter() { Audio.music('menu'); }
  update(dt) { this.t += dt; this.x += dt * 900; if (this.t > 46 || (this.t > 3 && Input.hit('Escape'))) { Game.setScene(new HubScene({ title: 'THE END', message: 'You finished Fixing Good. The desert is still out there: keep cooking, trading and fighting off the odd ambush for as long as you like.' })); } }
  draw(c) {
    drawBackdrop(c, this.theme, this.x); drawGround(c, this.theme, this.x);
    // Jace in the getaway car, screaming into the sunset
    const bob = Math.sin(this.t * 16) * 1.5;
    drawCar(c, 470, GROUND + bob, 260, '#c0a040', 'sedan', 1);
    c.fillStyle = LOOKS.jace.skin; c.beginPath(); c.arc(640, GROUND - 74 + bob, 10, 0, TAU); c.fill(); c.fillStyle = LOOKS.jace.hatColor; c.beginPath(); c.arc(640, GROUND - 77 + bob, 10, PI, TAU); c.fill();
    c.fillStyle = 'rgba(0,0,0,' + Math.max(0, 1 - this.t / 2) + ')'; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, W, 100); c.fillRect(0, H - 100, W, 100);
    const t = this.t;
    if (t > 2 && t < 12) { c.globalAlpha = Math.min(1, (t - 2) / 1.5, (12 - t) / 1.5); drawLogo(c, W / 2 - 160, 120, 0.85, 0.4); c.globalAlpha = 1; }
    const credits = ['FIXING GOOD', '', 'STARRING', 'Jace Pinkett', 'Walter Black', '', 'AND', 'Rafa "Loco" Vargas', 'The Cortez Twins', 'Augusto Fenn', 'Don Esteban', 'Uncle Dutch', 'Agent Hal Brewer', 'Morty Goodfellow, Esq.', 'Dusty', '', 'Every pixel, gunshot and note', 'was generated in code', '', 'STATS', 'Kills: ' + Game.state.stats.kills, 'Headshots: ' + Game.state.stats.heads, 'Batches cooked: ' + Game.state.stats.cooks, 'Best purity: ' + Game.state.stats.bestPurity.toFixed(1) + '%', 'Street earnings: ' + fmtMoney(Game.state.stats.earned), '', '', 'Thanks for playing.'];
    if (t > 12) { const off = (t - 12) * 48; credits.forEach((l, i) => { const y = H + 20 + i * 40 - off; if (y < 90 || y > H - 80) return; UI.text(c, l, W / 2, y, l === l.toUpperCase() && l.length > 2 ? 26 : 22, l === l.toUpperCase() ? '#9fe88a' : '#fff', 'center', l === l.toUpperCase()); }); }
    UI.text(c, 'Esc to skip', W - 20, H - 30, 13, '#888', 'right');
  }
}
