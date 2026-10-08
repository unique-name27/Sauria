/* ===== Sauria concept renderer: core ===== */
const W = 1600, H = 900, TAU = Math.PI * 2;
const F = {
  disp: '"Unbounded", "Arial Black", Impact, sans-serif',
  body: '"Instrument Sans", "Helvetica Neue", Arial, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace',
};
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function noise1(seed) {
  const r = rng(seed), v = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) v[i] = r();
  return x => {
    const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f);
    return lerp(v[i & 1023], v[(i + 1) & 1023], t);
  };
}
function fbm(n, x, oct = 5) {
  let s = 0, a = 1, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) { s += a * n(x * f + i * 31.7); norm += a; a *= 0.5; f *= 2; }
  return s / norm;
}
function noise2(seed) {
  const r = rng(seed), N = 256, v = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) v[i] = r();
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
    const i0 = xi & 255, j0 = yi & 255, i1 = (i0 + 1) & 255, j1 = (j0 + 1) & 255;
    return lerp(lerp(v[j0 * N + i0], v[j0 * N + i1], u), lerp(v[j1 * N + i0], v[j1 * N + i1], u), w);
  };
}
function fbm2(n, x, y, oct = 5) {
  let s = 0, a = 1, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) { s += a * n(x * f + i * 17.3, y * f + i * 9.1); norm += a; a *= 0.5; f *= 2; }
  return s / norm;
}

/* ---- color ---- */
function hex(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(h, a = 1) { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; }
function mix(h1, h2, t) {
  const a = hex(h1), b = hex(h2);
  return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('');
}
const shade = (h, t) => (t < 0 ? mix(h, '#000000', -t) : mix(h, '#ffffff', t));

/* ---- canvas helpers ---- */
function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return [c, c.getContext('2d')];
}
function lin(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}
function rad(ctx, x, y, r0, r1, stops) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
function layer(fn, w = W, h = H) { const [c, x] = mk(w, h); fn(x); return c; }
function blurred(src, f) {
  const sizes = [];
  let c = src, w = src.width, h = src.height;
  while (f >= 2) {
    w = Math.max(1, Math.round(w / 2)); h = Math.max(1, Math.round(h / 2));
    const [d, dx] = mk(w, h); dx.imageSmoothingQuality = 'high'; dx.drawImage(c, 0, 0, w, h);
    c = d; f /= 2; sizes.push([w, h]);
  }
  for (let i = sizes.length - 2; i >= -1; i--) {
    const [tw, th] = i >= 0 ? sizes[i] : [src.width, src.height];
    const [d, dx] = mk(tw, th); dx.imageSmoothingQuality = 'high'; dx.drawImage(c, 0, 0, tw, th); c = d;
  }
  return c;
}

