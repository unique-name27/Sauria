/* ===== Print Dino: pictures, facts, page layouts, PDF output ===== */
const FACTS = {
  trex: ['Tyrannosaurus rex', 'tyrant lizard king', 'Lived 68 to 66 million years ago in western North America. Up to 12 metres long and about 8 tonnes. Its bite was one of the strongest of any land animal, and its arms were tiny, with two fingers each. It hunted big plant-eaters such as Triceratops and Edmontosaurus.'],
  stego: ['Stegosaurus', 'roofed lizard', 'Lived about 155 to 145 million years ago in North America and Portugal. About 9 metres long. Two rows of tall plates ran along its back, and four tail spikes defended it from predators such as Allosaurus. Its head was small and it ate low-growing plants.'],
  bronto: ['Brontosaurus', 'thunder lizard', 'Lived about 150 million years ago in western North America. Around 22 metres long and as heavy as several elephants. It used its long neck to reach plants. Scientists brought the name Brontosaurus back into use in 2015.'],
  trike: ['Triceratops', 'three-horned face', 'Lived 68 to 66 million years ago in western North America. About 9 metres long. It had two long brow horns, a short nose horn and a bony neck frill, and it cropped low plants with a sharp beak.'],
  anky: ['Ankylosaurus', 'fused lizard', 'Lived 68 to 66 million years ago in western North America. Up to about 8 metres long. Bony plates covered its back like armour, and it swung a heavy club at the end of its tail.'],
  para: ['Parasaurolophus', 'near crested lizard', 'Lived about 76 to 74 million years ago in North America. About 9.5 metres long. Its long, hollow head crest was connected to its nose and may have worked like a horn for deep calls. It ate plants.'],
  allo: ['Allosaurus', 'different lizard', 'Lived about 155 to 145 million years ago in North America and Portugal. Around 8.5 metres long. It was the top predator of its time. One Allosaurus bone has a wound made by a Stegosaurus tail spike.'],
  diplo: ['Diplodocus', 'double beam', 'Lived about 154 to 152 million years ago in western North America. Around 25 metres long, one of the longest dinosaurs. Peg-like teeth stripped leaves from branches, and its tail was long and thin like a whip.'],
  iguano: ['Iguanodon', 'iguana tooth', 'Lived about 126 to 122 million years ago in Europe. About 10 metres long, with a spike on each thumb. Named in 1825, it was one of the first dinosaurs ever described.'],
  deino: ['Deinonychus', 'terrible claw', 'Lived about 115 to 108 million years ago in North America. About 3.4 metres long. Each foot had a large sickle-shaped claw. Its discovery in 1964 showed that dinosaurs could be quick and active.'],
  pachy: ['Pachycephalosaurus', 'thick-headed lizard', 'Lived 68 to 66 million years ago in western North America. About 4.5 metres long. The bony dome on top of its head was up to 25 centimetres thick. It ate plants.'],
  coelo: ['Coelophysis', 'hollow form', 'Lived more than 200 million years ago, in the Late Triassic, in what is now New Mexico, USA. About 3 metres long and very light, with hollow bones. Hundreds of skeletons were found together at Ghost Ranch.'],
  brachio: ['Brachiosaurus', 'arm lizard', 'Lived about 154 to 153 million years ago in western North America. Its front legs were longer than its back legs, so it held its head high to feed in the treetops. It was about 18 to 22 metres long.'],
  spino: ['Spinosaurus', 'spine lizard', 'Lived about 99 to 93 million years ago in North Africa. About 14 metres long, one of the longest meat-eaters. It had a tall sail on its back and a narrow snout for catching fish. The first fossils were destroyed in the Second World War.'],
  proto: ['Protoceratops', 'first horned face', 'Lived about 75 to 71 million years ago in Mongolia. About 2 metres long, the size of a sheep. It had a bony frill but no real horns. A famous fossil shows one locked in a fight with a Velociraptor.'],
  cory: ['Corythosaurus', 'Corinthian helmet lizard', 'Lived about 77 to 75 million years ago in Alberta, Canada. About 9 metres long. Its hollow crest was shaped like an ancient Greek helmet. Fossils of its skin have been found.'],
  galli: ['Gallimimus', 'chicken mimic', 'Lived about 70 million years ago in Mongolia. About 6 metres long, with long legs built for running like an ostrich. It had a toothless beak and probably ate plants and small animals.'],
  edmonto: ['Edmontosaurus', 'lizard from Edmonton', 'Lived about 73 to 66 million years ago in western North America. Up to about 12 metres long. This duck-billed dinosaur had hundreds of teeth for grinding plants. Some skeletons show healed bite marks from T. rex.'],
};
const PICTURES = ['trex', 'stego', 'bronto', 'trike', 'anky', 'para', 'allo', 'diplo', 'iguano', 'deino', 'pachy', 'coelo', 'brachio', 'spino', 'proto', 'cory', 'galli', 'edmonto'];
const BUILD_SPECIES = ['trex', 'stego', 'bronto', 'trike', 'anky', 'para'];

