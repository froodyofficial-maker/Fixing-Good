// ============================================================
//  FIXING GOOD 3D - graphics: renderer, environments, textures, models
//  Everything is built in code: no model, texture or image files.
// ============================================================
import * as THREE from 'three';
import { W, H, PI, TAU, clamp, lerp, rand, srand, makeCanvas, G, Settings } from './core.js';
export { THREE };

export let renderer, scene, camera, sun, hemi;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export { V3 };

export function initGfx(container, uiCanvas) {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  renderer.domElement.id = 'gl';
  G.renderer = renderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, W / H, 0.05, 1600);
  hemi = new THREE.HemisphereLight(0xbfd8ff, 0x8a6a48, 0.9); scene.add(hemi);
  sun = new THREE.DirectionalLight(0xfff0d8, 2.4); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  const sc = sun.shadow.camera; sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 260;
  scene.add(sun); scene.add(sun.target);
  const resize = () => {
    const s = Math.min(innerWidth / W, innerHeight / H), w = Math.floor(W * s), h = Math.floor(H * s);
    const x = Math.floor((innerWidth - w) / 2), y = Math.floor((innerHeight - h) / 2);
    G.view = { x, y, w, h, s };
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5) * (Settings.quality || 1));
    renderer.setSize(w, h); Object.assign(renderer.domElement.style, { position: 'absolute', left: x + 'px', top: y + 'px' });
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    uiCanvas.width = Math.round(w * dpr); uiCanvas.height = Math.round(h * dpr);
    Object.assign(uiCanvas.style, { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    G.uiScale = w * dpr / W;
  };
  addEventListener('resize', resize); resize();
}

