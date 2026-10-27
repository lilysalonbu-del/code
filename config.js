// ─────────────────────────────────────────────────────────────────────────────
//  Camera, book, timing and artwork mapping for the book animation.
//  Times are in seconds. Lengths are in "book units" (1 unit ≈ one page width).
// ─────────────────────────────────────────────────────────────────────────────

export const CONFIG = {
  fps: 30,
  width: 1920,
  height: 1080,
  duration: 36,

  book: {
    pageW: 1.3,
    pageH: 1.8,
    overhang: 0.05,
    coverThick: 0.03,
    paperThick: 0.012,
    blockThick: 0.18,
    leaves: 10,
  },

  look: {
    cover: '#5a1d2a',
    coverEdge: '#3a121c',
    paperEdge: '#efe8d8',
    table: '#2b2a30',
    background: '#0b0b0e',
    exposure: 1.0,
    gutterShadow: 0.62,
    gutterLength: 0.11,
  },

  // Front cover opens first, then the first paper leaf, then the leaf
  // carrying page 3, and finally the inside of the back cover.
  turns: [
    { leaf: 0, start: 2.2, dur: 2.8, curl: 0.12 },
    { leaf: 1, start: 10.2, dur: 3.0, curl: 0.58 },
    { leaf: 2, start: 20.0, dur: 3.0, curl: 0.42 },
    { leaf: 11, start: 28.6, dur: 2.8, curl: 0.12 },
  ],

  dof: { enabled: true, aperture: 0.045, maxBlur: 0.004, refDist: 3.5 },

  // Framing is intentionally restrained: the thick book stays visible,
  // reading surfaces are centered, and each reading shot has a long hold.
  camera: [
    { t: 0.0,  target: [0.62, 0.20, 0.0], yaw: -8, pitch: -78, dist: 4.8, roll: 0, fov: 30 },
    { t: 2.0,  target: [0.62, 0.20, 0.0], yaw: -3, pitch: -84, dist: 4.15, roll: 0, fov: 30 },
    { t: 5.0,  target: [0.62, 0.23, 0.0], yaw: 0, pitch: -88, dist: 3.55, roll: 0, fov: 30 },
    { t: 8.7,  target: [0.62, 0.23, 0.0], yaw: 0, pitch: -88, dist: 3.55, roll: 0, fov: 30 },

    { t: 10.0, target: [0.62, 0.22, 0.0], yaw: 0, pitch: -86, dist: 4.25, roll: 0, fov: 30 },
    { t: 12.8, target: [0.62, 0.22, 0.0], yaw: 2, pitch: -87, dist: 3.45, roll: 0, fov: 30 },
    { t: 18.5, target: [0.62, 0.22, 0.0], yaw: 2, pitch: -87, dist: 3.45, roll: 0, fov: 30 },

    { t: 20.0, target: [0.62, 0.22, 0.0], yaw: 0, pitch: -85, dist: 4.2, roll: 0, fov: 30 },
    { t: 23.0, target: [0.62, 0.22, 0.0], yaw: 0, pitch: -87, dist: 3.45, roll: 0, fov: 30 },
    { t: 27.8, target: [0.62, 0.22, 0.0], yaw: 0, pitch: -87, dist: 3.45, roll: 0, fov: 30 },

    { t: 29.0, target: [0.0, 0.20, 0.0], yaw: 0, pitch: -82, dist: 4.25, roll: 0, fov: 30 },
    { t: 32.0, target: [-0.55, 0.22, 0.0], yaw: 0, pitch: -87, dist: 3.55, roll: 0, fov: 30 },
    { t: 35.8, target: [-0.55, 0.22, 0.0], yaw: 0, pitch: -87, dist: 3.55, roll: 0, fov: 30 },
    { t: 36.0, target: [0.0, 0.12, 0.0], yaw: 0, pitch: -90, dist: 4.7, roll: 0, fov: 30 },
  ],

  handheld: 0.035,

  // Images currently uploaded to the repository root, mapped to their
  // intended semantic surfaces. Missing artwork uses the procedural fallback.
  skin: {
    dir: '',
    exts: ['jpg', 'png', 'jpeg', 'webp'],
    files: {
      'cover-inside': 'cover.jpg',
      'page-01': 'cover-inside.jpg',
      'page-03': 'page-01.jpg',
      'back-inside': 'page-20.jpg',
    },
  },
};
