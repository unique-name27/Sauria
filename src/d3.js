/* ===== 3D dinosaurs, lofted from the 2D spine rig ===== */
const SIZE = { trex: 1.35, stego: 1.0, bronto: 1.55, trike: 1.1, allo: 1.2, coelo: 0.55, para: 1.1, anky: 1.05, diplo: 1.55, iguano: 1.1, deino: 0.65, pachy: 0.85, brachio: 1.5, spino: 1.35, proto: 0.6, cory: 1.1, galli: 0.85, edmonto: 1.2 };
const WIDTH = { anky: 1.45, trike: 1.12, proto: 1.1, stego: 0.92, bronto: 1.0, brachio: 1.0, diplo: 0.95, trex: 0.9, allo: 0.85, spino: 0.8, deino: 0.8, coelo: 0.75, galli: 0.8 };
const U = 0.026; // metres per rig unit

const _rimUniforms = { uRim: { value: new THREE.Color('#ffe2b0') }, uRimK: { value: 0.22 } };
function rimMaterial(opts) {
  const m = new THREE.MeshStandardMaterial(opts);
  m.onBeforeCompile = sh => {
    sh.uniforms.uRim = _rimUniforms.uRim; sh.uniforms.uRimK = _rimUniforms.uRimK;
    sh.fragmentShader = 'uniform vec3 uRim; uniform float uRimK;\n' + sh.fragmentShader.replace('#include <tonemapping_fragment>',
      'float rimF = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 3.0);\n gl_FragColor.rgb += uRim * rimF * uRimK;\n#include <tonemapping_fragment>');
  };
  return m;
}
const DMAT = rimMaterial({ vertexColors: true, roughness: 0.78, metalness: 0.0 });
const EYE_MAT = new THREE.MeshStandardMaterial({ color: new THREE.Color('#0b0805').convertSRGBToLinear(), roughness: 0.2, metalness: 0.1 });
const GLINT_MAT = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const TOOTH_MAT = new THREE.MeshStandardMaterial({ color: new THREE.Color('#f2ead8').convertSRGBToLinear(), roughness: 0.5 });
const lc = h => new THREE.Color(h).convertSRGBToLinear();

function hash3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }

/* geometry from rings of points (each ring: array of [x, y, z]) with per-vertex colours.
   domeStart / domeEnd round off the open ends with a few shrinking rings (value = how far the dome bulges, 0..1). */
