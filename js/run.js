'use strict';
// ============================================================
//  FIXING GOOD - BLUE SKY RUN: an endless roguelite mode.
//  Generated nights, contracts with modifiers, perks between nights,
//  boss nights, permadeath, high scores and a daily seed.
// ============================================================
const RUN_DEMO_NIGHTS = 3;
const RUN_PERKS = [
  { k: 'vital', name: 'Thick Skin', desc: '+25 max health', max: 4, col: '#e05a4a' },
  { k: 'tough', name: 'Kevlar Lining', desc: 'Take 12% less damage', max: 3, col: '#8aa0c0' },
  { k: 'power', name: 'Hot Loads', desc: '+15% gun damage', max: 4, col: '#ffb040' },
  { k: 'quick', name: 'Speed Loader', desc: 'Reload 15% faster', max: 3, col: '#9fe88a' },
  { k: 'vamp', name: 'Bloodlust', desc: 'Every kill heals 8 more HP', max: 3, col: '#c02030' },
  { k: 'greed', name: 'Sticky Fingers', desc: '+50% cash from pickups and contracts', max: 3, col: '#8fe07a' },
  { k: 'fleet', name: 'Running Shoes', desc: 'Move 10% faster', max: 3, col: '#70c0f0' },
  { k: 'volatile', name: 'Volatile', desc: '20% chance enemies explode when they die (it won\'t hurt you)', max: 2, col: '#ff7030' },
  { k: 'head', name: 'Marksman', desc: 'Headshots deal 40% more damage', max: 2, col: '#e8e0c0' },
  { k: 'hollow', name: 'Hollow Points', desc: '+20% damage on every gun', max: 1, col: '#d0a060', apply: s => { s.upgrades.hollow = true; } },
  { k: 'fists', name: 'Brass Knuckles', desc: '+50% melee damage', max: 1, col: '#c0b080', apply: s => { s.upgrades.fists = true; } },
  { k: 'dragon', name: 'Dragon\'s Breath', desc: 'Incendiary shotgun shells. Comes with a 12ga pump.', max: 1, col: '#ff5020', apply: s => { s.upgrades.dragon = true; runGive(s, 'shotgun'); } },
  { k: 'crystals', name: 'Walter\'s Recipe', desc: '+3 Bang Crystals (G)', max: 9, col: '#7fd8f0', apply: s => { s.bangs += 3; } },
  { k: 'molotov', name: 'Cocktail Hour', desc: '+3 Molotovs (V)', max: 9, col: '#ff9040', apply: s => { s.molotovs += 3; } },
  { k: 'plates', name: 'Plate Carrier', desc: '+100 armour', max: 9, col: '#a0a8b0', apply: s => { s.armor = Math.min(300, s.armor + 100); } },
  { k: 'medic', name: 'Field Medic', desc: '+2 medkits (H)', max: 9, col: '#f0f0f0', apply: s => { s.medkits += 2; } },
  { k: 'resupply', name: 'Resupply', desc: 'Fill every ammo type to the brim', max: 99, col: '#d8c890', apply: s => { runFillAmmo(s); } },
  { k: 'g_revolver', name: '.357 Magnum', desc: 'A revolver and 36 rounds', max: 1, col: '#c0c0c0', gun: 'revolver' },
  { k: 'g_smg', name: 'Uzi-9', desc: 'An SMG and 160 rounds of 9mm', max: 1, col: '#c0c0c0', gun: 'smg' },
  { k: 'g_rifle', name: 'AKM Rifle', desc: 'A rifle and 180 rounds of 7.62', max: 1, col: '#c0c0c0', gun: 'rifle', night: 3 },
  { k: 'g_mg', name: 'M60 "Trunk Gun"', desc: 'Belt-fed. 300 rounds of 7.62', max: 1, col: '#c0c0c0', gun: 'mg', night: 6 },
];
const RUN_AMMO = { pistol: ['9mm', 90], revolver: ['357', 36], shotgun: ['12ga', 40], smg: ['9mm', 160], rifle: ['762', 180], mg: ['762', 300] };
function runGive(s, gun) { if (!s.weapons.includes(gun)) s.weapons.push(gun); const [t, n] = RUN_AMMO[gun]; s.ammo[t] = (s.ammo[t] || 0) + n; }
function runFillAmmo(s) { const cap = { '9mm': 360, '357': 60, '12ga': 72, '762': 420 }; for (const g of s.weapons) { const a = RUN_AMMO[g]; if (a) s.ammo[a[0]] = Math.max(s.ammo[a[0]] || 0, cap[a[0]]); } }

