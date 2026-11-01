'use strict';
// ============================================================
//  FIXING GOOD - art: characters, portraits, guns, RV, props, scenery
//  Everything is drawn in code. No image files.
// ============================================================
const INK = '#1a120e';

// ---------- character looks ----------
const LOOKS = {
  jace: { name: 'Jace', skin: '#e8b996', hair: 'short', hairColor: '#4a3524', hat: 'beanie', hatColor: '#3d4248', shirt: '#c23b2a', sleeves: 'long', hood: true, pants: '#3b4f6e', shoes: '#22201e', build: 1, beard: 'stubble', beardColor: '#6b4a30' },
  walter: { name: 'Walter Black', skin: '#eac2a0', hair: 'ring', hairColor: '#8a7660', glasses: 'specs', beard: 'goatee', beardColor: '#8a7055', shirt: '#4f6a3a', jacket: '#c9b48a', sleeves: 'long', pants: '#6d6252', shoes: '#3a2a1e', build: 1.05 },
  walterHat: { name: 'The Professor', skin: '#eac2a0', hair: 'ring', hairColor: '#8a7660', glasses: 'shades', beard: 'goatee', beardColor: '#6a5240', hat: 'porkpie', hatColor: '#141414', shirt: '#2a2a2a', jacket: '#1d1d1d', sleeves: 'long', pants: '#2a2a2a', shoes: '#111', build: 1.05 },
  jaceHaz: { name: 'Jace', skin: '#e8b996', hair: 'short', hairColor: '#4a3524', hazmat: true, mask: true, shirt: '#e8c62a', sleeves: 'long', pants: '#e8c62a', shoes: '#2a2a2a', build: 1.08 },
  walterHaz: { name: 'Walter Black', skin: '#eac2a0', hair: 'ring', hairColor: '#8a7660', glasses: 'specs', beard: 'goatee', beardColor: '#8a7055', hazmat: true, mask: true, shirt: '#e8c62a', sleeves: 'long', pants: '#e8c62a', shoes: '#2a2a2a', build: 1.12 },
  rafa: { name: 'Rafa "Loco" Vargas', skin: '#b98258', hair: 'slick', hairColor: '#111', shades: false, beard: 'stubble', beardColor: '#222', shirt: '#f2f2f2', sleeves: 'short', vest: '#1b1b1b', pants: '#262a33', shoes: '#111', build: 1.1, grill: true, chain: true },
  twinA: { name: 'Marco Cortez', skin: '#a8754e', hair: 'buzz', hairColor: '#111', beard: 'full', beardColor: '#1a1a1a', shirt: '#cfcfcf', jacket: '#262626', sleeves: 'long', pants: '#262626', shoes: '#5a4632', build: 1.2, skull: true },
  twinB: { name: 'Leo Cortez', skin: '#a8754e', hair: 'buzz', hairColor: '#111', beard: 'full', beardColor: '#1a1a1a', glasses: 'shades', shirt: '#cfcfcf', jacket: '#262626', sleeves: 'long', pants: '#262626', shoes: '#5a4632', build: 1.2, skull: true },
  fenn: { name: 'Augusto Fenn', skin: '#7a4f34', hair: 'buzz', hairColor: '#222', glasses: 'specs', shirt: '#e8e8e8', jacket: '#1e2c4a', tie: '#a32020', sleeves: 'long', pants: '#1e2c4a', shoes: '#111', build: 1 },
  morty: { name: 'Morty Goodfellow', skin: '#e3b38f', hair: 'comb', hairColor: '#6a4a2a', shirt: '#f0d9a0', jacket: '#7a5aa8', tie: '#e0b020', sleeves: 'long', pants: '#55407a', shoes: '#2a1a12', build: 1.05 },
  dusty: { name: 'Dusty', skin: '#d8a27e', hair: 'long', hairColor: '#9a9a9a', hat: 'cap', hatColor: '#4b5a2a', beard: 'full', beardColor: '#a8a8a8', shirt: '#6a4b2a', sleeves: 'short', pants: '#3a3a30', shoes: '#2a1a12', build: 1.2 },
  brewer: { name: 'Agent Hal Brewer', skin: '#e4b38c', hair: 'buzz', hairColor: '#3a2a1a', shades: false, shirt: '#e5e0d0', jacket: '#4a3a2a', sleeves: 'long', pants: '#3a3a3a', shoes: '#1a1a1a', build: 1.25, mustache: true, badge: true },
  esteban: { name: 'Don Esteban', skin: '#c08a60', hair: 'comb', hairColor: '#d8d8d8', mustache: true, shirt: '#f4efe0', jacket: '#f4efe0', sleeves: 'long', pants: '#e8e0c8', shoes: '#6a4a2a', hat: 'cowboy', hatColor: '#e8dcc0', build: 1.15, chain: true },
  dutch: { name: 'Uncle Dutch', skin: '#e2b08a', hair: 'buzz', hairColor: '#ccc', beard: 'full', beardColor: '#cfcfcf', glasses: 'shades', shirt: '#2b2b2b', vest: '#4a3a2a', sleeves: 'short', tattoo: true, pants: '#3a4050', shoes: '#111', build: 1.35 },
  // generic enemies
  thug: () => ({ skin: choose(['#c58d63', '#a8754e', '#e2b08a', '#8a5a3a']), hair: choose(['buzz', 'short', 'slick', 'none']), hairColor: '#1a1410', hat: choose([null, null, 'bandana', 'cap']), hatColor: choose(['#a02020', '#202060', '#2a2a2a']), beard: choose([null, 'stubble', 'goatee']), beardColor: '#1a1410', shirt: choose(['#f0f0f0', '#2b2b2b', '#5a6a8a', '#8a3a2a', '#3a5a3a']), sleeves: choose(['short', 'short', 'long']), pants: choose(['#2a3550', '#3a3a3a', '#5a4a3a']), shoes: '#1a1a1a', build: rand(0.95, 1.15) }),
  cartel: () => ({ skin: choose(['#c58d63', '#a8754e', '#b98258']), hair: choose(['buzz', 'slick']), hairColor: '#111', hat: choose([null, 'cowboy', 'cap']), hatColor: choose(['#3a2a1a', '#d8c8a0', '#222']), beard: choose([null, 'stubble', 'full']), beardColor: '#111', mustache: Math.random() < 0.4, shirt: choose(['#e8dcc0', '#3a4a6a', '#6a2a2a']), vest: Math.random() < 0.5 ? '#3a3f2a' : null, sleeves: 'long', pants: choose(['#3a3a30', '#2a3550']), shoes: '#3a2a1a', build: rand(1, 1.15) }),
  biker: () => ({ skin: choose(['#e2b08a', '#d8a27e', '#c58d63']), hair: choose(['buzz', 'long', 'none']), hairColor: choose(['#3a2a1a', '#999', '#6a4a2a']), hat: choose([null, 'bandana', 'helmet']), hatColor: choose(['#222', '#5a1a1a']), beard: choose(['full', 'goatee', null]), beardColor: '#5a4a3a', glasses: Math.random() < 0.5 ? 'shades' : null, shirt: '#2a2a2a', vest: '#3a2a1e', sleeves: 'short', tattoo: Math.random() < 0.5, pants: '#2a3040', shoes: '#111', build: rand(1.05, 1.3) }),
  guard: () => ({ skin: choose(['#e2b08a', '#a8754e', '#c58d63']), hair: 'buzz', hairColor: '#222', hat: 'cap', hatColor: '#24324a', shirt: '#2e3e5a', sleeves: 'short', pants: '#24324a', shoes: '#111', build: rand(1, 1.15), badge: true }),
  labguard: () => ({ skin: choose(['#e2b08a', '#a8754e']), hair: 'buzz', hairColor: '#222', hat: 'balaclava', hatColor: '#151515', shirt: '#2a2a2a', vest: '#3a3a30', sleeves: 'long', pants: '#2a2a2a', shoes: '#111', build: rand(1.05, 1.2) }),
};
function lookOf(k) { const l = LOOKS[k]; return typeof l === 'function' ? l() : l; }

function shade(hex, amt) { // amt -1..1
  let c = hex.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const n = parseInt(c, 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; } else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  return '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
}

function limb(c, ax, ay, bx, by, w, col) {
  c.lineCap = 'round';
  c.strokeStyle = INK; c.lineWidth = w + 3; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
  c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
}
function dot(c, x, y, r, col, outline = true) {
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = col; c.fill(); if (outline) { c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); }
}
function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