// ---------- procedural textures ----------
const TEX = {};
function canvasTex(key, w, h, draw, rep = [1, 1]) {
  if (TEX[key]) return TEX[key];
  const cv = makeCanvas(w, h), c = cv.getContext('2d'); draw(c, w, h);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; TEX[key] = t; return t;
}
function speckle(c, w, h, base, cols, n, seed, sz = 3) { const r = srand(seed); c.fillStyle = base; c.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { c.fillStyle = cols[Math.floor(r() * cols.length)]; c.globalAlpha = 0.15 + r() * 0.4; const s = 1 + r() * sz; c.fillRect(r() * w, r() * h, s, s); } c.globalAlpha = 1; }
export const Tex = {
  sand: () => canvasTex('sand', 512, 512, (c, w, h) => { speckle(c, w, h, '#c99a62', ['#a87a46', '#e0b57c', '#8a6236', '#d8aa70'], 9000, 3); const r = srand(9); c.strokeStyle = 'rgba(120,80,40,.10)'; c.lineWidth = 3; for (let i = 0; i < 30; i++) { const y = r() * h; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= w; x += 32) c.lineTo(x, y + Math.sin(x / 40 + i) * 6); c.stroke(); } }),
  dirt: () => canvasTex('dirt', 512, 512, (c, w, h) => speckle(c, w, h, '#8a6a48', ['#6a4e32', '#a8865e', '#4a3a28'], 9000, 5)),
  grass: () => canvasTex('grass', 512, 512, (c, w, h) => { speckle(c, w, h, '#8a7a4a', ['#6a6a3a', '#a89a5a', '#5a6a2a', '#7a8a3a'], 12000, 7); }),
  asphalt: () => canvasTex('asphalt', 512, 512, (c, w, h) => speckle(c, w, h, '#3a3a3e', ['#2a2a2e', '#55555a', '#222', '#4a4a50'], 14000, 11, 2)),
  road: () => canvasTex('road', 512, 256, (c, w, h) => { speckle(c, w, h, '#3a3a3e', ['#2a2a2e', '#55555a', '#222'], 9000, 12, 2); c.fillStyle = '#e8d070'; for (let x = 0; x < w; x += 128) c.fillRect(x + 10, h / 2 - 4, 70, 8); c.fillStyle = '#ddd'; c.fillRect(0, 8, w, 6); c.fillRect(0, h - 14, w, 6); }),
  concrete: () => canvasTex('concrete', 512, 512, (c, w, h) => { speckle(c, w, h, '#8a8c8e', ['#7a7c7e', '#9a9c9e', '#6a6c6e'], 9000, 13); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 3; for (let x = 0; x <= w; x += 256) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); c.beginPath(); c.moveTo(0, x); c.lineTo(w, x); c.stroke(); } }),
  tile: () => canvasTex('tile', 512, 512, (c, w, h) => { speckle(c, w, h, '#d8d8d0', ['#c8c8c0', '#e8e8e0'], 4000, 14); c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 3; for (let x = 0; x <= w; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); c.beginPath(); c.moveTo(0, x); c.lineTo(w, x); c.stroke(); } }),
  wood: () => canvasTex('wood', 256, 256, (c, w, h) => { c.fillStyle = '#a8763e'; c.fillRect(0, 0, w, h); const r = srand(4); for (let y = 0; y < h; y += 32) { c.fillStyle = `hsl(30,${40 + r() * 15}%,${36 + r() * 10}%)`; c.fillRect(0, y + 2, w, 29); c.strokeStyle = 'rgba(60,30,10,.25)'; c.lineWidth = 1; for (let k = 0; k < 6; k++) { const yy = y + 4 + r() * 26; c.beginPath(); c.moveTo(0, yy); c.bezierCurveTo(w * .3, yy + r() * 4 - 2, w * .6, yy - r() * 4, w, yy); c.stroke(); } } c.fillStyle = 'rgba(40,20,5,.6)'; for (let y = 0; y < h; y += 32) c.fillRect(0, y, w, 2); }),
  crate: () => canvasTex('crate', 256, 256, (c, w, h) => { c.drawImage(Tex.wood().image, 0, 0); c.strokeStyle = '#5a3a18'; c.lineWidth = 22; c.strokeRect(11, 11, w - 22, h - 22); c.beginPath(); c.moveTo(16, 16); c.lineTo(w - 16, h - 16); c.stroke(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; c.strokeRect(22, 22, w - 44, h - 44); c.fillStyle = '#333'; for (const [x, y] of [[11, 11], [w - 11, 11], [11, h - 11], [w - 11, h - 11]]) { c.beginPath(); c.arc(x, y, 4, 0, TAU); c.fill(); } }),
  cardboard: () => canvasTex('cardboard', 256, 256, (c, w, h) => { speckle(c, w, h, '#c9a26a', ['#b8905a', '#d8b47c'], 3000, 15); c.fillStyle = '#e0c48a'; c.fillRect(w * 0.42, 0, w * 0.16, h); c.fillStyle = '#7a5a2a'; c.font = 'bold 22px sans-serif'; c.fillText('FRAGILE', 20, h - 24); c.fillText('↑ ↑', 20, 40); }),
  metal: () => canvasTex('metal', 256, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); for (let i = 0; i <= 16; i++) g.addColorStop(i / 16, i % 2 ? '#5a6670' : '#6c7882'); c.fillStyle = g; c.fillRect(0, 0, w, h); speckle(c, w, h, 'rgba(0,0,0,0)', ['#3a444c', '#8a96a0'], 1500, 16); }),
  rust: () => canvasTex('rust', 256, 256, (c, w, h) => { speckle(c, w, h, '#7a4a2a', ['#5a3018', '#9a6040', '#4a2a1a', '#8a5a3a'], 6000, 17, 5); }),
  container: () => canvasTex('container', 256, 256, (c, w, h) => { for (let x = 0; x < w; x += 16) { c.fillStyle = x % 32 ? '#fff' : '#d8d8d8'; c.fillRect(x, 0, 16, h); } speckle(c, w, h, 'rgba(0,0,0,0)', ['#888', '#aaa'], 1200, 18); }),
  brick: () => canvasTex('brick', 512, 512, (c, w, h) => { c.fillStyle = '#4a2e24'; c.fillRect(0, 0, w, h); const r = srand(19); for (let y = 0; y < h; y += 32) for (let x = -(y / 32 % 2) * 40; x < w; x += 80) { c.fillStyle = `hsl(${12 + r() * 10},${35 + r() * 15}%,${26 + r() * 10}%)`; c.fillRect(x + 3, y + 3, 74, 26); } }),
  stucco: (col = '#e8d2a8') => canvasTex('stucco' + col, 256, 256, (c, w, h) => speckle(c, w, h, col, ['rgba(0,0,0,.2)', 'rgba(255,255,255,.3)'], 5000, 20, 2)),
  panel: () => canvasTex('panel', 512, 512, (c, w, h) => { c.fillStyle = '#8a9298'; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 128) { c.fillStyle = `rgba(0,0,0,${0.05 + (x / 128 % 2) * 0.05})`; c.fillRect(x, 0, 128, h); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x, 0, 3, h); for (let y = 24; y < h; y += 96) { c.beginPath(); c.arc(x + 12, y, 3, 0, TAU); c.arc(x + 116, y, 3, 0, TAU); c.fill(); } } }),
  mesa: () => canvasTex('mesa', 256, 512, (c, w, h) => { const r = srand(21); for (let y = 0; y < h; y += 8) { const t = y / h; c.fillStyle = `hsl(${16 + r() * 8},${38 + r() * 12}%,${46 - t * 18 + r() * 8}%)`; c.fillRect(0, y, w, 8 + r() * 6); } c.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 40; i++) c.fillRect(r() * w, 0, 2 + r() * 4, h); }),
  fence: () => { const t = canvasTex('fence', 128, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = '#9aa0a4'; c.lineWidth = 2; for (let i = -w; i < w * 2; i += 16) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + h, h); c.stroke(); c.beginPath(); c.moveTo(i + h, 0); c.lineTo(i, h); c.stroke(); } }); return t; },
  stars: () => canvasTex('starsTex', 64, 64, (c, w, h) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }),
};
// painted facades (one texture per building style)
export function facadeTex(kind) {
  return canvasTex('facade_' + kind, 1024, 512, (c, w, h) => {
    const r = srand(kind.length * 31);
    if (kind === 'motel') {
      c.fillStyle = '#c8a07a'; c.fillRect(0, 0, w, h); speckle(c, w, h, 'rgba(0,0,0,0)', ['rgba(0,0,0,.15)', 'rgba(255,255,255,.2)'], 3000, 22, 2);
      c.fillStyle = '#6a3a2a'; c.fillRect(0, 0, w, 40);
      for (let i = 0; i < 4; i++) { const x = 30 + i * 250; c.fillStyle = '#3a6a7a'; c.fillRect(x, 160, 90, h - 160); c.strokeStyle = '#1a1a1a'; c.lineWidth = 6; c.strokeRect(x, 160, 90, h - 160); c.fillStyle = '#e8d8a0'; c.font = 'bold 34px sans-serif'; c.fillText(String(i + 1 + Math.floor(r() * 4) * 4), x + 30, 210); c.fillStyle = '#e8c060'; c.fillRect(x + 72, 320, 10, 10); c.fillStyle = '#1a2030'; c.fillRect(x + 120, 200, 100, 90); c.fillStyle = r() < 0.5 ? 'rgba(255,190,110,.85)' : 'rgba(40,60,90,.8)'; c.fillRect(x + 126, 206, 88, 78); c.strokeStyle = '#1a1a1a'; c.lineWidth = 4; c.strokeRect(x + 120, 200, 100, 90); }
    } else if (kind === 'hacienda') {
      c.fillStyle = '#e8d2a8'; c.fillRect(0, 0, w, h); speckle(c, w, h, 'rgba(0,0,0,0)', ['rgba(0,0,0,.12)', 'rgba(255,255,255,.2)'], 4000, 23, 3);
      c.fillStyle = '#b4552e'; c.fillRect(0, 0, w, 50); for (let x = 0; x < w; x += 24) { c.fillStyle = x % 48 ? '#a04a28' : '#c46038'; c.fillRect(x, 0, 22, 50); }
      for (let x = 40; x < w; x += 200) { c.fillStyle = '#3a2416'; c.beginPath(); c.moveTo(x, h); c.lineTo(x, 260); c.arc(x + 65, 260, 65, PI, TAU); c.lineTo(x + 130, h); c.fill(); }
    } else if (kind === 'store') {
      let x = 0; const cols = ['#c8925a', '#a8b0a0', '#d8c8a0', '#8a6a5a', '#b8a080'];
      while (x < w) { const ww = 220 + r() * 120, col = cols[Math.floor(r() * cols.length)]; c.fillStyle = col; c.fillRect(x, 0, ww, h); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x, 0, ww, 14); c.fillStyle = '#2a3540'; c.fillRect(x + 24, 240, ww - 48, 200); c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(x + 30, 246, (ww - 60) / 2, 188); c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(x + 16, 200, ww - 32, 30); c.fillStyle = '#f0e0b0'; c.font = 'bold 24px sans-serif'; c.fillText(['PAWN', 'LIQUOR', 'NAILS', 'TACOS', 'CHECKS CASHED', 'LAUNDRY'][Math.floor(r() * 6)], x + 26, 224); x += ww + 4; }
    } else if (kind === 'lab') {
      c.drawImage(Tex.panel().image, 0, 0, w, h); c.fillStyle = '#d8b020'; c.fillRect(0, h - 70, w, 16); c.fillStyle = '#222'; for (let x = 0; x < w; x += 40) { c.beginPath(); c.moveTo(x, h - 70); c.lineTo(x + 20, h - 70); c.lineTo(x + 4, h - 54); c.lineTo(x - 16, h - 54); c.fill(); }
    } else if (kind === 'warehouse') {
      c.drawImage(Tex.brick().image, 0, 0, w, h); for (let x = 60; x < w; x += 330) { c.fillStyle = '#1a2a44'; c.fillRect(x, 60, 200, 150); c.strokeStyle = '#222'; c.lineWidth = 10; c.strokeRect(x, 60, 200, 150); c.beginPath(); c.moveTo(x + 100, 60); c.lineTo(x + 100, 210); c.moveTo(x, 135); c.lineTo(x + 200, 135); c.stroke(); c.fillStyle = 'rgba(140,170,230,.4)'; c.fillRect(x + 6, 66, 188, 138); }
    } else if (kind === 'garage') {
      c.fillStyle = '#6a6a62'; c.fillRect(0, 0, w, h); speckle(c, w, h, 'rgba(0,0,0,0)', ['rgba(0,0,0,.2)', 'rgba(255,255,255,.1)'], 3000, 24, 2);
      for (let x = 40; x < w; x += 340) { c.fillStyle = '#3a3a36'; c.fillRect(x, 170, 240, h - 170); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 3; for (let y = 170; y < h; y += 22) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 240, y); c.stroke(); } c.fillStyle = '#f0c060'; c.fillRect(x + 260, 200, 60, 50); }
    } else if (kind === 'hen') {
      c.fillStyle = '#f2e6c8'; c.fillRect(0, 0, w, h); c.fillStyle = '#c8302a'; c.fillRect(0, 0, w, 90); c.fillStyle = '#ffd040'; c.font = 'bold 64px sans-serif'; c.fillText('THE GOLDEN HEN', 250, 68);
      c.fillStyle = '#2a3540'; c.fillRect(80, 170, 360, 240); c.fillRect(580, 170, 360, 240); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(88, 178, 160, 224); c.fillRect(588, 178, 160, 224); c.fillStyle = '#8a2a1a'; c.fillRect(460, 200, 100, h - 200);
    }
  });
}