const RUN_MODS = [
  { k: 'blackout', name: 'BLACKOUT', desc: 'Lights out. Flashlight only.', pay: 1.25 },
  { k: 'bloodbath', name: 'BLOODBATH', desc: '50% more enemies', pay: 1.5 },
  { k: 'tough', name: 'TOUGH CROWD', desc: 'Enemies have 40% more health', pay: 1.4 },
  { k: 'walter', name: 'WALTER RIDES ALONG', desc: 'Walter fights with you', pay: 0.8 },
  { k: 'ambush', name: 'PINCER', desc: 'They come from behind too', pay: 1.3 },
  { k: 'powder', name: 'POWDER KEG', desc: 'Explosive barrels everywhere', pay: 1.1 },
  { k: 'payday', name: 'PAYDAY', desc: 'Double pay, double trouble', pay: 2.0 },
];
const RUN_BOSSES = [
  { t: 'spider', name: 'Spider', look: 'spider' }, { t: 'rafa', name: 'Rafa "Loco" Vargas' }, { t: 'marco', name: 'Marco Cortez' }, { t: 'leo', name: 'Leo Cortez' },
  { t: 'gordo', name: 'El Gordo' }, { t: 'gideon', name: 'Gideon' }, { t: 'esteban', name: 'Don Esteban' }, { t: 'rook', name: 'Rook' }, { t: 'fenn', name: 'Augusto Fenn' }, { t: 'dutch', name: 'Uncle Dutch' },
];
const RUN_PLACES = [
  { name: 'the old drive-in', theme: 'dusk', look: 'thug' }, { name: 'Sandoval\'s scrapyard', theme: 'junkyard', look: 'thug' }, { name: 'a trailer park', theme: 'night', look: 'biker' },
  { name: 'the Crossroads Motel', theme: 'motel', look: 'biker' }, { name: 'a cartel stash house', theme: 'ranch', look: 'cartel' }, { name: 'a storage depot', theme: 'warehouse', look: 'guard' },
  { name: 'a chop shop', theme: 'compound', look: 'biker' }, { name: 'the dry riverbed', theme: 'day', look: 'thug' }, { name: 'the Southside projects', theme: 'southside', look: 'thug' },
  { name: 'a superlab', theme: 'lab', look: 'labguard' }, { name: 'Main Street', theme: 'town', look: 'cartel' },
];

