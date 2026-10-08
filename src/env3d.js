/* ===== Voxel worlds: five ecosystems, the title valley, the choose stage and the museum lab ===== */
const AREA_LEN = 120, HALF_W = 15;

function canvasTex(w, h, draw) {
  const [c, x] = mk(w, h); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
}
const TEX = {};
function foliageTex(kind) {
  if (TEX[kind]) return TEX[kind];
  let t;
  if (kind === 'glow') t = canvasTex(128, 128, x => { x.fillStyle = rad(x, 64, 64, 0, 64, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]); x.fillRect(0, 0, 128, 128); });
  else if (kind === 'curtain') t = canvasTex(64, 256, x => { x.fillStyle = lin(x, 0, 0, 0, 256, [[0, 'rgba(255,255,255,0)'], [0.6, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,.75)']]); x.fillRect(0, 0, 64, 256); });
  return (TEX[kind] = t);
}
/* three r128 never frustum-culls an InstancedMesh, so every prop would be drawn (and shadowed) every frame.
   Split each set into slices along the valley, each with its own bounds, so off-screen slices are skipped. */
function chunked(scene, g, mat, list, matrixAt, o = {}) {
  if (!list.length) return [];
  g.computeBoundingSphere();
  const gr = g.boundingSphere.center.length() + g.boundingSphere.radius, slice = o.slice || 30, groups = {}, out = [];
  const mats = list.map((p, i) => matrixAt(p, i, new THREE.Matrix4()));
  list.forEach((p, i) => { const k = Math.floor(p.z / slice) + (p.x < 0 ? 'l' : 'r'); (groups[k] = groups[k] || []).push(i); });
  for (const k in groups) {
    const ids = groups[k], gg = new THREE.BufferGeometry(), c = new THREE.Vector3(), v = new THREE.Vector3();
    for (const n in g.attributes) gg.setAttribute(n, g.attributes[n]);
    if (g.index) gg.setIndex(g.index);
    const im = new THREE.InstancedMesh(gg, mat, ids.length);
    ids.forEach(i => c.add(v.set(list[i].x, list[i].y, list[i].z))); c.divideScalar(ids.length);
    let rad = 0;
    ids.forEach((i, j) => { const p = list[i]; im.setMatrixAt(j, mats[i]); rad = Math.max(rad, c.distanceTo(v.set(p.x, p.y, p.z)) + gr * (p.s || 1) * Math.max(1, p.sy || 1)); });
    gg.boundingSphere = new THREE.Sphere(c, rad);
    im.frustumCulled = true; im.castShadow = !!o.shadow; im.receiveShadow = !!o.receive;
    scene.add(im); out.push(im);
  }
  return out;
}
const vc = (hex, f = 1) => lc(hex).multiplyScalar(f);

/* ---- biome definitions ---- */
const BIOMES = [
  { key: 'forest', name: 'Forest', sky: ['#4f9ad8', '#a6d4ee', '#e6f2e4'], fog: '#cfe6e2', fogD: 0.0105, sun: '#fff4dc', sunI: 0.95, sunDir: [0.5, 0.75, -0.45], hemi: ['#e4f2ff', '#5a6a3c', 0.62],
    wallH: 14, rough: 0.6, particles: { color: '#fff6c8', n: 140, size: 0.12, rise: 0.05 } },
  { key: 'swamp', name: 'Swamp', sky: ['#6f9a98', '#bcd2c4', '#dfe6d2'], fog: '#c4d2c0', fogD: 0.019, sun: '#fff4dc', sunI: 0.75, sunDir: [-0.4, 0.7, -0.5], hemi: ['#e6eee2', '#4a5236', 0.72],
    wallH: 9, rough: 0.35, water: '#5f9488', particles: { color: '#f0f4e0', n: 110, size: 0.16, rise: 0.02 } },
  { key: 'mountains', name: 'Mountains', sky: ['#2c2e5c', '#a65a6c', '#f4ae66'], fog: '#c08080', fogD: 0.0105, sun: '#ffbe84', sunI: 1.1, sunDir: [-0.7, 0.35, -0.6], hemi: ['#c8b8e4', '#5a4050', 0.8],
    wallH: 26, rough: 1.2, particles: { color: '#ffd8b0', n: 80, size: 0.1, rise: 0.03 } },
  { key: 'desert', name: 'Desert', sky: ['#4f8ec4', '#e6c896', '#f6deb0'], fog: '#efd6a8', fogD: 0.0085, sun: '#fff2d8', sunI: 1.0, sunDir: [0.3, 0.85, 0.3], hemi: ['#fff4e2', '#9a6a40', 0.62],
    wallH: 12, rough: 0.8, particles: { color: '#fff0d0', n: 60, size: 0.08, rise: 0.0 } },
  { key: 'volcano', name: 'Volcano', sky: ['#24162c', '#7a3030', '#d86a3c'], fog: '#64342e', fogD: 0.018, sun: '#ffa070', sunI: 1.0, sunDir: [0.2, 0.5, -0.8], hemi: ['#e0a090', '#3a2418', 0.85],
    wallH: 16, rough: 0.9, lava: true, particles: { color: '#ff9a50', n: 200, size: 0.1, rise: 0.6 } },
];
function terrainHeight(B, seed) {
  const n = noise2(seed);
  return (x, z) => {
    const ax = Math.abs(x);
    let h = (fbm2(n, x * 0.05 + 3, z * 0.05 + 7, 4) - 0.5) * B.rough * 2;
    h += sstep(HALF_W - 1, HALF_W + 16, ax) * B.wallH * (0.55 + 0.6 * fbm2(n, x * 0.03, z * 0.03, 3));
    h += sstep(HALF_W + 16, HALF_W + 60, ax) * B.wallH * 1.4;
    if (B.water) h -= 0.6 * sstep(0.45, 0.6, fbm2(n, x * 0.04 + 9, z * 0.04, 3)) * (1 - sstep(HALF_W - 3, HALF_W, ax));
    // distant ranges close the valley off at both ends and rise behind the walls
    const far = Math.max(ax - 70, -z - 182, z - 30);
    if (far > 0) h += Math.min(far * 0.5, B.wallH * 2.2) * (0.5 + fbm2(n, x * 0.02 + 40, z * 0.02, 3));
    return h;
  };
}

/* ---- voxel props: built once per look, then instanced ---- */
const PROP = {};
function prop(key, make) { return PROP[key] || (PROP[key] = make()); }
const S_TREE = 0.25, S_SMALL = 0.125;
function vAraucaria(pal, seed) {
  const V = new VoxSet(), r = rng(seed), H = 50 + ((r() * 12) | 0);
  V.line([0, 0, 0], [0, H, 0], 1.6, 0.8, t => vc(pal.trunk, 0.85 + 0.15 * t));
  for (let i = 0; i < 6; i++) { const t = i / 5, y = H * (0.58 + 0.42 * t), rr = lerp(10, 3.5, t) * (0.9 + r() * 0.2);
    V.blob(0, y, 0, rr, 1.6, rr, (x, yy, z, q) => vc(pal.leaf, (0.8 + 0.25 * t) * (yy > y ? 1.12 : 0.92) * (0.94 + 0.12 * r()))); }
  return lodGeo(V, S_TREE, { jitter: 0.07 });
}
function vConifer(pal, seed) {
  const V = new VoxSet(), r = rng(seed), H = 44 + ((r() * 14) | 0);
  V.line([0, 0, 0], [0, H, 0], 1.4, 0.6, () => vc(pal.trunk));
  for (let y = 10; y < H + 4; y += 3) { const t = (y - 10) / (H - 6), rr = Math.max(1.2, lerp(9, 1.5, t));
    V.blob(0, y, 0, rr, 2.2, rr, (x, yy, z, q) => (q > 0.9 && r() < 0.3 ? null : vc(pal.leaf, (0.82 + 0.25 * t) * (yy > y + 0.5 ? 1.1 : 0.9)))); }
  return lodGeo(V, S_TREE, { jitter: 0.07 });
}
function vBroadleaf(pal, seed) {
  const V = new VoxSet(), r = rng(seed), H = 22 + ((r() * 8) | 0);
  V.line([0, 0, 0], [r() * 2 - 1, H, r() * 2 - 1], 2.2, 1.3, () => vc(pal.trunk));
  for (let i = 0; i < 6; i++) { const a = r() * TAU, d = i ? 4 + r() * 4 : 0, cx = Math.cos(a) * d, cz = Math.sin(a) * d, cy = H + 2 + r() * 6 - d * 0.3, rr = 5 + r() * 3.5;
    if (i) V.line([0, H - 3, 0], [cx * 0.7, cy - 2, cz * 0.7], 1, 0.6, () => vc(pal.trunk));
    V.blob(cx, cy, cz, rr, rr * 0.8, rr, (x, y, z, q) => (q > 0.88 && r() < 0.4 ? null : vc(r() < 0.12 ? pal.leaf2 : pal.leaf, 0.8 + 0.35 * clamp((y - cy + rr) / (2 * rr), 0, 1)))); }
  return lodGeo(V, S_TREE, { jitter: 0.08 });
}
function vTreeFern(pal, seed, s = S_TREE) {
  const V = new VoxSet(), r = rng(seed), H = 22 + ((r() * 8) | 0), lean = (r() - 0.5) * 3;
  V.line([0, 0, 0], [lean, H, 0], 1.3, 1.0, t => vc(t % 0.2 < 0.1 ? pal.trunk : mix(pal.trunk, '#000000', 0.2)));
  const n = 9;
  for (let j = 0; j < n; j++) { const a = (j / n) * TAU + r() * 0.3, L = 9 + r() * 3;
    let px = lean, py = H, pz = 0;
    for (let t = 0; t <= 1.0001; t += 0.06) { const x = lean + Math.cos(a) * L * t, z = Math.sin(a) * L * t, y = H + 3 * t - 7 * t * t;
      V.line([px, py, pz], [x, y, z], 0.5, 0.5, () => vc(pal.leaf, 0.9 + 0.2 * t));
      if (t > 0.1 && t < 0.92) { const side = 2.4 * (1 - t) + 0.8; for (const sgn of [-1, 1]) V.line([x, y, z], [x - Math.sin(a) * side * sgn, y - 0.8, z + Math.cos(a) * side * sgn], 0.5, 0.5, () => vc(pal.leaf2 || pal.leaf, 0.85 + 0.2 * t)); }
      px = x; py = y; pz = z; } }
  return lodGeo(V, s, { jitter: 0.08 });
}
function vCycad(pal, seed, s = S_SMALL) {
  const V = new VoxSet(), r = rng(seed), H = 9 + ((r() * 5) | 0);
  for (let y = 0; y < H; y++) V.blob(0, y + 0.5, 0, 3.2 - y * 0.08, 0.6, 3.2 - y * 0.08, (x, yy, z) => vc((x + yy + z) % 2 ? pal.trunk : mix(pal.trunk, '#000000', 0.25)));
  for (let j = 0; j < 12; j++) { const a = (j / 12) * TAU + r() * 0.2, L = 11 + r() * 4, up = 0.6 + r() * 0.5;
    let p = [0, H, 0];
    for (let t = 0.08; t <= 1.0001; t += 0.08) { const q = [Math.cos(a) * L * t, H + L * up * t - L * 0.55 * t * t, Math.sin(a) * L * t]; V.line(p, q, 0.6, 0.5, () => vc(pal.leaf, 0.85 + 0.25 * t));
      if (t > 0.15) for (const sgn of [-1, 1]) V.line(q, [q[0] - Math.sin(a) * 2.2 * sgn, q[1] + 0.6, q[2] + Math.cos(a) * 2.2 * sgn], 0.5, 0.5, () => vc(pal.leaf, 0.9 + 0.2 * t)); p = q; } }
  return lodGeo(V, s, { jitter: 0.08 });
}
function vSnag(pal, seed) {
  const V = new VoxSet(), r = rng(seed), H = 30 + ((r() * 14) | 0);
  V.line([0, 0, 0], [r() * 2 - 1, H, r() * 2 - 1], 2.0, 0.9, t => vc(pal.trunk, 0.8 + 0.25 * t));
  for (let i = 0; i < 3; i++) { const y = H * (0.45 + i * 0.17), a = r() * TAU, L = 7 - i * 1.5; V.line([0, y, 0], [Math.cos(a) * L, y + L * 0.7, Math.sin(a) * L], 0.9, 0.5, () => vc(pal.trunk, 0.9)); }
  return lodGeo(V, S_TREE, { jitter: 0.06 });
}
function vFern(pal, seed) {
  const V = new VoxSet(), r = rng(seed);
  for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU + r() * 0.4, L = 8 + r() * 4; let p = [0, 0, 0];
    for (let t = 0.125; t <= 1.0001; t += 0.125) { const q = [Math.cos(a) * L * t, L * 0.9 * t - L * 0.75 * t * t, Math.sin(a) * L * t]; V.line(p, q, 0.5, 0.5, () => vc(pal.leaf, 0.85 + 0.25 * t));
      if (t > 0.15 && t < 0.95) for (const sgn of [-1, 1]) V.line(q, [q[0] - Math.sin(a) * 1.6 * sgn, q[1] + 0.3, q[2] + Math.cos(a) * 1.6 * sgn], 0.5, 0.5, () => vc(pal.leaf2 || pal.leaf, 0.9 + 0.2 * t)); p = q; } }
  return lodGeo(V, S_SMALL, { jitter: 0.1 });
}
function vTuft(pal, seed) {
  const V = new VoxSet(), r = rng(seed);
  for (let j = 0; j < 7; j++) { const x = Math.round((r() - 0.5) * 5), z = Math.round((r() - 0.5) * 5), h = 3 + ((r() * 5) | 0), lx = r() < 0.5 ? 1 : -1;
    for (let y = 0; y < h; y++) V.set(x + (y > h * 0.6 ? lx : 0), y, z, vc(pal.leaf, 0.8 + 0.4 * y / h)); }
  return lodGeo(V, S_SMALL, { jitter: 0.1 });
}
function vHorsetail(pal, seed) {
  const V = new VoxSet(), r = rng(seed);
  for (let j = 0; j < 5; j++) { const x = Math.round((r() - 0.5) * 6), z = Math.round((r() - 0.5) * 6), h = 10 + ((r() * 12) | 0);
    for (let y = 0; y < h; y++) V.set(x, y, z, vc(y % 4 === 3 ? mix(pal.leaf, '#000000', 0.45) : pal.leaf, 0.85 + 0.25 * y / h)); V.set(x, h, z, vc('#a08a4a')); }
  return lodGeo(V, S_SMALL, { jitter: 0.08 });
}
function vRock(color, seed, s = S_TREE) {
  const V = new VoxSet(), r = rng(seed), n = noise2(seed);
  V.blob(0, 1.2, 0, 4.2, 3.0, 3.6, (x, y, z, q) => (q * (0.75 + 0.5 * fbm2(n, x * 0.3 + y * 0.2, z * 0.3, 2)) > 0.92 ? null : vc(color, y > 2 ? 1.08 : 0.92)));
  return lodGeo(V, s, { jitter: 0.1, dy: -s });
}
function vBush(pal, seed) {
  const V = new VoxSet(), r = rng(seed);
  const puffs = [[0, 8, 0, 8], [7, 6, 3, 6], [-7, 6, -2, 6.2], [2, 5, -7, 5.6], [-2, 5, 7, 5.6], [1, 13, 1, 5]];
  for (const [x, y, z, rr] of puffs) V.blob(x, y, z, rr, rr * 0.85, rr, (vx, vy, vz, q) => vc(r() < 0.1 ? pal.leaf2 : pal.leaf, 0.75 + 0.4 * clamp(vy / 16, 0, 1)));
  // berries sit on the surface
  for (const [k, c] of [...V.m]) { const [x, y, z] = VX(k); if (y > 2 && !V.has(x, y + 1, z) && r() < 0.07) V.set(x, y + 1, z, vc(pal.berry || '#e8283a')); else if (!V.has(x + 1, y, z) && r() < 0.05) V.set(x + 1, y, z, vc(pal.berry || '#e8283a')); }
  return lodGeo(V, S_SMALL, { jitter: 0.08 });
}
function vCloud(seed, color = '#ffffff', s = 1.0) {
  const V = new VoxSet(), r = rng(seed);
  for (let i = 0; i < 7; i++) { const x = (i - 3) * 4 + r() * 2, rr = 4 + r() * 3 - Math.abs(i - 3) * 0.5; V.blob(x, rr * 0.3, r() * 4 - 2, rr, rr * 0.55, rr * 0.8, (vx, vy) => vc(color, vy > 0 ? 1 : 0.86)); }
  return meshVox(V, s, { jitter: 0.03 });
}

/* sky: a gradient dome, a sun with a soft glow, drifting voxel clouds */
function voxSky(scene, B, sunDir, clouds = 8, cloudColor = '#ffffff') {
  const r_ = 700, g = new THREE.SphereGeometry(r_, 32, 16), p = g.attributes.position, cols = [], a = lc(B.sky[0]), b = lc(B.sky[1]), c = lc(B.sky[2]);
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / r_; const col = y > 0.12 ? b.clone().lerp(a, sstep(0.12, 0.65, y)) : c.clone().lerp(b, sstep(-0.05, 0.12, y)); cols.push(col.r, col.g, col.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const dome = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })); dome.renderOrder = -10; scene.add(dome);
  const sd = new THREE.Vector3(...sunDir).normalize();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: foliageTex('glow'), color: lc(B.sun), transparent: true, blending: THREE.AdditiveBlending, fog: false, depthWrite: false })); glow.position.copy(sd.clone().multiplyScalar(560)); glow.scale.set(260, 260, 1); scene.add(glow);
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), new THREE.MeshBasicMaterial({ color: lc(mix(B.sun, '#ffffff', 0.5)), fog: false })); disc.position.copy(sd.clone().multiplyScalar(580)); disc.lookAt(0, 0, 0); scene.add(disc);
  const r = rng(77), cl = [];
  for (let i = 0; i < clouds; i++) { const m = new THREE.Mesh(vCloud(100 + (i % 4), cloudColor, 1.4), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true, opacity: 0.92 })); m.position.set((r() - 0.5) * 500, 70 + r() * 40, -60 - r() * 360); m.rotation.y = Math.round(r() * 3) * Math.PI / 2; scene.add(m); cl.push(m); }
  return { dome, clouds: cl, update(dt) { for (const m of cl) { m.position.x += dt * 1.2; if (m.position.x > 300) m.position.x = -300; } } };
}

