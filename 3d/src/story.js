// ============================================================
//  FIXING GOOD 3D - chapters and levels (x runs along each level, z is across it)
// ============================================================
import { PI, rand, choose, srand, G, fmtMoney } from './core.js';
import { Gun } from './actor.js';
import { D } from './dialogue.js';
import { V3 } from './gfx.js';

const junkCols = [0x7a5a3a, 0x3a4a6a, 0x6a2a2a, 0x4a5a3a, 0x2a2a2a, 0x8a8a7a, 0x5a3a2a];
function junkPiles(L, len, half, seed) { const r = srand(seed); for (let x = 6; x < len; x += 9 + r() * 6) for (const s of [-1, 1]) { const z = s * (half - 1.5); L.car(x, z, junkCols[Math.floor(r() * junkCols.length)], r() < 0.3 ? 'pickup' : 'sedan', r() < 0.5 ? 0 : PI); } }
function edgeFence(L, len, half) { for (let x = 5; x < len; x += 10) { L.fence(x, -half + 0.2, 10); L.fence(x, half - 0.2, 10); } }
function cacti(L, len, half, n, seed) { const r = srand(seed); for (let i = 0; i < n; i++) L.cactus(r() * len, (r() < 0.5 ? -1 : 1) * (half - 1 - r() * 3), 2.5 + r() * 2.5); }