const Run = {
  today() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); },
  start(daily) {
    const seed = daily ? this.today() * 7 + 13 : Math.floor(Math.random() * 1e9);
    const s = Game.newState();
    Object.assign(s, { chapter: 3, money: 300, medkits: 1, armor: 0, bangs: 1, molotovs: 1, weapons: ['pistol'], ammo: { '9mm': 150, '357': 0, '12ga': 0, '762': 0 }, perks: {}, walterBangs: true,
      run: { seed, daily, night: 1, cleared: 0, kills0: 0, earned: 0, rerolls: 0 } });
    Game.state = s; Game.cheatGod = DEV.has('god');
    Game.setScene(new RunScene('contract'));
  },
  rng(salt) { const r = Game.state.run; return srand(r.seed + r.night * 7919 + salt * 104729 + r.rerolls * 31); },
  isBossNight() { return Game.state.run.night % 4 === 0; },
  contracts() {
    const run = Game.state.run, r = this.rng(1), n = run.night, out = [];
    const types = ['turf', 'bounty', 'hold'].concat(n >= 2 ? ['highway'] : []).sort(() => r() - 0.5);
    const usedPlaces = [];
    for (let i = 0; i < 3; i++) {
      let type = this.isBossNight() ? 'boss' : types[i % types.length];
      let place = type === 'highway' ? { name: 'Route 9', theme: 'highway', look: 'biker' } : RUN_PLACES[Math.floor(r() * RUN_PLACES.length)];
      for (let k = 0; k < 6 && usedPlaces.includes(place); k++) place = RUN_PLACES[Math.floor(r() * RUN_PLACES.length)];
      usedPlaces.push(place);
      const nm = i === 2 ? Math.min(2, 1 + Math.floor(r() * (1 + n / 4))) : Math.min(2, Math.floor(r() * (1 + n / 3)));
      const mods = []; const pool = RUN_MODS.filter(m => !(type === 'highway' && ['blackout', 'walter', 'ambush', 'powder', 'tough'].includes(m.k)));
      while (mods.length < nm) { const m = pool[Math.floor(r() * pool.length)]; if (!mods.includes(m)) mods.push(m); }
      let boss = (type === 'boss' || type === 'bounty') ? RUN_BOSSES[Math.floor(r() * Math.min(RUN_BOSSES.length, 3 + n))] : null;
      for (let k = 0; k < 6 && boss && out.some(o => o.boss === boss); k++) boss = RUN_BOSSES[Math.floor(r() * Math.min(RUN_BOSSES.length, 3 + n))];
      const base = 450 + n * 220 + (type === 'boss' ? 1200 : type === 'bounty' ? 300 : 0);
      const pay = Math.round(base * mods.reduce((a, m) => a * m.pay, 1) / 10) * 10;
      const title = type === 'boss' ? 'Kill ' + boss.name : type === 'bounty' ? 'Bounty: ' + boss.name : type === 'hold' ? 'Hold ' + place.name : type === 'highway' ? 'Convoy run on Route 9' : 'Turf war at ' + place.name;
      const desc = type === 'boss' ? `${boss.name} is back, or someone wearing his face. Either way, he wants you dead.` : type === 'bounty' ? `${boss.name} is holed up at ${place.name} with a crew.` : type === 'hold' ? `Keep the stash at ${place.name}. Waves of them, from both sides.` : type === 'highway' ? 'Ride the RV roof. Bikes and trucks, all the way to the state line.' : `Clear a rival crew out of ${place.name}.`;
      out.push({ seed: Math.floor(r() * 1e9), type, place, mods, boss, pay, title, desc, diff: type === 'boss' ? 3 : type === 'hold' || mods.length > 1 ? 2 : 1 });
    }
    return out;
  },
  play(ct) { Game.state.run.kills0 = Game.state.stats.kills; Game.setScene(new LevelScene(null, () => this.cleared(ct), { def: makeRunLevel(ct), run: true })); },
  cleared(ct) {
    const s = Game.state, run = s.run;
    const pay = Math.round(ct.pay * (1 + 0.5 * perk('greed')));
    s.money += pay; run.earned += pay; run.cleared++; run.lastPay = pay; run.night++;
    if (DEMO && run.cleared >= RUN_DEMO_NIGHTS) return this.over(true);
    Game.setScene(new RunScene('perk'));
  },
  score(s) { const r = s.run; return r.cleared * 1000 + s.stats.kills * 20 + s.stats.heads * 30 + Math.floor(r.earned / 10); },
  over(demoDone) {
    const s = Game.state, sc = this.score(s), best = load('runbest') || { score: 0, night: 0 };
    const rec = { score: sc, nights: s.run.cleared, kills: s.stats.kills, heads: s.stats.heads, earned: s.run.earned, perks: Object.assign({}, s.perks), daily: s.run.daily, seed: s.run.seed };
    rec.newBest = sc > best.score; if (rec.newBest) store('runbest', { score: sc, night: s.run.cleared });
    if (s.run.daily) { const k = 'rundaily' + this.today(), db = load(k) || 0; if (sc > db) store(k, sc); rec.dailyBest = Math.max(sc, db); }
    rec.best = Math.max(sc, best.score); rec.demoDone = !!demoDone; rec.cause = demoDone ? null : (Game.level && Game.level.failReason) || null;
    Game.cheatGod = false;
    Game.setScene(new RunOverScene(rec));
  },
};

