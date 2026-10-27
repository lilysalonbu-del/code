import * as THREE from 'three';

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function grain(ctx, w, h, amount, r) {
  const n = Math.floor((w * h) / 18);
  for (let i = 0; i < n; i++) { const v = r() < 0.5 ? 0 : 255; ctx.fillStyle = `rgba(${v},${v},${v},${r() * amount})`; ctx.fillRect(r() * w, r() * h, 1.5, 1.5); }
}
function shade(hex, f) { const c = new THREE.Color(hex); c.multiplyScalar(f); return '#' + c.getHexString(); }
const PALETTES = [
  ['#e4572e', '#17bebb', '#ffc914', '#2e282a'], ['#264653', '#2a9d8f', '#e9c46a', '#f4a261'],
  ['#0b3954', '#bfd7ea', '#ff6663', '#e0ff4f'], ['#3d405b', '#e07a5f', '#f2cc8f', '#81b29a'],
  ['#1b1b1e', '#c9ada7', '#9a8c98', '#f2e9e4'], ['#5f0f40', '#fb8b24', '#e36414', '#0f4c5c'],
];
function paintPage(ctx, w, h, seed) {
  const r = rng(seed * 7919 + 13), pal = PALETTES[Math.floor(r() * PALETTES.length)];
  ctx.fillStyle = '#f3eee3'; ctx.fillRect(0, 0, w, h);
  const margin = w * 0.09, shapes = 5 + Math.floor(r() * 4);
  for (let i = 0; i < shapes; i++) {
    ctx.fillStyle = pal[Math.floor(r() * pal.length)]; ctx.globalAlpha = 0.85;
    const kind = Math.floor(r() * 4), x = margin + r() * (w - margin * 2), y = margin + r() * (h - margin * 2), s = w * (0.12 + r() * 0.32);
    ctx.beginPath();
    if (kind === 0) ctx.arc(x, y, s, 0, Math.PI * 2);
    else if (kind === 1) ctx.arc(x, y, s, 0, Math.PI);
    else if (kind === 2) ctx.rect(x - s, y - s * 0.3, s * 2, s * 0.6);
    else { ctx.moveTo(x, y - s); ctx.lineTo(x + s, y + s); ctx.lineTo(x - s, y + s); ctx.closePath(); }
    ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(30,25,20,0.55)'; ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) { const y = margin + r() * (h - margin * 2); ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(w - margin * (0.5 + r()), y); ctx.stroke(); }
  ctx.strokeRect(margin * 0.6, margin * 0.6, w - margin * 1.2, h - margin * 1.2); grain(ctx, w, h, 0.07, r);
}
function paintCover(ctx, w, h, color, emblem) {
  const r = rng(99); ctx.fillStyle = color; ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 3) { ctx.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.05})`; ctx.fillRect(0, y, w, 1); }
  for (let x = 0; x < w; x += 3) { ctx.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.03})`; ctx.fillRect(x, 0, 1, h); }
  const g = ctx.createRadialGradient(w * 0.4, h * 0.35, w * 0.1, w * 0.5, h * 0.5, h * 0.75);
  g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0.30)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#c9a96a'; ctx.lineWidth = 5; const m = w * 0.07; ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);
  ctx.lineWidth = 2; ctx.strokeRect(m * 1.35, m * 1.35, w - 2.7 * m, h - 2.7 * m);
  if (emblem) { ctx.lineWidth = 4; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(w / 2, h * 0.46, w * (0.09 + i * 0.045), 0, Math.PI * 2); ctx.stroke(); } ctx.fillStyle = '#c9a96a'; ctx.beginPath(); ctx.arc(w / 2, h * 0.46, w * 0.03, 0, Math.PI * 2); ctx.fill(); }
  grain(ctx, w, h, 0.10, r);
}
function paintEndpaper(ctx, w, h, color) {
  ctx.fillStyle = shade(color, 1.25); ctx.fillRect(0, 0, w, h); ctx.strokeStyle = shade(color, 0.8); ctx.lineWidth = 2; const s = 64;
  for (let y = -s; y < h + s; y += s) for (let x = -s; x < w + s; x += s) { const ox = ((y / s) % 2) * (s / 2); ctx.beginPath(); ctx.moveTo(x + ox, y - s / 2); ctx.lineTo(x + ox + s / 2, y); ctx.lineTo(x + ox, y + s / 2); ctx.lineTo(x + ox - s / 2, y); ctx.closePath(); ctx.stroke(); }
  grain(ctx, w, h, 0.08, rng(5));
}
function proceduralFor(name, look) {
  const [c, ctx] = makeCanvas(1024, 1420);
  if (name === 'cover') paintCover(ctx, 1024, 1420, look.cover, true);
  else if (name === 'back') paintCover(ctx, 1024, 1420, look.cover, false);
  else if (name === 'cover-inside' || name === 'back-inside') paintEndpaper(ctx, 1024, 1420, look.cover);
  else if (name === 'spine') { c.width = 128; c.height = 1024; paintCover(ctx, 128, 1024, look.cover, false); }
  else if (name === 'table') return null;
  else paintPage(ctx, 1024, 1420, parseInt(name.replace('page-', ''), 10) || 1);
  return c;
}
function loadImage(url) { return new Promise((res) => { const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null); img.src = url; }); }
export async function loadSkin(names, config, renderer) {
  const maxAniso = renderer.capabilities.getMaxAnisotropy(), out = {}, found = [];
  await Promise.all(names.map(async (name) => {
    let src = null;
    const mappedFile = config.skin.files && config.skin.files[name];
    if (mappedFile) src = await loadImage(`${config.skin.dir}${mappedFile}`);
    else for (const ext of config.skin.exts) { src = await loadImage(`${config.skin.dir}${name}.${ext}`); if (src) break; }
    if (src) found.push(name); else src = proceduralFor(name, config.look);
    if (!src) return;
    const tex = new THREE.Texture(src); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso;
    tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.needsUpdate = true; out[name] = tex;
  }));
  out.__found = found; return out;
}
export function makePaperTooth() {
  const [c, ctx] = makeCanvas(256, 256), img = ctx.createImageData(256, 256), r = rng(321);
  for (let i = 0; i < 256 * 256; i++) { const v = 128 + (r() - 0.5) * 90; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
  ctx.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 7); return t;
}
export function makeBlockSideTexture(paperEdge) {
  const [c, ctx] = makeCanvas(8, 32); ctx.fillStyle = paperEdge; ctx.fillRect(0, 0, 8, 32);
  ctx.fillStyle = 'rgba(80,65,45,0.45)'; ctx.fillRect(0, 0, 8, 2); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(0, 16, 8, 1);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
export function makeTableTexture(color) {
  const [c, ctx] = makeCanvas(1024, 1024), r = rng(77); ctx.fillStyle = color; ctx.fillRect(0, 0, 1024, 1024);
  for (let y = 0; y < 1024; y += 2) { ctx.fillStyle = `rgba(255,255,255,${r() * 0.018})`; ctx.fillRect(0, y, 1024, 1); }
  for (let x = 0; x < 1024; x += 2) { ctx.fillStyle = `rgba(0,0,0,${r() * 0.03})`; ctx.fillRect(x, 0, 1, 1024); }
  grain(ctx, 1024, 1024, 0.025, r); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); t.anisotropy = 8; return t;
}
export function makeContactShadowTexture() { const [c, ctx] = makeCanvas(256, 256); ctx.filter = 'blur(14px)'; ctx.fillStyle = '#000'; ctx.fillRect(48, 48, 160, 160); return new THREE.CanvasTexture(c); }
