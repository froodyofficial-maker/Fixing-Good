'use strict';
// ============================================================
//  FIXING GOOD - the story: chapters, levels, dialogue
// ============================================================
Object.assign(LOOKS, {
  kev: { name: 'Krazy Kev', skin: '#e2b08a', hair: 'none', hat: 'cap', hatColor: '#c02a2a', beard: 'stubble', beardColor: '#6a4a2a', shirt: '#2a2a2a', sleeves: 'short', tattoo: true, pants: '#3a4a6a', shoes: '#eee', build: 0.95, chain: true },
  dimitri: { name: 'Dimitri', skin: '#d8a27e', hair: 'none', beard: 'full', beardColor: '#3a2a1a', shirt: '#5a6a8a', sleeves: 'short', vest: '#2a2a2a', pants: '#2a2a2a', shoes: '#111', build: 1.3 },
  goon: { name: 'Goon', skin: '#c58d63', hair: 'buzz', hairColor: '#111', shirt: '#f0f0f0', sleeves: 'short', pants: '#2a3550', shoes: '#111', build: 1.05 },
  radio: { name: 'Radio', skin: '#888', hair: 'none', shirt: '#444', pants: '#333', shoes: '#222' },
});
Object.assign(ARCH, {
  brawler: { hp: 75, speed: 225, melee: true },
  kev: { hp: 90, speed: 250, weapon: 'knife', melee: true, look: 'kev' },
  dimitri: { hp: 160, speed: 170, weapon: 'pistol', dist: [200, 420], acc: 0.06, react: 0.5, look: 'dimitri' },
});

// helper: turn passive NPCs into fighters
Level.prototype.hostile = function (ids) { for (const id of ids) { const a = this.named[id]; if (!a) continue; a.passive = false; a.team = 'enemy'; a.ai.state = 'alert'; a.ai.react = 0; a.cine = null; a.cineLower = false; } };
Level.prototype.fists = function (on) {
  const p = this.player; if (!p) return;
  if (on) { this.vars.savedGuns = p.guns; this.vars.savedGi = p.gi; p.guns = []; p.gi = 0; }
  else if (this.vars.savedGuns) { p.guns = this.vars.savedGuns; p.gi = this.vars.savedGi || 0; this.vars.savedGuns = null; }
};
Level.prototype.takeBarrel = function (x) {
  for (const b of this.barrels) if (b.kind === 'blue' && Math.abs(b.x - x) < 5) b.alive = false;
  this.solids = this.solids.filter(s => !(s.style === 'none' && Math.abs(s.x + 18 - x) < 5));
};
Level.prototype.remove = function (id) { const a = this.named[id]; if (a) { a.alive = false; this.actors = this.actors.filter(x => x !== a); } };

const S = (who, text, expr) => [who, text, expr];