/* ---- the five screens ---- */
const TERRAIN_PAL = {
  forest: [{ top: '#6cbd46', side: '#5ea83e', sub: '#8a5c3a' }, { top: '#7cc950', side: '#66b044', sub: '#8a5c3a' }, { top: '#d8b882', side: '#c09c66', sub: '#8a5c3a' }, { top: '#8e9498', side: '#868c90', sub: '#727880' }, { top: '#6e9c4c', side: '#7e868a', sub: '#727880' }, { top: '#5aa63c', side: '#52983a', sub: '#8a5c3a' }],
  swamp: [{ top: '#6a8a3e', side: '#5e7a38', sub: '#5e4a30' }, { top: '#58783a', side: '#506e34', sub: '#5e4a30' }, { top: '#6c5838', side: '#5e4c30', sub: '#4e3e28' }, { top: '#7a8078', side: '#727870', sub: '#646a62' }, { top: '#7c9a48', side: '#6c8a40', sub: '#5e4a30' }],
  mountains: [{ top: '#9e8e96', side: '#8e7e88', sub: '#766870' }, { top: '#b49e94', side: '#a08c84', sub: '#766870' }, { top: '#f2f4fa', side: '#dcdee8', sub: '#7e6e78' }, { top: '#5e5058', side: '#54474f', sub: '#4a3e46' }, { top: '#728050', side: '#66704a', sub: '#6a5c66' }],
  desert: [{ top: '#e6c890', side: '#d8b47a', sub: '#c89a62' }, { top: '#dcb880', side: '#cca46c', sub: '#c89a62' }, { top: '#d9905a', side: '#c87a48', sub: '#b8683c' }, { top: '#e8b47a', side: '#d89a5e', sub: '#c4784a' }, { top: '#b8764a', side: '#a8653c', sub: '#9a5a34' }],
  volcano: [{ top: '#4a4048', side: '#423a42', sub: '#342e36' }, { top: '#7a6c72', side: '#6c5e66', sub: '#463c44' }, { top: '#ff8a2a', side: '#ff6a1a', sub: '#e85010' }, { top: '#2c262e', side: '#262028', sub: '#201a22' }, { top: '#5a3a34', side: '#4e322c', sub: '#3a2622' }],
};
function terrainTyper(K, seed) {
  const n = noise2(seed + 5), pathX = z => 3 * Math.sin(z * 0.045) + 1.5 * Math.sin(z * 0.13);
  return (x, z, y) => {
    const v = fbm2(n, x * 0.09, z * 0.09, 3), ax = Math.abs(x);
    if (K === 'forest') { if (y > 9) return v > 0.5 ? 4 : 3; if (y < 2 && Math.abs(x - pathX(z)) < 1.6 + v * 1.2) return 2; return v > 0.56 ? 1 : v < 0.38 ? 5 : 0; }
    if (K === 'swamp') { if (y > 6) return 3; if (y < -0.2) return 2; return v > 0.55 ? 1 : v < 0.36 ? 4 : 0; }
    if (K === 'mountains') { if (y > 19 + v * 6) return 2; if (y > 4) return v > 0.5 ? 0 : 3; return ax < HALF_W - 3 && v > 0.58 ? 4 : v > 0.45 ? 1 : 0; }
    if (K === 'desert') { if (y > 3) return 2 + (Math.floor(y / 1.4) % 3); return v > 0.55 ? 1 : 0; }
    if (y < 0.2 && ax > 4.5 && ax < HALF_W && v > 0.64) return 2; // lava pools, kept off the middle of the valley
    return y > 6 ? (v > 0.5 ? 3 : 4) : v > 0.55 ? 1 : 0;
  };
}
/* three bands: fine near the path, coarser up the walls, coarse on the distant ranges */
function buildVoxGround(scene, B, seed, hRaw, typer) {
  const pal = TERRAIN_PAL[B.key], glow = B.key === 'volcano' ? new Set([2]) : null, strata = B.key === 'desert' ? 0.22 : B.key === 'mountains' ? 0.14 : 0.04;
  const glowMat = glow ? voxTerrainMaterial(0.25, { basic: true, jitter: 0.25 }) : null;
  const lavaLevel = (x, z, y) => (glow && typer(x, z, y) === 2 ? -0.25 : y);
  const H = (x, z) => { const y = hRaw(x, z); return lavaLevel(x, z, y); };
  const inner = voxTerrain(scene, { x0: -28, z0: -184, nx: 224, nz: 800, s: 0.25, height: H, type: typer, pal, glow, glowMaterial: glowMat, material: voxTerrainMaterial(0.25, { strata }), chunk: 56 });
  const bands = [inner];
  for (const sx of [-1, 1]) bands.push(voxTerrain(scene, { x0: sx < 0 ? -72 : 28, z0: -184, nx: 88, nz: 400, s: 0.5, height: H, type: typer, pal, glow, glowMaterial: glowMat, material: voxTerrainMaterial(0.5, { strata }), chunk: 44, skirt: 4 }));
  const far = voxTerrainMaterial(1.5, { strata });
  bands.push(voxTerrain(scene, { x0: -192, z0: -402, nx: 256, nz: 146, s: 1.5, height: hRaw, type: typer, pal, material: far, chunk: 32, skirt: 3 }));
  for (const sx of [-1, 1]) bands.push(voxTerrain(scene, { x0: sx < 0 ? -192 : 72, z0: -183, nx: 80, nz: 160, s: 1.5, height: hRaw, type: typer, pal, material: far, chunk: 32, skirt: 3 }));
  bands.push(voxTerrain(scene, { x0: -72, z0: 16, nx: 144, nz: 40, s: 1.0, height: hRaw, type: typer, pal, material: voxTerrainMaterial(1.0, { strata }), chunk: 36, skirt: 3 }));
  const hAt = (x, z) => { for (const b of bands) { const v = b.at(x, z); if (v !== null) return v; } return hRaw(x, z); };
  const top = (x, z) => { for (const b of bands) { const v = b.top(x, z); if (v !== null) return v; } return hRaw(x, z); };
  const typeAt = (x, z) => inner.typeAt(x, z);
  return { hAt, top, typeAt };
}

