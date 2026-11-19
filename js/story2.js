'use strict';
// ============================================================
//  FIXING GOOD - the expanded story: new chapters, choices, endings
//  (loads after story.js / scenes.js; extends LEVELS, CHAPTERS, NODES)
// ============================================================
Object.assign(LOOKS, {
  nico: { name: 'Nico', skin: '#c58d63', hair: 'short', hairColor: '#1a1410', hat: 'cap', hatColor: '#2a6ab0', shirt: '#3a3a44', sleeves: 'long', hood: true, pants: '#2a3550', shoes: '#eee', build: 0.9 },
  lena: { name: 'Lena', skin: '#ecc4a4', hair: 'long', hairColor: '#7a3a1a', shirt: '#3a8a8a', sleeves: 'long', pants: '#2a2a3a', shoes: '#c8c8c8', build: 0.88 },
  spider: { name: 'Spider', skin: '#d8a27e', hair: 'buzz', hairColor: '#222', hat: 'bandana', hatColor: '#a02020', beard: 'goatee', beardColor: '#222', shirt: '#f0f0f0', sleeves: 'short', tattoo: true, pants: '#2a2a2a', shoes: '#c02020', build: 1.0, chain: true },
  gideon: { name: 'Gideon', skin: '#e2b08a', hair: 'ring', hairColor: '#bdbdbd', mustache: true, beardColor: '#cfcfcf', shirt: '#d8d0b8', jacket: '#7a6a4a', sleeves: 'long', pants: '#4a4a40', shoes: '#2a1a12', build: 1.1 },
  mama: { name: 'A mother', skin: '#a8754e', hair: 'long', hairColor: '#2a1a12', shirt: '#e8b8c8', sleeves: 'long', pants: '#5a4a6a', shoes: '#222', build: 1.0 },
  killer: { name: 'Fenn\'s man', skin: '#e2b08a', hair: 'buzz', hairColor: '#3a2a1a', shirt: '#2a2a2a', jacket: '#2e3a4a', sleeves: 'long', pants: '#2a2a2a', shoes: '#111', build: 1.05 },
});
Object.assign(ARCH, {
  spider: { hp: 560, speed: 240, weapon: 'smg', dist: [160, 360], acc: 0.07, react: 0.4, boss: true, look: 'spider' },
  fenn: { hp: 650, armor: 120, speed: 170, weapon: 'pistol', dist: [240, 480], acc: 0.04, react: 0.35, boss: true, look: 'fenn' },
  gideon: { hp: 620, speed: 160, weapon: 'revolver', dist: [260, 520], acc: 0.03, react: 0.3, boss: true, look: 'gideon' },
});
const S2 = (who, text, expr) => [who, text, expr];
const N = text => ['narrator', text];