const LEVELS = {
  // ---------------------------------------------------------------- PROLOGUE
  intro: {
    theme: 'day', width: 2600, start: 260, walter: true, walterUnarmed: true, noHud: true, music: 'menu',
    build(L) {
      L.rv(1080, { foil: true });
      L.cactus(420, 120); L.cactus(1900, 90); L.cactus(2300, 140);
      L.crate(1560, 60, 46, 'cardboard'); L.table(1640, 110);
      L.prop((c) => { // chairs and a cooler by the RV
        c.fillStyle = '#2a6aa0'; c.strokeStyle = INK; c.lineWidth = 2; rrect(c, 1500, GROUND - 34, 44, 34, 4); c.fill(); c.stroke(); c.fillStyle = '#eee'; c.fillRect(1500, GROUND - 34, 44, 8);
      });
    },
    steps: [
      { cine: true, music: 'menu', do: lv => { lv.walter.x = 1700; lv.walter.facing = -1; } },
      { title: 'COLD START', sub: 'CHAPTER ONE' }, { wait: 1.2 },
      { walk: ['player', 1560, true] },
      { say: [S('walter', 'You\'re late, Jace.'), S('jace', 'Yo, it\'s the middle of the desert, Mr. Black. There\'s no "late" out here. There\'s just... hot.'), S('walter', 'Twenty-two years I taught chemistry to teenagers who couldn\'t tell an ion from an iron.', 'angry'), S('walter', 'Today, I get to teach someone who\'s motivated.'), S('jace', 'Motivated. Right. You know I failed your class, right?', 'smile'), S('walter', 'I do. That\'s why I\'m doing the chemistry. You\'re doing the selling.'), S('jace', 'And what\'s in it for you? You\'ve got a house. A minivan. A... cardigan.'), S('walter', 'Let\'s just say I recently learned I don\'t have as much time as I thought.', 'worried'), S('walter', 'And I intend to leave something behind other than a pension and a lot of unpaid bills.'), S('jace', '...Damn. Okay. Okay, Mr. Black. Let\'s fix some good.', 'smile'), S('walter', 'Suit up. Into the RV. Watch me, and do exactly what I say.')] },
      { walk: ['walter', 1240, true, false] }, { walk: ['player', 1300, true] }, { fade: 'out' }, { end: true }
    ]
  },
  introFight: {
    theme: 'day', width: 3400, start: 1500, walter: true, music: 'tense', enemyLook: 'thug',
    npcs: [{ id: 'kev', kind: 'kev', team: 'enemy', x: 2350, look: 'kev', guns: ['knife'] }, { id: 'dimitri', kind: 'dimitri', team: 'enemy', x: 2470, look: 'dimitri', guns: ['pistol'] }],
    build(L) {
      L.rv(1080, { foil: true }); L.car(2560, '#5a3a6a', 'sedan', -1);
      L.crate(1880, 64, 56); L.crate(2860, 60, 60, 'cardboard'); L.crate(700, 60, 60); L.stack(400);
      L.barrel(2150, 'red'); L.cactus(3100, 120); L.cactus(250, 90);
    },
    steps: [
      { cine: true, do: lv => { lv.walter.x = 1420; lv.named.kev.facing = -1; lv.named.dimitri.facing = -1; } },
      { wait: 0.8 },
      { say: [S('walter', 'Ninety-four percent. On a first cook. In a motorhome.', 'smile'), S('jace', 'Mr. Black, that\'s insane. It\'s blue, man! Nobody\'s ever seen blue before.', 'smile'), S('kev', 'Hey hey hey! Look at this. The RV people.'), S('jace', 'Oh no. Kev? What are you doing here, man?', 'worried'), S('kev', 'Word travels, Jace. Word travels that you got product. And I got a cousin.'), S('dimitri', 'Hi.'), S('kev', 'So here\'s the deal: you give us the cook, the bags, and the old man\'s recipe. Then you walk home.'), S('walter', 'I\'m afraid that isn\'t a deal. That\'s a robbery.', 'angry'), S('kev', 'Yeah, Grandpa. That\'s the point!', 'angry')] },
      { do: lv => lv.hostile(['kev', 'dimitri']), music: 'action', objective: 'Defend the RV' },
      { banter: ['walter', 'Jace! Hit him! [F] punch, [F][F][F] for a combo!'] }, { wait: 3 },
      { banter: ['walter', 'Use your pistol! Aim with the mouse, click to fire.'] }, { wait: 0.5 },
      { clear: true },
      { banter: ['jace', 'Yo, they brought friends!'], spawn: [{ t: 'gunner', from: 'right' }, { t: 'gunner', from: 'right' }, { t: 'thug', from: 'right' }] },
      { banter: ['walter', 'Take cover! Crouch behind the crates with [S]. [R] reloads.'] }, { wait: 2 },
      { banter: ['walter', 'That red barrel. Shoot it. Trust me.'] },
      { clear: true }, { cp: true },
      { spawn: [{ t: 'thug', from: 'left' }, { t: 'knifer', from: 'left' }, { t: 'gunner', from: 'right' }, { t: 'gunner', from: 'right' }], banter: ['walter', 'Behind us! [Shift] to roll out of the way!'] },
      { clear: true }, { wait: 1.2 },
      { objective: '', cine: true, walk: ['walter', 1700, true, false] }, { walk: ['player', 1800, true] },
      { say: [S('jace', 'We just... Mr. Black. We just killed like eight dudes.', 'worried'), S('walter', 'Seven. And they were going to kill us. Remember that.', 'angry'), S('walter', 'Here\'s what this tells me, Jace. Our product is worth killing for.'), S('walter', 'Which means we need two things: protection, and a distributor who can move real weight.'), S('jace', 'I know a dude. Rafa. Runs a junkyard out east. He\'s... kind of a lot.'), S('walter', 'Then get us some weight to sell him. Cook, sell, buy a better gun. In that order.')] },
      { fade: 'out' }, { end: true }
    ]
  },
  // ---------------------------------------------------------------- CHAPTER 2
  junkyard: {
    theme: 'junkyard', width: 5600, start: 300, walter: true, music: 'tense', enemyLook: 'thug',
    npcs: [{ id: 'rafa', kind: 'rafa', team: 'enemy', x: 1100, look: 'rafa', guns: ['gold'] }, { id: 'victim', kind: 'brawler', team: 'npc', x: 1030, look: 'goon', face: 1 }],
    build(L) {
      L.car(600, '#7a5a3a', 'pickup', 1); L.crate(1500, 70, 64, 'metal'); L.car(1900, '#3a4a6a', 'sedan', -1);
      L.barrel(2250, 'red'); L.crate(2400, 64, 64); L.crate(2406, 52, 52, 'wood', GROUND - 64);
      L.car(2700, '#6a2a2a', 'sedan', 1); L.plat(2980, GROUND - 120, 220); L.crate(3260, 60, 60, 'cardboard'); L.barrel(3420, 'propane');
      L.car(3600, '#4a5a3a', 'pickup', -1); L.crate(3950, 64, 64, 'metal'); L.barrel(4150, 'red');
      L.crate(4500, 70, 60, 'metal'); L.car(4800, '#2a2a2a', 'sedan', -1); L.barrel(5000, 'red'); L.plat(5150, GROUND - 130, 200);
      L.lamp(900, 280); L.lamp(2600, 280); L.lamp(4300, 280); L.sign(800, 'LOCO SALVAGE', '#f07a46');
    },
    steps: [
      { cine: true, title: 'LOCO', sub: 'CHAPTER TWO', do: lv => { lv.named.rafa.facing = -1; } }, { wait: 1.5 },
      { walk: ['player', 860, true] },
      { say: [S('rafa', 'Jace! My man! And you brought... who is this? Your grandpa?', 'smile'), S('walter', 'I\'m the chemist.'), S('rafa', 'The chemist! Ha! You hear that? The chemist!', 'smile'), S('goon', 'Ha, yeah boss, the chemist, that\'s funny—'), S('rafa', 'Did I say you could laugh?', 'angry')] },
      { do: lv => { const r = lv.named.rafa; r.facing = -1; r.startMelee(lv); } }, { wait: 0.3 }, { do: lv => { const r = lv.named.rafa; r.startMelee(lv); } }, { wait: 0.3 },
      { do: lv => { const r = lv.named.rafa, v = lv.named.victim; r.melee = null; r.combo = 2; r.startMelee(lv); setTimeout(() => { if (v.alive) v.hurt(999, { kind: 'melee', x: v.x, y: v.y - 70, dx: -1, dy: -0.4, knock: 700 }, lv); }, 180); } }, { wait: 1.4 },
      { say: [S('jace', 'Yo... YO! What the hell, Rafa?!', 'worried'), S('rafa', 'He laughed at my chemist. Nobody laughs at my chemist.', 'smile'), S('rafa', 'Okay. Before we do business, I gotta know you can handle yourself, Jace. Out here it\'s not chemistry, it\'s fists.'), S('rafa', 'My boys want to say hi. No guns. Hands only. Survive, and we talk money.', 'smile')] },
      { do: lv => { lv.fists(true); lv.walter.passive = true; }, objective: 'Fist fight! [F] jab-cross-kick', music: 'action' },
      { spawn: [{ t: 'brawler', x: 1300, look: 'goon' }, { t: 'brawler', x: 1380 }] }, { clear: true },
      { spawn: [{ t: 'brawler', x: 300 }, { t: 'brawler', x: 1350 }, { t: 'brawler', x: 1450 }], banter: ['rafa', 'Ooooh! Again! AGAIN!'] }, { clear: true },
      { do: lv => { lv.fists(false); lv.walter.passive = false; }, objective: '', cine: true, music: 'tense' },
      { say: [S('rafa', 'HA! I love this kid! Okay okay. Business.', 'smile'), S('jace', 'Eight pounds of the blue, man. Ninety-plus percent. We want thirty-five a pound.'), S('rafa', 'Thirty-five. Sure. Sure sure sure.'), S('rafa', 'Or... I take the bags. I take the chemist. And the chemist cooks for me forever in a nice little hole.', 'angry'), S('walter', 'Jace. He means it.', 'worried'), S('rafa', 'Muchachos! Wrap up Grandpa!', 'angry')] },
      { do: lv => { lv.named.rafa.cine = 5400; }, wait: 0.3 }, { do: lv => lv.remove('rafa') },
      { cine: false, objective: 'Fight through the junkyard. Get Rafa.', music: 'action', cp: true },
      { spawn: [{ t: 'gunner', x: 1700 }, { t: 'gunner', x: 2000 }, { t: 'thug', x: 1600 }, { t: 'smg', x: 2300 }] },
      { reach: 2200 }, { spawn: [{ t: 'gunner', x: 3000, y: GROUND - 120 }, { t: 'shotgunner', x: 2900 }, { t: 'thug', from: 'left' }] },
      { clear: true }, { cp: true }, { banter: ['walter', 'He went toward that trailer! Keep pushing!'] },
      { reach: 3300 }, { spawn: [{ t: 'smg', x: 3900 }, { t: 'gunner', x: 4100 }, { t: 'knifer', x: 3800 }, { t: 'shotgunner', x: 4300 }] },
      { clear: true }, { cp: true },
      { reach: 4300 }, { arena: [3900, 5600], cine: true, spawn: [{ t: 'rafa', id: 'rafa', x: 5250, name: 'Rafa "Loco" Vargas', alert: false }], do: lv => { lv.named.rafa.passive = true; lv.named.rafa.facing = -1; }, cam: 4950 },
      { say: [S('rafa', 'You know what, Jace? I liked you. I really did.', 'angry'), S('rafa', 'But these gold babies? They don\'t care what I like!', 'smile')] },
      { cam: null, cine: false, do: lv => lv.hostile(['rafa']), boss: 'rafa', music: 'boss', objective: 'Kill Rafa' },
      { spawn: [{ t: 'gunner', from: 'right' }, { t: 'thug', from: 'left' }] }, { wait: 12 }, { spawn: [{ t: 'smg', from: 'right' }, { t: 'gunner', from: 'left' }] },
      { until: lv => !lv.named.rafa.alive }, { boss: null, objective: '' }, { clear: true }, { wait: 1.5 },
      { cine: true, walk: ['walter', 4900, true, false], do: lv => { lv.player.cine = 5000; } }, { wait: 1.6 }, { stopWalk: ['player'] },
      { say: [S('jace', 'He was gonna put you in a hole, Mr. Black.', 'worried'), S('walter', 'Yes. Yes he was.'), S('walter', 'Take his money. Take his guns. And for God\'s sake, Jace...', 'angry'), S('walter', '...next time, find us a better class of criminal.')] },
      { do: lv => { Game.state.money += 3000; lv.toast('+$3,000 from Rafa\'s safe'); }, wait: 1.6 }, { fade: 'out' }, { end: true }
    ]
  },
  // ---------------------------------------------------------------- CHAPTER 3
  warehouse: {
    theme: 'warehouse', width: 4800, start: 180, walter: false, music: 'tense', enemyLook: 'guard', flashlight: true, stealth: true, dark: 0.82,
    build(L, lv) {
      L.crate(500, 64, 64); L.crate(506, 52, 52, 'wood', GROUND - 64); L.crate(900, 70, 50, 'cardboard'); L.plat(1100, GROUND - 140, 300);
      L.crate(1500, 64, 64, 'metal'); L.barrel(1700, 'blue'); L.crate(1950, 60, 60, 'cardboard'); L.plat(2200, GROUND - 150, 260);
      L.barrel(2500, 'blue'); L.crate(2700, 70, 64, 'metal'); L.crate(3000, 64, 64); L.barrel(3200, 'red'); L.plat(3350, GROUND - 140, 300);
      L.barrel(3700, 'blue'); L.crate(3900, 64, 64, 'metal'); L.crate(4200, 60, 60, 'cardboard');
      for (const x of [600, 1600, 2600, 3600, 4400]) L.light(x, 120, 300, '160,190,255', 0.55);
      L.prop(c => { c.fillStyle = '#3a6a3a'; c.fillRect(4600, GROUND - 200, 140, 200); c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(4600, GROUND - 200, 140, 200); c.fillStyle = '#9fe89f'; c.font = 'bold 18px Oswald, sans-serif'; c.fillText('EXIT', 4640, GROUND - 210); });
      L.sign(260, 'VAMONOS CHEM CO.', '#7fd8f0');
      lv.interacts = [1700, 2500, 3700].map((x, i) => ({ x, y: GROUND - 60, text: '[E] Steal precursor barrel', done: false, fn: lv2 => { lv2.vars.barrels = (lv2.vars.barrels || 0) + 1; lv2.toast('Precursor barrel ' + lv2.vars.barrels + '/3'); Audio.play('uiok'); lv2.takeBarrel(x); } }));
    },
    steps: [
      { cine: true, title: 'BARRELS', sub: 'CHAPTER THREE' }, { wait: 1.4 },
      { say: [S('walter', '(radio) Vamonos Chemical. Their night shift is three guards and a lot of laziness.'), S('walter', '(radio) We need three barrels of precursor. Blue drums. Quietly, Jace.'), S('jace', 'Quietly. Yeah. I\'m like a ninja, Mr. Black.'), S('walter', '(radio) Sneak up on anyone who hasn\'t seen you and hit them. [F]. One punch, lights out.'), S('jace', 'And if they do see me?'), S('walter', '(radio) Then it stops being quiet.', 'worried')] },
      { cine: false, objective: 'Steal 3 precursor barrels (0/3)', music: 'tense', spawn: [{ t: 'gunner', x: 1250, idle: true, patrol: 160 }, { t: 'gunner', x: 2100, idle: true, patrol: 200 }, { t: 'gunner', x: 2330, y: GROUND - 150, idle: true }, { t: 'smg', x: 3050, idle: true, patrol: 220 }, { t: 'gunner', x: 3500, y: GROUND - 140, idle: true }, { t: 'shotgunner', x: 4000, idle: true, patrol: 150 }] },
      { until: lv => { lv.objective = 'Steal 3 precursor barrels (' + (lv.vars.barrels || 0) + '/3)'; return (lv.vars.barrels || 0) >= 3; } },
      { cp: true, do: lv => { lv.vars.alarm = true; Audio.play('bad'); }, objective: 'ALARM! Get to the exit', music: 'action', banter: ['walter', '(radio) Is that an alarm?! Jace, GET OUT of there!'] },
      { spawn: [{ t: 'rifleman', from: 'right' }, { t: 'smg', from: 'right' }, { t: 'gunner', from: 'left' }, { t: 'shotgunner', from: 'left' }] },
      { wait: 6 }, { spawn: [{ t: 'rifleman', from: 'right' }, { t: 'gunner', from: 'right' }] },
      { reach: 4560 }, { do: lv => { Game.state.precursor += 10; lv.toast('+10 precursor'); } }, { fade: 'out' }, { end: true }
    ]
  },
  // ---------------------------------------------------------------- CHAPTER 4
  highway1: {
    theme: 'highway', width: 90000, start: 480, mode: 'highway', zoom: 1, noDecals: true, music: 'action', enemyLook: 'biker', showCount: true,
    steps: [
      { cine: true, title: 'HIGHWAY TO NOWHERE', sub: 'CHAPTER FOUR' }, { wait: 1.2 },
      { say: [S('jace', 'Mr. Black! Bikes! Like, a LOT of bikes!', 'worried'), S('walter', '(from the cab) Those are Dust Dogs colors. Uncle Dutch\'s gang. Word of our blue has reached them.'), S('walter', 'I\'ll drive. You stay on the roof and make them regret their hobbies.'), S('jace', 'Stay on the roof. Of a moving RV. Yeah, that\'s fine. That\'s totally fine.', 'worried')] },
      { cine: false, objective: 'Protect the RV', do: lv => { for (let i = 0; i < 3; i++) lv.spawnVehicle('bike', { offset: -350 + i * 120 }); } },
      { clear: true }, { banter: ['walter', 'More behind us. A truck!'], do: lv => { lv.spawnVehicle('truck', { offset: -520, gunners: 2 }); lv.spawnVehicle('bike', { offset: 520, from: 'right' }); } },
      { clear: true }, { cp: true }, { banter: ['jace', 'Yo, they\'re coming from up front too!'], do: lv => { lv.spawnVehicle('bike', { offset: 600, from: 'right' }); lv.spawnVehicle('bike', { offset: 460, from: 'right' }); lv.spawnVehicle('bike', { offset: -300 }); lv.spawnVehicle('bike', { offset: -420 }); } },
      { clear: true }, { do: lv => { lv.spawnVehicle('truck', { offset: -540, gunners: 3 }); lv.spawnVehicle('truck', { offset: 560, from: 'right', gunners: 2 }); } },
      { clear: true }, { wait: 1 },
      { cine: true, say: [S('walter', 'Is that all of them?'), S('jace', 'I think I shot a guy off a motorcycle with a shotgun while standing on a roof. I\'m gonna need a minute.', 'worried'), S('walter', 'Take two. Then we find a motel. We\'re too hot to go home tonight.')] },
      { do: lv => { Game.state.money += 1200; lv.toast('+$1,200 looted from the bikes'); } }, { fade: 'out' }, { end: true }
    ]
  },
  // ---------------------------------------------------------------- CHAPTER 5
  motel: {
    theme: 'motel', width: 4200, start: 1300, walter: true, music: 'tense', enemyLook: 'cartel', dark: 0.62,
    build(L) {
      L.rv(800, { lit: true }); L.car(1500, '#3a4a5a', 'sedan', 1); L.car(2300, '#7a6a3a', 'pickup', -1); L.car(3100, '#5a2a2a', 'sedan', 1);
      L.crate(2000, 50, 46, 'cardboard'); L.barrel(2650, 'red'); L.crate(3600, 64, 60, 'metal'); L.barrel(3800, 'propane'); L.crate(400, 60, 60, 'metal');
      for (const x of [300, 1200, 2100, 3000, 3900]) L.lamp(x, 250);
      L.prop(c => { c.save(); c.fillStyle = '#1a1a1a'; c.fillRect(2040, 120, 300, 70); c.strokeStyle = '#ff4a8a'; c.lineWidth = 3; c.strokeRect(2040, 120, 300, 70); c.fillStyle = '#ff6aa0'; c.shadowColor = '#ff4a8a'; c.shadowBlur = 16; c.font = 'bold 30px Oswald, sans-serif'; c.fillText('CROSSROADS MOTEL', 2056, 166); c.restore(); });
      L.light(2190, 155, 380, '255,80,140', 0.8);
    },
    steps: [
      { cine: true, title: 'THE TWINS', sub: 'CHAPTER FIVE', do: lv => { lv.walter.x = 1200; } }, { wait: 1.3 },
      { say: [S('jace', 'Mr. Black, your phone\'s buzzing. It says "HAL — DO NOT ANSWER."'), S('walter', 'My brother-in-law. Agent Hal Brewer, DEA.', 'worried'), S('brewer', '(voicemail) Walt! Hey, buddy. Heard there\'s new blue stuff on the street. Crazy, right? Ninety-plus percent! Some kinda genius out there.'), S('brewer', '(voicemail) Anyway, barbecue Sunday. Bring that potato salad. And if you hear anything weird from your students, call me!', 'smile'), S('jace', 'Your brother-in-law is a DEA agent?! Are you serious?!', 'angry'), S('walter', 'He\'s an idiot. A big, loud, extremely well-armed idiot.'), S('jace', 'Mr. Black. Headlights. Like four cars.', 'worried'), S('walter', 'Rafa had cousins. And cousins have cousins. Get ready.', 'angry')] },
      { cine: false, objective: 'Survive the motel ambush', music: 'action', spawn: [{ t: 'gunner', from: 'right' }, { t: 'smg', from: 'right' }, { t: 'gunner', from: 'left' }] },
      { clear: true }, { spawn: [{ t: 'shotgunner', from: 'right' }, { t: 'rifleman', from: 'right' }, { t: 'smg', from: 'left' }, { t: 'thug', from: 'left' }] }, { clear: true }, { cp: true },
      { spawn: [{ t: 'rifleman', from: 'right' }, { t: 'rifleman', from: 'left' }, { t: 'heavy', from: 'right' }, { t: 'gunner', from: 'left' }], banter: ['walter', 'That one\'s wearing armor! Aim for the head!'] }, { clear: true }, { cp: true },
      { cine: true, spawn: [{ t: 'marco', id: 'marco', x: 2800, name: 'Marco Cortez', look: 'twinA', alert: false }, { t: 'leo', id: 'leo', x: 2900, name: 'Leo Cortez', look: 'twinB', alert: false }], do: lv => { for (const id of ['marco', 'leo']) { lv.named[id].passive = true; lv.named[id].facing = -1; } }, cam: 2300 },
      { wait: 1 }, { say: [S('jace', 'Who are THOSE guys?', 'worried'), S('walter', 'Rafa\'s cousins. The Cortez twins. I don\'t believe they talk.'), S('twinA', '...', 'angry'), S('twinB', '...', 'angry'), S('jace', 'Yeah, that\'s so much scarier, thanks.', 'worried')] },
      { cam: null, cine: false, do: lv => lv.hostile(['marco', 'leo']), boss: 'marco', music: 'boss', objective: 'Kill the Cortez twins' },
      { until: lv => !lv.named.marco.alive || !lv.named.leo.alive, do: lv => { } }, { do: lv => { lv.bossId = lv.named.marco.alive ? 'marco' : 'leo'; lv.banter('jace', 'One down! Where\'s his brother?!'); } },
      { until: lv => !lv.named.marco.alive && !lv.named.leo.alive }, { boss: null, objective: '' }, { clear: true }, { wait: 1.5 },
      { cine: true, say: [S('walter', 'We can\'t keep doing this, Jace. Every gang in the state wants our product.'), S('jace', 'So what, we quit?'), S('walter', 'No. We go bigger. There\'s a man who can protect us. A businessman.'), S('jace', 'Who?'), S('walter', 'The man who owns the Golden Hen.', 'smile'), S('jace', '...The CHICKEN place?')] },
      { do: lv => { Game.state.money += 2000; lv.toast('+$2,000'); } }, { fade: 'out' }, { end: true }
    ]
  },
  // ---------------------------------------------------------------- CHAPTER 6
  goldenhen: {
    theme: 'town', width: 2400, start: 300, walter: true, walterUnarmed: true, noHud: true, music: 'hub',
    npcs: [{ id: 'fenn', x: 1500, look: 'fenn', face: -1 }],
    build(L) {
      L.prop(c => { c.save(); c.fillStyle = '#f2e6c8'; c.fillRect(1180, GROUND - 300, 640, 300); c.fillStyle = '#c8302a'; c.fillRect(1180, GROUND - 300, 640, 40); c.fillStyle = '#ffd040'; c.font = 'bold 34px Oswald, sans-serif'; c.fillText('THE GOLDEN HEN', 1350, GROUND - 266); c.fillStyle = '#2a3540'; c.fillRect(1220, GROUND - 220, 240, 130); c.fillRect(1540, GROUND - 220, 240, 130); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(1225, GROUND - 215, 110, 120); c.fillRect(1545, GROUND - 215, 110, 120); c.fillStyle = '#ffd040'; c.beginPath(); c.arc(1500, GROUND - 330, 32, 0, TAU); c.fill(); c.fillStyle = '#c8302a'; c.beginPath(); c.moveTo(1490, GROUND - 362); c.lineTo(1500, GROUND - 380); c.lineTo(1510, GROUND - 362); c.fill(); c.restore(); });
      L.table(1300, 120); L.table(1650, 120); L.car(300, '#c8c0a0', 'sedan', 1);
    },
    steps: [
      { cine: true, title: 'GOLDEN HEN', sub: 'CHAPTER SIX' }, { walk: ['player', 1250, true] },
      { say: [S('fenn', 'Mr. Black. Please, sit. Would you like some chicken? The spicy is very good today.'), S('walter', 'I\'m not here for chicken, Mr. Fenn.'), S('fenn', 'No. You\'re here because three gangs and the DEA are trying to find your little motorhome.'), S('fenn', 'Your product is exceptional. Your methods are... amateur. A child and a camper.'), S('jace', 'Hey!', 'angry'), S('fenn', 'I own a laundry. Beneath it is a laboratory. Stainless steel. Industrial. Clean.'), S('fenn', 'You cook for me, I distribute. Three million dollars for three months of work.'), S('walter', '...Three million.', 'smile'), S('fenn', 'But I have competition. The cartel to the south does not like my new interests.'), S('fenn', 'They may visit. If they do, I expect you to keep the cook going.')] },
      { fade: 'out' }, { end: true }
    ]
  },
  superlab: {
    theme: 'lab', width: 2700, start: 900, walter: true, music: 'tense', enemyLook: 'labguard', dark: 0.35, playerLook: 'jaceHaz',
    failIf: lv => lv.walter && lv.walter.downed > 0 && !lv.cinematic ? 'Walter went down. The batch is ruined.' : null,
    build(L) {
      L.plat(300, GROUND - 160, 340); L.plat(2060, GROUND - 160, 340); L.crate(700, 64, 64, 'metal'); L.crate(1900, 64, 64, 'metal'); L.barrel(560, 'red'); L.barrel(2140, 'red');
      L.prop(c => { // cook station
        c.fillStyle = '#b8c0c6'; c.strokeStyle = INK; c.lineWidth = 3; rrect(c, 1250, GROUND - 120, 200, 120, 6); c.fill(); c.stroke();
        c.fillStyle = '#9fe8ff'; c.beginPath(); c.arc(1300, GROUND - 140, 18, 0, TAU); c.fill(); c.stroke(); c.fillRect(1296, GROUND - 175, 8, 20);
        c.fillStyle = '#7fd8f0'; c.beginPath(); c.arc(1400, GROUND - 145, 22, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = '#e8c62a'; c.fillRect(1240, GROUND - 125, 220, 6);
      });
      for (const x of [300, 900, 1500, 2100]) L.light(x, 80, 380, '220,240,255', 0.7);
    },
    steps: [
      { cine: true, do: lv => { lv.walter.look = LOOKS.walterHaz; lv.walter.x = 1340; lv.walter.frozen = true; lv.walter.facing = 1; lv.walter.invuln = false; lv.walter.guns = []; } },
      { wait: 1 },
      { say: [S('jace', 'This place is unreal, Mr. Black. It\'s like a spaceship made of money.', 'smile'), S('walter', 'Batch forty. Ninety-nine percent pure. Do you know what this means, Jace?', 'smile'), S('jace', 'That we\'re rich?'), S('walter', 'That we\'re irreplaceable.'), S('brewer', '(on the TV) ...DEA sources say a major lab is operating somewhere in the county...', 'neutral'), S('jace', 'Uh. Mr. Black? The service elevator just went down. By itself.', 'worried'), S('walter', 'The cartel. Keep them off me. I can\'t stop now or the whole batch is ruined.', 'angry')] },
      { cine: false, arena: [0, 2700], objective: 'Defend Walter while he cooks', music: 'action', do: lv => { lv.vars.cookT = 0; } },
      { spawn: [{ t: 'smg', x: 60 }, { t: 'gunner', x: 2640 }, { t: 'rifleman', x: 2600 }] }, { clear: true },
      { spawn: [{ t: 'shotgunner', x: 40 }, { t: 'smg', x: 80 }, { t: 'rifleman', x: 2650, y: GROUND - 160 }, { t: 'gunner', x: 2600 }] }, { clear: true }, { cp: true },
      { banter: ['walter', 'Halfway there! Keep them OFF me!'], spawn: [{ t: 'heavy', x: 2650 }, { t: 'rifleman', x: 40 }, { t: 'smg', x: 2600 }, { t: 'smg', x: 60 }] }, { clear: true }, { cp: true },
      { spawn: [{ t: 'heavy', x: 40 }, { t: 'shotgunner', x: 2640 }, { t: 'rifleman', x: 380, y: GROUND - 160 }, { t: 'rifleman', x: 2200, y: GROUND - 160 }, { t: 'gunner', x: 2600 }] }, { clear: true },
      { wait: 1, cine: true },
      { say: [S('walter', 'Done. Batch forty. Ninety-nine point one.', 'smile'), S('jace', 'Dude. You just cooked through a GUNFIGHT.', 'smile'), S('walter', 'And Mr. Fenn will want to know who sent them. He\'ll want to send a message back.'), S('fenn', '(entering) I already know who sent them. Don Esteban. Tomorrow, gentlemen, we go to Mexico.')] },
      { do: lv => { Game.state.money += 6000; Game.state.bags += 12; Game.state.purity = Math.max(Game.state.purity, 99.1); lv.toast('+$6,000 · +12 bags of 99.1% blue'); } }, { fade: 'out' }, { end: true }
    ]
  },
  // ---------------------------------------------------------------- CHAPTER 7
  ranch: {
    theme: 'ranch', width: 6400, start: 200, walter: true, music: 'action', enemyLook: 'cartel',
    build(L) {
      L.crate(500, 64, 56, 'sandbag'); L.car(800, '#e8e0c8', 'pickup', 1); L.crate(1200, 70, 64); L.barrel(1400, 'red');
      L.plat(1600, GROUND - 140, 260); L.crate(1950, 64, 56, 'sandbag'); L.car(2250, '#2a2a2a', 'sedan', -1); L.barrel(2600, 'propane');
      L.crate(2800, 64, 64); L.crate(2806, 52, 52, 'wood', GROUND - 64); L.plat(3100, GROUND - 150, 300); L.crate(3500, 70, 56, 'sandbag');
      L.barrel(3700, 'red'); L.car(3950, '#c8a040', 'pickup', -1); L.crate(4400, 64, 56, 'sandbag'); L.plat(4700, GROUND - 140, 260);
      L.barrel(5000, 'red'); L.crate(5300, 64, 64); L.car(5600, '#fff', 'sedan', -1); L.barrel(5900, 'red');
      L.prop(c => { for (let x = 300; x < 6400; x += 700) { c.fillStyle = '#5a4a2a'; c.fillRect(x, GROUND - 220, 10, 220); c.fillStyle = '#4a7a3a'; for (let i = 0; i < 6; i++) { c.save(); c.translate(x + 5, GROUND - 220); c.rotate(-PI / 2 + (i - 2.5) * 0.45); c.beginPath(); c.ellipse(36, 0, 40, 8, 0, 0, TAU); c.fill(); c.restore(); } } });
    },
    steps: [
      { cine: true, title: 'RANCHO MUERTE', sub: 'CHAPTER SEVEN' }, { wait: 1.2 },
      { say: [S('walter', 'Fenn\'s men took the front gate. We take the house.'), S('jace', 'Mr. Black, you\'re carrying a gun. Like, on purpose.', 'worried'), S('walter', 'I\'ve been reading.', 'angry'), S('jace', 'Reading what?!'), S('walter', 'Manuals.')] },
      { cine: false, objective: 'Storm the ranch', spawn: [{ t: 'rifleman', x: 1300 }, { t: 'gunner', x: 1700, y: GROUND - 140 }, { t: 'smg', x: 1100 }, { t: 'gunner', x: 900 }] },
      { clear: true }, { cp: true }, { reach: 1900, spawn: [{ t: 'shotgunner', x: 2500 }, { t: 'rifleman', x: 2700 }, { t: 'smg', x: 2400 }, { t: 'rifleman', x: 3200, y: GROUND - 150 }] },
      { clear: true }, { cp: true }, { reach: 3000, spawn: [{ t: 'heavy', x: 3800 }, { t: 'rifleman', x: 3600 }, { t: 'smg', x: 3500 }, { t: 'gunner', from: 'left' }], banter: ['walter', 'Armored one! Use the barrels!'] },
      { clear: true }, { cp: true }, { reach: 4200, spawn: [{ t: 'rifleman', x: 4800, y: GROUND - 140 }, { t: 'shotgunner', x: 4900 }, { t: 'smg', x: 5000 }, { t: 'heavy', x: 5200 }, { t: 'thug', from: 'left' }] },
      { clear: true }, { cp: true },
      { reach: 5100, arena: [4700, 6400], cine: true, spawn: [{ t: 'esteban', id: 'esteban', x: 6000, name: 'Don Esteban', alert: false }], do: lv => { lv.named.esteban.passive = true; lv.named.esteban.facing = -1; }, cam: 5700 },
      { say: [S('esteban', 'So. Fenn sends his little cooks to my house. On my granddaughter\'s birthday.', 'angry'), S('esteban', 'I have killed men for parking in my spot, chemist.'), S('walter', 'Then you understand. This is business.'), S('esteban', 'Business? Bah. This is my land.', 'angry')] },
      { cam: null, cine: false, do: lv => lv.hostile(['esteban']), boss: 'esteban', music: 'boss', objective: 'Kill Don Esteban' },
      { spawn: [{ t: 'rifleman', from: 'right' }, { t: 'smg', from: 'left' }] }, { wait: 14 }, { spawn: [{ t: 'shotgunner', from: 'right' }, { t: 'rifleman', from: 'left' }] },
      { until: lv => !lv.named.esteban.alive }, { boss: null, objective: '' }, { clear: true }, { wait: 1.5 },
      { cine: true, say: [S('jace', 'It\'s over. The cartel\'s done, right?', 'worried'), S('walter', 'The cartel is done. Which means Fenn doesn\'t need us anymore.', 'worried'), S('jace', '...Oh.'), S('walter', 'And the only people left who want what we have are the Dust Dogs.'), S('walter', 'I suggest we take our money and disappear.')] },
      { do: lv => { Game.state.money += 8000; lv.toast('+$8,000'); } }, { fade: 'out' }, { end: true }
    ]
  },
  // ---------------------------------------------------------------- FINALE
  highway2: {
    theme: 'highway', width: 90000, start: 480, mode: 'highway', zoom: 1, noDecals: true, music: 'boss', enemyLook: 'biker',
    steps: [
      { cine: true, title: 'LAST RIDE', sub: 'CHAPTER EIGHT' }, { wait: 1.2 },
      { say: [S('jace', 'They grabbed the money barrels, Mr. Black! Dutch\'s guys took ALL of it!', 'angry'), S('walter', 'Then we take it back. They\'re heading to the compound. Get on the roof.'), S('jace', 'Again with the roof!', 'worried')] },
      { cine: false, objective: 'Chase down the Dust Dogs', do: lv => { lv.spawnVehicle('truck', { offset: 560, from: 'right', gunners: 3 }); lv.spawnVehicle('bike', { offset: -300 }); lv.spawnVehicle('bike', { offset: -420 }); } },
      { clear: true }, { cp: true }, { do: lv => { lv.spawnVehicle('truck', { offset: -540, gunners: 3 }); lv.spawnVehicle('bike', { offset: 500, from: 'right' }); lv.spawnVehicle('bike', { offset: 380, from: 'right' }); lv.spawnVehicle('bike', { offset: -250 }); } },
      { clear: true }, { cp: true }, { do: lv => { lv.spawnVehicle('truck', { offset: 560, from: 'right', gunners: 3 }); lv.spawnVehicle('truck', { offset: -540, gunners: 3 }); lv.spawnVehicle('bike', { offset: -300 }); } },
      { clear: true }, { wait: 1 }, { fade: 'out' }, { end: true }
    ]
  },
  compound: {
    theme: 'compound', width: 6000, start: 220, walter: false, music: 'action', enemyLook: 'biker',
    build(L, lv) {
      L.rv(-40, { dirty: true, holes: [[60, -120], [140, -90], [300, -140]] }); L.crate(700, 64, 56, 'sandbag'); L.car(1000, '#3a3a3a', 'pickup', -1); L.barrel(1350, 'red');
      L.plat(1600, GROUND - 140, 280); L.crate(2000, 64, 64, 'metal'); L.barrel(2300, 'propane'); L.car(2600, '#5a2a2a', 'sedan', 1);
      L.crate(3000, 64, 56, 'sandbag'); L.plat(3300, GROUND - 150, 300); L.barrel(3650, 'red');
      L.prop(c => { // the cage
        c.strokeStyle = '#555'; c.lineWidth = 3; c.strokeRect(4050, GROUND - 130, 120, 130); for (let x = 4060; x < 4170; x += 12) { c.beginPath(); c.moveTo(x, GROUND - 130); c.lineTo(x, GROUND); c.stroke(); }
      });
      L.car(4400, '#d8d0b0', 'sedan', 1);
      L.crate(4900, 64, 64, 'metal'); L.barrel(5150, 'red'); L.crate(5400, 64, 56, 'sandbag'); L.plat(5600, GROUND - 140, 240); L.barrel(5800, 'red');
      for (const x of [600, 1900, 3200, 4500, 5500]) L.lamp(x, 260);
      lv.interacts = [{ x: 4110, y: GROUND - 60, text: '[E] Free Walter', done: false, fn: lv2 => { lv2.vars.freed = true; } }];
    },
    steps: [
      { cine: true, wait: 1 },
      { say: [S('jace', '(over the radio) Mr. Black? Mr. Black, talk to me!'), S('dutch', '(radio) Your teacher\'s real quiet, boy. He\'s in a cage. Like a canary.'), S('dutch', '(radio) Come on in. We\'ll have ourselves a little chemistry lesson.', 'smile'), S('jace', 'I\'m coming, Mr. Black. Yo, I\'m coming.', 'angry')] },
      { cine: false, objective: 'Get to Walter', music: 'action', spawn: [{ t: 'gunner', x: 1100 }, { t: 'smg', x: 1300 }, { t: 'thug', x: 900 }, { t: 'shotgunner', x: 1700, y: GROUND - 140 }] },
      { clear: true }, { cp: true }, { reach: 1800, spawn: [{ t: 'rifleman', x: 2400 }, { t: 'smg', x: 2700 }, { t: 'heavy', x: 2900 }, { t: 'knifer', from: 'left' }] },
      { clear: true }, { cp: true }, { reach: 3000, spawn: [{ t: 'rifleman', x: 3400, y: GROUND - 150 }, { t: 'shotgunner', x: 3700 }, { t: 'smg', x: 3800 }, { t: 'thug', x: 3900 }, { t: 'gunner', from: 'left' }] },
      { clear: true }, { cp: true }, { objective: 'Free Walter from the cage' },
      { until: lv => lv.vars.freed }, { cine: true, do: lv => { const w = lv.addNPC({ id: 'walter', kind: 'walter', team: 'ally', x: 4110, look: 'walterHat', guns: ['pistol'] }); w.passive = false; w.invuln = true; lv.walter = w; } },
      { say: [S('walterHat', 'You came back for me.'), S('jace', 'Of course I came back! What happened to your clothes?!', 'worried'), S('walterHat', 'They gave me these. I think I\'ll keep them.', 'smile'), S('walterHat', 'Dutch\'s car is out front. I had a... modification made, before all this. The trunk.'), S('jace', 'What\'s in the trunk?'), S('walterHat', 'An education.', 'angry')] },
      { do: lv => { const st = Game.state; if (!st.weapons.includes('mg')) { st.weapons.push('mg'); lv.player.guns.push(new Gun('mg')); } st.ammo['762'] += 300; lv.player.gi = lv.player.guns.findIndex(g => g.key === 'mg'); lv.toast('NEW WEAPON: M60 "Trunk Gun"'); Game.state.walterBangs = true; } },
      { cine: false, objective: 'Kill Uncle Dutch', cp: true },
      { reach: 4500, arena: [4300, 6000], cine: true, spawn: [{ t: 'dutch', id: 'dutch', x: 5500, name: 'Uncle Dutch', alert: false }], do: lv => { lv.named.dutch.passive = true; lv.named.dutch.facing = -1; }, cam: 5150 },
      { say: [S('dutch', 'Well, look at that. The canary got out.', 'smile'), S('walterHat', 'You took something that belongs to me.'), S('dutch', 'Belongs to you? Professor, out here things belong to whoever\'s holding \'em.', 'angry'), S('walterHat', 'Then hold on tight.', 'angry')] },
      { cam: null, cine: false, do: lv => lv.hostile(['dutch']), boss: 'dutch', music: 'boss' },
      { spawn: [{ t: 'rifleman', from: 'right' }, { t: 'smg', from: 'left' }, { t: 'shotgunner', from: 'right' }] }, { wait: 12 }, { spawn: [{ t: 'heavy', from: 'right' }, { t: 'smg', from: 'left' }] }, { wait: 14 }, { spawn: [{ t: 'rifleman', from: 'left' }, { t: 'shotgunner', from: 'right' }] },
      { until: lv => !lv.named.dutch.alive }, { boss: null, objective: '' }, { clear: true }, { wait: 2 },
      { cine: true, do: lv => { const w = lv.walter; w.passive = true; w.downed = 999; w.hp = 1; } },
      { say: [S('jace', 'We did it! Mr. Black, we— ...Mr. Black?', 'smile'), S('walterHat', 'Stray round. It\'s alright, Jace. It was always going to end like this.', 'worried'), S('jace', 'No. No no no. We\'ll get you to a doctor, man, I\'ll drive, I\'ll—', 'worried'), S('walterHat', 'Listen to me. The money\'s in the barrels. Take it. Go somewhere with grass.'), S('walterHat', 'Twenty-two years, I was invisible. These last few months... people knew my name.'), S('walterHat', 'The chemistry was never the point, Jace. It was always us.', 'smile'), S('jace', 'Yeah, Mr. Black. Yeah. It was us.', 'worried')] },
      { fade: 'out' }, { end: true }
    ]
  },
  // ---------------------------------------------------------------- SIDE: random ambush
  ambush: {
    theme: 'highway', width: 90000, start: 480, mode: 'highway', zoom: 1, noDecals: true, music: 'action', enemyLook: 'biker',
    steps: [
      { cine: true, say: [S('walter', '(from the cab) Jace. We have company. Dust Dogs.'), S('jace', 'Again?! Okay. Okay. Roof.')] },
      { cine: false, objective: 'Fight off the ambush', do: lv => { for (let i = 0; i < 2 + Math.min(3, Game.state.chapter); i++) lv.spawnVehicle('bike', { offset: i % 2 ? -260 - i * 60 : 380 + i * 40, from: i % 2 ? 'left' : 'right' }); if (Game.state.chapter >= 4) lv.spawnVehicle('truck', { offset: -540 }); } },
      { clear: true }, { do: lv => { const r = 400 + Game.state.chapter * 150; Game.state.money += r; lv.toast('+' + fmtMoney(r) + ' looted'); } }, { wait: 1.2 }, { end: true }
    ]
  },
};

// ---------------------------------------------------------------- CHAPTERS
const CHAPTERS = [
  { title: 'Cold Start', node: 'rv', seq: [{ level: 'intro' }, { cook: 'tutorial' }, { level: 'introFight' }], reward: 0, after: 'You need to sell product and gear up. Rafa will see you when you have at least 8 bags.' },
  { title: 'Loco', node: 'junk', requires: s => s.bags >= 8 ? null : 'Rafa wants at least 8 bags. Cook more in the RV.', seq: [{ level: 'junkyard', onStart: s => { s.bags = Math.max(0, s.bags - 8); } }], reward: 0, after: 'Rafa is dead. You need precursor, lots of it. Vamonos Chemical keeps a warehouse full.' },
  { title: 'Barrels', node: 'chem', seq: [{ level: 'warehouse' }], after: 'Ten barrels of precursor. Time to lie low on the open road...' },
  { title: 'Highway to Nowhere', node: 'road', seq: [{ level: 'highway1' }], after: 'The Dust Dogs know your RV now. You need a place to hide. The Crossroads Motel is out on Route 9.' },
  { title: 'The Twins', node: 'motel', seq: [{ level: 'motel' }], after: 'Walter wants a meeting with the man who owns the Golden Hen.' },
  { title: 'Golden Hen', node: 'hen', seq: [{ level: 'goldenhen' }, { level: 'superlab' }], after: 'Don Esteban sent the hit squad. Fenn wants an answer delivered to his ranch.' },
  { title: 'Rancho Muerte', node: 'ranch', seq: [{ level: 'ranch' }], after: 'The cartel is finished. The Dust Dogs are not. Gear up: this is the last ride.' },
  { title: 'Last Ride', node: 'compound', seq: [{ level: 'highway2', onStart: s => { s.flags.lastRide = true; } }, { level: 'compound' }, { ending: true }], after: '' },
];