/* survival chance for a Build Dino design, from what each part is good at */
const TRAITS = {
  head: { trex: { meat: 1, power: 9, weight: 9 }, stego: { power: 2, weight: 2 }, bronto: { power: 1, weight: 1 }, trike: { power: 6, weight: 7 }, anky: { power: 3, weight: 4 }, para: { power: 2, weight: 3 } },
  body: { trex: { speed: 7, armor: 2, neck: 9, biped: 1 }, stego: { speed: 3, armor: 6, neck: 4 }, bronto: { speed: 2, armor: 3, neck: 2, reach: 1 }, trike: { speed: 4, armor: 4, neck: 8 }, anky: { speed: 2, armor: 9, neck: 6 }, para: { speed: 6, armor: 2, neck: 4, biped: 1 } },
  tail: { trex: { defense: 2, balance: 9 }, stego: { defense: 8, balance: 6 }, bronto: { defense: 4, balance: 7 }, trike: { defense: 2, balance: 5 }, anky: { defense: 9, balance: 5 }, para: { defense: 2, balance: 7 } },
};
function survival(sel) {
  const h = TRAITS.head[sel.head], b = TRAITS.body[sel.body], t = TRAITS.tail[sel.tail], good = [], bad = [];
  let s = 30 + (b.armor + t.defense + (h.meat ? 0 : h.power * 0.5)) * 1.6;
  if (h.meat) { s += (b.speed + h.power) * 2; if (b.speed < 5) { s -= 18; bad.push('too slow to catch other dinosaurs'); } else good.push('fast enough to hunt'); }
  else { s += 20 + b.speed * 1.5 + (b.reach ? 6 : 0); if (b.reach) good.push('a long neck reaches plenty of plants'); }
  if (h.weight - b.neck > 3) { s -= (h.weight - b.neck - 3) * 7; bad.push('its neck is too weak for such a heavy head'); }
  if (b.biped && t.balance < 6) { s -= 14; bad.push('it walks on two legs but its tail is too short to balance'); }
  if (b.armor + t.defense >= 14) good.push('armour and a strong tail protect it');
  else if (t.defense >= 8) good.push('its tail is a good weapon');
  if (b.speed >= 6 && !h.meat) good.push('it can outrun most predators');
  if (b.armor + t.defense <= 5 && !h.meat && b.speed < 6) bad.push('it has little defence against predators');
  return { pct: Math.round(clamp(s, 8, 96)), good, bad };
}
function describeDesign(d) {
  const nm = k => FACTS[k][0];
  return `${d.name} was put together at the Museum of Natural History from the head of ${an(nm(d.head))}, the body of ${an(nm(d.body))} and the tail of ${an(nm(d.tail))}. Its chance of survival is ${survival(d).pct}%.`;
}
const an = w => (/^[AEIOU]/.test(w) ? 'an ' : 'a ') + w;

