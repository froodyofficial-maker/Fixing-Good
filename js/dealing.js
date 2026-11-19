'use strict';
// ============================================================
//  FIXING GOOD - the street game: districts, buyers, negotiation,
//  cutting, reputation, fronts, corner dealers, daily simulation
//  (all fictional; product is "blue", chemistry is made up)
// ============================================================
const DISTRICTS = {
  streets: { name: 'Downtown Del Sombra', short: 'Downtown', mult: 1.0, demand: 5, cops: 0.10, robbers: 0.06, unlock: s => s.chapter >= 1, theme: 'town', blurb: 'Steady foot traffic. Cops on bikes. Nobody looks you in the eye.' },
  south: { name: 'Southside Projects', short: 'Southside', mult: 0.85, demand: 7, cops: 0.04, robbers: 0.14, unlock: s => s.flags.southside, theme: 'southside', blurb: 'Lots of customers, little money, and somebody always watching from a stairwell.' },
  campus: { name: 'University Row', short: 'Campus', mult: 1.35, demand: 4, cops: 0.18, robbers: 0.02, unlock: s => s.chapter >= 4, theme: 'town', blurb: 'Rich kids, finals week, campus police with something to prove.' },
  truck: { name: 'Route 9 Truck Stop', short: 'Truck Stop', mult: 1.1, demand: 3, cops: 0.06, robbers: 0.10, bulk: true, unlock: s => s.chapter >= 5, theme: 'motel', blurb: 'Long-haul drivers buy in bulk and pay in cash. Some of them carry tire irons.' },
  casino: { name: 'The Silver Spur Strip', short: 'Casino Strip', mult: 1.65, demand: 4, cops: 0.22, robbers: 0.05, unlock: s => s.chapter >= 9, theme: 'town', blurb: 'High rollers. Higher prices. Cameras on every corner.' },
};
const BUYER_TYPES = {
  regular: { label: 'Regular', patience: [3, 4], maxMul: [0.95, 1.15], open: [0.7, 0.85], want: [2, 5], tells: ['Counts his cash twice.', 'Checks the street, but calmly.', 'Has bought before. Knows the routine.'] },
  haggler: { label: 'Haggler', patience: [5, 6], maxMul: [0.85, 1.05], open: [0.55, 0.7], want: [3, 6], tells: ['Starts low on purpose. Smirks when you counter.', 'Talks about "the guy across the street" a lot.'] },
  fiend: { label: 'Desperate', patience: [2, 3], maxMul: [1.1, 1.35], open: [0.8, 0.95], want: [1, 2], tells: ['Hands shaking. Hasn\'t slept.', 'Wants it now. Would pay anything. Can\'t pay much.'] },
  rich: { label: 'Rich kid', patience: [2, 3], maxMul: [1.3, 1.7], open: [0.85, 1.0], want: [2, 4], tells: ['Designer sneakers. Phone worth more than your RV.', 'Calls you "bro" in a way that costs extra.'] },
  bulk: { label: 'Bulk buyer', patience: [4, 5], maxMul: [0.8, 0.95], open: [0.6, 0.75], want: [8, 18], tells: ['Brought a gym bag. An empty one.', 'Wants a volume discount. Means business.'] },
  cop: { label: 'UNDERCOVER COP', patience: [4, 6], maxMul: [1.2, 1.5], open: [0.9, 1.1], want: [3, 8], tells: ['Asks you to say what you\'re selling. Out loud.', 'Brand-new sneakers. Haircut too clean.', 'Keeps glancing at a van down the block.'] },
  robber: { label: 'ROBBER', patience: [3, 5], maxMul: [1.0, 1.3], open: [0.9, 1.05], want: [4, 10], tells: ['Keeps one hand in his jacket.', 'Wants to finish the deal "around the corner".', 'Agrees to every price too fast.'] },
};
const BUYER_NAMES = ['Skinny Pete', 'Badger', 'Wendy B.', 'Combo', 'Tweaker Ted', 'Dutchie', 'Spooge', 'Gomez Jr.', 'Lil Ricky', 'Marisol', 'Tuck', 'Ramona', 'Chalky', 'Professor Dan', 'Big Mo', 'Juicy', 'Hector Jr.', 'Kat', 'Pinto', 'Shy Ronnie', 'Tavo', 'Becca', 'Deuce', 'Mickey Two-Times'];
const OPENERS = {
  regular: ['Usual amount. Usual price, right?', 'Heard you got the blue. Let\'s do this quick.', 'My guy said you\'re reliable.'],
  haggler: ['I\'ll give you {o} a bag. That\'s generous, trust me.', '{o}. Take it or leave it. I can wait.', 'Market price is {o}. Everybody knows that.'],
  fiend: ['Please, man. Please. I got {o} a bag. I\'ll get more tomorrow.', 'Just one. Or two. I\'m good for it, I swear.', 'You gotta help me out, man. It\'s been days.'],
  rich: ['Bro. Is it the blue? Name a price, I\'m in a hurry.', 'My dad\'s card doesn\'t work here, so... cash. Lots.', 'I\'ve got a party in an hour. Make it worth it.'],
  bulk: ['I move weight. You give me a price for a dozen.', 'Truckers on three routes want this. I want a lot.', 'Bulk deal. Volume price. Let\'s talk.'],
  cop: ['So how much of the... product... do you have available, sir?', 'Before we start, could you describe what you\'re selling? For clarity.', 'I\'m definitely not a police officer. How much for the methamphetamine?'],
  robber: ['Sure, whatever you want. Let\'s just step into the alley.', '{o}? Deal. Deal deal deal. Come on.', 'I got cash. Lots of it. Follow me.'],
};
const REACT = {
  accept: ['Deal.', 'Fine. Pleasure doing business.', 'Yeah, okay. Okay.', 'You drive a hard bargain.'],
  counter: ['Nah. {o}, best I can do.', 'Come on, man. {o}.', 'Too rich. How about {o}?', 'I can go {o}. Not a dollar more.'],
  insulted: ['Are you kidding me?', 'Get outta here with that price.', 'That\'s robbery, man.'],
  leave: ['Forget it. I\'ll find someone else.', 'You\'re wasting my time.', 'Nah. I\'m out.'],
  quality: ['Ninety-plus? ...Okay, I believe it. It\'s worth more.', 'That colour, man. Yeah. That\'s the real thing.'],
  qualityBad: ['That\'s not blue, that\'s grey. Don\'t lie to me.', 'Quality? This looks like chalk.'],
  pressure: ['Okay, okay! Relax. I\'ll pay more.', 'Alright, man, no need for that.'],
  pressureBad: ['Did you just threaten me? We\'re done.', 'Wow. Okay. My lawyer\'s gonna hear about this.'],
  sweet: ['A free one? Now we\'re talking.', 'Ha! Okay, you\'re alright.'],
  bluffWin: ['Wait, wait! Okay. {o}. Come back.', 'Hold on! Fine, {o}.'],
};