// 2-bone IK: returns elbow/knee position
function ik(ax, ay, tx, ty, l1, l2, bend) {
  let dx = tx - ax, dy = ty - ay, d = Math.hypot(dx, dy);
  d = clamp(d, Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const base = Math.atan2(dy, dx) + a * bend;
  return [ax + Math.cos(base) * l1, ay + Math.sin(base) * l1];
}

// ---------- side-view head ----------
function drawHead(c, x, y, look, f, ang, opts = {}) {
  const r = 11;
  c.save(); c.translate(x, y); c.scale(f, 1); c.rotate(ang);
  const skin = opts.flash ? '#fff' : look.skin;
  // skull + jaw
  c.beginPath(); c.ellipse(0, 0, r, r, 0, 0, TAU); c.fillStyle = skin; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  c.beginPath(); c.ellipse(3, 4, 8.5, 6.5, 0.2, 0, TAU); c.fillStyle = skin; c.fill();
  c.beginPath(); c.arc(3, 4, 8.5, 0.1, 1.9); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  if (look.hat === 'balaclava') {
    c.beginPath(); c.arc(0, 0, r + 0.8, 0, TAU); c.fillStyle = look.hatColor; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    c.fillStyle = look.skin; rrect(c, 2, -4, 9, 5, 2); c.fill();
    c.fillStyle = INK; c.fillRect(6, -3, 2, 2.5);
    c.restore(); return;
  }
  // ear
  c.beginPath(); c.ellipse(-2, 1, 2.6, 3.6, 0, 0, TAU); c.fillStyle = shade(look.skin, -0.12); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  // nose
  c.beginPath(); c.moveTo(r - 1.5, -1.5); c.lineTo(r + 3, 3); c.lineTo(r - 1, 4); c.fillStyle = skin; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  // eye + brow
  c.fillStyle = '#fff'; c.fillRect(4.5, -2.5, 3.5, 2.5); c.fillStyle = INK; c.fillRect(6.5, -2.5, 1.6, 2.5);
  c.strokeStyle = shade(look.hairColor || '#333', -0.2); c.lineWidth = 1.6; c.beginPath();
  if (opts.angry) { c.moveTo(3.5, -6); c.lineTo(9, -3.8); } else { c.moveTo(3.5, -4.8); c.lineTo(9, -4.6); } c.stroke();
  // mouth
  c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(6, 7); c.lineTo(9.5, opts.angry ? 6 : 7); c.stroke();
  if (look.grill) { c.fillStyle = '#e8c040'; c.fillRect(6, 6.3, 4, 1.6); }
  // beard
  if (look.beard === 'goatee') {
    c.fillStyle = look.beardColor; c.beginPath(); c.moveTo(5, 5); c.lineTo(10, 5.2); c.lineTo(9.5, 6.4); c.lineTo(6, 6.4); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(5.5, 8); c.lineTo(9.5, 8); c.lineTo(8.5, 12); c.lineTo(5, 11.5); c.closePath(); c.fill();
  } else if (look.beard === 'full') {
    c.fillStyle = look.beardColor; c.beginPath(); c.moveTo(-1, 2); c.quadraticCurveTo(0, 12, 6, 12); c.lineTo(10, 10); c.lineTo(10, 8); c.lineTo(5.5, 8.2); c.lineTo(5, 5.5); c.lineTo(10, 5); c.lineTo(9, 3.8); c.lineTo(2, 3); c.closePath(); c.fill();
  } else if (look.beard === 'stubble') {
    c.fillStyle = look.beardColor; c.globalAlpha = 0.35; c.beginPath(); c.moveTo(0, 3); c.quadraticCurveTo(1, 11, 6, 11); c.lineTo(10, 9); c.lineTo(10, 5); c.lineTo(3, 4); c.closePath(); c.fill(); c.globalAlpha = 1;
  }
  if (look.mustache) { c.fillStyle = look.beardColor || look.hairColor; c.beginPath(); c.moveTo(4.5, 5); c.lineTo(10.5, 5); c.lineTo(10, 6.8); c.lineTo(5, 6.6); c.closePath(); c.fill(); }
  // hair
  const hc = look.hairColor || '#222';
  c.fillStyle = hc;
  switch (look.hair) {
    case 'short': c.beginPath(); c.arc(0, 0, r + 1, PI * 0.95, PI * 1.92); c.lineTo(4, -6); c.quadraticCurveTo(-2, -3, -5, 2); c.closePath(); c.fill(); break;
    case 'slick': c.beginPath(); c.arc(0, -1, r + 1.5, PI * 0.9, PI * 1.95); c.lineTo(7, -7); c.quadraticCurveTo(-3, -6, -6, 3); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.2; c.beginPath(); c.arc(0, -1, r - 1, PI * 1.2, PI * 1.6); c.stroke(); break;
    case 'buzz': c.globalAlpha = 0.85; c.beginPath(); c.arc(0, 0, r + 0.5, PI * 0.95, PI * 1.85); c.lineTo(3, -7); c.quadraticCurveTo(-3, -4, -6, 2); c.closePath(); c.fill(); c.globalAlpha = 1; break;
    case 'long': c.beginPath(); c.arc(0, 0, r + 1.5, PI * 0.8, PI * 1.9); c.lineTo(3, -7); c.quadraticCurveTo(-4, 0, -6, 14); c.lineTo(-11, 12); c.closePath(); c.fill(); break;
    case 'comb': c.beginPath(); c.arc(0, -1, r + 1.5, PI * 0.95, PI * 2.0); c.lineTo(9, -6); c.quadraticCurveTo(-2, -4, -6, 2); c.closePath(); c.fill(); break;
    case 'ring': // bald with a horseshoe of short hair - Walter
      c.globalAlpha = 0.9; c.beginPath(); c.moveTo(-10.5, -2); c.quadraticCurveTo(-12, 4, -7, 8); c.lineTo(-4, 6); c.quadraticCurveTo(-7, 2, -6, -3); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(1, -2); c.lineTo(3.5, -1.5); c.lineTo(3, 2); c.lineTo(1, 2); c.closePath(); c.fill(); c.globalAlpha = 1; break;
  }
  if (!look.hair || look.hair === 'none' || look.hair === 'ring') {
    if (!look.hat || look.hat === 'none') { c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-1, -7.5, 4.5, 2, -0.3, 0, TAU); c.fill(); }
  }
  // eyewear
  if (look.glasses === 'specs') {
    c.strokeStyle = '#2a2a2a'; c.lineWidth = 1.5; c.fillStyle = 'rgba(190,220,255,.35)'; rrect(c, 3.5, -4, 7, 4.5, 1.2); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(3.5, -2.5); c.lineTo(-2, -1.5); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(5, -3.4, 2, 1);
  } else if (look.glasses === 'shades') {
    c.fillStyle = '#0d0d0d'; rrect(c, 3, -4.2, 8, 5, 1.5); c.fill(); c.strokeStyle = '#0d0d0d'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(3.5, -2.5); c.lineTo(-2, -1.5); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(5, -3.6, 3, 1);
  }
  if (look.mask) { // respirator
    c.fillStyle = '#2b2b2b'; c.beginPath(); c.ellipse(7, 5, 5, 5, 0, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = '#d23a2a'; c.beginPath(); c.arc(11, 7, 3, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = '#2b2b2b'; c.lineWidth = 2; c.beginPath(); c.moveTo(3, 3); c.lineTo(-3, -2); c.stroke();
  }
  // hats
  if (look.hazmat) { // hood edge
    c.strokeStyle = shade('#e8c62a', -0.25); c.lineWidth = 4; c.beginPath(); c.arc(0, 1, r + 2, PI * 0.55, PI * 1.6); c.stroke();
  }
  const hat = look.hat, hcol = look.hatColor || '#333';
  if (hat === 'beanie') {
    c.fillStyle = hcol; c.beginPath(); c.arc(0, -1, r + 1.5, PI * 1.0, PI * 2.0); c.lineTo(r + 1.5, -1); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.8; c.stroke();
    c.fillStyle = shade(hcol, -0.25); c.fillRect(-r - 2, -4, r * 2 + 3.5, 4.5); c.strokeRect(-r - 2, -4, r * 2 + 3.5, 4.5);
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; for (let i = -9; i < 11; i += 3) { c.beginPath(); c.moveTo(i, -4); c.lineTo(i, 0.5); c.stroke(); }
  } else if (hat === 'porkpie') {
    c.fillStyle = hcol; c.strokeStyle = '#000'; c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(0, -6, r + 8, 2.6, 0, 0, TAU); c.fill(); c.stroke();
    rrect(c, -9, -16, 18, 10, 2); c.fill(); c.stroke();
    c.fillStyle = '#3a3a3a'; c.fillRect(-9, -9, 18, 2.5);
  } else if (hat === 'cap') {
    c.fillStyle = hcol; c.beginPath(); c.arc(0, -1, r + 1.2, PI * 1.0, PI * 2.0); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
    c.beginPath(); c.moveTo(r - 2, -3); c.lineTo(r + 9, -1.5); c.lineTo(r + 8, 0.5); c.lineTo(r - 2, -0.5); c.closePath(); c.fill(); c.stroke();
  } else if (hat === 'bandana') {
    c.fillStyle = hcol; c.beginPath(); c.arc(0, -1, r + 1, PI * 1.0, PI * 2.0); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-r, -2); c.lineTo(-r - 7, 2); c.lineTo(-r - 4, 5); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(-4, -8, 1.5, 1.5); c.fillRect(2, -6, 1.5, 1.5);
  } else if (hat === 'cowboy') {
    c.fillStyle = hcol; c.strokeStyle = INK; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-r - 10, -5); c.quadraticCurveTo(0, -9, r + 10, -5); c.quadraticCurveTo(0, -3, -r - 10, -5); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-8, -6); c.lineTo(-7, -17); c.quadraticCurveTo(0, -13, 7, -17); c.lineTo(8, -6); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = shade(hcol, -0.4); c.fillRect(-8, -9, 16, 2);
  } else if (hat === 'helmet') {
    c.fillStyle = hcol; c.beginPath(); c.arc(0, -1, r + 2.5, PI * 0.9, PI * 2.05); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.8; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(-2, -8, 5, 2, -0.3, 0, TAU); c.fill();
  }
  c.restore();
}

