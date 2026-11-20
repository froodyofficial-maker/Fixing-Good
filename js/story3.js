'use strict';
// ============================================================
//  FIXING GOOD - more story: the funeral, Morty, the Thursday convoy,
//  the chop shop, the ambiguous ending and the post-credits hook
//  (loads after story2.js)
// ============================================================
Object.assign(LOOKS, {
  lenaMom: { name: 'Carol (Lena\'s mom)', skin: '#ecc4a4', hair: 'long', hairColor: '#8a8a88', shirt: '#1a1a1a', jacket: '#222', sleeves: 'long', pants: '#1a1a1a', shoes: '#111', build: 0.95 },
  gordo: { name: 'El Gordo', skin: '#a8754e', hair: 'buzz', hairColor: '#111', beard: 'full', beardColor: '#111', shirt: '#e8e0c8', jacket: '#6a2a2a', sleeves: 'short', tattoo: true, pants: '#2a2a2a', shoes: '#3a2a1a', build: 1.35, chain: true },
  rook: { name: 'Rook', skin: '#e2b08a', hair: 'long', hairColor: '#3a2a1a', beard: 'full', beardColor: '#4a3a2a', shirt: '#2a2a2a', vest: '#3a2a1a', sleeves: 'short', tattoo: true, pants: '#2a3550', shoes: '#111', build: 1.3 },
  priest: { name: 'Father Ruiz', skin: '#c58d63', hair: 'ring', hairColor: '#bdbdbd', shirt: '#111', jacket: '#151515', sleeves: 'long', pants: '#111', shoes: '#111', build: 1.0 },
  hired: { name: 'Hired gun', skin: '#c58d63', hair: 'buzz', hairColor: '#222', hat: 'cap', hatColor: '#4a5a3a', shirt: '#4a5a3a', vest: '#2a2a2a', sleeves: 'long', pants: '#3a3a2a', shoes: '#111', build: 1.1 },
});
Object.assign(ARCH, {
  gordo: { hp: 780, armor: 160, speed: 150, weapon: 'shotgun', dist: [120, 280], acc: 0.05, react: 0.4, boss: true, look: 'gordo' },
  rook: { hp: 900, armor: 100, speed: 250, weapon: 'axe', melee: true, boss: true, look: 'rook' },
});