// ---------------------------------------------------------------- level generator
function makeRunLevel(ct) {
  const r = srand(ct.seed), n = Game.state.run.night, has = k => ct.mods.some(m => m.k === k);
  const hpMul = (1 + 0.08 * (n - 1)) * (has('tough') ? 1.4 : 1);
  const cnt = k => Math.round(k * (has('bloodbath') ? 1.5 : 1) * (has('payday') ? 1.3 : 1));
  const pool = ['thug', 'gunner', 'gunner', 'smg', 'knifer'].concat(n >= 2 ? ['shotgunner'] : [], n >= 3 ? ['rifleman', 'smg'] : [], n >= 4 ? ['rifleman'] : [], n >= 5 ? ['heavy'] : [], n >= 8 ? ['heavy', 'shotgunner'] : []);
  const pick = () => pool[Math.floor(r() * pool.length)];
  const sp = (t, extra) => Object.assign({ t, hp: Math.round((ARCH[t] ? ARCH[t].hp : 80) * hpMul) }, extra);
  const intro = [{ cine: true, title: ct.title.toUpperCase(), sub: 'NIGHT ' + n + (ct.mods.length ? '  ·  ' + ct.mods.map(m => m.name).join(' · ') : '') + '  ·  BLUE SKY RUN' }, { wait: 1.4 }];
  const outro = [{ objective: '', do: lv => lv.toast('CONTRACT DONE  +' + fmtMoney(Math.round(ct.pay * (1 + 0.5 * perk('greed'))))) }, { wait: 1.6 }, { fade: 'out' }, { end: true }];
  // ---- highway: the RV roof
  if (ct.type === 'highway') {
    const steps = intro.concat([{ cine: false, objective: 'Survive the convoy run' }]);
    const waves = 3 + Math.floor(n / 3);
    for (let w = 0; w < waves; w++) {
      const bikes = cnt(2 + Math.floor(n / 2) + (r() < 0.5 ? 1 : 0)), trucks = w >= 1 && r() < 0.4 + n * 0.05 ? 1 + (n >= 7 && r() < 0.5 ? 1 : 0) : 0;
      steps.push({ do: lv => { for (let i = 0; i < bikes; i++) { const front = (has('ambush') || i % 3 === 2) && r() < 0.6; lv.spawnVehicle('bike', front ? { offset: 440 + i * 100, from: 'right' } : { offset: -320 - i * 110 }); } for (let i = 0; i < trucks; i++) lv.spawnVehicle('truck', i % 2 ? { offset: 560, from: 'right', gunners: 2 + Math.floor(n / 4) } : { offset: -540, gunners: 2 + Math.floor(n / 4) }); } }, { clear: true });
      if (w < waves - 1) steps.push({ do: lv => lv.toast('WAVE ' + (w + 1) + ' / ' + waves + ' CLEARED') }, { wait: 1.2 });
    }
    return { theme: 'highway', width: 90000, start: 480, mode: 'highway', zoom: 1, noDecals: true, music: 'action', enemyLook: 'biker', showCount: true, steps: steps.concat(outro) };
  }
  const night = has('blackout') || ['night', 'motel', 'warehouse'].includes(ct.place.theme);
  const hold = ct.type === 'hold', width = hold ? 2600 : 3800 + Math.floor(r() * 1600);
  const steps = intro.slice();
  if (hold) {
    const waves = 3 + Math.floor(n / 3);
    steps.push({ cine: false, objective: 'Hold the stash: ' + waves + ' waves', arena: [0, width] });
    for (let w = 0; w < waves; w++) {
      const k = cnt(3 + Math.floor(n * 0.7) + w), spawn = [];
      for (let i = 0; i < k; i++) spawn.push(sp(pick(), { from: i % 2 ? 'left' : 'right' }));
      if (w === waves - 1 && n >= 3) spawn.push(sp('heavy', { from: 'right' }));
      steps.push({ do: lv => lv.toast('WAVE ' + (w + 1) + ' / ' + waves), spawn }, { clear: true }, { wait: 1.5 });
    }
  } else {
    steps.push({ cine: false, objective: ct.type === 'turf' ? 'Clear out the crew' : 'Find ' + (ct.boss ? ct.boss.name : 'the target') });
    const waves = (ct.type === 'boss' ? 2 : 3) + Math.floor(n / 4);
    for (let w = 0; w < waves; w++) {
      const x = 500 + (w + 0.5) * (width - 1100) / waves, k = cnt(2 + Math.floor(n * 0.6) + (r() < 0.5 ? 1 : 0)), spawn = [];
      for (let i = 0; i < k; i++) spawn.push(i === k - 1 && (has('ambush') || r() < 0.3) ? sp(pick(), { from: 'left' }) : sp(pick(), { x: x + 120 + r() * 420 }));
      if (has('ambush')) spawn.push(sp(pick(), { from: 'left' }));
      steps.push({ reach: x - 500 }, { spawn }, { clear: true });
    }
    if (ct.boss) {
      const b = ct.boss, bhp = Math.round((ARCH[b.t] ? ARCH[b.t].hp : 600) * (0.7 + 0.08 * n) * (has('tough') ? 1.25 : 1));
      steps.push({ reach: width - 1000 }, { arena: [width - 1500, width], spawn: [sp(b.t, { id: 'boss', x: width - 280, name: b.name, hp: bhp, boss: true }), sp(pick(), { x: width - 420 }), sp(pick(), { from: 'left' })], boss: 'boss', objective: 'Kill ' + b.name, music: 'boss' });
      steps.push({ wait: 10 }, { spawn: [sp(pick(), { from: 'left' }), sp(pick(), { from: 'right' })] });
      steps.push({ until: lv => !lv.named.boss.alive }, { boss: null }, { clear: true });
    }
  }
  return {
    theme: ct.place.theme, width, start: hold ? width / 2 : 180, walter: has('walter'), music: 'action', enemyLook: ct.place.look,
    dark: night ? (has('blackout') ? 0.82 : 0.6) : undefined, flashlight: has('blackout'),
    build(L) {
      let x = hold ? 260 : 560;
      while (x < width - 260) {
        if (hold && Math.abs(x - width / 2) < 160) { x += 200; continue; }
        const k = r();
        if (has('powder') && r() < 0.5) L.barrel(x, r() < 0.6 ? 'red' : 'propane');
        else if (k < 0.24) L.crate(x, 64, 56 + Math.floor(r() * 3) * 6, ['wood', 'metal', 'cardboard', 'sandbag'][Math.floor(r() * 4)]);
        else if (k < 0.36) { L.car(x, ['#7a2a2a', '#2a3a5a', '#4a4a3a', '#5a3a6a', '#c8c0a0'][Math.floor(r() * 5)], r() < 0.4 ? 'pickup' : 'sedan', r() < 0.5 ? 1 : -1); x += 200; }
        else if (k < 0.5) L.barrel(x, r() < 0.7 ? 'red' : 'propane');
        else if (k < 0.68) L.plat(x, GROUND - 125 - Math.floor(r() * 3) * 10, 200 + Math.floor(r() * 80));
        else if (k < 0.8) L.stack(x, r() < 0.5 ? 'wood' : 'metal');
        else if (!night) L.cactus(x, 80 + r() * 60);
        if (night && r() < 0.5) L.lamp(x + 60, 250);
        x += (hold ? 190 : 230) + r() * 240;
      }
      if (hold) L.crate(width / 2 - 40, 80, 40, 'wood');
    },
    steps: steps.concat(outro),
  };
}

