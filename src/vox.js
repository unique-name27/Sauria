/* ===== Voxel engine: everything on screen is built from small cubes =====
   VoxSet       a sparse set of coloured voxels on an integer grid
   meshVox      turns a VoxSet into a mesh of its exposed faces, with corner ambient occlusion
   voxelize     replaces the smooth meshes of a jointed model with voxels, joint by joint
   voxTerrain   a fine heightfield of voxel columns, greedy-meshed into chunks */
const VK = (x, y, z) => ((x + 1024) * 2048 + (y + 1024)) * 2048 + (z + 1024);
const VX = k => { const z = (k % 2048) - 1024, r = Math.floor(k / 2048), y = (r % 2048) - 1024, x = Math.floor(r / 2048) - 1024; return [x, y, z]; };
const vhash = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

class VoxSet {
  constructor() { this.m = new Map(); }
  set(x, y, z, c) { this.m.set(VK(x, y, z), c); return this; } // c: THREE.Color (linear)
  get(x, y, z) { return this.m.get(VK(x, y, z)); }
  has(x, y, z) { return this.m.has(VK(x, y, z)); }
  del(x, y, z) { this.m.delete(VK(x, y, z)); }
  get size() { return this.m.size; }
  /* fill a solid sphere / ellipsoid; col(x, y, z, t) returns a colour (t = 0 centre .. 1 surface) or null to skip */
  blob(cx, cy, cz, rx, ry, rz, col) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) {
      const t = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry, (z + 0.5 - cz) / rz); if (t > 1) continue;
      const c = col(x, y, z, t); if (c) this.set(x, y, z, c);
    }
    return this;
  }
  box(x0, y0, z0, x1, y1, z1, col) { for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) { const c = col(x, y, z); if (c) this.set(x, y, z, c); } return this; }
  /* a line of voxels with a radius, for trunks, stems and fronds */
  line(a, b, r0, r1, col) {
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) * 2) + 1;
    for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t), z = lerp(a[2], b[2], t), r = lerp(r0, r1, t);
      if (r <= 0.6) { const c = col(t); if (c) this.set(Math.floor(x), Math.floor(y), Math.floor(z), c); continue; }
      this.blob(x, y, z, r, r, r, () => col(t)); }
    return this;
  }
}

const AO_LEVELS = [1, 0.8, 0.66, 0.52];
/* exposed faces only; each corner darkened by the voxels around it */
function meshVox(V, vs, o = {}) {
  const jit = o.jitter ?? 0.08, pos = [], nor = [], col = [], idx = [], m = V.m;
  const occ = (x, y, z) => (m.has(VK(x, y, z)) ? 1 : 0);
  const p = [0, 0, 0], q = [0, 0, 0];
  for (const [k, c] of m) {
    const [x, y, z] = VX(k), jv = 1 + (vhash(x, y, z) - 0.5) * 2 * jit;
    for (let a = 0; a < 3; a++) for (const s of [1, -1]) {
      p[0] = x; p[1] = y; p[2] = z; p[a] += s;
      if (m.has(VK(p[0], p[1], p[2]))) continue;
      const u = (a + 1) % 3, v = (a + 2) % 3, plane = s > 0 ? [x, y, z][a] + 1 : [x, y, z][a];
      const corners = s > 0 ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[0, 0], [0, 1], [1, 1], [1, 0]];
      const base = pos.length / 3, ao = [];
      for (const [cu, cv] of corners) {
        q[a] = plane; q[u] = [x, y, z][u] + cu; q[v] = [x, y, z][v] + cv;
        pos.push(q[0] * vs, q[1] * vs, q[2] * vs);
        const n = [0, 0, 0]; n[a] = s; nor.push(n[0], n[1], n[2]);
        // neighbours in the layer the face looks into
        const L = [x, y, z]; L[a] += s;
        const du = cu ? 1 : -1, dv = cv ? 1 : -1;
        const s1 = L.slice(), s2 = L.slice(), cc = L.slice(); s1[u] += du; s2[v] += dv; cc[u] += du; cc[v] += dv;
        const o1 = occ(...s1), o2 = occ(...s2), o3 = occ(...cc), lv = AO_LEVELS[o1 && o2 ? 3 : o1 + o2 + o3];
        ao.push(lv); col.push(c.r * jv * lv, c.g * jv * lv, c.b * jv * lv);
      }
      if (ao[0] + ao[2] < ao[1] + ao[3]) idx.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
      else idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); if (o.offset) g.translate(...o.offset);
  g.computeBoundingSphere();
  return g;
}
const VOXMAT = new THREE.MeshLambertMaterial({ vertexColors: true });

