import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CONFIG } from './config.js';
import { Book } from './book.js';
import { CameraPath } from './cameraPath.js';
import { loadSkin, makeTableTexture, makeContactShadowTexture } from './skin.js';

const params = new URLSearchParams(location.search);
const renderMode = params.has('render');
const L = CONFIG.look;

let width = renderMode ? parseInt(params.get('w')) || CONFIG.width : window.innerWidth;
let height = renderMode ? parseInt(params.get('h')) || CONFIG.height : window.innerHeight;
const pixelRatio = renderMode ? 1 : Math.min(window.devicePixelRatio || 1, 2);

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: renderMode, powerPreference: 'high-performance' });
renderer.setPixelRatio(pixelRatio);
renderer.setSize(width, height);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = L.exposure;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(L.background);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.22;

const camera = new THREE.PerspectiveCamera(30, width / height, 0.05, 40);

// ── lights ──
const key = new THREE.SpotLight(0xfff0dc, 330, 0, 0.5, 0.85, 2);
key.position.set(-3.4, 6.8, 3.2);
key.target.position.set(0, 0, 0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 3;
key.shadow.camera.far = 16;
key.shadow.bias = -0.00015;
key.shadow.normalBias = 0.012;
key.shadow.radius = 5;
scene.add(key, key.target);
scene.add(new THREE.HemisphereLight(0xfff4e6, 0x2a2a35, 0.3));
const rim = new THREE.DirectionalLight(0xbcd0ff, 0.9);
rim.position.set(3, 2.5, -4);
scene.add(rim);

// ── table + contact shadow ──
const table = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshStandardMaterial({ map: makeTableTexture(L.table), roughness: 0.9, metalness: 0 })
);
table.rotation.x = -Math.PI / 2;
table.position.y = -0.002;
table.receiveShadow = true;
scene.add(table);

const aoPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({ map: makeContactShadowTexture(), color: 0x000000, transparent: true, opacity: 0.6, depthWrite: false })
);
aoPlane.rotation.x = -Math.PI / 2;
aoPlane.position.y = 0.0005;
scene.add(aoPlane);

// ── post ──
const rt = new THREE.WebGLRenderTarget(width * pixelRatio, height * pixelRatio, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.setPixelRatio(pixelRatio);
composer.setSize(width, height);
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 4, aperture: 0.0, maxblur: CONFIG.dof.maxBlur });
bokeh.enabled = CONFIG.dof.enabled;
composer.addPass(bokeh);
composer.addPass(new OutputPass());

// ── book ──
const camPath = new CameraPath(CONFIG.camera, CONFIG.handheld);
let book;

function renderAt(time) {
  const o = book.update(time);
  const { dist } = camPath.apply(camera, time, width / height);

  // contact shadow follows the footprint (closed → open)
  const B = CONFIG.book;
  const right = B.pageW + B.overhang + 0.16;
  const left = -0.12 - o * (B.pageW + B.overhang + 0.1);
  aoPlane.scale.set(right - left, B.pageH + 2 * B.overhang + 0.28, 1);
  aoPlane.position.x = (right + left) / 2;
  aoPlane.scale.y = B.pageH + 2 * B.overhang + 0.28; // z extent after rotation

  bokeh.uniforms.focus.value = dist;
  bokeh.uniforms.aperture.value = CONFIG.dof.aperture * (CONFIG.dof.refDist / dist) * 0.01;
  composer.render();
}

function setSize(w, h) {
  width = w; height = h;
  renderer.setSize(w, h);
  composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

async function init() {
  const B = CONFIG.book;
  const names = ['cover', 'cover-inside', 'back-inside', 'back', 'spine'];
  for (let i = 1; i <= B.leaves * 2; i++) names.push(`page-${String(i).padStart(2, '0')}`);
  const tex = await loadSkin(names, CONFIG, renderer);
  book = new Book(CONFIG, tex);
  scene.add(book.group);
  window.__book = { ready: true, duration: CONFIG.duration, fps: CONFIG.fps, renderAt, setSize, canvas: renderer.domElement, skinFound: tex.__found };
  renderAt(0);

  if (renderMode) return;

  // ── interactive viewer (no on-screen text; keys below) ──
  //   Space = pause/play   ←/→ = scrub 0.25s   Home = restart   F = fullscreen
  const still = params.get('t');
  if (still !== null) { renderAt(parseFloat(still)); return; }

  let t = 0, paused = false, last = performance.now();
  const hold = 1.5;
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { paused = !paused; e.preventDefault(); }
    else if (e.code === 'ArrowRight') t = Math.min(CONFIG.duration, t + 0.25);
    else if (e.code === 'ArrowLeft') t = Math.max(0, t - 0.25);
    else if (e.code === 'Home') t = 0;
    else if (e.code === 'KeyF') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  });
  window.addEventListener('resize', () => setSize(window.innerWidth, window.innerHeight));
  const loop = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!paused) { t += dt; if (t > CONFIG.duration + hold) t = 0; }
    renderAt(Math.min(t, CONFIG.duration));
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

init().catch((e) => { console.error(e); window.__book = { error: String(e) }; });