// ---------------------------------------------------------------- between nights: perks, Dusty's van, contracts
class RunScene {
  constructor(phase) {
    this.phase = phase; this.t = 0;
    if (phase === 'perk') this.rollPerks();
    this.cts = Run.contracts();
  }
  enter() { Audio.music('hub'); Game.level = null; }
  rollPerks() {
    const s = Game.state, r = Run.rng(2 + (this.rolls || 0) * 17), n = s.run.night;
    const ok = RUN_PERKS.filter(p => (s.perks[p.k] || 0) < p.max && (!p.night || n >= p.night) && !(p.gun && s.weapons.includes(p.gun)) && !(p.k === 'dragon' && s.upgrades.dragon));
    const pickd = []; while (pickd.length < 3 && ok.length) pickd.push(ok.splice(Math.floor(r() * ok.length), 1)[0]);
    this.perks = pickd;
  }
  takePerk(p) {
    const s = Game.state; s.perks[p.k] = (s.perks[p.k] || 0) + 1;
    if (p.gun) runGive(s, p.gun); if (p.apply) p.apply(s);
    Audio.play('cash'); this.phase = 'contract'; this.t = 0;
  }
  update(dt) { this.t += dt; if (Input.hit('Escape')) this.confirmQuit = !this.confirmQuit; }
  draw(c) {
    const s = Game.state, run = s.run;
    drawBackdrop(c, THEMES.night, this.t * 10); drawGround(c, THEMES.night, this.t * 10);
    drawRV(c, 60, GROUND, { lit: true, dirty: true });
    c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, W, H);
    UI.text(c, 'BLUE SKY RUN', 40, 56, 34, '#7fd8f0', 'left', true);
    UI.text(c, (run.daily ? 'DAILY RUN · ' : '') + 'NIGHT ' + run.night + (DEMO ? '  ·  DEMO: ' + RUN_DEMO_NIGHTS + ' NIGHTS' : ''), 40, 84, 16, '#c8d8c0');
    UI.text(c, 'SCORE ' + Run.score(s).toLocaleString(), W - 40, 56, 26, '#fff', 'right', true);
    UI.text(c, 'CASH ' + fmtMoney(s.money) + '   ·   KILLS ' + s.stats.kills + '   ·   MEDKITS ' + s.medkits + '   ·   ARMOUR ' + Math.round(s.armor), W - 40, 84, 15, '#c8d8c0', 'right');
    this.drawLoadout(c);
    if (this.phase === 'perk') this.drawPerks(c); else this.drawContracts(c);
    if (this.confirmQuit) {
      c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(0, 0, W, H); UI.panel(c, W / 2 - 240, 250, 480, 200, 0.97);
      UI.text(c, 'End this run?', W / 2, 310, 28, '#fff', 'center', true); UI.text(c, 'Your score is recorded.', W / 2, 340, 15, '#bbb', 'center');
      if (UI.btn(c, W / 2 - 220, 370, 200, 50, 'END RUN')) { this.confirmQuit = false; Run.over(); }
      if (UI.btn(c, W / 2 + 20, 370, 200, 50, 'KEEP GOING')) this.confirmQuit = false;
    } else if (UI.btn(c, W - 170, 104, 130, 34, 'END RUN', { size: 13 })) this.confirmQuit = true;
    UI.cursor(c);
  }
  drawLoadout(c) {
    const s = Game.state; let x = 40;
    UI.text(c, 'GUNS', 40, 124, 12, '#888', 'left', true);
    for (const g of s.weapons) { const d = WEAPONS[g]; UI.text(c, d.name + (d.ammo ? '  ' + (s.ammo[d.ammo] || 0) : ''), x, 144, 14, '#e8e0c8'); c.font = `14px ${FONT}`; x += c.measureText(d.name + (d.ammo ? '  ' + (s.ammo[d.ammo] || 0) : '')).width + 24; }
    const ks = Object.keys(s.perks); x = 40;
    UI.text(c, 'PERKS', 40, 172, 12, '#888', 'left', true);
    if (!ks.length) UI.text(c, 'none yet', 40, 192, 14, '#777');
    for (const k of ks) { const p = RUN_PERKS.find(q => q.k === k); if (!p || p.gun) continue; const l = p.name + (s.perks[k] > 1 ? ' ×' + s.perks[k] : ''); UI.text(c, l, x, 192, 14, p.col); c.font = `14px ${FONT}`; x += c.measureText(l).width + 20; if (x > W - 200) break; }
  }
  drawPerks(c) {
    const s = Game.state;
    UI.text(c, 'NIGHT ' + (s.run.night - 1) + ' SURVIVED   +' + fmtMoney(s.run.lastPay || 0), W / 2, 250, 30, '#9fe88a', 'center', true);
    UI.text(c, 'Pick one', W / 2, 280, 16, '#ccc', 'center');
    this.perks.forEach((p, i) => {
      const x = W / 2 - 480 + i * 330, y = 300, w = 300, h = 190;
      UI.panel(c, x, y, w, h, 0.92); c.fillStyle = p.col; c.fillRect(x, y, 6, h);
      UI.text(c, p.name.toUpperCase(), x + 24, y + 44, 22, p.col, 'left', true);
      const lvl = s.perks[p.k] || 0; if (p.max > 1 && p.max < 9) UI.text(c, 'LV ' + (lvl + 1) + ' / ' + p.max, x + w - 20, y + 44, 13, '#aaa', 'right');
      c.font = `15px ${FONT}`; c.fillStyle = '#ddd'; wrapText(c, p.desc, x + 24, y + 78, w - 44, 20);
      if (UI.btn(c, x + 24, y + h - 60, w - 48, 42, 'TAKE IT', { size: 15 })) this.takePerk(p);
    });
    const cost = 150 + 100 * (this.rolls || 0);
    if (UI.btn(c, W / 2 - 110, 506, 220, 40, 'REROLL  ' + fmtMoney(cost), { size: 14, disabled: s.money < cost }) && s.money >= cost) { s.money -= cost; this.rolls = (this.rolls || 0) + 1; this.rollPerks(); }
    // Dusty's van
    UI.text(c, 'DUSTY\'S VAN', W / 2 - 480, 588, 16, '#ffd060', 'left', true);
    const items = [['Ammo top-up', 250, () => runFillAmmo(s)], ['Medkit', 300, () => s.medkits++], ['Armour +50', 300, () => { s.armor = Math.min(300, s.armor + 50); }], ['Bang Crystal', 200, () => s.bangs++], ['Molotov', 150, () => s.molotovs++]];
    items.forEach(([l, p, f], i) => { if (UI.btn(c, W / 2 - 480 + i * 196, 600, 180, 56, l, { sub: fmtMoney(p), size: 14, disabled: s.money < p }) && s.money >= p) { s.money -= p; f(); Audio.play('cash'); } });
  }
  drawContracts(c) {
    const s = Game.state;
    UI.text(c, Run.isBossNight() ? 'BOSS NIGHT' : 'CHOOSE TONIGHT\'S CONTRACT', W / 2, 250, 30, Run.isBossNight() ? '#ff6050' : '#fff', 'center', true);
    UI.text(c, 'Die and the run is over. No checkpoints. No second chances.', W / 2, 280, 15, '#c8a090', 'center');
    this.cts.forEach((ct, i) => {
      const x = W / 2 - 480 + i * 330, y = 300, w = 300, h = 330;
      UI.panel(c, x, y, w, h, 0.92);
      UI.text(c, ct.type.toUpperCase(), x + 24, y + 34, 13, ct.type === 'boss' ? '#ff6050' : '#7fd8f0', 'left', true);
      UI.text(c, '★'.repeat(ct.diff) + '☆'.repeat(3 - ct.diff), x + w - 20, y + 34, 15, '#ffd060', 'right');
      c.font = `bold 20px ${FONT}`; c.fillStyle = '#fff'; wrapText(c, ct.title, x + 24, y + 66, w - 44, 24);
      c.font = `14px ${FONT}`; c.fillStyle = '#bbb'; wrapText(c, ct.desc, x + 24, y + 122, w - 44, 19);
      ct.mods.forEach((m, j) => { UI.text(c, m.name, x + 24, y + 168 + j * 34, 14, '#ff9a60', 'left', true); UI.text(c, m.desc, x + 24, y + 184 + j * 34, 12, '#c8b8a8'); });
      UI.text(c, fmtMoney(Math.round(ct.pay * (1 + 0.5 * perk('greed')))), x + 24, y + h - 72, 24, '#8fe07a', 'left', true);
      if (UI.btn(c, x + 24, y + h - 56, w - 48, 42, 'TAKE THE CONTRACT', { size: 15 })) Run.play(ct);
    });
  }
}