// ---------- materials ----------
const MAT = {};
export function mat(key, opts) {
  if (MAT[key]) return MAT[key];
  const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0 }, opts)); MAT[key] = m; return m;
}
export const col = (key, color, extra = {}) => mat('c_' + key + color, Object.assign({ color }, extra));

// ---------- environments ----------
const skyVS = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz - cameraPosition; gl_Position = projectionMatrix * viewMatrix * w; gl_Position.z = gl_Position.w; }`;
const skyFS = `uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunCol; uniform float sunSize; varying vec3 vW;
void main(){ vec3 d = normalize(vW); float h = d.y; vec3 c = h > 0.0 ? mix(mid, top, pow(clamp(h,0.0,1.0), 0.55)) : mix(mid, bot, clamp(-h*4.0,0.0,1.0));
 float s = max(dot(d, normalize(sunDir)), 0.0); c += sunCol * (pow(s, 900.0/sunSize) * 2.5 + pow(s, 12.0) * 0.35);
 gl_FragColor = vec4(c, 1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
let skyMesh = null, starPts = null;
export const ENVS = {
  day: { top: '#3f7fc8', mid: '#bcd6ea', bot: '#d8b888', sun: [0.55, 0.62, 0.32], sunCol: '#fff4d8', sunI: 2.6, hemiSky: '#cfe2ff', hemiGround: '#a07a50', hemiI: 0.85, fog: '#d8c8b0', fogN: 120, fogF: 700, exp: 1.0, ground: 'sand' },
  dusk: { top: '#2a2350', mid: '#f08a56', bot: '#5a3040', sun: [-0.8, 0.12, 0.2], sunCol: '#ffb070', sunI: 2.2, hemiSky: '#9070a0', hemiGround: '#6a4030', hemiI: 0.7, fog: '#c07a60', fogN: 90, fogF: 600, exp: 1.05, ground: 'sand', sunSize: 3 },
  night: { top: '#04060f', mid: '#1b2448', bot: '#0a0c16', sun: [0.4, 0.7, -0.3], sunCol: '#9fb4ff', sunI: 0.55, hemiSky: '#3a4a80', hemiGround: '#1a1a24', hemiI: 0.45, fog: '#141a30', fogN: 40, fogF: 380, exp: 1.25, ground: 'sand', stars: true, moon: true, noSunDisk: true },
  junkyard: { top: '#2a2348', mid: '#e08a60', bot: '#4a3040', sun: [-0.7, 0.18, 0.4], sunCol: '#ffa060', sunI: 2.0, hemiSky: '#8a6a9a', hemiGround: '#5a3a2a', hemiI: 0.7, fog: '#a86a5a', fogN: 70, fogF: 500, exp: 1.05, ground: 'dirt', sunSize: 3 },
  warehouse: { interior: true, top: '#0a0c14', mid: '#14161e', bot: '#0a0a0a', sun: [0.3, 0.8, 0.2], sunCol: '#8aa0ff', sunI: 0.25, hemiSky: '#4a5a8a', hemiGround: '#1a1a1a', hemiI: 0.35, fog: '#0a0c14', fogN: 30, fogF: 160, exp: 1.3, ground: 'concrete', noSunDisk: true },
  motel: { top: '#04060f', mid: '#1e2648', bot: '#0a0c16', sun: [0.3, 0.7, -0.4], sunCol: '#9fb4ff', sunI: 0.5, hemiSky: '#3a4a80', hemiGround: '#1a1a24', hemiI: 0.45, fog: '#141a30', fogN: 40, fogF: 380, exp: 1.25, ground: 'asphalt', stars: true, moon: true, noSunDisk: true },
  lab: { interior: true, top: '#1a1e22', mid: '#2a3034', bot: '#111', sun: [0.2, 0.9, 0.3], sunCol: '#e8f4ff', sunI: 1.1, hemiSky: '#d8e8ff', hemiGround: '#4a5058', hemiI: 0.9, fog: '#2a3034', fogN: 40, fogF: 160, exp: 1.0, ground: 'tile', noSunDisk: true },
  ranch: { top: '#2f78c8', mid: '#c0dcee', bot: '#d8c898', sun: [0.4, 0.75, 0.4], sunCol: '#fff8e0', sunI: 2.8, hemiSky: '#cfe2ff', hemiGround: '#7a7a50', hemiI: 0.85, fog: '#d8d0b0', fogN: 120, fogF: 700, exp: 1.0, ground: 'grass' },
  compound: { top: '#2a2040', mid: '#e8885a', bot: '#3a2030', sun: [0.8, 0.14, -0.3], sunCol: '#ff9a50', sunI: 2.1, hemiSky: '#8a6a9a', hemiGround: '#5a3a2a', hemiI: 0.7, fog: '#a8705a', fogN: 70, fogF: 520, exp: 1.05, ground: 'dirt', sunSize: 3 },
  town: { top: '#3f7fc8', mid: '#c8dcec', bot: '#d8b888', sun: [0.5, 0.65, 0.4], sunCol: '#fff4d8', sunI: 2.5, hemiSky: '#cfe2ff', hemiGround: '#8a7a6a', hemiI: 0.85, fog: '#d8ccb8', fogN: 100, fogF: 600, exp: 1.0, ground: 'asphalt' },
};
ENVS.highway = Object.assign({}, ENVS.day, { ground: 'sand' });
export let ENV = ENVS.day;
export function setEnv(name) {
  const e = ENVS[name] || ENVS.day; ENV = e;
  if (!skyMesh) {
    skyMesh = new THREE.Mesh(new THREE.SphereGeometry(1000, 32, 16), new THREE.ShaderMaterial({ vertexShader: skyVS, fragmentShader: skyFS, side: THREE.BackSide, depthWrite: false, uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sunDir: { value: V3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 1 } } }));
    skyMesh.renderOrder = -10; skyMesh.frustumCulled = false;
  }
  scene.add(skyMesh);
  const u = skyMesh.material.uniforms;
  u.top.value.set(e.top); u.mid.value.set(e.mid); u.bot.value.set(e.bot); u.sunDir.value.set(...e.sun).normalize();
  u.sunCol.value.set(e.noSunDisk ? '#000' : e.sunCol); u.sunSize.value = e.sunSize || 1;
  scene.fog = new THREE.Fog(e.fog, e.fogN, e.fogF); scene.background = new THREE.Color(e.mid);
  hemi.color.set(e.hemiSky); hemi.groundColor.set(e.hemiGround); hemi.intensity = e.hemiI;
  sun.color.set(e.sunCol); sun.intensity = e.sunI; G.sunDir = V3(...e.sun).normalize();
  renderer.toneMappingExposure = e.exp;
  if (e.stars) {
    if (!starPts) { const g = new THREE.BufferGeometry(), p = [], r = srand(5); for (let i = 0; i < 1500; i++) { const a = r() * TAU, y = 0.08 + r() * 0.92, rr = Math.sqrt(1 - y * y); p.push(Math.cos(a) * rr * 900, y * 900, Math.sin(a) * rr * 900); } g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); starPts = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, color: 0xffffff, fog: false, transparent: true, opacity: 0.85 })); starPts.frustumCulled = false; }
    scene.add(starPts);
    if (e.moon) { const m = new THREE.Mesh(new THREE.SphereGeometry(18, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf0ecd8, fog: false })); m.position.set(...e.sun).normalize().multiplyScalar(700); m.name = 'moon'; scene.add(m); }
  }
}
export function placeSun(focus) {
  const d = G.sunDir || V3(0.5, 0.7, 0.3);
  sun.position.copy(focus).addScaledVector(d, 120); sun.target.position.copy(focus);
  if (skyMesh) skyMesh.position.copy(camera.position);
  if (starPts) starPts.position.copy(camera.position);
}
export function clearScene() {
  for (const ch of scene.children.slice()) if (ch !== sun && ch !== hemi && ch !== sun.target) { scene.remove(ch); }
}

