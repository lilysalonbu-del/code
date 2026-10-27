import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makePaperTooth, makeBlockSideTexture } from './skin.js';

const PI = Math.PI;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smoother = (x) => x * x * x * (x * (x * 6 - 15) + 10);
const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// ─────────────────────────────────────────────────────────────────────────────
//  Leaf: one bendable sheet (paper page or hardcover board) with real thickness.
//  Vertices are rebuilt on the CPU every frame by integrating a bend angle along
//  the sheet, so the page can curl, lag, flutter and settle like paper.
// ─────────────────────────────────────────────────────────────────────────────
class Leaf {
  constructor({ len, span, thick, nx, nz, rootX, aoStrength, aoLen, materials }) {
    Object.assign(this, { len, span, thick, nx, nz, rootX });
    const cols = nx + 1, rows = nz + 1, nTop = cols * rows;
    this.nTop = nTop;
    const nTip = rows * 2, nSide = cols * 2;
    this.tipBase = nTop * 2;
    this.sideA = this.tipBase + nTip;
    this.sideB = this.sideA + nSide;
    const total = this.sideB + nSide;
    this.pos = new Float32Array(total * 3);
    const uv = new Float32Array(total * 2);
    const col = new Float32Array(total * 3).fill(1);

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const k = i * rows + j;
        const sn = i / nx;
        const v = 0.5 - ((j / nz) * 2 - 1) * 0.5;
        uv[k * 2] = sn; uv[k * 2 + 1] = v;
        uv[(nTop + k) * 2] = 1 - sn; uv[(nTop + k) * 2 + 1] = v;
        const ao = 1 - aoStrength * Math.exp(-(sn * len) / aoLen);
        col.set([ao, ao, ao], k * 3);
        col.set([ao, ao, ao], (nTop + k) * 3);
      }
    }

    const top = [], bot = [], edge = [];
    const id = (i, j) => i * rows + j;
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        const a = id(i, j), b = id(i + 1, j), c = id(i, j + 1), d = id(i + 1, j + 1);
        top.push(a, c, b, b, c, d);
        bot.push(nTop + a, nTop + b, nTop + c, nTop + b, nTop + d, nTop + c);
      }
    }
    for (let j = 0; j < nz; j++) { // tip edge
      const t0 = this.tipBase + j * 2, b0 = t0 + 1, t1 = t0 + 2, b1 = t0 + 3;
      edge.push(t0, t1, b0, t1, b1, b0);
    }
    for (let i = 0; i < nx; i++) { // long edges
      const a0 = this.sideA + i * 2, a1 = a0 + 2;
      edge.push(a0, a1, a0 + 1, a1, a1 + 1, a0 + 1);
      const c0 = this.sideB + i * 2, c1 = c0 + 2;
      edge.push(c0, c0 + 1, c1, c1, c0 + 1, c1 + 1);
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(total * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex([...top, ...bot, ...edge]);
    g.addGroup(0, top.length, 0);
    g.addGroup(top.length, bot.length, 1);
    g.addGroup(top.length + bot.length, edge.length, 2);
    this.geometry = g;

    this.mesh = new THREE.Mesh(g, materials);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;
  }

  copyV(dst, src) {
    const p = this.pos;
    p[dst * 3] = p[src * 3]; p[dst * 3 + 1] = p[src * 3 + 1]; p[dst * 3 + 2] = p[src * 3 + 2];
  }

  // angleAt(sn, zn) → bend angle (rad) at normalised arc position sn∈[0,1], row zn∈[-1,1]
  update(rootY, angleAt) {
    const { nx, nz, len, span, thick, rootX, pos, nTop } = this;
    const rows = nz + 1, ds = len / nx, h = thick / 2;
    for (let j = 0; j <= nz; j++) {
      const zn = (j / nz) * 2 - 1, z = zn * span / 2;
      let x = rootX, y = rootY;
      for (let i = 0; i <= nx; i++) {
        const th = angleAt(i / nx, zn);
        const nxv = -Math.sin(th), nyv = Math.cos(th);
        const k = i * rows + j;
        let o = k * 3;
        pos[o] = x + nxv * h; pos[o + 1] = y + nyv * h; pos[o + 2] = z;
        o = (nTop + k) * 3;
        pos[o] = x - nxv * h; pos[o + 1] = y - nyv * h; pos[o + 2] = z;
        if (i < nx) {
          const tm = angleAt((i + 0.5) / nx, zn);
          x += Math.cos(tm) * ds; y += Math.sin(tm) * ds;
        }
      }
    }
    for (let j = 0; j <= nz; j++) {
      this.copyV(this.tipBase + j * 2, nx * rows + j);
      this.copyV(this.tipBase + j * 2 + 1, nTop + nx * rows + j);
    }
    for (let i = 0; i <= nx; i++) {
      this.copyV(this.sideA + i * 2, i * rows);
      this.copyV(this.sideA + i * 2 + 1, nTop + i * rows);
      this.copyV(this.sideB + i * 2, i * rows + nz);
      this.copyV(this.sideB + i * 2 + 1, nTop + i * rows + nz);
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Book: back cover, paper block, spine, N paper leaves and the front cover.
//  update(time) is a pure function of time → perfectly repeatable for video.
// ─────────────────────────────────────────────────────────────────────────────
export class Book {
  constructor(config, tex) {
    this.cfg = config;
    const B = config.book, L = config.look;
    this.B = B;
    this.group = new THREE.Group();
    this.turns = config.turns;

    const N = B.leaves + 2; // front cover + papers + back cover
    this.N = N;
    const { coverThick: c, paperThick: p, blockThick: Tb, pageW: W, pageH: H, overhang: ov } = B;
    this.coverRootX = -0.02;
    const Lc = W + ov + 0.02;
    this.gutterY = c + Tb * 0.9;
    this.profW = 0.55;
    this.I = W * this.profW / 2; // ∫ of the gutter profile, used to hit exact stack heights
    this.heightTotal = c + Tb + p * B.leaves + c;

    const tooth = makePaperTooth();
    const paperMat = (map) => new THREE.MeshStandardMaterial({
      map, roughness: 0.82, metalness: 0, vertexColors: true, bumpMap: tooth, bumpScale: 0.5,
    });
    const coverMat = (map) => new THREE.MeshPhysicalMaterial({
      map, roughness: 0.55, metalness: 0, vertexColors: true, clearcoat: 0.12, clearcoatRoughness: 0.55,
    });
    const paperEdge = new THREE.MeshStandardMaterial({ color: L.paperEdge, roughness: 1, side: THREE.DoubleSide });
    const coverEdge = new THREE.MeshStandardMaterial({ color: L.coverEdge, roughness: 0.7, side: THREE.DoubleSide });

    this.leaves = [];
    for (let k = 0; k < N; k++) {
      const isCover = k === 0, isBack = k === N - 1;
      const rigid = isCover || isBack;
      let front, back;
      if (isCover) { front = tex.cover; back = tex['cover-inside']; }
      else if (isBack) { front = tex['back-inside']; back = tex.back; }
      else { front = tex[`page-${String(2 * k - 1).padStart(2, '0')}`]; back = tex[`page-${String(2 * k).padStart(2, '0')}`]; }
      const mk = rigid ? coverMat : paperMat;
      const leaf = new Leaf({
        len: rigid ? Lc : W,
        span: rigid ? H + 2 * ov : H,
        thick: rigid ? c : p,
        nx: rigid ? 14 : 44,
        nz: rigid ? 6 : 12,
        rootX: rigid ? this.coverRootX : 0,
        aoStrength: rigid ? 0.35 : L.gutterShadow,
        aoLen: rigid ? 0.06 : L.gutterLength,
        materials: [mk(front), mk(back), rigid ? coverEdge : paperEdge],
      });
      leaf.k = k; leaf.rigid = rigid;
      this.leaves.push(leaf);
      this.group.add(leaf.mesh);
    }

    // paper block (the thick "rest of the book" under the visible leaves)
    const sideTex = makeBlockSideTexture(L.paperEdge);
    sideTex.repeat.set(1, Tb / 0.004);
    const side = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 1 });
    const flat = new THREE.MeshStandardMaterial({ color: L.paperEdge, roughness: 1 });
    const blockW = W - 0.01 + 0.02;
    const block = new THREE.Mesh(new THREE.BoxGeometry(blockW, Tb, H - 0.02), [side, side, flat, flat, side, side]);
    block.position.set(-0.02 + blockW / 2, c + Tb / 2, 0);
    block.castShadow = block.receiveShadow = true;
    this.group.add(block);

    // spine
    const spineMat = new THREE.MeshPhysicalMaterial({
      color: tex.spine ? 0xffffff : L.cover, map: tex.spine || null, roughness: 0.55, clearcoat: 0.12,
    });
    const spine = new THREE.Mesh(new RoundedBoxGeometry(0.03, this.heightTotal, H + 2 * ov, 3, 0.008), spineMat);
    spine.position.set(-0.035, this.heightTotal / 2, 0);
    spine.castShadow = spine.receiveShadow = true;
    this.group.add(spine);

    this.staticDone = false;
  }

  // stack-centre heights
  hRight(k) {
    const { coverThick: c, paperThick: p, blockThick: Tb } = this.B;
    const N = this.N;
    if (k === N - 1) return c / 2;
    if (k === 0) return c + Tb + p * this.B.leaves + c / 2;
    return c + Tb + p * (N - 2 - k) + p / 2;
  }
  hLeft(k) {
    const { coverThick: c, paperThick: p } = this.B;
    return k === 0 ? c / 2 : c + p * (k - 1) + p / 2;
  }

  turnState(k, time) {
    const t = this.turns.find((x) => x.leaf === k);
    if (!t) return { u: 0, e: 0, settle: 0, curl: 0, has: false };
    const u = clamp01((time - t.start) / t.dur);
    const end = t.start + t.dur;
    const tau = time > end ? time - end : 0;
    const settle = tau > 0 ? Math.exp(-3.2 * tau) * 0.5 * (1 - Math.cos(12 * tau)) : 0;
    return { u, e: smoother(u), settle, curl: t.curl, has: true };
  }

  update(time) {
    const N = this.N;
    const c = this.B.coverThick;
    const cover = this.turnState(0, time);
    const o = cover.e; // how "open" the book is

    for (const leaf of this.leaves) {
      const k = leaf.k;
      if (k === N - 1) {
        if (this.staticDone) continue;
        leaf.update(c / 2, () => 0);
        this.staticDone = true;
        continue;
      }
      const s = this.turnState(k, time);
      const ripple = s.settle * (s.has ? 0.5 : 0);

      if (k === 0) {
        const rootY = lerp(this.hRight(0), c / 2, s.e);
        leaf.update(rootY, (sn, zn) => {
          const sw = Math.pow(sn, 1.6);
          const curl = s.curl * Math.sin(2 * PI * s.u) * sw * (1 + 0.3 * zn);
          return PI * s.e + curl - 0.3 * s.settle * sn * sn;
        });
        continue;
      }

      const gy = this.gutterY;
      const rootRight = lerp(this.hRight(k), gy + (N / 2 - k) * 0.004, o);
      const rootLeft = gy + (k - N / 2) * 0.004;
      const rootY = lerp(rootRight, rootLeft, s.e);
      const aR = (this.hRight(k) - rootRight) / this.I;
      const aL = (this.hLeft(k) - rootLeft) / this.I;
      const { profW } = this;
      leaf.update(rootY, (sn, zn) => {
        const prof = 1 - smoothstep(0, profW, sn);
        const base = lerp(aR * prof, PI - aL * prof, s.e);
        if (!s.has) return base;
        const sw = Math.pow(sn, 1.6);
        const rowK = 1 + 0.4 * zn; // one corner leads → diagonal peel
        const curl = s.curl * Math.sin(2 * PI * s.u) * sw * rowK;
        const flutter = 0.045 * Math.sin(PI * s.u) * Math.sin(sn * 10 - s.u * 16) * sn;
        return base + curl + flutter - ripple * 0.35 * sn * sn;
      });
    }
    return o;
  }
}