function ringGeometry(rings, cols, domeStart = 0, domeEnd = 0) {
  const addDome = (atStart, K) => {
    const i = atStart ? 0 : rings.length - 1, j = atStart ? 1 : rings.length - 2, ring = rings[i], n = ring.length;
    const c = [0, 0, 0], c2 = [0, 0, 0];
    ring.forEach(p => { c[0] += p[0] / n; c[1] += p[1] / n; c[2] += p[2] / n; });
    rings[j].forEach(p => { c2[0] += p[0] / n; c2[1] += p[1] / n; c2[2] += p[2] / n; });
    let d = [c[0] - c2[0], c[1] - c2[1], c[2] - c2[2]]; const L = Math.hypot(...d) || 1; d = d.map(v => v / L);
    const r = ring.reduce((acc, p) => acc + Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]), 0) / n;
    const extra = [], extraC = [];
    for (let m = 1; m <= 4; m++) {
      const a = (m / 4.4) * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a) * r * K;
      extra.push(ring.map(p => [c[0] + (p[0] - c[0]) * ca + d[0] * sa, c[1] + (p[1] - c[1]) * ca + d[1] * sa, c[2] + (p[2] - c[2]) * ca + d[2] * sa]));
      extraC.push(cols[i]);
    }
    if (atStart) { rings.unshift(...extra.reverse()); cols.unshift(...extraC); } else { rings.push(...extra); cols.push(...extraC); }
    return [c[0] + d[0] * r * K, c[1] + d[1] * r * K, c[2] + d[2] * r * K];
  };
  rings = rings.slice(); cols = cols.slice();
  const tipS = domeStart ? addDome(true, domeStart) : null, tipE = domeEnd ? addDome(false, domeEnd) : null;
  const n = rings[0].length, pos = [], col = [], idx = [];
  rings.forEach((r, i) => r.forEach((p, j) => { pos.push(p[0], p[1], p[2]); const c = cols[i][j]; col.push(c.r, c.g, c.b); }));
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < n; j++) {
    const a = i * n + j, b = i * n + (j + 1) % n, c = (i + 1) * n + j, d = (i + 1) * n + (j + 1) % n;
    idx.push(a, c, b, b, c, d);
  }
  const cap = (ri, tip, flip) => {
    const v = pos.length / 3; pos.push(tip[0], tip[1], tip[2]); const c = cols[ri][0]; col.push(c.r, c.g, c.b);
    for (let j = 0; j < n; j++) { const a = ri * n + j, b = ri * n + (j + 1) % n; flip ? idx.push(v, a, b) : idx.push(v, b, a); }
  };
  if (tipS) cap(0, tipS, false);
  if (tipE) cap(rings.length - 1, tipE, true);
  // make every triangle face outwards: test one wall triangle against the ring centre
  const P_ = i => new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
  const mid = Math.floor(rings.length / 2), a0 = mid * n, cen = new THREE.Vector3();
  for (let j = 0; j < n; j++) cen.add(P_(mid * n + j)); cen.multiplyScalar(1 / n);
  const N = P_(a0 + n).sub(P_(a0)).cross(P_(a0 + 1).sub(P_(a0)));
  if (N.dot(P_(a0).sub(cen)) < 0) for (let t = 0; t < idx.length; t += 3) { const tmp = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = tmp; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function build3D(sel, o = {}) {
  if (typeof sel === 'string') sel = { head: sel, neck: sel, body: sel, tail: sel };
  const M = assemble(sel), k = U * (o.size ?? SIZE[sel.body] ?? 1), S = M.S, seg = 14;
  if (o.pal) for (const t of ['tail', 'body', 'neck', 'head']) M.partPal[t] = { ...M.partPal[t], ...(o.pal[sel[t]] || {}) };
  const wf = WIDTH[sel.body] ?? 0.95, wfHead = WIDTH[sel.head] ?? 0.95;
  const pal = tag => { const p = M.partPal[tag === 'neck' ? 'neck' : tag]; return { side: lc(p.side), back: lc(p.back), belly: lc(p.belly), stripe: lc(p.stripe) }; };
  const P3 = (x, y, z = 0) => [x * k, -y * k, z * k];
  // arc length along the spine (for stripes)
  const arc = [0]; for (let i = 1; i < S.length; i++) arc.push(arc[i - 1] + Math.hypot(S[i].x - S[i - 1].x, S[i].y - S[i - 1].y));
  const widthAt = q => (q.tag === 'head' ? 0.72 * wfHead : q.tag === 'tail' ? 0.86 * wf : q.tag === 'neck' ? 0.84 * Math.min(wf, 1.1) : wf);
  const ringAt = (i, ox, oy) => {
    const q = S[i], rv = (q.t + q.b) / 2, cx = q.x + q.nx * (q.t - q.b) / 2, cy = q.y + q.ny * (q.t - q.b) / 2, rw = rv * widthAt(q);
    const pts = [], cs = [], pl = pal(q.tag);
    for (let j = 0; j < seg; j++) {
      const th = (j / seg) * TAU, cu = Math.cos(th), sz = Math.sin(th);
      // flatter belly, rounder back
      const vy = cu >= 0 ? cu : cu * 0.92;
      const x2 = cx + q.nx * rv * vy, y2 = cy + q.ny * rv * vy;
      pts.push([(x2 - ox) * k, -(y2 - oy) * k, sz * rw * k]);
      // countershading + stripes + speckle
      const c = pl.side.clone();
      c.lerp(pl.belly, sstep(0.0, -0.75, cu) * 0.85);
      c.lerp(pl.back, sstep(0.25, 0.95, cu) * 0.7);
      if (q.tag !== 'head' && cu > 0.1 && ((arc[i] / 11) % 1) < 0.38) c.lerp(pl.stripe, 0.5 * sstep(0.1, 0.7, cu));
      if (!o.flat) c.multiplyScalar(0.94 + hash3(i, j, 1) * 0.12);
      cs.push(c);
    }
    return [pts, cs];
  };
  const tube = (i0, i1, ox, oy, capS, capE) => {
    const rings = [], cols = [];
    for (let i = i0; i <= i1; i++) { const [p, c] = ringAt(i, ox, oy); rings.push(p); cols.push(c); }
    return ringGeometry(rings, cols, capS, capE);
  };
  const R = M.ranges, hipY = M.hipY;
  const root = new THREE.Group(), body = new THREE.Group(); body.name = 'body'; root.add(body);
  const mesh = (g, mat = DMAT) => { const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = false; return m; };
  // torso, tail and neck+head as separate pieces that overlap at the joints
  const torso = mesh(tube(Math.max(0, R.body[0] - 6), Math.min(S.length - 1, R.body[1] + 5), 0, 0, 0.5, 0.5));
  body.add(torso);
  const tailPivot = new THREE.Group(); tailPivot.name = 'tail'; tailPivot.position.set(...P3(0, hipY)); body.add(tailPivot);
  tailPivot.add(mesh(tube(0, Math.min(S.length - 1, R.tail[1] + 5), 0, hipY, 1, 0.5)));
  const nb = M.nb, neckPivot = new THREE.Group(); neckPivot.name = 'neck'; neckPivot.position.set(...P3(nb.x, nb.y)); body.add(neckPivot);
  neckPivot.add(mesh(tube(Math.max(0, R.neck[0] - 5), S.length - 1, nb.x, nb.y, 0.5, 0.9)));
  const toPivot = (tag, x, y) => tag === 'tail' ? [tailPivot, x, y - hipY] : (tag === 'neck' || tag === 'head') ? [neckPivot, x - nb.x, y - nb.y] : [body, x, y];
  const put = (obj, tag, x, y, z = 0) => { const [g, lx, ly] = toPivot(tag, x, y); obj.position.set(lx * k, -ly * k, z * k); g.add(obj); return obj; };
  // legs: upper segment pivots at the hip/shoulder, lower segment at the knee
  const legs = [];
  const B = M.B;
  const legColor = (p, f) => { const c = lc(p.side).lerp(lc(p.back), f); return c; };
  const makeLeg = (pts, ax, ay, side, kind, phase) => {
    const ctrl = pts.map(p => ({ x: ax + p[0], y: ay + p[1], t: p[2], b: p[2] }));
    const LS = crSpline(ctrl, 1.5); normals(LS, 2);
    let kneeI = 0, best = 1e9; LS.forEach((q, i) => { const d = Math.hypot(q.x - ctrl[1].x, q.y - ctrl[1].y); if (d < best) { best = d; kneeI = i; } });
    const zSide = side * (kind === 'arm' ? 0.85 : kind === 'front' ? 0.44 : 0.4) * (() => { let nq = S[0]; for (const q of S) if (Math.abs(q.x - ctrl[0].x) < Math.abs(nq.x - ctrl[0].x)) nq = q; return (nq.t + nq.b) / 2 * widthAt(nq); })();
    const segN = 10, pl = M.partPal.body, top = ctrl[0].y, bot = ctrl[ctrl.length - 1].y;
    const legTube = (a, b, ox, oy, capE) => {
      const rings = [], cols = [];
      for (let i = a; i <= b; i++) {
        const q = LS[i], ring = [], cr = [];
        const f = clamp((q.y - top) / Math.max(1, bot - top), 0, 1), tr = q.t * (kind === 'arm' ? 1 : lerp(0.78, 1, sstep(0, 0.35, f)));
        for (let j = 0; j < segN; j++) { const th = (j / segN) * TAU; ring.push([(q.x + q.nx * tr * Math.cos(th) - ox) * k, -(q.y + q.ny * tr * Math.cos(th) - oy) * k, tr * Math.sin(th) * k * 0.72]);
          const c = legColor(pl, f * 0.6); c.multiplyScalar((side > 0 ? 1 : 0.8) * (0.95 + hash3(i, j, 7) * 0.1)); cr.push(c); }
        rings.push(ring); cols.push(cr);
      }
      return ringGeometry(rings, cols, a === 0 ? 0.6 : 0.35, capE ? 0.9 : 0.35);
    };
    const hip = new THREE.Group(); hip.position.set(ctrl[0].x * k, -ctrl[0].y * k, zSide * k); body.add(hip);
    hip.add(mesh(legTube(0, kneeI + 1, ctrl[0].x, ctrl[0].y, false)));
    const knee = new THREE.Group(); knee.position.set((ctrl[1].x - ctrl[0].x) * k, -(ctrl[1].y - ctrl[0].y) * k, 0); hip.add(knee);
    knee.add(mesh(legTube(Math.max(0, kneeI - 1), LS.length - 1, ctrl[1].x, ctrl[1].y, true)));
    // feet
    const e = ctrl[ctrl.length - 1], fx = (e.x - ctrl[1].x) * k, fy = -(e.y - ctrl[1].y) * k;
    if (kind !== 'arm') {
      if (ctrl.length >= 5) { for (const zz of [-0.5, 0, 0.5]) { const toe = new THREE.Mesh(new THREE.ConeGeometry(e.t * 0.5 * k, e.t * 2.4 * k, 6), DMAT_DARK()); toe.rotation.z = -Math.PI / 2 + 0.25; toe.position.set(fx + e.t * 1.2 * k, fy - e.t * 0.4 * k, zz * e.t * k * 1.4); toe.castShadow = true; knee.add(toe); } }
      else { const pad = new THREE.Mesh(new THREE.SphereGeometry(e.t * k, 10, 6), DMAT_DARK('#5a4a3a')); pad.scale.set(1.25, 0.45, 1.15); pad.position.set(fx, fy - e.t * 0.55 * k, 0); pad.castShadow = true; knee.add(pad); }
    }
    hip.name = 'hip' + legs.length; knee.name = 'knee' + legs.length; legs.push({ hip, knee, side, kind, phase });
  };
  const hipA = [B.hindAt?.[0] || 0, hipY + (B.hindAt?.[1] || 0)];
  makeLeg(B.hind, hipA[0], hipA[1], 1, 'hind', 0); makeLeg(B.hind, hipA[0], hipA[1], -1, 'hind', Math.PI);
  if (B.front) { const f = [B.frontAt[0], hipY + B.frontAt[1]]; makeLeg(B.front, f[0], f[1], 1, 'front', Math.PI); makeLeg(B.front, f[0], f[1], -1, 'front', 0); }
  if (B.arm) { const a = [B.armAt[0], hipY + B.armAt[1]]; makeLeg(B.arm, a[0], a[1], 1, 'arm', 0); makeLeg(B.arm, a[0], a[1], -1, 'arm', Math.PI); }
  // plates
  const plateMat = new THREE.MeshStandardMaterial({ color: lc(M.partPal.body.plate || M.partPal.body.side), roughness: 0.7, side: THREE.DoubleSide });
  const plateTip = new THREE.MeshStandardMaterial({ color: lc(M.partPal.body.plate2 || M.partPal.body.belly), roughness: 0.7, side: THREE.DoubleSide });
  for (const st of plateStations(M)) {
    const q = st.q, h = st.h * (st.row ? 0.92 : 1), w = h * 0.62;
    const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.quadraticCurveTo(-w * 0.45, h * 0.75, -h * 0.22, h); sh.quadraticCurveTo(w * 0.5, h * 0.55, w / 2, 0); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 1.6, bevelEnabled: false }); g.translate(0, 0, -0.8); g.scale(k, k, k);
    const m = new THREE.Mesh(g, st.row ? plateMat : plateTip); m.castShadow = true;
    const tp = topPt(q, 0.7), ang = Math.atan2(-q.ny, q.nx) - Math.PI / 2;
    const [grp, lx, ly] = toPivot(q.tag, tp[0], tp[1]);
    m.position.set(lx * k, -ly * k, (st.row ? -1 : 1) * (q.t + q.b) * 0.08 * k); m.rotation.z = -ang; m.rotation.x = (st.row ? -1 : 1) * 0.12; grp.add(m);
  }
  // tail spikes, horns, club, crest, dome, frill, armour, sail
  const bone = smat('#e8dcbc', { r: 0.55 });
  const cone = (r, h, mat = bone) => { const g = new THREE.ConeGeometry(r * k, h * k, 8); g.translate(0, h * k / 2, 0); const m = new THREE.Mesh(g, mat); m.castShadow = true; return m; };
  if (M.T.spikes) { const [a, b] = R.tail; for (let n = 0; n < M.T.spikes.n; n++) { const q = S[Math.round(a + (b - a) * (0.06 + n * 0.045))], tp = topPt(q, 0.5), m = cone(3.2, M.T.spikes.len);
    const ang = Math.atan2(-q.ny, q.nx) - (n % 2 ? 0.95 : 0.6); put(m, 'tail', tp[0], tp[1], (n % 2 ? -1 : 1) * 3); m.rotation.z = ang - Math.PI / 2; m.rotation.x = (n % 2 ? -1 : 1) * 0.55; } }
  const hb = M.hb, Hd = M.Hd, HP = M.partPal.head;
  if (Hd.horns) for (const [hx, hy, ang, len, wd] of Hd.horns) { const pairs = len > 25 ? [-1, 1] : [0]; for (const s_ of pairs) { const m = cone(wd * 0.5, len); put(m, 'head', hb.x + hx, hb.y + hy, s_ * 7); m.rotation.z = -ang - Math.PI / 2; m.rotation.x = s_ * 0.18; } }
  if (Hd.frill) { const f = Hd.frill, g = new THREE.SphereGeometry(1, 20, 12); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: lc(HP.frill || HP.side), roughness: 0.7 })); m.castShadow = true;
    m.scale.set(f.rx * 0.35 * k, f.ry * k, f.ry * 1.05 * k); put(m, 'head', hb.x + f.cx, hb.y + f.cy); m.rotation.z = -f.rot - 0.25;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 28), new THREE.MeshStandardMaterial({ color: lc(HP.frill2 || HP.belly), roughness: 0.6 })); rim.scale.set(f.ry * k, f.ry * k, f.ry * 1.05 * k); rim.rotation.y = Math.PI / 2; m.add(rim); rim.scale.set(1, 1, 1); }
  if (Hd.crest) { const [[ax_, ay_], [bx, by], r_] = Hd.crest; const p0 = new THREE.Vector3(...P3(hb.x + ax_ - nb.x, hb.y + ay_ - nb.y)), p1 = new THREE.Vector3(...P3(hb.x + bx - nb.x, hb.y + by - nb.y));
    const curve = new THREE.QuadraticBezierCurve3(p0, p0.clone().lerp(p1, 0.5).add(new THREE.Vector3(0, 3 * k, 0)), p1);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, r_ * k, 8, false), new THREE.MeshStandardMaterial({ color: lc(HP.crest || HP.side), roughness: 0.6 })); m.castShadow = true; neckPivot.add(m);
    const capm = new THREE.Mesh(new THREE.SphereGeometry(r_ * k, 8, 6), m.material); capm.position.copy(p1); neckPivot.add(capm); }
  if (Hd.dome) { const [dx, dy, rx, ry] = Hd.dome; const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), new THREE.MeshStandardMaterial({ color: lc(HP.dome || HP.side), roughness: 0.6 })); m.scale.set(rx * k, ry * k, rx * 0.9 * k); put(m, 'head', hb.x + dx, hb.y + dy); m.castShadow = true; }
  if (M.T.club) { const q = S[R.tail[0] + 2], m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), bone); m.scale.set(M.T.club.rx * k, M.T.club.ry * k, M.T.club.rx * 0.9 * k); put(m, 'tail', q.x + 4, q.y); m.castShadow = true; }
  if (B.armor) { const [a, b] = R.body; for (let i = R.tail[0] + 30; i < b; i += 7) { const q = S[i]; for (const zs of [-1, 1]) { const m = cone(2.4, 6, bone); const tp = topPt(q, 0.72); put(m, q.tag, tp[0], tp[1], zs * (q.t + q.b) * 0.3 * widthAt(q)); m.rotation.x = zs * 0.7; }
    if (q.tag === 'body' && i % 14 < 7) for (const zs of [-1, 1]) { const m = cone(3, 12, bone); put(m, 'body', q.x, q.y + q.b * 0.25, zs * (q.t + q.b) * 0.5 * widthAt(q)); m.rotation.x = zs * 1.6; } } }
  if (B.sail) { const [a, b] = R.body, sh = new THREE.Shape(); const pts = [];
    for (let i = a; i <= b; i += 2) { const q = S[i], u = (i - a) / Math.max(1, b - a), hh = B.sail.h * Math.pow(Math.sin(Math.PI * clamp(u * 1.05, 0, 1)), 0.75), tp = topPt(q, 0.6); pts.push([tp[0], tp[1], tp[0] - q.dx * hh * 0.08 + q.nx * hh, tp[1] + q.ny * hh]); }
    sh.moveTo(pts[0][0], -pts[0][1]); pts.forEach(p => sh.lineTo(p[2], -p[3])); for (let i = pts.length - 1; i >= 0; i--) sh.lineTo(pts[i][0], -pts[i][1]);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false }); g.translate(0, 0, -0.6); g.scale(k, k, k);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: lc(M.partPal.body.sail || M.partPal.body.side), roughness: 0.7, side: THREE.DoubleSide })); m.castShadow = true; body.add(m); }
  // eyes (and teeth for meat-eaters)
  const hs = (Hd.pts[1][2] + Hd.pts[1][3]) / 30, HR = M.headRot || 0;
  const eyeQ = (() => { let best = S[R.head[0]]; const ex = hb.x + Hd.eye[0]; for (let i = R.head[0]; i <= R.head[1]; i++) if (Math.abs(S[i].x - ex) < Math.abs(best.x - ex)) best = S[i]; return best; })();
  const eyeZ = (eyeQ.t + eyeQ.b) / 2 * widthAt(eyeQ) * 0.82;
  const eyeMat = Hd.mouth === 'teeth' ? new THREE.MeshStandardMaterial({ color: lc('#d89a2a'), emissive: lc('#3a2200'), roughness: 0.3 }) : EYE_MAT;
  if (o.eyes === 'cartoon') {
    const white = new THREE.MeshStandardMaterial({ color: lc('#fbf6ec') }), brow = new THREE.MeshStandardMaterial({ color: lc(mix(HP.back || HP.side, '#000000', 0.25)) });
    for (const zs of [-1, 1]) {
      const e = put(new THREE.Mesh(new THREE.SphereGeometry(3.2 * hs * k, 14, 10), white), 'head', hb.x + Hd.eye[0], hb.y + Hd.eye[1] - 0.5, zs * eyeZ * 0.92);
      const pu = new THREE.Mesh(new THREE.SphereGeometry(1.8 * hs * k, 10, 8), EYE_MAT); pu.position.copy(e.position).add(new THREE.Vector3(1.0 * hs * k, -0.2 * hs * k, zs * 2.0 * hs * k)); e.parent.add(pu);
      const gl = new THREE.Mesh(new THREE.SphereGeometry(0.7 * hs * k, 8, 6), GLINT_MAT); gl.position.copy(pu.position).add(new THREE.Vector3(0.6 * hs * k, 0.7 * hs * k, zs * 1.2 * hs * k)); e.parent.add(gl);
      e.userData.voxPrio = 1; pu.userData.voxPrio = 2; gl.userData.voxPrio = 3; e.userData.noShadow = pu.userData.noShadow = gl.userData.noShadow = true;
      if (Hd.mouth === 'teeth') { const b = new THREE.Mesh(new THREE.BoxGeometry(6.6 * hs * k, 1.5 * hs * k, 2.6 * hs * k), brow); b.position.copy(e.position).add(new THREE.Vector3(0.2 * hs * k, 3.0 * hs * k, zs * 0.6 * hs * k)); b.rotation.z = -0.36; e.parent.add(b); b.userData.voxPrio = 2; }
    }
  } else
  for (const zs of [-1, 1]) { // white, pupil and glint sit side by side on the head so both eyes merge into three meshes
    const e = put(new THREE.Mesh(new THREE.SphereGeometry(2.4 * hs * k, 10, 8), eyeMat), 'head', hb.x + Hd.eye[0], hb.y + Hd.eye[1], zs * eyeZ);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(1.3 * hs * k, 8, 6), EYE_MAT); pu.position.copy(e.position).add(new THREE.Vector3(0.4 * hs * k, 0, zs * 1.4 * hs * k)); pu.scale.set(0.5, 1, 1); e.parent.add(pu);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(0.55 * hs * k, 6, 4), GLINT_MAT); gl.position.copy(e.position).add(new THREE.Vector3(0.9 * hs * k, 0.9 * hs * k, zs * 1.9 * hs * k)); e.parent.add(gl);
    e.userData.noShadow = pu.userData.noShadow = gl.userData.noShadow = true;
  }
  if (Hd.mouth === 'teeth') {
    const [ha, hz] = R.head;
    for (let i = ha + Math.round((hz - ha) * 0.25); i < hz - 1; i += 2) { const q = S[i], my = q.y + q.b * 0.55, w = (q.t + q.b) / 2 * widthAt(q) * 0.8;
      for (const zs of [-1, 1]) { const tth = new THREE.Mesh(new THREE.ConeGeometry(0.9 * hs * k, 3 * hs * k, 5), TOOTH_MAT); put(tth, 'head', q.x, my, zs * w); tth.rotation.z = Math.PI; tth.userData.voxPrio = 1; } }
  }
  // markers for gameplay: snout tip and body centre
  const sn = S[S.length - 1], snout = new THREE.Object3D(); snout.name = 'snout'; put(snout, 'head', sn.x + sn.dx * 3, sn.y);
  const bodyC = new THREE.Object3D(); bodyC.name = 'bodyC'; const bc = S[Math.round((R.body[0] + R.body[1]) / 2)]; bodyC.position.set(bc.x * k, -bc.y * k, 0); body.add(bodyC);
  if (!o.noMerge) mergeStatic(root);
  root.traverse(o => { if (o.isMesh) { o.castShadow = !o.userData.noShadow; o.geometry.userData.shared = true; } });
  // eating pose: how far the neck must bend to bring the snout near the ground
  const snoutRel = new THREE.Vector2((sn.x - nb.x) * k, -(sn.y - nb.y) * k), pivotH = -nb.y * k;
  let eatAngle = 0; for (let a = 0; a <= 1.6; a += 0.02) { const y = pivotH + snoutRel.x * Math.sin(-a) + snoutRel.y * Math.cos(-a); eatAngle = a; if (y < 0.35 + 0.05 * (SIZE[sel.body] || 1)) break; }
  const meat = ['trex', 'allo', 'deino', 'coelo', 'spino'].includes(sel.head);
  const D = {
    sel, M, k, root, body, tailPivot, neckPivot, legs, snout, bodyC, meat, eatAngle,
    length: (S[S.length - 1].x - S[0].x) * k, hipH: -hipY * k, bodyR: ((bc.t + bc.b) / 2) * wf * k,
    reach: Math.abs(sn.x) * k, phase: 0, t: Math.random() * 10, eat: 0, attack: 0, dead: 0, look: 0,
  };
  D.update = (dt, speed = 0, state = 'idle') => updateDino(D, dt, speed, state);
  return D;
}
/* fewer draw calls: bake the fixed parts on each joint (plates, spikes, teeth, toes) into one mesh per material */
function mergeStatic(root) {
  const jobs = [];
  root.traverse(par => {
    const groups = {};
    for (const c of par.children) {
      if (!c.isMesh || c.children.length || c.name) continue;
      const key = c.material.uuid + Object.keys(c.geometry.attributes).sort().join() + !!c.userData.noShadow;
      (groups[key] = groups[key] || []).push(c);
    }
    for (const key in groups) if (groups[key].length > 1) jobs.push([par, groups[key]]);
  });
  const v = new THREE.Vector3(), nm = new THREE.Matrix3();
  for (const [par, list] of jobs) {
    const pos = [], nor = [], col = [], uv = [];
    for (const m of list) {
      m.updateMatrix(); nm.getNormalMatrix(m.matrix);
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry, P = g.attributes.position, N = g.attributes.normal, C = g.attributes.color, U = g.attributes.uv;
      const order = m.matrix.determinant() < 0 ? [0, 2, 1] : [0, 1, 2];
      for (let t = 0; t < P.count; t += 3) for (const o of order) {
        const i = t + o; v.fromBufferAttribute(P, i).applyMatrix4(m.matrix); pos.push(v.x, v.y, v.z);
        if (N) { v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z); }
        if (C) col.push(C.getX(i), C.getY(i), C.getZ(i));
        if (U) uv.push(U.getX(i), U.getY(i));
      }
      par.remove(m);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    if (nor.length) g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    if (col.length) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    if (uv.length) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const merged = new THREE.Mesh(g, list[0].material); merged.userData.noShadow = !!list[0].userData.noShadow; par.add(merged);
  }
}
const _darkMats = {};
function DMAT_DARK(c = '#2a2016', mixBack = 0) { const key = c + mixBack; return _darkMats[key] || (_darkMats[key] = rimMaterial({ color: lc(mixBack ? mix(c, '#000000', mixBack) : c), roughness: 0.8 })); }
function smat(c, o = {}) { return new THREE.MeshStandardMaterial({ color: lc(c), roughness: o.r ?? 0.75, metalness: o.m ?? 0, ...(o.extra || {}) }); }