Object.assign(LEVELS, {
  // ---------------------------------------------------------------- CORNERS
  southside: {
    theme: 'southside', width: 5400, start: 220, walter: true, music: 'tense', enemyLook: 'thug', dark: 0.5,
    npcs: [{ id: 'nico', x: 520, look: 'nico', face: -1 }],
    build(L) {
      L.car(700, '#3a3a44', 'sedan', 1); L.crate(1100, 70, 64, 'container'); L.fire(1300, 30); L.barrel(1500, 'red'); L.plat(1650, GROUND - 130, 240);
      L.car(2000, '#5a2a2a', 'pickup', -1); L.crate(2400, 64, 56, 'cardboard'); L.fire(2600, 30); L.crate(2800, 70, 64, 'container'); L.plat(3000, GROUND - 140, 260);
      L.barrel(3350, 'propane'); L.car(3600, '#2a3a5a', 'sedan', 1); L.crate(4000, 64, 60, 'metal'); L.fire(4200, 30); L.barrel(4400, 'red'); L.plat(4600, GROUND - 130, 240); L.crate(5000, 70, 64, 'container');
      for (const x of [400, 1400, 2500, 3500, 4500]) L.lamp(x, 240, x !== 2500);
      L.sign(300, 'SOUTHSIDE', '#e05a7a');
    },
    steps: [
      { cine: true, title: 'CORNERS', sub: 'CHAPTER THREE' }, { wait: 1.2 }, { walk: ['player', 440, true] },
      { say: [S2('walter', 'Rafa is dead, which means his corners are empty. Empty corners get filled.'), S2('jace', 'Southside belongs to Spider now. Spider\'s not Rafa. Spider\'s worse. He pays kids to hold his stash so they do the time.', 'worried'), S2('walter', 'Then we\'ll pay them better.'), S2('nico', 'You\'re the blue guy? I\'m Nico. Spider owes me three weeks. I know where his crew sleeps.', 'smile'), S2('jace', 'How old are you, man?'), S2('nico', 'Nineteen. Old enough to know Spider\'s never paying.'), S2('walter', 'Good. Show us.')] },
      { do: lv => { const n = lv.named.nico; n.cine = 300; }, cine: false, objective: 'Take Southside from Spider\'s crew', music: 'action', spawn: [{ t: 'gunner', x: 1200 }, { t: 'thug', x: 1000 }, { t: 'smg', x: 1700, y: GROUND - 130 }] },
      { banter: ['nico', '(from behind a car) Stairwell! He\'s got a guy on the stairwell!'] }, { clear: true }, { cp: true },
      { reach: 1900, spawn: [{ t: 'shotgunner', x: 2600 }, { t: 'gunner', x: 3050, y: GROUND - 140 }, { t: 'knifer', x: 2300 }, { t: 'thug', from: 'left' }] },
      { clear: true }, { cp: true }, { banter: ['walter', 'They\'re falling back. Keep pressure on them.'] },
      { reach: 3300, spawn: [{ t: 'smg', x: 4000 }, { t: 'gunner', x: 4650, y: GROUND - 130 }, { t: 'shotgunner', x: 4200 }, { t: 'knifer', from: 'left' }, { t: 'gunner', x: 4400 }] },
      { clear: true }, { cp: true },
      { reach: 4300 }, { cine: true, npc: { id: 'spider', x: 5000, look: 'spider', guns: ['smg'], face: -1 } }, { wait: 0.6 },
      { say: [S2('spider', 'You think the blue makes you king, cook-boy? Southside eats kings.', 'angry'), S2('jace', 'Then come eat, Spider.', 'angry'), S2('spider', 'Nah. I\'ll wait. Everybody you love on these corners? I know where they sleep too.', 'smile')] },
      { do: lv => { lv.named.spider.cine = 5380; } }, { wait: 1.2 }, { do: lv => lv.remove('spider') },
      { npc: { id: 'mama', x: 4100, look: 'mama', face: 1 } }, { do: lv => { const k = lv.addNPC({ id: 'boy', x: 4160, look: 'nico', face: -1 }); k.look = Object.assign({}, LOOKS.nico, { name: 'Lookout', hatColor: '#a02020' }); k.downed = 999; } },
      { walk: ['player', 4040, true] },
      { say: [N('(A woman in a bathrobe is kneeling over a boy on the pavement. One of Spider\'s lookouts. Fifteen, maybe.)'), S2('mama', 'That was YOUR blue on his corner! He was selling YOUR blue!', 'angry'), S2('jace', '...I didn\'t—', 'worried'), S2('mama', 'Get away from him. GET AWAY FROM MY SON!', 'angry'), S2('walter', 'Jace. Get in the RV. She\'ll forget our faces. Grief is very bad at details.'), S2('nico', 'Southside\'s yours now, Jace. I\'ll run the corner. I won\'t let you down.')] },
      { do: lv => { const st = dealState(); st.flags.southside = true; if (!st.dealers.find(d => d.name === 'Nico')) st.dealers.push({ name: 'Nico', district: 'south', bags: 6, purity: Math.max(st.purity, 85), loyalty: 95, skill: 0.75, status: 'active', look: LOOKS.nico }); Game.state.money += 1500; lv.toast('Southside unlocked · Nico works your corner · +$1,500'); } },
      { wait: 1.4 }, { fade: 'out' }, { end: true },
    ],
  },
  // ---------------------------------------------------------------- LENA
  traphouse: {
    theme: 'warehouse', width: 4400, start: 180, walter: false, music: 'tense', enemyLook: 'thug', flashlight: true, dark: 0.7,
    build(L) {
      L.crate(500, 64, 56, 'cardboard'); L.table(800, 140); L.crate(1100, 64, 64); L.plat(1300, GROUND - 130, 260); L.barrel(1600, 'red'); L.table(1900, 140);
      L.crate(2200, 70, 64, 'metal'); L.plat(2500, GROUND - 140, 240); L.crate(2800, 64, 56, 'cardboard'); L.barrel(3100, 'propane'); L.table(3400, 140); L.crate(3700, 64, 64, 'metal'); L.plat(3900, GROUND - 130, 260);
      for (const x of [300, 1200, 2100, 3000, 3900]) L.light(x, 150, 260, '255,190,110', 0.6);
      L.sign(240, 'NO VACANCY', '#e05a7a');
    },
    steps: [
      { cine: true, title: 'LENA', sub: 'CHAPTER SIX' }, { wait: 1.2 },
      { say: [S2('lena', '(phone) Jace? I\'m sorry. I\'m so sorry. Spider\'s guy came by. He had the blue. Your blue.', 'worried'), S2('jace', 'Where are you?', 'worried'), S2('lena', '(phone) Home. I only did a little. A year clean and I only did a little.', 'worried'), S2('jace', 'Stay there. Lock the door. I\'m going to go have a talk with Spider.', 'angry'), S2('walter', '(radio) Jace. Personal business is bad business.'), S2('jace', 'Then stay in the RV, Mr. Black.', 'angry')] },
      { cine: false, objective: 'Clear out Spider\'s trap house', music: 'action', spawn: [{ t: 'gunner', x: 1000 }, { t: 'thug', x: 900 }, { t: 'smg', x: 1350, y: GROUND - 130 }, { t: 'knifer', x: 1200 }] },
      { clear: true }, { cp: true }, { reach: 1700, spawn: [{ t: 'shotgunner', x: 2300 }, { t: 'gunner', x: 2550, y: GROUND - 140 }, { t: 'smg', x: 2700 }, { t: 'thug', from: 'left' }] },
      { clear: true }, { cp: true },
      { reach: 3000 }, { arena: [2900, 4400], cine: true, spawn: [{ t: 'spider', id: 'spider', x: 4000, name: 'Spider', alert: false }], do: lv => { lv.named.spider.passive = true; lv.named.spider.facing = -1; }, cam: 3650 },
      { say: [S2('spider', 'She came to ME, Jace. Walked right in. You think she wants you? She wants what you cook.', 'smile'), S2('jace', 'I\'m going to kill you, Spider.', 'angry'), S2('spider', 'Everybody says that. Then they need a re-up.', 'smile')] },
      { cam: null, cine: false, do: lv => lv.hostile(['spider']), boss: 'spider', music: 'boss', objective: 'Kill Spider' },
      { spawn: [{ t: 'gunner', from: 'right' }, { t: 'knifer', from: 'left' }] }, { wait: 12 }, { spawn: [{ t: 'smg', from: 'right' }] },
      { until: lv => !lv.named.spider.alive }, { boss: null, objective: '' }, { clear: true }, { wait: 1.2 },
      { banter: ['jace', 'That one was for Lena.'] }, { wait: 1.5 }, { fade: 'out' }, { end: true },
    ],
  },
  lenaEnd: {
    theme: 'southside', width: 2200, start: 300, noHud: true, unarmed: true, music: 'menu', dark: 0.55,
    npcs: [{ id: 'lena', x: 1000, look: 'lena', face: -1 }],
    build(L) { L.prop(c => { c.fillStyle = '#3a2e2a'; c.fillRect(780, GROUND - 260, 520, 260); c.fillStyle = '#f0c070'; c.fillRect(840, GROUND - 210, 90, 80); c.fillRect(1150, GROUND - 210, 90, 80); c.strokeStyle = INK; c.lineWidth = 4; c.strokeRect(780, GROUND - 260, 520, 260); c.fillStyle = '#5a3a2a'; c.fillRect(1000, GROUND - 150, 70, 150); }); L.lamp(600, 240); L.table(1180, 110); },
    steps: [
      { cine: true, walk: ['player', 920, true] },
      { say: [S2('lena', 'You came back. You actually came back.', 'smile'), S2('jace', 'I\'m done, Lena. After this batch. We take the money and go somewhere with grass.', 'worried'), S2('lena', 'You always say "after this batch."', 'smile'), S2('jace', 'This time I mean it.'), N('(That night Jace sleeps for the first time in a week. The stash is still in his jacket on the chair.)')] },
      { fade: 'out' }, { do: lv => { lv.named.lena.downed = 999; lv.named.lena.x = 1180; lv.player.x = 1000; } }, { wait: 1.2 }, { fade: 'in' },
      { say: [N('(Morning.)'), S2('jace', 'Lena? ...Lena. Hey. LENA!', 'worried'), N('(She is cold. There is a little blue left on the nightstand. Jace\'s blue.)'), N('(He doesn\'t remember the next hour. Only Walter at the door, very calm, holding his hat.)')] },
      { npc: { id: 'walter', x: 300, look: 'walter', face: 1 } }, { walk: ['walter', 820, true] },
      { say: [S2('walter', 'Jace. I came by last night looking for you. You were both asleep. I didn\'t want to wake you.'), S2('jace', 'She\'s dead, Mr. Black. She\'s DEAD.', 'worried'), S2('walter', 'I know. I\'m sorry.'), S2('walter', 'We have a cook on Thursday. You\'ll want to be busy.')] },
      { fade: 'out' }, { end: true },
    ],
  },
  // ---------------------------------------------------------------- NICO
  stockyard: {
    theme: 'dusk', width: 5000, start: 300, walter: true, music: 'tense', enemyLook: 'labguard',
    npcs: [{ id: 'nico', x: 520, look: 'nico', face: 1 }],
    build(L) {
      L.crate(900, 70, 64, 'container'); L.crate(906, 58, 56, 'container', GROUND - 64); L.barrel(1200, 'red'); L.car(1450, '#4a4a3a', 'pickup', 1); L.plat(1800, GROUND - 130, 260);
      L.crate(2200, 64, 64, 'metal'); L.barrel(2400, 'propane'); L.crate(2700, 70, 64, 'container'); L.plat(3000, GROUND - 140, 240); L.car(3400, '#2a2a2a', 'sedan', -1);
      L.crate(3800, 64, 56, 'sandbag'); L.barrel(4000, 'red'); L.crate(4300, 70, 64, 'container'); L.plat(4500, GROUND - 130, 240);
      L.prop(c => { c.font = 'bold 40px sans-serif'; c.fillStyle = 'rgba(200,30,30,.8)'; c.fillText('NO', 470, GROUND - 120); });
      L.sign(200, 'ROUTE 9 STOCKYARD', '#e8c060');
    },
    steps: [
      { cine: true, title: 'NICO', sub: 'CHAPTER NINE', do: lv => { lv.named.nico.downed = 999; } }, { wait: 1.2 }, { walk: ['player', 470, true] },
      { say: [N('(Nico is lying where his corner used to be. Somebody painted one word on the wall above him: NO.)'), S2('jace', 'He was nineteen. He was NINETEEN, Mr. Black.', 'worried'), S2('walter', 'Fenn asked you for Southside. You said no. This is how a man like Fenn says it back.'), S2('jace', 'Where are they.', 'angry'), S2('walter', 'The stockyard off Route 9. Fenn\'s people. I asked around.'), S2('walter', 'Jace. Whatever you do there, do it quietly. We still need Fenn\'s lab.')] },
      { do: lv => { const st = dealState(); const d = st.dealers.find(x => x.name === 'Nico'); if (d) { d.status = 'dead'; d.bags = 0; } } },
      { cine: false, objective: 'Find Nico\'s killers', music: 'action', spawn: [{ t: 'gunner', x: 1300 }, { t: 'smg', x: 1850, y: GROUND - 130 }, { t: 'rifleman', x: 1600 }, { t: 'knifer', x: 1100 }] },
      { clear: true }, { cp: true }, { reach: 2000, spawn: [{ t: 'shotgunner', x: 2700 }, { t: 'rifleman', x: 3050, y: GROUND - 140 }, { t: 'smg', x: 2900 }, { t: 'heavy', x: 3300 }] },
      { clear: true }, { cp: true }, { reach: 3400, spawn: [{ t: 'rifleman', x: 4550, y: GROUND - 130 }, { t: 'gunner', x: 4200 }, { t: 'shotgunner', x: 4300 }, { t: 'smg', from: 'left' }] },
      { clear: true }, { cp: true },
      { reach: 4100 }, { cine: true, npc: { id: 'killer', x: 4400, look: 'killer', face: -1 }, do: lv => { lv.named.killer.downed = 999; } }, { walk: ['player', 4300, true] },
      { say: [S2('killer', 'Wait! WAIT! It was an order, man! Fenn said make it loud! Make it a message!', 'worried'), S2('jace', 'He was a kid.', 'angry'), S2('killer', 'I\'ve got a kid too! Please! I\'ll leave the state. I\'ll leave the country!', 'worried'), S2('walter', 'Your call, Jace. But decide quickly. Fenn will notice his people are missing.')] },
      { choice: { prompt: 'The man who killed Nico is on his knees in the dirt. Walter is watching you very closely.', options: [
        { label: 'Execute him', sub: 'Make it loud. Make it a message back.', flag: ['nico', 'executed'], do: lv => { const k = lv.named.killer, p = lv.player; setTimeout(() => { Audio.play('revolver'); lv.shake(6); k.downed = 0; k.hurt(999, { kind: 'bullet', x: k.x, y: k.y - 30, dx: 1, dy: 0.2, head: true, power: 200, knock: 300 }, lv); }, 400); } },
        { label: 'Let him go', sub: 'Leave New Mexico tonight. Never come back.', flag: ['nico', 'spared'], do: lv => { const k = lv.named.killer; k.downed = 0; k.cine = 5200; } },
      ] } },
      { wait: 1.4 },
      { until: lv => true, do: lv => { lv.vars.after = Game.state.flags.nico; } },
      { if: () => Game.state.flags.nico === 'executed', say: [S2('walter', '...Well. That was loud.', 'neutral'), S2('jace', 'Don\'t. Don\'t say anything.', 'angry'), S2('walter', 'I was only going to say: now Fenn knows exactly who you are.')] },
      { if: () => Game.state.flags.nico === 'spared', say: [S2('walter', 'Mercy. How expensive of you.', 'neutral'), S2('jace', 'He\'s got a kid.', 'worried'), S2('walter', 'Everyone has a kid, Jace. Fenn will hear about this by dinner, and he\'ll know you\'re soft.')] },
      { do: lv => lv.remove('killer') }, { fade: 'out' }, { end: true },
    ],
  },
  // ---------------------------------------------------------------- CHECKMATE
  hencenter: {
    theme: 'lab', width: 5600, start: 200, walter: true, music: 'tense', enemyLook: 'labguard', dark: 0.32,
    build(L) {
      L.plat(600, GROUND - 160, 340); L.crate(1100, 64, 64, 'metal'); L.barrel(1300, 'red'); L.crate(1600, 120, 52, 'counter'); L.plat(1900, GROUND - 150, 300);
      L.crate(2400, 64, 64, 'metal'); L.barrel(2600, 'blue'); L.crate(2900, 120, 52, 'counter'); L.plat(3200, GROUND - 160, 320); L.barrel(3500, 'red');
      L.crate(3900, 64, 64, 'metal'); L.plat(4300, GROUND - 150, 300); L.barrel(4600, 'propane'); L.crate(4900, 120, 52, 'counter'); L.barrel(5200, 'red');
      for (const x of [400, 1500, 2600, 3700, 4800]) L.light(x, 80, 380, '220,240,255', 0.7);
      L.sign(260, 'GOLDEN HEN DISTRIBUTION', '#ffd040');
    },
    steps: [
      { cine: true, title: 'CHECKMATE', sub: 'CHAPTER ELEVEN' }, { wait: 1.2 },
      { say: [S2('walter', 'Fenn killed Nico to teach you a lesson. The moment his lab runs without us, he\'ll teach us one too.'), S2('jace', 'So we kill him first.', 'angry'), S2('walter', 'We fire him. Permanently.'), S2('walter', 'He\'s here tonight. Counting his chickens.')] },
      { cine: false, objective: 'Fight through Fenn\'s distribution center', music: 'action', spawn: [{ t: 'rifleman', x: 700, y: GROUND - 160 }, { t: 'smg', x: 1200 }, { t: 'gunner', x: 1500 }, { t: 'shotgunner', x: 1700 }] },
      { clear: true }, { cp: true }, { reach: 1800, spawn: [{ t: 'heavy', x: 2500 }, { t: 'rifleman', x: 2000, y: GROUND - 150 }, { t: 'smg', x: 2800 }, { t: 'gunner', from: 'left' }] },
      { clear: true }, { cp: true }, { reach: 3000, spawn: [{ t: 'rifleman', x: 3300, y: GROUND - 160 }, { t: 'shotgunner', x: 3700 }, { t: 'smg', x: 3800 }, { t: 'heavy', x: 4000 }] },
      { clear: true }, { cp: true },
      { reach: 4100 }, { arena: [3900, 5600], cine: true, spawn: [{ t: 'gideon', id: 'gideon', x: 5000, name: 'Gideon', alert: false }, { t: 'fenn', id: 'fenn', x: 5250, name: 'Augusto Fenn', alert: false }], do: lv => { for (const id of ['gideon', 'fenn']) { lv.named[id].passive = true; lv.named[id].facing = -1; } }, cam: 4700 },
      { say: [S2('gideon', 'Thirty years a cop, son. I\'ve buried better than you.', 'angry'), S2('fenn', 'You were a delivery boy with a chemistry teacher. I made you into something. This is ingratitude.'), S2('jace', 'You killed Nico.', 'angry'), S2('fenn', 'I killed a corner. You took it personally. That was always your problem.')] },
      { cam: null, cine: false, do: lv => lv.hostile(['gideon', 'fenn']), boss: 'gideon', music: 'boss', objective: 'Kill Fenn and Gideon' },
      { until: lv => !lv.named.gideon.alive || !lv.named.fenn.alive }, { do: lv => { lv.bossId = lv.named.fenn.alive ? 'fenn' : 'gideon'; } },
      { spawn: [{ t: 'smg', from: 'left' }, { t: 'rifleman', from: 'right' }] },
      { until: lv => !lv.named.gideon.alive && !lv.named.fenn.alive }, { boss: null, objective: '' }, { clear: true }, { wait: 1.5 },
      { cine: true, walk: ['walter', 4600, true, false] }, { walk: ['player', 4700, true] },
      { say: [S2('jace', 'It\'s done. Fenn\'s done. Nico\'s... even.', 'worried'), S2('walter', 'There\'s something you should hear from me, before you hear it from someone who doesn\'t love you.'), S2('walter', 'The night Lena died. I didn\'t knock. The door was open.'), S2('walter', 'She was choking, Jace. On her back. I could have turned her over. It would have taken one second.'), S2('jace', '...What.', 'worried'), S2('walter', 'You were going to leave. She was going to take you somewhere with grass. I needed my partner.'), S2('walter', 'So I watched. And then I went home. And I am telling you now so you understand exactly what I am willing to do.')] },
      { choice: { prompt: 'Walter just told you he watched Lena die.', options: [
        { label: 'Hit him', sub: 'Again. And again.', flag: ['truth', 'hit'], do: lv => { const p = lv.player, w = lv.walter; p.facing = w.x > p.x ? 1 : -1; let n = 0; const iv = setInterval(() => { if (n++ > 4) { clearInterval(iv); w.downed = 3; return; } p.melee = null; p.combo = n % 3; p.startMelee(lv); Audio.play('punch'); lv.shake(4); w.stagger = 0.3; lv.fx.blood(w.x, w.y - 80, p.facing, -0.3, 8, 0.6); }, 330); } },
        { label: 'Walk away', sub: 'Don\'t give him anything. Not even this.', flag: ['truth', 'walked'], do: lv => { lv.player.cine = 4300; } },
      ] } },
      { wait: 2.2 },
      { say: [S2('walter', '...We still have work to do, Jace. Brewer is close. Closer than you know.')] },
      { do: lv => { Game.state.money += 10000; lv.toast('+$10,000 from Fenn\'s safe'); } }, { fade: 'out' }, { end: true },
    ],
  },
  // ---------------------------------------------------------------- BREWER
  canyon: {
    theme: 'night', width: 4800, start: 260, walter: true, music: 'tense', enemyLook: 'biker', flashlight: true, dark: 0.6,
    npcs: [{ id: 'brewer', kind: 'rifleman', team: 'npc', x: 700, look: 'brewer', guns: ['rifle'], face: -1 }],
    build(L) {
      L.rv(-80, { dirty: true }); L.car(560, '#2a2a2a', 'sedan', -1); for (const x of [1100, 1700, 2300, 2900, 3500, 4100]) { L.crate(x, 90, 70, 'sandbag'); }
      L.barrel(1400, 'red'); L.barrel(2600, 'red'); L.barrel(3800, 'propane'); L.plat(2000, GROUND - 130, 240); L.plat(3200, GROUND - 130, 240); L.cactus(1250, 110); L.cactus(3000, 90);
      L.light(620, GROUND - 60, 360, '255,240,200', 0.9);
    },
    steps: [
      { cine: true, title: 'BREWER', sub: 'CHAPTER TWELVE' }, { wait: 1.2 }, { walk: ['player', 560, true] },
      { say: [S2('brewer', 'Walt. WALT. Your RV. Your chemistry set. Your partner here. I\'ve got a file on you this thick.', 'angry'), S2('walter', 'Hal. Please. Not here.', 'worried'), S2('brewer', 'No, here! You\'re under arrest, and so is your little—', 'angry'), N('(Engines. Dozens of them, coming up the canyon.)'), S2('jace', 'Bikes. A LOT of bikes. Mr. Black... did you call someone?', 'worried'), S2('walter', 'I called Dutch. Last week. I told him where Hal would be tonight.'), S2('brewer', 'You set me up? You set ME up?! Behind the sandbags, both of you! We sort this out AFTER!', 'angry')] },
      { cine: false, objective: 'Survive the Dust Dogs', music: 'action', do: lv => { const b = lv.named.brewer; b.team = 'ally'; b.passive = false; b.invuln = true; b.maxHp = b.hp = 500; b.ai.state = 'alert'; }, spawn: [{ t: 'gunner', from: 'right' }, { t: 'smg', from: 'right' }, { t: 'thug', from: 'right' }, { t: 'gunner', x: 2050, y: GROUND - 130 }] },
      { banter: ['brewer', 'DEA! Drop your weapons! ...Yeah, didn\'t think so.'] }, { clear: true }, { cp: true },
      { reach: 1500, spawn: [{ t: 'rifleman', x: 2400 }, { t: 'shotgunner', x: 2200 }, { t: 'smg', x: 3250, y: GROUND - 130 }, { t: 'knifer', from: 'left' }] },
      { clear: true }, { cp: true }, { banter: ['walter', 'There\'s too many of them, Hal!'] },
      { reach: 2800, spawn: [{ t: 'heavy', x: 3700 }, { t: 'rifleman', x: 3900 }, { t: 'smg', x: 3500 }, { t: 'gunner', from: 'left' }, { t: 'shotgunner', x: 4100 }] },
      { clear: true }, { wait: 1 },
      { cine: true, do: lv => { const b = lv.named.brewer; b.downed = 999; b.x = lv.player.x + 160; }, spawn: [{ t: 'dutch', id: 'dutch', x: 3500, alert: false, passive: true }, { t: 'rifleman', id: 'dg1', x: 3600, alert: false, passive: true }, { t: 'rifleman', id: 'dg2', x: 3700, alert: false, passive: true }] },
      { walk: ['dutch', 3150, true] },
      { say: [S2('walter', 'Dutch! The deal\'s off! Leave him! I\'ll give you everything! The money, the formula, all of it, just leave Hal alone!', 'worried'), S2('dutch', 'Professor. You invited me. Rude to leave a party early.', 'smile'), S2('brewer', 'Walt... tell my wife... tell her it was quick. Lie to her. You\'re good at that.', 'worried'), S2('dutch', 'Hold still, lawman.')] },
      { do: lv => { const b = lv.named.brewer, d = lv.named.dutch; d.facing = b.x > d.x ? 1 : -1; Audio.play('revolver'); lv.shake(6); b.downed = 0; b.invuln = false; b.hurt(9999, { kind: 'bullet', x: b.x, y: b.y - 30, dx: d.facing, dy: 0.2, head: true, power: 300, knock: 300 }, lv); } }, { wait: 1.6 },
      { say: [S2('walter', 'NO. No no no no. Hal. HAL!', 'worried'), S2('dutch', 'Take the barrels. Take the Professor. He\'s gonna cook for us now.', 'smile'), S2('dutch', 'Leave the kid for the coyotes.')] },
      { do: lv => { lv.remove('walter'); lv.player.hurt(Math.max(0, lv.player.hp - 5), { kind: 'melee', x: lv.player.x, y: lv.player.y - 60, dx: -1, dy: 0 }, lv); } },
      { fade: 'out' }, { say: [N('(Jace wakes up alone in the canyon at dawn. The RV is gone. The money is gone. So is Walter.)'), N('(Hal Brewer is still there. Somebody has to bury him. Jace does.)')] }, { end: true },
    ],
  },
  // ---------------------------------------------------------------- ALONE
  alone: {
    theme: 'town', width: 2200, start: 300, noHud: true, unarmed: true, music: 'tense',
    npcs: [{ id: 'dusty', x: 1000, look: 'dusty', face: -1 }, { id: 'morty', x: 1140, look: 'morty', face: -1 }],
    build(L) { L.car(400, '#c8c0a0', 'sedan', 1); L.sign(1400, "DUSTY'S PAWN & GUNS", '#ffd060'); L.table(1200, 130); },
    steps: [
      { cine: true, title: 'ALONE', sub: 'CHAPTER THIRTEEN' }, { walk: ['player', 880, true] },
      { say: [S2('dusty', 'Twelve grand buys you three bad decisions with guns and an RV that still starts. Mostly.'), S2('morty', 'Legally, I\'m advising you not to do this. Personally, I\'ve already called my travel agent.'), S2('jace', 'Dutch has Mr. Black. And my money.', 'angry'), S2('dusty', 'After what that man did to your girl, you\'re going back for him?'), S2('jace', 'I\'m going back for the money.', 'angry'), S2('jace', 'And I want him to see me do it.', 'angry'), S2('morty', 'Wonderful. I love a client with closure issues. Dutch\'s compound is out past Route 9. You didn\'t hear it from me. You didn\'t hear anything from me, ever.')] },
      { fade: 'out' }, { end: true },
    ],
  },
});