function buildArea(index, skill, seedBase) {
  const B = BIOMES[index], scene = new THREE.Scene(), seed = seedBase + index * 101, K = B.key;
  scene.fog = new THREE.FogExp2(lc(B.fog), B.fogD);
  const sunDir = new THREE.Vector3(...B.sunDir).normalize();
  const sky = voxSky(scene, B, B.sunDir, K === 'volcano' ? 4 : K === 'swamp' ? 6 : 9, K === 'volcano' ? '#6a5058' : K === 'mountains' ? '#f4c8b8' : '#ffffff');
  scene.add(new THREE.HemisphereLight(lc(B.hemi[0]), lc(B.hemi[1]), B.hemi[2]));
  const sun = new THREE.DirectionalLight(lc(B.sun), B.sunI); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 160 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
  scene.add(sun); scene.add(sun.target);
  const hRaw = terrainHeight(B, seed), typer = terrainTyper(K, seed), ground = buildVoxGround(scene, B, seed, hRaw, typer), hAt = ground.hAt, top = ground.top;
  if (B.water) { const w = new THREE.Mesh(new THREE.PlaneGeometry(64, AREA_LEN + 80), voxTerrainMaterial(0.25, { jitter: 0.12 })); w.material.vertexColors = false; w.material.color = lc(B.water); w.material.transparent = true; w.material.opacity = 0.82; w.rotation.x = -Math.PI / 2; w.position.set(0, -0.12, -AREA_LEN / 2); scene.add(w); }
  // vegetation and rocks
  const r = rng(seed + 11), list = (n, fn) => { const out = []; for (let i = 0; i < n; i++) { const p = fn(); if (p) out.push(p); } return out; };
  const ok = (x, z) => !(K === 'volcano' && ground.typeAt(x, z) === 2);
  const at = (x, z, s = 1) => (ok(x, z) ? { x, z, y: top(x, z), rot: r() * TAU, s } : null);
  const side = (minX, maxX) => { const s_ = r() < 0.5 ? -1 : 1; return at(s_ * lerp(minX, maxX, r()), 8 - r() * (AREA_LEN + 30)); };
  const inside = () => at((r() - 0.5) * 2 * (HALF_W + 2), 6 - r() * (AREA_LEN + 10));
  const variants = (n, make) => Array.from({ length: n }, (_, i) => make(i));
  const place = (geos, pts, o) => geos.forEach((g, i) => voxProps(scene, g, pts.filter((_, j) => j % geos.length === i), o));
  const P = {
    forest: { trunk: '#6a4a30', leaf: '#3e8a4c', leaf2: '#6ab45a', fern: '#4f9e3e', fern2: '#78bc52', grass: '#64b040' },
    swamp: { trunk: '#4a4a38', leaf: '#5e8a62', leaf2: '#7aa070', fern: '#4f7a3e', fern2: '#6a8a4a', grass: '#6a8a3e' },
    mountains: { trunk: '#4a2e3a', leaf: '#3a4a52', leaf2: '#4e6068', fern: '#5a6a3c', fern2: '#748446', grass: '#7a8a50' },
    desert: { trunk: '#7a5232', leaf: '#7a8a3a', leaf2: '#9aa648', fern: '#8a8a40', fern2: '#a8a050', grass: '#b0a050' },
    volcano: { trunk: '#2a2026', leaf: '#5a5a2a', leaf2: '#6e6a32', fern: '#5a5426', fern2: '#706a30', grass: '#7a6a3a' },
  }[K];
  if (K === 'forest') {
    place(variants(3, i => prop('arau' + K + i, () => vAraucaria(P, 31 + i))), list(55, () => side(HALF_W - 1, HALF_W + 34)), { nearD: 30 });
    place(variants(2, i => prop('broad' + K + i, () => vBroadleaf(P, 41 + i))), list(24, () => side(HALF_W + 1, HALF_W + 30)));
    place(variants(2, i => prop('tfern' + K + i, () => vTreeFern({ trunk: '#5a4430', leaf: P.fern, leaf2: P.fern2 }, 51 + i))), list(40, () => (r() < 0.25 ? inside() : side(HALF_W - 3, HALF_W + 18))));
    place(variants(2, i => prop('cycad' + K + i, () => vCycad({ trunk: '#7a5a34', leaf: '#5aa848' }, 61 + i))), list(30, () => side(HALF_W - 4, HALF_W + 10)));
    place(variants(3, i => prop('fern' + K + i, () => vFern({ leaf: P.fern, leaf2: P.fern2 }, 71 + i))), list(220, () => (r() < 0.7 ? inside() : side(HALF_W - 2, HALF_W + 20))), { shadow: false, nearD: 22, farD: 60 });
    place(variants(2, i => prop('tuft' + K + i, () => vTuft({ leaf: P.grass }, 81 + i))), list(420, inside), { shadow: false, nearD: 18, farD: 45 });
  } else if (K === 'swamp') {
    place(variants(3, i => prop('tfern' + K + i, () => vTreeFern({ trunk: '#4a4a38', leaf: '#5e8a62', leaf2: '#7aa070' }, 52 + i))), list(70, () => (r() < 0.25 ? inside() : side(HALF_W - 4, HALF_W + 28))));
    place(variants(2, i => prop('snag' + K + i, () => vSnag({ trunk: '#6a7068' }, 91 + i))), list(26, () => side(HALF_W - 6, HALF_W + 26)));
    place(variants(3, i => prop('horse' + K + i, () => vHorsetail({ leaf: '#6a8a3a' }, 101 + i))), list(320, inside), { shadow: false, nearD: 22, farD: 60 });
    place(variants(2, i => prop('fern' + K + i, () => vFern({ leaf: P.fern, leaf2: P.fern2 }, 72 + i))), list(160, inside), { shadow: false, nearD: 22, farD: 60 });
  } else if (K === 'mountains') {
    place(variants(3, i => prop('conifer' + K + i, () => vConifer({ trunk: '#4a2e3a', leaf: '#34505a' }, 111 + i))), list(80, () => side(HALF_W + 2, HALF_W + 40)));
    place(variants(2, i => prop('cycad' + K + i, () => vCycad({ trunk: '#4a2e3a', leaf: '#5a6a34' }, 62 + i))), list(26, inside));
    place(variants(2, i => prop('fern' + K + i, () => vFern({ leaf: P.fern, leaf2: P.fern2 }, 73 + i))), list(130, inside), { shadow: false, nearD: 22, farD: 60 });
    place(variants(2, i => prop('tuft' + K + i, () => vTuft({ leaf: P.grass }, 82 + i))), list(220, inside), { shadow: false, nearD: 22, farD: 60 });
  } else if (K === 'desert') {
    place(variants(2, i => prop('cycad' + K + i, () => vCycad({ trunk: '#7a5232', leaf: '#8a9a40' }, 63 + i))), list(44, () => (r() < 0.5 ? inside() : side(HALF_W - 2, HALF_W + 20))));
    place(variants(2, i => prop('arau' + K + i, () => vAraucaria({ trunk: '#7a5232', leaf: '#6e7a3a' }, 34 + i))), list(20, () => side(HALF_W + 2, HALF_W + 30)));
    place(variants(2, i => prop('tuft' + K + i, () => vTuft({ leaf: P.grass }, 83 + i))), list(160, inside), { shadow: false, nearD: 22, farD: 60 });
  } else {
    place(variants(3, i => prop('snag' + K + i, () => vSnag({ trunk: '#2a2026' }, 93 + i))), list(60, () => (r() < 0.2 ? inside() : side(HALF_W - 4, HALF_W + 30))));
    place(variants(2, i => prop('fern' + K + i, () => vFern({ leaf: P.fern, leaf2: P.fern2 }, 74 + i))), list(80, inside), { shadow: false, nearD: 22, farD: 60 });
  }
  const rockC = { forest: '#8e9498', swamp: '#7a8078', mountains: '#7a6a74', desert: '#c48a5a', volcano: '#3a3238' }[K];
  place(variants(3, i => prop('rock' + K + i, () => vRock(rockC, 121 + i))), list(K === 'mountains' ? 60 : K === 'desert' ? 40 : 24, () => (r() < 0.4 ? inside() : side(HALF_W - 3, HALF_W + 9))));
  // exit light curtains at both ends of the valley
  const curtainM = new THREE.MeshBasicMaterial({ map: foliageTex('curtain'), color: lc('#fff2c8'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, opacity: 0.55 });
  const exits = [];
  for (const [z, show] of [[-AREA_LEN, true], [4, index > 0]]) { if (!show) continue; const m = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W * 2 + 4, 9), curtainM); m.position.set(0, hAt(0, z) + 4.5, z); scene.add(m); exits.push(m); }
  // floating motes, mist and embers: little square specks
  const pc = B.particles, pg = new THREE.BufferGeometry(), pp = [];
  for (let i = 0; i < pc.n; i++) pp.push((r() - 0.5) * 50, r() * 10, 6 - r() * (AREA_LEN + 12));
  pg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: lc(pc.color), size: pc.size * 1.3, transparent: true, depthWrite: false, opacity: 0.9 }));
  scene.add(pts);
  // edible bushes along the valley (fewer at higher skill levels)
  const nb = [4, 3, 2][skill - 1] + (K === 'desert' || K === 'volcano' ? -1 : 0);
  const bushes = [], bushG = prop('bush' + K, () => vBush(K === 'desert' ? { leaf: '#7a8a3a', leaf2: '#a0a84a' } : K === 'volcano' ? { leaf: '#5a7030', leaf2: '#7a9040' } : { leaf: '#3e9a40', leaf2: '#6ac050' }, 7));
  for (let i = 0; i < Math.max(1, nb); i++) {
    let z = -12 - (i + 0.5) * ((AREA_LEN - 20) / Math.max(1, nb)) + (r() - 0.5) * 10, x = (r() - 0.5) * 2 * (HALF_W - 4);
    for (let tries = 0; tries < 8 && !ok(x, z); tries++) x = (r() - 0.5) * 2 * (HALF_W - 4);
    const m = new THREE.Mesh(bushG.near, VOXMAT); m.position.set(Math.round(x * 8) / 8, top(x, z), Math.round(z * 8) / 8); m.castShadow = true; m.receiveShadow = true; scene.add(m);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.15, 4, 1), new THREE.MeshBasicMaterial({ color: lc('#ffe58a'), transparent: true, opacity: 0, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.rotation.z = Math.PI / 4; ring.position.set(x, hAt(x, z) + 0.08, z); scene.add(ring);
    bushes.push({ x, z, food: [42, 34, 28][skill - 1], max: [42, 34, 28][skill - 1], mesh: m, ring });
  }
  const area = { index, B, scene, hAt, sun, sunDir, bushes, pts, exits, t: 0 };
  area.update = (dt, focus) => {
    area.t += dt; sky.update(dt);
    sun.position.copy(focus).addScaledVector(sunDir, 70); sun.target.position.copy(focus);
    const a = pts.geometry.attributes.position;
    for (let i = 0; i < a.count; i++) { let y = a.getY(i) + pc.rise * dt + Math.sin(area.t * 0.7 + i) * 0.004; if (y > 12) y = 0; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(area.t * 0.3 + i * 1.7) * 0.004); }
    a.needsUpdate = true;
    for (const e of exits) e.material.opacity = 0.42 + 0.15 * Math.sin(area.t * 2);
    for (const b of bushes) { const f = b.food / b.max; const s = 0.35 + 0.65 * f; b.mesh.scale.set(s, s, s); }
  };
  return area;
}

