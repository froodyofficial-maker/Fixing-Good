'use strict';
// ============================================================
//  FIXING GOOD - game state + main loop
// ============================================================
const Game = {
  scene: null, level: null, state: null, time: 0, cheatGod: false,
  newState() {
    return {
      chapter: 0, money: 400, bags: 0, purity: 0, precursor: 4, heat: 0, day: 1,
      ammo: { '9mm': 75, '357': 0, '12ga': 0, '762': 0 }, weapons: ['pistol'], mags: {}, lastGun: 'pistol',
      armor: 0, medkits: 1, bangs: 0, molotovs: 0, walterBangs: false, upgrades: {}, flags: {},
      stats: { kills: 0, heads: 0, shots: 0, earned: 0, cooks: 0, bagsSold: 0, bestPurity: 0 },
      difficulty: 'normal', unlocked: ['rv'], buyers: null, playTime: 0,
    };
  },
  diffMul() { return { easy: 0.5, normal: 0.85, hard: 1.3 }[this.state.difficulty] || 1; },
  hasSave() { return !!load('save'); },
  save() { if (this.state) { store('save', this.state); } },
  loadSave() { const s = load('save'); if (s) { this.state = Object.assign(this.newState(), s); this.state.upgrades = s.upgrades || {}; return true; } return false; },
  saveMags(lv) { const p = lv.player; if (!p) return; for (const g of p.guns) this.state.mags[g.key] = g.mag; if (p.gun) this.state.lastGun = p.gun.key; },
  setScene(s) { if (this.scene && this.scene.exit) this.scene.exit(); this.scene = s; if (s.enter) s.enter(); },
};

// dev hooks: ?level=junkyard · ?scene=hub|cook|dusty|trade|camp|ending · &god · &ch=3
const DEV = new URLSearchParams(location.search);
const SPEED = Math.max(1, Math.min(8, +(DEV.get('speed') || 1)));
function devStart() {
  const st = Game.state = Game.newState();
  st.chapter = +(DEV.get('ch') || 3); st.money = 20000; st.bags = 12; st.purity = 93.4;
  st.weapons = ['pistol', 'revolver', 'shotgun', 'smg', 'rifle']; st.ammo = { '9mm': 400, '357': 60, '12ga': 80, '762': 400 };
  st.bangs = 3; st.molotovs = 3; st.medkits = 3; st.armor = 150; st.walterBangs = true;
  if (DEV.has('god')) Game.cheatGod = true;
  const lv = DEV.get('level'), sc = DEV.get('scene');
  if (lv) return Game.setScene(new LevelScene(lv, () => Game.setScene(new HubScene())));
  const map = { hub: () => new HubScene(), cook: () => new CookScene({ done: () => Game.setScene(new HubScene()) }), dusty: () => new ShopScene('dusty'), hardware: () => new ShopScene('hardware'), morty: () => new ShopScene('morty'), trade: () => new TradeScene(), camp: () => new CampScene(), jobs: () => new JobScene(), ending: () => new EndingScene(), menu: () => new MenuScene() };
  if (sc && map[sc]) Game.setScene(map[sc]());
}
let last = performance.now();
function frame(now) {
  let dt = (now - last) / 1000; last = now;
  if (dt > 1 / 20) dt = 1 / 20;
  Game.time += dt; if (Game.state) Game.state.playTime += dt;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  try {
    if (Game.scene) { for (let i = 0; i < SPEED; i++) Game.scene.update(dt); Game.scene.draw(ctx); }
  } catch (e) { console.error(e); ctx.fillStyle = '#300'; ctx.fillRect(0, 0, W, 40); ctx.fillStyle = '#fff'; ctx.font = '14px monospace'; ctx.fillText('Error: ' + e.message, 10, 25); }
  Input.endFrame();
  requestAnimationFrame(frame);
}
Game.setScene(new LoadingScene());
requestAnimationFrame(frame);