class RunOverScene {
  constructor(rec) { this.r = rec; this.t = 0; }
  enter() { Audio.music('menu'); }
  update(dt) { this.t += dt; }
  draw(c) {
    const r = this.r;
    drawBackdrop(c, THEMES.dusk, this.t * 8); drawGround(c, THEMES.dusk, this.t * 8);
    c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(0, 0, W, H);
    UI.text(c, r.demoDone ? 'DEMO RUN COMPLETE' : 'RUN OVER', W / 2, 130, 64, r.demoDone ? '#9fe88a' : '#ff5a4a', 'center', true);
    UI.text(c, r.demoDone ? 'The full game has endless nights, boss nights every fourth night, and a daily run.' : (r.cause || '"You got greedy, Jace. Greed is a chemical reaction too." — Walter'), W / 2, 170, 17, '#ddd', 'center');
    const rows = [['Nights survived', r.nights], ['Kills', r.kills], ['Headshots', r.heads], ['Cash earned', fmtMoney(r.earned)], ['SCORE', r.score.toLocaleString()], [r.daily ? 'Today\'s best' : 'Best ever', (r.daily ? r.dailyBest : r.best).toLocaleString()]];
    rows.forEach(([k, v], i) => { if (this.t < 0.3 + i * 0.2) return; const big = k === 'SCORE'; UI.text(c, k, W / 2 - 200, 240 + i * 42, big ? 26 : 20, big ? '#fff' : '#bbb', 'left', big); UI.text(c, String(v), W / 2 + 200, 240 + i * 42, big ? 26 : 20, big ? '#7fd8f0' : '#fff', 'right', true); });
    if (r.newBest && this.t > 1.6) { c.save(); c.shadowColor = '#7fd8f0'; c.shadowBlur = 16; UI.text(c, 'NEW BEST!', W / 2 + 230, 408, 22, '#7fd8f0', 'left', true); c.restore(); }
    if (this.t > 1.4) {
      if (UI.btn(c, W / 2 - 330, 540, 210, 54, 'RUN IT BACK')) Run.start(false);
      if (!DEMO && UI.btn(c, W / 2 - 105, 540, 210, 54, 'DAILY RUN')) Run.start(true);
      if (UI.btn(c, W / 2 + 120, 540, 210, 54, 'MAIN MENU')) { Game.state = null; Game.setScene(new MenuScene()); }
    }
    UI.text(c, 'Seed ' + r.seed, W - 16, H - 14, 12, '#666', 'right');
    UI.cursor(c);
  }
}