// ---------- the finale: two endings ----------
{
  const cs = LEVELS.compound.steps, k = cs.findIndex(s => s.say && s.say[0][1].startsWith('We did it'));
  if (k >= 0) cs.splice(k, cs.length - k,
    { say: [S2('jace', 'It\'s over. Dutch is done. Mr. Black? ...Mr. Black.', 'worried'), S2('walterHat', 'Stray round. It\'s alright, Jace. It was always going to end like this.', 'worried'), S2('walterHat', 'About Lena. I\'d do it again. I need you to know I\'m not sorry. Sorry would mean it was a mistake.'), S2('walterHat', 'The money\'s in the barrels. Take it. Or don\'t. I won\'t be here to care.')] },
    { choice: { prompt: 'Walter is bleeding out in the dirt. Sirens, far off, getting closer. The money is in the truck.', options: [
      { label: 'Stay with him', sub: 'Nobody should die alone. Not even him.', flag: ['ending', 'stay'] },
      { label: 'Take the money and leave him', sub: 'He let Lena die alone.', flag: ['ending', 'leave'], do: lv => { lv.player.cine = 6000; } },
    ] } },
    { wait: 1.2 },
    { until: () => true, do: lv => { lv.vars.end = Game.state.flags.ending; } },
    { if: () => Game.state.flags.ending === 'stay', say: [S2('walterHat', '...You stayed. After everything.', 'neutral'), S2('jace', 'Yeah. Somebody should.', 'worried'), S2('walterHat', 'You\'re a better man than me, Jace. That was never... very hard.'), N('(Walter Black stops breathing at 6:14 in the morning. Jace doesn\'t move until the sirens arrive.)')] },
    { if: () => Game.state.flags.ending === 'leave', say: [S2('walterHat', 'Jace? ...Jace!', 'worried'), S2('walterHat', '...Good. Good. That\'s what I would have done.'), N('(Jace doesn\'t look back. In the mirror, the compound gets smaller until it isn\'t there.)')] },
    { fade: 'out' }, { end: true },
  );
}
LEVELS.highway2.driver = 'dusty';
{ const s0 = LEVELS.highway2.steps.find(s => s.say); if (s0) s0.say = [S2('dusty', '(from the cab) She still runs. Barely. Dutch\'s boys are hauling your money down Route 9 to the compound.'), S2('jace', 'Then we take it back.', 'angry'), S2('dusty', 'Get on the roof, kid. I\'ll drive. I\'m too old to shoot and too mean to die.')]; }