function updateDino(D, dt, speed, state) {
  D.t += dt;
  const stride = Math.max(0.6, D.hipH * 1.25);
  D.phase += (speed * dt / stride) * Math.PI;
  const amp = clamp(speed / (D.hipH * 1.3 + 0.5), 0, 1) * 0.5;
  for (const L of D.legs) {
    if (L.kind === 'arm') { L.hip.rotation.z = 0.15 * Math.sin(D.t * 2 + L.phase); continue; }
    const ph = D.phase + L.phase;
    L.hip.rotation.z = amp * Math.sin(ph);
    L.knee.rotation.z = (L.kind === 'hind' && D.legs.some(l => l.kind === 'arm') ? 1 : -1) * amp * 0.9 * Math.max(0, Math.cos(ph));
  }
  D.body.position.y = amp * 0.06 * D.hipH * Math.abs(Math.sin(D.phase)) - (D.dead ? 0 : 0);
  D.tailPivot.rotation.y = 0.12 * Math.sin(D.phase * 0.5 + 1) * (0.4 + amp) + 0.04 * Math.sin(D.t * 0.9);
  D.tailPivot.rotation.z = 0.03 * Math.sin(D.t * 1.3);
  const eatT = state === 'eat' ? 1 : 0, attT = state === 'attack' ? 1 : 0;
  D.eat += (eatT - D.eat) * Math.min(1, dt * 5);
  D.attack += (attT - D.attack) * Math.min(1, dt * 9);
  const nibble = state === 'eat' ? 0.08 * Math.sin(D.t * 9) : 0;
  const breath = 0.02 * Math.sin(D.t * 1.6);
  D.neckPivot.rotation.z = -D.eat * D.eatAngle + nibble - D.attack * 0.35 + breath + D.look * 0.3;
  D.neckPivot.rotation.y = 0.05 * Math.sin(D.t * 0.7);
  // collapse when dead
  if (D.dead > 0) { D.root.rotation.x = lerp(0, -1.35, sstep(0, 1, D.dead)); }
}

