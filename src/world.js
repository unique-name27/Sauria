/* ===== Faithful remake frames: original mechanics, new graphics ===== */
const _hab = {};
function habitat(name) {
  if (_hab[name]) return _hab[name];
  let c;
  if (name === 'forest') c = eraLayer('jurassic', { herd: false });
  else if (name === 'forestGold') {
    const base = eraLayer('jurassic', { herd: false });
    c = layer(x => {
      x.drawImage(base, 0, 0);
      x.globalCompositeOperation = 'soft-light'; x.globalAlpha = 0.8; x.fillStyle = lin(x, 0, 0, 0, H, [[0, '#ff9a3a'], [1, '#6a2a08']]); x.fillRect(0, 0, W, H);
      x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.28; x.fillStyle = '#ffb070'; x.fillRect(0, 0, W, H);
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; glow(x, 1180, 270, 650, '#ffb060', 0.35);
    });
  } else if (name === 'swamp') c = layer(ctx => {
    fillSky(ctx, [[0, '#7c9a98'], [0.5, '#c6d4c4'], [1, '#dde2cf']]);
    glow(ctx, 420, 250, 520, '#fff8e0', 0.6);
    const wy = 640;
    const above = layer(a => {
      treeline(a, 600, 210, '#a7bbb0', 801, { spiky: 0.7 });
      haze(a, 390, 620, '#dde5d5', 0, 0.7);
      treeline(a, 630, 150, '#86a092', 802, { spiky: 0.45 });
      haze(a, 500, 650, '#dde5d5', 0, 0.5);
      const r = rng(803);
      for (let i = 0; i < 6; i++) { // dead snags
        const sx = 100 + r() * 1400, sh = 220 + r() * 160; a.strokeStyle = '#5d6e64'; a.lineCap = 'round'; a.lineWidth = 10 + r() * 6;
        a.beginPath(); a.moveTo(sx, wy + 6); a.lineTo(sx + (r() - 0.5) * 30, wy - sh); a.stroke();
        a.lineWidth = 4; a.beginPath(); a.moveTo(sx, wy - sh * 0.6); a.lineTo(sx + (r() < 0.5 ? -1 : 1) * 50, wy - sh * 0.75); a.stroke();
      }
      for (let i = 0; i < 9; i++) treeFern(a, 40 + i * 180 + r() * 70, wy + 4, 190 + r() * 110, '#4c6658', '#557564', 810 + i, (r() - 0.5) * 0.4);
    });
    ctx.drawImage(above, 0, 0);
    // water with reflections
    ctx.fillStyle = lin(ctx, 0, wy, 0, H, [[0, '#bfd0c2'], [0.5, '#86a497'], [1, '#4a665c']]); ctx.fillRect(0, wy, W, H - wy);
    ctx.save(); ctx.beginPath(); ctx.rect(0, wy, W, H - wy); ctx.clip(); ctx.globalAlpha = 0.32; ctx.translate(0, 2 * wy); ctx.scale(1, -1); ctx.drawImage(above, 0, 0); ctx.restore();
    const lr = rng(804); ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 90; i++) { ctx.fillStyle = rgba('#ffffff', 0.22 * lr()); ctx.fillRect(lr() * W, wy + 4 + lr() * 200, 20 + lr() * 80, 1.4); }
    ctx.restore();
    // mud bank where the dinosaurs walk
    const n = noise1(805);
    ctx.beginPath(); ctx.moveTo(-10, H); ctx.lineTo(-10, 760);
    for (let x = -10; x <= W + 10; x += 6) ctx.lineTo(x, 745 + (fbm(n, x * 0.004, 3) - 0.5) * 40 + Math.sin(x * 0.003) * 14);
    ctx.lineTo(W + 10, H); ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, 730, 0, H, [[0, '#6a6a40'], [0.4, '#4a4e2e'], [1, '#2a2e1a']]); ctx.fill();
    ctx.strokeStyle = rgba('#e8ecd0', 0.35); ctx.lineWidth = 2; ctx.stroke();
    for (let i = 0; i < 18; i++) horsetail(ctx, lr() * W, 760 + lr() * 30, 70 + lr() * 70, '#5a7a3a', 820 + i);
    for (let i = 0; i < 12; i++) fern(ctx, lr() * W, 790 + lr() * 60, 60 + lr() * 50, i % 2 ? '#3f6435' : '#4f7a3e', 840 + i, { leaf: 1.2 });
    // drifting mist
    for (const [my, ma] of [[660, 0.35], [730, 0.22]]) { ctx.fillStyle = lin(ctx, 0, my - 40, 0, my + 40, [[0, 'rgba(235,240,228,0)'], [0.5, `rgba(235,240,228,${ma})`], [1, 'rgba(235,240,228,0)']]); ctx.fillRect(0, my - 40, W, 80); }
  });
  else if (name === 'mountains') c = layer(ctx => {
    fillSky(ctx, [[0, '#252850'], [0.35, '#663d68'], [0.6, '#cc6c58'], [0.78, '#f3a65c'], [1, '#f5c486']]);
    glow(ctx, 1080, 590, 700, '#ff9a50', 0.5); glow(ctx, 1080, 590, 140, '#fff0c0', 0.9);
    ridge(ctx, { seed: 901, base: 610, amp: 420, freq: 0.0024, sharp: 0.8, fill: lin(ctx, 0, 200, 0, 610, [[0, '#2e1a36'], [0.6, '#4a2440'], [1, '#6a3048']]), rim: rgba('#ffd0a0', 0.9), rimW: 2.5 });
    haze(ctx, 500, 640, '#e88a6a', 0, 0.28);
    const y2 = ridge(ctx, { seed: 902, base: 700, amp: 250, freq: 0.0034, sharp: 0.6, fill: lin(ctx, 0, 450, 0, 700, [[0, '#1e0e20'], [1, '#140a16']]), rim: rgba('#ffb47a', 0.7), rimW: 2 });
    const r = rng(903);
    for (let i = 0; i < 70; i++) { const x = r() * W, y = y2(x); if (y > 470) conifer(ctx, x, y + 8, 40 + r() * 40, '#1e1022', 904 + i, { tiers: 6, crown: 0.4 }); }
    haze(ctx, 600, 730, '#e88a6a', 0, 0.2);
    // rocky plateau in the foreground
    const n = noise1(905);
    ctx.beginPath(); ctx.moveTo(-10, H); for (let x = -10; x <= W + 10; x += 6) ctx.lineTo(x, 735 + (fbm(n, x * 0.003, 4) - 0.5) * 60); ctx.lineTo(W + 10, H); ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, 700, 0, H, [[0, '#6a4450'], [0.5, '#45293a'], [1, '#22141c']]); ctx.fill();
    ctx.strokeStyle = rgba('#ffb47a', 0.45); ctx.lineWidth = 2; ctx.stroke();
    for (let i = 0; i < 14; i++) rock(ctx, r() * W, 790 + r() * 100, 50 + r() * 90, 26 + r() * 40, '#4a2e3e', 920 + i, 0.14);
    for (let i = 0; i < 6; i++) cycad(ctx, r() * W, 820 + r() * 60, 120 + r() * 60, '#3a2430', '#4a4a2e', 940 + i);
  });
  _hab[name] = c; return c;
}
function walkBase(ctx, name, blur = 3) { ctx.drawImage(blur ? blurred(habitat(name), blur) : habitat(name), 0, 0); }