/* ---- title: a dusk valley with a T. rex on a rock ---- */
function buildTitleScene() {
  const B = { ...BIOMES[2], key: 'mountains', sky: ['#1c1838', '#a4506e', '#ffbe70'], sun: '#ffb070', wallH: 10, rough: 1.2 };
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(lc('#b8707a'), 0.009);
  const sky = voxSky(scene, B, [0.1, 0.12, -1], 6, '#e0a0a8');
  scene.add(new THREE.HemisphereLight(lc('#b098d0'), lc('#3a2236'), 0.7));
  const sun = new THREE.DirectionalLight(lc('#ffb070'), 0.95); sun.position.set(10, 12, -60); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, far: 200 }); scene.add(sun);
  const n = noise2(9), hRaw = (x, z) => (fbm2(n, x * 0.04, z * 0.04, 4) - 0.5) * 3 + sstep(10, 60, Math.abs(x)) * 10 + Math.max(0, -z - 90) * 0.25;
  const pal = [{ top: '#4a2c42', side: '#3e2438', sub: '#301a2c' }, { top: '#5a3450', side: '#4a2c44', sub: '#301a2c' }, { top: '#6a4058', side: '#583448', sub: '#3a2232' }];
  const typer = (x, z, y) => (y > 5 ? 2 : fbm2(n, x * 0.1, z * 0.1, 2) > 0.5 ? 1 : 0);
  const g1 = voxTerrain(scene, { x0: -40, z0: -60, nx: 320, nz: 320, s: 0.25, height: hRaw, type: typer, pal, chunk: 64 });
  voxTerrain(scene, { x0: -160, z0: -260, nx: 213, nz: 200, s: 1.5, height: (x, z) => (Math.abs(x) < 40 && z > -60 && z < 20 ? hRaw(x, z) - 6 : hRaw(x, z)), type: typer, pal, chunk: 40, skirt: 3 });
  const hAt = (x, z) => g1.at(x, z) ?? hRaw(x, z);
  const rockV = new VoxSet(), rn = noise2(4); rockV.blob(0, 4, 0, 34, 12, 26, (x, y, z, q) => (q * (0.8 + 0.4 * fbm2(rn, x * 0.08, z * 0.08 + y * 0.05, 2)) > 0.95 ? null : vc(y > 8 ? '#4a3240' : '#3a2632', 1)));
  const rock = new THREE.Mesh(meshVox(rockV, 0.2, { jitter: 0.08 }), VOXMAT); rock.position.set(6, hAt(6, -8) - 0.4, -8); rock.castShadow = rock.receiveShadow = true; scene.add(rock);
  const rex = dinoModel('trex'); rex.root.position.set(6, rock.position.y + 3.0, -8); rex.root.rotation.y = 2.6; scene.add(rex.root);
  const herd = [];
  for (let i = 0; i < 4; i++) { const d = dinoInstance('bronto'); d.root.position.set(-30 + i * 9, 0, -70 - i * 6); d.root.position.y = hAt(d.root.position.x, d.root.position.z); d.root.rotation.y = 0.3 + i * 0.4; scene.add(d.root); herd.push(d); }
  const r = rng(12), dark = { trunk: '#2a1820', leaf: '#3a1e34', leaf2: '#4a2a40', fern: '#2a1626', fern2: '#3a2034' };
  const ferns = [prop('titleFern', () => vFern({ leaf: dark.fern, leaf2: dark.fern2 }, 5))];
  voxProps(scene, ferns[0], Array.from({ length: 140 }, () => { const x = (r() - 0.5) * 70, z = 20 - r() * 70; return { x, z, y: g1.top(x, z) ?? hRaw(x, z), rot: r() * TAU, s: 1 }; }), { shadow: false });
  const tree = prop('titleArau', () => vAraucaria(dark, 33));
  voxProps(scene, tree, Array.from({ length: 46 }, () => { const s_ = r() < 0.5 ? -1 : 1, x = s_ * (22 + r() * 40), z = 10 - r() * 120; return { x, z, y: hAt(x, z), rot: r() * TAU, s: 1 }; }));
  const pg = new THREE.BufferGeometry(), pp = []; for (let i = 0; i < 220; i++) pp.push((r() - 0.5) * 60, r() * 20, 10 - r() * 60);
  pg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: lc('#ffb070'), size: 0.22, transparent: true, depthWrite: false })); scene.add(pts);
  let t = 0;
  return { scene, rex, herd, update(dt, cam) {
    t += dt; sky.update(dt); rex.update(dt, 0, 'idle'); rex.look = 0.3 + 0.2 * Math.sin(t * 0.4);
    herd.forEach(d => { d.update(dt, 0.8, 'walk'); const f = new THREE.Vector3(Math.cos(d.root.rotation.y), 0, -Math.sin(d.root.rotation.y)); d.root.position.addScaledVector(f, dt * 0.8); d.root.position.y = hAt(d.root.position.x, d.root.position.z); });
    const a = pts.geometry.attributes.position; for (let i = 0; i < a.count; i++) { let y = a.getY(i) + dt * 0.5; if (y > 20) y = 0; a.setY(i, y); } a.needsUpdate = true;
    const ang = t * 0.05; cam.position.set(6 + Math.sin(ang) * 16, rex.root.position.y + 3.5, -8 + Math.cos(ang) * 16 + 4); cam.lookAt(2, rex.root.position.y + 4, -14);
  } };
}

