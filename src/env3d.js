/* ===== 3D worlds: five ecosystems, title valley, museum lab ===== */
const AREA_LEN = 120, HALF_W = 15;

function canvasTex(w, h, draw) {
  const [c, x] = mk(w, h); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
}
const TEX = {};
function foliageTex(kind, pal = {}) {
  const key = kind + JSON.stringify(pal);
  if (TEX[key]) return TEX[key];
  let t;
  if (kind === 'fern') t = canvasTex(256, 256, x => fern(x, 128, 252, 220, pal.leaf || '#4f7a3e', pal.seed || 11, { n: 9, spread: 2.9, droop: 0.07, leaf: 1.4 }));
  else if (kind === 'treefern') t = canvasTex(256, 512, x => treeFern(x, 128, 510, 470, pal.trunk || '#3e3424', pal.leaf || '#4a7046', 21));
  else if (kind === 'araucaria') t = canvasTex(256, 512, x => conifer(x, 128, 510, 500, pal.leaf || '#35584a', 31, { umbrella: true, crown: 0.6 }));
  else if (kind === 'conifer') t = canvasTex(256, 512, x => conifer(x, 128, 510, 500, pal.leaf || '#3a3a2a', 41, { tiers: 9, crown: 0.35 }));
  else if (kind === 'cycad') t = canvasTex(256, 256, x => cycad(x, 128, 254, 250, pal.trunk || '#5a4630', pal.leaf || '#5f8a3c', 51));
  else if (kind === 'horsetail') t = canvasTex(128, 256, x => { const r = rng(61); for (let i = 0; i < 7; i++) horsetail(x, 20 + r() * 88, 256, 150 + r() * 100, pal.leaf || '#5a7a3a', 62 + i); });
  else if (kind === 'snag') t = canvasTex(128, 512, x => { x.strokeStyle = pal.trunk || '#4d4a42'; x.lineCap = 'round'; x.lineWidth = 22; x.beginPath(); x.moveTo(64, 512); x.lineTo(60, 60); x.stroke(); x.lineWidth = 9; x.beginPath(); x.moveTo(62, 200); x.lineTo(110, 140); x.moveTo(60, 300); x.lineTo(14, 250); x.stroke(); });
  else if (kind === 'bush') t = canvasTex(256, 256, x => bush(x, 128, 250, 205, pal.seed || 71, { dark: pal.dark || '#2e5226', mid: pal.mid || '#4f8a3a', light: pal.light || '#9fd36a' }));
  else if (kind === 'glow') t = canvasTex(128, 128, x => { x.fillStyle = rad(x, 64, 64, 0, 64, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]); x.fillRect(0, 0, 128, 128); });
  else if (kind === 'curtain') t = canvasTex(64, 256, x => { x.fillStyle = lin(x, 0, 0, 0, 256, [[0, 'rgba(255,255,255,0)'], [0.6, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,.75)']]); x.fillRect(0, 0, 64, 256); });
  TEX[key] = t; return t;
}
/* two or three crossed vertical quads, base at y = 0, normals tilted up so both sides light alike */
function crossedQuads(w, h, n = 2) {
  const pos = [], nor = [], uv = [], idx = [];
  for (let q = 0; q < n; q++) {
    const a = (q / n) * Math.PI, cx = Math.cos(a) * w / 2, cz = Math.sin(a) * w / 2, b = pos.length / 3;
    pos.push(-cx, 0, -cz, cx, 0, cz, cx, h, cz, -cx, h, -cz);
    for (let i = 0; i < 4; i++) nor.push(0, 1, 0);
    uv.push(0, 0, 1, 0, 1, 1, 0, 1); idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}
function plantMaterial(tex, tint = '#ffffff') {
  // Lambert lights per vertex, which is far cheaper for overlapping cards; light both faces alike
  const m = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide, color: lc(tint) });
  m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace(/gl_FrontFacing/g, 'true'); };
  m.userData.depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.45 });
  return m;
}
/* three r128 never frustum-culls an InstancedMesh, so every plant would be drawn (and shadowed) every frame.
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
    ids.forEach((i, j) => { const p = list[i]; im.setMatrixAt(j, mats[i]); rad = Math.max(rad, c.distanceTo(v.set(p.x, p.y, p.z)) + gr * p.s * Math.max(1, p.sy || 1)); });
    gg.boundingSphere = new THREE.Sphere(c, rad);
    im.frustumCulled = true; im.castShadow = !!o.shadow; im.receiveShadow = !!o.receive;
    if (o.depth) im.customDepthMaterial = o.depth;
    scene.add(im); out.push(im);
  }
  return out;
}
function scatter(scene, tex, w, h, list, o = {}) {
  const g = crossedQuads(w, h, o.quads || 2), m = plantMaterial(tex, o.tint), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3();
  return chunked(scene, g, m, list, (p, i, M4) => { E.set(0, p.rot, 0); Q.setFromEuler(E); return M4.compose(P.set(p.x, p.y, p.z), Q, S.set(p.s, p.s * (p.sy || 1), p.s)); }, { shadow: o.shadow, depth: o.shadow ? m.userData.depth : null });
}

/* ---- low-poly 3D trees: instanced trunk + instanced crown ---- */
function mergeGeos(list) {
  const pos = [], nor = [], col = [];
  for (const g0 of list) { const g = g0.index ? g0.toNonIndexed() : g0; g.computeVertexNormals(); const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); if (c) col.push(c.getX(i), c.getY(i), c.getZ(i)); else col.push(1, 1, 1); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g;
}
function tint(g, color, jitter, seed) { const r = rng(seed), c = lc(color), p = g.attributes.position, cols = []; for (let i = 0; i < p.count; i++) { const k = 1 + (r() - 0.5) * jitter; cols.push(c.r * k, c.g * k, c.b * k); } g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); return g; }
function treeParts(kind, pal) {
  const parts = [], H = kind === 'snag' ? 12 : 16;
  let trunk;
  if (kind === 'araucaria') {
    trunk = tint(new THREE.CylinderGeometry(0.22, 0.42, H, 7).translate(0, H / 2, 0), pal.trunk, 0.15, 1);
    for (let i = 0; i < 6; i++) { const t = i / 5, r = lerp(3.4, 1.4, t) * (i === 0 ? 0.85 : 1), g = new THREE.SphereGeometry(r, 8, 4); g.scale(1, 0.26, 1); g.translate(0, H * (0.6 + 0.4 * t), 0); parts.push(tint(g.toNonIndexed(), mix(pal.leaf, '#000000', 0.12 * (1 - t)), 0.22, 10 + i)); }
  } else if (kind === 'conifer') {
    trunk = tint(new THREE.CylinderGeometry(0.18, 0.35, H, 6).translate(0, H / 2, 0), pal.trunk, 0.15, 2);
    for (let i = 0; i < 4; i++) { const t = i / 3, r = lerp(3.2, 1.2, t), g = new THREE.ConeGeometry(r, 5, 7); g.translate(0, H * (0.3 + 0.2 * i) + 2, 0); parts.push(tint(g.toNonIndexed(), mix(pal.leaf, '#000000', 0.15 * (1 - t)), 0.2, 20 + i)); }
  } else { // snag: dead trunk with broken branches
    trunk = tint(new THREE.CylinderGeometry(0.15, 0.4, H, 6).translate(0, H / 2, 0), pal.trunk, 0.15, 3);
    for (const [y, a, l] of [[0.55, 0.9, 3], [0.7, -1.0, 2.4], [0.85, 0.6, 1.6]]) { const g = new THREE.CylinderGeometry(0.06, 0.14, l, 5); g.translate(0, l / 2, 0); g.rotateZ(a); g.translate(0, H * y, 0); parts.push(tint(g.toNonIndexed(), pal.trunk, 0.15, 30)); }
  }
  return { trunk, crown: mergeGeos(parts) };
}
function trees3D(scene, kind, pal, list) {
  const { trunk, crown } = treeParts(kind, pal), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3();
  const mats = [new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, flatShading: true })];
  const at = (p, i, M4) => { Q.setFromEuler(E.set((hash3(i, 1, 2) - 0.5) * 0.08, p.rot, (hash3(i, 3, 4) - 0.5) * 0.08)); return M4.compose(P.set(p.x, p.y, p.z), Q, S.set(p.s, p.s * (p.sy || 1), p.s)); };
  [trunk, crown].forEach((g, gi) => chunked(scene, g, mats[gi], list, at, { shadow: true, receive: true }));
}