// ---------- chapter list ----------
CHAPTERS.length = 0;
CHAPTERS.push(
  { title: 'Cold Start', node: 'rv', seq: [{ level: 'intro' }, { cook: 'tutorial' }, { level: 'introFight' }], after: 'You need product and a buyer. Rafa will see you when you have at least 8 bags. Sell what you don\'t need downtown: negotiate, read people, don\'t sell to cops.' },
  { title: 'Loco', node: 'junk', requires: s => s.bags >= 8 ? null : 'Rafa wants at least 8 bags. Cook more in the RV.', seq: [{ level: 'junkyard', onStart: s => { s.bags = Math.max(0, s.bags - 8); } }], after: 'Rafa is dead and his corners are empty. Southside is up for grabs, if you can take it from Spider.' },
  { title: 'Corners', node: 'block', seq: [{ level: 'southside' }], after: 'Southside is yours, and Nico runs the corner. Hire dealers, keep them stocked, and watch the morning reports. You need precursor: Vamonos Chemical has a warehouse full.' },
  { title: 'Barrels', node: 'chem', seq: [{ level: 'warehouse' }], after: 'Ten barrels of precursor. Time to lie low on the open road...' },
  { title: 'Highway to Nowhere', node: 'road', seq: [{ level: 'highway1' }], after: 'The Dust Dogs know your RV now. University Row is open for business. And Lena called. She sounded wrong.' },
  { title: 'Lena', node: 'trap', seq: [{ level: 'traphouse' }, { level: 'lenaEnd' }], after: 'Lena is gone. Walter says work helps. The Crossroads Motel is out on Route 9; Rafa\'s cousins are looking for you.' },
  { title: 'The Twins', node: 'motel', requires: s => s.stats.bagsSold >= 25 ? null : 'Walter: "We need money for the move. Sell at least 25 bags total first." (' + s.stats.bagsSold + '/25)', seq: [{ level: 'motel' }], after: 'Walter wants a meeting with the man who owns the Golden Hen. The truck stop on Route 9 is open for bulk deals.' },
  { title: 'Golden Hen', node: 'hen', seq: [{ level: 'goldenhen' }, { level: 'superlab' }], after: 'Fenn wants Southside. You told him no. Go check on Nico.' },
  { title: 'Nico', node: 'yard', seq: [{ level: 'stockyard' }], after: 'Don Esteban sent the hit squad at the superlab. Fenn wants an answer delivered to his ranch. You go, because you still need Fenn. For now.' },
  { title: 'Rancho Muerte', node: 'ranch', seq: [{ level: 'ranch' }], after: 'The cartel is finished. Now Fenn is the only thing between you and everything. Walter has a plan. The Silver Spur Strip is open for high-roller deals.' },
  { title: 'Checkmate', node: 'hq', requires: s => s.rep >= 35 ? null : 'Walter: "Nobody will back us against Fenn until the street respects you." Reach 35 rep (now ' + Math.round(s.rep || 0) + '). Deal well, finish turf wars.', seq: [{ level: 'hencenter' }], after: 'Fenn is dead. You know what Walter did. And Agent Brewer has found the RV camp in the canyon.' },
  { title: 'Brewer', node: 'canyon', seq: [{ level: 'canyon' }], after: 'Brewer is dead. Walter is gone. So is the money. You have your corners, your dealers and nothing else.' },
  { title: 'Alone', node: 'alone', requires: s => s.money >= 12000 ? null : 'You need $12,000 for guns and a crew (you have ' + fmtMoney(s.money) + '). Deal. Cook. Collect.', seq: [{ level: 'alone', onStart: s => { s.money -= 12000; } }], after: 'Dusty has the RV running. Dutch\'s compound is out past Route 9. This is the last ride.' },
  { title: 'Last Ride', node: 'compound', seq: [{ level: 'highway2', onStart: s => { s.flags.lastRide = true; } }, { level: 'compound' }, { ending: true }], after: '' },
);
// new story locations on the map
Object.assign(NODES, {
  block: { x: 690, y: 610, name: 'Southside Blocks', sub: 'Spider\'s territory', icon: 'story' },
  trap: { x: 610, y: 540, name: 'Spider\'s Trap House', sub: 'Lena is in trouble', icon: 'story' },
  yard: { x: 1150, y: 470, name: 'Route 9 Stockyard', sub: 'Fenn\'s people', icon: 'story' },
  hq: { x: 860, y: 130, name: 'Golden Hen Distribution', sub: 'Fenn\'s headquarters', icon: 'story' },
  canyon: { x: 330, y: 330, name: 'Dead Horse Canyon', sub: 'The RV camp', icon: 'story' },
  alone: { x: 840, y: 480, name: 'Dusty\'s Back Room', sub: 'Buy a crew', icon: 'story' },
});
ROADS.push(['south', 'block'], ['hardware', 'trap'], ['motel', 'yard'], ['hen', 'hq'], ['rv', 'canyon'], ['dusty', 'alone']);
DISTRICTS.campus.unlock = s => s.chapter >= 5;
DISTRICTS.truck.unlock = s => s.chapter >= 7;
DISTRICTS.casino.unlock = s => s.chapter >= 10;

