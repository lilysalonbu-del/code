// Renders the animation frame-by-frame in headless Chrome and encodes an MP4 with ffmpeg.
//
//   node render.js                         → out/book.mp4  (1920×1080, 30 fps)
//   node render.js --width 1080 --height 1920   (vertical / reels)
//   node render.js --stills 3,7.5,9,14     → PNG screenshots only (fast way to check the look)
//   node render.js --blur 4                → real motion blur (4 sub-frames per frame, slower)
//
// Options: --width --height --fps --out --crf --blur --start --end --stills --headed --chrome <path>
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { startServer } from './server.js';
import { CONFIG } from './config.js';

const argv = process.argv.slice(2);
const opt = {};
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) {
    const k = argv[i].slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) opt[k] = true;
    else { opt[k] = next; i++; }
  }
}

const even = (n) => Math.max(2, Math.round(n / 2) * 2);
const width = even(parseInt(opt.width) || CONFIG.width);
const height = even(parseInt(opt.height) || CONFIG.height);
const fps = parseInt(opt.fps) || CONFIG.fps;
const crf = parseInt(opt.crf) || 14;
const blur = Math.max(1, parseInt(opt.blur) || 1);
const out = opt.out || 'out/book.mp4';

let puppeteer;
try { puppeteer = (await import('puppeteer')).default; }
catch { console.error('Missing dependency. Run:  npm install'); process.exit(1); }

const server = await startServer(0);
const port = server.address().port;

const browser = await puppeteer.launch({
  headless: !opt.headed,
  executablePath: opt.chrome || process.env.CHROME_PATH || undefined,
  args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-unsafe-swiftshader', '--use-angle=default', '--no-sandbox', '--disable-dev-shm-usage', `--window-size=${width},${height}`],
  defaultViewport: { width, height, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
page.on('console', (m) => {
  const txt = m.text();
  if (['error', 'warning'].includes(m.type()) && !txt.includes('404')) console.log('[page]', txt); // 404s = skin images you haven't added yet
});
page.on('pageerror', (e) => console.log('[page error]', e.message));
await page.goto(`http://127.0.0.1:${port}/index.html?render=1&w=${width}&h=${height}`);
await page.waitForFunction('window.__book && (window.__book.ready || window.__book.error)', { timeout: 180000 });
const info = await page.evaluate(() => ({ error: window.__book.error, duration: window.__book.duration, found: window.__book.skinFound }));
if (info.error) { console.error('Page failed:', info.error); await browser.close(); server.close(); process.exit(1); }
console.log(`Skin images found: ${info.found.length ? info.found.sort().join(', ') : 'none (using procedural art)'}`);

const grab = (t) => page.evaluate((time) => { window.__book.renderAt(time); return window.__book.canvas.toDataURL('image/png').split(',')[1]; }, t);

async function finish() { await browser.close(); server.close(); }

if (opt.stills) {
  const dir = path.dirname(out);
  fs.mkdirSync('out/stills', { recursive: true });
  for (const t of String(opt.stills).split(',').map(Number)) {
    const b64 = await grab(t);
    const f = `out/stills/t${t.toFixed(2)}.png`;
    fs.writeFileSync(f, Buffer.from(b64, 'base64'));
    console.log('wrote', f);
  }
  await finish();
  process.exit(0);
}

const startT = parseFloat(opt.start) || 0;
const endT = parseFloat(opt.end) || info.duration;
const frames = Math.round((endT - startT) * fps);
fs.mkdirSync(path.dirname(out), { recursive: true });

const vf = (blur > 1 ? `tmix=frames=${blur},select=eq(mod(n\\,${blur})\\,${blur - 1}),setpts=N/${fps}/TB,` : '') + 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p';
const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(fps * blur), '-i', '-',
  '-vf', vf, '-r', String(fps),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-movflags', '+faststart', out,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const ffDone = new Promise((r) => ff.on('close', r));
ff.stdin.on('error', () => {});

const t0 = Date.now();
for (let f = 0; f < frames; f++) {
  for (let s = 0; s < blur; s++) {
    // 180° shutter: sub-frame times are spread across half a frame interval, centred on the frame
    const t = startT + (f + (blur === 1 ? 0 : ((s + 0.5) / blur - 0.5) * 0.5)) / fps;
    const buf = Buffer.from(await grab(Math.max(0, t)), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  if (f % 10 === 0 || f === frames - 1) {
    const el = (Date.now() - t0) / 1000, eta = (el / (f + 1)) * (frames - f - 1);
    process.stdout.write(`\rframe ${f + 1}/${frames}  ${(((f + 1) / frames) * 100).toFixed(0)}%  ETA ${Math.round(eta)}s   `);
  }
}
ff.stdin.end();
await ffDone;
console.log(`\nDone → ${out}`);
await finish();