/* ---- biome definitions ---- */
const BIOMES = [
  { key: 'forest', name: 'Forest', sky: ['#5f9a9c', '#bcd8c8', '#eeeed2'], fog: '#cfdfcc', fogD: 0.011, sun: '#fff1d0', sunI: 2.0, sunDir: [0.5, 0.75, -0.45], hemi: ['#dcefff', '#4a5a30', 0.65],
    ground: ['#556f3a', '#6e6440', '#43582e'], wallH: 14, rough: 0.6, ridges: ['#97bcb0', '#7fa596', '#6c9887'], particles: { color: '#fff6c8', n: 160, size: 0.12, rise: 0.05 } },
  { key: 'swamp', name: 'Swamp', sky: ['#738f8c', '#c3d2c2', '#dde2cf'], fog: '#c3cfbe', fogD: 0.02, sun: '#fff4dc', sunI: 1.5, sunDir: [-0.4, 0.7, -0.5], hemi: ['#e2ece0', '#3e4a30', 0.75],
    ground: ['#4c5030', '#5c5a36', '#3e4428'], wallH: 9, rough: 0.35, water: '#6f9a8e', ridges: ['#a7bbb0', '#90a89a', '#7a9486'], particles: { color: '#f0f4e0', n: 120, size: 0.2, rise: 0.02 } },
  { key: 'mountains', name: 'Mountains', sky: ['#24264c', '#9a4e62', '#f2a45e'], fog: '#b0707a', fogD: 0.011, sun: '#ffb070', sunI: 2.2, sunDir: [-0.7, 0.35, -0.6], hemi: ['#a090c0', '#3a2430', 0.6],
    ground: ['#5a4248', '#6e5450', '#45323a'], wallH: 26, rough: 1.2, ridges: ['#4e2c50', '#3a2040', '#2a1830'], particles: { color: '#ffd0a0', n: 80, size: 0.1, rise: 0.03 } },
  { key: 'desert', name: 'Desert', sky: ['#5f97c0', '#e8c89a', '#f6dcac'], fog: '#efd2a2', fogD: 0.009, sun: '#fff0d0', sunI: 2.6, sunDir: [0.3, 0.85, 0.3], hemi: ['#fff2dc', '#8a5a34', 0.7],
    ground: ['#c98e58', '#d9a46c', '#a86a40'], wallH: 12, rough: 0.8, ridges: ['#d79a72', '#c06a44', '#a24f34'], particles: { color: '#fff0d0', n: 60, size: 0.08, rise: 0.0 } },
  { key: 'volcano', name: 'Volcano', sky: ['#1e1424', '#6a2a2c', '#d0603a'], fog: '#5a2e2a', fogD: 0.019, sun: '#ff8a50', sunI: 1.6, sunDir: [0.2, 0.5, -0.8], hemi: ['#c08070', '#2a1810', 0.55],
    ground: ['#3a3030', '#4a3a34', '#2a2222'], wallH: 16, rough: 0.9, lava: true, ridges: ['#3a1e26', '#2a141c', '#1e0e14'], particles: { color: '#ff9a50', n: 220, size: 0.1, rise: 0.6 } },
];