Object.assign(LEVELS, {
  // ---------------------------------------------------------------- the funeral (end of LENA)
  funeral: {
    theme: 'day', width: 2400, start: 260, noHud: true, unarmed: true, music: 'menu',
    npcs: [{ id: 'mom', x: 1180, look: 'lenaMom', face: -1 }, { id: 'priest', x: 1320, look: 'priest', face: -1 }],
    build(L) {
      L.prop(c => {
        // headstones + the open grave
        for (const [x, h] of [[700, 60], [820, 50], [1500, 64], [1640, 54], [1780, 60], [1960, 48]]) { c.fillStyle = '#8a8a86'; c.beginPath(); c.moveTo(x, GROUND); c.lineTo(x, GROUND - h + 12); c.arc(x + 18, GROUND - h + 12, 18, PI, TAU); c.lineTo(x + 36, GROUND); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); }
        c.fillStyle = '#3a2a1a'; c.fillRect(1020, GROUND - 4, 150, 10);
        c.fillStyle = '#5a3a24'; c.fillRect(1030, GROUND - 26, 130, 22); c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(1030, GROUND - 26, 130, 22);
        c.fillStyle = '#e8e0d0'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(1050 + i * 18, GROUND - 30, 5, 0, TAU); c.fill(); }
      });
      L.cactus(400, 100); L.cactus(2150, 80); L.car(2020, '#2a2a2a', 'sedan', -1);
    },
    steps: [
      { cine: true, title: 'THREE DAYS LATER', sub: 'SANTA ROSA CEMETERY' }, { wait: 1.2 }, { walk: ['player', 960, true] },
      { say: [N('(Eleven people came. Lena would have made a joke about that. Something about quality over quantity.)'), S2('priest', '...and we commit our sister Lena to the ground, in sure and certain hope.'), S2('lenaMom', 'Jace. You came.', 'worried'), S2('jace', 'Mrs. Alvarez. I\'m so sorry. She was... she was my best friend.', 'worried'), S2('lenaMom', 'I know. Since you were eight. You two used to build forts in my backyard and tell everyone you were running away to Mars.', 'worried')] },
      { say: [S2('lenaMom', 'The police say it was something new. Something blue. Something very pure.', 'neutral'), S2('lenaMom', 'You\'d tell me if you knew who made it. Wouldn\'t you, Jace?', 'angry'), S2('jace', '...', 'worried'), S2('lenaMom', 'Wouldn\'t you?', 'angry')] },
      { choice: { prompt: 'Lena\'s mother is waiting for an answer.', options: [
        { label: 'Lie to her', sub: '"I don\'t know who makes it, Mrs. Alvarez."', flag: ['funeral', 'lied'] },
        { label: 'Say nothing', sub: 'Let her read it on your face.', flag: ['funeral', 'silent'] },
      ] } },
      { if: () => Game.state.flags.funeral === 'lied', say: [S2('jace', 'I don\'t know who makes it. I swear.', 'worried'), S2('lenaMom', 'She always said you were a terrible liar.', 'worried'), S2('lenaMom', 'She was wrong. You\'re a very good one now.', 'angry')] },
      { if: () => Game.state.flags.funeral === 'silent', do: lv => { lv.shake(5); Audio.play('punch'); }, say: [N('(She slaps him. It\'s not hard. It doesn\'t need to be.)'), S2('lenaMom', 'Get out of here. Don\'t you ever come to my house again.', 'angry')] },
      { do: lv => { lv.named.mom.cine = 2300; } }, { wait: 1.2 },
      { npc: { id: 'walter', x: 2080, look: 'walterHat', face: -1 } }, { walk: ['player', 1900, true] },
      { say: [S2('walter', 'I parked out here. I didn\'t think it was my place.'), S2('jace', 'You didn\'t even know her.', 'angry'), S2('walter', 'No. But I know you. And I know grief makes men do expensive, sentimental things.'), S2('walter', 'The Cortez brothers have been seen at the Crossroads Motel. That\'s something to do with your hands.')] },
      { fade: 'out' }, { end: true },
    ],
  },
  // ---------------------------------------------------------------- MORTY
  stripmall: {
    theme: 'town', width: 5200, start: 220, walter: true, music: 'tense', enemyLook: 'cartel', dark: 0.55,
    build(L) {
      L.car(560, '#c8c0a0', 'sedan', 1); L.fire(900, 40); L.crate(1100, 70, 60, 'cardboard'); L.plat(1350, GROUND - 130, 240); L.barrel(1700, 'red');
      L.car(2000, '#7a2a2a', 'pickup', -1); L.fire(2350, 40); L.crate(2600, 64, 64, 'metal'); L.plat(2900, GROUND - 140, 260); L.barrel(3200, 'propane');
      L.car(3500, '#2a3a5a', 'sedan', 1); L.crate(3900, 70, 60, 'cardboard'); L.fire(4100, 30); L.plat(4300, GROUND - 130, 240); L.barrel(4650, 'red');
      for (const x of [380, 1500, 2700, 3800, 4800]) L.lamp(x, 250, x !== 2700);
      L.sign(300, 'PLAZA DEL SOL', '#e0a050'); L.sign(4500, 'GOODFELLOW & ASSOC. · LAW', '#9fe88a');
    },
    steps: [
      { cine: true, title: 'MORTY', sub: 'CHAPTER' }, { wait: 1.2 }, { walk: ['player', 470, true] },
      { say: [S2('jace', 'The whole strip mall\'s on fire. The nail salon. The donut place. Who torches a donut place?', 'worried'), S2('walter', 'People who are looking for us, and know our lawyer can find us.'), S2('jace', 'Morty\'s office is at the end. If they got him, they got everything. Our names. The camp.', 'worried'), S2('walter', 'Then let\'s go and see how loyal a man is when he bills by the hour.')] },
      { cine: false, objective: 'Fight through the plaza to Morty\'s office', music: 'action', spawn: [{ t: 'gunner', x: 1200 }, { t: 'smg', x: 1450, y: GROUND - 130 }, { t: 'thug', x: 1000 }, { t: 'knifer', from: 'left' }] },
      { banter: ['walter', 'Mind the burning cars. They do that thing.'] }, { clear: true }, { cp: true },
      { reach: 1900, spawn: [{ t: 'shotgunner', x: 2500 }, { t: 'rifleman', x: 3000, y: GROUND - 140 }, { t: 'smg', x: 2700 }, { t: 'gunner', from: 'left' }] },
      { clear: true }, { cp: true }, { banter: ['jace', 'They\'re carrying gas cans. They were gonna burn him alive.'] },
      { reach: 3300, spawn: [{ t: 'smg', x: 4000 }, { t: 'rifleman', x: 4400, y: GROUND - 130 }, { t: 'shotgunner', x: 4200 }, { t: 'gunner', x: 3900 }, { t: 'knifer', from: 'left' }] },
      { clear: true }, { cp: true },
      { reach: 3900 }, { arena: [3700, 5200], cine: true, spawn: [{ t: 'gordo', id: 'gordo', x: 4700, name: 'El Gordo', alert: false }], do: lv => { lv.named.gordo.passive = true; lv.named.gordo.facing = -1; }, cam: 4400 },
      { say: [S2('gordo', 'The cook and his little helper. Rafa was my cousin. The twins were my cousins.', 'angry'), S2('jace', 'Man, how many cousins do you guys HAVE?', 'worried'), S2('gordo', 'One less every time you show up. So now I take it personal.', 'angry'), S2('walter', 'Where is the lawyer?'), S2('gordo', 'In the dumpster. Alive. For now. Talks a lot, that one.', 'smile')] },
      { cam: null, cine: false, do: lv => lv.hostile(['gordo']), boss: 'gordo', music: 'boss', objective: 'Kill El Gordo' },
      { wait: 8 }, { spawn: [{ t: 'gunner', from: 'right' }, { t: 'thug', from: 'left' }] }, { wait: 12 }, { spawn: [{ t: 'smg', from: 'left' }] },
      { until: lv => !lv.named.gordo.alive }, { boss: null, objective: '' }, { clear: true }, { wait: 1.2 },
      { cine: true, npc: { id: 'morty', x: 5000, look: 'morty', face: -1 } }, { walk: ['morty', 4800, true] }, { walk: ['player', 4680, true] },
      { say: [S2('morty', 'Fellas! My favourite clients! Do you have any idea what the inside of a dumpster smells like at ninety degrees?', 'worried'), S2('jace', 'Did you tell them anything?', 'angry'), S2('morty', 'I told them I\'d sue. Repeatedly. With citations. I think that\'s why they put the lid on.', 'smile'), S2('walter', 'Mr. Goodfellow. You\'re very good at making problems go away.')] },
      { say: [S2('morty', 'I know a guy for everything. Tax guy. Bail guy. A guy who makes people disappear: new name, new town, new teeth.', 'smile'), S2('morty', 'He even does the dead ones. Death certificate, coroner, the whole paperwork. You\'d be amazed how many dead people are just... dead on paper.', 'smile'), S2('walter', 'Is that so. And this man takes... referrals?'), S2('morty', 'Cash only. Word of mouth. Why, you planning on dying, Professor?', 'smile'), S2('walter', 'Everyone is, Mr. Goodfellow. I like to plan ahead.'), N('(Walter writes something on the back of a receipt. Jace doesn\'t ask what.)')] },
      { do: lv => { Game.state.money += 2500; Game.state.flags.mortyGuy = true; lv.toast('Morty pays his debts: +$2,500'); } }, { wait: 1 }, { fade: 'out' }, { end: true },
    ],
  },
  // ---------------------------------------------------------------- THURSDAY (convoy heist on the RV roof)
  convoy: {
    theme: 'highway', width: 90000, start: 480, mode: 'highway', zoom: 1, noDecals: true, music: 'action', enemyLook: 'labguard', showCount: true,
    steps: [
      { cine: true, title: 'THURSDAY', sub: 'CHAPTER' }, { wait: 1.2 },
      { say: [S2('walter', '(from the cab) Every Thursday Fenn moves his money from the casino strip to the Golden Hen. Two armoured trucks and an escort.'), S2('jace', 'And we\'re robbing it. From the roof. Again.', 'worried'), S2('walter', 'Money Fenn can\'t trace is the only kind that can buy what we need. Shoot the escorts. Then the drivers. Don\'t shoot the money.'), S2('jace', 'Don\'t shoot the money. Got it. Great plan. Love it.', 'worried')] },
      { cine: false, objective: 'Take out Fenn\'s escort', do: lv => { for (let i = 0; i < 3; i++) lv.spawnVehicle('bike', { offset: -360 + i * 130 }); lv.spawnVehicle('bike', { offset: 520, from: 'right' }); } },
      { clear: true }, { banter: ['walter', 'First truck, coming up behind us!'], do: lv => { lv.spawnVehicle('truck', { offset: -540, gunners: 3 }); lv.spawnVehicle('bike', { offset: -300 }); } },
      { clear: true }, { cp: true }, { do: lv => { lv.toast('Truck one: +$3,000'); Game.state.money += 3000; } },
      { banter: ['jace', 'More bikes! Up front AND behind!'], do: lv => { for (let i = 0; i < 3; i++) lv.spawnVehicle('bike', { offset: 460 + i * 110, from: 'right' }); for (let i = 0; i < 2; i++) lv.spawnVehicle('bike', { offset: -330 - i * 120 }); } },
      { clear: true }, { cp: true }, { banter: ['walter', 'There it is. The second truck. Fenn\'s own men drive this one.'], do: lv => { lv.spawnVehicle('truck', { offset: 580, from: 'right', gunners: 3 }); lv.spawnVehicle('truck', { offset: -560, gunners: 2 }); } },
      { clear: true }, { do: lv => { lv.spawnVehicle('bike', { offset: -320 }); lv.spawnVehicle('bike', { offset: -440 }); lv.spawnVehicle('bike', { offset: 500, from: 'right' }); } }, { clear: true }, { wait: 1 },
      { cine: true, say: [S2('jace', 'We did it. We robbed Fenn. FENN. I want to throw up.', 'worried'), S2('walter', 'He\'ll know it was us by tonight.'), S2('jace', 'Then why are you smiling?', 'worried'), S2('walter', 'Because by tonight it won\'t matter.')] },
      { do: lv => { Game.state.money += 6000; lv.toast('Truck two: +$6,000'); } }, { fade: 'out' }, { end: true },
    ],
  },
  // ---------------------------------------------------------------- CHOP SHOP
  chopshop: {
    theme: 'junkyard', width: 5600, start: 260, music: 'tense', enemyLook: 'biker',
    npcs: [{ id: 'h1', kind: 'gunner', team: 'npc', x: 120, look: 'hired', guns: ['smg'], face: 1 }, { id: 'h2', kind: 'gunner', team: 'npc', x: 60, look: 'hired', guns: ['shotgun'], face: 1 }, { id: 'h3', kind: 'gunner', team: 'npc', x: 180, look: 'hired', guns: ['rifle'], face: 1 }],
    build(L) {
      L.car(700, '#5a4a2a', 'pickup', 1); L.stack(1000, 'metal'); L.barrel(1250, 'red'); L.plat(1450, GROUND - 130, 260); L.crate(1800, 70, 64, 'container');
      L.car(2100, '#3a3a3a', 'sedan', -1); L.barrel(2350, 'propane'); L.stack(2600, 'wood'); L.plat(2850, GROUND - 140, 240); L.crate(3200, 64, 64, 'metal');
      L.car(3500, '#7a2a2a', 'pickup', 1); L.barrel(3800, 'red'); L.plat(4000, GROUND - 130, 260); L.stack(4400, 'metal'); L.barrel(4700, 'red');
      L.sign(320, 'DUST DOGS AUTO · NO QUESTIONS', '#e8a050');
    },
    steps: [
      { cine: true, title: 'CHOP SHOP', sub: 'CHAPTER' }, { wait: 1.2 }, { walk: ['player', 360, true] },
      { say: [S2('hired', 'Twelve grand gets you three guys, kid. Not three heroes. Point us at somebody.'), S2('jace', 'The Dust Dogs strip stolen cars here. Rook runs it. Rook knows where Dutch keeps... his guests.', 'angry'), S2('hired', 'And this guest. He\'s the one who got your friend killed?'), S2('jace', 'He\'s the one who knows where my money is.', 'angry')] },
      { cine: false, objective: 'Tear through the chop shop', music: 'action', do: lv => { for (const id of ['h1', 'h2', 'h3']) { const h = lv.named[id]; h.team = 'ally'; h.passive = false; h.invuln = true; h.maxHp = h.hp = 300; h.ai.state = 'alert'; } }, spawn: [{ t: 'gunner', x: 1300 }, { t: 'thug', x: 1100 }, { t: 'smg', x: 1550, y: GROUND - 130 }, { t: 'knifer', x: 1200 }] },
      { clear: true }, { cp: true }, { banter: ['hired', 'Not bad, kid. You shoot like somebody\'s paying you.'] },
      { reach: 1800, spawn: [{ t: 'shotgunner', x: 2500 }, { t: 'rifleman', x: 2950, y: GROUND - 140 }, { t: 'smg', x: 2700 }, { t: 'heavy', x: 3100 }, { t: 'thug', from: 'left' }] },
      { clear: true }, { cp: true },
      { reach: 3200, spawn: [{ t: 'rifleman', x: 4100, y: GROUND - 130 }, { t: 'smg', x: 3900 }, { t: 'shotgunner', x: 4200 }, { t: 'heavy', x: 4500 }, { t: 'knifer', from: 'left' }] },
      { clear: true }, { cp: true },
      { reach: 4300 }, { arena: [4100, 5600], cine: true, spawn: [{ t: 'rook', id: 'rook', x: 5100, name: 'Rook', alert: false }], do: lv => { lv.named.rook.passive = true; lv.named.rook.facing = -1; }, cam: 4800 },
      { say: [S2('rook', 'The cook\'s little buddy. Dutch said you\'d come crawling. Said you\'d bring a crew of nobodies.', 'smile'), S2('jace', 'Where\'s Walter Black?', 'angry'), S2('rook', 'Ask my axe.', 'angry')] },
      { cam: null, cine: false, do: lv => lv.hostile(['rook']), boss: 'rook', music: 'boss', objective: 'Bring Rook down' },
      { wait: 10 }, { spawn: [{ t: 'gunner', from: 'right' }, { t: 'smg', from: 'left' }] }, { wait: 14 }, { spawn: [{ t: 'shotgunner', from: 'right' }] },
      { until: lv => !lv.named.rook.alive }, { boss: null, objective: '' }, { clear: true }, { wait: 1.2 },
      { cine: true, npc: { id: 'rookD', x: 0, look: 'rook', face: -1 }, do: lv => { const r = lv.named.rookD; r.x = lv.player.x + 150; r.downed = 999; } },
      { say: [S2('rook', '(coughing) Okay... okay. Dutch\'s compound. Past Route 9. The cook shed behind the big barn.', 'worried'), S2('jace', 'Is he alive?', 'worried'), S2('rook', 'Dead men don\'t cook, kid. Dutch has him making blue around the clock. Old man keeps asking for a phone.', 'worried'), S2('rook', 'Keeps saying he needs to call his lawyer. Ha. Like a lawyer\'s gonna help him now.', 'smile'), N('(Jace thinks about a receipt with a phone number on the back. He doesn\'t know why.)')] },
      { do: lv => { Game.state.money += 2000; lv.toast('Rook\'s cash box: +$2,000'); } }, { fade: 'out' }, { end: true },
    ],
  },
});