export const LEVELS = {
  // ---------------------------------------------------------------- PROLOGUE
  intro: {
    env: 'day', len: 60, half: 14, start: 6, walter: true, walterUnarmed: true, noHud: true, unarmed: true, music: 'menu',
    build(L) { L.rv(20, -4, { foil: true }); L.table(33, 2.5); L.crate(31, 3.5, 0.7, 0.5, 0.5, 'cardboard'); L.crate(36, -1, 0.6, 0.45, 0.5, 'cardboard'); cacti(L, 60, 14, 10, 1); L.rock(44, 6, 1.2); L.rock(12, 8, 0.8); },
    steps: [
      { cine: true, music: 'menu', do: lv => { lv.walter.pos.set(34, 0, 1); lv.walter.yaw = -PI / 2; } },
      { title: 'COLD START', sub: 'CHAPTER ONE' }, { wait: 1.0 },
      { walk: ['player', 31, 0.5, true] }, { face: [['walter', 'player'], ['player', 'walter']] },
      { say: D[0] }, { walk: ['walter', 28, -1.2, true, false] }, { walk: ['player', 29, -0.2, true] }, { fade: 'out' }, { end: true },
    ],
  },
  introFight: {
    env: 'day', len: 90, half: 14, start: 28, walter: true, music: 'tense', enemyLook: 'thug',
    npcs: [{ id: 'kev', kind: 'kev', team: 'enemy', x: 44, z: 1, look: 'kev', guns: ['knife'] }, { id: 'dimitri', kind: 'dimitri', team: 'enemy', x: 46, z: -1.5, look: 'dimitri', guns: ['pistol'] }],
    build(L) { L.rv(10, -4, { foil: true }); L.car(52, 2, 0x5a3a6a, 'sedan', PI); L.crate(37, -3, 1.3, 1.1, 1.3); L.crate(60, 4, 1.2, 1.2, 1.2, 'cardboard'); L.stack(20, 6); L.barrel(42, 5, 'red'); L.crate(70, -5, 1.2); L.barrel(66, -2, 'red'); cacti(L, 90, 14, 14, 2); L.rock(80, 6, 1.5); },
    steps: [
      { cine: true, do: lv => { lv.walter.pos.set(25, 0, 1.5); lv.named.kev.yaw = lv.named.dimitri.yaw = -PI / 2; } }, { wait: 0.6 },
      { say: D[1] },
      { do: lv => lv.hostilize(['kev', 'dimitri']), music: 'action', objective: 'Defend the RV' },
      { banter: ['walter', 'Jace! [F] to punch, [F][F][F] for a combo! Click to shoot.'] }, { wait: 3 },
      { banter: ['walter', 'Hold right-click to aim down the sights.'] }, { clear: true },
      { banter: ['jace', 'Yo, they brought friends!'], spawn: [{ t: 'gunner', from: 'ahead' }, { t: 'gunner', from: 'ahead' }, { t: 'thug', from: 'ahead' }] },
      { banter: ['walter', 'Take cover behind the crates! [C] crouches, [R] reloads.'] }, { wait: 2 }, { banter: ['walter', 'That red barrel. Shoot it. Trust me.'] },
      { clear: true }, { cp: true },
      { spawn: [{ t: 'thug', from: 'behind' }, { t: 'knifer', from: 'behind' }, { t: 'gunner', from: 'ahead' }, { t: 'gunner', from: 'ahead' }], banter: ['walter', 'Behind us! [X] to dodge-roll!'] },
      { clear: true }, { wait: 1.2 },
      { objective: '', cine: true }, { face: [['walter', 'player'], ['player', 'walter']] },
      { say: D[2] }, { fade: 'out' }, { end: true },
    ],
  },
  // ---------------------------------------------------------------- CHAPTER 2
  junkyard: {
    env: 'junkyard', len: 150, half: 13, start: 6, walter: true, music: 'tense', enemyLook: 'thug',
    npcs: [{ id: 'rafa', kind: 'rafa', team: 'enemy', x: 26, z: 0, look: 'rafa', guns: ['gold'] }, { id: 'victim', kind: 'brawler', team: 'npc', x: 24, z: 1.2, look: 'goon', yaw: PI / 2 }],
    build(L) {
      junkPiles(L, 150, 13, 4); edgeFence(L, 150, 11);
      L.crate(40, 3, 1.4, 1.3, 1.4, 'metal'); L.car(50, -3, 0x3a4a6a, 'sedan', PI); L.barrel(58, 4, 'red'); L.stack(64, -5); L.car(72, 3, 0x6a2a2a); L.dock(80, -5, 6, 3); L.crate(88, 1, 1.2, 1.2, 1.2, 'cardboard'); L.barrel(92, -2, 'propane');
      L.car(100, 4, 0x4a5a3a, 'pickup', PI); L.crate(106, -3, 1.4, 1.3, 1.4, 'metal'); L.barrel(112, 3, 'red'); L.crate(120, -1, 1.4, 1.2, 1.4, 'metal'); L.car(130, 3, 0x2a2a2a, 'sedan', PI); L.barrel(136, -3, 'red'); L.dock(142, 3, 5, 3);
      L.wallBox(147, 0, 4, 3, 7, 'container'); L.lamp(20, -9); L.lamp(70, -9); L.lamp(115, -9); L.sign(14, -9, 'LOCO SALVAGE', '#f07a46');
    },
    steps: [
      { cine: true, title: 'LOCO', sub: 'CHAPTER TWO', do: lv => { lv.named.rafa.yaw = -PI / 2; } }, { wait: 1.2 },
      { walk: ['player', 21, 0, true] }, { walk: ['walter', 19, 1.6, true, false] }, { face: [['rafa', 'player'], ['victim', 'rafa']] },
      { say: D[3] },
      { do: lv => { const r = lv.named.rafa; r.yaw = Math.atan2(lv.named.victim.pos.x - r.pos.x, lv.named.victim.pos.z - r.pos.z); r.startMelee(lv); } }, { wait: 0.3 }, { do: lv => lv.named.rafa.startMelee(lv) }, { wait: 0.3 },
      { do: lv => { const r = lv.named.rafa, v = lv.named.victim; r.melee = null; r.combo = 2; r.startMelee(lv); setTimeout(() => { if (v.alive) v.hurt(999, { kind: 'melee', p: v.center(), dir: r.fwd(), knock: 12 }, lv); }, 180); } }, { wait: 1.4 },
      { say: D[4] },
      { do: lv => { lv.fists(true); lv.walter.passive = true; }, objective: 'Fist fight! [F] jab-cross-kick', music: 'action' },
      { spawn: [{ t: 'brawler', x: 30, z: 2, look: 'goon' }, { t: 'brawler', x: 31, z: -2 }] }, { clear: true },
      { spawn: [{ t: 'brawler', x: 12, z: 0 }, { t: 'brawler', x: 32, z: 3 }, { t: 'brawler', x: 33, z: -3 }], banter: ['rafa', 'Ooooh! Again! AGAIN!'] }, { clear: true },
      { do: lv => { lv.fists(false); lv.walter.passive = false; }, objective: '', cine: true, music: 'tense' }, { face: [['rafa', 'player']] },
      { say: D[5] },
      { do: lv => lv.remove('rafa') },
      { cine: false, objective: 'Fight through the junkyard. Get Rafa.', music: 'action', cp: true },
      { spawn: [{ t: 'gunner', x: 46 }, { t: 'gunner', x: 52 }, { t: 'thug', x: 42 }, { t: 'smg', x: 58 }] },
      { reach: 56 }, { spawn: [{ t: 'gunner', x: 80, z: -5, y: 1.1 }, { t: 'shotgunner', x: 76 }, { t: 'thug', from: 'behind' }] },
      { clear: true }, { cp: true }, { banter: ['walter', 'He went toward that container! Keep pushing!'] },
      { reach: 86 }, { spawn: [{ t: 'smg', x: 104 }, { t: 'gunner', x: 110 }, { t: 'knifer', x: 100 }, { t: 'shotgunner', x: 114 }] },
      { clear: true }, { cp: true },
      { reach: 116 }, { arena: [110, 150], cine: true, spawn: [{ t: 'rafa', id: 'rafa', x: 138, z: 0, name: 'Rafa "Loco" Vargas', alert: false }], do: lv => { lv.named.rafa.passive = true; lv.named.rafa.yaw = -PI / 2; } },
      { say: D[6] },
      { cine: false, do: lv => lv.hostilize(['rafa']), boss: 'rafa', music: 'boss', objective: 'Kill Rafa' },
      { spawn: [{ t: 'gunner', from: 'ahead' }, { t: 'thug', from: 'behind' }] }, { wait: 12 }, { spawn: [{ t: 'smg', from: 'ahead' }, { t: 'gunner', from: 'behind' }] },
      { until: lv => !lv.named.rafa.alive }, { boss: null, objective: '' }, { clear: true }, { wait: 1.5 },
      { cine: true }, { face: [['walter', 'player'], ['player', 'walter']] }, { say: D[7] },
      { do: lv => { G.state.money += 3000; lv.toast('+$3,000 from Rafa\'s safe'); }, wait: 1.6 }, { fade: 'out' }, { end: true },
    ],
  },
  // ---------------------------------------------------------------- CHAPTER 3
  warehouse: {
    env: 'warehouse', len: 120, half: 10, start: 4, walter: false, music: 'tense', enemyLook: 'guard', flashlight: true, stealth: true, noMesas: true,
    build(L, lv) {
      L.room('brick', 9);
      for (let x = 12; x < 115; x += 16) { L.wallBox(x, -7.5, 6, 3.4, 1.4, 'metal'); L.wallBox(x + 4, 7.5, 6, 3.4, 1.4, 'metal'); }
      L.stack(18, 2); L.crate(30, -2, 1.4, 1.1, 1.4, 'cardboard'); L.dock(42, 3, 7, 3); L.crate(52, -3, 1.4, 1.4, 1.4, 'metal'); L.barrel(58, 2, 'blue'); L.crate(64, 4, 1.3, 1.2, 1.3, 'cardboard');
      L.dock(74, -3, 7, 3); L.barrel(84, 3, 'blue'); L.crate(90, -2, 1.4, 1.4, 1.4, 'metal'); L.stack(98, 3); L.barrel(104, -3, 'red'); L.barrel(110, 2, 'blue');
      for (const x of [15, 45, 75, 105]) L.light(x, 8, 0, 0x9fb4ff, 10, 22);
      L.wallBox(118, 0, 0.6, 4, 3, 'metal'); L.sign(117, 4, 'EXIT', '#9fe89f', -PI / 2, 2.8);
      [[58, 2], [84, 3], [110, 2]].forEach(([x, z]) => L.interact(x, z, '[E] Steal precursor barrel', lv2 => { lv2.vars.barrels = (lv2.vars.barrels || 0) + 1; lv2.toast('Precursor barrel ' + lv2.vars.barrels + '/3'); lv2.takeBarrel(x, z); }));
    },
    steps: [
      { cine: true, title: 'BARRELS', sub: 'CHAPTER THREE' }, { wait: 1.4 },
      { say: D[8] },
      { cine: false, objective: 'Steal 3 precursor barrels (0/3)', music: 'tense', spawn: [{ t: 'gunner', x: 30, idle: true, patrol: 4 }, { t: 'gunner', x: 50, idle: true, patrol: 5 }, { t: 'gunner', x: 43, z: 3, y: 1.1, idle: true }, { t: 'smg', x: 76, idle: true, patrol: 5 }, { t: 'gunner', x: 74, z: -3, y: 1.1, idle: true }, { t: 'shotgunner', x: 100, idle: true, patrol: 4 }] },
      { until: lv => { lv.objective = 'Steal 3 precursor barrels (' + (lv.vars.barrels || 0) + '/3)'; return (lv.vars.barrels || 0) >= 3; } },
      { cp: true, do: lv => { lv.vars.alarm = true; }, objective: 'ALARM! Get to the exit', music: 'action', banter: ['walter', '(radio) Is that an alarm?! Jace, GET OUT of there!'] },
      { spawn: [{ t: 'rifleman', from: 'ahead' }, { t: 'smg', from: 'ahead' }, { t: 'gunner', from: 'behind' }, { t: 'shotgunner', from: 'behind' }] },
      { wait: 6 }, { spawn: [{ t: 'rifleman', from: 'ahead' }, { t: 'gunner', from: 'ahead' }] },
      { reach: 114 }, { do: lv => { G.state.precursor += 10; lv.toast('+10 precursor'); } }, { fade: 'out' }, { end: true },
    ],
  },
  // ---------------------------------------------------------------- CHAPTER 4 (highway)
  highway1: {
    env: 'highway', mode: 'highway', len: 9, half: 1.1, music: 'action', enemyLook: 'biker',
    steps: [
      { cine: true, title: 'HIGHWAY TO NOWHERE', sub: 'CHAPTER FOUR' }, { wait: 1.2 }, { say: D[9] },
      { cine: false, objective: 'Protect the RV', do: lv => { for (let i = 0; i < 3; i++) lv.spawnVehicle('bike', { offset: -14 + i * 4, lane: i % 2 ? 1 : -1 }); } },
      { clear: true }, { banter: ['walter', 'More behind us. A truck!'], do: lv => { lv.spawnVehicle('truck', { offset: -16, lane: -1, gunners: 2 }); lv.spawnVehicle('bike', { offset: 18, lane: 1, from: 'ahead' }); } },
      { clear: true }, { cp: true }, { banter: ['jace', 'Yo, they\'re coming from up front too!'], do: lv => { lv.spawnVehicle('bike', { offset: 20, lane: 1, from: 'ahead' }); lv.spawnVehicle('bike', { offset: 15, lane: -1, from: 'ahead' }); lv.spawnVehicle('bike', { offset: -10, lane: 1 }); lv.spawnVehicle('bike', { offset: -14, lane: -1 }); } },
      { clear: true }, { do: lv => { lv.spawnVehicle('truck', { offset: -17, lane: 1, gunners: 3 }); lv.spawnVehicle('truck', { offset: 18, lane: -1, from: 'ahead', gunners: 2 }); } },
      { clear: true }, { wait: 1 }, { cine: true, say: D[10] },
      { do: lv => { G.state.money += 1200; lv.toast('+$1,200 looted from the bikes'); } }, { fade: 'out' }, { end: true },
    ],
  },
  // ---------------------------------------------------------------- CHAPTER 5
  motel: {
    env: 'motel', len: 110, half: 13, start: 30, walter: true, music: 'tense', enemyLook: 'cartel', ground: 'asphalt',
    build(L) {
      L.facade(55, -12.5, 'motel', 100, 6, 0, 1.2); L.neon(56, 7.8, -11.6, 'CROSSROADS MOTEL');
      L.rv(18, -6, { lit: true }); L.car(38, -7, 0x3a4a5a); L.car(58, 4, 0x7a6a3a, 'pickup', PI); L.car(78, -6, 0x5a2a2a); L.crate(48, 1, 1.0, 0.9, 1.0, 'cardboard'); L.barrel(66, -4, 'red'); L.crate(92, 3, 1.4, 1.3, 1.4, 'metal'); L.barrel(97, -5, 'propane'); L.crate(10, 4, 1.3, 1.3, 1.3, 'metal');
      for (const x of [8, 30, 52, 74, 96]) L.lamp(x, 9); cacti(L, 110, 13, 6, 5);
    },
    steps: [
      { cine: true, title: 'THE TWINS', sub: 'CHAPTER FIVE', do: lv => { lv.walter.pos.set(28, 0, 2); } }, { face: [['walter', 'player'], ['player', 'walter']] }, { wait: 1.2 },
      { say: D[11] },
      { cine: false, objective: 'Survive the motel ambush', music: 'action', spawn: [{ t: 'gunner', from: 'ahead' }, { t: 'smg', from: 'ahead' }, { t: 'gunner', from: 'behind' }] },
      { clear: true }, { spawn: [{ t: 'shotgunner', from: 'ahead' }, { t: 'rifleman', from: 'ahead' }, { t: 'smg', from: 'behind' }, { t: 'thug', from: 'behind' }] }, { clear: true }, { cp: true },
      { spawn: [{ t: 'rifleman', from: 'ahead' }, { t: 'rifleman', from: 'behind' }, { t: 'heavy', from: 'ahead' }, { t: 'gunner', from: 'behind' }], banter: ['walter', 'That one\'s wearing armor! Aim for the head!'] }, { clear: true }, { cp: true },
      { cine: true, spawn: [{ t: 'marco', id: 'marco', x: 72, z: 1, name: 'Marco Cortez', look: 'twinA', alert: false }, { t: 'leo', id: 'leo', x: 74, z: -2, name: 'Leo Cortez', look: 'twinB', alert: false }], do: lv => { for (const id of ['marco', 'leo']) { lv.named[id].passive = true; lv.named[id].yaw = -PI / 2; } } },
      { wait: 0.8 }, { say: D[12] },
      { cine: false, do: lv => lv.hostilize(['marco', 'leo']), boss: 'marco', music: 'boss', objective: 'Kill the Cortez twins' },
      { until: lv => !lv.named.marco.alive || !lv.named.leo.alive }, { do: lv => { lv.bossId = lv.named.marco.alive ? 'marco' : 'leo'; lv.banter('jace', 'One down! Where\'s his brother?!'); } },
      { until: lv => !lv.named.marco.alive && !lv.named.leo.alive }, { boss: null, objective: '' }, { clear: true }, { wait: 1.5 },
      { cine: true }, { face: [['walter', 'player'], ['player', 'walter']] }, { say: D[13] },
      { do: lv => { G.state.money += 2000; lv.toast('+$2,000'); } }, { fade: 'out' }, { end: true },
    ],
  },
  // ---------------------------------------------------------------- CHAPTER 6
  goldenhen: {
    env: 'town', len: 50, half: 12, start: 6, walter: true, walterUnarmed: true, noHud: true, unarmed: true, music: 'hub', ground: 'asphalt',
    npcs: [{ id: 'fenn', x: 28, z: -4, look: 'fenn', yaw: PI / 2 }],
    build(L) { L.facade(25, -10, 'hen', 26, 7, 0, 1); L.facade(4, -10, 'store', 16, 6); L.facade(46, -10, 'store', 16, 6); L.table(26, -4, 1.6, 1); L.table(31, -4, 1.6, 1); L.car(8, 5, 0xc8c0a0, 'sedan'); L.lamp(15, 8); L.lamp(38, 8); },
    steps: [
      { cine: true, title: 'GOLDEN HEN', sub: 'CHAPTER SIX' }, { walk: ['player', 25, -2.2, true] }, { walk: ['walter', 24, -4, true, false] }, { wait: 0.8 }, { face: [['fenn', 'player'], ['player', 'fenn']] },
      { say: D[14] }, { fade: 'out' }, { end: true },
    ],
  },
  superlab: {
    env: 'lab', len: 70, half: 12, start: 25, walter: true, music: 'tense', enemyLook: 'labguard', playerLook: 'jaceHaz', noMesas: true, ground: 'tile',
    failIf: lv => lv.walter && lv.walter.downed > 0 && !lv.cinematic ? 'Walter went down. The batch is ruined.' : null,
    build(L) {
      L.room('lab', 10);
      for (const [x, z] of [[8, -8], [20, -8.5], [50, -8.5], [62, -8], [14, 8.5], [56, 8.5]]) L.tank(x, z, 5);
      L.plat(10, 6, 8, 3, 2.4); L.plat(60, 6, 8, 3, 2.4); L.crate(25, 4, 1.3, 1.2, 1.3, 'metal'); L.crate(45, -4, 1.3, 1.2, 1.3, 'metal'); L.barrel(16, -3, 'red'); L.barrel(55, 3, 'red');
      L.table(35, 0, 3, 1.2); for (const x of [10, 30, 50, 65]) L.light(x, 8.5, 0, 0xe8f4ff, 16, 26);
    },
    steps: [
      { cine: true, do: lv => { const w = lv.walter; w.look = null; w.pos.set(35, 0, -1.4); w.yaw = 0; w.frozen = true; w.invuln = false; w.guns = []; w.maxHp = w.hp = 1100; lv.swapLook(w, 'walterHaz'); } },
      { wait: 1 }, { face: [['player', 'walter']] }, { say: D[15] },
      { cine: false, arena: [0, 70], objective: 'Defend Walter while he cooks', music: 'action' },
      { spawn: [{ t: 'smg', x: 2 }, { t: 'gunner', x: 68 }, { t: 'rifleman', x: 67 }] }, { clear: true },
      { spawn: [{ t: 'shotgunner', x: 2 }, { t: 'smg', x: 3 }, { t: 'rifleman', x: 60, z: 6, y: 3 }, { t: 'gunner', x: 68 }] }, { clear: true }, { cp: true },
      { banter: ['walter', 'Halfway there! Keep them OFF me!'], spawn: [{ t: 'heavy', x: 68 }, { t: 'smg', x: 2 }] }, { wait: 5 }, { spawn: [{ t: 'rifleman', x: 2 }, { t: 'smg', x: 68 }] }, { clear: true }, { cp: true },
      { do: lv => { lv.addPickup(lv.player.pos.clone().add(V3(1, 2, 0)), 'med'); lv.banter('walter', 'There\'s a first-aid kit by the vent. Take it.'); } },
      { spawn: [{ t: 'heavy', x: 2 }, { t: 'shotgunner', x: 68 }, { t: 'rifleman', x: 60, z: 6, y: 3 }] }, { wait: 6 }, { spawn: [{ t: 'rifleman', x: 10, z: 6, y: 3 }, { t: 'gunner', x: 68 }] }, { clear: true },
      { wait: 1, cine: true }, { say: D[16] },
      { do: lv => { G.state.money += 6000; G.state.bags += 12; G.state.purity = Math.max(G.state.purity, 99.1); lv.toast('+$6,000 · +12 bags of 99.1% blue'); } }, { fade: 'out' }, { end: true },
    ],
  },
  // ---------------------------------------------------------------- CHAPTER 7
  ranch: {
    env: 'ranch', len: 170, half: 14, start: 5, walter: true, music: 'action', enemyLook: 'cartel', ground: 'grass',
    build(L) {
      for (let x = 20; x < 170; x += 40) L.facade(x, -14, 'hacienda', 40, 7, 0, 1.4);
      for (let x = 10; x < 170; x += 22) L.palm(x, -11.5, 7 + (x % 3));
      L.crate(16, 2, 2.2, 0.9, 0.7, 'sandbag'); L.car(24, -4, 0xe8e0c8, 'pickup'); L.crate(34, 3, 1.4, 1.3, 1.4); L.barrel(38, -2, 'red'); L.dock(46, -6, 7, 3);
      L.crate(56, 3, 2.2, 0.9, 0.7, 'sandbag'); L.car(64, -3, 0x2a2a2a, 'sedan', PI); L.barrel(72, 4, 'propane'); L.stack(80, -5); L.dock(88, 5, 7, 3); L.crate(98, -2, 2.2, 0.9, 0.7, 'sandbag');
      L.barrel(104, 3, 'red'); L.car(112, -4, 0xc8a040, 'pickup', PI); L.crate(124, 3, 2.2, 0.9, 0.7, 'sandbag'); L.dock(134, -6, 6, 3); L.barrel(140, 2, 'red'); L.stack(150, -3); L.car(158, 4, 0xffffff, 'sedan', PI); L.barrel(164, -2, 'red');
      cacti(L, 170, 14, 6, 7);
    },
    steps: [
      { cine: true, title: 'RANCHO MUERTE', sub: 'CHAPTER SEVEN' }, { wait: 1.2 }, { face: [['walter', 'player'], ['player', 'walter']] }, { say: D[17] },
      { cine: false, objective: 'Storm the ranch', spawn: [{ t: 'rifleman', x: 36 }, { t: 'gunner', x: 46, z: -6, y: 1.1 }, { t: 'smg', x: 30 }, { t: 'gunner', x: 26 }] },
      { clear: true }, { cp: true }, { reach: 50, spawn: [{ t: 'shotgunner', x: 68 }, { t: 'rifleman', x: 76 }, { t: 'smg', x: 66 }, { t: 'rifleman', x: 88, z: 5, y: 1.1 }] },
      { clear: true }, { cp: true }, { reach: 82, spawn: [{ t: 'heavy', x: 104 }, { t: 'rifleman', x: 98 }, { t: 'smg', x: 96 }, { t: 'gunner', from: 'behind' }], banter: ['walter', 'Armored one! Use the barrels!'] },
      { clear: true }, { cp: true }, { reach: 112, spawn: [{ t: 'rifleman', x: 134, z: -6, y: 1.1 }, { t: 'shotgunner', x: 128 }, { t: 'smg', x: 132 }, { t: 'heavy', x: 138 }, { t: 'thug', from: 'behind' }] },
      { clear: true }, { cp: true },
      { reach: 140 }, { arena: [128, 170], cine: true, spawn: [{ t: 'esteban', id: 'esteban', x: 160, z: 0, name: 'Don Esteban', alert: false }], do: lv => { lv.named.esteban.passive = true; lv.named.esteban.yaw = -PI / 2; } },
      { say: D[18] },
      { cine: false, do: lv => lv.hostilize(['esteban']), boss: 'esteban', music: 'boss', objective: 'Kill Don Esteban' },
      { spawn: [{ t: 'rifleman', from: 'ahead' }, { t: 'smg', from: 'behind' }] }, { wait: 14 }, { spawn: [{ t: 'shotgunner', from: 'ahead' }, { t: 'rifleman', from: 'behind' }] },
      { until: lv => !lv.named.esteban.alive }, { boss: null, objective: '' }, { clear: true }, { wait: 1.5 },
      { cine: true }, { face: [['walter', 'player'], ['player', 'walter']] }, { say: D[19] },
      { do: lv => { G.state.money += 8000; lv.toast('+$8,000'); } }, { fade: 'out' }, { end: true },
    ],
  },
  // ---------------------------------------------------------------- FINALE
  highway2: {
    env: 'highway', mode: 'highway', len: 9, half: 1.1, music: 'boss', enemyLook: 'biker',
    steps: [
      { cine: true, title: 'LAST RIDE', sub: 'CHAPTER EIGHT' }, { wait: 1.2 }, { say: D[20] },
      { cine: false, objective: 'Chase down the Dust Dogs', do: lv => { lv.spawnVehicle('truck', { offset: 18, lane: 1, from: 'ahead', gunners: 3 }); lv.spawnVehicle('bike', { offset: -11, lane: -1 }); lv.spawnVehicle('bike', { offset: -15, lane: 1 }); } },
      { clear: true }, { cp: true }, { do: lv => { lv.spawnVehicle('truck', { offset: -17, lane: -1, gunners: 3 }); lv.spawnVehicle('bike', { offset: 16, lane: 1, from: 'ahead' }); lv.spawnVehicle('bike', { offset: 12, lane: -1, from: 'ahead' }); lv.spawnVehicle('bike', { offset: -9, lane: 1 }); } },
      { clear: true }, { cp: true }, { do: lv => { lv.spawnVehicle('truck', { offset: 18, lane: -1, from: 'ahead', gunners: 3 }); lv.spawnVehicle('truck', { offset: -17, lane: 1, gunners: 3 }); lv.spawnVehicle('bike', { offset: -10, lane: -1 }); } },
      { clear: true }, { wait: 1 }, { fade: 'out' }, { end: true },
    ],
  },
  compound: {
    env: 'compound', len: 160, half: 14, start: 5, walter: false, music: 'action', enemyLook: 'biker', ground: 'dirt',
    build(L, lv) {
      for (let x = 15; x < 160; x += 34) L.facade(x, -14, 'garage', 30, 7, 0, 1.2); edgeFence(L, 160, 12.5);
      L.rv(-6, 5, { dirty: true }); L.crate(18, 2, 2.2, 0.9, 0.7, 'sandbag'); L.car(26, -4, 0x3a3a3a, 'pickup', PI); L.barrel(34, 3, 'red'); L.dock(42, -6, 7, 3); L.crate(52, 2, 1.4, 1.4, 1.4, 'metal'); L.barrel(58, -3, 'propane'); L.car(66, 4, 0x5a2a2a);
      L.crate(76, -2, 2.2, 0.9, 0.7, 'sandbag'); L.dock(86, 5, 7, 3); L.barrel(92, -4, 'red');
      L.prop(sc => { lv.buildCage(108, 4); }); L.car(118, -4, 0xd8d0b0, 'sedan');
      L.crate(128, 3, 1.4, 1.4, 1.4, 'metal'); L.barrel(134, -2, 'red'); L.crate(140, -5, 2.2, 0.9, 0.7, 'sandbag'); L.dock(148, 5, 6, 3); L.barrel(154, -3, 'red');
      for (const x of [16, 50, 84, 118, 150]) L.lamp(x, 10);
      L.interact(108, 4, '[E] Free Walter', lv2 => { lv2.vars.freed = true; });
    },
    steps: [
      { cine: true, wait: 0.8 }, { say: D[21] },
      { cine: false, objective: 'Get to Walter', music: 'action', spawn: [{ t: 'gunner', x: 28 }, { t: 'smg', x: 34 }, { t: 'thug', x: 24 }, { t: 'shotgunner', x: 42, z: -6, y: 1.1 }] },
      { clear: true }, { cp: true }, { reach: 46, spawn: [{ t: 'rifleman', x: 62 }, { t: 'smg', x: 68 }, { t: 'heavy', x: 74 }, { t: 'knifer', from: 'behind' }] },
      { clear: true }, { cp: true }, { reach: 76, spawn: [{ t: 'rifleman', x: 86, z: 5, y: 1.1 }, { t: 'shotgunner', x: 94 }, { t: 'smg', x: 98 }, { t: 'thug', x: 100 }, { t: 'gunner', from: 'behind' }] },
      { clear: true }, { cp: true }, { objective: 'Free Walter from the cage' },
      { until: lv => lv.vars.freed }, { cine: true, do: lv => { lv.openCage(); const w = lv.addNPC({ id: 'walter', kind: 'walter', team: 'ally', x: 108, z: 4, look: 'walterHat', guns: ['pistol'], yaw: -PI / 2 }); w.passive = false; w.invuln = true; lv.walter = w; } },
      { face: [['walter', 'player'], ['player', 'walter']] }, { say: D[22] },
      { do: lv => { const st = G.state; if (!st.weapons.includes('mg')) { st.weapons.push('mg'); lv.player.guns.push(new Gun('mg')); } st.ammo['762'] += 300; lv.player.gi = lv.player.guns.findIndex(g => g.key === 'mg'); lv.toast('NEW WEAPON: M60 "Trunk Gun"'); st.walterBangs = true; } },
      { cine: false, objective: 'Kill Uncle Dutch', cp: true },
      { reach: 124 }, { arena: [116, 160], cine: true, spawn: [{ t: 'dutch', id: 'dutch', x: 150, z: 0, name: 'Uncle Dutch', alert: false }], do: lv => { lv.named.dutch.passive = true; lv.named.dutch.yaw = -PI / 2; } },
      { say: D[23] },
      { cine: false, do: lv => lv.hostilize(['dutch']), boss: 'dutch', music: 'boss' },
      { spawn: [{ t: 'rifleman', from: 'ahead' }, { t: 'smg', from: 'behind' }, { t: 'shotgunner', from: 'ahead' }] }, { wait: 12 }, { spawn: [{ t: 'heavy', from: 'ahead' }, { t: 'smg', from: 'behind' }] }, { wait: 14 }, { spawn: [{ t: 'rifleman', from: 'behind' }, { t: 'shotgunner', from: 'ahead' }] },
      { until: lv => !lv.named.dutch.alive }, { boss: null, objective: '' }, { clear: true }, { wait: 2 },
      { cine: true, do: lv => { const w = lv.walter; w.passive = true; w.downed = 999; w.hp = 1; } }, { face: [['player', 'walter']] },
      { say: D[24] }, { fade: 'out' }, { end: true },
    ],
  },
  ambush: {
    env: 'highway', mode: 'highway', len: 9, half: 1.1, music: 'action', enemyLook: 'biker',
    steps: [
      { cine: true, say: D[25] },
      { cine: false, objective: 'Fight off the ambush', do: lv => { const n = 2 + Math.min(3, G.state.chapter); for (let i = 0; i < n; i++) lv.spawnVehicle('bike', { offset: i % 2 ? -10 - i * 2 : 14 + i * 2, lane: i % 2 ? 1 : -1, from: i % 2 ? 'behind' : 'ahead' }); if (G.state.chapter >= 4) lv.spawnVehicle('truck', { offset: -17, lane: 1 }); } },
      { clear: true }, { do: lv => { const r = 400 + G.state.chapter * 150; G.state.money += r; lv.toast('+' + fmtMoney(r) + ' looted'); } }, { wait: 1.2 }, { end: true },
    ],
  },
};

