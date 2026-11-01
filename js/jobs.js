'use strict';
// ============================================================
//  FIXING GOOD - side jobs: generated bounty / turf-war missions
// ============================================================
NODES.bar = { x: 880, y: 220, name: 'The Dog House', sub: 'Side jobs · bounties · turf wars', icon: 'job' };
ROADS.push(['morty', 'bar'], ['bar', 'junk']);

const JOB_PLACES = [
  { name: 'the old drive-in', theme: 'dusk', look: 'thug' }, { name: 'Sandoval\'s scrapyard', theme: 'junkyard', look: 'thug' },
  { name: 'a trailer park', theme: 'night', look: 'biker' }, { name: 'the Route 9 truck stop', theme: 'motel', look: 'biker' },
  { name: 'a cartel stash house', theme: 'ranch', look: 'cartel' }, { name: 'a storage depot', theme: 'warehouse', look: 'guard' },
  { name: 'a chop shop', theme: 'compound', look: 'biker' }, { name: 'the dry riverbed', theme: 'day', look: 'thug' },
];
const BOUNTY_NAMES = ['"Two-Teeth" Toby', 'Big Lupe', 'The Accountant', 'Junior Skaggs', 'Mad Dog Morales', 'Crazy Earl', 'Little Hector', 'Smiley Ruiz'];
function makeJobs() {
  const st = Game.state, r = srand(st.day * 977 + st.chapter * 31 + 7), out = [];
  const names = BOUNTY_NAMES.slice().sort(() => r() - 0.5), places = JOB_PLACES.slice().sort(() => r() - 0.5);
  for (let i = 0; i < 3; i++) {
    const place = places[i], diff = 1 + Math.floor(r() * 3), bounty = r() < 0.5;
    const target = names[i];
    out.push({
      seed: Math.floor(r() * 1e9), place, diff, bounty, target, walter: r() < 0.5,
      title: bounty ? 'Bounty: ' + target : 'Turf war at ' + place.name,
      desc: bounty ? `${target} owes Dusty money and is hiding out at ${place.name}. Bring Dusty his... apology.` : `A crew is moving cheap cut product out of ${place.name}. Shut them down.`,
      reward: 600 + diff * 450 + st.chapter * 300, done: false,
    });
  }
  return out;
}
function makeJobLevel(job) {
  const r = srand(job.seed), ch = Game.state.chapter, width = 3800 + Math.floor(r() * 1400);
  const pool = ['thug', 'gunner', 'gunner', 'smg'].concat(ch >= 2 ? ['shotgunner', 'knifer'] : [], ch >= 3 ? ['rifleman', 'rifleman'] : [], ch >= 5 ? ['heavy'] : []);
  const pick = () => pool[Math.floor(r() * pool.length)];
  const night = ['night', 'motel', 'warehouse'].includes(job.place.theme);
  const steps = [{ cine: true, title: job.title.toUpperCase(), sub: 'SIDE JOB' }, { wait: 1.6 }, { cine: false, objective: job.bounty ? 'Find ' + job.target : 'Clear out the crew' }];
  const waves = 2 + job.diff;
  for (let w = 0; w < waves; w++) {
    const x = 500 + (w + 0.5) * (width - 900) / waves;
    steps.push({ reach: x - 500 });
    const n = 2 + job.diff + Math.floor(ch / 3) + (r() < 0.5 ? 1 : 0), spawn = [];
    for (let k = 0; k < n; k++) spawn.push(k === n - 1 && r() < 0.4 ? { t: pick(), from: 'left' } : { t: pick(), x: x + 100 + r() * 400 });
    steps.push({ spawn }, { clear: true }, { cp: true });
  }
  if (job.bounty) {
    const kind = ch >= 4 ? 'heavy' : 'dimitri';
    steps.push({ reach: width - 900 }, { spawn: [{ t: kind, id: 'target', x: width - 300, name: job.target, hp: 300 + ch * 60 + job.diff * 60, boss: true }, { t: pick(), x: width - 400 }, { t: pick(), from: 'left' }], boss: 'target', objective: 'Take down ' + job.target, banter: [null, job.target + ': "Dusty sent YOU?"'] });
    steps.push({ until: lv => !lv.named.target.alive }, { boss: null }, { clear: true });
  }
  steps.push({ objective: '', do: lv => { Game.state.money += job.reward; const jj = (Game.state.jobs || []).find(x => x.seed === job.seed); if (jj) jj.done = true; lv.toast('JOB DONE  +' + fmtMoney(job.reward)); } }, { wait: 1.8 }, { fade: 'out' }, { end: true });
  return {
    theme: job.place.theme, width, start: 180, walter: job.walter, music: 'action', enemyLook: job.place.look, dark: night ? 0.6 : undefined,
    build(L) {
      let x = 560;
      while (x < width - 260) {
        const k = r();
        if (k < 0.22) L.crate(x, 64, 56 + Math.floor(r() * 3) * 6, ['wood', 'metal', 'cardboard', 'sandbag'][Math.floor(r() * 4)]);
        else if (k < 0.36) { L.car(x, ['#7a2a2a', '#2a3a5a', '#4a4a3a', '#5a3a6a', '#c8c0a0'][Math.floor(r() * 5)], r() < 0.4 ? 'pickup' : 'sedan', r() < 0.5 ? 1 : -1); x += 200; }
        else if (k < 0.52) L.barrel(x, r() < 0.7 ? 'red' : 'propane');
        else if (k < 0.68) L.plat(x, GROUND - 125 - Math.floor(r() * 3) * 10, 200 + Math.floor(r() * 80));
        else if (k < 0.8) L.stack(x, r() < 0.5 ? 'wood' : 'metal');
        else if (!night) L.cactus(x, 80 + r() * 60);
        if (night && r() < 0.5) L.lamp(x + 60, 250);
        x += 230 + r() * 260;
      }
    },
    steps,
  };
}
class JobScene {
  constructor() { const st = Game.state; if (!st.jobs || st.jobsDay !== st.day) { st.jobs = makeJobs(); st.jobsDay = st.day; } this.jobs = st.jobs; }
  enter() { Audio.music('hub'); }
  update() { if (Input.hit('Escape')) Game.setScene(new HubScene()); }
  draw(c) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1a12'); g.addColorStop(1, '#0e0806'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // neon + bar back wall
    c.fillStyle = 'rgba(255,255,255,.03)'; for (let y = 0; y < H; y += 40) c.fillRect(0, y, W, 2);
    c.save(); c.shadowColor = '#ff7a3a'; c.shadowBlur = 20; UI.text(c, 'THE DOG HOUSE', 40, 70, 40, '#ffb070', 'left', true); c.restore();
    UI.text(c, 'Cold beer. Warm pool tables. Hot jobs. Ask for Dusty\'s cousin.', 40, 100, 16, '#c8b090');
    drawPortrait(c, 40, 130, 170, LOOKS.dusty, 'smile', '#3a2a1a');
    UI.panel(c, 40, 316, 300, 120, 0.8); c.font = `italic 16px ${FONT}`; c.fillStyle = '#e8dcc0'; wrapText(c, '"Jobs change every day. Pay\'s in cash. Don\'t die, it\'s bad for business."', 56, 346, 270, 22);
    UI.text(c, 'CASH  ' + fmtMoney(Game.state.money), 40, 476, 22, '#8fe07a', 'left', true);
    this.jobs.forEach((j, i) => {
      const x = 380, y = 40 + i * 205;
      UI.panel(c, x, y, 860, 190, j.done ? 0.5 : 0.9);
      UI.text(c, j.title, x + 24, y + 42, 24, j.done ? '#777' : '#fff', 'left', true);
      UI.text(c, '★'.repeat(j.diff) + '☆'.repeat(3 - j.diff), x + 836, y + 42, 22, '#ffd060', 'right');
      c.font = `16px ${FONT}`; c.fillStyle = j.done ? '#666' : '#ccc'; wrapText(c, j.desc, x + 24, y + 74, 560, 22);
      UI.text(c, (j.walter ? 'Walter comes along' : 'Solo job') + '  ·  Location: ' + j.place.name, x + 24, y + 150, 14, '#a89a80');
      UI.text(c, fmtMoney(j.reward), x + 836, y + 100, 30, j.done ? '#557' : '#8fe07a', 'right', true);
      if (j.done) UI.text(c, 'COMPLETED', x + 836, y + 150, 18, '#9fe88a', 'right', true);
      else if (UI.btn(c, x + 650, y + 124, 186, 46, 'TAKE THE JOB')) Game.setScene(new LevelScene(null, () => Game.setScene(new JobScene()), { def: makeJobLevel(j) }));
    });
    if (UI.btn(c, 40, H - 90, 200, 50, 'LEAVE')) Game.setScene(new HubScene());
    UI.text(c, 'New jobs every day (cook or sleep in the RV).', 40, H - 104, 13, '#888');
    UI.cursor(c);
  }
}