// ---------- terrain + far scenery ----------
export function buildTerrain(e, o = {}) {
  const grp = new THREE.Group();
  const size = 1400, seg = 120, g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-PI / 2);
  const p = g.attributes.position, r = srand(o.seed || 3), cx = o.cx || 0;
  const hill = (x, z) => Math.sin(x * 0.013 + 1.3) * Math.cos(z * 0.011) * 6 + Math.sin(x * 0.031 + z * 0.023) * 2.5;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const flat = o.flatHalfZ || 28, dz = Math.max(0, Math.abs(z) - flat), k = Math.min(1, dz / 40);
    p.setY(i, e.interior ? 0 : hill(x + cx, z) * k * k - (o.sunk ? 0 : 0));
  }
  g.computeVertexNormals();
  const tex = Tex[o.ground || e.ground](); tex.repeat.set(size / 8, size / 8);
  const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  ground.receiveShadow = true; ground.position.x = cx; grp.add(ground);
  if (!e.interior && !o.noMesas) {
    const mt = Tex.mesa(); const mesaMat = new THREE.MeshStandardMaterial({ map: mt, roughness: 1, color: o.mesaTint || 0xffffff });
    for (let i = 0; i < 26; i++) {
      const a = r() * TAU, d = 330 + r() * 320, h = 25 + r() * 60, rad = 25 + r() * 55;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rad * (0.7 + r() * 0.2), rad, h, 9, 1), mesaMat);
      m.position.set(cx + Math.cos(a) * d, h / 2 - 4, Math.sin(a) * d); if (Math.abs(m.position.z) < 120) m.position.z = sign2(m.position.z) * (120 + r() * 200);
      m.rotation.y = r() * TAU; m.scale.set(1 + r() * 1.5, 1, 1); grp.add(m);
    }
    const cm = col('cactusFar', 0x4f6a3a);
    for (let i = 0; i < 140; i++) { const x = cx + (r() - 0.5) * 700, z = (r() < 0.5 ? -1 : 1) * (32 + r() * 200); const c = cactus(2 + r() * 3, cm); c.position.set(x, hill(x, z) * Math.min(1, Math.max(0, Math.abs(z) - 28) / 40) ** 2, z); c.rotation.y = r() * TAU; grp.add(c); }
    const rm = col('rock', 0x9a7a5a);
    for (let i = 0; i < 80; i++) { const x = cx + (r() - 0.5) * 600, z = (r() < 0.5 ? -1 : 1) * (30 + r() * 150), s = 0.5 + r() * 2.5; const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rm); m.position.set(x, s * 0.3, z); m.scale.y = 0.6; m.rotation.set(r(), r(), r()); m.castShadow = true; grp.add(m); }
  }
  return grp;
}
const sign2 = v => v < 0 ? -1 : 1;