/* fill each (x, y) row between its outermost voxels so only the outer skin is meshed */
function fillZ(V) {
  const rows = new Map();
  for (const k of V.m.keys()) { const [x, y, z] = VX(k), rk = x * 4096 + y; const r = rows.get(rk); if (!r) rows.set(rk, [x, y, z, z]); else { if (z < r[2]) r[2] = z; if (z > r[3]) r[3] = z; } }
  for (const [x, y, z0, z1] of rows.values()) { let last = V.get(x, y, z0); for (let z = z0 + 1; z < z1; z++) { const c = V.get(x, y, z); if (c) last = c; else V.set(x, y, z, last); } }
}

/* replace the smooth meshes of a jointed model with voxels; each joint keeps its own voxel mesh so it still moves */
function voxelize(root, vs, o = {}) {
  root.updateMatrixWorld(true);
  const groups = new Map();
  root.traverse(ob => { if (ob.isMesh && !ob.userData.keepSmooth) { const par = ob.parent; if (!groups.has(par)) groups.set(par, []); groups.get(par).push(ob); } });
  const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), P = new THREE.Vector3(), M = new THREE.Matrix4(), inv = new THREE.Matrix4();
  for (const [par, meshes] of groups) {
    const acc = new Map(); inv.copy(par.matrixWorld).invert();
    for (const me of meshes) {
      M.multiplyMatrices(inv, me.matrixWorld);
      const g = me.geometry.index ? me.geometry.toNonIndexed() : me.geometry, Pa = g.attributes.position, Ca = me.material.vertexColors ? g.attributes.color : null;
      const base = me.material.color ? me.material.color : new THREE.Color(1, 1, 1);
      const prio = me.userData.voxPrio || 0;
      for (let t = 0; t < Pa.count; t += 3) {
        A.fromBufferAttribute(Pa, t).applyMatrix4(M); B.fromBufferAttribute(Pa, t + 1).applyMatrix4(M); C.fromBufferAttribute(Pa, t + 2).applyMatrix4(M);
        const n = Math.max(1, Math.ceil(Math.max(A.distanceTo(B), B.distanceTo(C), C.distanceTo(A)) / (vs * 0.5)));
        for (let i = 0; i <= n; i++) for (let j = 0; j <= n - i; j++) {
          const u = i / n, v = j / n, w = 1 - u - v;
          P.set(A.x * w + B.x * u + C.x * v, A.y * w + B.y * u + C.y * v, A.z * w + B.z * u + C.z * v);
          const key = VK(Math.floor(P.x / vs), Math.floor(P.y / vs), Math.floor(P.z / vs));
          let r = base.r, gg = base.g, b = base.b;
          if (Ca) { r = Ca.getX(t) * w + Ca.getX(t + 1) * u + Ca.getX(t + 2) * v; gg = Ca.getY(t) * w + Ca.getY(t + 1) * u + Ca.getY(t + 2) * v; b = Ca.getZ(t) * w + Ca.getZ(t + 1) * u + Ca.getZ(t + 2) * v; }
          const e = acc.get(key);
          if (!e || prio > e[4]) acc.set(key, [r, gg, b, 1, prio]);
          else if (prio === e[4]) { e[0] += r; e[1] += gg; e[2] += b; e[3]++; }
        }
      }
      par.remove(me);
    }
    const V = new VoxSet();
    for (const [k, e] of acc) V.m.set(k, new THREE.Color(e[0] / e[3], e[1] / e[3], e[2] / e[3]));
    if (!o.noFill) fillZ(V);
    const vm = new THREE.Mesh(meshVox(V, vs, { jitter: o.jitter ?? 0.05 }), o.material || VOXMAT); vm.castShadow = true; vm.receiveShadow = true; par.add(vm);
  }
  return root;
}

