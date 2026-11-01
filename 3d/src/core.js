// ============================================================
//  FIXING GOOD 3D - core: math, input, settings, save, audio
// ============================================================
export const W = 1280, H = 720; // logical UI resolution (16:9)
export const PI = Math.PI, TAU = PI * 2;
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
export const randi = (a, b) => Math.floor(rand(a, b + 1));
export const choose = arr => arr[Math.floor(Math.random() * arr.length)];
export const sign = v => v < 0 ? -1 : 1;
export const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
export const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; };
export const fmtMoney = n => '$' + Math.round(n).toLocaleString('en-US');
export const dist2 = (ax, az, bx, bz) => Math.hypot(bx - ax, bz - az);
export function srand(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
export function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// shared mutable game context (avoids circular imports)
export const G = { state: null, level: null, scene: null, time: 0, cheatGod: false, renderer: null, view: { x: 0, y: 0, w: W, h: H, s: 1 } };

// ---------- settings + save ----------
export const Settings = { volume: 0.8, music: 0.5, shake: 1, gore: 2, sens: 1, quality: 1 };
export function store(k, v) { try { localStorage.setItem('fixinggood3d.' + k, JSON.stringify(v)); } catch (e) { } }
export function load(k) { try { const v = localStorage.getItem('fixinggood3d.' + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
Object.assign(Settings, load('settings') || {});

// ---------- input ----------
export const Input = {
  keys: {}, pressed: {}, mx: W / 2, my: H / 2, dx: 0, dy: 0, mdown: false, mclick: false, rdown: false, rclick: false, wheel: 0, anyKey: false, locked: false, wantLock: false,
  down(k) { return !!this.keys[k]; },
  hit(k) { return !!this.pressed[k]; },
  endFrame() { this.pressed = {}; this.mclick = false; this.rclick = false; this.wheel = 0; this.anyKey = false; this.dx = 0; this.dy = 0; },
};
let lockTarget = null;
export function bindInput(el) {
  lockTarget = el;
  addEventListener('keydown', e => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.code)) e.preventDefault();
    if (!Input.keys[e.code]) Input.pressed[e.code] = true;
    Input.keys[e.code] = true; Input.anyKey = true; Audio.unlock();
  });
  addEventListener('keyup', e => { Input.keys[e.code] = false; });
  addEventListener('blur', () => { Input.keys = {}; Input.mdown = false; Input.rdown = false; });
  const pos = e => { const v = G.view; Input.mx = (e.clientX - v.x) / v.s; Input.my = (e.clientY - v.y) / v.s; };
  addEventListener('mousemove', e => { pos(e); if (Input.locked) { Input.dx += e.movementX; Input.dy += e.movementY; } });
  el.addEventListener('mousedown', e => {
    pos(e); Audio.unlock(); Input.anyKey = true;
    if (Input.wantLock && !Input.locked && el.requestPointerLock) { try { el.requestPointerLock(); } catch (er) { } }
    if (e.button === 0) { Input.mdown = true; Input.mclick = true; }
    if (e.button === 2) { Input.rdown = true; Input.rclick = true; }
  });
  addEventListener('mouseup', e => { if (e.button === 0) Input.mdown = false; if (e.button === 2) Input.rdown = false; });
  el.addEventListener('contextmenu', e => e.preventDefault());
  el.addEventListener('wheel', e => { Input.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
  document.addEventListener('pointerlockchange', () => { Input.locked = document.pointerLockElement === el; });
}
export function setPointerLock(on) {
  Input.wantLock = on;
  if (!on && document.pointerLockElement) document.exitPointerLock();
}

// ---------- audio (synthesized, no files) ----------
export const Audio = {
  ctx: null, master: null, sfxBus: null, musicBus: null, noiseBuf: null, musicOn: false, musicMood: null,
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
      const comp = this.ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6;
      comp.connect(this.master);
      this.sfxBus = this.ctx.createGain(); this.sfxBus.connect(comp);
      this.musicBus = this.ctx.createGain(); this.musicBus.connect(this.master);
      const len = this.ctx.sampleRate * 2; this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.applyVolume();
      if (this.musicMood) this.music(this.musicMood, true);
    } catch (e) { this.ctx = null; }
  },
  applyVolume() { if (!this.ctx) return; this.sfxBus.gain.value = Settings.volume; this.musicBus.gain.value = Settings.music * 0.55; },
  noise(dur, freq, q, vol, type = 'lowpass', when = 0, decay = 1, pan = 0) {
    if (!this.ctx) return; const t = this.ctx.currentTime + when;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.playbackRate.value = rand(0.9, 1.1);
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur * decay);
    let out = g;
    if (this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); out = p; }
    s.connect(f); f.connect(g); out.connect(this.sfxBus); s.start(t, rand(0, 1)); s.stop(t + dur + 0.05);
  },
  tone(freq, dur, vol, type = 'sine', when = 0, slide = 0, bus) {
    if (!this.ctx) return; const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || this.sfxBus); o.start(t); o.stop(t + dur + 0.05);
  },
  play(name, pan = 0, vol = 1) {
    if (!this.ctx) return;
    const v = vol;
    switch (name) {
      case 'pistol': this.noise(0.25, 2400, 0.7, 0.9 * v, 'lowpass', 0, 1, pan); this.tone(150, 0.12, 0.5 * v, 'triangle', 0, 0.4); break;
      case 'revolver': this.noise(0.5, 1800, 0.8, 1.1 * v, 'lowpass', 0, 1, pan); this.tone(110, 0.25, 0.7 * v, 'triangle', 0, 0.35); break;
      case 'shotgun': this.noise(0.6, 1300, 0.6, 1.3 * v, 'lowpass', 0, 1, pan); this.tone(80, 0.3, 0.9 * v, 'sine', 0, 0.4); break;
      case 'smg': this.noise(0.14, 3000, 0.8, 0.6 * v, 'lowpass', 0, 1, pan); this.tone(180, 0.07, 0.35 * v, 'triangle', 0, 0.5); break;
      case 'rifle': this.noise(0.32, 2000, 0.9, 1.0 * v, 'lowpass', 0, 1, pan); this.tone(120, 0.14, 0.6 * v, 'triangle', 0, 0.4); break;
      case 'mg': this.noise(0.3, 1600, 0.9, 1.0 * v, 'lowpass', 0, 1, pan); this.tone(90, 0.12, 0.7 * v, 'square', 0, 0.4); break;
      case 'dry': this.tone(1800, 0.03, 0.2 * v, 'square'); break;
      case 'magout': this.tone(900, 0.04, 0.15 * v, 'square'); this.noise(0.05, 4000, 2, 0.2 * v, 'bandpass'); break;
      case 'magin': this.tone(700, 0.03, 0.25 * v, 'square'); this.tone(1100, 0.03, 0.2 * v, 'square', 0.04); this.noise(0.06, 3000, 3, 0.3 * v, 'bandpass'); break;
      case 'rack': this.noise(0.07, 2500, 4, 0.35 * v, 'bandpass'); this.noise(0.06, 3500, 4, 0.35 * v, 'bandpass', 0.09); this.tone(500, 0.04, 0.2 * v, 'square', 0.1); break;
      case 'shell': this.noise(0.05, 2200, 5, 0.3 * v, 'bandpass'); this.tone(600, 0.04, 0.15 * v, 'square', 0.02); break;
      case 'pump': this.noise(0.08, 1500, 3, 0.5 * v, 'bandpass'); this.noise(0.08, 1900, 3, 0.5 * v, 'bandpass', 0.13); break;
      case 'cylinder': this.tone(1300, 0.05, 0.2 * v, 'square'); this.noise(0.1, 5000, 3, 0.2 * v, 'bandpass'); break;
      case 'tink': this.tone(rand(2800, 3600), 0.08, 0.06 * v, 'sine'); break;
      case 'clank': this.tone(rand(300, 420), 0.12, 0.12 * v, 'square', 0, 0.6); this.noise(0.1, 1200, 2, 0.15 * v, 'bandpass'); break;
      case 'punch': this.noise(0.12, 600, 1, 0.9 * v, 'lowpass', 0, 1, pan); this.tone(90, 0.1, 0.6 * v, 'sine', 0, 0.5); break;
      case 'whoosh': this.noise(0.18, 900, 1, 0.25 * v, 'bandpass', 0, 1, pan); break;
      case 'hit': this.noise(0.12, 900, 1.5, 0.5 * v, 'bandpass', 0, 1, pan); this.tone(160, 0.06, 0.25 * v, 'sine'); break;
      case 'splat': this.noise(0.18, 500, 1.2, 0.5 * v, 'lowpass', 0, 1, pan); break;
      case 'headshot': this.noise(0.22, 700, 1.4, 0.8 * v, 'lowpass', 0, 1, pan); this.tone(70, 0.2, 0.5 * v, 'sine', 0, 0.5); break;
      case 'ric': this.tone(rand(1500, 2600), 0.2, 0.08 * v, 'sine', 0, 0.5); this.noise(0.05, 4000, 2, 0.15 * v, 'highpass'); break;
      case 'explode': this.noise(1.4, 700, 0.6, 1.6 * v, 'lowpass', 0, 1, pan); this.tone(55, 0.9, 1.0 * v, 'sine', 0, 0.3); this.noise(0.4, 3000, 0.5, 0.6 * v, 'lowpass'); break;
      case 'fire': this.noise(0.5, 400, 0.5, 0.15 * v, 'lowpass'); break;
      case 'hurt': this.noise(0.15, 700, 2, 0.4 * v, 'bandpass'); this.tone(220, 0.15, 0.2 * v, 'sawtooth', 0, 0.6); break;
      case 'ui': this.tone(660, 0.06, 0.15 * v, 'triangle'); break;
      case 'uiok': this.tone(660, 0.07, 0.15 * v, 'triangle'); this.tone(990, 0.1, 0.15 * v, 'triangle', 0.07); break;
      case 'cash': this.tone(1500, 0.06, 0.12 * v, 'square'); this.tone(2200, 0.12, 0.12 * v, 'square', 0.06); break;
      case 'bad': this.tone(200, 0.2, 0.2 * v, 'sawtooth', 0, 0.7); break;
      case 'type': this.tone(rand(380, 460), 0.025, 0.04 * v, 'square'); break;
      case 'bubble': this.tone(rand(300, 600), 0.08, 0.06 * v, 'sine', 0, 1.8); break;
      case 'engine': this.noise(0.4, 160, 1, 0.4 * v, 'lowpass'); this.tone(48, 0.4, 0.3 * v, 'sawtooth', 0, 1.1); break;
      case 'crash': this.noise(0.8, 1200, 0.7, 1.2 * v, 'lowpass'); this.tone(60, 0.5, 0.6 * v, 'square', 0, 0.4); break;
      case 'step': this.noise(0.04, 500, 1, 0.08 * v, 'lowpass', 0, 1, pan); break;
      case 'land': this.noise(0.08, 400, 1, 0.25 * v, 'lowpass', 0, 1, pan); break;
      case 'pickup': this.tone(880, 0.06, 0.12 * v, 'triangle'); this.tone(1320, 0.08, 0.12 * v, 'triangle', 0.05); break;
    }
  },
  // simple procedural score: drone + plucked desert guitar arpeggio
  music(mood, force) {
    this.musicMood = mood;
    if (!this.ctx) return;
    if (this._musicMoodPlaying === mood && !force) return;
    this._musicMoodPlaying = mood;
    if (!this._musicTimer) {
      this._musicStep = 0; this._next = this.ctx.currentTime + 0.1;
      this._musicTimer = setInterval(() => this._tick(), 60);
    }
  },
  _tick() {
    if (!this.ctx || !this.musicMood || this.musicMood === 'none') return;
    const moods = {
      menu: { bpm: 70, root: 110, scale: [0, 3, 5, 7, 10, 12], pat: [0, -1, 2, -1, 4, 3, -1, 1], drone: true, kick: false },
      hub: { bpm: 84, root: 98, scale: [0, 3, 5, 6, 7, 10, 12], pat: [0, 2, 4, 2, 5, 4, 2, -1], drone: true, kick: false },
      action: { bpm: 128, root: 82, scale: [0, 1, 3, 5, 7, 8, 10, 12], pat: [0, 0, 3, 0, 5, 0, 3, 6], drone: true, kick: true },
      tense: { bpm: 96, root: 73, scale: [0, 1, 4, 5, 7, 8], pat: [0, -1, -1, 1, -1, -1, 0, -1], drone: true, kick: false },
      cook: { bpm: 92, root: 130, scale: [0, 2, 4, 7, 9, 12], pat: [0, 3, 1, 4, 2, 5, 3, -1], drone: true, kick: false },
      boss: { bpm: 140, root: 73, scale: [0, 1, 3, 6, 7, 8, 11], pat: [0, 0, 6, 0, 5, 0, 3, 1], drone: true, kick: true },
    };
    const m = moods[this.musicMood]; if (!m) return;
    const stepDur = 60 / m.bpm / 2;
    while (this._next < this.ctx.currentTime + 0.25) {
      const s = this._musicStep++, t = this._next - this.ctx.currentTime;
      const idx = m.pat[s % m.pat.length];
      if (idx >= 0) {
        const semi = m.scale[idx % m.scale.length] + (s % 32 >= 16 && idx === 0 ? -2 : 0);
        const f = m.root * 2 * Math.pow(2, semi / 12);
        this.tone(f, stepDur * 3, 0.07, 'triangle', t, 0.995, this.musicBus);
        this.tone(f * 2, stepDur * 1.2, 0.02, 'sine', t, 1, this.musicBus);
      }
      if (m.drone && s % 16 === 0) { this.tone(m.root / 2, stepDur * 16, 0.06, 'sawtooth', t, 1, this.musicBus); this.tone(m.root * 0.75, stepDur * 16, 0.03, 'sine', t, 1, this.musicBus); }
      if (m.kick && s % 4 === 0) this.tone(70, 0.15, 0.25, 'sine', t, 0.4, this.musicBus);
      if (m.kick && s % 8 === 4) { const g = this.ctx.createGain(); g.gain.value = 0.12; g.connect(this.musicBus); const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf; const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2000; const g2 = this.ctx.createGain(); const tt = this.ctx.currentTime + t; g2.gain.setValueAtTime(0.5, tt); g2.gain.exponentialRampToValueAtTime(0.001, tt + 0.12); src.connect(f); f.connect(g2); g2.connect(g); src.start(tt); src.stop(tt + 0.15); }
      this._next += stepDur;
    }
  }
};