/* ---- drawing a dinosaur picture to fit a box ---- */
function pictureFit(ctx, sel, x, y, w, h, o = {}) {
  const M = assemble(sel), S = M.S;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
  for (const q of S) { x0 = Math.min(x0, q.x - q.t); x1 = Math.max(x1, q.x + q.t); y0 = Math.min(y0, q.y - q.t - (M.Hd.horns || M.B.plates || M.B.sail ? 40 : 10)); }
  const sc = Math.min(w / (x1 - x0), h / (20 - y0)), mid = (x0 + x1) / 2;
  const flip = !!o.flip;
  drawDino(ctx, M, x + w / 2 + (flip ? mid : -mid) * sc, y + h - 10 * sc, { scale: sc, flip, mode: o.colour ? 'paint' : 'line', shadow: !!o.colour, lw: o.lw || 2.2, rim: o.colour ? '#fff4d8' : null, hybridColors: typeof sel !== 'string', ink: '#1d1a15' });
}
function wrapText(ctx, text, x, y, maxW, lineH, font, color) {
  ctx.font = font; const words = text.split(' '); let line = '', yy = y;
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { txt(ctx, line, x, yy, { font, color }); yy += lineH; line = w; } else line = t; }
  if (line) txt(ctx, line, x, yy, { font, color }); return yy;
}
function itemInfo(item) {
  if (item.design) return { title: item.design.name, meaning: 'your own design', text: describeDesign(item.design), sel: { head: item.design.head, neck: item.design.body, body: item.design.body, tail: item.design.tail } };
  const f = FACTS[item.key]; return { title: f[0], meaning: f[1], text: f[2], sel: item.key };
}
/* Regular: letter page, picture plus facts. 150 dpi */
function pageRegular(item, colour) {
  const [c, x] = mk(1275, 1650), I = itemInfo(item);
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 1275, 1650);
  txt(x, I.title.toUpperCase(), 637, 170, { font: `900 ${I.title.length > 14 ? 64 : 84}px ${F.disp}`, color: '#1d1a15', align: 'center', ls: '6px' });
  txt(x, `“${I.meaning}”`, 637, 236, { font: `italic 500 38px ${F.body}`, color: '#5a5040', align: 'center' });
  pictureFit(x, I.sel, 90, 300, 1095, 700, { colour });
  x.fillStyle = '#1d1a15'; x.fillRect(110, 1060, 1055, 3);
  wrapText(x, I.text, 110, 1140, 1055, 58, `500 38px ${F.body}`, '#1d1a15');
  txt(x, 'Printed with Print Dino', 1165, 1590, { font: `500 24px ${F.mono}`, color: '#9a8f7a', align: 'right' });
  return [{ canvas: c, wpt: 612, hpt: 792 }];
}
/* Poster: one big picture spread over 2 × 2 landscape pages */
function pagesPoster(item, colour) {
  const I = itemInfo(item), [big, x] = mk(3300, 2550);
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 3300, 2550);
  txt(x, I.title.toUpperCase(), 1650, 330, { font: `900 ${I.title.length > 14 ? 190 : 250}px ${F.disp}`, color: '#1d1a15', align: 'center', ls: '16px' });
  pictureFit(x, I.sel, 160, 420, 2980, 1980, { colour, lw: 4.5 });
  const pages = [];
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    const [c, px] = mk(1650, 1275); px.drawImage(big, i * 1650, j * 1275, 1650, 1275, 0, 0, 1650, 1275);
    txt(px, `${j * 2 + i + 1} / 4`, 1610, 1250, { font: `500 22px ${F.mono}`, color: '#9a8f7a', align: 'right' });
    pages.push({ canvas: c, wpt: 792, hpt: 612 });
  }
  return pages;
}
/* T-shirt transfer: mirrored so it reads correctly once ironed on */
function pageTshirt(item, colour) {
  const I = itemInfo(item), [art, ax] = mk(1275, 1650);
  ax.fillStyle = '#ffffff'; ax.fillRect(0, 0, 1275, 1650);
  pictureFit(ax, I.sel, 90, 300, 1095, 820, { colour, lw: 3 });
  txt(ax, I.title.toUpperCase(), 637, 1300, { font: `900 ${I.title.length > 14 ? 70 : 92}px ${F.disp}`, color: '#1d1a15', align: 'center', ls: '6px' });
  const [c, x] = mk(1275, 1650); x.translate(1275, 0); x.scale(-1, 1); x.drawImage(art, 0, 0); x.setTransform(1, 0, 0, 1, 0, 0);
  txt(x, 'T-shirt transfer: printed mirror-image. Iron face down onto the shirt.', 637, 1600, { font: `500 24px ${F.mono}`, color: '#9a8f7a', align: 'center' });
  return [{ canvas: c, wpt: 612, hpt: 792 }];
}
/* Dinosaur Hall of Fame certificate, letter landscape */
function certificateCanvas(dinoName, sel, guide, skill) {
  const [c, x] = mk(1650, 1275), W_ = 1650, H_ = 1275;
  x.fillStyle = lin(x, 0, 0, 0, H_, [[0, '#fbf6e8'], [1, '#f1e7cf']]); x.fillRect(0, 0, W_, H_);
  x.strokeStyle = '#2f4a3a'; x.lineWidth = 12; x.strokeRect(50, 50, W_ - 100, H_ - 100);
  x.strokeStyle = '#b08a3a'; x.lineWidth = 4; x.strokeRect(78, 78, W_ - 156, H_ - 156);
  for (const [sx, sy] of [[130, 130], [W_ - 130, 130], [130, H_ - 130], [W_ - 130, H_ - 130]]) icon(x, 'foot', sx - 28, sy - 28, 56, '#b08a3a');
  txt(x, 'DINOSAUR', W_ / 2, 250, { font: `900 104px ${F.disp}`, color: '#2f4a3a', align: 'center', ls: '16px' });
  txt(x, 'HALL OF FAME', W_ / 2, 340, { font: `800 56px ${F.disp}`, color: '#b08a3a', align: 'center', ls: '20px' });
  txt(x, 'This certifies that', W_ / 2, 450, { font: `italic 500 44px ${F.body}`, color: '#5a5040', align: 'center' });
  txt(x, dinoName, W_ / 2, 560, { font: `italic 700 92px ${F.body}`, color: '#1d1a15', align: 'center' });
  txt(x, 'walked through all five ecosystems without starving or being eaten,', W_ / 2, 650, { font: `500 40px ${F.body}`, color: '#5a5040', align: 'center' });
  txt(x, 'guided by', W_ / 2, 710, { font: `500 40px ${F.body}`, color: '#5a5040', align: 'center' });
  x.strokeStyle = '#8a7a5a'; x.lineWidth = 3; x.beginPath(); x.moveTo(W_ / 2 - 420, 812); x.lineTo(W_ / 2 + 420, 812); x.stroke();
  txt(x, guide || ' ', W_ / 2, 795, { font: `italic 600 64px ${F.body}`, color: '#2f4a3a', align: 'center' });
  pictureFit(x, sel, 150, 850, 440, 250, { lw: 2.4 });
  x.save(); x.translate(W_ - 330, H_ - 300);
  for (let i = 0; i < 24; i++) { x.rotate(TAU / 24); x.fillStyle = '#c8962e'; x.beginPath(); x.moveTo(0, -132); x.lineTo(16, -106); x.lineTo(-16, -106); x.fill(); }
  x.fillStyle = rad(x, -20, -20, 8, 120, [[0, '#f2cf72'], [1, '#b8862a']]); x.beginPath(); x.arc(0, 0, 110, 0, TAU); x.fill();
  x.strokeStyle = 'rgba(90,60,10,.5)'; x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 90, 0, TAU); x.stroke(); icon(x, 'foot', -38, -44, 76, '#7a5410'); x.restore();
  const d = new Date(), ds = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  txt(x, `Skill level ${skill}  ·  ${ds}`, W_ / 2, H_ - 150, { font: `500 32px ${F.mono}`, color: '#7a6f5c', align: 'center' });
  return c;
}