// ---------- state ----------
function dealState() {
  const st = Game.state;
  if (st.rep === undefined) st.rep = 20;
  if (!st.districts) st.districts = {};
  for (const k in DISTRICTS) if (!st.districts[k]) st.districts[k] = { sat: 0, buyers: null, day: 0 };
  if (!st.dealers) st.dealers = [];
  if (!st.fronts) st.fronts = [];
  if (!st.news) st.news = [];
  if (!st.extraJobs) st.extraJobs = [];
  if (st.stats.deals === undefined) st.stats.deals = 0;
  return st;
}
function marketPrice(dk) {
  const st = dealState(), D = DISTRICTS[dk], ds = st.districts[dk];
  const pur = Math.max(st.purity || 0, 30);
  const repF = 0.85 + st.rep / 100 * 0.35;
  return Math.max(10, (25 + pur * 1.8) * D.mult * (1 + st.chapter * 0.06) * repF * (1 - ds.sat * 0.45));
}
function makeDistrictBuyers(dk) {
  const st = dealState(), D = DISTRICTS[dk], n = Math.max(2, Math.round(D.demand * (0.6 + st.rep / 125) * (1 - st.districts[dk].sat * 0.5)));
  const out = [], used = new Set(), base = marketPrice(dk);
  for (let i = 0; i < n; i++) {
    const r = Math.random(); let type;
    const copP = D.cops * (1 + st.heat / 60), robP = D.robbers * (1 - st.rep / 200);
    if (r < copP) type = 'cop'; else if (r < copP + robP) type = 'robber';
    else type = D.bulk && Math.random() < 0.5 ? 'bulk' : choose(dk === 'campus' || dk === 'casino' ? ['rich', 'rich', 'regular', 'haggler'] : dk === 'south' ? ['fiend', 'fiend', 'regular', 'haggler'] : ['regular', 'regular', 'haggler', 'fiend', 'rich']);
    const T = BUYER_TYPES[type];
    let name; do { name = choose(BUYER_NAMES); } while (used.has(name) && used.size < BUYER_NAMES.length); used.add(name);
    const max = Math.round(base * rand(...T.maxMul)), offer = Math.round(max * rand(...T.open) * (type === 'robber' ? 1 : 0.9));
    const look = Object.assign(lookOf(type === 'cop' ? 'guard' : type === 'rich' ? 'thug' : choose(['thug', 'biker', 'thug'])), { name });
    if (type === 'cop') { look.hat = null; look.badge = false; look.shirt = '#e8e8e0'; look.shoes = '#fafafa'; }
    if (type === 'rich') { look.shirt = choose(['#e0607a', '#60a0e0', '#f0f0f0']); look.glasses = 'shades'; look.chain = true; }
    const want = randi(...T.want);
    out.push({ type, name, look, max, offer, want, patience: randi(...T.patience), maxPat: 0, read: false, done: false, opener: choose(OPENERS[type]).replace('{o}', fmtMoney(offer)), mood: 0 });
    out[out.length - 1].maxPat = out[out.length - 1].patience;
  }
  return out;
}
function districtBuyers(dk) { const st = dealState(), ds = st.districts[dk]; if (!ds.buyers || ds.day !== st.day) { ds.buyers = makeDistrictBuyers(dk); ds.day = st.day; } return ds.buyers; }