/* ---- atmosphere ---- */
function fillSky(ctx, stops) { ctx.fillStyle = lin(ctx, 0, 0, 0, H, stops); ctx.fillRect(0, 0, W, H); }
function glow(ctx, x, y, r, color, a = 1, op = 'lighter') {
  ctx.save(); ctx.globalCompositeOperation = op; ctx.globalAlpha = a;
  ctx.fillStyle = rad(ctx, x, y, 0, r, [[0, rgba(color, 1)], [0.35, rgba(color, 0.35)], [1, rgba(color, 0)]]);
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
}
function haze(ctx, y0, y1, color, a0 = 0, a1 = 0.6) {
  ctx.fillStyle = lin(ctx, 0, y0, 0, y1, [[0, rgba(color, a0)], [1, rgba(color, a1)]]);
  ctx.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0));
}
function ridge(ctx, o) {
  const n = noise1(o.seed || 1), f = o.freq || 0.004, oct = o.oct || 5, sharp = o.sharp || 0;
  const yAt = x => {
    let v = fbm(n, x * f, oct);
    v = clamp((v - 0.2) / 0.6, 0, 1);
    if (sharp) v = lerp(v, 1 - Math.abs(v * 2 - 1), sharp);
    return o.base - v * o.amp * (o.env ? o.env(x) : 1);
  };
  ctx.beginPath(); ctx.moveTo(-10, o.bottom ?? H + 10);
  for (let x = -10; x <= W + 10; x += o.step || 4) ctx.lineTo(x, yAt(x));
  ctx.lineTo(W + 10, o.bottom ?? H + 10); ctx.closePath();
  ctx.fillStyle = o.fill; ctx.fill();
  if (o.rim) { // lit crest line
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = o.rim; ctx.lineWidth = o.rimW || 2;
    ctx.beginPath(); for (let x = -10; x <= W + 10; x += o.step || 4) { x < 0 ? ctx.moveTo(x, yAt(x)) : ctx.lineTo(x, yAt(x)); }
    ctx.stroke(); ctx.restore();
  }
  return yAt;
}
function rays(ctx, sx, sy, color, n, seed, o = {}) {
  const r = rng(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = (o.dir ?? Math.PI / 2) + (r() - 0.5) * (o.spread ?? 1.2);
    const w = (o.w ?? 0.03) * (0.4 + r());
    const L = (o.len ?? 1400) * (0.6 + r() * 0.4);
    ctx.fillStyle = lin(ctx, sx, sy, sx + Math.cos(a) * L, sy + Math.sin(a) * L,
      [[0, rgba(color, (o.a ?? 0.12) * (0.3 + r() * 0.7))], [1, rgba(color, 0)]]);
    ctx.beginPath(); ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(a - w) * L, sy + Math.sin(a - w) * L);
    ctx.lineTo(sx + Math.cos(a + w) * L, sy + Math.sin(a + w) * L);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function motes(ctx, seed, n, x0, y0, x1, y1, color, rmin, rmax, a = 1, blur = 0) {
  const r = rng(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = color;
  if (blur) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = a * (0.25 + 0.75 * r());
    ctx.beginPath(); ctx.arc(lerp(x0, x1, r()), lerp(y0, y1, r()), lerp(rmin, rmax, r() * r()), 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function bokeh(ctx, seed, n, x0, y0, x1, y1, color, rmin, rmax, a = 0.12) {
  const r = rng(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, r()), y = lerp(y0, y1, r()), rr_ = lerp(rmin, rmax, r());
    ctx.fillStyle = rad(ctx, x, y, 0, rr_, [[0, rgba(color, a * (0.5 + r()))], [0.8, rgba(color, a * 0.6)], [1, rgba(color, 0)]]);
    ctx.beginPath(); ctx.arc(x, y, rr_, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function vignette(ctx, a = 0.55, color = '#000000', inner = 0.38) {
  ctx.fillStyle = rad(ctx, W / 2, H * 0.52, H * inner, W * 0.72, [[0, rgba(color, 0)], [1, rgba(color, a)]]);
  ctx.fillRect(0, 0, W, H);
}
let _grain;
function grain(ctx, a = 0.05) {
  if (!_grain) {
    const [c, x] = mk(256, 256), id = x.createImageData(256, 256), r = rng(7);
    for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    x.putImageData(id, 0, 0); _grain = c;
  }
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(_grain, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
}
function grade(ctx, top, bottom, a = 0.25, op = 'soft-light') {
  ctx.save(); ctx.globalCompositeOperation = op; ctx.globalAlpha = a;
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, top], [1, bottom]]); ctx.fillRect(0, 0, W, H); ctx.restore();
}
function smoke(ctx, seed, x, y, h, w, color, lit, a = 0.5) {
  const r = rng(seed);
  ctx.save();
  for (let i = 0; i < 70; i++) {
    const t = i / 70, py = y - t * h, px = x + Math.sin(t * 3 + r()) * w * 0.25 * t + t * t * w * 0.9;
    const rad_ = (12 + t * w * 0.55) * (0.6 + r() * 0.6);
    ctx.globalAlpha = a * Math.pow(1 - t, 0.7) * 0.6;
    ctx.fillStyle = rad(ctx, px, py, 0, rad_, [[0, rgba(mix(lit, color, Math.min(1, t * 2.5)), 0.9)], [1, rgba(color, 0)]]);
    ctx.beginPath(); ctx.arc(px, py, rad_, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* ---- vegetation ---- */
function frond(path, x, y, len, ang, droop, lw, seg = 14, leafAng = 0.95) {
  const step = len / seg; let a = ang, px = x, py = y; const pts = [[px, py]];
  for (let i = 0; i < seg; i++) {
    px += Math.cos(a) * step; py += Math.sin(a) * step;
    a += droop * (Math.cos(a) >= 0 ? 1 : -1) * (i / seg) * 2;
    pts.push([px, py]);
    const k = 1 - i / seg, L = lw * Math.pow(k, 0.55) * (i < 1 ? 0.6 : 1);
    if (L < 0.7) continue;
    for (const side of [-1, 1]) {
      const la = a + side * leafAng;
      const tx = px + Math.cos(la) * L, ty = py + Math.sin(la) * L;
      const wx = -Math.sin(la) * L * 0.16, wy = Math.cos(la) * L * 0.16;
      path.moveTo(px, py);
      path.quadraticCurveTo((px + tx) / 2 + wx, (py + ty) / 2 + wy, tx, ty);
      path.quadraticCurveTo((px + tx) / 2 - wx, (py + ty) / 2 - wy, px, py);
    }
  }
  return pts;
}
function fern(ctx, x, y, s, color, seed, o = {}) {
  const r = rng(seed), n = o.n || 6 + Math.floor(r() * 4);
  const p = new Path2D(), stalks = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const ang = (o.dir ?? -Math.PI / 2) + (t - 0.5) * (o.spread || 2.6) + (r() - 0.5) * 0.25;
    const len = s * (0.7 + r() * 0.45) * (1 - Math.abs(t - 0.5) * 0.45);
    stalks.push(frond(p, x, y, len, ang, o.droop ?? 0.06, s * 0.15 * (o.leaf || 1), o.seg || 14));
  }
  ctx.fillStyle = color; ctx.fill(p);
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, s * 0.014); ctx.lineCap = 'round';
  ctx.beginPath();
  for (const st of stalks) { ctx.moveTo(st[0][0], st[0][1]); for (const q of st) ctx.lineTo(q[0], q[1]); }
  ctx.stroke();
}
function cycad(ctx, x, y, s, trunk, leaf, seed) {
  const r = rng(seed), th = s * (0.3 + r() * 0.35), tw = s * 0.12;
  ctx.fillStyle = trunk;
  ctx.beginPath(); ctx.moveTo(x - tw, y); ctx.quadraticCurveTo(x - tw * 1.15, y - th * 0.5, x - tw * 0.75, y - th);
  ctx.lineTo(x + tw * 0.75, y - th); ctx.quadraticCurveTo(x + tw * 1.15, y - th * 0.5, x + tw, y); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = Math.max(1, s * 0.012);
  for (let k = -12; k < 12; k++) {
    ctx.beginPath(); ctx.moveTo(x - tw * 1.3, y - k * tw * 0.5); ctx.lineTo(x + tw * 1.3, y - k * tw * 0.5 - tw * 1.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - tw * 1.3, y - k * tw * 0.5 - tw * 1.3); ctx.lineTo(x + tw * 1.3, y - k * tw * 0.5); ctx.stroke();
  }
  ctx.restore();
  fern(ctx, x, y - th, s * 0.7, leaf, seed + 1, { n: 13, spread: 3.6, droop: 0.035, leaf: 0.65, seg: 12 });
}
function treeFern(ctx, x, y, s, trunk, leaf, seed, lean = 0) {
  const tx = x + lean * s, ty = y - s;
  ctx.fillStyle = trunk; ctx.beginPath();
  const w0 = s * 0.035, w1 = s * 0.022;
  ctx.moveTo(x - w0, y); ctx.quadraticCurveTo(x + lean * s * 0.2 - w0, y - s * 0.6, tx - w1, ty);
  ctx.lineTo(tx + w1, ty); ctx.quadraticCurveTo(x + lean * s * 0.2 + w0, y - s * 0.6, x + w0, y); ctx.closePath(); ctx.fill();
  fern(ctx, tx, ty, s * 0.5, leaf, seed, { n: 10, spread: 4.2, droop: 0.14, leaf: 0.85, seg: 16 });
}
function conifer(ctx, x, y, s, color, seed, o = {}) {
  const r = rng(seed);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = 'round';
  ctx.lineWidth = s * 0.022; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * s * 0.03, y - s); ctx.stroke();
  const tiers = o.tiers || 9, top = o.crown ?? 0.5;
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1), by = y - s * (top + (1 - top) * t);
    const len = s * (o.umbrella ? 0.32 * (0.55 + 0.45 * Math.sin(t * Math.PI * 0.9 + 0.3)) : 0.3 * (1 - t * 0.8));
    for (const side of [-1, 1]) {
      const L = len * (0.75 + r() * 0.5);
      ctx.lineWidth = s * 0.03 * (1 - t * 0.5);
      ctx.beginPath(); ctx.moveTo(x, by);
      ctx.quadraticCurveTo(x + side * L * 0.5, by - L * 0.12, x + side * L, by + L * (o.umbrella ? 0.22 : 0.3));
      ctx.stroke();
      for (let k = 0; k < 4; k++) {
        const u = 0.35 + k * 0.2, cx = x + side * L * u, cy = by + L * 0.12 * u;
        ctx.beginPath(); ctx.ellipse(cx, cy, L * 0.18, s * 0.025, side * 0.15, 0, TAU); ctx.fill();
      }
    }
  }
}
function treeline(ctx, y, h, color, seed, o = {}) {
  const r = rng(seed), n = noise1(seed);
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-10, H + 10);
  let x = -10;
  while (x < W + 20) {
    const k = r(), hh = h * (0.45 + 0.75 * fbm(n, x * 0.006, 3)) * (0.7 + r() * 0.5);
    if (k < (o.spiky ?? 0.6)) { // conifer spire
      const w = hh * (0.18 + r() * 0.12);
      ctx.lineTo(x, y - hh * 0.25); ctx.lineTo(x + w * 0.5, y - hh); ctx.lineTo(x + w, y - hh * 0.25); x += w * 0.8;
    } else { // rounded crown
      const w = hh * (0.5 + r() * 0.4);
      ctx.quadraticCurveTo(x + w * 0.5, y - hh * 1.25, x + w, y - hh * 0.35); x += w * 0.85;
    }
  }
  ctx.lineTo(W + 10, H + 10); ctx.closePath(); ctx.fill();
}
function horsetail(ctx, x, y, h, color, seed) {
  const r = rng(seed), bend = (r() - 0.5) * h * 0.15;
  ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, h * 0.028);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + bend * 0.3, y - h * 0.5, x + bend, y - h); ctx.stroke();
  ctx.lineWidth = Math.max(0.8, h * 0.008);
  for (let i = 2; i < 11; i++) {
    const t = i / 11, px = x + bend * t * t, py = y - h * t, L = h * 0.1 * (1 - t * 0.6);
    ctx.beginPath();
    for (const s of [-1, -0.5, 0.5, 1]) { ctx.moveTo(px, py); ctx.lineTo(px + s * L, py + L * 0.6); }
    ctx.stroke();
  }
}
function broadleaf(ctx, x, y, s, trunk, leaf, light, seed) {
  const r = rng(seed);
  ctx.fillStyle = trunk; ctx.beginPath();
  ctx.moveTo(x - s * 0.04, y); ctx.quadraticCurveTo(x - s * 0.02, y - s * 0.4, x - s * 0.015, y - s * 0.6);
  ctx.lineTo(x + s * 0.015, y - s * 0.6); ctx.quadraticCurveTo(x + s * 0.02, y - s * 0.4, x + s * 0.04, y); ctx.fill();
  const blobs = [];
  for (let i = 0; i < 16; i++) {
    const a = r() * TAU, d = r() * s * 0.22;
    blobs.push([x + Math.cos(a) * d * 1.3, y - s * 0.68 + Math.sin(a) * d * 0.7, s * (0.09 + r() * 0.08)]);
  }
  blobs.sort((a, b) => a[1] - b[1]);
  for (const [bx, by, br] of blobs) {
    ctx.fillStyle = rad(ctx, bx - br * 0.3, by - br * 0.4, br * 0.1, br * 1.1, [[0, light], [1, leaf]]);
    ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill();
  }
}
function rock(ctx, x, y, w, h, c, seed, light = 0.12) {
  const r = rng(seed), pts = [];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = Math.PI + t * Math.PI;
    pts.push([x + Math.cos(a) * w * 0.5 * (0.85 + r() * 0.25), y + Math.sin(a) * h * (0.75 + r() * 0.35)]);
  }
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - w * 0.55, y);
  for (const p of pts) ctx.lineTo(p[0], p[1]);
  ctx.lineTo(x + w * 0.55, y); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = rgba('#ffffff', light);
  ctx.beginPath(); ctx.moveTo(pts[1][0], pts[1][1]);
  for (let i = 1; i < pts.length - 2; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.lineTo(x + w * 0.1, y - h * 0.35); ctx.closePath(); ctx.fill();
  ctx.fillStyle = lin(ctx, 0, y - h, 0, y, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.35)']]); ctx.fillRect(x - w, y - h * 1.2, w * 2, h * 1.3);
  ctx.restore();
}
function pterosaur(ctx, x, y, s, color, flap = 0, flip = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s); ctx.fillStyle = color;
  const up = flap * 14;
  ctx.beginPath();
  ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-30, -8 - up, -62, -2 - up * 1.6); // left wing leading edge
  ctx.quadraticCurveTo(-34, 2 - up * 0.4, -8, 5);
  ctx.lineTo(8, 5); ctx.quadraticCurveTo(34, 2 - up * 0.4, 62, -2 - up * 1.6);
  ctx.quadraticCurveTo(30, -8 - up, 6, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 2, 9, 3.5, 0, 0, TAU); ctx.fill(); // body
  ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(24, -2); ctx.lineTo(8, 3); ctx.fill(); // beak
  ctx.beginPath(); ctx.moveTo(4, -1); ctx.lineTo(-10, -9); ctx.lineTo(1, 1); ctx.fill(); // crest
  ctx.restore();
}

