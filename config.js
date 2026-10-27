// ─────────────────────────────────────────────────────────────────────────────
//  EVERYTHING you'll want to tweak lives in this file.
//  Times are in seconds. Lengths are in "book units" (1 unit ≈ one page width).
// ─────────────────────────────────────────────────────────────────────────────

export const CONFIG = {
  // ── output (used by render.js; the browser viewer just fills the window) ──
  fps: 30,
  width: 1920,
  height: 1080,
  duration: 22, // total length of the animation in seconds

  // ── book geometry ──
  book: {
    pageW: 1.3,
    pageH: 1.8, // page ratio 13:18 → export your page images at e.g. 1300×1800
    overhang: 0.05, // how far the hardcover sticks out past the pages
    coverThick: 0.03,
    paperThick: 0.012,
    blockThick: 0.18, // the hidden "rest of the pages" under the visible leaves
    leaves: 10, // paper leaves (1 leaf = 2 pages) between the covers → 20 pages
  },

  // ── look ──
  look: {
    cover: '#5a1d2a', // used by the procedural cover + cover edges + spine
    coverEdge: '#3a121c',
    paperEdge: '#efe8d8',
    table: '#2b2a30',
    background: '#0b0b0e',
    exposure: 1.0,
    gutterShadow: 0.62, // 0..1 darkness in the page gutter near the spine
    gutterLength: 0.11,
  },

  // ── page turns ──  leaf 0 = the front cover, leaf 1 = first paper leaf, …
  // curl = how much the free edge lags/leads (0 = rigid board, ~0.75 = floppy paper)
  turns: [
    { leaf: 0, start: 2.1, dur: 2.7, curl: 0.12 },
    { leaf: 1, start: 7.5, dur: 2.7, curl: 0.78 },
    { leaf: 2, start: 15.0, dur: 2.7, curl: 0.78 },
  ],

  // ── depth of field (set enabled:false for a faster, fully sharp render) ──
  dof: { enabled: true, aperture: 0.09, maxBlur: 0.01, refDist: 3.5 },

  // ── camera path ──
  // target = point we look at, yaw/pitch/roll in degrees (pitch -90 = straight down),
  // dist = distance from target. The path is a smooth monotone spline through these.
  camera: [
    { t: 0.0, target: [0.62, 0.2, 0.0], yaw: -8, pitch: -78, dist: 4.7, roll: 0, fov: 30 },
    { t: 1.8, target: [0.64, 0.2, 0.0], yaw: -4, pitch: -84, dist: 4.25, roll: 0, fov: 30 },
    { t: 3.6, target: [0.15, 0.15, 0.0], yaw: 0, pitch: -88, dist: 4.9, roll: 0, fov: 30 },
    { t: 5.0, target: [0.0, 0.12, 0.0], yaw: 0, pitch: -90, dist: 4.7, roll: 0, fov: 30 },
    { t: 6.2, target: [0.1, 0.2, 0.05], yaw: 6, pitch: -70, dist: 3.4, roll: 0, fov: 30 },
    { t: 7.5, target: [0.55, 0.26, 0.1], yaw: 16, pitch: -42, dist: 1.9, roll: 0, fov: 30 },
    { t: 8.8, target: [0.62, 0.28, 0.3], yaw: 24, pitch: -24, dist: 1.45, roll: 2, fov: 30 },
    { t: 10.5, target: [-0.3, 0.22, 0.1], yaw: -14, pitch: -26, dist: 1.5, roll: -2, fov: 30 },
    { t: 12.3, target: [-0.62, 0.12, 0.0], yaw: -8, pitch: -58, dist: 1.25, roll: 0, fov: 30 },
    { t: 14.1, target: [0.62, 0.22, -0.1], yaw: 12, pitch: -48, dist: 1.25, roll: 0, fov: 30 },
    { t: 15.8, target: [0.6, 0.25, 0.0], yaw: 6, pitch: -52, dist: 1.75, roll: 0, fov: 30 },
    { t: 17.2, target: [0.0, 0.18, 0.0], yaw: 0, pitch: -75, dist: 2.9, roll: 0, fov: 30 },
    { t: 19.0, target: [0.0, 0.12, 0.0], yaw: 0, pitch: -90, dist: 4.7, roll: 0, fov: 30 },
    { t: 22.0, target: [0.0, 0.12, 0.0], yaw: 0, pitch: -90, dist: 4.5, roll: 0, fov: 30 },
  ],

  // tiny deterministic hand-held drift (degrees); set to 0 for a locked-off camera
  handheld: 0.18,

  // ── skin: drop images in /skin and they replace the procedural art ──
  // File names (jpg, png, jpeg or webp):
  //   cover            front cover (outside)            ~1370×1900
  //   cover-inside     inside of the front cover
  //   page-01 … page-20  the paper pages, in reading order   ~1300×1800
  //   back-inside      inside of the back cover
  //   back             back cover (outside)
  //   spine            the spine (optional)
  //   table            tabletop texture (optional, tiles)
  skin: { dir: 'skin/', exts: ['jpg', 'png', 'jpeg', 'webp'] },
};