// ---------- splice the new chapters into the story ----------
{
  const at = t => CHAPTERS.findIndex(c => c.title === t);
  const lena = CHAPTERS[at('Lena')]; lena.seq.push({ level: 'funeral' });
  lena.after = 'Lena is buried. Her mother knows. The Cortez brothers, Rafa\'s cousins, are waiting at the Crossroads Motel on Route 9.';
  const twins = CHAPTERS[at('The Twins')], twinsAfter = twins.after;
  twins.after = 'Morty Goodfellow isn\'t answering his phone. Somebody set fire to the strip mall where he keeps his office.';
  CHAPTERS.splice(at('The Twins') + 1, 0, { title: 'Morty', node: 'strip', seq: [{ level: 'stripmall' }], after: twinsAfter });
  const ranch = CHAPTERS[at('Rancho Muerte')];
  ranch.after = 'The cartel is finished. Before Walter moves on Fenn, he wants money Fenn can\'t trace: Fenn\'s armoured trucks run Route 9 every Thursday. The Silver Spur Strip is open for high-roller deals.';
  CHAPTERS.splice(at('Rancho Muerte') + 1, 0, { title: 'Thursday', node: 'convoy', seq: [{ level: 'convoy' }], after: 'Fenn\'s money is in the RV. Now Walter wants Fenn himself.' });
  const alone = CHAPTERS[at('Alone')], aloneAfter = alone.after;
  alone.after = 'Your new crew is ready. Rook, Dutch\'s enforcer, runs the Dust Dogs chop shop off Route 9. Rook knows where Walter is.';
  CHAPTERS.splice(at('Alone') + 1, 0, { title: 'Chop Shop', node: 'chop', seq: [{ level: 'chopshop' }], after: aloneAfter });
}
Object.assign(NODES, {
  strip: { x: 560, y: 400, name: 'Plaza del Sol', sub: 'Morty\'s office is on fire', icon: 'story' },
  convoy: { x: 1190, y: 250, name: 'Route 9 Overpass', sub: 'Fenn\'s Thursday convoy', icon: 'story' },
  chop: { x: 1010, y: 650, name: 'Dust Dogs Auto', sub: 'Rook\'s chop shop', icon: 'story' },
});
ROADS.push(['streets', 'strip'], ['junk', 'convoy'], ['motel', 'chop']);
DISTRICTS.casino.unlock = s => s.chapter >= CHAPTERS.findIndex(c => c.title === 'Rancho Muerte') + 1;