// ---------- prop models ----------
function shadowed(o) { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; }
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); return b; };
const cyl = (rt, rb, h, m, seg = 12) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
export { box, cyl, shadowed };

export function crate(w = 1.2, h = 1.2, d = 1.2, style = 'wood') {
  let m;
  if (style === 'wood') { const t = Tex.crate().clone(); t.needsUpdate = true; m = new THREE.MeshStandardMaterial({ map: Tex.crate(), roughness: 0.9 }); }
  else if (style === 'cardboard') m = mat('cardboard', { map: Tex.cardboard() });
  else if (style === 'metal') m = mat('metalcrate', { map: Tex.metal(), metalness: 0.4, roughness: 0.6 });
  else if (style === 'container') m = mat('container', { map: Tex.container(), color: 0x8a3a2a, metalness: 0.3, roughness: 0.7 });
  else m = col('sand', 0xb09a6a);
  if (style === 'sandbag') {
    const g = new THREE.Group(), sm = col('sandbag', 0xb09a6a, { roughness: 1 }); const rows = Math.round(h / 0.28), per = Math.max(1, Math.round(w / 0.55));
    for (let rr = 0; rr < rows; rr++) for (let i = 0; i < per; i++) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.32, 4, 8), sm); b.rotation.z = PI / 2; b.scale.z = d / 0.32; b.position.set(-w / 2 + (i + 0.5 + (rr % 2) * 0.5) * (w / per) - (rr % 2 ? w / per / 2 : 0), 0.14 + rr * 0.27, 0); g.add(b); }
    return shadowed(g);
  }
  return shadowed(box(w, h, d, m, 0, h / 2, 0));
}
export function barrel(kind = 'red') {
  const g = new THREE.Group();
  if (kind === 'propane') {
    const m = col('propane', 0xe8e8e8, { metalness: 0.4, roughness: 0.4 });
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.6, 6, 14), m); b.position.y = 0.6; g.add(b);
    const v = cyl(0.06, 0.06, 0.18, col('valve', 0x888888, { metalness: 0.8 })); v.position.y = 1.25; g.add(v);
    const band = cyl(0.31, 0.31, 0.12, col('lpgred', 0xc0281c)); band.position.y = 0.7; g.add(band);
  } else {
    const c = { red: 0xc0281c, blue: 0x2a5aa0, green: 0x5a6a3a, stolen: 0x2a5aa0 }[kind] || 0x5a6a3a;
    const m = col('barrel' + kind, c, { metalness: 0.5, roughness: 0.5 });
    const b = cyl(0.3, 0.3, 0.9, m, 18); b.position.y = 0.45; g.add(b);
    for (const y of [0.2, 0.7]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.305, 0.022, 6, 18), m); r.rotation.x = PI / 2; r.position.y = y; g.add(r); }
    if (kind === 'red') { const s = new THREE.Mesh(new THREE.CircleGeometry(0.12, 3), col('hazard', 0xffdd33, { side: THREE.DoubleSide })); s.position.set(0, 0.48, 0.302); g.add(s); }
    if (kind === 'blue') { const s = box(0.3, 0.12, 0.01, col('chemlabel', 0xffffff), 0, 0.5, 0.3); g.add(s); }
  }
  return shadowed(g);
}
export function car(color = 0x7a2a2a, kind = 'sedan') {
  const g = new THREE.Group(), body = col('car' + color, color, { metalness: 0.5, roughness: 0.35 }), glass = col('glass', 0x2a3540, { metalness: 0.6, roughness: 0.1 }), dark = col('tire', 0x151515, { roughness: 0.9 }), chrome = col('chrome', 0xb8bec4, { metalness: 0.9, roughness: 0.25 });
  const L = 4.6, Wd = 1.8;
  g.add(box(L, 0.7, Wd, body, 0, 0.75, 0));
  if (kind === 'pickup') { g.add(box(1.7, 0.75, Wd * 0.96, body, 0.9, 1.45, 0)); const gl = box(1.5, 0.55, Wd * 0.98, glass, 0.9, 1.5, 0); g.add(gl); g.add(box(2.3, 0.35, 0.08, body, -1.1, 1.25, Wd / 2 - 0.04)); g.add(box(2.3, 0.35, 0.08, body, -1.1, 1.25, -Wd / 2 + 0.04)); g.add(box(0.08, 0.35, Wd, body, -2.26, 1.25, 0)); }
  else { const cab = box(2.4, 0.65, Wd * 0.94, body, -0.1, 1.42, 0); g.add(cab); g.add(box(2.2, 0.5, Wd * 0.96, glass, -0.1, 1.42, 0)); const ws = box(0.06, 0.62, Wd * 0.9, glass, 1.15, 1.38, 0); ws.rotation.z = -0.6; g.add(ws); }
  for (const x of [-1.45, 1.45]) for (const z of [-Wd / 2, Wd / 2]) { const w = cyl(0.36, 0.36, 0.26, dark, 16); w.rotation.x = PI / 2; w.position.set(x, 0.36, z); g.add(w); const hub = cyl(0.17, 0.17, 0.27, chrome, 10); hub.rotation.x = PI / 2; hub.position.set(x, 0.36, z); g.add(hub); }
  g.add(box(0.1, 0.18, Wd * 0.9, chrome, L / 2 + 0.02, 0.55, 0)); g.add(box(0.1, 0.18, Wd * 0.9, chrome, -L / 2 - 0.02, 0.55, 0));
  for (const z of [-0.65, 0.65]) { g.add(box(0.05, 0.14, 0.3, col('headl', 0xfff4c0, { emissive: 0x554422 }), L / 2 + 0.03, 0.85, z)); g.add(box(0.05, 0.14, 0.3, col('taill', 0xc0281c, { emissive: 0x440000 }), -L / 2 - 0.03, 0.85, z)); }
  return shadowed(g);
}
export function rvModel(o = {}) {
  // faces +X, rear at x=0, length ~8.4m, roof at y≈3.3
  const g = new THREE.Group();
  const cream = col('rvcream', o.dirty ? 0xddd3b4 : 0xe9e2c9, { roughness: 0.6 }), brown = col('rvbrown', 0x7a4f2c), tan = col('rvtan', 0xc99556), glass = col('rvglass', o.lit ? 0xf7c65c : 0x2a3540, o.lit ? { emissive: 0xf0a040, emissiveIntensity: 0.9 } : { metalness: 0.6, roughness: 0.15 });
  const foil = col('foil', 0xc8ccd0, { metalness: 0.8, roughness: 0.35 }), dark = col('tire', 0x151515), chrome = col('chrome', 0xb8bec4, { metalness: 0.9, roughness: 0.25 });
  const Wd = 2.4;
  g.add(box(7.0, 2.6, Wd, cream, 3.5, 2.05, 0));                    // living box
  g.add(box(1.6, 0.9, Wd * 0.98, cream, 7.4, 2.9, 0));              // over-cab bunk
  g.add(box(1.4, 1.5, Wd * 0.94, cream, 7.7, 1.45, 0));             // cab
  const ws = box(0.08, 1.0, Wd * 0.86, glass === foil ? glass : col('wind', 0x3a4a58, { metalness: 0.5, roughness: 0.1 }), 8.42, 1.7, 0); ws.rotation.z = -0.35; g.add(ws);
  g.add(box(8.4, 0.25, Wd * 1.0, col('skirt', 0xb8ae90), 4.2, 0.8, 0));
  for (const s of [-1, 1]) {
    g.add(box(7.0, 0.18, 0.02, brown, 3.5, 1.65, s * (Wd / 2 + 0.01))); g.add(box(7.0, 0.11, 0.02, tan, 3.5, 1.5, s * (Wd / 2 + 0.01)));
    for (const [x, w] of [[1.0, 1.4], [2.7, 1.2], [6.2, 1.1]]) g.add(box(w, 0.8, 0.03, o.foil ? foil : glass, x, 2.55, s * (Wd / 2 + 0.01)));
    g.add(box(0.9, 0.55, 0.03, col('cabwin', 0x3a4a58, { metalness: 0.5, roughness: 0.1 }), 7.8, 1.85, s * (Wd * 0.47 + 0.01)));
  }
  g.add(box(0.95, 2.2, 0.04, col('rvdoor', 0xdcd4bc), 4.6, 1.95, Wd / 2 + 0.02)); g.add(box(0.6, 0.5, 0.05, o.lit ? glass : col('doorwin', 0x2a3540), 4.6, 2.6, Wd / 2 + 0.03));
  g.add(box(1.3, 0.35, 1.0, col('ac', 0xd8d2bc), 2.6, 3.52, 0)); const vent = cyl(0.12, 0.12, 0.35, col('vent', 0x8a8a80), 8); vent.position.set(1.2, 3.5, 0.5); g.add(vent);
  for (const z of [-0.3, 0.3]) g.add(box(0.05, 2.4, 0.05, chrome, -0.05, 2.1, z)); for (let i = 0; i < 8; i++) g.add(box(0.05, 0.04, 0.6, chrome, -0.05, 1.1 + i * 0.3, 0));
  g.add(box(0.2, 0.25, Wd * 0.9, chrome, 8.5, 0.7, 0)); g.add(box(0.2, 0.25, Wd * 0.9, chrome, -0.08, 0.75, 0));
  for (const z of [-1.0, 1.0]) g.add(box(0.05, 0.22, 0.32, col('headl', 0xfff4c0, { emissive: 0x554422 }), 8.43, 1.0, z));
  for (const x of [1.6, 6.9]) for (const z of [-Wd / 2 + 0.15, Wd / 2 - 0.15]) { const w = cyl(0.5, 0.5, 0.32, dark, 18); w.rotation.x = PI / 2; w.position.set(x, 0.5, z); w.name = 'wheel'; g.add(w); const hub = cyl(0.24, 0.24, 0.33, chrome, 10); hub.rotation.x = PI / 2; hub.position.set(x, 0.5, z); g.add(hub); }
  // rust streaks
  for (const [x, y] of [[1.2, 1.0], [6.0, 1.1], [3.3, 1.3]]) g.add(box(0.8, 0.12, 0.02, col('rvrust', 0x8a5a30), x, y, Wd / 2 + 0.015));
  g.userData.roof = 3.3; return shadowed(g);
}
export function cactus(h = 4, m) {
  m = m || col('cactus', 0x4f6a3a, { roughness: 0.8 });
  const g = new THREE.Group(), r = h * 0.07;
  const t = cyl(r, r * 1.1, h, m, 8); t.position.y = h / 2; g.add(t); const tc = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), m); tc.position.y = h; g.add(tc);
  for (const [s, y, l] of [[1, 0.45, 0.35], [-1, 0.6, 0.28]]) { const a = cyl(r * 0.75, r * 0.75, h * 0.18, m, 8); a.rotation.z = PI / 2; a.position.set(s * h * 0.1, h * y, 0); g.add(a); const u = cyl(r * 0.75, r * 0.75, h * l, m, 8); u.position.set(s * h * 0.18, h * y + h * l / 2, 0); g.add(u); const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 0.75, 8, 6), m); cap.position.set(s * h * 0.18, h * y + h * l, 0); g.add(cap); }
  return shadowed(g);
}
export function lampPost(h = 6) {
  const g = new THREE.Group(), m = col('pole', 0x3a3a3a, { metalness: 0.5 });
  const p = cyl(0.07, 0.09, h, m, 8); p.position.y = h / 2; g.add(p); g.add(box(1.0, 0.07, 0.07, m, 0.5, h, 0));
  const head = box(0.5, 0.12, 0.25, col('lamphead', 0xfff3c0, { emissive: 0xffe0a0, emissiveIntensity: 2 }), 0.95, h - 0.08, 0); g.add(head);
  return shadowed(g);
}
export function platform(w = 6, h = 3, d = 2.4) {
  const g = new THREE.Group(), m = col('plat', 0x5a5e62, { metalness: 0.6, roughness: 0.5 }), y = col('rail', 0xd8b020, { metalness: 0.4 });
  g.add(box(w, 0.15, d, m, 0, h, 0));
  for (const x of [-w / 2 + 0.2, w / 2 - 0.2]) for (const z of [-d / 2 + 0.2, d / 2 - 0.2]) g.add(box(0.12, h, 0.12, m, x, h / 2, z));
  for (const z of [-d / 2 + 0.05]) { g.add(box(w, 0.05, 0.05, y, 0, h + 1.0, z)); for (let x = -w / 2; x <= w / 2 + 0.01; x += 1.2) g.add(box(0.05, 1.0, 0.05, y, x, h + 0.5, z)); }
  return shadowed(g);
}
export function fence(len = 10, h = 2.4) {
  const g = new THREE.Group(); const t = Tex.fence().clone(); t.needsUpdate = true; t.repeat.set(len / 1.2, h / 1.2);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(len, h), new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.5 }));
  mesh.position.y = h / 2; g.add(mesh); const pm = col('pole', 0x3a3a3a, { metalness: 0.5 });
  for (let x = -len / 2; x <= len / 2 + 0.01; x += 3) { const p = cyl(0.04, 0.04, h, pm, 6); p.position.set(x, h / 2, 0); g.add(p); }
  return g;
}
export function facade(kind, w, h, d = 1) {
  const t = facadeTex(kind).clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, Math.round(w / (kind === 'hen' ? w : 16))), 1);
  const front = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }), side = col('facadeSide' + kind, 0x8a7a6a);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, side, side, front, side]); m.position.y = h / 2; m.castShadow = true; m.receiveShadow = true; return m;
}
export function tank(h = 6, r = 1.4) {
  const g = new THREE.Group(), m = col('tank', 0xb8c0c6, { metalness: 0.8, roughness: 0.3 });
  const c = cyl(r, r, h, m, 24); c.position.y = h / 2 + 0.5; g.add(c); const top = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, TAU, 0, PI / 2), m); top.position.y = h + 0.5; g.add(top);
  for (const a of [0, 2.1, 4.2]) { const l = cyl(0.08, 0.08, 0.6, col('pole', 0x3a3a3a), 6); l.position.set(Math.cos(a) * r * 0.8, 0.3, Math.sin(a) * r * 0.8); g.add(l); }
  return shadowed(g);
}
export function palm(h = 7) {
  const g = new THREE.Group(), tm = col('palmtrunk', 0x6a5236), lm = col('palmleaf', 0x4a7a3a, { side: THREE.DoubleSide });
  const t = cyl(0.14, 0.22, h, tm, 8); t.position.y = h / 2; g.add(t);
  for (let i = 0; i < 8; i++) { const leaf = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.6), lm); leaf.position.set(0, h, 0); leaf.rotation.set(0.5, i * TAU / 8, 0); leaf.translateX(1.4); leaf.rotation.z = -0.4; g.add(leaf); }
  return shadowed(g);
}
export function table(w = 2, d = 1) {
  const g = new THREE.Group(), m = col('table', 0x6a5a4a); g.add(box(w, 0.08, d, m, 0, 0.9, 0));
  for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) for (const z of [-d / 2 + 0.1, d / 2 - 0.1]) g.add(box(0.07, 0.9, 0.07, m, x, 0.45, z));
  return shadowed(g);
}