function terrainHeight(B, seed) {
  const n = noise2(seed);
  return (x, z) => {
    const ax = Math.abs(x);
    let h = (fbm2(n, x * 0.05 + 3, z * 0.05 + 7, 4) - 0.5) * B.rough * 2;
    h += sstep(HALF_W - 1, HALF_W + 16, ax) * B.wallH * (0.55 + 0.6 * fbm2(n, x * 0.03, z * 0.03, 3));
    h += sstep(HALF_W + 16, HALF_W + 60, ax) * B.wallH * 1.4;
    if (B.water) h -= 0.6 * sstep(0.45, 0.6, fbm2(n, x * 0.04 + 9, z * 0.04, 3)) * (1 - sstep(HALF_W - 3, HALF_W, ax));
    return h;
  };
}
function paintPanorama(B, seed) {
  return canvasTex(4096, 1024, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    const ns = [noise2(seed), noise2(seed + 1), noise2(seed + 2)];
    const ridge = (n, base, amp, f, sharp, col, rim) => {
      x.beginPath(); x.moveTo(0, h);
      for (let i = 0; i <= w; i += 4) {
        const a = (i / w) * TAU; let v = fbm2(n, Math.cos(a) * f + 20, Math.sin(a) * f + 20, 5);
        v = clamp((v - 0.2) / 0.6, 0, 1); if (sharp) v = lerp(v, 1 - Math.abs(v * 2 - 1), sharp);
        x.lineTo(i, base - v * amp);
      }
      x.lineTo(w, h); x.closePath(); x.fillStyle = col; x.fill();
      if (rim) { x.strokeStyle = rim; x.lineWidth = 2; x.stroke(); }
    };
    const R = B.ridges;
    ridge(ns[0], 760, 420, 2.2, B.key === 'mountains' ? 0.8 : 0.4, R[0], B.key === 'mountains' ? 'rgba(255,200,150,.6)' : null);
    x.fillStyle = lin(x, 0, 500, 0, 820, [[0, rgba(B.fog, 0)], [1, rgba(B.fog, 0.55)]]); x.fillRect(0, 500, w, 320);
    if (B.key === 'volcano') { // a smoking cone on the horizon
      const vx = w * 0.5; x.fillStyle = '#2a141a'; x.beginPath(); x.moveTo(vx - 520, 800); x.lineTo(vx - 70, 330); x.lineTo(vx + 70, 336); x.lineTo(vx + 520, 800); x.fill();
      x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = rad(x, vx, 330, 0, 200, [[0, 'rgba(255,120,40,.9)'], [1, 'rgba(255,80,20,0)']]); x.fillRect(vx - 200, 130, 400, 400); x.restore();
      smoke(x, 5, vx, 330, 320, 500, '#2a1a20', '#ff7a3a', 1);
    }
    if (B.key === 'desert') { // flat-topped mesas
      const n = ns[1]; x.beginPath(); x.moveTo(0, h);
      for (let i = 0; i <= w; i += 4) { const a = (i / w) * TAU, v = fbm2(n, Math.cos(a) * 3 + 5, Math.sin(a) * 3 + 5, 4); x.lineTo(i, 820 - sstep(0.5, 0.54, v) * 200 - sstep(0.4, 0.56, v) * 60); }
      x.lineTo(w, h); x.fill(); x.fillStyle = '#b8603e'; x.fill();
    }
    ridge(ns[1], 840, 220, 3.2, 0.3, R[1]);
    x.fillStyle = lin(x, 0, 650, 0, 900, [[0, rgba(B.fog, 0)], [1, rgba(B.fog, 0.45)]]); x.fillRect(0, 650, w, 250);
    ridge(ns[2], 930, 120, 5, 0.2, R[2]);
  });
}
function skyDome(B, scene) {
  const tex = canvasTex(8, 512, (x, w, h) => { x.fillStyle = lin(x, 0, 0, 0, h, [[0, B.sky[0]], [0.42, B.sky[1]], [0.5, B.sky[2]], [1, B.sky[2]]]); x.fillRect(0, 0, w, h); });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false }));
  scene.add(sky);
  // sun glow
  const sd = new THREE.Vector3(...B.sunDir).normalize();
  const glowM = new THREE.SpriteMaterial({ map: foliageTex('glow'), color: lc(B.sun), transparent: true, blending: THREE.AdditiveBlending, fog: false, depthWrite: false });
  const sp = new THREE.Sprite(glowM); sp.position.copy(sd.clone().multiplyScalar(500)); sp.scale.set(260, 260, 1); scene.add(sp);
  return sky;
}