// ---------- the day ticks over (cook / sleep) ----------
function advanceDay(reason) {
  const st = dealState(); st.day++; st.buyers = null;
  st.heat = Math.max(0, st.heat - (reason === 'sleep' ? 8 : 3));
  const news = [];
  for (const k in st.districts) { const ds = st.districts[k]; ds.sat = Math.max(0, ds.sat * 0.6 - 0.05); ds.buyers = null; }
  // corner dealers work the day
  for (const d of st.dealers) {
    if (d.status !== 'active' || d.bags <= 0) { if (d.status === 'active' && d.bags <= 0) news.push(`${d.name} is out of product on ${DISTRICTS[d.district].short}.`); continue; }
    const D = DISTRICTS[d.district], ds = st.districts[d.district];
    const r = Math.random();
    if (r < D.cops * 0.6 * (1 + st.heat / 50) * (1.2 - d.skill * 0.5)) { news.push(`${d.name} got picked up by the cops on ${D.short}. ${d.bags} bags gone. Heat +6.`); d.bags = 0; d.status = 'arrested'; d.back = st.day + 3; st.heat = Math.min(100, st.heat + 6); continue; }
    if (r < D.cops * 0.6 + D.robbers * 0.7 * (st.districts[d.district].rival ? 2 : 1)) { const lost = Math.ceil(d.bags * 0.6); d.bags -= lost; news.push(`${d.name} got jumped on ${D.short} and lost ${lost} bags. Somebody needs to answer for that.`); st.extraJobs.push({ kind: 'turf', district: d.district, dealer: d.name, seed: randi(1, 1e9) }); continue; }
    const sold = Math.min(d.bags, Math.round(D.demand * (0.6 + d.skill) * (1 - ds.sat * 0.5)));
    const price = marketPrice(d.district) * 0.8, gross = Math.round(sold * price);
    const skim = d.loyalty < 40 && Math.random() < 0.4 ? Math.round(gross * rand(0.15, 0.35)) : 0;
    const yours = Math.round(gross * 0.7) - skim;
    d.bags -= sold; st.money += yours; st.stats.earned += yours; ds.sat = Math.min(1, ds.sat + sold * 0.02);
    st.heat = Math.min(100, st.heat + sold * 0.3);
    news.push(`${d.name} sold ${sold} bags on ${D.short}: ${fmtMoney(yours)} for you${skim ? ` (the count is ${fmtMoney(skim)} short...)` : '.'}`);
    if (skim && Math.random() < 0.5) news.push(`Word is ${d.name} is skimming. Loyalty is slipping.`);
  }
  for (const d of st.dealers) if (d.status === 'arrested' && st.day >= d.back) { d.status = 'active'; news.push(`${d.name} made bail and is back on ${DISTRICTS[d.district].short}. They didn\'t talk. This time.`); }
  // fronts come due
  for (const f of st.fronts) {
    if (f.settled || st.day < f.due) continue;
    f.settled = true;
    if (Math.random() < f.reliability + st.rep / 300) { st.money += f.owed; news.push(`${f.name} paid back the ${fmtMoney(f.owed)} they owed you. With interest.`); st.rep = Math.min(100, st.rep + 2); }
    else { news.push(`${f.name} didn\'t pay the ${fmtMoney(f.owed)} they owe. Dusty\'s cousin can arrange a visit.`); st.extraJobs.push({ kind: 'collect', name: f.name, owed: f.owed, district: f.district, seed: randi(1, 1e9) }); st.rep = Math.max(0, st.rep - 3); }
  }
  st.fronts = st.fronts.filter(f => !f.settled);
  if (st.rep > 20) st.rep = Math.max(20, st.rep - 0.5);
  st.news = news;
  return news;
}