export const CHAPTERS = [
  { title: 'Cold Start', node: 'rv', seq: [{ level: 'intro' }, { cook: 'tutorial' }, { level: 'introFight' }], after: 'You need to sell product and gear up. Rafa will see you when you have at least 8 bags.' },
  { title: 'Loco', node: 'junk', requires: s => s.bags >= 8 ? null : 'Rafa wants at least 8 bags. Cook more in the RV.', seq: [{ level: 'junkyard', onStart: s => { s.bags = Math.max(0, s.bags - 8); } }], after: 'Rafa is dead. You need precursor, lots of it. Vamonos Chemical keeps a warehouse full.' },
  { title: 'Barrels', node: 'chem', seq: [{ level: 'warehouse' }], after: 'Ten barrels of precursor. Time to lie low on the open road...' },
  { title: 'Highway to Nowhere', node: 'road', seq: [{ level: 'highway1' }], after: 'The Dust Dogs know your RV now. You need a place to hide. The Crossroads Motel is out on Route 9.' },
  { title: 'The Twins', node: 'motel', seq: [{ level: 'motel' }], after: 'Walter wants a meeting with the man who owns the Golden Hen.' },
  { title: 'Golden Hen', node: 'hen', seq: [{ level: 'goldenhen' }, { level: 'superlab' }], after: 'Don Esteban sent the hit squad. Fenn wants an answer delivered to his ranch.' },
  { title: 'Rancho Muerte', node: 'ranch', seq: [{ level: 'ranch' }], after: 'The cartel is finished. The Dust Dogs are not. Gear up: this is the last ride.' },
  { title: 'Last Ride', node: 'compound', seq: [{ level: 'highway2' }, { level: 'compound' }, { ending: true }], after: '' },
];