/* voxel colours: brighter, clearer palettes than the painted ones */
const VOX_PAL = {
  trex: { side: '#d8603e', back: '#93361f', belly: '#f6d6a2', stripe: '#86301c' }, stego: { side: '#6eb85a', back: '#2f7a4c', belly: '#efe2a2', stripe: '#2c6a40', plate: '#f08a3d', plate2: '#ffc25a' },
  bronto: { side: '#7f92de', back: '#4856a8', belly: '#dde2fb', stripe: '#424fa0' }, trike: { side: '#5aa8d6', back: '#2c5f8a', belly: '#e6f2fc', stripe: '#2c5f8a', frill: '#f07a5a', frill2: '#ffd05a' },
  allo: { side: '#e39a40', back: '#9a5422', belly: '#fbe0ae', stripe: '#8a4618' }, coelo: { side: '#9acf4e', back: '#4f8a26', belly: '#eef4c0', stripe: '#3f7a1e' },
  para: { side: '#eec450', back: '#c0782a', belly: '#fbf0c8', stripe: '#b2621e', crest: '#e2503c' }, anky: { side: '#b88e5c', back: '#704a2a', belly: '#eedab4', stripe: '#5a3a1e' },
  diplo: { side: '#8cc5a6', back: '#3e8a6a', belly: '#e8fbee', stripe: '#3a7a5a' }, iguano: { side: '#7fbe68', back: '#3f803a', belly: '#eeeec0', stripe: '#366e30' },
  deino: { side: '#5a78d6', back: '#2a408a', belly: '#dee6fb', stripe: '#24367a' }, pachy: { side: '#c48ad6', back: '#7a4a8e', belly: '#f4e2fb', stripe: '#6a3a7e', dome: '#f8ae7a' },
  brachio: { side: '#a0c66a', back: '#5a8a3a', belly: '#f0f4d6', stripe: '#4f7a30' }, spino: { side: '#4eae9e', back: '#206a64', belly: '#e6fbf2', stripe: '#1a5a54', sail: '#f06a4a', sail2: '#ffbe4a' },
  proto: { side: '#e6b660', back: '#a8742a', belly: '#fbf0d0', stripe: '#946426', frill: '#f08a5a', frill2: '#ffd07a' }, cory: { side: '#6aaedc', back: '#2f6aa0', belly: '#e8f4fb', stripe: '#2a5a8a', dome: '#f06a5a', crest: '#f06a5a' },
  galli: { side: '#e4cc70', back: '#a88a30', belly: '#fbf6d6', stripe: '#987a26' }, edmonto: { side: '#78b6c6', back: '#3a7a8a', belly: '#ecf8fb', stripe: '#336a7a' },
};
/* a dinosaur made of small cubes: the smooth rig is built, then turned into voxels joint by joint */
function dinoModel(sel, o = {}) {
  const body = typeof sel === 'string' ? sel : sel.body, size = o.size ?? SIZE[body] ?? 1;
  const D = build3D(sel, { ...o, eyes: 'cartoon', pal: VOX_PAL, noMerge: true, flat: true });
  voxelize(D.root, 0.058 + 0.03 * size);
  D.root.traverse(ob => { if (ob.isMesh) ob.geometry.userData.shared = true; });
  return D;
}
/* cheap copies: share geometry and materials, re-find the joints by name */
const _protos = {};
function dinoProto(sel) { const key = typeof sel === 'string' ? sel : JSON.stringify(sel); return _protos[key] || (_protos[key] = dinoModel(sel)); }
function dinoInstance(sel) {
  const P = dinoProto(sel);
  const root = P.root.clone(true), D = { ...P, root };
  D.body = root.getObjectByName('body'); D.tailPivot = root.getObjectByName('tail'); D.neckPivot = root.getObjectByName('neck');
  D.snout = root.getObjectByName('snout'); D.bodyC = root.getObjectByName('bodyC');
  D.legs = P.legs.map((L, i) => ({ ...L, hip: root.getObjectByName('hip' + i), knee: root.getObjectByName('knee' + i) }));
  D.phase = Math.random() * 6; D.t = Math.random() * 10; D.eat = 0; D.attack = 0; D.dead = 0; D.look = 0;
  D.update = (dt, speed = 0, state = 'idle') => updateDino(D, dt, speed, state);
  return D;
}