/* ---- choose stage: a voxel plinth in a forest clearing ---- */
function buildShowcaseScene() {
  const B = BIOMES[0], scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(lc(B.fog), 0.012);
  voxSky(scene, B, [0.6, 0.6, -0.5], 6);
  scene.add(new THREE.HemisphereLight(lc('#e4f2ff'), lc('#5a6a3c'), 0.62));
  const sun = new THREE.DirectionalLight(lc('#fff4dc'), 0.95); sun.position.set(12, 20, 10); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, far: 80 }); scene.add(sun);
  const n = noise2(3), hRaw = (x, z) => { const d = Math.hypot(x, z); return d < 7.6 ? 0.5 : (fbm2(n, x * 0.06, z * 0.06, 3) - 0.5) * 1.2 + sstep(30, 80, d) * 8; };
  const typer = (x, z, y) => { const d = Math.hypot(x, z); return d < 7.1 ? 1 : d < 7.6 ? 2 : fbm2(n, x * 0.1, z * 0.1, 2) > 0.55 ? 3 : 0; };
  voxTerrain(scene, { x0: -36, z0: -60, nx: 288, nz: 352, s: 0.25, height: hRaw, type: typer, pal: [{ top: '#6cbd46', side: '#5ea83e', sub: '#8a5c3a' }, { top: '#b49a74', side: '#a48a64', sub: '#8a7656' }, { top: '#8a7656', side: '#7a6646', sub: '#6a5838' }, { top: '#7cc950', side: '#66b044', sub: '#8a5c3a' }], chunk: 64 });
  const r = rng(5), P = { trunk: '#6a4a30', leaf: '#3e8a4c', leaf2: '#6ab45a' };
  voxProps(scene, prop('arauforest0', () => vAraucaria(P, 31)), Array.from({ length: 40 }, () => { const a = Math.PI * (1.05 + r() * 0.9), d = 18 + r() * 40; const x = Math.cos(a) * d, z = Math.sin(a) * d - 6; return { x, z, y: hRaw(x, z), rot: r() * TAU, s: 1 }; }));
  voxProps(scene, prop('fernforest0', () => vFern({ leaf: '#4f9e3e', leaf2: '#78bc52' }, 71)), Array.from({ length: 120 }, () => { const a = r() * TAU, d = 9 + r() * 18; const x = Math.cos(a) * d, z = Math.sin(a) * d; return { x, z, y: Math.round(hRaw(x, z) * 4) / 4, rot: r() * TAU, s: 1 }; }), { shadow: false });
  return { scene, plat: null, D: null, key: null, spin: 0.6 };
}