// ---------- 3D guns (local: grip at origin, +Z forward, +Y up) ----------
export function gunModel(art, o = {}) {
  const g = new THREE.Group(), P = {};
  const blk = col('gunblk', 0x2b2d30, { metalness: 0.7, roughness: 0.35 }), dk = col('gundk', 0x1b1c1e, { metalness: 0.6, roughness: 0.4 });
  const wood = col('gunwood', 0x7a4a26, { roughness: 0.7 }), steel = col('gunsteel', 0x9aa0a6, { metalness: 0.9, roughness: 0.25 }), gold = col('gold', 0xd8b040, { metalness: 1, roughness: 0.25 });
  const add = (m, name) => { g.add(m); if (name) P[name] = m; return m; };
  switch (art) {
    case 'pistol': {
      const sm = o.gold ? gold : blk;
      add(box(0.032, 0.11, 0.045, o.gold ? col('ivory', 0xf2efe6) : col('grip', 0x3a3026), 0, -0.04, -0.01)).rotation.x = 0.25;
      add(box(0.03, 0.03, 0.17, dk, 0, 0.025, 0.06));
      const sl = add(box(0.034, 0.036, 0.19, sm, 0, 0.055, 0.06), 'slide'); sl.userData.base = sl.position.clone();
      const mag = add(box(0.026, 0.1, 0.035, col('mag', 0x111111), 0, -0.06, -0.008), 'mag'); mag.rotation.x = 0.25; mag.userData.base = mag.position.clone();
      P.muzzle = V3(0, 0.055, 0.16); P.eject = V3(0.02, 0.07, 0.03); P.well = V3(0, -0.12, -0.03); P.support = V3(-0.02, -0.03, 0.0); P.rack = V3(0, 0.06, -0.02);
      break;
    }
    case 'revolver': {
      add(box(0.032, 0.11, 0.045, wood, 0, -0.045, -0.02)).rotation.x = 0.35;
      add(box(0.034, 0.05, 0.08, steel, 0, 0.03, 0.0));
      add(cyl(0.012, 0.012, 0.2, steel, 10), 'barrel').rotation.x = PI / 2; P.barrel.position.set(0, 0.055, 0.13);
      const cy = add(cyl(0.028, 0.028, 0.06, steel, 6), 'cyl'); cy.rotation.x = PI / 2; cy.position.set(0, 0.035, 0.06); cy.userData.base = cy.position.clone();
      P.muzzle = V3(0, 0.055, 0.24); P.eject = V3(0, 0.03, 0.06); P.well = V3(-0.04, 0.0, 0.06); P.support = V3(-0.02, -0.03, 0.0);
      break;
    }
    case 'shotgun': {
      add(box(0.04, 0.07, 0.36, wood, 0, -0.02, -0.25)).rotation.x = -0.12;
      add(box(0.045, 0.07, 0.22, blk, 0, 0.03, 0.06));
      add(cyl(0.014, 0.014, 0.58, blk, 10)).rotation.x = PI / 2; g.children[g.children.length - 1].position.set(0, 0.055, 0.45);
      add(cyl(0.012, 0.012, 0.46, dk, 10)).rotation.x = PI / 2; g.children[g.children.length - 1].position.set(0, 0.025, 0.4);
      const pump = add(cyl(0.024, 0.024, 0.2, o.fire ? col('pumpred', 0x8a2a1a) : wood, 10), 'pump'); pump.rotation.x = PI / 2; pump.position.set(0, 0.025, 0.36); pump.userData.base = pump.position.clone();
      P.muzzle = V3(0, 0.055, 0.75); P.eject = V3(0.03, 0.05, 0.08); P.well = V3(0, -0.03, 0.08); P.support = V3(0, 0.0, 0.36);
      break;
    }
    case 'smg': {
      add(box(0.035, 0.1, 0.04, blk, 0, -0.05, 0)).rotation.x = 0.12;
      add(box(0.045, 0.07, 0.26, col('smgbody', 0x3a3c40, { metalness: 0.6, roughness: 0.4 }), 0, 0.035, 0.07));
      add(cyl(0.01, 0.01, 0.08, dk, 8)).rotation.x = PI / 2; g.children[g.children.length - 1].position.set(0, 0.04, 0.24);
      const mag = add(box(0.025, 0.16, 0.03, col('mag', 0x111111), 0, -0.13, 0.0), 'mag'); mag.userData.base = mag.position.clone();
      P.muzzle = V3(0, 0.04, 0.29); P.eject = V3(0.03, 0.06, 0.08); P.well = V3(0, -0.22, 0.0); P.support = V3(0, 0.0, 0.15); P.rack = V3(0.03, 0.07, 0.08);
      break;
    }
    case 'rifle': {
      add(box(0.04, 0.08, 0.3, wood, 0, 0.0, -0.24)).rotation.x = -0.1;
      add(box(0.035, 0.09, 0.05, col('ripgrip', 0x6a3a1a), 0, -0.06, -0.02)).rotation.x = 0.3;
      add(box(0.05, 0.08, 0.3, blk, 0, 0.04, 0.12));
      add(box(0.05, 0.06, 0.18, wood, 0, 0.035, 0.34));
      add(cyl(0.011, 0.011, 0.25, dk, 8)).rotation.x = PI / 2; g.children[g.children.length - 1].position.set(0, 0.045, 0.55);
      const mag = add(box(0.03, 0.18, 0.06, col('akmag', 0x3a2a1a), 0, -0.07, 0.14), 'mag'); mag.rotation.x = -0.35; mag.userData.base = mag.position.clone();
      P.muzzle = V3(0, 0.045, 0.68); P.eject = V3(0.03, 0.06, 0.12); P.well = V3(0, -0.17, 0.18); P.support = V3(0, 0.0, 0.34); P.rack = V3(0.03, 0.06, 0.17);
      break;
    }
    case 'mg': {
      add(box(0.05, 0.1, 0.32, col('mgstock', 0x3a3c30), 0, 0.0, -0.26));
      add(box(0.04, 0.1, 0.05, blk, 0, -0.06, -0.02)).rotation.x = 0.3;
      add(box(0.07, 0.13, 0.36, col('mgbody', 0x34362e, { metalness: 0.5 }), 0, 0.05, 0.14));
      const cover = add(box(0.07, 0.025, 0.24, col('mgcover', 0x2a2c26), 0, 0.125, 0.14), 'cover'); cover.userData.base = cover.position.clone();
      add(cyl(0.016, 0.016, 0.45, blk, 10)).rotation.x = PI / 2; g.children[g.children.length - 1].position.set(0, 0.06, 0.55);
      const mag = add(box(0.1, 0.13, 0.14, col('ammobox', 0x4a5030), 0.07, -0.03, 0.12), 'mag'); mag.userData.base = mag.position.clone();
      P.muzzle = V3(0, 0.06, 0.78); P.eject = V3(0.04, 0.05, 0.14); P.well = V3(0.07, -0.12, 0.12); P.support = V3(0, -0.01, 0.38); P.rack = V3(0.04, 0.08, 0.2); P.coverPt = V3(0, 0.14, 0.2);
      break;
    }
    case 'bat': { const b = cyl(0.035, 0.018, 0.8, col('batwood', 0xc89a5a), 10); b.position.set(0, 0, 0.35); b.rotation.x = PI / 2; add(b); break; }
    case 'knife': { add(box(0.02, 0.025, 0.1, dk, 0, 0, 0)); add(box(0.005, 0.03, 0.18, steel, 0, 0.005, 0.13)); break; }
    case 'axe': { const hnd = cyl(0.022, 0.022, 0.85, wood, 8); hnd.rotation.x = PI / 2; hnd.position.z = 0.35; add(hnd); add(box(0.02, 0.22, 0.16, steel, 0, 0.06, 0.72)); break; }
  }
  g.userData.parts = P; shadowed(g);
  return g;
}
export function magModel(kind) {
  if (kind === 'mg') return shadowed(box(0.1, 0.13, 0.14, col('ammobox', 0x4a5030)));
  if (kind === 'rifle') return shadowed(box(0.03, 0.18, 0.06, col('akmag', 0x3a2a1a)));
  if (kind === 'loader') return shadowed(cyl(0.03, 0.03, 0.03, col('loader', 0x333333), 8));
  if (kind === 'shell') return shadowed(cyl(0.011, 0.011, 0.06, col('shellred', 0xc02a1c), 8));
  return shadowed(box(0.026, 0.1, 0.035, col('mag', 0x111111)));
}
