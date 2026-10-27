import * as THREE from 'three';

// Smooth, overshoot-free camera path.
// Each channel is interpolated with a monotone cubic Hermite spline
// (Fritsch–Carlson, non-uniform knots) → C1 continuous, no wobble on "holds".

const CHANNELS = ['tx', 'ty', 'tz', 'yaw', 'pitch', 'dist', 'roll', 'fov'];

function flatten(k) {
  return { t: k.t, tx: k.target[0], ty: k.target[1], tz: k.target[2], yaw: k.yaw, pitch: k.pitch, dist: k.dist, roll: k.roll, fov: k.fov };
}

function tangents(ts, vs) {
  const n = ts.length;
  const d = [];
  for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i]));
  const m = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) { m[i] = 0; continue; }
    const h0 = ts[i] - ts[i - 1], h1 = ts[i + 1] - ts[i];
    const w1 = 2 * h1 + h0, w2 = h1 + 2 * h0;
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  }
  return m;
}

export class CameraPath {
  constructor(keys, handheldDeg = 0) {
    this.keys = keys.map(flatten);
    this.ts = this.keys.map((k) => k.t);
    this.m = {};
    for (const c of CHANNELS) this.m[c] = tangents(this.ts, this.keys.map((k) => k[c]));
    this.handheld = handheldDeg;
    this.target = new THREE.Vector3();
    this.q = new THREE.Quaternion();
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.fwd = new THREE.Vector3();
  }

  channel(c, time) {
    const { ts, keys } = this;
    const n = ts.length;
    if (time <= ts[0]) return keys[0][c];
    if (time >= ts[n - 1]) return keys[n - 1][c];
    let i = 0;
    while (time > ts[i + 1]) i++;
    const h = ts[i + 1] - ts[i];
    const s = (time - ts[i]) / h;
    const s2 = s * s, s3 = s2 * s;
    const v0 = keys[i][c], v1 = keys[i + 1][c];
    const m0 = this.m[c][i] * h, m1 = this.m[c][i + 1] * h;
    return (2 * s3 - 3 * s2 + 1) * v0 + (s3 - 2 * s2 + s) * m0 + (-2 * s3 + 3 * s2) * v1 + (s3 - s2) * m1;
  }

  // Writes the pose into `camera` and returns { dist } (used for depth-of-field focus).
  apply(camera, time, aspect) {
    const v = {};
    for (const c of CHANNELS) v[c] = this.channel(c, time);
    const hh = this.handheld;
    const yaw = v.yaw + hh * (Math.sin(time * 0.71) + 0.5 * Math.sin(time * 1.37 + 1.3));
    const pitch = v.pitch + hh * 0.8 * Math.sin(time * 0.53 + 0.7);
    const roll = v.roll + hh * 0.6 * Math.sin(time * 0.41 + 2.1);

    // keep the whole book in frame on narrow (portrait) outputs
    const fit = Math.max(1, Math.pow(16 / 9 / aspect, 0.75));
    const dist = v.dist * fit;

    this.euler.set(THREE.MathUtils.degToRad(pitch), THREE.MathUtils.degToRad(yaw), THREE.MathUtils.degToRad(roll), 'YXZ');
    this.q.setFromEuler(this.euler);
    this.fwd.set(0, 0, -1).applyQuaternion(this.q);
    this.target.set(v.tx, v.ty, v.tz);
    camera.quaternion.copy(this.q);
    camera.position.copy(this.target).addScaledVector(this.fwd, -dist);
    camera.fov = v.fov;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    return { dist };
  }
}