/* ---- museum lab for Build Dino ---- */
function buildMuseum() {
  const scene = new THREE.Scene(); scene.background = lc('#2a2420'); scene.fog = new THREE.Fog(lc('#2a2420'), 30, 70);
  scene.add(new THREE.HemisphereLight(lc('#fff0dc'), lc('#3a2a1c'), 0.62));
  const key = new THREE.DirectionalLight(lc('#fff2dc'), 0.75); key.position.set(-6, 12, 10); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, far: 60 }); scene.add(key);
  const spot = new THREE.SpotLight(lc('#ffe2b0'), 0.9, 40, 0.5, 0.6); spot.position.set(4, 14, 4); spot.target.position.set(4, 0, -2); spot.castShadow = true; scene.add(spot); scene.add(spot.target);
  // plank floor and panelled back wall, in voxels
  const floor = new VoxSet(), r = rng(3);
  for (let x = -80; x < 80; x++) for (let z = -40; z < 60; z++) { const plank = Math.floor((x + Math.floor(z / 4) * 7 + 400) / 14); floor.set(x, -1, z, vc(['#5a4432', '#6a503a', '#4e3a2a', '#624a36'][plank % 4], z % 4 === 0 ? 0.8 : 1)); }
  const fm = new THREE.Mesh(meshVox(floor, 0.25, { jitter: 0.06 }), VOXMAT); fm.receiveShadow = true; scene.add(fm);
  const wall = new VoxSet();
  for (let x = -80; x < 80; x++) for (let y = 0; y < 80; y++) {
    const wx = x < 0 ? -34 : 14, lx = x - wx, win = lx >= 0 && lx < 20 && y >= 22 && (y < 50 || (lx - 9.5) ** 2 + (y - 50) ** 2 < 100);
    if (win) { const frame = lx === 9 || lx === 10 || y === 38; wall.set(x, y, -41, frame ? vc('#2a2420') : vc(y < 28 ? '#9fbfae' : y < 44 ? '#cfe6f0' : '#e6f0ea', 1)); continue; }
    wall.set(x, y, -41, vc(y < 18 ? '#3a2a1c' : y === 18 ? '#5a4030' : (x + 200) % 16 === 0 ? '#3a302a' : '#4e4034', 1));
  }
  const wm = new THREE.Mesh(meshVox(wall, 0.25, { jitter: 0.05 }), VOXMAT); wm.receiveShadow = true; scene.add(wm);
  const signTex = canvasTex(1024, 128, (x, w, h) => { x.fillStyle = '#1e1814'; x.fillRect(0, 0, w, h); x.strokeStyle = '#b08a3a'; x.lineWidth = 6; x.strokeRect(6, 6, w - 12, h - 12); txt(x, 'MUSEUM OF NATURAL HISTORY', w / 2, 82, { font: `800 52px ${F.disp}`, color: '#e8c87a', align: 'center', ls: '4px' }); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.12), new THREE.MeshLambertMaterial({ map: signTex })); sign.position.set(0, 16.5, -9.7); scene.add(sign);
  // fossils on shelves
  const shelf = new VoxSet(), bone = vc('#e2d6ba');
  for (const sy of [36, 54]) { for (let x = -76; x < -40; x++) shelf.set(x, sy, -39, vc('#3a2a1c')); for (let k = 0; k < 5; k++) shelf.blob(-72 + k * 7, sy + 3, -39, 2.6, 2.6, 1.2, () => bone); }
  scene.add(new THREE.Mesh(meshVox(shelf, 0.25), VOXMAT));
  // turntable
  const tt = new VoxSet(); tt.blob(0, 1, 0, 26.5, 1.4, 26.5, (x, y, z, q) => (q > 0.93 ? vc('#e8c87a') : vc('#6a5a48')));
  const table = new THREE.Mesh(meshVox(tt, 0.25, { jitter: 0.04 }), VOXMAT); table.position.set(4, 0, -1); table.receiveShadow = true; table.castShadow = true; scene.add(table);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(6.0, 0.05, 4, 4), new THREE.MeshBasicMaterial({ color: lc('#e8c87a') })); ring.rotation.x = Math.PI / 2; ring.position.set(4, 0.62, -1); ring.visible = false; scene.add(ring);
  // filing cabinet: three drawers, each a clickable box
  const cab = new THREE.Group(); cab.position.set(-7.5, 0, -4); scene.add(cab);
  const L = c => new THREE.MeshLambertMaterial({ color: lc(c) });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 5.4, 2.2), L('#6b4a30')); body.position.y = 2.7; body.castShadow = true; body.receiveShadow = true; cab.add(body);
  const drawers = [];
  ['HEADS', 'BODIES', 'TAILS'].forEach((lab, i) => {
    const d = new THREE.Group(); d.position.set(0, 4.45 - i * 1.65, 1.1); cab.add(d);
    const front = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.45, 0.16), L('#8a6340')); front.castShadow = true; d.add(front);
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.2, 2.0), L('#4a3220')); box.position.z = -1.05; d.add(box);
    const labelTex = canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#d8b46a'; x.fillRect(0, 0, w, h); txt(x, lab, w / 2, 44, { font: `700 32px ${F.mono}`, color: '#3a2a10', align: 'center', ls: '2px' }); });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.28), new THREE.MeshLambertMaterial({ map: labelTex })); label.position.set(0, 0.3, 0.09); d.add(label);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.12), L('#c8a050')); handle.position.set(0, -0.2, 0.12); d.add(handle);
    for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.14, 0.14), L('#efe5cf')); b.rotation.y = k * 0.7; b.position.set(-0.6 + k * 0.4, 0.62, -0.8); d.add(b); }
    drawers.push({ group: d, front, label: lab, open: 0 });
  });
  const pal = buildPaleontologist(); pal.position.set(-11.5, 0, -2); pal.rotation.y = 0.5; scene.add(pal);
  return { scene, drawers, cab, table, ring, pal, key };
}
function buildPaleontologist() {
  const g = new THREE.Group(), M_ = c => new THREE.MeshStandardMaterial({ color: lc(c) });
  const skin = M_('#e3b08a'), coat = M_('#f2efe8'), trous = M_('#3b4252'), hair = M_('#7a6a5a'), dark = M_('#2a2622');
  const add = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1, par = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); par.add(m); return m; };
  add(new THREE.CylinderGeometry(0.22, 0.2, 1.6, 10), trous, -0.28, 0.8, 0); add(new THREE.CylinderGeometry(0.22, 0.2, 1.6, 10), trous, 0.28, 0.8, 0);
  add(new THREE.BoxGeometry(0.42, 0.18, 0.7), dark, -0.28, 0.09, 0.12); add(new THREE.BoxGeometry(0.42, 0.18, 0.7), dark, 0.28, 0.09, 0.12);
  add(new THREE.CylinderGeometry(0.62, 0.85, 2.1, 14), coat, 0, 2.35, 0);
  add(new THREE.ConeGeometry(0.28, 0.6, 3), M_('#9ec3d8'), 0, 3.1, 0.52, 1, -1, 0.3).rotation.x = 0.15;
  add(new THREE.BoxGeometry(0.14, 0.7, 0.06), M_('#b5523a'), 0, 2.85, 0.62).userData.voxPrio = 1;
  const armL = add(new THREE.CylinderGeometry(0.2, 0.18, 1.5, 10), coat, -0.82, 2.55, 0.1); armL.rotation.z = 0.25; armL.rotation.x = -0.5;
  add(new THREE.SphereGeometry(0.16, 10, 8), skin, -0.95, 1.85, 0.5);
  // the right arm swings on its own shoulder joint, so it becomes its own voxel piece
  const shoulder = new THREE.Group(); shoulder.position.set(0.62, 3.15, 0.2); shoulder.rotation.set(-0.35, 0, -1.1); g.add(shoulder); g.userData.armR = shoulder;
  add(new THREE.CylinderGeometry(0.2, 0.18, 1.5, 10), coat, 0, 0.7, 0, 1, 1, 1, shoulder);
  add(new THREE.SphereGeometry(0.17, 10, 8), skin, 0, 1.52, 0, 1, 1, 1, shoulder);
  const clip = add(new THREE.BoxGeometry(0.7, 0.9, 0.05), M_('#8a6a44'), -0.75, 2.0, 0.62); clip.rotation.x = -0.4; const paper = add(new THREE.BoxGeometry(0.6, 0.75, 0.04), M_('#fbf8f0'), -0.75, 2.02, 0.67); paper.rotation.x = -0.4; paper.userData.voxPrio = 1;
  add(new THREE.CylinderGeometry(0.2, 0.22, 0.3, 10), skin, 0, 3.5, 0);
  add(new THREE.SphereGeometry(0.55, 18, 14), skin, 0, 4.05, 0, 1, 1.12, 1);
  add(new THREE.SphereGeometry(0.58, 16, 12), hair, 0, 4.25, -0.12, 1, 0.8, 0.95).userData.voxPrio = 0;
  add(new THREE.SphereGeometry(0.12, 8, 6), skin, -0.55, 4.0, 0, 0.6, 1, 1); add(new THREE.SphereGeometry(0.12, 8, 6), skin, 0.55, 4.0, 0, 0.6, 1, 1);
  for (const sx of [-0.2, 0.2]) { add(new THREE.TorusGeometry(0.15, 0.03, 6, 16), dark, sx, 4.08, 0.5).userData.voxPrio = 2; add(new THREE.SphereGeometry(0.06, 6, 4), dark, sx, 4.08, 0.53).userData.voxPrio = 3; }
  add(new THREE.BoxGeometry(0.12, 0.03, 0.03), dark, 0, 4.08, 0.55).userData.voxPrio = 2;
  add(new THREE.SphereGeometry(0.09, 6, 4), skin, 0, 3.92, 0.58, 1, 1.3, 1).userData.voxPrio = 1;
  add(new THREE.BoxGeometry(0.36, 0.08, 0.08), hair, 0, 3.8, 0.54).userData.voxPrio = 2;
  add(new THREE.BoxGeometry(0.24, 0.04, 0.04), M_('#8a4a3a'), 0, 3.68, 0.55).userData.voxPrio = 2;
  voxelize(g, 0.06, { jitter: 0.04 });
  return g;
}