function buildArea(index, skill, seedBase) {
  const B = BIOMES[index], scene = new THREE.Scene(), seed = seedBase + index * 101;
  scene.fog = new THREE.FogExp2(lc(B.fog), B.fogD);
  skyDome(B, scene);
  const pano = new THREE.Mesh(new THREE.CylinderGeometry(330, 330, 170, 64, 1, true), new THREE.MeshBasicMaterial({ map: paintPanorama(B, seed), side: THREE.BackSide, transparent: true, fog: false, depthWrite: false }));
  pano.position.set(0, 52, -AREA_LEN / 2); scene.add(pano);
  // lights
  const hemi = new THREE.HemisphereLight(lc(B.hemi[0]), lc(B.hemi[1]), B.hemi[2]); scene.add(hemi);
  const sun = new THREE.DirectionalLight(lc(B.sun), B.sunI); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 160 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
  scene.add(sun); scene.add(sun.target);
  const sunDir = new THREE.Vector3(...B.sunDir).normalize();
  // terrain
  const hAt = terrainHeight(B, seed), gw = 150, gl = AREA_LEN + 120;
  const geo = new THREE.PlaneGeometry(gw, gl, 120, 160); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -AREA_LEN / 2);
  const P = geo.attributes.position, cols = [], nC = noise2(seed + 5);
  const g0 = lc(B.ground[0]), g1 = lc(B.ground[1]), g2 = lc(B.ground[2]);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i), y = hAt(x, z); P.setY(i, y);
    const c = g0.clone().lerp(g1, fbm2(nC, x * 0.08, z * 0.08, 3)).lerp(g2, sstep(2, 10, y) * 0.8);
    if (B.water && y < -0.25) c.lerp(lc('#3a3a22'), 0.5);
    c.multiplyScalar(0.92 + hash3(x, z, 3) * 0.16); cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })); ground.receiveShadow = true; scene.add(ground);
  if (B.water) { const w = new THREE.Mesh(new THREE.PlaneGeometry(gw, gl), new THREE.MeshStandardMaterial({ color: lc(B.water), roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.82 })); w.rotation.x = -Math.PI / 2; w.position.set(0, -0.12, -AREA_LEN / 2); w.receiveShadow = true; scene.add(w); }
  if (B.lava) { // glowing cracks
    const lavaM = new THREE.MeshBasicMaterial({ color: lc('#ff6a20') }); const r = rng(seed + 9);
    for (let i = 0; i < 40; i++) { const len = 2 + r() * 6, m = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.18), lavaM); m.rotation.x = -Math.PI / 2; m.rotation.z = r() * Math.PI; const x = (r() - 0.5) * 2 * (HALF_W + 6), z = 4 - r() * (AREA_LEN + 8); m.position.set(x, hAt(x, z) + 0.04, z); scene.add(m); }
    const pl = new THREE.PointLight(lc('#ff6a30'), 1.2, 60); pl.position.set(0, 6, -AREA_LEN / 2); scene.add(pl);
  }
  // vegetation and rocks
  const r = rng(seed + 11), list = (n, fn) => { const out = []; for (let i = 0; i < n; i++) { const p = fn(); if (p) out.push(p); } return out; };
  const side = (minX, maxX) => { const s_ = r() < 0.5 ? -1 : 1, x = s_ * lerp(minX, maxX, r()), z = 8 - r() * (AREA_LEN + 30); return { x, z, y: hAt(x, z) - 0.2, rot: r() * Math.PI, s: 1 }; };
  const inside = () => { const x = (r() - 0.5) * 2 * (HALF_W + 2), z = 6 - r() * (AREA_LEN + 10); return { x, z, y: hAt(x, z) - 0.05, rot: r() * Math.PI, s: 1 }; };
  const sz = (p, a, b) => { p.s = lerp(a, b, r()); return p; };
  const K = B.key;
  if (K === 'forest') {
    trees3D(scene, 'araucaria', { trunk: '#5a4632', leaf: '#3a6048' }, list(90, () => sz(side(HALF_W - 1, HALF_W + 34), 0.7, 1.3)));
    scatter(scene, foliageTex('treefern'), 7, 12, list(70, () => sz(side(HALF_W - 3, HALF_W + 20), 0.7, 1.2)), { shadow: true });
    scatter(scene, foliageTex('cycad'), 4, 4, list(40, () => sz(side(HALF_W - 4, HALF_W + 12), 0.7, 1.3)), { shadow: true });
    scatter(scene, foliageTex('fern'), 2.6, 2.6, list(420, () => sz(r() < 0.6 ? inside() : side(HALF_W - 2, HALF_W + 25), 0.6, 1.4)), { quads: 3 });
    scatter(scene, foliageTex('horsetail'), 1.2, 2.4, list(120, () => sz(inside(), 0.7, 1.3)));
  } else if (K === 'swamp') {
    scatter(scene, foliageTex('treefern', { leaf: '#557564', trunk: '#3e4a3e' }), 7, 12, list(90, () => sz(r() < 0.25 ? inside() : side(HALF_W - 4, HALF_W + 28), 0.7, 1.3)), { shadow: true });
    trees3D(scene, 'snag', { trunk: '#5d6a62' }, list(30, () => sz(side(HALF_W - 6, HALF_W + 26), 0.7, 1.3)));
    scatter(scene, foliageTex('horsetail'), 1.2, 2.4, list(400, () => sz(inside(), 0.8, 1.6)));
    scatter(scene, foliageTex('fern', { leaf: '#3f6435' }), 2.6, 2.6, list(220, () => sz(inside(), 0.6, 1.2)), { quads: 3 });
  } else if (K === 'mountains') {
    trees3D(scene, 'conifer', { trunk: '#3a2430', leaf: '#3a3a42' }, list(90, () => sz(side(HALF_W + 2, HALF_W + 40), 0.6, 1.2)));
    scatter(scene, foliageTex('cycad', { leaf: '#4a5a2e', trunk: '#3a2430' }), 4, 4, list(30, () => sz(inside(), 0.6, 1.1)), { shadow: true });
    scatter(scene, foliageTex('fern', { leaf: '#4a5a32' }), 2.6, 2.6, list(160, () => sz(inside(), 0.5, 1.0)), { quads: 3 });
  } else if (K === 'desert') {
    scatter(scene, foliageTex('cycad', { leaf: '#7a8a3a', trunk: '#6a4a2a' }), 4, 4, list(50, () => sz(r() < 0.5 ? inside() : side(HALF_W - 2, HALF_W + 20), 0.6, 1.2)), { shadow: true });
    trees3D(scene, 'araucaria', { trunk: '#6a4a2a', leaf: '#6a6a3a' }, list(26, () => sz(side(HALF_W + 2, HALF_W + 30), 0.6, 1.0)));
    scatter(scene, foliageTex('fern', { leaf: '#8a8a40' }), 2.6, 2.6, list(60, () => sz(inside(), 0.4, 0.8)), { quads: 3, tint: '#e8d8a8' });
  } else {
    trees3D(scene, 'snag', { trunk: '#241a16' }, list(70, () => sz(r() < 0.2 ? inside() : side(HALF_W - 4, HALF_W + 30), 0.6, 1.3)));
    scatter(scene, foliageTex('fern', { leaf: '#4a4a26' }), 2.6, 2.6, list(90, () => sz(inside(), 0.4, 0.9)), { quads: 3, tint: '#b0a080' });
  }
  // boulders
  const rockG = new THREE.IcosahedronGeometry(1, 1); { const p = rockG.attributes.position, nr = noise2(seed + 3); for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)); v.multiplyScalar(0.75 + 0.5 * fbm2(nr, v.x * 2 + 5, v.z * 2 + v.y, 2)); p.setXYZ(i, v.x, v.y * 0.75, v.z); } rockG.computeVertexNormals(); }
  const rockM = new THREE.MeshStandardMaterial({ color: lc(B.ground[2]).multiplyScalar(1.15), roughness: 0.9, flatShading: true });
  const rocks = list(K === 'mountains' ? 70 : K === 'desert' ? 45 : 25, () => sz(r() < 0.4 ? inside() : side(HALF_W - 3, HALF_W + 9), 0.5, K === 'mountains' ? 3.2 : 2.0));
  const Q = new THREE.Quaternion();
  chunked(scene, rockG, rockM, rocks, (p, i, M4) => { Q.setFromEuler(new THREE.Euler(r(), p.rot, r() * 0.3)); return M4.compose(new THREE.Vector3(p.x, p.y + p.s * 0.1, p.z), Q, new THREE.Vector3(p.s, p.s, p.s)); }, { shadow: true, receive: true });
  // exit light curtains at both ends of the valley
  const curtainM = new THREE.MeshBasicMaterial({ map: foliageTex('curtain'), color: lc('#fff2c8'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, opacity: 0.55 });
  const exits = [];
  for (const [z, show] of [[-AREA_LEN, true], [4, index > 0]]) { if (!show) continue; const m = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W * 2 + 4, 9), curtainM); m.position.set(0, hAt(0, z) + 4.5, z); scene.add(m); exits.push(m); }
  // floating particles: motes, mist, embers
  const pc = B.particles, pg = new THREE.BufferGeometry(), pp = [];
  for (let i = 0; i < pc.n; i++) pp.push((r() - 0.5) * 50, r() * 10, 6 - r() * (AREA_LEN + 12));
  pg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ map: foliageTex('glow'), color: lc(pc.color), size: pc.size * 8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
  scene.add(pts);
  // edible bushes along the valley (fewer at higher skill levels)
  const nb = [4, 3, 2][skill - 1] + (B.key === 'desert' || B.key === 'volcano' ? -1 : 0);
  const bushes = [];
  const bushTex = foliageTex('bush', B.key === 'desert' ? { dark: '#4a5a26', mid: '#7a8a3a', light: '#c0c870', seed: 72 } : B.key === 'volcano' ? { dark: '#3a4a22', mid: '#5a7030', light: '#8aa850', seed: 73 } : {});
  for (let i = 0; i < Math.max(1, nb); i++) {
    const z = -12 - (i + 0.5) * ((AREA_LEN - 20) / Math.max(1, nb)) + (r() - 0.5) * 10, x = (r() - 0.5) * 2 * (HALF_W - 4);
    const m = new THREE.Mesh(crossedQuads(3.4, 3.4, 3), plantMaterial(bushTex)); m.position.set(x, hAt(x, z) - 0.05, z); m.castShadow = true; m.customDepthMaterial = m.material.userData.depth; scene.add(m);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.15, 40), new THREE.MeshBasicMaterial({ color: lc('#ffe58a'), transparent: true, opacity: 0, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(x, hAt(x, z) + 0.06, z); scene.add(ring);
    bushes.push({ x, z, food: [42, 34, 28][skill - 1], max: [42, 34, 28][skill - 1], mesh: m, ring });
  }
  const area = { index, B, scene, hAt, sun, sunDir, bushes, pts, exits, t: 0 };
  area.update = (dt, focus) => {
    area.t += dt;
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
  const B = { ...BIOMES[2], sky: ['#191433', '#a24d6c', '#ffc06e'], fog: '#c47a7a', fogD: 0.006, ridges: ['#7a4870', '#5b3152', '#3a1d38'] };
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(lc('#b8707a'), 0.008);
  skyDome({ ...B, sunDir: [0.1, 0.12, -1] }, scene);
  const pano = new THREE.Mesh(new THREE.CylinderGeometry(330, 330, 170, 64, 1, true), new THREE.MeshBasicMaterial({ map: paintPanorama({ ...B, key: 'volcano' }, 4), side: THREE.BackSide, transparent: true, fog: false, depthWrite: false }));
  pano.position.set(0, 52, 0); pano.rotation.y = Math.PI * 0.08; scene.add(pano);
  scene.add(new THREE.HemisphereLight(lc('#a888c8'), lc('#2a1828'), 0.6));
  const sun = new THREE.DirectionalLight(lc('#ffb070'), 2.4); sun.position.set(10, 12, -60); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, far: 200 }); scene.add(sun);
  const n = noise2(9), hAt = (x, z) => (fbm2(n, x * 0.04, z * 0.04, 4) - 0.5) * 3 + sstep(10, 60, Math.abs(x)) * 10;
  const geo = new THREE.PlaneGeometry(300, 300, 100, 100); geo.rotateX(-Math.PI / 2);
  const P = geo.attributes.position, cols = [];
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), y = hAt(x, z); P.setY(i, y); const c = lc('#3a2236').lerp(lc('#5a3048'), hash3(x, z, 1) * 0.5); cols.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
  const g = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); g.receiveShadow = true; scene.add(g);
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(4, 1), new THREE.MeshStandardMaterial({ color: lc('#3a2830'), roughness: 0.9, flatShading: true })); rock.scale.set(2.2, 0.7, 1.6); rock.position.set(6, hAt(6, -8) + 1.2, -8); rock.receiveShadow = true; rock.castShadow = true; scene.add(rock);
  const rex = build3D('trex'); rex.root.position.set(6, rock.position.y + 2.6, -8); rex.root.rotation.y = 2.6; scene.add(rex.root);
  const herd = [];
  for (let i = 0; i < 4; i++) { const d = build3D('bronto'); d.root.position.set(-30 + i * 9, 0, -70 - i * 6); d.root.position.y = hAt(d.root.position.x, d.root.position.z); d.root.rotation.y = 0.3 + i * 0.4; scene.add(d.root); herd.push(d); }
  const r = rng(12);
  scatter(scene, foliageTex('fern', { leaf: '#1a0e18' }), 2.6, 2.6, Array.from({ length: 160 }, () => { const x = (r() - 0.5) * 80, z = 20 - r() * 70; return { x, z, y: hAt(x, z), rot: r() * 3, s: 0.7 + r() }; }), { quads: 3 });
  trees3D(scene, 'araucaria', { trunk: '#2a1820', leaf: '#2e1a2a' }, Array.from({ length: 50 }, () => { const s_ = r() < 0.5 ? -1 : 1, x = s_ * (25 + r() * 40), z = 10 - r() * 120; return { x, z, y: hAt(x, z), rot: r() * 3, s: 0.8 + r() * 0.5 }; }));
  const pg = new THREE.BufferGeometry(), pp = []; for (let i = 0; i < 250; i++) pp.push((r() - 0.5) * 60, r() * 20, 10 - r() * 60);
  pg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ map: foliageTex('glow'), color: lc('#ffb070'), size: 0.7, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(pts);
  let t = 0;
  return { scene, rex, herd, update(dt, cam) {
    t += dt; rex.update(dt, 0, 'idle'); rex.look = 0.3 + 0.2 * Math.sin(t * 0.4); herd.forEach((d, i) => { d.update(dt, 0.8, 'walk'); const f = new THREE.Vector3(Math.cos(d.root.rotation.y), 0, -Math.sin(d.root.rotation.y)); d.root.position.addScaledVector(f, dt * 0.8); d.root.position.y = hAt(d.root.position.x, d.root.position.z); });
    const a = pts.geometry.attributes.position; for (let i = 0; i < a.count; i++) { let y = a.getY(i) + dt * 0.5; if (y > 20) y = 0; a.setY(i, y); } a.needsUpdate = true;
    const ang = t * 0.05; cam.position.set(6 + Math.sin(ang) * 16, rex.root.position.y + 3.5, -8 + Math.cos(ang) * 16 + 4); cam.lookAt(2, rex.root.position.y + 4, -14);
  } };
}