// ---------- district screen ----------
class DistrictScene {
  constructor(dk) { this.dk = dk; this.t = 0; this.log = null; this.panel = null; dealState(); this.buyers = districtBuyers(dk); }
  enter() { Audio.music('hub'); }
  update(dt) { this.t += dt; if (Input.hit('Escape')) { if (this.panel) this.panel = null; else Game.setScene(new HubScene()); } }
  dealerHere() { return Game.state.dealers.find(d => d.district === this.dk && d.status !== 'dead'); }
  draw(c) {
    const st = Game.state, D = DISTRICTS[this.dk], ds = st.districts[this.dk], th = THEMES[D.theme] || THEMES.town;
    drawBackdrop(c, th, 800 + this.dk.length * 300); drawGround(c, th, 800);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, H);
    drawFigure(c, poseStatic(120, GROUND, 1), LOOKS.jace, 1, {});
    // header
    UI.panel(c, 20, 16, W - 40, 92, 0.88);
    UI.text(c, D.name.toUpperCase(), 40, 50, 26, '#fff', 'left', true);
    UI.text(c, D.blurb, 40, 76, 14, '#bbb');
    UI.text(c, `Day ${st.day} · ${st.bags} bags${st.bags ? ' at ' + st.purity.toFixed(1) + '%' : ''} · street price ~${fmtMoney(marketPrice(this.dk))}/bag`, 40, 98, 14, '#9fd8f0');
    const stat = (x, k, v, col) => { UI.text(c, k, x, 44, 11, '#999'); UI.text(c, v, x, 68, 18, col, 'left', true); };
    stat(W - 520, 'REPUTATION', Math.round(st.rep) + '/100', st.rep > 60 ? '#9fe88a' : '#ddd'); stat(W - 410, 'HEAT', Math.round(st.heat) + '%', st.heat > 50 ? '#ff6040' : '#ddd');
    stat(W - 320, 'MARKET', ds.sat > 0.6 ? 'FLOODED' : ds.sat > 0.3 ? 'SLOW' : 'HUNGRY', ds.sat > 0.6 ? '#ff9070' : ds.sat > 0.3 ? '#f0c060' : '#9fe88a'); stat(W - 200, 'CASH', fmtMoney(st.money), '#8fe07a');
    // buyers
    const list = this.buyers, cw = 232;
    list.forEach((b, i) => {
      const x = 240 + (i % 4) * (cw + 12), y = 124 + Math.floor(i / 4) * 228;
      UI.panel(c, x, y, cw, 216, b.done ? 0.45 : 0.9);
      drawPortrait(c, x + 12, y + 12, 64, b.look, b.done ? 'neutral' : b.type === 'fiend' ? 'worried' : 'neutral');
      UI.text(c, b.name, x + 86, y + 34, 18, b.done ? '#777' : '#fff', 'left', true);
      const rt = b.readAs || b.type; UI.text(c, b.read ? BUYER_TYPES[rt].label : '???', x + 86, y + 54, 13, b.read ? (rt === 'cop' || rt === 'robber' ? '#ff6050' : '#f0c060') : '#888', 'left', true);
      if (b.done) { UI.text(c, b.result || 'Gone', x + 86, y + 74, 13, '#999'); return; }
      UI.text(c, 'Wants ~' + b.want + ' bags', x + 86, y + 72, 13, '#bbb');
      c.font = `italic 14px ${FONT}`; c.fillStyle = '#e8dcc0'; wrapText(c, '"' + b.opener + '"', x + 14, y + 104, cw - 28, 18);
      if (UI.btn(c, x + 14, y + 166, cw - 28, 38, 'APPROACH', { size: 15, disabled: st.bags <= 0 })) Game.setScene(new NegotiationScene(this.dk, b, this));
    });
    if (!list.some(b => !b.done)) UI.text(c, 'Nobody else is buying here today. Try another district, or come back tomorrow.', 240 + 2 * (cw + 12) - 6, 400, 16, '#ddd', 'center');
    // side panel: crew + actions
    UI.panel(c, 20, 124, 204, 440, 0.88);
    UI.text(c, 'YOUR CORNER', 36, 152, 15, '#ffd060', 'left', true);
    const dl = this.dealerHere();
    if (dl) {
      drawPortrait(c, 36, 166, 56, dl.look);
      UI.text(c, dl.name, 100, 186, 16, '#fff', 'left', true); UI.text(c, dl.status === 'active' ? dl.bags + ' bags on hand' : dl.status === 'arrested' ? 'In custody' : '—', 100, 206, 13, dl.status === 'active' ? '#bbb' : '#ff8060');
      UI.text(c, 'Loyalty ' + Math.round(dl.loyalty) + ' · Skill ' + Math.round(dl.skill * 100), 36, 244, 12, '#aaa');
      const give = Math.min(5, st.bags);
      if (UI.btn(c, 36, 256, 172, 34, give > 0 ? `GIVE ${give} BAGS` : 'NO PRODUCT', { size: 13, disabled: give <= 0 || dl.status !== 'active' })) { dl.bags += give; dl.purity = st.purity; st.bags -= give; if (st.bags <= 0) st.purity = 0; Audio.play('pickup'); Game.save(); }
      if (UI.btn(c, 36, 296, 172, 34, `BONUS $200 (+LOYALTY)`, { size: 12, disabled: st.money < 200 })) { st.money -= 200; dl.loyalty = Math.min(100, dl.loyalty + 15); Audio.play('cash'); Game.save(); }
    } else {
      const cost = 500 + st.chapter * 100, ok = DISTRICTS[this.dk] && (this.dk !== 'south' || st.flags.southside);
      c.font = `13px ${FONT}`; c.fillStyle = '#bbb'; wrapText(c, 'Hire a corner dealer. They sell for you every day while you\'re cooking. You get 70%.', 36, 176, 172, 18);
      if (UI.btn(c, 36, 250, 172, 40, 'HIRE ' + fmtMoney(cost), { size: 14, disabled: st.money < cost || !ok })) { st.money -= cost; st.dealers.push(makeDealer(this.dk)); Audio.play('cash'); Game.save(); }
    }
    UI.text(c, 'PRODUCT', 36, 362, 15, '#ffd060', 'left', true);
    c.font = `12px ${FONT}`; c.fillStyle = '#bbb'; wrapText(c, 'Cut 4 bags into 6 with filler. More bags, lower purity. Buyers notice.', 36, 384, 172, 16);
    if (UI.btn(c, 36, 430, 172, 36, 'CUT PRODUCT', { size: 14, disabled: st.bags < 4 || st.purity < 35 })) { st.bags += 2; st.purity = Math.max(20, st.purity * 4 / 6); st.flags.cut = (st.flags.cut || 0) + 1; Audio.play('clank'); Game.save(); this.log = { col: '#f0c060', text: 'You cut 4 bags into 6. Purity is now ' + st.purity.toFixed(1) + '%.' }; }
    UI.text(c, `Fronts out: ${st.fronts.length} · Dealers: ${st.dealers.filter(d => d.status === 'active').length}`, 36, 496, 12, '#999');
    if (this.log) { UI.panel(c, 240, H - 80, W - 260, 50, 0.9); UI.text(c, this.log.text, 258, H - 48, 16, this.log.col); }
    if (UI.btn(c, 20, H - 80, 204, 50, 'LEAVE')) Game.setScene(new HubScene());
    UI.cursor(c);
  }
}
const DEALER_NAMES = ['Nico', 'Bodie T.', 'Lil Sal', 'Mouse', 'Chuy', 'Darnell', 'Pepper', 'Wes', 'Tino', 'Kai'];
function makeDealer(dk) {
  const st = Game.state, used = new Set(st.dealers.map(d => d.name));
  const name = DEALER_NAMES.find(n => !used.has(n) && n !== 'Nico') || 'Dealer #' + (st.dealers.length + 1);
  return { name, district: dk, bags: 0, purity: 0, loyalty: randi(45, 75), skill: rand(0.3, 0.8), status: 'active', look: Object.assign(lookOf('thug'), { name }) };
}