// chapter numbers on every title card follow the chapter list
{
  const WORDS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN', 'TWENTY'];
  CHAPTERS.forEach((C, i) => { for (const it of C.seq) { const L = it.level && LEVELS[it.level]; if (!L) continue; const st = L.steps.find(s => s.title && s.sub && s.sub.startsWith('CHAPTER')); if (st) st.sub = 'CHAPTER ' + WORDS[i]; } });
}

// ---------- the ending: Walter "dies" (and nobody checks very carefully) ----------
{
  const cs = LEVELS.compound.steps;
  const stay = cs.find(s => s.if && s.say && s.say.some(l => l[1] && l[1].includes('You stayed')));
  if (stay) stay.say = [S2('walterHat', '...You stayed. After everything.', 'neutral'), S2('jace', 'Yeah. Somebody should.', 'worried'), S2('walterHat', 'You\'re a better man than me, Jace. That was never... very hard.'), S2('walterHat', 'Call Goodfellow. Tell him... tell him the Professor\'s ready to plan ahead.'), N('(Walter Black\'s eyes close. Jace holds his hand until the paramedics pull him away.)'), N('(He never sees them check for a pulse. He never notices the ambulance doesn\'t turn on its siren.)')];
  const leave = cs.find(s => s.if && s.say && s.say.some(l => l[1] && l[1].includes('That\'s what I would have done')));
  if (leave) leave.say = [S2('walterHat', 'Jace? ...Jace!', 'worried'), S2('walterHat', '...Good. Good. That\'s what I would have done.'), N('(In the mirror, the compound gets smaller until it isn\'t there. Jace doesn\'t look back.)'), N('(Behind him, an old man in a hat reaches into his pocket for a receipt with a phone number on it.)')];
}