// ---------- full figure from joints ----------
// J: {head,neck,pelvis,eF,hF,eB,hB,kF,fF,kB,fB} each [x,y]; headAng; f facing
function drawFigure(c, J, look, f, opts = {}) {
  const b = look.build || 1;
  const shirt = opts.flash ? '#fff' : (look.hazmat ? '#e8c62a' : look.shirt);
  const pants = opts.flash ? '#fff' : look.pants;
  const sleeve = look.jacket || shirt;
  const armCol = look.sleeves === 'long' || look.jacket || look.hazmat ? sleeve : look.skin;
  const cut = opts.cut || {};
  const shoeCol = look.shoes || '#222';
  const leg = (p, k, ft, side) => {
    if (cut['leg' + side]) { stump(c, J.pelvis, pants); return; }
    const dark = side === 'B' ? -0.22 : 0;
    limb(c, J.pelvis[0], J.pelvis[1], J[k][0], J[k][1], 11 * b, shade(pants, dark));
    limb(c, J[k][0], J[k][1], J[ft][0], J[ft][1], 9.5 * b, shade(pants, dark));
    // shoe
    c.save(); c.translate(J[ft][0], J[ft][1]);
    const sa = opts.footAng || 0; c.rotate(sa);
    c.fillStyle = shade(shoeCol, dark); c.strokeStyle = INK; c.lineWidth = 1.5; rrect(c, -5 * (f > 0 ? 1 : 2.2), -3, 15, 7, 3); c.fill(); c.stroke();
    c.restore();
  };
  const arm = (e, h, side) => {
    if (cut['arm' + side]) { stump(c, J.neck, armCol); return; }
    const dark = side === 'B' ? -0.22 : 0;
    const sh = [J.neck[0] - f * 2, J.neck[1] + 5];
    limb(c, sh[0], sh[1], J[e][0], J[e][1], 9 * b, shade(look.jacket || shirt, dark));
    limb(c, J[e][0], J[e][1], J[h][0], J[h][1], 8 * b, shade(armCol, dark));
    if (look.tattoo && armCol === look.skin) { c.strokeStyle = 'rgba(30,50,90,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(lerp(J[e][0], J[h][0], 0.3), lerp(J[e][1], J[h][1], 0.3)); c.lineTo(lerp(J[e][0], J[h][0], 0.6), lerp(J[e][1], J[h][1], 0.6)); c.stroke(); }
    dot(c, J[h][0], J[h][1], 4.5 * b, look.hazmat ? '#3a3a3a' : shade(look.skin, dark));
  };
  // back limbs
  arm('eB', 'hB', 'B');
  leg(J.pelvis, 'kB', 'fB', 'B');
  // torso
  const nx = J.neck[0], ny = J.neck[1], px = J.pelvis[0], py = J.pelvis[1];
  limb(c, nx, ny + 4, px, py - 2, 22 * b, shirt);
  if (look.jacket && !look.hazmat) {
    c.lineCap = 'round'; c.strokeStyle = look.jacket; c.lineWidth = 22 * b; c.save(); c.beginPath(); c.moveTo(nx, ny + 4); c.lineTo(px, py - 2); c.clip && 0; c.restore();
    // jacket front panel: draw a slightly narrower shirt strip on the front edge
    const ang = Math.atan2(py - ny, px - nx), ox = -Math.sin(ang) * 8 * b * -f, oy = Math.cos(ang) * 8 * b * -f;
    limb(c, nx, ny + 4, px, py - 2, 22 * b, look.jacket);
    c.strokeStyle = shirt; c.lineWidth = 5; c.beginPath(); c.moveTo(nx + ox * 0.9, ny + 6 + oy * 0.9); c.lineTo(px + ox * 0.9, py - 4 + oy * 0.9); c.stroke();
    if (look.tie) { c.strokeStyle = look.tie; c.lineWidth = 2.5; c.beginPath(); c.moveTo(nx + ox, ny + 7 + oy); c.lineTo(lerp(nx, px, 0.6) + ox, lerp(ny, py, 0.6) + oy); c.stroke(); }
  }
  if (look.vest) {
    const vc = opts.flash ? '#fff' : look.vest;
    c.lineCap = 'butt'; c.strokeStyle = vc; c.lineWidth = 24 * b; c.beginPath(); c.moveTo(lerp(nx, px, 0.12), lerp(ny, py, 0.12) + 4); c.lineTo(lerp(nx, px, 0.85), lerp(ny, py, 0.85)); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(lerp(nx, px, 0.5) - 10, lerp(ny, py, 0.5)); c.lineTo(lerp(nx, px, 0.5) + 10, lerp(ny, py, 0.5)); c.stroke();
  }
  if (look.armor) {
    c.lineCap = 'butt'; c.strokeStyle = '#3d4434'; c.lineWidth = 25 * b; c.beginPath(); c.moveTo(lerp(nx, px, 0.1), lerp(ny, py, 0.1) + 4); c.lineTo(lerp(nx, px, 0.8), lerp(ny, py, 0.8)); c.stroke();
    c.fillStyle = '#2b3024'; c.fillRect(lerp(nx, px, 0.45) + f * 4 - 4, lerp(ny, py, 0.45) - 3, 8, 7);
  }
  if (look.hood && !opts.noHood) { // hoodie hood bunched at the neck
    c.fillStyle = shade(shirt, -0.15); c.beginPath(); c.ellipse(nx - f * 7, ny + 3, 8, 6, 0, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  }
  if (look.chain) { c.strokeStyle = '#e8c040'; c.lineWidth = 2; c.beginPath(); c.arc(nx + f * 4, ny + 6, 6, 0.2, 2.6); c.stroke(); }
  if (look.badge) { c.fillStyle = '#e8c040'; c.beginPath(); c.arc(lerp(nx, px, 0.3) + f * 5, lerp(ny, py, 0.3), 2.6, 0, TAU); c.fill(); }
  if (look.skull) { c.fillStyle = '#ddd'; c.beginPath(); c.arc(lerp(nx, px, 0.35) + f * 3, lerp(ny, py, 0.35), 3, 0, TAU); c.fill(); }
  // belt
  if (!look.hazmat) { c.strokeStyle = '#2a1e16'; c.lineWidth = 4; c.lineCap = 'butt'; c.beginPath(); c.moveTo(px - 11 * b, py - 3); c.lineTo(px + 11 * b, py - 3); c.stroke(); c.fillStyle = '#c8b070'; c.fillRect(px + f * 5 - 2, py - 5, 4, 4); }
  // front leg
  leg(J.pelvis, 'kF', 'fF', 'F');
  // head
  if (!cut.head) drawHead(c, J.head[0], J.head[1], look, f, J.headAng || 0, opts);
  else stump(c, J.neck, look.skin, true);
  if (opts.gun) opts.gun(c);
  arm('eF', 'hF', 'F');
  if (opts.burning) {
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) { const t = (performance.now() / 300 + i * 0.37) % 1; const x = lerp(px, nx, Math.random()) + rand(-10, 10), y = lerp(py, J.head[1], Math.random()) - t * 20; c.fillStyle = `rgba(255,${120 + randi(0, 100)},30,${0.6 * (1 - t)})`; c.beginPath(); c.arc(x, y, 6 + 6 * (1 - t), 0, TAU); c.fill(); }
    c.globalCompositeOperation = 'source-over';
  }
}
function stump(c, p, col, neck) {
  dot(c, p[0], p[1] + (neck ? 0 : 3), neck ? 6 : 5, col);
  dot(c, p[0], p[1] + (neck ? -1 : 3), neck ? 4 : 3, '#8a0f0f', false);
}

// ---------- weapons (local coords: grip at 0,0, barrel +x, up is -y) ----------
const GUN_ART = {
  pistol(c, s) {
    const g = s.gold ? '#d8b040' : '#2b2d30', gd = s.gold ? '#a07a20' : '#1b1c1e';
    // grip
    c.fillStyle = s.gold ? '#f2efe6' : '#3a3026'; c.strokeStyle = INK; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-5, -3); c.lineTo(2, -3); c.lineTo(0, 10); c.lineTo(-7, 10); c.closePath(); c.fill(); c.stroke();
    if (s.magIn) { c.fillStyle = '#111'; c.fillRect(-7.5, 9.5, 8, 2.5); }
    // frame + trigger guard
    c.fillStyle = gd; c.fillRect(-4, -4.5, 19, 4); c.strokeRect(-4, -4.5, 19, 4);
    c.beginPath(); c.arc(4.5, 0, 3.5, 0, PI); c.strokeStyle = gd; c.lineWidth = 1.5; c.stroke();
    // slide
    const so = -(s.slide || 0) * 6;
    c.fillStyle = g; c.strokeStyle = INK; c.lineWidth = 1.5; rrect(c, -6 + so, -10.5, 24, 6.5, 1.2); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-4 + so + i * 1.6, -9.5); c.lineTo(-4 + so + i * 1.6, -5.5); c.stroke(); }
    c.fillStyle = '#111'; c.fillRect(16 + so, -11.5, 2, 1.5); c.fillRect(-5 + so, -11.5, 2, 1.5);
    if (s.slide > 0.5) { c.fillStyle = '#555'; c.fillRect(14, -9.5, 4, 4); }
  },
  revolver(c, s) {
    c.strokeStyle = INK; c.lineWidth = 1.5;
    c.fillStyle = '#6a4024'; c.beginPath(); c.moveTo(-4, -3); c.quadraticCurveTo(1, -3, 1, 2); c.lineTo(-2, 11); c.quadraticCurveTo(-8, 12, -8, 8); c.lineTo(-7, -1); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#9aa0a6'; c.fillRect(-5, -10, 12, 8); c.strokeRect(-5, -10, 12, 8);
    c.beginPath(); c.arc(3, 0, 3.4, 0, PI); c.strokeStyle = '#555'; c.stroke(); c.strokeStyle = INK;
    c.fillStyle = '#8a9096'; c.fillRect(7, -10, 20, 4.5); c.strokeRect(7, -10, 20, 4.5); c.fillRect(7, -6, 14, 2.5);
    c.fillStyle = '#333'; c.fillRect(25, -12, 2, 2); c.fillRect(-7, -12, 3, 3);
    // cylinder
    const oy = (s.cyl || 0) * 8;
    c.fillStyle = '#b0b6bc'; rrect(c, -1, -11 + oy, 10, 9, 2); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-1, -8 + oy); c.lineTo(9, -8 + oy); c.moveTo(-1, -5 + oy); c.lineTo(9, -5 + oy); c.stroke();
    if (s.cyl > 0.5) { c.fillStyle = '#222'; for (let i = 0; i < 3; i++) c.fillRect(-1, -10 + oy + i * 3, 2, 2); }
  },
  shotgun(c, s) {
    c.strokeStyle = INK; c.lineWidth = 1.5;
    c.fillStyle = '#7a4a26'; c.beginPath(); c.moveTo(-6, -6); c.lineTo(-32, -4); c.lineTo(-33, 5); c.lineTo(-22, 4); c.lineTo(-2, 2); c.lineTo(0, -1); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#222'; c.fillRect(-34, -4.5, 3, 10);
    c.fillStyle = '#2a2b2e'; c.fillRect(-6, -9, 18, 9); c.strokeRect(-6, -9, 18, 9);
    c.fillStyle = '#3a3b3e'; c.fillRect(12, -8.5, 34, 4); c.strokeRect(12, -8.5, 34, 4);
    c.fillStyle = '#2a2b2e'; c.fillRect(12, -4.5, 26, 3.5); c.strokeRect(12, -4.5, 26, 3.5);
    const po = -(s.pump || 0) * 9;
    c.fillStyle = s.fire ? '#8a2a1a' : '#6a3e20'; rrect(c, 15 + po, -6, 15, 6.5, 2); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(17 + po + i * 2.6, -5); c.lineTo(17 + po + i * 2.6, 0); c.stroke(); }
    c.beginPath(); c.arc(2, 0, 3.4, 0, PI); c.strokeStyle = '#333'; c.lineWidth = 1.4; c.stroke();
    c.fillStyle = '#c0c0c0'; c.fillRect(44, -10, 2, 2);
  },
  smg(c, s) {
    c.strokeStyle = INK; c.lineWidth = 1.5;
    c.strokeStyle = '#333'; c.lineWidth = 2; c.beginPath(); c.moveTo(-4, -7); c.lineTo(-16, -5); c.lineTo(-16, 3); c.lineTo(-4, 0); c.stroke(); c.strokeStyle = INK; c.lineWidth = 1.5;
    c.fillStyle = '#2b2d30'; c.beginPath(); c.moveTo(-4, -2); c.lineTo(3, -2); c.lineTo(2, 10); c.lineTo(-4, 10); c.closePath(); c.fill(); c.stroke();
    if (s.magIn) { c.fillStyle = '#1a1a1a'; c.fillRect(-3.5, 9, 5, 9); c.strokeRect(-3.5, 9, 5, 9); }
    c.fillStyle = '#3a3c40'; rrect(c, -6, -10, 26, 9, 1.5); c.fill(); c.stroke();
    c.fillStyle = '#222'; c.fillRect(20, -7.5, 7, 3.5);
    c.fillStyle = '#555'; c.fillRect(6 - (s.slide || 0) * 5, -12, 4, 2.5);
    c.beginPath(); c.arc(3.5, 0, 3, 0, PI); c.strokeStyle = '#333'; c.stroke();
  },
  rifle(c, s) {
    c.strokeStyle = INK; c.lineWidth = 1.5;
    c.fillStyle = '#8a4e24'; c.beginPath(); c.moveTo(-6, -7); c.lineTo(-30, -4); c.lineTo(-31, 5); c.lineTo(-20, 3); c.lineTo(-4, 1); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#6a3a1a'; c.beginPath(); c.moveTo(-4, -2); c.lineTo(2, -2); c.lineTo(0, 9); c.lineTo(-6, 9); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#2b2d30'; c.fillRect(-6, -10, 24, 9); c.strokeRect(-6, -10, 24, 9);
    if (s.magIn) { c.fillStyle = '#3a2a1a'; c.beginPath(); c.moveTo(8, -1); c.lineTo(15, -1); c.quadraticCurveTo(19, 8, 22, 15); c.lineTo(15, 17); c.quadraticCurveTo(12, 8, 8, -1); c.fill(); c.stroke(); }
    c.fillStyle = '#8a4e24'; rrect(c, 18, -9, 14, 7, 2); c.fill(); c.stroke();
    c.fillStyle = '#3a3b3e'; c.fillRect(32, -7, 16, 3); c.strokeRect(32, -7, 16, 3); c.fillRect(18, -12, 16, 2.5);
    c.fillStyle = '#222'; c.fillRect(42, -12, 2, 5); c.fillRect(46, -8, 4, 5);
    c.fillStyle = '#777'; c.fillRect(13 - (s.slide || 0) * 7, -9, 4, 2.5);
    c.beginPath(); c.arc(2.5, 0, 3.2, 0, PI); c.strokeStyle = '#333'; c.stroke();
  },
  mg(c, s) {
    c.strokeStyle = INK; c.lineWidth = 1.5;
    c.fillStyle = '#3a3c30'; c.beginPath(); c.moveTo(-6, -8); c.lineTo(-32, -5); c.lineTo(-33, 6); c.lineTo(-4, 2); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#2b2d30'; c.beginPath(); c.moveTo(-4, -2); c.lineTo(2, -2); c.lineTo(0, 9); c.lineTo(-6, 9); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#34362e'; c.fillRect(-6, -13, 30, 12); c.strokeRect(-6, -13, 30, 12);
    c.fillStyle = '#2a2c26'; c.save(); c.translate(-2, -13); c.rotate(-(s.cover || 0) * 1.1); c.fillRect(0, -3, 22, 3); c.strokeRect(0, -3, 22, 3); c.restore();
    if (s.magIn) { c.fillStyle = '#4a5030'; c.fillRect(2, -1, 14, 13); c.strokeRect(2, -1, 14, 13); c.fillStyle = '#c8a040'; for (let i = 0; i < 4; i++) c.fillRect(16 + i * 0.5, -6 + i * 3, 4, 2); }
    c.fillStyle = '#2b2d30'; c.fillRect(24, -10, 32, 5); c.strokeRect(24, -10, 32, 5);
    c.fillStyle = '#4a4c44'; rrect(c, 24, -12, 14, 9, 2); c.fill(); c.stroke();
    c.strokeStyle = '#222'; c.lineWidth = 2; c.beginPath(); c.moveTo(48, -5); c.lineTo(38, 2); c.stroke();
    c.fillStyle = '#222'; c.fillRect(54, -13, 2, 4);
  },
  bat(c) { c.save(); c.rotate(-1.2); c.fillStyle = '#c89a5a'; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-4, -2); c.lineTo(40, -5); c.quadraticCurveTo(46, 0, 40, 5); c.lineTo(-4, 2); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#222'; c.fillRect(-6, -2.5, 6, 5); c.restore(); },
  knife(c) { c.save(); c.rotate(-0.3); c.fillStyle = '#222'; c.fillRect(-5, -2, 9, 4); c.fillStyle = '#dfe3e6'; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(4, -2); c.lineTo(20, -1); c.lineTo(4, 3); c.closePath(); c.fill(); c.stroke(); c.restore(); },
  axe(c) { c.save(); c.rotate(-1.25); c.fillStyle = '#6a4024'; c.strokeStyle = INK; c.lineWidth = 1.5; c.fillRect(-4, -2.5, 46, 5); c.strokeRect(-4, -2.5, 46, 5); c.fillStyle = '#bfc5ca'; c.beginPath(); c.moveTo(36, -3); c.lineTo(46, -14); c.quadraticCurveTo(52, 0, 46, 14); c.lineTo(36, 3); c.closePath(); c.fill(); c.stroke(); c.restore(); },
};

