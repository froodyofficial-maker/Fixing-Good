// ============================================================
//  FIXING GOOD 3D - boot + main loop
// ============================================================
import { W, H, G, Input, bindInput, Audio, Settings, store, load } from './core.js';
import { initGfx, renderer, scene, camera } from './gfx.js';
import { Scenes, LoadingScene } from './scenes.js';

const container = document.getElementById('game'), ui = document.getElementById('ui');
initGfx(container, ui);
bindInput(renderer.domElement);
const uctx = ui.getContext('2d');
G.ui = uctx;

export const DEV = new URLSearchParams(location.search);
G.DEV = DEV; G.SPEED = Math.max(1, Math.min(8, +(DEV.get('speed') || 1)));
if (DEV.has('lowres')) { renderer.setPixelRatio(0.5); renderer.shadowMap.enabled = false; }

let last = performance.now();
function frame(now) {
  let dt = (now - last) / 1000; last = now; if (dt > 1 / 20) dt = 1 / 20;
  G.time += dt; if (G.state) G.state.playTime += dt;
  try {
    const sc = G.scene;
    if (sc) {
      for (let i = 0; i < G.SPEED; i++) sc.update(dt);
      if (sc.render3d !== false) renderer.render(scene, camera);
      uctx.setTransform(G.uiScale, 0, 0, G.uiScale, 0, 0); uctx.clearRect(0, 0, W, H);
      sc.draw(uctx);
    }
  } catch (e) { console.error(e); uctx.setTransform(G.uiScale, 0, 0, G.uiScale, 0, 0); uctx.fillStyle = '#300'; uctx.fillRect(0, 0, W, 40); uctx.fillStyle = '#fff'; uctx.font = '14px monospace'; uctx.fillText('Error: ' + e.message, 10, 25); }
  Input.endFrame();
  requestAnimationFrame(frame);
}
Scenes.set(new LoadingScene());
requestAnimationFrame(frame);
// handle for automated tests / debugging
window.FG = { G, Input, Scenes };