// ---------------------------------------------------------------- side jobs (generated)
const JOB_PLACES = [
  { name: 'the old drive-in', env: 'dusk', look: 'thug' }, { name: 'Sandoval\'s scrapyard', env: 'junkyard', look: 'thug' }, { name: 'a trailer park', env: 'night', look: 'biker' },
  { name: 'the Route 9 truck stop', env: 'motel', look: 'biker' }, { name: 'a cartel stash house', env: 'ranch', look: 'cartel' }, { name: 'a chop shop', env: 'compound', look: 'biker' }, { name: 'the dry riverbed', env: 'day', look: 'thug' },
];
const BOUNTY_NAMES = ['"Two-Teeth" Toby', 'Big Lupe', 'The Accountant', 'Junior Skaggs', 'Mad Dog Morales', 'Crazy Earl', 'Little Hector', 'Smiley Ruiz'];
export function makeJobs() {
  const st = G.state, r = srand(st.day * 977 + st.chapter * 31 + 7), out = [];
  const names = BOUNTY_NAMES.slice().sort(() => r() - 0.5), places = JOB_PLACES.slice().sort(() => r() - 0.5);
  for (let i = 0; i < 3; i++) {
    const place = places[i], diff = 1 + Math.floor(r() * 3), bounty = r() < 0.5, target = names[i];
    out.push({ seed: Math.floor(r() * 1e9), place, diff, bounty, target, walter: r() < 0.5, title: bounty ? 'Bounty: ' + target : 'Turf war at ' + place.name, desc: bounty ? `${target} owes Dusty money and is hiding out at ${place.name}. Bring Dusty his... apology.` : `A crew is moving cheap cut product out of ${place.name}. Shut them down.`, reward: 600 + diff * 450 + st.chapter * 300, done: false });
  }
  return out;
}
export function makeJobLevel(job) {
  const r = srand(job.seed), ch = G.state.chapter, len = 100 + Math.floor(r() * 40);
  const pool = ['thug', 'gunner', 'gunner', 'smg'].concat(ch >= 2 ? ['shotgunner', 'knifer'] : [], ch >= 3 ? ['rifleman', 'rifleman'] : [], ch >= 5 ? ['heavy'] : []);
  const pick = () => pool[Math.floor(r() * pool.length)];
  const steps = [{ cine: true, title: job.title.toUpperCase(), sub: 'SIDE JOB' }, { wait: 1.6 }, { cine: false, objective: job.bounty ? 'Find ' + job.target : 'Clear out the crew' }];
  const waves = 2 + job.diff;
  for (let w = 0; w < waves; w++) {
    const x = 16 + (w + 0.5) * (len - 30) / waves; steps.push({ reach: x - 16 });
    const n = 2 + job.diff + Math.floor(ch / 3) + (r() < 0.5 ? 1 : 0), spawn = [];
    for (let k = 0; k < n; k++) spawn.push(k === n - 1 && r() < 0.4 ? { t: pick(), from: 'behind' } : { t: pick(), x: x + 4 + r() * 14 });
    steps.push({ spawn }, { clear: true }, { cp: true });
  }
  if (job.bounty) { steps.push({ reach: len - 28 }, { spawn: [{ t: ch >= 4 ? 'heavy' : 'dimitri', id: 'target', x: len - 8, name: job.target, hp: 300 + ch * 60 + job.diff * 60, boss: true }, { t: pick(), x: len - 12 }, { t: pick(), from: 'behind' }], boss: 'target', objective: 'Take down ' + job.target }); steps.push({ until: lv => !lv.named.target.alive }, { boss: null }, { clear: true }); }
  steps.push({ objective: '', do: lv => { G.state.money += job.reward; const jj = (G.state.jobs || []).find(x => x.seed === job.seed); if (jj) jj.done = true; lv.toast('JOB DONE  +' + fmtMoney(job.reward)); } }, { wait: 1.8 }, { fade: 'out' }, { end: true });
  const night = ['night', 'motel'].includes(job.place.env);
  return {
    env: job.place.env, len, half: 13, start: 4, walter: job.walter, music: 'action', enemyLook: job.place.look,
    build(L) {
      let x = 14;
      while (x < len - 6) {
        const k = r(), z = (r() - 0.5) * 16;
        if (k < 0.22) L.crate(x, z, 1.3, 1.1 + Math.floor(r() * 3) * 0.15, 1.3, ['wood', 'metal', 'cardboard'][Math.floor(r() * 3)]);
        else if (k < 0.36) L.car(x, z, [0x7a2a2a, 0x2a3a5a, 0x4a4a3a, 0x5a3a6a, 0xc8c0a0][Math.floor(r() * 5)], r() < 0.4 ? 'pickup' : 'sedan', r() < 0.5 ? 0 : PI);
        else if (k < 0.52) L.barrel(x, z, r() < 0.7 ? 'red' : 'propane');
        else if (k < 0.66) L.dock(x, z, 6, 3);
        else if (k < 0.8) L.stack(x, z, r() < 0.5 ? 'wood' : 'metal');
        else if (!night) L.cactus(x, z, 2.5 + r() * 2);
        if (night && r() < 0.4) L.lamp(x, 11);
        x += 6 + r() * 6;
      }
      cacti(L, len, 13, 8, job.seed % 100);
    },
    steps,
  };
}