// ---------- one-on-one negotiation ----------
class NegotiationScene {
  constructor(dk, b, back) {
    this.dk = dk; this.b = b; this.back = back; this.t = 0;
    const st = Game.state; this.qty = Math.max(1, Math.min(b.want, st.bags)); this.ask = Math.round(Math.max(b.offer * 1.25, marketPrice(dk)) / 5) * 5;
    this.lines = [[b.name, b.opener]]; this.over = false; this.result = null; this.used = {}; this.pitched = 0;
  }
  enter() { Audio.music('tense'); }
  say(who, text) { this.lines.push([who, text]); if (this.lines.length > 6) this.lines.shift(); }
  react(k, o) { return choose(REACT[k]).replace('{o}', fmtMoney(o)); }
  tick(cost) { const b = this.b; b.patience -= cost; if (b.patience <= 0) { this.say(b.name, this.react('leave')); this.end('walked', 'Walked off'); return true; } return false; }
  end(kind, result) { this.over = true; this.b.done = true; this.b.result = result; this.result = kind; }
  offerFor() { return this.b.offer; }
  // the moment of truth
  close(price) {
    const st = Game.state, b = this.b, n = Math.min(this.qty, st.bags), total = price * n;
    if (b.type === 'cop') {
      Audio.play('bad'); this.say(b.name, 'DEA! Hands where I can see them!');
      st.bags -= n; st.heat = Math.min(100, st.heat + 30); st.rep = Math.max(0, st.rep - 5);
      if (st.bags <= 0) st.purity = 0;
      this.end('busted', 'Undercover cop'); this.outcome = { title: 'BUSTED', col: '#ff5040', text: `${b.name} flashes a badge. You throw the bags in a storm drain and run. ${n} bags gone. Heat +30. Morty is going to love this.` };
      Game.save(); return;
    }
    if (b.type === 'robber') {
      Audio.play('bad'); this.say(b.name, 'Change of plans. Give me everything. Slowly.');
      this.end('robbed', 'Robber'); this.robbery = { n: Math.min(st.bags, n + randi(2, 6)) }; return;
    }
    st.bags -= n; st.money += total; st.stats.earned += total; st.stats.bagsSold += n; st.stats.deals++;
    if (st.bags <= 0) st.purity = 0;
    const ds = st.districts[this.dk]; ds.sat = Math.min(1, ds.sat + n * 0.025);
    st.heat = Math.min(100, st.heat + n * (st.upgrades.foil ? 0.5 : 1.0));
    let repD = 1 + (st.purity >= 90 ? 1 : 0) - (st.purity < 60 ? 3 : 0) - (price > b.max * 1.05 ? 1 : 0);
    st.rep = clamp(st.rep + repD, 0, 100);
    Audio.play('cash'); this.say(b.name, this.react('accept'));
    this.end('sold', `Bought ${n} for ${fmtMoney(total)}`);
    this.outcome = { title: 'DEAL', col: '#9fe88a', text: `Sold ${n} bags at ${fmtMoney(price)} for ${fmtMoney(total)}. ${price >= b.max * 0.97 ? 'You got every dollar out of them.' : price < b.max * 0.8 ? 'You left money on the table.' : 'Fair deal.'} Rep ${repD >= 0 ? '+' : ''}${repD}.` };
    Game.save();
  }
  doAsk() {
    const b = this.b;
    if (this.ask <= b.offer) return this.close(this.ask);
    if (this.ask <= b.max) { if (Math.random() < 0.75 || b.type === 'rich') return this.close(this.ask); }
    const over = (this.ask - b.max) / b.max;
    if (over > 0.45) { this.say(b.name, this.react('insulted')); if (this.tick(2)) return; }
    else { b.offer = Math.min(b.max, Math.round((b.offer + (Math.min(this.ask, b.max) - b.offer) * rand(0.35, 0.65)) / 5) * 5); this.say(b.name, this.react('counter', b.offer)); if (this.tick(1)) return; }
  }
  doQuality() {
    const st = Game.state, b = this.b; this.used.quality = true; this.say('jace', 'Look at it. ' + st.purity.toFixed(1) + ' percent. You won\'t find better in this state.');
    if (st.purity >= 85) { b.max = Math.round(b.max * 1.1); b.offer = Math.round((b.offer * 1.08) / 5) * 5; this.say(b.name, this.react('quality')); }
    else if (st.purity < 65) { this.say(b.name, this.react('qualityBad')); this.tick(1); b.max = Math.round(b.max * 0.9); }
    else { this.say(b.name, 'Eh. It\'s alright.'); }
  }
  doPressure() {
    const b = this.b; this.used.pressure = true; this.say('jace', 'You want to think real hard about lowballing me.');
    if (b.type === 'robber') { this.say(b.name, 'Heh. Tough guy. Let\'s skip ahead then.'); return this.close(b.offer); }
    if (b.type === 'fiend' || b.type === 'haggler' && Math.random() < 0.5 || Game.state.rep > 60 && Math.random() < 0.6) { b.offer = Math.min(b.max, Math.round(b.offer * 1.12 / 5) * 5); this.say(b.name, this.react('pressure')); Game.state.rep = Math.min(100, Game.state.rep + 0.5); }
    else { this.say(b.name, this.react('pressureBad')); this.tick(2); }
  }
  doSweeten() {
    const st = Game.state, b = this.b; if (st.bags <= this.qty) return; this.used.sweet = true;
    st.bags--; b.max = Math.round(b.max * 1.1); b.patience = Math.min(b.maxPat + 1, b.patience + 1); b.offer = Math.round(b.offer * 1.05 / 5) * 5;
    this.say('jace', 'Here. One on the house. For the trouble.'); this.say(b.name, this.react('sweet')); st.rep = Math.min(100, st.rep + 1);
  }
  doRead() {
    const st = Game.state, b = this.b; this.used.read = true; b.read = true;
    const skill = 0.55 + st.rep / 250 + Math.min(0.2, st.stats.deals / 100);
    let tellType = b.type;
    if ((b.type === 'cop' || b.type === 'robber') && Math.random() > skill) tellType = 'regular'; // you misread them
    if (tellType !== b.type) b.misread = true;
    this.say('narrator', '(You size them up.) ' + choose(BUYER_TYPES[tellType].tells));
    this.readAs = tellType; b.readAs = tellType; this.tick(0.5);
  }
  doFront() {
    const st = Game.state, b = this.b, n = Math.min(this.qty, st.bags); this.used.front = true;
    if (b.type === 'cop') return this.close(this.ask);
    if (b.type === 'robber' || b.type === 'bulk' || b.type === 'rich') { this.say(b.name, 'Credit? Nah, I pay cash.'); return; }
    const owed = Math.round(this.ask * n * 1.3);
    st.bags -= n; if (st.bags <= 0) st.purity = 0;
    st.fronts.push({ name: b.name, owed, due: st.day + 3, reliability: b.type === 'fiend' ? 0.35 : 0.7, district: this.dk });
    this.say('jace', `Take it. You owe me ${fmtMoney(owed)} in three days.`); this.say(b.name, b.type === 'fiend' ? 'Thank you. Thank you. I\'ll pay, I swear on my mother.' : 'Three days. You got it.');
    this.end('front', `Fronted ${n} (owes ${fmtMoney(owed)})`); this.outcome = { title: 'FRONTED', col: '#f0c060', text: `${b.name} walks off with ${n} bags and owes you ${fmtMoney(owed)} in 3 days. If they don't pay, it becomes a collection job at the Dog House.` }; Game.save();
  }
  doWalk() {
    const b = this.b; this.say('jace', 'You know what? Forget it.');
    if (b.max > b.offer * 1.1 && Math.random() < 0.55 + Game.state.rep / 300) { b.offer = Math.round(((b.offer + b.max) / 2) / 5) * 5; this.say(b.name, this.react('bluffWin', b.offer)); this.tick(1); }
    else { this.say(b.name, 'Fine by me.'); this.end('walked', 'You walked away'); }
  }
  update(dt) {
    this.t += dt;
    if (this.robbery) return;
    if (this.over) { if (Input.hit('Escape') || Input.hit('Space')) Game.setScene(this.back); return; }
    if (Input.hit('Escape')) { this.b.done = false; Game.setScene(this.back); }
  }
  draw(c) {
    const st = Game.state, b = this.b, D = DISTRICTS[this.dk], th = THEMES[D.theme] || THEMES.town;
    drawBackdrop(c, th, 1500); drawGround(c, th, 1500);
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, W, H);
    drawFigure(c, poseStatic(420, GROUND, 1), LOOKS.jace, 1, {}); drawFigure(c, poseStatic(520, GROUND, -1), b.look, -1, {});
    // buyer card
    UI.panel(c, 30, 24, 300, 300, 0.92);
    drawPortrait(c, 50, 44, 120, b.look, this.over && this.result === 'sold' ? 'smile' : b.patience <= 1 ? 'angry' : 'neutral');
    UI.text(c, b.name, 184, 70, 22, '#fff', 'left', true);
    UI.text(c, b.read ? 'Reads as: ' + BUYER_TYPES[this.readAs || b.type].label : 'Type: ???', 184, 96, 14, b.read ? ((this.readAs || b.type) === 'cop' || (this.readAs || b.type) === 'robber' ? '#ff6050' : '#f0c060') : '#888', 'left', true);
    UI.text(c, 'Wants ~' + b.want + ' bags', 184, 120, 14, '#bbb');
    UI.text(c, 'PATIENCE', 50, 190, 12, '#999');
    for (let i = 0; i < b.maxPat + 1; i++) { c.fillStyle = i < b.patience ? (b.patience <= 1 ? '#e05040' : '#e8c060') : 'rgba(255,255,255,.12)'; rrect(c, 50 + i * 30, 198, 24, 12, 3); c.fill(); }
    UI.text(c, 'THEIR OFFER', 50, 240, 12, '#999'); UI.text(c, fmtMoney(b.offer) + ' / bag', 50, 270, 28, '#8fe07a', 'left', true);
    UI.text(c, 'Street price here ~' + fmtMoney(marketPrice(this.dk)), 50, 300, 13, '#9fd8f0');
    // conversation
    UI.panel(c, 350, 24, W - 380, 300, 0.92);
    UI.text(c, 'THE DEAL — ' + D.short.toUpperCase(), 370, 54, 16, '#ffd060', 'left', true);
    let y = 86;
    for (const [who, text] of this.lines) {
      const me = who === 'jace', nar = who === 'narrator';
      c.font = `bold 13px ${FONT}`; c.fillStyle = me ? '#ffb070' : nar ? '#9fd8f0' : '#ffd060'; c.fillText(me ? 'JACE' : nar ? '' : who.toUpperCase(), 370, y);
      c.font = `${nar ? 'italic ' : ''}16px ${FONT}`; c.fillStyle = '#eee'; y = wrapText(c, text, 470, y, W - 520, 20) + 30;
    }
    if (this.robbery) return this.drawRobbery(c);
    if (this.over) {
      const o = this.outcome || { title: 'NO DEAL', col: '#ff9070', text: b.name + ' is gone.' };
      UI.panel(c, 350, 340, W - 380, 160, 0.95); UI.text(c, o.title, 370, 380, 30, o.col, 'left', true);
      c.font = `17px ${FONT}`; c.fillStyle = '#eee'; wrapText(c, o.text, 370, 414, W - 420, 24);
      if (UI.btn(c, W - 260, 520, 230, 50, 'BACK TO THE CORNER')) Game.setScene(this.back);
      UI.cursor(c); return;
    }
    // controls
    UI.panel(c, 30, 340, 300, 230, 0.92);
    UI.text(c, 'QUANTITY', 50, 370, 12, '#999');
    if (UI.btn(c, 50, 380, 40, 36, '−', { size: 20 })) this.qty = Math.max(1, this.qty - 1);
    UI.text(c, this.qty + ' bags', 140, 405, 22, '#fff', 'center', true);
    if (UI.btn(c, 190, 380, 40, 36, '+', { size: 20 })) this.qty = Math.min(st.bags, this.qty + 1);
    UI.text(c, 'of ' + st.bags + ' (' + st.purity.toFixed(0) + '%)', 240, 404, 12, '#999');
    UI.text(c, 'YOUR PRICE PER BAG', 50, 444, 12, '#999');
    const step = (x, d, l) => { if (UI.btn(c, x, 452, 44, 32, l, { size: 13 })) this.ask = Math.max(5, this.ask + d); };
    step(50, -20, '−20'); step(98, -5, '−5'); step(198, 5, '+5'); step(246, 20, '+20');
    UI.text(c, fmtMoney(this.ask), 172, 476, 20, '#8fe07a', 'center', true);
    UI.text(c, 'Total: ' + fmtMoney(this.ask * this.qty), 50, 512, 15, '#ddd');
    if (UI.btn(c, 50, 522, 270, 40, 'ASK ' + fmtMoney(this.ask) + ' A BAG', { size: 15, hot: '#3d7a3a' })) this.doAsk();
    // tactics
    UI.panel(c, 350, 340, W - 380, 230, 0.92);
    UI.text(c, 'TACTICS', 370, 370, 14, '#ffd060', 'left', true);
    const tac = [
      ['ACCEPT ' + fmtMoney(b.offer), 'Take their offer and close.', () => this.close(b.offer), false],
      ['READ THEM', 'Look for tells. Cop? Robber? Loaded?', () => this.doRead(), this.used.read],
      ['TALK QUALITY', 'Works if your purity is high.', () => this.doQuality(), this.used.quality],
      ['APPLY PRESSURE', 'Desperate people cave. Others walk.', () => this.doPressure(), this.used.pressure],
      ['SWEETENER (+1 FREE)', 'A free bag buys patience and goodwill.', () => this.doSweeten(), this.used.sweet || st.bags <= this.qty],
      ['FRONT IT (CREDIT)', 'They pay 130% in 3 days. Maybe.', () => this.doFront(), this.used.front],
      ['WALK AWAY (BLUFF)', 'They might call you back higher.', () => this.doWalk(), false],
    ];
    tac.forEach(([l, sub, fn, dis], i) => { const x = 370 + (i % 4) * 214, yy = 384 + Math.floor(i / 4) * 86; if (UI.btn(c, x, yy, 204, 74, l, { size: 15, sub, disabled: dis })) fn(); });
    UI.cursor(c);
  }
  drawRobbery(c) {
    const st = Game.state, r = this.robbery;
    UI.panel(c, 350, 340, W - 380, 230, 0.95);
    UI.text(c, 'IT\'S A ROBBERY', 370, 380, 30, '#ff5040', 'left', true);
    c.font = `17px ${FONT}`; c.fillStyle = '#eee'; wrapText(c, `${this.b.name} pulls a knife. Two of his friends step out of the alley behind you. He wants everything you're carrying (${r.n} bags).`, 370, 414, W - 420, 24);
    if (UI.btn(c, 370, 480, 260, 60, 'FIGHT', { sub: 'Street fight. Win and keep it all (+rep).', hot: '#8a2a1a' })) {
      const snapBags = st.bags; Game.setScene(new LevelScene('alley', () => { st.rep = Math.min(100, st.rep + 6); Game.setScene(new HubScene({ title: 'ROBBERY FOILED', message: `You left ${this.b.name}'s crew in the alley. Word gets around: nobody robs Jace. Rep +6.` })); }));
      return;
    }
    if (UI.btn(c, 650, 480, 260, 60, 'HAND IT OVER', { sub: 'Lose ' + r.n + ' bags. Live to deal again.' })) { st.bags -= r.n; if (st.bags <= 0) { st.bags = 0; st.purity = 0; } st.rep = Math.max(0, st.rep - 6); this.robbery = null; this.outcome = { title: 'ROBBED', col: '#ff9070', text: `You hand over ${r.n} bags. They laugh the whole way down the block. Rep -6.` }; Game.save(); }
    UI.cursor(c);
  }
}