// ---------- epilogue text for the ending ----------
function epilogueLines() {
  const f = Game.state.flags, st = Game.state, L = [];
  if (f.ending === 'leave') L.push('Jace drove until the gas ran out, somewhere past the state line, with four barrels of money and the radio off.', 'Walter Black died alone in the dirt outside Dutch\'s compound. The DEA found him the next morning, still wearing the hat.');
  else L.push('Jace sat in the dirt with Walter until the sirens came. Walter didn\'t say anything else. Jace didn\'t ask him to.', 'When the DEA arrived, Jace was holding a dead man\'s hand and four barrels of money he never touched again.');
  if (f.nico === 'executed') L.push('Jace still sees the stockyard when he closes his eyes. Nico\'s killer, on his knees, and the sound it made.');
  else if (f.nico === 'spared') L.push('The man who killed Nico made it to Arizona. Fenn\'s people found him there a week later. Mercy bought him seven days.');
  if (f.truth === 'hit') L.push('Jace broke two knuckles on Walter Black\'s face the night he learned the truth about Lena. They never healed right.');
  else if (f.truth === 'walked') L.push('Jace never told anyone what Walter said about Lena. Some things you carry so nobody else has to.');
  const crew = (st.dealers || []).filter(d => d.status === 'active').length;
  L.push(crew ? `${crew} of Jace's dealers kept working the corners. Somebody always does.` : 'The corners filled back up within a month. Somebody always does.');
  L.push(`Street earnings: ${fmtMoney(st.stats.earned)}. Bags sold: ${st.stats.bagsSold}. People killed: ${st.stats.kills}.`);
  return L;
}

// renumber the original chapters' title cards to match the longer story
for (const [k, sub] of [['warehouse', 'CHAPTER FOUR'], ['highway1', 'CHAPTER FIVE'], ['motel', 'CHAPTER SEVEN'], ['goldenhen', 'CHAPTER EIGHT'], ['ranch', 'CHAPTER TEN'], ['highway2', 'CHAPTER FOURTEEN']]) { const st = LEVELS[k].steps.find(s => s.title); if (st) st.sub = sub; }