/* ---- minimal PDF writer: one full-page JPEG per page ---- */
function canvasToBlob(c, type, q) { return new Promise(res => c.toBlob(res, type, q)); }
async function makePDF(pages) {
  const enc = new TextEncoder(), chunks = [], offsets = []; let off = 0;
  const push = d => { const b = typeof d === 'string' ? enc.encode(d) : d; chunks.push(b); off += b.length; };
  const obj = (num, body) => { offsets[num] = off; push(`${num} 0 obj\n`); body(); push('\nendobj\n'); };
  push('%PDF-1.4\n'); push(new Uint8Array([37, 226, 227, 207, 211, 10]));
  const n = pages.length, kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => push(`<< /Type /Pages /Kids [${kids}] /Count ${n} >>`));
  for (let i = 0; i < n; i++) {
    const p = pages[i], base = 3 + i * 3, jpg = new Uint8Array(await (await canvasToBlob(p.canvas, 'image/jpeg', 0.92)).arrayBuffer());
    const content = `q ${p.wpt} 0 0 ${p.hpt} 0 0 cm /Im0 Do Q`;
    obj(base, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.wpt} ${p.hpt}] /Resources << /XObject << /Im0 ${base + 1} 0 R >> >> /Contents ${base + 2} 0 R >>`));
    obj(base + 1, () => { push(`<< /Type /XObject /Subtype /Image /Width ${p.canvas.width} /Height ${p.canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`); push(jpg); push('\nendstream'); });
    obj(base + 2, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
  }
  const total = 3 + n * 3, xref = off;
  let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let i = 1; i < total; i++) x += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  push(x); push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks, { type: 'application/pdf' });
}