// ---------- crew overview (from the RV camp) ----------
class CrewScene {
  constructor() { dealState(); }
  enter() { Audio.music('hub'); }
  update() { if (Input.hit('Escape')) Game.setScene(new CampScene()); }
  draw(c) {
    const st = Game.state;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a1410'); g.addColorStop(1, '#0a0806'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    UI.text(c, 'THE OPERATION', 40, 64, 34, '#ffd060', 'left', true);
    UI.text(c, `Day ${st.day} · Rep ${Math.round(st.rep)}/100 · Heat ${Math.round(st.heat)}% · ${fmtMoney(st.money)}`, 40, 94, 16, '#bbb');
    UI.text(c, 'CORNER DEALERS', 40, 140, 16, '#fff', 'left', true);
    if (!st.dealers.length) UI.text(c, 'Nobody works for you yet. Hire dealers in a district.', 40, 170, 15, '#999');
    st.dealers.forEach((d, i) => {
      const y = 156 + i * 72; UI.panel(c, 40, y, 600, 64, 0.85); drawPortrait(c, 48, y + 6, 52, d.look || LOOKS.jace);
      UI.text(c, d.name + (d.status === 'dead' ? '  †' : ''), 112, y + 26, 17, d.status === 'dead' ? '#a06060' : '#fff', 'left', true);
      UI.text(c, `${DISTRICTS[d.district].short} · ${d.status === 'active' ? d.bags + ' bags' : d.status === 'arrested' ? 'in custody' : 'dead'} · loyalty ${Math.round(d.loyalty)} · skill ${Math.round(d.skill * 100)}`, 112, y + 48, 13, '#bbb');
    });
    UI.text(c, 'MONEY ON THE STREET (FRONTS)', 680, 140, 16, '#fff', 'left', true);
    if (!st.fronts.length) UI.text(c, 'Nobody owes you anything.', 680, 170, 15, '#999');
    st.fronts.forEach((f, i) => UI.text(c, `${f.name} owes ${fmtMoney(f.owed)} · due day ${f.due} · ${DISTRICTS[f.district].short}`, 680, 172 + i * 26, 15, '#e8c060'));
    UI.text(c, 'LAST NIGHT', 680, 380, 16, '#fff', 'left', true);
    (st.news.length ? st.news : ['Quiet night.']).slice(0, 8).forEach((n, i) => { c.font = `14px ${FONT}`; c.fillStyle = '#ccc'; wrapText(c, '• ' + n, 680, 408 + i * 36, 560, 17); });
    if (UI.btn(c, 40, H - 90, 200, 50, 'BACK')) Game.setScene(new CampScene());
    UI.cursor(c);
  }
}