// loose magazine / casing art (used for dropped physics bits)
function drawMag(c, kind) {
  c.strokeStyle = INK; c.lineWidth = 1;
  if (kind === 'rifle') { c.fillStyle = '#3a2a1a'; c.beginPath(); c.moveTo(-3, -8); c.lineTo(3, -8); c.quadraticCurveTo(6, 0, 7, 8); c.lineTo(1, 9); c.quadraticCurveTo(0, 0, -3, -8); c.fill(); c.stroke(); }
  else if (kind === 'mg') { c.fillStyle = '#4a5030'; c.fillRect(-7, -6, 14, 12); c.strokeRect(-7, -6, 14, 12); }
  else if (kind === 'loader') { c.fillStyle = '#333'; c.beginPath(); c.arc(0, 0, 4.5, 0, TAU); c.fill(); }
  else { c.fillStyle = '#1a1a1a'; c.fillRect(-2.5, -6, 5, 12); c.strokeRect(-2.5, -6, 5, 12); c.fillStyle = '#c8a040'; c.fillRect(-1.5, -7, 3, 1.5); }
}

// ---------- portraits (front view) ----------
function drawPortrait(c, x, y, s, look, expr = 'neutral', bg) {
  c.save(); c.translate(x, y);
  c.fillStyle = bg || '#22201c'; rrect(c, 0, 0, s, s, 10); c.fill();
  c.save(); rrect(c, 0, 0, s, s, 10); c.clip();
  const g = c.createRadialGradient(s * 0.5, s * 0.4, 10, s * 0.5, s * 0.5, s * 0.8); g.addColorStop(0, 'rgba(255,220,160,.18)'); g.addColorStop(1, 'rgba(0,0,0,.4)'); c.fillStyle = g; c.fillRect(0, 0, s, s);
  c.translate(s / 2, s * 0.52); const k = s / 160; c.scale(k, k);
  const skin = look.skin, sk2 = shade(skin, -0.18);
  const shirt = look.hazmat ? '#e8c62a' : look.shirt;
  // shoulders
  c.fillStyle = look.jacket || look.vest || shirt; c.strokeStyle = INK; c.lineWidth = 3;
  c.beginPath(); c.moveTo(-80, 90); c.quadraticCurveTo(-74, 34, -26, 30); c.lineTo(26, 30); c.quadraticCurveTo(74, 34, 80, 90); c.closePath(); c.fill(); c.stroke();
  if (look.jacket || look.vest) { c.fillStyle = shirt; c.beginPath(); c.moveTo(-20, 30); c.lineTo(0, 70); c.lineTo(20, 30); c.closePath(); c.fill(); c.stroke(); }
  if (look.tie) { c.fillStyle = look.tie; c.beginPath(); c.moveTo(-5, 36); c.lineTo(5, 36); c.lineTo(8, 70); c.lineTo(0, 80); c.lineTo(-8, 70); c.closePath(); c.fill(); }
  if (look.hood) { c.fillStyle = shade(shirt, -0.15); c.beginPath(); c.ellipse(0, 32, 46, 14, 0, PI, TAU); c.fill(); c.stroke(); c.strokeStyle = '#eee'; c.lineWidth = 2; c.beginPath(); c.moveTo(-12, 36); c.lineTo(-14, 62); c.moveTo(12, 36); c.lineTo(14, 62); c.stroke(); c.strokeStyle = INK; }
  if (look.chain) { c.strokeStyle = '#e8c040'; c.lineWidth = 3; c.beginPath(); c.arc(0, 30, 22, 0.3, PI - 0.3); c.stroke(); c.strokeStyle = INK; }
  if (look.hazmat) { c.strokeStyle = shade('#e8c62a', -0.3); c.lineWidth = 6; c.beginPath(); c.ellipse(0, -8, 52, 62, 0, 0, TAU); c.stroke(); c.strokeStyle = INK; }
  // neck
  c.fillStyle = sk2; c.fillRect(-14, 8, 28, 26);
  // ears
  c.fillStyle = skin; c.lineWidth = 2.5;
  c.beginPath(); c.ellipse(-40, -6, 8, 13, 0, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(40, -6, 8, 13, 0, 0, TAU); c.fill(); c.stroke();
  // face
  const wide = (look.build || 1) > 1.2 ? 4 : 0;
  c.fillStyle = skin; c.beginPath(); c.ellipse(0, -8, 38 + wide, 48, 0, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = 'rgba(0,0,0,.08)'; c.beginPath(); c.ellipse(16, 0, 20, 34, 0, 0, TAU); c.fill();
  // hair
  c.fillStyle = look.hairColor || '#222';
  if (look.hat !== 'balaclava') switch (look.hair) {
    case 'short': c.beginPath(); c.ellipse(0, -36, 40, 26, 0, PI, TAU); c.fill(); break;
    case 'slick': c.beginPath(); c.ellipse(0, -38, 41, 28, 0, PI, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 3; c.beginPath(); c.arc(-6, -30, 26, PI * 1.15, PI * 1.6); c.stroke(); c.strokeStyle = INK; break;
    case 'buzz': c.globalAlpha = 0.75; c.beginPath(); c.ellipse(0, -34, 39, 24, 0, PI, TAU); c.fill(); c.globalAlpha = 1; break;
    case 'long': c.beginPath(); c.ellipse(0, -34, 44, 28, 0, PI, TAU); c.fill(); c.fillRect(-46, -36, 14, 70); c.fillRect(32, -36, 14, 70); break;
    case 'comb': c.beginPath(); c.ellipse(0, -38, 41, 26, 0, PI, TAU); c.fill(); c.beginPath(); c.ellipse(-12, -50, 26, 10, -0.2, 0, TAU); c.fill(); break;
    case 'ring': c.beginPath(); c.moveTo(-40, -2); c.quadraticCurveTo(-44, -30, -30, -34); c.lineTo(-26, -18); c.quadraticCurveTo(-32, -10, -32, 4); c.closePath(); c.fill(); c.beginPath(); c.moveTo(40, -2); c.quadraticCurveTo(44, -30, 30, -34); c.lineTo(26, -18); c.quadraticCurveTo(32, -10, 32, 4); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-8, -42, 16, 7, -0.3, 0, TAU); c.fill(); break;
    default: c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-8, -42, 16, 7, -0.3, 0, TAU); c.fill();
  }
  // brows
  const angry = expr === 'angry', smile = expr === 'smile', worried = expr === 'worried';
  c.strokeStyle = shade(look.hairColor || '#333', -0.3); c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath();
  if (angry) { c.moveTo(-26, -24); c.lineTo(-8, -17); c.moveTo(26, -24); c.lineTo(8, -17); }
  else if (worried) { c.moveTo(-26, -18); c.lineTo(-8, -24); c.moveTo(26, -18); c.lineTo(8, -24); }
  else { c.moveTo(-26, -21); c.lineTo(-8, -22); c.moveTo(26, -21); c.lineTo(8, -22); }
  c.stroke();
  // eyes
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-17, -10, 7.5, 5, 0, 0, TAU); c.ellipse(17, -10, 7.5, 5, 0, 0, TAU); c.fill();
  c.fillStyle = '#3a2a1a'; c.beginPath(); c.arc(-16, -10, 3.6, 0, TAU); c.arc(18, -10, 3.6, 0, TAU); c.fill();
  // nose
  c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, -8); c.quadraticCurveTo(-7, 10, -2, 12); c.lineTo(5, 11); c.stroke();
  // mouth
  c.lineWidth = 3; c.beginPath();
  if (smile) { c.moveTo(-14, 22); c.quadraticCurveTo(0, 32, 14, 22); }
  else if (angry) { c.moveTo(-14, 26); c.quadraticCurveTo(0, 20, 14, 26); }
  else if (worried) { c.moveTo(-10, 26); c.quadraticCurveTo(0, 22, 10, 26); }
  else { c.moveTo(-12, 24); c.lineTo(12, 24); }
  c.stroke();
  if (look.grill) { c.fillStyle = '#e8c040'; c.fillRect(-12, 22, 24, 5); c.strokeRect(-12, 22, 24, 5); }
  // facial hair
  c.fillStyle = look.beardColor || '#333';
  if (look.beard === 'goatee') { c.beginPath(); c.moveTo(-16, 18); c.quadraticCurveTo(0, 12, 16, 18); c.lineTo(14, 22); c.quadraticCurveTo(0, 17, -14, 22); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-10, 28); c.lineTo(10, 28); c.lineTo(7, 40); c.quadraticCurveTo(0, 44, -7, 40); c.closePath(); c.fill(); }
  else if (look.beard === 'full') { c.beginPath(); c.moveTo(-38, -6); c.quadraticCurveTo(-36, 40, 0, 44); c.quadraticCurveTo(36, 40, 38, -6); c.lineTo(30, 6); c.quadraticCurveTo(14, 14, 0, 14); c.quadraticCurveTo(-14, 14, -30, 6); c.closePath(); c.fill(); c.fillStyle = skin; c.beginPath(); c.ellipse(0, 25, 13, 5, 0, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(-10, 25); c.lineTo(10, 25); c.stroke(); }
  else if (look.beard === 'stubble') { c.globalAlpha = 0.25; c.beginPath(); c.moveTo(-36, 0); c.quadraticCurveTo(-34, 38, 0, 40); c.quadraticCurveTo(34, 38, 36, 0); c.quadraticCurveTo(0, 20, -36, 0); c.fill(); c.globalAlpha = 1; }
  if (look.mustache) { c.fillStyle = look.beardColor || look.hairColor; c.beginPath(); c.moveTo(-18, 20); c.quadraticCurveTo(0, 10, 18, 20); c.lineTo(16, 22); c.quadraticCurveTo(0, 16, -16, 22); c.closePath(); c.fill(); }
  // glasses
  if (look.glasses === 'specs') { c.strokeStyle = '#222'; c.lineWidth = 3.5; c.fillStyle = 'rgba(200,230,255,.25)'; rrect(c, -31, -19, 25, 17, 4); c.fill(); c.stroke(); rrect(c, 6, -19, 25, 17, 4); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-6, -12); c.lineTo(6, -12); c.moveTo(-31, -13); c.lineTo(-40, -12); c.moveTo(31, -13); c.lineTo(40, -12); c.stroke(); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(-27, -16, 7, 3); c.fillRect(10, -16, 7, 3); }
  if (look.glasses === 'shades') { c.fillStyle = '#0c0c0c'; rrect(c, -32, -20, 27, 18, 6); c.fill(); rrect(c, 5, -20, 27, 18, 6); c.fill(); c.strokeStyle = '#0c0c0c'; c.lineWidth = 4; c.beginPath(); c.moveTo(-6, -13); c.lineTo(6, -13); c.stroke(); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-26, -17, 10, 3); c.fillRect(11, -17, 10, 3); }
  if (look.mask) { c.fillStyle = '#2a2a2a'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 22, 26, 22, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#c83a2a'; c.beginPath(); c.arc(-22, 30, 11, 0, TAU); c.arc(22, 30, 11, 0, TAU); c.fill(); c.stroke(); }
  // hats
  const hc = look.hatColor || '#333'; c.strokeStyle = INK; c.lineWidth = 3;
  if (look.hat === 'beanie') { c.fillStyle = hc; c.beginPath(); c.ellipse(0, -34, 43, 34, 0, PI, TAU); c.fill(); c.stroke(); c.fillStyle = shade(hc, -0.25); rrect(c, -45, -40, 90, 16, 5); c.fill(); c.stroke(); }
  if (look.hat === 'porkpie') { c.fillStyle = hc; c.beginPath(); c.ellipse(0, -40, 64, 12, 0, 0, TAU); c.fill(); c.stroke(); rrect(c, -36, -82, 72, 44, 6); c.fill(); c.stroke(); c.fillStyle = '#383838'; c.fillRect(-36, -52, 72, 10); }
  if (look.hat === 'cap') { c.fillStyle = hc; c.beginPath(); c.ellipse(0, -36, 42, 30, 0, PI, TAU); c.fill(); c.stroke(); c.beginPath(); c.ellipse(0, -36, 48, 9, 0, 0, PI); c.fill(); c.stroke(); }
  if (look.hat === 'cowboy') { c.fillStyle = hc; c.beginPath(); c.moveTo(-74, -38); c.quadraticCurveTo(0, -54, 74, -38); c.quadraticCurveTo(0, -26, -74, -38); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-36, -42); c.lineTo(-30, -92); c.quadraticCurveTo(0, -78, 30, -92); c.lineTo(36, -42); c.closePath(); c.fill(); c.stroke(); c.fillStyle = shade(hc, -0.4); c.fillRect(-35, -56, 70, 9); }
  if (look.hat === 'bandana') { c.fillStyle = hc; c.beginPath(); c.ellipse(0, -36, 42, 28, 0, PI, TAU); c.fill(); c.stroke(); }
  if (look.hat === 'helmet') { c.fillStyle = hc; c.beginPath(); c.ellipse(0, -30, 46, 40, 0, PI, TAU); c.fill(); c.stroke(); }
  if (look.hat === 'balaclava') { c.fillStyle = hc; c.beginPath(); c.ellipse(0, -8, 42, 52, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = skin; rrect(c, -30, -20, 60, 18, 8); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-15, -11, 7, 4.5, 0, 0, TAU); c.ellipse(15, -11, 7, 4.5, 0, 0, TAU); c.fill(); c.fillStyle = '#222'; c.beginPath(); c.arc(-14, -11, 3, 0, TAU); c.arc(16, -11, 3, 0, TAU); c.fill(); }
  c.restore();
  c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 2; rrect(c, 1, 1, s - 2, s - 2, 10); c.stroke();
  c.restore();
}