/* Museum of Natural History lab, shared by the two Build frames */
function labBackdrop(ctx) {
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#2a2420'], [0.55, '#4a3c30'], [0.56, '#5a4432'], [1, '#2a1e14']]); ctx.fillRect(0, 0, W, H);
  // arched windows with morning light
  for (const wx of [600, 880]) {
    ctx.save(); ctx.beginPath(); ctx.moveTo(wx, 470); ctx.lineTo(wx, 210); ctx.arc(wx + 110, 210, 110, Math.PI, 0); ctx.lineTo(wx + 220, 470); ctx.closePath(); ctx.clip();
    ctx.fillStyle = lin(ctx, 0, 100, 0, 470, [[0, '#cfe6f0'], [1, '#f6ecd0']]); ctx.fillRect(wx, 90, 220, 380);
    ctx.fillStyle = '#9fbfae'; ctx.beginPath(); ctx.moveTo(wx, 470); for (let k = 0; k <= 10; k++) ctx.lineTo(wx + k * 22, 400 - Math.sin(k * 1.3) * 20 - (k % 3) * 8); ctx.lineTo(wx + 220, 470); ctx.fill();
    ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(wx + 110, 100); ctx.lineTo(wx + 110, 470); ctx.moveTo(wx, 300); ctx.lineTo(wx + 220, 300); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = lin(ctx, 0, 470, 0, H, [[0, 'rgba(255,236,200,.14)'], [1, 'rgba(255,236,200,0)']]);
    ctx.beginPath(); ctx.moveTo(wx, 470); ctx.lineTo(wx + 220, 470); ctx.lineTo(wx + 360, H); ctx.lineTo(wx + 60, H); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // wall sign
  rr(ctx, 520, 40, 660, 66, 6); ctx.fillStyle = '#1e1814'; ctx.fill(); ctx.strokeStyle = '#b08a3a'; ctx.lineWidth = 2; ctx.stroke();
  txt(ctx, 'MUSEUM OF NATURAL HISTORY', 850, 83, { font: `800 24px ${F.disp}`, color: '#e8c87a', align: 'center', ls: '3px' });
  // shelves of fossils on the left wall
  for (const sy of [230, 360]) {
    ctx.fillStyle = '#3a2a1c'; ctx.fillRect(40, sy, 300, 12);
    const r = rng(sy);
    for (let k = 0; k < 5; k++) {
      const fx = 70 + k * 58; ctx.fillStyle = '#d8ccb0';
      if (k % 2) { ctx.beginPath(); ctx.arc(fx, sy - 18, 17, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 2; ctx.beginPath(); for (let t = 0; t < 12; t += 0.2) { const rr_ = 16 * Math.exp(-t * 0.18); t ? ctx.lineTo(fx + Math.cos(t) * rr_, sy - 18 + Math.sin(t) * rr_) : ctx.moveTo(fx + rr_, sy - 18); } ctx.stroke(); }
      else { ctx.beginPath(); ctx.ellipse(fx, sy - 14, 22, 13, 0, Math.PI, 0); ctx.lineTo(fx + 26, sy); ctx.lineTo(fx - 22, sy); ctx.fill(); ctx.fillStyle = '#3a2a1c'; ctx.beginPath(); ctx.arc(fx + 4, sy - 16, 4, 0, TAU); ctx.fill(); }
    }
  }
  // wood floor
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.5;
  for (let y = 520; y < H; y += 26) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  const r = rng(77); for (let y = 520; y < H; y += 26) for (let x = r() * 200; x < W; x += 180 + r() * 120) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 26); ctx.stroke(); }
  // assembly platform
  ctx.save(); ctx.translate(1190, 640); ctx.scale(1, 0.18);
  ctx.fillStyle = '#2a1e16'; ctx.beginPath(); ctx.arc(0, 60, 330, 0, TAU); ctx.fill();
  ctx.fillStyle = lin(ctx, 0, -330, 0, 330, [[0, '#7a6a58'], [1, '#4a3c30']]); ctx.beginPath(); ctx.arc(0, 0, 330, 0, TAU); ctx.fill();
  ctx.restore();
  glow(ctx, 1190, 600, 360, '#ffe2a8', 0.18);
}
function speech(ctx, x, y, w, text, tailX, tailY) {
  const f = `600 18px ${F.body}`, lines = [], words = text.split(' '); let line = '';
  for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (measure(ctx, t, f) > w - 40) { lines.push(line); line = wd; } else line = t; } lines.push(line);
  const h = 30 + lines.length * 26;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#fffaf0'; rr(ctx, x, y, w, h, 18); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 40, y + h - 2); ctx.lineTo(tailX, tailY); ctx.lineTo(x + 80, y + h - 2); ctx.closePath(); ctx.fill(); ctx.restore();
  lines.forEach((l, i) => txt(ctx, l, x + 20, y + 40 + i * 26, { font: f, color: '#2a2218' }));
}
function headCrop(ctx, sel, x, y, w, h, mode) {
  const M = assemble(sel), s = 1.6;
  const r = mode === 'bones' ? renderBones(M, { scale: s }) : renderDino(M, { scale: s, rim: '#fff3cc', light: [0.6, -0.8] });
  const [a, b] = M.ranges.head; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  const add = (px, py) => { x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); };
  for (let i = a; i <= b; i++) { const q = M.S[i]; add(q.x, q.y - q.t); add(q.x, q.y + q.b); add(q.x + q.t, q.y); }
  const Hd = M.Hd;
  if (Hd.frill) { add(M.hb.x + Hd.frill.cx - Hd.frill.rx, M.hb.y + Hd.frill.cy - Hd.frill.ry); }
  if (Hd.horns) for (const [hx, hy, ang, len] of Hd.horns) add(M.hb.x + hx + Math.cos(ang) * len, M.hb.y + hy + Math.sin(ang) * len);
  if (Hd.crest) add(M.hb.x + Hd.crest[1][0] - 6, M.hb.y + Hd.crest[1][1] - 6);
  if (Hd.dome) add(M.hb.x + Hd.dome[0], M.hb.y + Hd.dome[1] - Hd.dome[3]);
  const pad = 6, sw = (x1 - x0 + pad * 2) * s, sh = (y1 - y0 + pad * 2) * s, k = Math.min(w / sw, h / sh);
  const sx = r.ax + (x0 - pad) * s, sy = r.ay + (y0 - pad) * s;
  ctx.drawImage(r.canvas, sx, sy, sw, sh, x + (w - sw * k) / 2, y + (h - sh * k) / 2, sw * k, sh * k);
}
