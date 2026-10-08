/* ===== extra art: pointer, edible bushes, paleontologist, filing cabinet ===== */
function pointer(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.lineTo(7.5, 23); ctx.lineTo(13, 35); ctx.lineTo(18, 33); ctx.lineTo(12.5, 21.5); ctx.lineTo(22, 21.5); ctx.closePath();
  ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.lineWidth = 2; ctx.strokeStyle = '#1a1a1a'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
function walkTarget(ctx, fromX, fromY, x, y, col = '#fff6d6') {
  ctx.save();
  ctx.strokeStyle = rgba(col, 0.75); ctx.lineWidth = 3; ctx.setLineDash([2, 12]); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.quadraticCurveTo((fromX + x) / 2, Math.max(fromY, y) + 20, x, y); ctx.stroke(); ctx.setLineDash([]);
  ctx.translate(x, y); ctx.scale(1, 0.32);
  for (const [r, a, w] of [[40, 0.35, 2], [26, 0.85, 3]]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.strokeStyle = rgba(col, a); ctx.lineWidth = w * 3; ctx.stroke(); }
  ctx.fillStyle = rad(ctx, 0, 0, 0, 50, [[0, rgba(col, 0.45)], [1, rgba(col, 0)]]); ctx.beginPath(); ctx.arc(0, 0, 50, 0, TAU); ctx.fill();
  ctx.restore();
}
function bush(ctx, x, y, s, seed, o = {}) {
  const r = rng(seed), dark = o.dark || '#2f5a2c', mid = o.mid || '#4f8a3a', light = o.light || '#8fc35a';
  const blobs = [];
  for (let i = 0; i < 26; i++) { const a = Math.PI + r() * Math.PI, d = Math.sqrt(r()) * s * 0.55; blobs.push([x + Math.cos(a) * d * 1.35, y + Math.sin(a) * d * 0.9 - s * 0.1, s * (0.12 + r() * 0.12)]); }
  blobs.sort((a, b) => a[1] - b[1]);
  if (o.edible) {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.25);
    ctx.fillStyle = rad(ctx, 0, 0, 0, s * 1.1, [[0, rgba('#ffe58a', 0.55)], [1, rgba('#ffe58a', 0)]]); ctx.beginPath(); ctx.arc(0, 0, s * 1.1, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba('#fff2b0', 0.9); ctx.lineWidth = 8; ctx.setLineDash([22, 14]); ctx.beginPath(); ctx.arc(0, 0, s * 0.85, 0, TAU); ctx.stroke(); ctx.restore();
  }
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y + 2, s * 0.75, s * 0.1, 0, 0, TAU); ctx.fill();
  // a low mound of foliage, then fern fronds fanning out of it
  ctx.fillStyle = rad(ctx, x - s * 0.15, y - s * 0.45, s * 0.05, s * 0.8, [[0, mid], [1, dark]]);
  ctx.beginPath(); ctx.ellipse(x, y - s * 0.12, s * 0.62, s * 0.32, 0, Math.PI, 0); ctx.fill();
  fern(ctx, x - s * 0.25, y, s * 0.75, dark, seed + 1, { n: 7, spread: 2.4, droop: 0.07, leaf: 1.4 });
  fern(ctx, x + s * 0.22, y, s * 0.7, dark, seed + 2, { n: 7, spread: 2.4, droop: 0.07, leaf: 1.4 });
  fern(ctx, x, y + 2, s * 0.85, mid, seed + 3, { n: 8, spread: 2.6, droop: 0.06, leaf: 1.5 });
  fern(ctx, x + s * 0.05, y + 4, s * 0.55, light, seed + 4, { n: 6, spread: 2.2, droop: 0.05, leaf: 1.3 });
  if (o.berries) { ctx.fillStyle = o.berries; for (let i = 0; i < 9; i++) { const [bx, by, br] = blobs[blobs.length - 1 - Math.floor(r() * 12)]; ctx.beginPath(); ctx.arc(bx + (r() - 0.5) * br, by + (r() - 0.5) * br, Math.max(2, s * 0.025), 0, TAU); ctx.fill(); } }
  if (o.edible) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, x, y - s * 0.35, s * 0.9, '#fff2b0', 0.18); ctx.restore(); }
}
/* The paleontologist: balding, glasses, lab coat. Front view, feet at (x, y), height ~ 330·s */
function scientist(ctx, x, y, s, o = {}) {
  const skin = '#e3b08a', skinD = '#c98f6c', coat = '#f4f1ea', coatD = '#cfc8ba', trous = '#3b4252', hair = '#7a6a5a';
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(0, 0, 70, 10, 0, 0, TAU); ctx.fill();
  // legs + shoes
  ctx.fillStyle = trous; rr(ctx, -30, -120, 25, 116, 10); ctx.fill(); rr(ctx, 5, -120, 25, 116, 10); ctx.fill();
  ctx.fillStyle = '#2a2622'; rr(ctx, -40, -14, 38, 16, 8); ctx.fill(); rr(ctx, 2, -14, 38, 16, 8); ctx.fill();
  // coat body
  const coatPath = new Path2D();
  coatPath.moveTo(-46, -268); coatPath.quadraticCurveTo(-58, -200, -60, -96); coatPath.lineTo(-4, -92); coatPath.lineTo(4, -92); coatPath.lineTo(60, -96);
  coatPath.quadraticCurveTo(58, -200, 46, -268); coatPath.quadraticCurveTo(0, -282, -46, -268); coatPath.closePath();
  ctx.fillStyle = lin(ctx, -60, 0, 60, 0, [[0, coat], [0.7, coat], [1, coatD]]); ctx.fill(coatPath);
  ctx.strokeStyle = coatD; ctx.lineWidth = 2; ctx.stroke(coatPath);
  // shirt + tie in the V
  ctx.fillStyle = '#9ec3d8'; ctx.beginPath(); ctx.moveTo(-18, -270); ctx.lineTo(0, -214); ctx.lineTo(18, -270); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b5523a'; ctx.beginPath(); ctx.moveTo(-5, -264); ctx.lineTo(5, -264); ctx.lineTo(8, -226); ctx.lineTo(0, -214); ctx.lineTo(-8, -226); ctx.closePath(); ctx.fill();
  // lapels + buttons + pocket
  ctx.strokeStyle = coatD; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-24, -272); ctx.lineTo(-4, -200); ctx.lineTo(-4, -96); ctx.moveTo(24, -272); ctx.lineTo(4, -205); ctx.stroke();
  ctx.fillStyle = coatD; for (const by of [-180, -150, -120]) { ctx.beginPath(); ctx.arc(-10, by, 3, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = coatD; ctx.strokeRect(18, -228, 24, 20); ctx.fillStyle = '#3a6ab0'; ctx.fillRect(24, -238, 3, 12); ctx.fillStyle = '#b03a3a'; ctx.fillRect(31, -236, 3, 10);
  // arms: left holds a clipboard, right points (o.point)
  ctx.fillStyle = coat; ctx.strokeStyle = coatD; ctx.lineWidth = 2;
  const sleeve = (pts, w) => { ctx.lineWidth = w; ctx.strokeStyle = coatD; ctx.beginPath(); ctx.moveTo(...pts[0]); pts.slice(1).forEach(p => ctx.lineTo(...p)); ctx.stroke(); ctx.lineWidth = w - 4; ctx.strokeStyle = coat; ctx.stroke(); };
  sleeve([[-46, -258], [-62, -190], [-40, -150]], 30);
  ctx.fillStyle = '#8a6a44'; rr(ctx, -52, -190, 50, 64, 4); ctx.fill(); ctx.fillStyle = '#fbf8f0'; ctx.fillRect(-47, -182, 40, 52); ctx.fillStyle = '#b8b0a0'; ctx.fillRect(-36, -194, 18, 8);
  ctx.fillStyle = '#c8c0b0'; for (let i = 0; i < 5; i++) ctx.fillRect(-43, -174 + i * 9, 30 - (i % 2) * 8, 2.5);
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(-36, -150, 10, 0, TAU); ctx.fill();
  if (o.point) { sleeve([[46, -258], [84, -238], [124, -250]], 30); ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(130, -252, 10, 0, TAU); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = skin; ctx.beginPath(); ctx.moveTo(134, -254); ctx.lineTo(150, -258); ctx.stroke(); }
  else { sleeve([[46, -258], [62, -190], [52, -132]], 30); ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(52, -126, 10, 0, TAU); ctx.fill(); }
  // neck + head
  ctx.fillStyle = skinD; rr(ctx, -12, -296, 24, 30, 8); ctx.fill();
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(-34, -326, 7, 11, 0, 0, TAU); ctx.ellipse(34, -326, 7, 11, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -330, 34, 42, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = rad(ctx, -10, -350, 4, 46, [[0, 'rgba(255,255,255,.18)'], [1, 'rgba(255,255,255,0)']]); ctx.beginPath(); ctx.ellipse(0, -330, 34, 42, 0, 0, TAU); ctx.fill();
  // balding: fringe of hair on the sides and back only
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.moveTo(-35, -312); ctx.quadraticCurveTo(-40, -342, -28, -356); ctx.quadraticCurveTo(-26, -336, -24, -318); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(35, -312); ctx.quadraticCurveTo(40, -342, 28, -356); ctx.quadraticCurveTo(26, -336, 24, -318); ctx.closePath(); ctx.fill();
  // glasses, eyes, brows, nose, moustache, smile
  ctx.strokeStyle = '#2a2622'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-13, -332, 10, 0, TAU); ctx.moveTo(23, -332); ctx.arc(13, -332, 10, 0, TAU); ctx.moveTo(-3, -333); ctx.lineTo(3, -333); ctx.stroke();
  ctx.fillStyle = 'rgba(200,230,255,.25)'; ctx.beginPath(); ctx.arc(-13, -332, 9, 0, TAU); ctx.arc(13, -332, 9, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a2622'; ctx.beginPath(); ctx.arc(-12, -331, 2.6, 0, TAU); ctx.arc(14, -331, 2.6, 0, TAU); ctx.fill();
  ctx.strokeStyle = hair; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-22, -347); ctx.quadraticCurveTo(-13, -351, -5, -347); ctx.moveTo(5, -347); ctx.quadraticCurveTo(13, -351, 22, -347); ctx.stroke();
  ctx.strokeStyle = skinD; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -326); ctx.quadraticCurveTo(4, -314, -2, -312); ctx.stroke();
  ctx.fillStyle = hair; ctx.beginPath(); ctx.moveTo(-14, -304); ctx.quadraticCurveTo(0, -312, 14, -304); ctx.quadraticCurveTo(0, -300, -14, -304); ctx.fill();
  ctx.strokeStyle = '#8a4a3a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-9, -298); ctx.quadraticCurveTo(0, -292, 9, -298); ctx.stroke();
  ctx.restore();
}
/* Filing cabinet with three labelled drawers; open = index of the pulled drawer. Base at (x, y). */
function cabinet(ctx, x, y, w, h, labels, open = -1) {
  const wood = '#6b4a30', woodL = '#8a6340', woodD = '#4a3220';
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x + w / 2, y, w * 0.65, 12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lin(ctx, x, 0, x + w, 0, [[0, woodL], [0.6, wood], [1, woodD]]); rr(ctx, x, y - h, w, h, 8); ctx.fill();
  ctx.fillStyle = woodD; ctx.fillRect(x - 6, y - h - 10, w + 12, 14);
  const dh = (h - 30) / labels.length;
  const order = labels.map((_, i) => i).filter(i => i !== open); if (open >= 0) order.push(open);
  order.forEach(i => {
    const lab = labels[i], dy = y - h + 18 + i * dh, isOpen = i === open;
    if (isOpen) {
      // drawer pulled toward the viewer: front face lower and wider, dark inside above it
      // dark slot left in the cabinet
      ctx.fillStyle = '#140d08'; rr(ctx, x + 10, dy, w - 20, dh - 10, 4); ctx.fill();
      // the drawer box: sides, then the inside floor with bones, then the front face nearer the viewer
      const fy = dy + dh * 0.62, fw = w + 30, fx = x - 15;
      ctx.fillStyle = woodD; ctx.beginPath(); ctx.moveTo(x + 12, dy + 4); ctx.lineTo(fx, fy); ctx.lineTo(fx + 14, fy); ctx.lineTo(x + 24, dy + 4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + w - 12, dy + 4); ctx.lineTo(fx + fw, fy); ctx.lineTo(fx + fw - 14, fy); ctx.lineTo(x + w - 24, dy + 4); ctx.fill();
      ctx.fillStyle = lin(ctx, 0, dy, 0, fy, [[0, '#2a1c12'], [1, '#5a4430']]); ctx.beginPath(); ctx.moveTo(x + 24, dy + 4); ctx.lineTo(x + w - 24, dy + 4); ctx.lineTo(fx + fw - 14, fy); ctx.lineTo(fx + 14, fy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#efe5cf'; ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1.5;
      for (let k = 0; k < 4; k++) { const bx = x + 40 + k * (w - 80) / 3, by = dy + dh * 0.42 + (k % 2) * 8; ctx.beginPath(); ctx.ellipse(bx, by, 14, 9, 0.4 * k - 0.6, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = lin(ctx, 0, fy, 0, fy + dh, [[0, woodL], [1, wood]]); rr(ctx, fx, fy, fw, dh - 4, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#d8b46a'; rr(ctx, fx + fw / 2 - 44, fy + 14, 88, 24, 3); ctx.fill();
      txt(ctx, lab, fx + fw / 2, fy + 31, { font: `700 13px ${F.mono}`, color: '#3a2a10', align: 'center', ls: '1px' });
      ctx.fillStyle = '#c8a050'; rr(ctx, fx + fw / 2 - 28, fy + 48, 56, 10, 4); ctx.fill();
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8; ctx.fillStyle = 'rgba(0,0,0,.01)'; ctx.fillRect(fx, fy + dh - 8, fw, 4); ctx.restore();
    } else {
      ctx.fillStyle = lin(ctx, 0, dy, 0, dy + dh - 10, [[0, woodL], [1, wood]]); rr(ctx, x + 10, dy, w - 20, dh - 10, 5); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#d8b46a'; rr(ctx, x + w / 2 - 40, dy + 12, 80, 22, 3); ctx.fill();
      txt(ctx, lab, x + w / 2, dy + 28, { font: `700 12px ${F.mono}`, color: '#3a2a10', align: 'center', ls: '1px' });
      ctx.fillStyle = '#c8a050'; rr(ctx, x + w / 2 - 26, dy + 44, 52, 9, 4); ctx.fill();
    }
  });
  ctx.restore();
}
/* calorie HUD shared by the walk screens */
function calorieHud(ctx, sel, v, o = {}) {
  glass(ctx, 32, 32, 470, 112, 22, { tint: 'rgba(12,20,16,.5)' });
  ctx.save(); ctx.beginPath(); ctx.arc(88, 88, 40, 0, TAU); ctx.fillStyle = o.pbg || '#2c3d33'; ctx.fill(); ctx.clip();
  headCrop(ctx, sel, 52, 54, 74, 66, 'paint'); ctx.restore();
  ctx.beginPath(); ctx.arc(88, 88, 40, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2.5; ctx.stroke();
  txt(ctx, SP[sel].name === 'Tyrannosaurus' ? 'Tyrannosaurus rex' : SP[sel].name, 146, 74, { font: `700 22px ${F.body}`, color: '#fff' });
  txt(ctx, 'CALORIES', 146, 104, { font: `700 12px ${F.mono}`, color: 'rgba(255,255,255,.6)', ls: '2px' });
  const col = v < 0.3 ? '#ff7a5a' : v < 0.55 ? '#ffc35a' : '#9bd36f';
  bar(ctx, 236, 94, 236, 14, v, col, { glow: v < 0.3 || o.gain, ticks: 12 });
  if (o.gain) txt(ctx, o.gain, 472, 76, { font: `700 18px ${F.mono}`, color: '#c8f0a0', align: 'right', shadow: 'rgba(0,0,0,.5)', sb: 6 });
  else if (o.drain) txt(ctx, o.drain, 472, 76, { font: `600 13px ${F.mono}`, color: 'rgba(255,255,255,.55)', align: 'right' });
}
function screenProgress(ctx, n, name) {
  const w = 300, x = W / 2 - w / 2, y = 36;
  glass(ctx, x, y, w, 64, 20, { tint: 'rgba(12,20,16,.5)' });
  txt(ctx, `${name}  ·  SCREEN ${n} OF 5`, W / 2, y + 26, { font: `700 13px ${F.mono}`, color: '#fff', align: 'center', ls: '1.5px' });
  for (let i = 0; i < 5; i++) { const px = W / 2 - 96 + i * 48; rr(ctx, px, y + 40, 40, 8, 4); ctx.fillStyle = i < n - 1 ? 'rgba(255,255,255,.75)' : i === n - 1 ? '#ffd36a' : 'rgba(255,255,255,.18)'; ctx.fill(); }
}
function hint(ctx, x, y, text, o = {}) {
  const f = `600 15px ${F.body}`, tw = measure(ctx, text, f), w = tw + (o.key ? 64 : 32), h = 40;
  const X = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  glass(ctx, X, y, w, h, 12, { tint: 'rgba(14,18,16,.62)', shadow: false });
  let tx = X + 16;
  if (o.key) { icon(ctx, o.key, tx - 2, y + 9, 22, o.kc || '#ffd36a'); tx += 32; }
  txt(ctx, text, tx, y + 26, { font: f, color: '#fff' });
  return { x: X, w, h };
}
function edgeArrow(ctx, side, label, col = '#fff6d6') {
  const x = side > 0 ? W - 28 : 28, y = H * 0.56;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.translate(side > 0 ? W : 0, y); ctx.scale(0.5, 1.6);
  ctx.fillStyle = rad(ctx, 0, 0, 0, 220, [[0, rgba(col, 0.28)], [1, rgba(col, 0)]]); ctx.beginPath(); ctx.arc(0, 0, 220, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.fillStyle = col; for (let k = 0; k < 3; k++) { const ax = x - side * k * 18; ctx.globalAlpha = 1 - k * 0.3; ctx.beginPath(); ctx.moveTo(ax, y); ctx.lineTo(ax - side * 16, y - 18); ctx.lineTo(ax - side * 16, y + 18); ctx.closePath(); ctx.fill(); }
  ctx.globalAlpha = 1;
  txt(ctx, label, x - side * 70, y + 48, { font: `700 14px ${F.mono}`, color: col, align: side > 0 ? 'right' : 'left', ls: '1px', shadow: 'rgba(0,0,0,.6)', sb: 6 });
}