// ---------- the RV ----------
// origin = rear wheel-base ground point at rear of body; faces right; ~390 long
function drawRV(c, x, y, o = {}) {
  const bob = o.bob || 0, rot = o.wheel || 0;
  c.save(); c.translate(x, y);
  // shadow
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(195, 2, 210, 10, 0, 0, TAU); c.fill();
  c.translate(0, bob);
  const body = o.dirty ? '#ddd3b4' : '#e9e2c9';
  c.strokeStyle = INK; c.lineWidth = 3;
  // main box
  c.fillStyle = body;
  c.beginPath(); c.moveTo(4, -40); c.lineTo(4, -168); c.quadraticCurveTo(4, -176, 14, -176); c.lineTo(350, -176); c.quadraticCurveTo(366, -176, 366, -160);
  c.lineTo(366, -128); c.lineTo(340, -128); c.lineTo(386, -96); c.quadraticCurveTo(394, -90, 394, -78); c.lineTo(394, -40); c.closePath(); c.fill(); c.stroke();
  // under-skirt
  c.fillStyle = '#b8ae90'; c.fillRect(4, -48, 390, 10);
  // stripes
  c.fillStyle = '#7a4f2c'; c.fillRect(5, -104, 335, 9); c.fillStyle = '#c99556'; c.fillRect(5, -94, 335, 6); c.fillStyle = '#e0b878'; c.fillRect(5, -88, 335, 4);
  c.fillStyle = '#7a4f2c'; c.beginPath(); c.moveTo(340, -104); c.lineTo(375, -104); c.lineTo(383, -95); c.lineTo(340, -95); c.fill();
  // windows
  const win = (wx, wy, ww, wh) => {
    c.fillStyle = o.lit ? '#f7c65c' : '#2a3540'; rrect(c, wx, wy, ww, wh, 5); c.fill(); c.lineWidth = 3; c.stroke();
    if (o.lit) { c.fillStyle = 'rgba(255,240,180,.5)'; c.fillRect(wx + 3, wy + 3, ww - 6, 6); } else { c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(wx + 6, wy + wh - 4); c.lineTo(wx + ww * 0.4, wy + 4); c.lineTo(wx + ww * 0.55, wy + 4); c.lineTo(wx + 14, wy + wh - 4); c.fill(); }
    if (o.foil) { c.fillStyle = '#c8ccd0'; c.fillRect(wx + 3, wy + 3, ww - 6, wh - 6); c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(wx + 4, wy + 6 + i * (wh / 4)); c.lineTo(wx + ww - 4, wy + 3 + i * (wh / 4)); c.stroke(); } c.strokeStyle = INK; }
  };
  win(26, -156, 70, 40); win(110, -156, 60, 40); win(262, -158, 56, 30);
  // windshield + cab window
  c.fillStyle = '#3a4a58'; c.beginPath(); c.moveTo(344, -124); c.lineTo(380, -98); c.lineTo(380, -84); c.lineTo(344, -84); c.closePath(); c.fill(); c.lineWidth = 3; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.moveTo(350, -116); c.lineTo(362, -106); c.lineTo(352, -96); c.fill();
  if (o.driver) { c.fillStyle = o.driver.skin; c.beginPath(); c.arc(360, -102, 7, 0, TAU); c.fill(); if (o.driver.glasses) { c.fillStyle = '#222'; c.fillRect(361, -105, 6, 2); } }
  // door
  c.fillStyle = shade(body, -0.05); rrect(c, 194, -160, 50, 116, 4); c.fill(); c.lineWidth = 2.5; c.stroke();
  c.fillStyle = o.lit ? '#f7c65c' : '#2a3540'; rrect(c, 202, -150, 34, 28, 4); c.fill(); c.stroke();
  c.fillStyle = '#9aa0a6'; c.fillRect(232, -104, 8, 4); c.strokeRect(232, -104, 8, 4);
  c.fillStyle = '#7a7a70'; c.fillRect(196, -42, 46, 6);
  // roof stuff
  c.fillStyle = '#d8d2bc'; rrect(c, 120, -192, 66, 18, 3); c.fill(); c.lineWidth = 2.5; c.stroke();
  c.strokeStyle = '#555'; c.lineWidth = 1.5; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(126 + i * 10, -190); c.lineTo(126 + i * 10, -177); c.stroke(); }
  c.fillStyle = '#8a8a80'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(60, -186, 10, 10); c.strokeRect(60, -186, 10, 10); // vent chimney
  // ladder
  c.strokeStyle = '#8a8f94'; c.lineWidth = 3; c.beginPath(); c.moveTo(-2, -170); c.lineTo(-2, -50); c.moveTo(-10, -170); c.lineTo(-10, -50); for (let i = 0; i < 8; i++) { c.moveTo(-10, -160 + i * 15); c.lineTo(-2, -160 + i * 15); } c.stroke();
  // rust + dirt
  c.fillStyle = 'rgba(140,80,30,.35)'; c.beginPath(); c.ellipse(60, -54, 22, 6, 0, 0, TAU); c.ellipse(300, -60, 14, 5, 0, 0, TAU); c.ellipse(170, -70, 8, 3, 0, 0, TAU); c.fill();
  if (o.holes) { c.fillStyle = '#111'; for (const h of o.holes) { c.beginPath(); c.arc(h[0], h[1], 2.5, 0, TAU); c.fill(); } }
  // bumpers + lights
  c.fillStyle = '#9aa0a6'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(384, -50, 16, 10); c.strokeRect(384, -50, 16, 10); c.fillRect(-6, -48, 14, 9); c.strokeRect(-6, -48, 14, 9);
  c.fillStyle = o.headlights ? '#fff6c0' : '#e8e0a0'; c.fillRect(388, -74, 7, 11); c.fillStyle = '#c0281c'; c.fillRect(4, -76, 6, 14);
  c.fillStyle = '#9aa0a6'; c.fillRect(372, -124, 4, 22); c.fillRect(368, -126, 12, 8);
  // wheel wells + wheels
  for (const wx of [86, 318]) {
    c.fillStyle = '#2a2622'; c.beginPath(); c.arc(wx, -36, 31, PI, TAU); c.fill();
    c.save(); c.translate(wx, -bob - 22 + 0); c.translate(0, -0);
    c.fillStyle = '#151515'; c.beginPath(); c.arc(0, 0, 24, 0, TAU); c.fill(); c.strokeStyle = '#333'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#b8bec4'; c.beginPath(); c.arc(0, 0, 12, 0, TAU); c.fill();
    c.rotate(rot); c.strokeStyle = '#6a7076'; c.lineWidth = 2.5; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(i * TAU / 5) * 11, Math.sin(i * TAU / 5) * 11); c.stroke(); }
    c.fillStyle = '#444'; c.beginPath(); c.arc(0, 0, 3, 0, TAU); c.fill();
    c.restore();
  }
  c.restore();
}