// ---------------------------------------------------------------- DEMO: the end-of-demo screen
const DEMO_CHAPTERS = 3;
class DemoEndScene {
  constructor() { this.t = 0; }
  enter() { Audio.music('menu'); Game.save(); }
  update(dt) { this.t += dt; }
  draw(c) {
    drawBackdrop(c, THEMES.dusk, this.t * 10); drawGround(c, THEMES.dusk, this.t * 10);
    drawRV(c, 760, GROUND, { lit: true, dirty: true });
    c.fillStyle = 'rgba(0,0,0,.62)'; c.fillRect(0, 0, W, H);
    drawLogo(c, 70, 50, 0.7, 0.3);
    UI.text(c, 'THANKS FOR PLAYING THE DEMO', 74, 250, 34, '#9fe88a', 'left', true);
    const lines = ['Southside is yours. Spider is watching. And Lena, Jace\'s best friend since third grade, is about to call.',
      '', 'The full game has:', '•  17 story chapters, about two and a half hours, with choices and a post-credits scene',
      '•  A cartel ranch, a superlab, a convoy heist on the RV roof, and a war with the Dust Dogs',
      '•  All five dealing districts: University Row, the truck stop and the casino strip',
      '•  Blue Sky Run without limits: endless nights, boss nights and a daily seed'];
    lines.forEach((l, i) => UI.text(c, l, 74, 296 + i * 28, i === 2 ? 18 : 17, i === 2 ? '#fff' : '#ddd', 'left', i === 2));
    if (this.t > 0.8) {
      if (UI.btn(c, 74, 520, 260, 54, 'KEEP DEALING', { sub: 'Back to the map' })) Game.setScene(new HubScene());
      if (UI.btn(c, 350, 520, 260, 54, 'BLUE SKY RUN', { sub: RUN_DEMO_NIGHTS + '-night demo run' })) Run.start(false);
      if (UI.btn(c, 626, 520, 200, 54, 'MAIN MENU')) Game.setScene(new MenuScene());
    }
    UI.cursor(c);
  }
}