/* ---- terrain: voxel columns on a fine grid, greedy-merged so flat ground costs little ---- */
function voxTerrainMaterial(s, o = {}) {
  const m = o.basic ? new THREE.MeshBasicMaterial({ vertexColors: true }) : new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = sh => {
    sh.uniforms.uS = { value: s }; sh.uniforms.uJit = { value: o.jitter ?? 0.14 }; sh.uniforms.uStrata = { value: o.strata || 0 };
    sh.vertexShader = 'uniform float uS;\nvarying vec3 vVox;\nvarying float vNy;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvVox = (position - normal * 0.5 * uS) / uS;\nvNy = normal.y;');
    sh.fragmentShader = 'uniform float uJit;\nuniform float uStrata;\nvarying vec3 vVox;\nvarying float vNy;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      vec3 vc = floor(vVox + 0.001);
      float vh = fract(sin(dot(vc, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      diffuseColor.rgb *= 1.0 + (vh - 0.5) * uJit;
      if (uStrata > 0.0 && vNy < 0.5) { float band = floor(vc.y / 5.0); float bh = fract(sin(band * 91.7) * 43758.5453); diffuseColor.rgb *= 1.0 + (bh - 0.5) * uStrata; }`);
  };
  m.customProgramCacheKey = () => 'voxTerrain' + (o.basic ? 'B' : 'L');
  return m;
}
/* o: { x0, z0, nx, nz, s, height(x, z) -> world y, type(x, z, hCells) -> palette index, pal: [{ top, side, sub }], chunk, skirt, glow: Set of palette indices drawn unlit } */
function voxTerrain(scene, o) {
  const { x0, z0, nx, nz, s } = o, W = nz + 2, H = new Int16Array((nx + 2) * W), T = new Uint8Array((nx + 2) * W);
  const id = (i, k) => (i + 1) * W + (k + 1);
  for (let i = -1; i <= nx; i++) for (let k = -1; k <= nz; k++) { const cx = x0 + (i + 0.5) * s, cz = z0 + (k + 0.5) * s, h = Math.round(o.height(cx, cz) / s); H[id(i, k)] = h; T[id(i, k)] = o.type(cx, cz, h * s, i, k); }
  const cols = o.pal.map(p => ({ top: lc(p.top), side: lc(p.side || p.top), sub: lc(p.sub || p.side || p.top) }));
  const mat = o.material || voxTerrainMaterial(s), glowMat = o.glowMaterial, CH = o.chunk || 64, skirt = o.skirt ?? 6;
  const meshes = [];
  for (let ci = 0; ci < nx; ci += CH) for (let ck = 0; ck < nz; ck += CH) {
    const i1 = Math.min(nx, ci + CH), k1 = Math.min(nz, ck + CH);
    const B = [{ pos: [], col: [], nor: [], idx: [] }, { pos: [], col: [], nor: [], idx: [] }];
    const quad = (glow, a, b, c, d, n, ca, cb = ca) => { const G = B[glow ? 1 : 0], base = G.pos.length / 3; G.pos.push(...a, ...b, ...c, ...d); for (let t = 0; t < 4; t++) G.nor.push(...n); const cs = [ca, ca, cb, cb]; for (const cc of cs) G.col.push(cc[0], cc[1], cc[2]); G.idx.push(base, base + 1, base + 2, base, base + 2, base + 3); };
    const rgb = (c, f = 1) => [c.r * f, c.g * f, c.b * f];
    // tops, greedy
    const seen = new Uint8Array((i1 - ci) * (k1 - ck)), si = (i, k) => (i - ci) * (k1 - ck) + (k - ck);
    for (let i = ci; i < i1; i++) for (let k = ck; k < k1; k++) {
      if (seen[si(i, k)]) continue;
      const h = H[id(i, k)], t = T[id(i, k)];
      let w = 1; while (k + w < k1 && !seen[si(i, k + w)] && H[id(i, k + w)] === h && T[id(i, k + w)] === t) w++;
      let d = 1; grow: while (i + d < i1) { for (let kk = k; kk < k + w; kk++) if (seen[si(i + d, kk)] || H[id(i + d, kk)] !== h || T[id(i + d, kk)] !== t) break grow; d++; }
      for (let ii = i; ii < i + d; ii++) for (let kk = k; kk < k + w; kk++) seen[si(ii, kk)] = 1;
      const y = h * s, xa = x0 + i * s, xb = x0 + (i + d) * s, za = z0 + k * s, zb = z0 + (k + w) * s, c = rgb(cols[t].top);
      quad(o.glow && o.glow.has(t), [xa, y, zb], [xb, y, zb], [xb, y, za], [xa, y, za], [0, 1, 0], c);
    }
    // sides, merged along runs
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [di, dk] of dirs) {
      const alongK = di !== 0;
      const outerA = alongK ? [ci, i1] : [ck, k1], innerA = alongK ? [ck, k1] : [ci, i1];
      for (let a = outerA[0]; a < outerA[1]; a++) {
        let run = null;
        const flush = () => {
          if (!run) return;
          const { h, hn, t, b0, b1 } = run, glow = o.glow && o.glow.has(t);
          // face plane and extent
          const i = alongK ? a : null, k = alongK ? null : a;
          let A_, B_, C_, D_, n;
          const yT = h * s, yM = (h - 1) * s, yB = hn * s;
          const mk4 = (ya, yb) => {
            if (di === 1) { const x = x0 + (i + 1) * s; return [[x, ya, z0 + b1 * s], [x, ya, z0 + b0 * s], [x, yb, z0 + b0 * s], [x, yb, z0 + b1 * s]]; }
            if (di === -1) { const x = x0 + i * s; return [[x, ya, z0 + b0 * s], [x, ya, z0 + b1 * s], [x, yb, z0 + b1 * s], [x, yb, z0 + b0 * s]]; }
            if (dk === 1) { const z = z0 + (k + 1) * s; return [[x0 + b0 * s, ya, z], [x0 + b1 * s, ya, z], [x0 + b1 * s, yb, z], [x0 + b0 * s, yb, z]]; }
            const z = z0 + k * s; return [[x0 + b1 * s, ya, z], [x0 + b0 * s, ya, z], [x0 + b0 * s, yb, z], [x0 + b1 * s, yb, z]];
          };
          n = [di, 0, dk];
          // vertices are listed top-left, top-right, bottom-right, bottom-left (seen from outside); swap to keep CCW
          const emit = (ya, yb, ct, cb) => { const v = mk4(ya, yb); quad(glow, v[3], v[2], v[1], v[0], n, cb, ct); };
          const depth = h - hn, cS = cols[t];
          emit(yT, Math.max(yB, yM), rgb(cS.side, 1), rgb(cS.side, depth > 1 ? 0.9 : 0.86));
          if (depth > 1) emit(yM, yB, rgb(cS.sub, 0.88), rgb(cS.sub, Math.max(0.5, 0.88 - depth * 0.035)));
          run = null;
        };
        for (let b = innerA[0]; b < innerA[1]; b++) {
          const i = alongK ? a : b, k = alongK ? b : a, h = H[id(i, k)], t = T[id(i, k)];
          const ni = i + di, nk = k + dk, edge = ni < 0 || ni >= nx || nk < 0 || nk >= nz;
          let hn = H[id(ni, nk)]; if (edge) hn = Math.min(hn, h) - skirt;
          if (hn >= h) { flush(); continue; }
          if (run && run.h === h && run.hn === hn && run.t === t && run.b1 === b) { run.b1 = b + 1; continue; }
          flush(); run = { h, hn, t, b0: b, b1: b + 1 };
        }
        flush();
      }
    }
    B.forEach((G, gi) => {
      if (!G.idx.length) return;
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(G.nor, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(G.col, 3)); geo.setIndex(G.idx); geo.computeBoundingSphere();
      const me = new THREE.Mesh(geo, gi ? glowMat : mat); me.receiveShadow = !gi; me.castShadow = !gi && o.cast !== false; scene.add(me); meshes.push(me);
    });
  }
  // smooth height for walking: bilinear between column tops
  const at = (x, z) => {
    const fx = (x - x0) / s - 0.5, fz = (z - z0) / s - 0.5, i = Math.floor(fx), k = Math.floor(fz), u = fx - i, v = fz - k;
    if (i < -1 || k < -1 || i >= nx || k >= nz) return null;
    const g = (a, b) => H[id(Math.min(nx, Math.max(-1, a)), Math.min(nz, Math.max(-1, b)))] * s;
    return lerp(lerp(g(i, k), g(i + 1, k), u), lerp(g(i, k + 1), g(i + 1, k + 1), u), v);
  };
  const top = (x, z) => { const i = Math.floor((x - x0) / s), k = Math.floor((z - z0) / s); if (i < 0 || k < 0 || i >= nx || k >= nz) return null; return H[id(i, k)] * s; };
  const typeAt = (x, z) => { const i = Math.floor((x - x0) / s), k = Math.floor((z - z0) / s); if (i < 0 || k < 0 || i >= nx || k >= nz) return -1; return T[id(i, k)]; };
  return { meshes, at, top, typeAt };
}

/* a half-resolution copy for distant props */
function downVox(V) {
  const acc = new Map();
  for (const [k, c] of V.m) { const [x, y, z] = VX(k), kk = VK(Math.floor(x / 2), Math.floor(y / 2), Math.floor(z / 2)); const e = acc.get(kk); if (e) { e[0] += c.r; e[1] += c.g; e[2] += c.b; e[3]++; } else acc.set(kk, [c.r, c.g, c.b, 1]); }
  const D = new VoxSet(); for (const [k, e] of acc) D.m.set(k, new THREE.Color(e[0] / e[3], e[1] / e[3], e[2] / e[3])); return D;
}
function lodGeo(V, s, o = {}) { const dy = o.dy || 0; return { near: meshVox(V, s, { jitter: o.jitter, offset: [-s / 2, dy, -s / 2] }), far: meshVox(downVox(V), s * 2, { jitter: o.jitter, offset: [-s, dy, -s] }) }; }
/* show each slice of props at full detail up close, half detail further out, and not at all past the fog */
const VOX_LOD = { scale: 1 }; // Fast graphics shortens every draw distance
function lodUpdate(scene, camera) {
  const p = camera.position, k = VOX_LOD.scale;
  for (const e of scene.userData.lods) for (const c of e.chunks) {
    const bs = c.near.geometry.boundingSphere, d = (p.distanceTo(bs.center) - bs.radius) / k;
    c.near.visible = d < e.nearD; if (c.far) c.far.visible = d >= e.nearD && d < e.farD; else if (d >= e.nearD) c.near.visible = d < e.farD;
  }
}
/* instanced voxel models placed on the grid; rotations in quarter turns keep the cubes aligned */
function voxProps(scene, geo, list, o = {}) {
  const Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3(), snap = o.snap || 0.125;
  const at = (p, i, M4) => { E.set(0, Math.round(p.rot / (Math.PI / 2)) * (Math.PI / 2), 0); Q.setFromEuler(E); return M4.compose(P.set(Math.round(p.x / snap) * snap, p.y, Math.round(p.z / snap) * snap), Q, S.set(1, 1, 1)); };
  const opts = { shadow: o.shadow !== false, receive: true, slice: o.slice || 16 };
  const near = chunked(scene, geo.near || geo, o.material || VOXMAT, list, at, opts), far = geo.far ? chunked(scene, geo.far, o.material || VOXMAT, list, at, opts) : [];
  if (!scene.userData.lods) { scene.userData.lods = []; scene.onBeforeRender = (r, sc, cam) => lodUpdate(sc, cam); }
  scene.userData.lods.push({ chunks: near.map((n, i) => ({ near: n, far: far[i] || null })), nearD: o.nearD ?? 40, farD: o.farD ?? 220 });
  return near;
}