/* ---- museum lab for Build Dino ---- */
function buildMuseum() {
  const scene = new THREE.Scene(); scene.background = lc('#2a2420'); scene.fog = new THREE.Fog(lc('#2a2420'), 30, 70);
  scene.add(new THREE.HemisphereLight(lc('#fff0dc'), lc('#3a2a1c'), 0.55));
  const key = new THREE.DirectionalLight(lc('#fff2dc'), 1.4); key.position.set(-6, 12, 10); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, far: 60 }); scene.add(key);
  const spot = new THREE.SpotLight(lc('#ffe2b0'), 1.6, 40, 0.5, 0.6); spot.position.set(4, 14, 4); spot.target.position.set(4, 0, -2); spot.castShadow = true; scene.add(spot); scene.add(spot.target);
  // floor (wood planks) and walls
  const floorTex = canvasTex(1024, 1024, (x, w, h) => { x.fillStyle = '#5a4432'; x.fillRect(0, 0, w, h); const r = rng(3); for (let y = 0; y < h; y += 64) { for (let xx = -r() * 300; xx < w; xx += 260 + r() * 200) { x.fillStyle = mix('#5a4432', r() < 0.5 ? '#6e543c' : '#4a3828', r()); x.fillRect(xx, y, 300, 62); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(xx, y, 2, 64); } x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, y + 62, w, 2); } });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(3, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.7 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wallTex = canvasTex(2048, 1024, (x, w, h) => {
    x.fillStyle = lin(x, 0, 0, 0, h, [[0, '#3a302a'], [0.7, '#4e4034'], [0.72, '#3a2a1c'], [1, '#2a1e14']]); x.fillRect(0, 0, w, h);
    for (const wx of [560, 1260]) { x.save(); x.beginPath(); x.moveTo(wx, 640); x.lineTo(wx, 300); x.arc(wx + 120, 300, 120, Math.PI, 0); x.lineTo(wx + 240, 640); x.closePath(); x.clip();
      x.fillStyle = lin(x, 0, 180, 0, 640, [[0, '#cfe6f0'], [1, '#f6ecd0']]); x.fillRect(wx, 170, 240, 470); x.fillStyle = '#9fbfae'; x.beginPath(); x.moveTo(wx, 640); for (let k = 0; k <= 10; k++) x.lineTo(wx + k * 24, 560 - Math.sin(k * 1.3) * 22); x.lineTo(wx + 240, 640); x.fill();
      x.strokeStyle = '#2a2420'; x.lineWidth = 10; x.beginPath(); x.moveTo(wx + 120, 170); x.lineTo(wx + 120, 640); x.moveTo(wx, 420); x.lineTo(wx + 240, 420); x.stroke(); x.restore(); }
    x.fillStyle = '#1e1814'; rr(x, 640, 50, 760, 90, 8); x.fill(); x.strokeStyle = '#b08a3a'; x.lineWidth = 3; x.stroke();
    txt(x, 'MUSEUM OF NATURAL HISTORY', 1020, 110, { font: `800 40px ${F.disp}`, color: '#e8c87a', align: 'center', ls: '4px' });
    for (const sy of [380, 560]) { x.fillStyle = '#3a2a1c'; x.fillRect(80, sy, 380, 14); for (let k = 0; k < 6; k++) { const fx = 110 + k * 62; x.fillStyle = '#d8ccb0'; if (k % 2) { x.beginPath(); x.arc(fx, sy - 20, 19, 0, TAU); x.fill(); } else { x.beginPath(); x.ellipse(fx, sy - 16, 24, 15, 0, Math.PI, 0); x.lineTo(fx + 28, sy); x.lineTo(fx - 24, sy); x.fill(); } } }
  });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 })); wall.position.set(0, 10, -10); wall.receiveShadow = true; scene.add(wall);
  // turntable
  const table = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.8, 0.6, 64), new THREE.MeshStandardMaterial({ color: lc('#6a5a48'), roughness: 0.6 })); table.position.set(4, 0.3, -1); table.receiveShadow = true; table.castShadow = true; scene.add(table);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(6.0, 0.05, 6, 80), new THREE.MeshBasicMaterial({ color: lc('#e8c87a') })); ring.rotation.x = Math.PI / 2; ring.position.set(4, 0.62, -1); scene.add(ring);
  // filing cabinet: three drawers, each a clickable mesh
  const cab = new THREE.Group(); cab.position.set(-7.5, 0, -4); scene.add(cab);
  const wood = new THREE.MeshStandardMaterial({ color: lc('#6b4a30'), roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 5.4, 2.2), wood); body.position.y = 2.7; body.castShadow = true; body.receiveShadow = true; cab.add(body);
  const drawers = [];
  ['HEADS', 'BODIES', 'TAILS'].forEach((lab, i) => {
    const d = new THREE.Group(); d.position.set(0, 4.45 - i * 1.65, 1.1); cab.add(d);
    const front = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.45, 0.16), new THREE.MeshStandardMaterial({ color: lc('#8a6340'), roughness: 0.55 })); front.castShadow = true; d.add(front);
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.2, 2.0), new THREE.MeshStandardMaterial({ color: lc('#4a3220'), roughness: 0.8 })); box.position.z = -1.05; d.add(box);
    const labelTex = canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#d8b46a'; x.fillRect(0, 0, w, h); txt(x, lab, w / 2, 44, { font: `700 32px ${F.mono}`, color: '#3a2a10', align: 'center', ls: '2px' }); });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.28), new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.5 })); label.position.set(0, 0.3, 0.09); d.add(label);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.12), new THREE.MeshStandardMaterial({ color: lc('#c8a050'), metalness: 0.6, roughness: 0.3 })); handle.position.set(0, -0.2, 0.12); d.add(handle);
    // bones resting in the drawer
    for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6), new THREE.MeshStandardMaterial({ color: lc('#efe5cf') })); b.rotation.z = Math.PI / 2; b.rotation.y = k * 0.7; b.position.set(-0.6 + k * 0.4, 0.62, -0.8); d.add(b); }
    drawers.push({ group: d, front, label: lab, open: 0 });
  });
  const pal = buildPaleontologist(); pal.position.set(-11.5, 0, -2); pal.rotation.y = 0.5; scene.add(pal);
  return { scene, drawers, cab, table, ring, pal, key };
}
/* low-poly paleontologist: bald, glasses, moustache, lab coat, clipboard */
function buildPaleontologist() {
  const g = new THREE.Group(), M_ = c => new THREE.MeshStandardMaterial({ color: lc(c), roughness: 0.7 });
  const skin = M_('#e3b08a'), coat = M_('#f2efe8'), trous = M_('#3b4252'), hair = M_('#7a6a5a'), dark = M_('#2a2622');
  const add = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; g.add(m); return m; };
  add(new THREE.CylinderGeometry(0.22, 0.2, 1.6, 10), trous, -0.28, 0.8, 0); add(new THREE.CylinderGeometry(0.22, 0.2, 1.6, 10), trous, 0.28, 0.8, 0);
  add(new THREE.BoxGeometry(0.42, 0.18, 0.7), dark, -0.28, 0.09, 0.12); add(new THREE.BoxGeometry(0.42, 0.18, 0.7), dark, 0.28, 0.09, 0.12);
  add(new THREE.CylinderGeometry(0.62, 0.85, 2.1, 14), coat, 0, 2.35, 0);
  add(new THREE.ConeGeometry(0.28, 0.6, 3), M_('#9ec3d8'), 0, 3.1, 0.52, 1, -1, 0.3).rotation.x = 0.15;
  add(new THREE.BoxGeometry(0.14, 0.7, 0.06), M_('#b5523a'), 0, 2.85, 0.62);
  const armL = add(new THREE.CylinderGeometry(0.2, 0.18, 1.5, 10), coat, -0.82, 2.55, 0.1); armL.rotation.z = 0.25; armL.rotation.x = -0.5;
  const armR = add(new THREE.CylinderGeometry(0.2, 0.18, 1.5, 10), coat, 0.85, 2.7, 0.35); armR.rotation.z = -1.1; armR.rotation.x = -0.4; g.userData.armR = armR;
  add(new THREE.SphereGeometry(0.16, 10, 8), skin, -0.95, 1.85, 0.5); add(new THREE.SphereGeometry(0.16, 10, 8), skin, 1.55, 3.05, 0.75);
  const clip = add(new THREE.BoxGeometry(0.7, 0.9, 0.05), M_('#8a6a44'), -0.75, 2.0, 0.62); clip.rotation.x = -0.4; const paper = add(new THREE.BoxGeometry(0.6, 0.75, 0.02), M_('#fbf8f0'), -0.75, 2.0, 0.66); paper.rotation.x = -0.4;
  add(new THREE.CylinderGeometry(0.2, 0.22, 0.3, 10), skin, 0, 3.5, 0);
  const head = add(new THREE.SphereGeometry(0.55, 18, 14), skin, 0, 4.05, 0, 1, 1.12, 1);
  add(new THREE.TorusGeometry(0.5, 0.12, 8, 20, Math.PI * 1.25), hair, 0, 3.95, -0.05).rotation.set(Math.PI / 2, 0, -Math.PI * 0.12 + Math.PI);
  add(new THREE.SphereGeometry(0.12, 8, 6), skin, -0.55, 4.0, 0, 0.6, 1, 1); add(new THREE.SphereGeometry(0.12, 8, 6), skin, 0.55, 4.0, 0, 0.6, 1, 1);
  for (const sx of [-0.2, 0.2]) { add(new THREE.TorusGeometry(0.15, 0.025, 6, 16), dark, sx, 4.08, 0.5); add(new THREE.SphereGeometry(0.05, 6, 4), dark, sx, 4.08, 0.52); }
  add(new THREE.BoxGeometry(0.1, 0.02, 0.02), dark, 0, 4.08, 0.55);
  add(new THREE.SphereGeometry(0.08, 6, 4), skin, 0, 3.95, 0.58, 1, 1.3, 1);
  add(new THREE.BoxGeometry(0.34, 0.07, 0.08), hair, 0, 3.8, 0.53);
  add(new THREE.TorusGeometry(0.12, 0.018, 4, 10, Math.PI), M_('#8a4a3a'), 0, 3.71, 0.52).rotation.z = Math.PI;
  return g;
}