// ---------- props ----------
function drawCrate(c, x, y, w, h, style = 'wood') {
  c.save(); c.translate(x, y);
  if (style === 'wood') {
    c.fillStyle = '#a8763e'; c.strokeStyle = INK; c.lineWidth = 2.5; c.fillRect(0, 0, w, h); c.strokeRect(0, 0, w, h);
    c.strokeStyle = '#6e4a22'; c.lineWidth = 2; for (let i = 1; i < h / 14; i++) { c.beginPath(); c.moveTo(3, i * 14); c.lineTo(w - 3, i * 14); c.stroke(); }
    c.strokeStyle = '#5a3a18'; c.lineWidth = 5; c.strokeRect(4, 4, w - 8, h - 8); c.beginPath(); c.moveTo(6, 6); c.lineTo(w - 6, h - 6); c.stroke();
  } else if (style === 'cardboard') {
    c.fillStyle = '#c9a26a'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(0, 0, w, h); c.strokeRect(0, 0, w, h);
    c.fillStyle = '#e0c48a'; c.fillRect(w * 0.42, 0, w * 0.16, h); c.fillStyle = '#7a5a2a'; c.font = '10px monospace'; c.fillText('FRAGILE', 4, h - 6);
  } else if (style === 'metal') {
    c.fillStyle = '#5a6670'; c.strokeStyle = INK; c.lineWidth = 2.5; c.fillRect(0, 0, w, h); c.strokeRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 2; for (let i = 8; i < w; i += 12) { c.beginPath(); c.moveTo(i, 3); c.lineTo(i, h - 3); c.stroke(); }
  } else if (style === 'sandbag') {
    c.fillStyle = '#b09a6a'; c.strokeStyle = INK; c.lineWidth = 2;
    for (let r = 0; r < h / 16; r++) for (let i = 0; i < w / 30 + 1; i++) { const bx = i * 30 - (r % 2) * 15, by = h - (r + 1) * 16; if (bx > w - 10 || bx < -10) continue; rrect(c, Math.max(0, bx), by, Math.min(30, w - Math.max(0, bx)), 16, 7); c.fill(); c.stroke(); }
  } else if (style === 'container') {
    c.fillStyle = '#8a3a2a'; c.strokeStyle = INK; c.lineWidth = 3; c.fillRect(0, 0, w, h); c.strokeRect(0, 0, w, h);
    c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 3; for (let i = 10; i < w; i += 14) { c.beginPath(); c.moveTo(i, 4); c.lineTo(i, h - 4); c.stroke(); }
  } else if (style === 'counter') {
    c.fillStyle = '#d8d8d0'; c.strokeStyle = INK; c.lineWidth = 2.5; c.fillRect(0, 0, w, 10); c.strokeRect(0, 0, w, 10);
    c.fillStyle = '#9aa0a6'; c.fillRect(4, 10, w - 8, h - 10); c.strokeRect(4, 10, w - 8, h - 10);
    c.strokeStyle = 'rgba(0,0,0,.3)'; for (let i = 0; i < 3; i++) { c.strokeRect(10 + i * (w - 20) / 3, 18, (w - 20) / 3 - 6, h - 26); }
  }
  c.restore();
}
function drawBarrel(c, x, y, kind) { // x center, y bottom
  c.save(); c.translate(x, y);
  const col = kind === 'red' ? '#c0281c' : kind === 'blue' ? '#2a5aa0' : kind === 'propane' ? '#e8e8e8' : '#5a6a3a';
  if (kind === 'propane') {
    c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 2.5; rrect(c, -14, -52, 28, 52, 12); c.fill(); c.stroke();
    c.fillStyle = '#888'; c.fillRect(-5, -60, 10, 8); c.strokeRect(-5, -60, 10, 8); c.fillStyle = '#c0281c'; c.font = 'bold 9px sans-serif'; c.fillText('LPG', -9, -24);
  } else {
    c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 2.5; rrect(c, -18, -56, 36, 56, 4); c.fill(); c.stroke();
    c.strokeStyle = shade(col, -0.35); c.lineWidth = 3; c.beginPath(); c.moveTo(-17, -40); c.lineTo(17, -40); c.moveTo(-17, -16); c.lineTo(17, -16); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(-12, -54, 5, 52);
    if (kind === 'red') { c.fillStyle = '#ffdd33'; c.beginPath(); c.moveTo(0, -36); c.lineTo(7, -24); c.lineTo(-7, -24); c.closePath(); c.fill(); c.fillStyle = '#222'; c.fillRect(-1, -33, 2, 6); }
    if (kind === 'blue') { c.fillStyle = '#fff'; c.font = 'bold 8px sans-serif'; c.fillText('CHEM', -11, -26); }
  }
  c.restore();
}
function drawCar(c, x, y, w, col, kind = 'sedan', f = 1) { // x left, y ground
  c.save(); c.translate(x + (f < 0 ? w : 0), y); c.scale(f, 1);
  const s = w / 230;
  c.scale(s, s);
  c.strokeStyle = INK; c.lineWidth = 3;
  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(115, 2, 120, 7, 0, 0, TAU); c.fill();
  c.fillStyle = col;
  if (kind === 'pickup') {
    c.beginPath(); c.moveTo(4, -22); c.lineTo(4, -60); c.lineTo(120, -60); c.lineTo(126, -96); c.lineTo(180, -96); c.lineTo(196, -64); c.lineTo(226, -58); c.lineTo(228, -22); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#2a3540'; c.beginPath(); c.moveTo(132, -90); c.lineTo(176, -90); c.lineTo(188, -66); c.lineTo(130, -66); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = shade(col, -0.3); c.beginPath(); c.moveTo(118, -58); c.lineTo(118, -24); c.stroke();
  } else {
    c.beginPath(); c.moveTo(4, -24); c.lineTo(6, -56); c.lineTo(52, -62); c.lineTo(80, -94); c.lineTo(160, -94); c.lineTo(186, -62); c.lineTo(224, -56); c.lineTo(228, -24); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#2a3540'; c.beginPath(); c.moveTo(86, -88); c.lineTo(118, -88); c.lineTo(118, -64); c.lineTo(64, -64); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(124, -88); c.lineTo(156, -88); c.lineTo(176, -64); c.lineTo(124, -64); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = shade(col, -0.3); c.lineWidth = 2; c.beginPath(); c.moveTo(120, -60); c.lineTo(120, -26); c.moveTo(70, -60); c.lineTo(68, -26); c.stroke();
  }
  c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(10, -54, 210, 5);
  c.fillStyle = '#ddd'; c.fillRect(222, -50, 8, 8); c.fillStyle = '#b02020'; c.fillRect(2, -50, 6, 8);
  c.fillStyle = '#888'; c.fillRect(-2, -30, 14, 8); c.fillRect(220, -30, 14, 8);
  for (const wx of [46, 184]) { c.fillStyle = '#1a1714'; c.beginPath(); c.arc(wx, -24, 26, PI, TAU); c.fill(); c.fillStyle = '#151515'; c.beginPath(); c.arc(wx, -20, 20, 0, TAU); c.fill(); c.fillStyle = '#9aa0a6'; c.beginPath(); c.arc(wx, -20, 9, 0, TAU); c.fill(); }
  c.restore();
}
function drawCactus(c, x, y, h, col = '#4f6a3a') {
  c.save(); c.translate(x, y); c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 2.5;
  rrect(c, -9, -h, 18, h, 9); c.fill(); c.stroke();
  rrect(c, -30, -h * 0.65, 10, h * 0.35, 5); c.fill(); c.stroke(); rrect(c, -30, -h * 0.38, 24, 10, 5); c.fill(); c.stroke();
  rrect(c, 20, -h * 0.8, 10, h * 0.4, 5); c.fill(); c.stroke(); rrect(c, 6, -h * 0.5, 24, 10, 5); c.fill(); c.stroke();
  c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-2, -h + 8); c.lineTo(-2, -4); c.moveTo(3, -h + 8); c.lineTo(3, -4); c.stroke();
  c.restore();
}
function drawLamp(c, x, y, h, on) {
  c.save(); c.translate(x, y); c.strokeStyle = '#3a3a3a'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -h); c.lineTo(26, -h - 4); c.stroke();
  c.fillStyle = on ? '#fff3c0' : '#777'; c.fillRect(18, -h - 4, 18, 6); c.restore();
}

