// ============================================================
//  FIXING GOOD 3D - 2D overlay: HUD/UI helpers, portraits, looks, gun icons
// ============================================================
import { W, H, PI, TAU, clamp, lerp, rand, randi, choose, srand, Input, Audio } from './core.js';
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
function wrapText(c, text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '', yy = y;
  for (const w of words) { const test = line ? line + ' ' + w : w; if (c.measureText(test).width > maxW && line) { c.fillText(line, x, yy); line = w; yy += lh; } else line = test; }
  if (line) c.fillText(line, x, yy);
  return yy;
}
Object.assign(LOOKS, {
  kev: { name: 'Krazy Kev', skin: '#e2b08a', hair: 'none', hat: 'cap', hatColor: '#c02a2a', beard: 'stubble', beardColor: '#6a4a2a', shirt: '#2a2a2a', sleeves: 'short', tattoo: true, pants: '#3a4a6a', shoes: '#eee', build: 0.95, chain: true },
  dimitri: { name: 'Dimitri', skin: '#d8a27e', hair: 'none', beard: 'full', beardColor: '#3a2a1a', shirt: '#5a6a8a', sleeves: 'short', vest: '#2a2a2a', pants: '#2a2a2a', shoes: '#111', build: 1.3 },
  goon: { name: 'Goon', skin: '#c58d63', hair: 'buzz', hairColor: '#111', shirt: '#f0f0f0', sleeves: 'short', pants: '#2a3550', shoes: '#111', build: 1.05 },
});
export { INK, LOOKS, lookOf, shade, rrect, GUN_ART, drawMag, drawPortrait, FONT, UI, drawElementTile, drawLogo, smokeField, drawSmoke, wrapText };