/* ---- UI kit ---- */
function txt(ctx, s, x, y, o = {}) {
  ctx.save();
  ctx.font = o.font || `500 20px ${F.body}`; ctx.fillStyle = o.color || '#ffffff';
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = o.ls || '0px';
  if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = o.sb ?? 12; ctx.shadowOffsetY = o.sy ?? 0; }
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.fillText(s, x, y);
  const w = ctx.measureText(s).width;
  ctx.restore(); return w;
}
function measure(ctx, s, font, ls = '0px') {
  ctx.save(); ctx.font = font; if ('letterSpacing' in ctx) ctx.letterSpacing = ls; const w = ctx.measureText(s).width; ctx.restore(); return w;
}
function glass(ctx, x, y, w, h, r, o = {}) {
  const pad = 24;
  const [c, cx] = mk(w + pad * 2, h + pad * 2);
  cx.drawImage(ctx.canvas, x - pad, y - pad, w + pad * 2, h + pad * 2, 0, 0, w + pad * 2, h + pad * 2);
  const b = blurred(c, o.blur || 16);
  ctx.save();
  if (o.shadow !== false) { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10; rr(ctx, x, y, w, h, r); ctx.fillStyle = 'rgba(0,0,0,.01)'; ctx.fill(); }
  ctx.restore();
  ctx.save(); rr(ctx, x, y, w, h, r); ctx.clip();
  ctx.drawImage(b, x - pad, y - pad);
  ctx.fillStyle = o.tint || 'rgba(14,18,16,.5)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, 'rgba(255,255,255,.07)'], [0.4, 'rgba(255,255,255,0)']]); ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.save(); rr(ctx, x + 0.75, y + 0.75, w - 1.5, h - 1.5, r); ctx.strokeStyle = o.stroke || 'rgba(255,255,255,.16)'; ctx.lineWidth = o.sw || 1.5; ctx.stroke(); ctx.restore();
}
function bar(ctx, x, y, w, h, v, color, o = {}) {
  ctx.save();
  rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = o.track || 'rgba(255,255,255,.12)'; ctx.fill();
  if (v > 0) {
    rr(ctx, x, y, Math.max(h, w * v), h, h / 2);
    ctx.fillStyle = lin(ctx, x, 0, x + w, 0, [[0, shade(color, -0.15)], [1, shade(color, 0.25)]]);
    if (o.glow) { ctx.shadowColor = color; ctx.shadowBlur = 10; }
    ctx.fill();
  }
  if (o.ticks) {
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    for (let i = 1; i < o.ticks; i++) ctx.fillRect(x + (w * i) / o.ticks - 1, y, 2, h);
  }
  ctx.restore();
}
function pips(ctx, x, y, n, v, color, o = {}) {
  const w = o.w || 22, h = o.h || 8, g = o.gap || 5;
  for (let i = 0; i < n; i++) {
    rr(ctx, x + i * (w + g), y, w, h, 2);
    ctx.fillStyle = i < v ? color : 'rgba(255,255,255,.12)'; ctx.fill();
  }
  return n * (w + g) - g;
}
function chip(ctx, x, y, label, o = {}) {
  const font = o.font || `600 15px ${F.body}`, ls = o.ls || '0.5px';
  const tw = measure(ctx, label, font, ls), padX = o.padX ?? 14, h = o.h || 32, w = tw + padX * 2 + (o.iconW || 0);
  const X = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  rr(ctx, X, y, w, h, o.r ?? h / 2);
  ctx.fillStyle = o.bg || 'rgba(255,255,255,.1)'; ctx.fill();
  if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  txt(ctx, label, X + padX + (o.iconW || 0), y + h / 2 + 1, { font, color: o.color || '#fff', base: 'middle', ls });
  return { x: X, w, h };
}
function keycap(ctx, x, y, k, o = {}) {
  const font = `700 ${o.size || 15}px ${F.mono}`, tw = measure(ctx, k, font);
  const h = o.h || 30, w = Math.max(h, tw + 16);
  ctx.save();
  rr(ctx, x, y + 3, w, h, 7); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fill();
  rr(ctx, x, y, w, h, 7); ctx.fillStyle = o.bg || '#f2eadb'; ctx.fill();
  ctx.restore();
  txt(ctx, k, x + w / 2, y + h / 2 + 1, { font, color: o.color || '#1d1912', align: 'center', base: 'middle' });
  return w;
}
function icon(ctx, name, x, y, s, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 24, s / 24);
  ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  switch (name) {
    case 'heart': ctx.moveTo(12, 21); ctx.bezierCurveTo(-4, 11, 4, -1, 12, 6); ctx.bezierCurveTo(20, -1, 28, 11, 12, 21); ctx.fill(); break;
    case 'leaf': ctx.moveTo(4, 20); ctx.bezierCurveTo(2, 8, 10, 3, 21, 3); ctx.bezierCurveTo(21, 14, 15, 21, 4, 20); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(5, 19); ctx.lineTo(16, 8); ctx.stroke(); break;
    case 'drop': ctx.moveTo(12, 2); ctx.bezierCurveTo(16, 9, 20, 12, 20, 15.5); ctx.arc(12, 15.5, 8, 0, Math.PI); ctx.bezierCurveTo(4, 12, 8, 9, 12, 2); ctx.fill(); break;
    case 'bolt': ctx.moveTo(14, 1); ctx.lineTo(4, 14); ctx.lineTo(11, 14); ctx.lineTo(9, 23); ctx.lineTo(20, 9); ctx.lineTo(13, 9); ctx.closePath(); ctx.fill(); break;
    case 'meat': ctx.ellipse(13, 10, 8, 6.5, -0.6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(8, 14); ctx.lineTo(3, 20); ctx.lineWidth = 3.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(2.5, 21, 2.2, 0, TAU); ctx.fill(); break;
    case 'nest': ctx.ellipse(12, 16, 9, 4.5, 0, 0, Math.PI); ctx.fill(); ctx.beginPath(); ctx.ellipse(8.5, 12, 3, 4, -0.2, 0, TAU); ctx.ellipse(15.5, 12, 3, 4, 0.2, 0, TAU); ctx.fill(); break;
    case 'skull': ctx.arc(12, 10, 8, Math.PI, 0); ctx.lineTo(20, 14); ctx.lineTo(16, 16); ctx.lineTo(16, 20); ctx.lineTo(8, 20); ctx.lineTo(8, 16); ctx.lineTo(4, 14); ctx.closePath();
      ctx.moveTo(10.9, 11); ctx.arc(8.5, 11, 2.4, 0, TAU); ctx.moveTo(17.9, 11); ctx.arc(15.5, 11, 2.4, 0, TAU); ctx.fill('evenodd'); break;
    case 'flame': ctx.moveTo(12, 1); ctx.bezierCurveTo(20, 9, 20, 14, 18, 18); ctx.bezierCurveTo(16, 22, 8, 22, 6, 18); ctx.bezierCurveTo(4, 13, 8, 11, 9, 7); ctx.bezierCurveTo(11, 10, 12, 10, 12, 1); ctx.fill(); break;
    case 'tar': ctx.ellipse(12, 16, 10, 5, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(9, 9, 2.2, 0, TAU); ctx.arc(15, 6, 1.6, 0, TAU); ctx.fill(); break;
    case 'eye': ctx.moveTo(1, 12); ctx.quadraticCurveTo(12, 1, 23, 12); ctx.quadraticCurveTo(12, 23, 1, 12); ctx.stroke(); ctx.beginPath(); ctx.arc(12, 12, 4, 0, TAU); ctx.fill(); break;
    case 'foot': ctx.ellipse(12, 16, 3.5, 4.5, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(12, 12); ctx.lineTo(12, 3); ctx.moveTo(11, 13); ctx.lineTo(5, 5); ctx.moveTo(13, 13); ctx.lineTo(19, 5); ctx.stroke(); break;
    case 'bone': ctx.lineWidth = 4.5; ctx.moveTo(6, 18); ctx.lineTo(18, 6); ctx.stroke();
      for (const [a, b] of [[4, 17], [7, 20], [17, 4], [20, 7]]) { ctx.beginPath(); ctx.arc(a, b, 3, 0, TAU); ctx.fill(); } break;
    case 'print': ctx.fillRect(6, 2, 12, 5); rr(ctx, 2, 8, 20, 9, 2.5); ctx.fill(); ctx.fillRect(6, 13, 12, 9); break;
    case 'dna': ctx.lineWidth = 2; for (let i = 0; i < 2; i++) { ctx.beginPath(); for (let t = 0; t <= 1.001; t += 0.05) { const yy = 2 + t * 20, xx = 12 + Math.sin(t * TAU + i * Math.PI) * 7; t === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); } ctx.stroke(); }
      for (let t = 0.1; t < 1; t += 0.2) { const yy = 2 + t * 20; ctx.beginPath(); ctx.moveTo(12 + Math.sin(t * TAU) * 7, yy); ctx.lineTo(12 - Math.sin(t * TAU) * 7, yy); ctx.stroke(); } break;
    case 'walk': ctx.ellipse(8, 17, 3, 4, 0.2, 0, TAU); ctx.ellipse(16, 8, 3, 4, 0.2, 0, TAU); ctx.fill(); break;
    case 'compass': ctx.arc(12, 12, 10, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(12, 4); ctx.lineTo(15, 12); ctx.lineTo(12, 20); ctx.lineTo(9, 12); ctx.closePath(); ctx.fill(); break;
    case 'lock': rr(ctx, 4, 10, 16, 12, 3); ctx.fill(); ctx.beginPath(); ctx.arc(12, 10, 5, Math.PI, 0); ctx.stroke(); break;
    case 'gear': for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.save(); ctx.translate(12, 12); ctx.rotate(a); ctx.fillRect(-2.2, -11, 4.4, 5); ctx.restore(); }
      ctx.beginPath(); ctx.arc(12, 12, 7.5, 0, TAU); ctx.moveTo(15, 12); ctx.arc(12, 12, 3, 0, TAU); ctx.fill('evenodd'); break;
  }
  ctx.restore();
}