// ---------- scenery (parallax layers, prerendered) ----------
const THEMES = {};
function skyCanvas(stops, extra) {
  const cv = makeCanvas(W, H), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, GROUND); stops.forEach(([t, col]) => g.addColorStop(t, col)); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (extra) extra(c);
  return cv;
}
function mesaLayer(w, h, base, col, col2, seed, roughness = 1) {
  const cv = makeCanvas(w, h), c = cv.getContext('2d'), r = srand(seed);
  c.fillStyle = col; c.beginPath(); c.moveTo(0, h);
  let x = 0, y = base;
  while (x < w) {
    const kind = r();
    if (kind < 0.35) { // mesa: cliff up, flat top, cliff down
      const top = base - (40 + r() * 120) * roughness, wid = 80 + r() * 200;
      c.lineTo(x + 10, y); c.lineTo(x + 25, top + 10); c.lineTo(x + 30, top); c.lineTo(x + 30 + wid, top + r() * 6); c.lineTo(x + 38 + wid, top + 14); c.lineTo(x + 52 + wid, base);
      x += 60 + wid; y = base;
    } else { const nx = x + 40 + r() * 90; y = base - r() * 30 * roughness; c.lineTo(nx, y); x = nx; }
  }
  c.lineTo(w, base); c.lineTo(w, h); c.closePath(); c.fill();
  // strata
  c.globalCompositeOperation = 'source-atop'; c.fillStyle = col2;
  for (let i = 0; i < 9; i++) { c.globalAlpha = 0.25 + r() * 0.2; c.fillRect(0, base - 160 + i * 18 + r() * 6, w, 3 + r() * 4); }
  c.globalAlpha = 0.35; const g = c.createLinearGradient(0, base - 150, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, col2); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  return cv;
}
function scrubLayer(w, h, base, col, seed, cacti = true, poles = false) {
  const cv = makeCanvas(w, h), c = cv.getContext('2d'), r = srand(seed);
  c.fillStyle = col; c.fillRect(0, base, w, h - base);
  for (let i = 0; i < w / 40; i++) { const x = r() * w, s = 6 + r() * 14; c.beginPath(); c.ellipse(x, base, s * 1.6, s, 0, PI, TAU); c.fill(); }
  if (cacti) for (let i = 0; i < w / 260; i++) { const x = r() * w; c.save(); c.globalAlpha = 1; const hh = 40 + r() * 50; c.fillStyle = col; rrect(c, x - 6, base - hh, 12, hh, 6); c.fill(); rrect(c, x - 20, base - hh * 0.7, 8, hh * 0.3, 4); c.fill(); rrect(c, x - 20, base - hh * 0.45, 18, 7, 3); c.fill(); rrect(c, x + 12, base - hh * 0.85, 8, hh * 0.35, 4); c.fill(); rrect(c, x + 4, base - hh * 0.55, 16, 7, 3); c.fill(); c.restore(); }
  if (poles) { c.strokeStyle = col; c.lineWidth = 4; for (let x = 60; x < w; x += 340) { c.beginPath(); c.moveTo(x, base); c.lineTo(x, base - 120); c.moveTo(x - 18, base - 110); c.lineTo(x + 18, base - 110); c.stroke(); } c.lineWidth = 1; c.beginPath(); for (let x = 60; x < w; x += 340) { c.moveTo(x - 16, base - 108); c.quadraticCurveTo(x + 170, base - 80, x + 324, base - 108); } c.stroke(); }
  return cv;
}
function stars(c, n, seed) { const r = srand(seed); for (let i = 0; i < n; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`; const s = r() < 0.1 ? 2 : 1; c.fillRect(r() * W, r() * GROUND * 0.8, s, s); } }
function groundTile(kind) {
  const cv = makeCanvas(512, H - GROUND + 40), c = cv.getContext('2d'), r = srand(kind.length * 99);
  const hgt = cv.height;
  const spec = (base, dots) => { c.fillStyle = base; c.fillRect(0, 0, 512, hgt); for (let i = 0; i < 700; i++) { c.fillStyle = choose(dots); c.globalAlpha = 0.25 + r() * 0.4; c.fillRect(r() * 512, r() * hgt, 1 + r() * 3, 1 + r() * 2); } c.globalAlpha = 1; };
  switch (kind) {
    case 'sand': spec('#c99a62', ['#a87a46', '#e0b57c', '#8a6236']); c.fillStyle = '#e2b67e'; c.fillRect(0, 0, 512, 5); c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(0, 5, 512, 3); break;
    case 'dirt': spec('#8a6a48', ['#6a4e32', '#a8865e', '#4a3a28']); c.fillStyle = '#9a7a56'; c.fillRect(0, 0, 512, 4); break;
    case 'asphalt': spec('#3a3a3e', ['#2a2a2e', '#55555a', '#222']); c.fillStyle = '#5a5a5e'; c.fillRect(0, 0, 512, 4); c.fillStyle = '#e8d070'; for (let x = 0; x < 512; x += 128) c.fillRect(x + 20, 46, 70, 6); break;
    case 'concrete': spec('#8a8c8e', ['#7a7c7e', '#9a9c9e', '#6a6c6e']); c.fillStyle = '#a8aaac'; c.fillRect(0, 0, 512, 4); c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 2; for (let x = 0; x < 512; x += 128) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, hgt); c.stroke(); } break;
    case 'tile': spec('#d8d8d0', ['#c8c8c0', '#e8e8e0']); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; for (let x = 0; x < 512; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, hgt); c.stroke(); } for (let y = 0; y < hgt; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(512, y); c.stroke(); } c.fillStyle = '#e8e8e2'; c.fillRect(0, 0, 512, 4); break;
    case 'grass': spec('#8a7a4a', ['#6a6a3a', '#a89a5a', '#5a5a2a']); c.fillStyle = '#6a7a3a'; c.fillRect(0, 0, 512, 6); for (let i = 0; i < 200; i++) { c.fillStyle = '#5a6a2a'; c.fillRect(r() * 512, 0, 2, 4 + r() * 6); } break;
    case 'wood': c.fillStyle = '#6a4a2e'; c.fillRect(0, 0, 512, hgt); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 2; for (let y = 0; y < hgt; y += 14) { c.beginPath(); c.moveTo(0, y); c.lineTo(512, y); c.stroke(); for (let x = (y / 14 % 2) * 60; x < 512; x += 120) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 14); c.stroke(); } } c.fillStyle = '#8a6a48'; c.fillRect(0, 0, 512, 4); break;
  }
  return cv;
}
function wallLayer(kind, w = 1024) {
  const cv = makeCanvas(w, GROUND), c = cv.getContext('2d'), r = srand(w + kind.length * 7);
  if (kind === 'brick') {
    c.fillStyle = '#4a2e24'; c.fillRect(0, 0, w, GROUND);
    for (let y = 0; y < GROUND; y += 18) for (let x = -(y / 18 % 2) * 22; x < w; x += 44) { c.fillStyle = shade('#6a3a2a', (r() - 0.5) * 0.3); c.fillRect(x + 2, y + 2, 40, 14); }
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, w, GROUND);
    for (let x = 80; x < w; x += 320) { // high windows with moonlight
      c.fillStyle = '#1a2a44'; c.fillRect(x, 90, 150, 110); c.strokeStyle = '#222'; c.lineWidth = 6; c.strokeRect(x, 90, 150, 110);
      c.beginPath(); c.moveTo(x + 75, 90); c.lineTo(x + 75, 200); c.moveTo(x, 145); c.lineTo(x + 150, 145); c.stroke();
      c.fillStyle = 'rgba(140,170,230,.25)'; c.fillRect(x + 4, 94, 142, 102);
    }
    c.fillStyle = '#2a2a2a'; c.fillRect(0, 30, w, 14); c.fillRect(0, 300, w, 8);
    for (let x = 0; x < w; x += 200) { c.fillStyle = '#333'; c.fillRect(x, 300, 10, GROUND - 300); }
    // shelving silhouettes
    c.fillStyle = 'rgba(10,10,10,.55)'; for (let x = 40; x < w; x += 260) { c.fillRect(x, 380, 160, 6); c.fillRect(x, 450, 160, 6); c.fillRect(x, 520, 160, 6); c.fillRect(x, 370, 6, 240); c.fillRect(x + 154, 370, 6, 240); for (let i = 0; i < 6; i++) c.fillRect(x + 10 + i * 24, 386 + (i % 3) * 70, 18, 50 - (i % 2) * 20); }
  } else if (kind === 'lab') {
    c.fillStyle = '#7a8288'; c.fillRect(0, 0, w, GROUND);
    for (let x = 0; x < w; x += 128) { c.fillStyle = shade('#7a8288', (r() - 0.5) * 0.12); c.fillRect(x + 2, 0, 124, GROUND); c.fillStyle = 'rgba(0,0,0,.2)'; for (let y = 20; y < GROUND; y += 60) { c.beginPath(); c.arc(x + 8, y, 2, 0, TAU); c.arc(x + 120, y, 2, 0, TAU); c.fill(); } }
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, w, GROUND);
    for (let x = 60; x < w; x += 340) { // big steel tanks
      c.fillStyle = '#b8c0c6'; rrect(c, x, 230, 110, 330, 40); c.fill(); c.strokeStyle = '#3a4046'; c.lineWidth = 4; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x + 18, 250, 12, 290); c.fillStyle = '#3a4046'; c.fillRect(x + 20, 556, 10, 54); c.fillRect(x + 80, 556, 10, 54);
      c.fillStyle = '#d8b020'; c.fillRect(x + 140, 260, 160, 8); c.fillRect(x + 140, 260, 6, 120); c.fillRect(x + 294, 260, 6, 120); c.fillRect(x + 140, 320, 160, 5);
    }
    c.strokeStyle = '#4a5056'; c.lineWidth = 10; c.beginPath(); c.moveTo(0, 150); c.lineTo(w, 150); c.moveTo(0, 190); c.lineTo(w, 190); c.stroke();
  } else if (kind === 'motel') {
    c.fillStyle = '#c8a07a'; c.fillRect(0, 200, w, GROUND - 200);
    c.fillStyle = '#6a3a2a'; c.fillRect(0, 186, w, 22);
    for (let x = 20, n = 1; x < w; x += 170, n++) {
      c.fillStyle = '#3a6a7a'; c.fillRect(x, 300, 70, 140 + 170); c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(x, 300, 70, 310);
      c.fillStyle = '#e8d8a0'; c.font = 'bold 18px sans-serif'; c.fillText(String(n), x + 28, 330);
      c.fillStyle = '#1a2030'; c.fillRect(x + 90, 330, 64, 60); c.fillStyle = 'rgba(255,200,120,' + (r() < 0.4 ? 0.7 : 0.05) + ')'; c.fillRect(x + 94, 334, 56, 52);
    }
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 200, w, GROUND - 200);
  } else if (kind === 'hacienda') {
    c.fillStyle = '#e8d2a8'; c.fillRect(0, 260, w, GROUND - 260); c.fillStyle = '#b4552e'; c.fillRect(0, 240, w, 24);
    for (let x = 30; x < w; x += 150) { c.fillStyle = '#5a3a24'; c.beginPath(); c.moveTo(x, GROUND); c.lineTo(x, 380); c.arc(x + 50, 380, 50, PI, TAU); c.lineTo(x + 100, GROUND); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(0, 260, w, GROUND - 260);
  } else if (kind === 'junk') {
    for (let i = 0; i < 18; i++) { const x = r() * w, hh = 60 + r() * 140, ww = 120 + r() * 160; c.fillStyle = shade('#3a2e2a', (r() - 0.5) * 0.3); c.beginPath(); c.moveTo(x - ww / 2, GROUND); c.lineTo(x - ww * 0.3, GROUND - hh * 0.8); c.lineTo(x, GROUND - hh); c.lineTo(x + ww * 0.3, GROUND - hh * 0.7); c.lineTo(x + ww / 2, GROUND); c.fill(); for (let k = 0; k < 4; k++) { c.fillStyle = shade(choose(['#8a3a2a', '#3a5a7a', '#6a6a3a', '#7a7a7a']), -0.4); c.fillRect(x - ww * 0.3 + r() * ww * 0.5, GROUND - hh * r() * 0.9, 40, 16); } }
    c.strokeStyle = 'rgba(40,40,40,.8)'; c.lineWidth = 1; for (let x = 0; x < w; x += 12) { c.beginPath(); c.moveTo(x, GROUND - 110); c.lineTo(x + 12, GROUND); c.moveTo(x + 12, GROUND - 110); c.lineTo(x, GROUND); c.stroke(); }
    c.fillStyle = '#333'; for (let x = 0; x < w; x += 160) c.fillRect(x, GROUND - 120, 5, 120); c.fillRect(0, GROUND - 120, w, 3);
  } else if (kind === 'town') {
    let x = 0; const cols = ['#c8925a', '#a8b0a0', '#d8c8a0', '#8a6a5a', '#b8a080'];
    while (x < w) { const ww = 160 + r() * 140, hh = 180 + r() * 120, col = choose(cols); c.fillStyle = col; c.fillRect(x, GROUND - hh, ww, hh); c.fillStyle = shade(col, -0.3); c.fillRect(x, GROUND - hh, ww, 10); c.fillStyle = '#2a3540'; c.fillRect(x + 20, GROUND - 120, ww - 40, 70); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x + 24, GROUND - 116, (ww - 48) / 2, 62); c.fillStyle = shade(col, -0.4); c.fillRect(x + 14, GROUND - 140, ww - 28, 14); x += ww + 6 + r() * 30; }
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(0, 0, w, GROUND);
  } else if (kind === 'compound') {
    for (let x = 40; x < w; x += 420) { c.fillStyle = '#6a6a62'; c.fillRect(x, GROUND - 230, 300, 230); c.fillStyle = '#4a4a44'; c.beginPath(); c.moveTo(x - 10, GROUND - 230); c.lineTo(x + 150, GROUND - 290); c.lineTo(x + 310, GROUND - 230); c.fill(); c.fillStyle = '#3a3a36'; c.fillRect(x + 40, GROUND - 160, 120, 160); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 2; for (let y = GROUND - 160; y < GROUND; y += 12) { c.beginPath(); c.moveTo(x + 40, y); c.lineTo(x + 160, y); c.stroke(); } c.fillStyle = '#f0c060'; c.fillRect(x + 200, GROUND - 170, 60, 40); }
    c.strokeStyle = '#555'; c.lineWidth = 1; for (let x = 0; x < w; x += 10) { c.beginPath(); c.moveTo(x, GROUND - 90); c.lineTo(x + 10, GROUND); c.moveTo(x + 10, GROUND - 90); c.lineTo(x, GROUND); c.stroke(); }
    c.strokeStyle = '#777'; c.lineWidth = 2; for (let x = 0; x < w; x += 6) { c.beginPath(); c.arc(x, GROUND - 96, 3, 0, TAU); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(0, 0, w, GROUND);
  }
  return cv;
}

function buildThemes(progress) {
  const steps = [
    ['day', () => ({
      sky: skyCanvas([[0, '#4f93d0'], [0.6, '#9cc6e6'], [1, '#f2d7a8']], c => { const g = c.createRadialGradient(980, 130, 10, 980, 130, 220); g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(0.15, 'rgba(255,240,190,.8)'); g.addColorStop(1, 'rgba(255,230,180,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }),
      layers: [{ c: mesaLayer(2048, GROUND, GROUND - 40, '#c78e6a', '#9a5f47', 11, 1.2), f: 0.08 }, { c: mesaLayer(2048, GROUND, GROUND - 10, '#b9744e', '#7e4a33', 23, 0.7), f: 0.2 }, { c: scrubLayer(2048, GROUND + 4, GROUND, '#8a7448', 5, true, true), f: 0.5 }],
      ground: groundTile('sand'), dark: 0, haze: 'rgba(255,220,170,.10)'
    })],
    ['dusk', () => ({
      sky: skyCanvas([[0, '#1e1b44'], [0.45, '#7a3a5e'], [0.8, '#f07a46'], [1, '#ffc27a']], c => { stars(c, 60, 3); const g = c.createRadialGradient(300, 520, 10, 300, 520, 260); g.addColorStop(0, 'rgba(255,200,120,1)'); g.addColorStop(0.12, 'rgba(255,170,90,.8)'); g.addColorStop(1, 'rgba(255,120,60,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }),
      layers: [{ c: mesaLayer(2048, GROUND, GROUND - 40, '#5a2e44', '#2a1630', 12, 1.2), f: 0.08 }, { c: mesaLayer(2048, GROUND, GROUND - 10, '#3a1e2e', '#1a0e18', 29, 0.7), f: 0.2 }, { c: scrubLayer(2048, GROUND + 4, GROUND, '#2a1a1a', 8, true, true), f: 0.5 }],
      ground: groundTile('sand'), dark: 0.18, haze: 'rgba(255,120,80,.10)'
    })],
    ['night', () => ({
      sky: skyCanvas([[0, '#04060f'], [0.7, '#111a36'], [1, '#26305a']], c => { stars(c, 260, 7); c.fillStyle = '#f0ecd8'; c.beginPath(); c.arc(1020, 110, 34, 0, TAU); c.fill(); c.fillStyle = '#111a36'; c.beginPath(); c.arc(1034, 102, 30, 0, TAU); c.fill(); }),
      layers: [{ c: mesaLayer(2048, GROUND, GROUND - 40, '#141a30', '#080a18', 13, 1.2), f: 0.08 }, { c: mesaLayer(2048, GROUND, GROUND - 10, '#0e1224', '#05060e', 31, 0.7), f: 0.2 }, { c: scrubLayer(2048, GROUND + 4, GROUND, '#0a0c16', 9, true, true), f: 0.5 }],
      ground: groundTile('sand'), dark: 0.72, haze: null
    })],
    ['junkyard', () => ({
      sky: skyCanvas([[0, '#2a2348'], [0.5, '#8a4a5a'], [1, '#f0a060']], c => stars(c, 30, 4)),
      layers: [{ c: mesaLayer(2048, GROUND, GROUND - 40, '#4a2a3a', '#2a1628', 14, 1), f: 0.08 }, { c: wallLayer('junk', 1600), f: 0.55 }],
      ground: groundTile('dirt'), dark: 0.25, haze: 'rgba(255,140,90,.08)'
    })],
    ['warehouse', () => ({ sky: skyCanvas([[0, '#0a0c14'], [1, '#14161e']]), layers: [{ c: wallLayer('brick', 1280), f: 0.7 }], ground: groundTile('concrete'), dark: 0.78, interior: true })],
    ['motel', () => ({
      sky: skyCanvas([[0, '#04060f'], [1, '#1e2648']], c => stars(c, 140, 2)),
      layers: [{ c: mesaLayer(2048, GROUND, GROUND - 60, '#0e1224', '#05060e', 33, 1), f: 0.1 }, { c: wallLayer('motel', 1360), f: 0.75 }],
      ground: groundTile('asphalt'), dark: 0.6
    })],
    ['lab', () => ({ sky: skyCanvas([[0, '#1a1e22'], [1, '#2a3034']]), layers: [{ c: wallLayer('lab', 1360), f: 0.7 }], ground: groundTile('tile'), dark: 0.3, interior: true })],
    ['ranch', () => ({
      sky: skyCanvas([[0, '#3f88cc'], [0.7, '#a8d0ea'], [1, '#f0e0b8']]),
      layers: [{ c: mesaLayer(2048, GROUND, GROUND - 60, '#8a8a6a', '#5a6a4a', 41, 0.8), f: 0.08 }, { c: wallLayer('hacienda', 1500), f: 0.6 }],
      ground: groundTile('grass'), dark: 0, haze: 'rgba(255,240,200,.08)'
    })],
    ['compound', () => ({
      sky: skyCanvas([[0, '#2a2040'], [0.6, '#a04a3a'], [1, '#f09a50']], c => stars(c, 20, 6)),
      layers: [{ c: mesaLayer(2048, GROUND, GROUND - 50, '#4a2a2e', '#2a161c', 51, 1.1), f: 0.08 }, { c: wallLayer('compound', 1680), f: 0.6 }],
      ground: groundTile('dirt'), dark: 0.22, haze: 'rgba(255,130,80,.1)'
    })],
    ['town', () => ({
      sky: skyCanvas([[0, '#5a9ad4'], [1, '#f0d8b0']]),
      layers: [{ c: mesaLayer(2048, GROUND, GROUND - 40, '#c78e6a', '#9a5f47', 61, 1), f: 0.08 }, { c: wallLayer('town', 1600), f: 0.6 }],
      ground: groundTile('asphalt'), dark: 0
    })],
    ['highway', () => ({
      sky: skyCanvas([[0, '#4f93d0'], [0.6, '#9cc6e6'], [1, '#f2d7a8']]),
      layers: [{ c: mesaLayer(2048, GROUND, GROUND - 40, '#c78e6a', '#9a5f47', 71, 1.3), f: 0.06 }, { c: mesaLayer(2048, GROUND, GROUND - 10, '#b9744e', '#7e4a33', 72, 0.6), f: 0.18 }, { c: scrubLayer(2048, GROUND + 4, GROUND, '#8a7448', 73, true, true), f: 0.45 }],
      ground: groundTile('asphalt'), dark: 0, haze: 'rgba(255,220,170,.10)'
    })],
  ];
  return steps;
}

function drawBackdrop(c, th, camX, yOff = 0) {
  c.drawImage(th.sky, 0, 0);
  if (yOff) { c.save(); c.translate(0, yOff); }
  for (const L of th.layers) {
    const w = L.c.width, off = -((camX * L.f) % w + w) % w;
    for (let x = off; x < W; x += w) c.drawImage(L.c, Math.floor(x), 0);
  }
  if (th.haze) { c.fillStyle = th.haze; c.fillRect(0, -yOff, W, GROUND + yOff); }
  if (yOff) c.restore();
}
function drawGround(c, th, camX, camY = 0) {
  const g = th.ground, w = g.width, off = -((camX % w) + w) % w;
  for (let x = off; x < W; x += w) c.drawImage(g, Math.floor(x), GROUND - camY);
}
