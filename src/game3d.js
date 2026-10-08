/* ===== Sauria: game core ===== */
const $ = id => document.getElementById(id);
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
const SPEED = { stego: 3.4, bronto: 3.0, trex: 4.4 };
const BODY_SPEED = { trex: 4.4, stego: 3.4, bronto: 3.0, trike: 3.6, anky: 3.0, para: 4.0 };
const PREDATORS = { 1: 'allo', 2: 'trex', 3: 'allo', 4: 'trex' };
const PRED_AREAS = { 1: [2, 4], 2: [1, 2, 4], 3: [1, 2, 3, 4] };
const PREY = ['para', 'iguano', 'pachy', 'galli', 'edmonto', 'proto', 'trike', 'stego'];
const GRAZERS = ['para', 'iguano', 'cory', 'proto', 'edmonto'];

const G = {
  state: 'loading', skill: 1, choice: 'stego', designs: [], guide: '', holdToWalk: false, muted: false, fast: false,
  pointer: { x: 0, y: 0, inside: false, down: false, moved: false, touch: false }, keys: {},
  cam: { yaw: 0, pitch: 0.42, zoom: 1, dragging: false }, paused: false, downloads: null,
};

/* ---- preferences: this browser only ---- */
const STORE = 'sauria.v1';
function loadPrefs(data) {
  let d = data;
  if (!d) { try { d = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { d = null; } }
  if (d) { G.designs = Array.isArray(d.designs) ? d.designs.slice(0, 20) : []; G.guide = d.guide || ''; G.skill = d.skill || 1; G.muted = !!d.muted; G.holdToWalk = !!d.holdToWalk; G.fast = !!d.fast; }
}
function savePrefs() { try { localStorage.setItem(STORE, JSON.stringify({ designs: G.designs, guide: G.guide, skill: G.skill, muted: G.muted, holdToWalk: G.holdToWalk, fast: G.fast })); } catch (e) {} }

/* ---- renderer ---- */
let renderer, camera, titleW, showcase, museum;
function initRenderer() {
  const canvas = $('gl');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = !G.fast; renderer.shadowMap.type = THREE.PCFShadowMap;
  camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1500);
  setPerfCap(); PERF.ratio = PERF.cap;
  const resize = () => { const app = $('app'), w = app.clientWidth, h = app.clientHeight; renderer.setPixelRatio(PERF.ratio); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  window.addEventListener('resize', resize); resize();
}

/* ---- adaptive resolution: render fewer pixels when frames run long, more when there is headroom ---- */
const PERF = { cap: 1, ratio: 1, floor: 0.5, acc: 0, n: 0, good: 0, ceil: Infinity, ceilT: 0, judge: null };
function setPerfCap() {
  const dpr = window.devicePixelRatio || 1, touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  PERF.cap = G.fast ? Math.min(dpr, 1) * 0.8 : Math.min(dpr, touch ? 1.25 : 1.5);
  PERF.floor = Math.min(PERF.cap, 0.5);
}
function setRatio(r) { if (Math.abs(r - PERF.ratio) < 0.01) return; PERF.ratio = r; renderer.setPixelRatio(r); }
function perfSample(ms, active) {
  if (!active || ms > 400 || document.hidden) { PERF.acc = PERF.n = 0; return; } // loading stalls and tab switches don't count
  PERF.acc += ms; PERF.n++;
  if (PERF.acc < 1000) return;
  const avg = PERF.acc / PERF.n, now = performance.now(); PERF.acc = PERF.n = 0;
  let r = PERF.ratio;
  if (PERF.judge) { // did the last drop help? if not, the frame rate is capped by something else, so undo it
    const j = PERF.judge; PERF.judge = null;
    if (avg > j.avg * 0.93) { PERF.floor = j.from; r = j.from; }
  } else if (avg > 21 && r > PERF.floor) {
    PERF.judge = { from: r, avg }; PERF.ceil = r; PERF.ceilT = now + 20000; PERF.good = 0;
    r = Math.max(PERF.floor, r * (avg > 32 ? 0.72 : 0.86));
  } else if (avg < 17.8) {
    if (++PERF.good >= 3) { PERF.good = 0; if (now > PERF.ceilT) PERF.ceil = Infinity; r = Math.max(r, Math.min(PERF.cap, r * 1.1, PERF.ceil * 0.97)); }
  } else PERF.good = 0;
  setRatio(r);
}
/* Fast graphics: no shadows and a lower resolution, for slow machines */
function applyGraphics() {
  setPerfCap(); PERF.ceil = Infinity; PERF.judge = null; setRatio(PERF.cap);
  renderer.shadowMap.enabled = !G.fast;
  const scenes = [titleW, showcase, museum].filter(Boolean).map(o => o.scene).concat(G.run ? G.run.areas.filter(Boolean).map(a => a.scene) : []);
  for (const sc of scenes) sc.traverse(o => { if (o.material) [].concat(o.material).forEach(m => (m.needsUpdate = true)); });
}

/* ---- screens ---- */
const SCREENS = ['s-loading', 's-title', 's-choose', 's-hud', 's-pause', 's-over', 's-hof', 's-build', 's-print'];
function show(...ids) { for (const s of SCREENS) $(s).hidden = !ids.includes(s); document.body.dataset.state = G.state; }
function toast(msg, ms = 2600) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), ms); }
function fade(on) { $('fade').classList.toggle('on', on); return new Promise(r => setTimeout(r, on ? 260 : 10)); }
const nextFrame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));

/* ---- input ---- */
function initInput() {
  const canvas = $('gl');
  const setPtr = e => { const r = canvas.getBoundingClientRect(); G.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1; G.pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1; };
  canvas.addEventListener('pointermove', e => {
    setPtr(e); G.pointer.inside = true; G.pointer.moved = true;
    if (G.cam.dragging) { G.cam.yaw -= e.movementX * 0.006; G.cam.pitch = clamp(G.cam.pitch + e.movementY * 0.004, 0.1, 0.85); if (G.state === 'build' && museum) museum.spin -= e.movementX * 0.01; }
  });
  canvas.addEventListener('pointerleave', () => { G.pointer.inside = false; G.pointer.down = false; });
  canvas.addEventListener('pointerdown', e => {
    Sound.init(); setPtr(e); G.pointer.inside = true; G.pointer.moved = true;
    if (e.button === 2 || (G.state === 'build' && e.button === 0 && !museumClick())) { G.cam.dragging = true; canvas.setPointerCapture(e.pointerId); return; }
    G.pointer.down = true; G.pointer.touch = e.pointerType === 'touch';
  });
  window.addEventListener('pointerup', () => { G.pointer.down = false; G.cam.dragging = false; if (G.pointer.touch) G.pointer.inside = false; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', e => { e.preventDefault(); G.cam.zoom = clamp(G.cam.zoom * (e.deltaY > 0 ? 1.08 : 0.93), 0.55, 1.7); }, { passive: false });
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    G.keys[e.key.toLowerCase()] = true;
    if (e.key === 'Escape' && G.state === 'walk') togglePause();
    if (e.key.toLowerCase() === 'm') toggleMute();
  });
  window.addEventListener('keyup', e => { G.keys[e.key.toLowerCase()] = false; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'walk' && !G.paused) togglePause(); });
  document.addEventListener('click', e => { if (e.target.closest('button')) { Sound.init(); Sound.click(); } });
}
function toggleMute() { G.muted = !G.muted; Sound.setMuted(G.muted); syncMute(); savePrefs(); }
function syncMute() { for (const id of ['btn-mute', 'pause-sound']) { $(id).setAttribute('aria-pressed', String(G.muted)); $(id).textContent = G.muted ? 'Sound off' : 'Sound on'; } }

/* ---- title ---- */
function goTitle() {
  G.state = 'title'; G.paused = false; show('s-title'); Sound.ambient(null);
  if (G.run) disposeRun();
}

/* ---- choose a dinosaur ---- */
function buildShowcase() {
  const scene = new THREE.Scene(), B = BIOMES[0];
  scene.fog = new THREE.FogExp2(lc('#cfdfcc'), 0.012); skyDome(B, scene);
  scene.add(new THREE.HemisphereLight(lc('#dcefff'), lc('#4a5a30'), 0.7));
  const sun = new THREE.DirectionalLight(lc('#fff1d0'), 2.0); sun.position.set(12, 20, 10); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, far: 80 }); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(200, 48), new THREE.MeshStandardMaterial({ color: lc('#5a7a3e'), roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.4, 0.5, 64), new THREE.MeshStandardMaterial({ color: lc('#7a6a50'), roughness: 0.8 })); plat.position.y = 0.25; plat.receiveShadow = true; scene.add(plat);
  const r = rng(5), list = n => Array.from({ length: n }, () => { const a = Math.PI * (1.05 + r() * 0.9), d = 18 + r() * 50; return { x: Math.cos(a) * d, z: Math.sin(a) * d - 6, y: 0, rot: r() * 3, s: 0.7 + r() * 0.6 }; });
  trees3D(scene, 'araucaria', { trunk: '#5a4632', leaf: '#3a6048' }, list(60));
  scatter(scene, foliageTex('fern'), 2.6, 2.6, Array.from({ length: 140 }, () => { const a = r() * TAU, d = 8 + r() * 20; return { x: Math.cos(a) * d, z: Math.sin(a) * d, y: 0, rot: r() * 3, s: 0.6 + r() }; }), { quads: 3 });
  return { scene, plat, D: null, key: null, spin: 0.6 };
}
function chooseOptions() {
  const base = [{ id: 'stego', sel: 'stego', name: 'Stegosaurus', eats: 'Eats plants' }, { id: 'bronto', sel: 'bronto', name: 'Brontosaurus', eats: 'Eats plants' }, { id: 'trex', sel: 'trex', name: 'Tyrannosaurus rex', eats: 'Eats other dinosaurs' }];
  for (const d of G.designs.slice(-4)) base.push({ id: 'd:' + d.name, sel: { head: d.head, neck: d.body, body: d.body, tail: d.tail }, design: d, name: d.name, eats: d.head === 'trex' ? 'Eats other dinosaurs' : 'Eats plants' });
  return base;
}
const _chooseThumb = {};
function goChoose(preselect) {
  G.state = 'choose'; show('s-choose');
  if (!showcase) showcase = buildShowcase();
  const opts = chooseOptions(); if (preselect) G.choice = preselect; if (!opts.some(o => o.id === G.choice)) G.choice = 'stego';
  const list = $('choose-list'); list.innerHTML = '';
  for (const o of opts) {
    const b = document.createElement('button'); b.className = 'pick' + (o.id === G.choice ? ' on' : ''); b.type = 'button'; b.setAttribute('aria-pressed', String(o.id === G.choice));
    if (!_chooseThumb[o.id]) { const [tc, tx] = mk(220, 120); pictureFit(tx, o.sel, 8, 6, 204, 108, { colour: true, lw: 1.2 }); _chooseThumb[o.id] = tc.toDataURL(); }
    const thumb = document.createElement('img'); thumb.src = _chooseThumb[o.id]; thumb.alt = ''; b.append(thumb); const nm = document.createElement('b'); nm.textContent = o.name; const ea = document.createElement('span'); ea.textContent = o.design ? `Your design · ${o.eats.toLowerCase()}` : o.eats; b.append(nm, ea);
    b.onclick = () => { G.choice = o.id; goChoose(); };
    list.append(b);
  }
  [...document.querySelectorAll('#skill button')].forEach(b => { const on = +b.dataset.v === G.skill; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  const o = opts.find(x => x.id === G.choice);
  if (showcase.key !== o.id) {
    if (showcase.D) showcase.scene.remove(showcase.D.root);
    showcase.D = dinoInstance(o.sel); showcase.key = o.id; showcase.D.root.position.set(0, 0.5, 0); showcase.scene.add(showcase.D.root);
  }
  $('choose-desc').textContent = o.design ? describeDesign(o.design) : FACTS[o.sel][2];
}

/* ---- Walk Dino: a run through five areas ---- */
function startRun() {
  const o = chooseOptions().find(x => x.id === G.choice) || chooseOptions()[0];
  const sel = o.sel, bodyKey = typeof sel === 'string' ? sel : sel.body;
  const meat = typeof sel === 'string' ? sel === 'trex' : sel.head === 'trex';
  const D = dinoInstance(sel);
  G.run = {
    sel, name: o.name, design: o.design || null, meat, D, speed: (typeof sel === 'string' ? SPEED[sel] : BODY_SPEED[bodyKey]) || 3.4,
    sizeK: Math.min(1.4, SIZE[bodyKey] || 1), areas: [], idx: 0, calories: 85, dead: false, t: 0, seed: (Math.random() * 1e6) | 0,
    player: { D, pos: V3(0, 0, 0), heading: Math.PI / 2, speed: 0, state: 'idle', eatT: 0, attackT: 0, stepT: 0 }, hints: {}, ended: false,
  };
  G.paused = false; enterArea(0, 'south');
}
function areaState(i) {
  const R = G.run;
  if (!R.areas[i]) {
    const A = buildArea(i, G.skill, R.seed);
    A.npcs = []; A.predator = null;
    A.hasPredator = !R.meat && (PRED_AREAS[G.skill] || []).includes(i);
    A.preyTimer = 4; R.areas[i] = A;
    if (!R.meat) for (let k = 0; k < (i === 3 || i === 4 ? 1 : 2); k++) spawnNPC(A, 'grazer', GRAZERS[(i + k) % GRAZERS.length]);
    // build the models that appear mid-walk now, during the fade, so they don't stall the game later
    for (const sp of R.meat ? PREY : A.hasPredator ? [PREDATORS[i] || 'allo'] : []) if (!_protos[sp]) _protos[sp] = build3D(sp);
  }
  return R.areas[i];
}
async function enterArea(i, from) {
  const R = G.run; if (R.transit) return; R.transit = true;
  try {
  await fade(true);
  if (R.area) { R.area.scene.remove(R.player.D.root); if (R.area.predator) { R.area.scene.remove(R.area.predator.D.root); R.area.predator = null; } }
  $('loadmsg').hidden = false; await nextFrame();
  const A = areaState(i); R.idx = i; R.area = A;
  const p = R.player; A.scene.add(p.D.root);
  if (from === 'south') { p.pos.set(0, 0, 2); p.heading = Math.PI / 2; } else { p.pos.set(0, 0, -AREA_LEN + 4); p.heading = -Math.PI / 2; }
  p.pos.y = A.hAt(p.pos.x, p.pos.z); p.speed = 0;
  if (A.hasPredator) A.predSpawn = R.t + [11, 8, 6][G.skill - 1] + Math.random() * 3; else A.predSpawn = Infinity;
  G.cam.yaw = from === 'south' ? 0 : Math.PI; snapCamera();
  G.state = 'walk'; show('s-hud'); $('loadmsg').hidden = true;
  $('hud-area').textContent = `${A.B.name}`; $('hud-screen').textContent = `Screen ${i + 1} of 5`;
  [...document.querySelectorAll('#hud-steps i')].forEach((el, k) => { el.className = k < i ? 'done' : k === i ? 'now' : ''; });
  $('hud-name').textContent = R.name; $('hud-portrait').src = portraitURL(R.sel);
  Sound.ambient(A.B.key); Sound.whoosh();
  G.pointer.moved = false;
  if (i === 0 && !R.hints.start) { R.hints.start = 1; hint(R.meat ? 'Your T. rex walks toward the pointer. Catch the dinosaurs that wander past to eat.' : 'Your dinosaur walks toward the pointer. Walking burns calories faster than standing still.', 7000); }
  await nextFrame(); await fade(false);
  } finally { R.transit = false; }
}
function spawnNPC(A, kind, sp, at) {
  const D = dinoInstance(sp), R = G.run, r = Math.random;
  const pos = at || V3((r() - 0.5) * 2 * (HALF_W - 3), 0, -15 - r() * (AREA_LEN - 30));
  pos.y = A.hAt(pos.x, pos.z);
  const e = { D, kind, sp, pos, heading: r() * TAU, speed: 0, state: 'idle', wp: null, timer: 1 + r() * 3, dead: 0, maxSpeed: (SPEED[sp] || BODY_SPEED[sp] || 3.2) * 0.9 };
  A.scene.add(D.root); A.npcs.push(e); return e;
}
function steer(e, tx, tz, maxSpeed, dt, stopDist, turn = 2.2) {
  const dx = tx - e.pos.x, dz = tz - e.pos.z, dist = Math.hypot(dx, dz);
  if (dist < stopDist) e.speed = Math.max(0, e.speed - dt * 8);
  else {
    const want = Math.atan2(-dz, dx), dh = wrapA(want - e.heading);
    e.heading += clamp(dh, -turn * dt, turn * dt);
    const goal = maxSpeed * (0.2 + 0.8 * Math.max(0, Math.cos(dh))) * Math.min(1, (dist - stopDist) / 1.5 + 0.25);
    e.speed += (goal - e.speed) * Math.min(1, dt * 4);
  }
  e.pos.x += Math.cos(e.heading) * e.speed * dt; e.pos.z -= Math.sin(e.heading) * e.speed * dt;
  return dist;
}
const _ray = new THREE.Raycaster(), _plane = new THREE.Plane(V3(0, 1, 0), 0), _hit = V3();
function pointerTarget(p, A) {
  _ray.setFromCamera({ x: G.pointer.x, y: G.pointer.y }, camera);
  for (let k = 0; k < 2; k++) {
    _plane.constant = -(k === 0 ? p.pos.y : A.hAt(_hit.x, _hit.z));
    if (!_ray.ray.intersectPlane(_plane, _hit) || _hit.distanceTo(camera.position) > 160) { const d = _ray.ray.direction; const h = Math.hypot(d.x, d.z) || 1; return V3(p.pos.x + (d.x / h) * 40, 0, p.pos.z + (d.z / h) * 40); }
  }
  return _hit.clone();
}
function walkUpdate(dt) {
  const R = G.run, A = R.area, p = R.player, D = p.D;
  if (!A || R.transit) return;
  R.t += dt;
  // where does the player want to go?
  let target = null;
  const kx = (G.keys['d'] || G.keys['arrowright'] ? 1 : 0) - (G.keys['a'] || G.keys['arrowleft'] ? 1 : 0);
  const kz = (G.keys['w'] || G.keys['arrowup'] ? 1 : 0) - (G.keys['s'] || G.keys['arrowdown'] ? 1 : 0);
  if (G.keys['q']) G.cam.yaw += dt * 1.6; if (G.keys['e']) G.cam.yaw -= dt * 1.6;
  if (!R.dead && !R.ended) {
    if (kx || kz) { const fx = -Math.sin(G.cam.yaw), fz = -Math.cos(G.cam.yaw), rx = Math.cos(G.cam.yaw), rz = -Math.sin(G.cam.yaw); target = V3(p.pos.x + (fx * kz + rx * kx) * 8, 0, p.pos.z + (fz * kz + rx * 0 + rz * kx) * 8); }
    else if (G.pointer.inside && G.pointer.moved && (!G.holdToWalk || G.pointer.down || G.pointer.touch)) target = pointerTarget(p, A);
  }
  const reach = D.reach * 0.92;
  if (target && p.state !== 'attack') steer(p, target.x, target.z, R.speed, dt, kx || kz ? 0.2 : reach, 2.2 / Math.sqrt(R.sizeK));
  else p.speed = Math.max(0, p.speed - dt * 8), p.pos.x += Math.cos(p.heading) * p.speed * dt, p.pos.z -= Math.sin(p.heading) * p.speed * dt;
  p.pos.x = clamp(p.pos.x, -HALF_W - 1.5, HALF_W + 1.5);
  if (R.idx === 0) p.pos.z = Math.min(p.pos.z, 5);
  p.pos.y = A.hAt(p.pos.x, p.pos.z);
  // calories: always draining, faster while walking
  const base = [0.35, 0.45, 0.55][G.skill - 1], move = [0.6, 0.75, 0.9][G.skill - 1];
  if (!R.dead && !R.ended) R.calories -= dt * (base * R.sizeK + move * (p.speed / R.speed));
  // eating
  p.state = p.speed > 0.4 ? 'walk' : 'idle';
  D.root.position.copy(p.pos); D.root.rotation.y = p.heading; D.root.updateMatrixWorld(true);
  const snout = D.snout.getWorldPosition(V3());
  if (!R.meat && !R.dead) {
    let near = null, nd = 1e9;
    for (const b of A.bushes) { const d = Math.hypot(b.x - snout.x, b.z - snout.z); b.ring.material.opacity = b.food > 1 && Math.hypot(b.x - p.pos.x, b.z - p.pos.z) < 12 ? 0.55 + 0.25 * Math.sin(R.t * 4) : 0; if (d < nd && b.food > 0.5) { nd = d; near = b; } }
    if (near && nd < 2.0 && p.speed < 0.6 && R.calories < 100) {
      p.state = 'eat'; const amt = Math.min(near.food, 14 * dt); near.food -= amt; R.calories = Math.min(100, R.calories + amt);
      p.eatT += dt; if (p.eatT > 0.45) { p.eatT = 0; Sound.munch(); }
      if (!R.hints.eat) { R.hints.eat = 1; hint('Munching. Stay put until the bush is eaten or you are full.', 4000); }
    } else if (near && nd < 9 && R.calories < 70 && !R.hints.align) { R.hints.align = 1; hint('Stop with your dinosaur’s mouth at the bush to eat it.', 5000); }
  }
  if (p.attackT > 0) { p.attackT -= dt; p.state = 'attack'; }
  D.update(dt, p.speed, p.state);
  if (p.speed > 0.5) { p.stepT -= dt * p.speed; if (p.stepT < 0) { p.stepT = D.hipH * 1.25; if (R.sizeK > 1.2) Sound.step(true); } }
  // predator
  if (!A.predator && R.t > A.predSpawn && !R.dead && !R.ended) {
    const fromNorth = p.pos.z > -AREA_LEN / 2, z = fromNorth ? -AREA_LEN - 6 : 12;
    A.predator = spawnNPC(A, 'predator', PREDATORS[A.index] || 'allo', V3((Math.random() - 0.5) * 10, 0, z));
    A.predator.maxSpeed = R.speed * [0.8, 0.9, 1.0][G.skill - 1]; A.npcs.pop();
    Sound.roar(); hint(`${FACTS[A.predator.sp][0]} is hunting here! Run, or walk back to the previous area to escape.`, 6000);
  }
  if (A.predator) {
    const e = A.predator, body = D.bodyC.getWorldPosition(V3());
    if (!R.dead) steer(e, p.pos.x, p.pos.z, e.maxSpeed, dt, e.D.reach * 0.6, 2.0);
    e.pos.y = A.hAt(e.pos.x, e.pos.z); e.D.root.position.copy(e.pos); e.D.root.rotation.y = e.heading; e.D.root.updateMatrixWorld(true);
    const ps = e.D.snout.getWorldPosition(V3());
    if (!R.dead && Math.hypot(ps.x - body.x, ps.z - body.z) < D.bodyR * 1.2 + 1.0) { e.attackT = 0.8; Sound.chomp(); Sound.roar(); playerDies('eaten', FACTS[e.sp][0]); }
    if (e.attackT > 0) e.attackT -= dt;
    e.D.update(dt, e.speed, e.attackT > 0 ? 'attack' : 'walk');
  }
  // other dinosaurs: grazers wander; prey flee from a hunting T. rex
  if (R.meat && !R.dead) {
    A.preyTimer -= dt;
    const alive = A.npcs.filter(n => !n.dead).length;
    if (A.preyTimer < 0 && alive < 3) {
      A.preyTimer = [9, 12, 15][G.skill - 1] + Math.random() * 4;
      const side = Math.random() < 0.5 ? -1 : 1, z = clamp(p.pos.z - 40 - Math.random() * 40, -AREA_LEN + 5, -5);
      spawnNPC(A, 'prey', PREY[(Math.random() * PREY.length) | 0], V3(side * (HALF_W + 4), 0, z));
    }
  }
  for (const n of A.npcs) {
    if (n.dead) { n.dead += dt; n.D.dead = Math.min(1, n.dead); n.D.root.position.y = n.pos.y - Math.max(0, n.dead - 2.5) * 0.6; n.D.update(dt, 0, 'idle'); continue; }
    const dp = Math.hypot(n.pos.x - p.pos.x, n.pos.z - p.pos.z);
    if (R.meat && dp < 16 && !R.dead) { // flee
      const ax = n.pos.x - p.pos.x, az = n.pos.z - p.pos.z, l = Math.hypot(ax, az) || 1;
      steer(n, n.pos.x + (ax / l) * 10, n.pos.z + (az / l) * 10, R.speed * [0.68, 0.78, 0.88][G.skill - 1], dt, 0.2, 2.6); n.state = 'walk';
    } else {
      n.timer -= dt;
      if (!n.wp || n.timer < 0) { n.wp = V3((Math.random() - 0.5) * 2 * (HALF_W - 2), 0, clamp(n.pos.z + (Math.random() - 0.5) * 60, -AREA_LEN + 6, -6)); n.timer = 6 + Math.random() * 8; n.grazing = Math.random() < 0.35 ? 3 + Math.random() * 3 : 0; }
      if (n.grazing > 0) { n.grazing -= dt; n.speed = Math.max(0, n.speed - dt * 6); n.state = 'eat'; }
      else { const d = steer(n, n.wp.x, n.wp.z, n.maxSpeed * 0.45, dt, 1.5, 1.4); n.state = d > 1.5 ? 'walk' : 'idle'; }
    }
    n.pos.x = clamp(n.pos.x, -HALF_W - 6, HALF_W + 6); n.pos.y = A.hAt(n.pos.x, n.pos.z);
    n.D.root.position.copy(n.pos); n.D.root.rotation.y = n.heading; n.D.root.updateMatrixWorld(true);
    n.D.update(dt, n.speed, n.state);
    if (R.meat && !R.dead && p.attackT <= 0) {
      const body = n.D.bodyC.getWorldPosition(V3());
      if (Math.hypot(snout.x - body.x, snout.z - body.z) < n.D.bodyR * 1.2 + 1.2) {
        n.dead = 0.01; p.attackT = 0.7; Sound.chomp(); const gain = (SIZE[n.sp] || 1) > 1.1 ? 60 : 45; R.calories = Math.min(100, R.calories + gain);
        if (!R.hints.caught) { R.hints.caught = 1; hint(`You caught a${/^[AEIOU]/.test(FACTS[n.sp][0]) ? 'n' : ''} ${FACTS[n.sp][0]}! +${gain} calories.`, 3500); }
      }
    }
  }
  A.npcs = A.npcs.filter(n => !(n.dead > 5) || (A.scene.remove(n.D.root), false));
  // starving
  if (R.calories <= 0 && !R.dead) { R.calories = 0; playerDies('starved'); }
  if (R.dead) { R.deadT += dt; D.dead = Math.min(1, R.deadT / 1.2); }
  // leaving the area
  if (!R.dead && !R.ended) {
    if (p.pos.z < -AREA_LEN - 1) { if (R.idx === 4) winRun(); else enterArea(R.idx + 1, 'south'); return; }
    if (p.pos.z > 7 && R.idx > 0) { enterArea(R.idx - 1, 'north'); return; }
  }
  A.update(dt, p.pos);
  updateCamera(dt, p, D, A);
  // HUD
  const c = Math.max(0, R.calories) / 100, exitOn = p.pos.z < -AREA_LEN + 18 || (R.idx > 0 && p.pos.z > -6 && !!A.predator);
  setHud('hud-cal', 'width', (c * 100).toFixed(1) + '%'); setHud('hud-cal', 'className', c < 0.25 ? 'low' : c < 0.5 ? 'mid' : '');
  setHud('hud-calnum', 'textContent', String(Math.ceil(R.calories)));
  setHud('hud-exit', 'hidden', !exitOn);
  if (exitOn) setHud('hud-exit', 'textContent', p.pos.z < -AREA_LEN + 18 ? (R.idx === 4 ? 'Walk on to finish' : `Walk on to screen ${R.idx + 2}`) : `Walk back to screen ${R.idx} to escape`);
}
const _hud = {};
function setHud(id, prop, v) { const k = id + prop; if (_hud[k] === v) return; _hud[k] = v; const el = $(id); if (prop === 'width') el.style.width = v; else el[prop] = v; }
function snapCamera() { const R = G.run, p = R.player; updateCamera(10, p, p.D, R.area, true); }
const _camLook = V3();
function updateCamera(dt, p, D, A, snap) {
  const tgt = V3(p.pos.x, p.pos.y + D.hipH * 1.1 + 0.8, p.pos.z), dist = (5 + D.length * 0.62) * G.cam.zoom, cp = Math.cos(G.cam.pitch);
  const want = V3(tgt.x + Math.sin(G.cam.yaw) * dist * cp, tgt.y + Math.sin(G.cam.pitch) * dist, tgt.z + Math.cos(G.cam.yaw) * dist * cp);
  want.y = Math.max(want.y, A.hAt(want.x, want.z) + 1.4);
  const look = tgt.clone().add(V3(-Math.sin(G.cam.yaw) * 4, 0, -Math.cos(G.cam.yaw) * 4));
  const k = snap ? 1 : 1 - Math.exp(-dt * 5);
  camera.position.lerp(want, k); _camLook.lerp(look, snap ? 1 : 1 - Math.exp(-dt * 7)); camera.lookAt(_camLook);
}
function playerDies(how, by) {
  const R = G.run; if (R.dead) return; R.dead = how; R.deadT = 0; Sound.lose();
  setTimeout(() => {
    if (G.run !== R) return;
    G.state = 'over'; show('s-hud', 's-over');
    $('over-title').textContent = how === 'eaten' ? 'Eaten!' : 'Out of calories';
    $('over-text').textContent = how === 'eaten' ? `Your ${R.name} was caught by ${an(by)} on screen ${R.idx + 1}.` : `Your ${R.name} starved on screen ${R.idx + 1}. Eat more often, and walk less when you are low.`;
  }, 1800);
}
function winRun() {
  const R = G.run; R.ended = true; Sound.win();
  G.state = 'hof'; show('s-hof'); $('hof-name').value = G.guide; renderCertificate();
}
function renderCertificate() {
  const R = G.run, c = certificateCanvas(R.name, R.sel, $('hof-name').value.trim(), G.skill); $('hof-cert').src = c.toDataURL('image/jpeg', 0.9); R.cert = c;
}
function disposeRun() {
  const R = G.run; if (!R) return;
  for (const A of R.areas) if (A) A.scene.traverse(o => { if (o.isMesh && o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); });
  G.run = null;
}
function togglePause() { G.paused = !G.paused; show(...(G.paused ? ['s-hud', 's-pause'] : ['s-hud'])); $('hold-walk').checked = G.holdToWalk; $('fast-gfx').checked = G.fast; }
let hintTimer = 0;
function hint(text, ms = 5000) { const h = $('hud-hint'); h.textContent = text; h.hidden = false; hintTimer = ms / 1000; }
function portraitURL(sel) { const [c, x] = mk(160, 160); x.fillStyle = '#2c3d33'; x.fillRect(0, 0, 160, 160); headCrop(x, sel, 8, 14, 144, 132, 'paint'); return c.toDataURL(); }

/* ---- Build Dino in the museum ---- */
const BUILD = { head: 'stego', body: 'stego', tail: 'stego', name: '', drawer: -1, D: null };
function suggestName(s) { const st = k => SP[k].stem; const a = st(s.head), b = st(s.body).toLowerCase(), t = s.tail === s.body && s.head === s.body ? '' : st(s.tail).toLowerCase(); return s.head === s.body && s.body === s.tail ? 'My ' + FACTS[s.head][0] : (a + (b === a.toLowerCase() ? '' : b) + (t && t !== b ? t : '') + 'saurus').replace(/(saurus)saurus$/, '$1'); }
function goBuild() {
  G.state = 'build'; show('s-build'); Sound.ambient('museum');
  if (!museum) { museum = buildMuseum(); museum.spin = 0.4; }
  camera.position.set(-2.5, 7.5, 17); camera.lookAt(-1.5, 3, -2);
  if (!BUILD.name) BUILD.name = suggestName(BUILD);
  $('build-name').value = BUILD.name; rebuildHybrid(); setDrawer(-1);
}
function rebuildHybrid() {
  if (BUILD.D) museum.scene.remove(BUILD.D.root);
  const sel = { head: BUILD.head, neck: BUILD.body, body: BUILD.body, tail: BUILD.tail };
  BUILD.D = build3D(sel, { size: 1.0 }); BUILD.D.root.position.set(4, 0.6, -1); museum.scene.add(BUILD.D.root);
  const s = survival(BUILD);
  $('surv-pct').textContent = s.pct + '%'; $('surv-ring').style.setProperty('--p', s.pct);
  const lines = [...s.good.map(t => '✓ ' + t), ...s.bad.map(t => '✗ ' + t)];
  $('surv-why').textContent = lines.length ? lines.map(l => l[0].toUpperCase() === l[0] ? l : l).join('\n') : 'A balanced design.';
  for (const p of ['head', 'body', 'tail']) $('part-' + p).textContent = FACTS[BUILD[p]][0];
  $('speech').textContent = s.pct >= 70 ? 'Splendid! That one should do well out there.' : s.pct >= 45 ? 'Interesting. It might just survive.' : 'Hmm. I would not bet on this one.';
}
function setDrawer(i) {
  BUILD.drawer = BUILD.drawer === i ? -1 : i;
  museum.drawers.forEach((d, k) => (d.target = k === BUILD.drawer ? 1 : 0));
  [...document.querySelectorAll('#drawer-btns button')].forEach((b, k) => { b.classList.toggle('on', k === BUILD.drawer); b.setAttribute('aria-pressed', String(k === BUILD.drawer)); });
  const tray = $('tray'); tray.hidden = BUILD.drawer < 0; $('build-info').hidden = BUILD.drawer >= 0;
  if (BUILD.drawer < 0) { $('speech').textContent = 'Open a drawer to choose a head, a body or a tail.'; return; }
  const part = ['head', 'body', 'tail'][BUILD.drawer];
  $('tray-title').textContent = ['Heads', 'Bodies', 'Tails'][BUILD.drawer] + ' drawer';
  $('speech').textContent = `Pick a ${part} from the drawer.`;
  const cards = $('tray-cards'); cards.innerHTML = '';
  for (const sp of BUILD_SPECIES) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'part' + (BUILD[part] === sp ? ' on' : ''); b.setAttribute('aria-pressed', String(BUILD[part] === sp));
    const c = partCanvas(sp, part, 200, 120); b.append(c); const n = document.createElement('span'); n.textContent = FACTS[sp][0]; b.append(n);
    b.onclick = () => { BUILD[part] = sp; if (!BUILD.renamed) { BUILD.name = suggestName(BUILD); $('build-name').value = BUILD.name; } rebuildHybrid(); setDrawer(-1); };
    cards.append(b);
  }
}
const _partCache = {};
function partCanvas(sp, part, w, h) {
  const key = sp + part, [c, x] = mk(w, h);
  if (!_partCache[key]) {
    const M = assemble(sp), s = 1.4, r = renderBones(M, { scale: s });
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const add = (px, py) => { x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); };
    const tags = part === 'head' ? ['head'] : part === 'body' ? ['body', 'neck'] : ['tail'];
    M.S.forEach(q => { if (tags.includes(q.tag)) { add(q.x - q.t, q.y - q.t * 1.6); add(q.x + q.t, q.y + q.b); } });
    if (part === 'body') { add(x0, 0); if (M.B.plates) add(x0, y0 - 40); }
    if (part === 'head') { const Hd = M.Hd; if (Hd.frill) add(M.hb.x + Hd.frill.cx - Hd.frill.rx, M.hb.y + Hd.frill.cy - Hd.frill.ry); if (Hd.horns) for (const [hx, hy, a, l] of Hd.horns) add(M.hb.x + hx + Math.cos(a) * l, M.hb.y + hy + Math.sin(a) * l); if (Hd.crest) add(M.hb.x + Hd.crest[1][0] - 6, M.hb.y + Hd.crest[1][1] - 6); }
    if (part === 'tail' && M.T.spikes) add(x0, y0 - 30);
    _partCache[key] = { r, x0, x1, y0, y1, s };
  }
  const P = _partCache[key], pad = 6, sw = (P.x1 - P.x0 + pad * 2) * P.s, sh = (P.y1 - P.y0 + pad * 2) * P.s, k = Math.min(w / sw, h / sh);
  x.drawImage(P.r.canvas, P.r.ax + (P.x0 - pad) * P.s, P.r.ay + (P.y0 - pad) * P.s, sw, sh, (w - sw * k) / 2, (h - sh * k) / 2, sw * k, sh * k);
  return c;
}
function museumClick() {
  if (!museum) return false;
  _ray.setFromCamera({ x: G.pointer.x, y: G.pointer.y }, camera);
  const hits = _ray.intersectObjects(museum.drawers.map(d => d.front), false);
  if (hits.length) { setDrawer(museum.drawers.findIndex(d => d.front === hits[0].object)); Sound.click(); return true; }
  return false;
}
function museumUpdate(dt) {
  museum.spin += dt * 0.25; if (BUILD.D) { BUILD.D.root.rotation.y = museum.spin; BUILD.D.update(dt, 0, 'idle'); }
  for (const d of museum.drawers) { d.open += ((d.target || 0) - d.open) * Math.min(1, dt * 8); d.group.position.z = 1.1 + d.open * 1.5; }
  museum.ring.rotation.z = museum.spin * 0.5;
  // speech bubble follows the paleontologist's head
  const v = museum.pal.localToWorld(V3(0, 5.0, 0)).project(camera), app = $('app');
  const sb = $('speech'); sb.style.left = ((v.x + 1) / 2 * app.clientWidth) + 'px'; sb.style.top = ((1 - v.y) / 2 * app.clientHeight) + 'px';
  const a = museum.pal.userData.armR; if (a) a.rotation.z = -1.1 + 0.08 * Math.sin(performance.now() / 600);
}
function saveDesign() {
  const name = ($('build-name').value || '').trim() || suggestName(BUILD);
  const d = { name: name.slice(0, 28), head: BUILD.head, body: BUILD.body, tail: BUILD.tail };
  G.designs = G.designs.filter(x => x.name !== d.name).concat(d).slice(-20); savePrefs(); return d;
}

/* ---- Print Dino ---- */
const PRINT = { item: { key: 'trike' }, type: 'regular', colour: false, page: 0 };
function goPrint(item) {
  G.state = 'print'; show('s-print'); Sound.ambient(null);
  if (item) PRINT.item = item; renderPicker(); renderPreview();
}
function printItems() { return [...PICTURES.map(k => ({ key: k })), ...G.designs.map(d => ({ design: d }))]; }
const _thumbCache = {};
function renderPicker() {
  const grid = $('pick-grid'); grid.innerHTML = '';
  const items = printItems(), pageItems = PRINT.page === 0 ? items.slice(0, 12) : items.slice(12);
  for (const it of pageItems) {
    const id = it.key || 'd:' + it.design.name, on = PRINT.item.key ? PRINT.item.key === it.key : PRINT.item.design && it.design && PRINT.item.design.name === it.design.name;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pic' + (on ? ' on' : ''); b.setAttribute('aria-pressed', String(!!on));
    if (!_thumbCache[id]) { const [c, x] = mk(180, 110); x.fillStyle = '#ffffff'; x.fillRect(0, 0, 180, 110); pictureFit(x, it.key || { head: it.design.head, neck: it.design.body, body: it.design.body, tail: it.design.tail }, 6, 6, 168, 98, { lw: 1 }); _thumbCache[id] = c.toDataURL(); }
    const img = document.createElement('img'); img.src = _thumbCache[id]; img.alt = ''; b.append(img);
    const n = document.createElement('span'); n.textContent = it.key ? FACTS[it.key][0] : it.design.name; b.append(n);
    b.onclick = () => { PRINT.item = it; renderPicker(); renderPreview(); };
    grid.append(b);
  }
  $('pick-more').textContent = PRINT.page === 0 ? `+ ${items.length - 12} more pictures` : '← First 12 pictures';
}
function printPages() { const it = PRINT.item; return PRINT.type === 'poster' ? pagesPoster(it, PRINT.colour) : PRINT.type === 'tshirt' ? pageTshirt(it, PRINT.colour) : pageRegular(it, PRINT.colour); }
function renderPreview() {
  [...document.querySelectorAll('#ptype button')].forEach(b => { const on = b.dataset.v === PRINT.type; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  [...document.querySelectorAll('#pstyle button')].forEach(b => { const on = (b.dataset.v === 'colour') === PRINT.colour; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  const pages = printPages(), wrap = $('preview'); wrap.innerHTML = ''; wrap.className = 'preview ' + PRINT.type;
  for (const p of pages) { const img = document.createElement('img'); img.src = p.canvas.toDataURL('image/jpeg', 0.85); img.alt = 'Print preview page'; wrap.append(img); }
  $('print-go').textContent = PRINT.type === 'poster' ? 'Save 4-page PDF' : 'Save PDF to print';
}
async function saveFile(name, blob, previews) {
  if (G.downloads) {
    try { await G.downloads.save({ filename: name, data: blob }); toast('Saved. Open the PDF and print it.'); return; }
    catch (e) { if (e && e.code === 'declined') { toast('Not saved.'); return; } if (e && e.code === 'rate_limited') { toast('A save is already waiting for your answer.'); return; } }
  }
  const box = $('savebox'), list = $('savebox-pages'); list.innerHTML = '';
  for (const c of previews) { const img = document.createElement('img'); img.src = c.toDataURL('image/png'); img.alt = 'Printable page'; list.append(img); }
  box.hidden = false;
}
async function doPrint() {
  const btn = $('print-go'); btn.disabled = true; const label = btn.textContent; btn.textContent = 'Preparing…';
  try {
    const pages = printPages(), blob = await makePDF(pages), I = itemInfo(PRINT.item);
    await saveFile(`${I.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${PRINT.type}.pdf`, blob, pages.map(p => p.canvas));
  } finally { btn.disabled = false; btn.textContent = label; }
}
async function saveCertificate() {
  const R = G.run; G.guide = $('hof-name').value.trim(); savePrefs(); renderCertificate();
  const blob = await makePDF([{ canvas: R.cert, wpt: 792, hpt: 612 }]);
  await saveFile('dinosaur-hall-of-fame.pdf', blob, [R.cert]);
}

/* ---- main loop ---- */
let last = performance.now();
function frame(now) {
  perfSample(now - last, G.state !== 'print' && G.state !== 'loading' && !(G.run && G.run.transit));
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (hintTimer > 0) { hintTimer -= dt; if (hintTimer <= 0) $('hud-hint').hidden = true; }
  if (G.state === 'title' && titleW) { titleW.update(dt, camera); renderer.render(titleW.scene, camera); }
  else if (G.state === 'choose' && showcase) {
    showcase.spin += dt * 0.35; if (showcase.D) { showcase.D.root.rotation.y = showcase.spin; showcase.D.update(dt, 0, 'idle'); }
    const D = showcase.D, d = 6 + (D ? D.length * 0.75 : 6); camera.position.set(-d * 0.55, 3 + (D ? D.hipH : 2), d); camera.lookAt(1.5, (D ? D.hipH : 2) * 0.9, 0);
    renderer.render(showcase.scene, camera);
  }
  else if ((G.state === 'walk' || G.state === 'over' || G.state === 'hof') && G.run && G.run.area) {
    if (!G.paused) walkUpdate(G.state === 'walk' || G.state === 'over' ? dt : 0);
    if (G.state === 'hof') { const p = G.run.player; G.cam.yaw += dt * 0.2; updateCamera(dt, p, p.D, G.run.area); p.D.update(dt, 0, 'idle'); G.run.area.update(dt, p.pos); }
    renderer.render(G.run.area.scene, camera);
  }
  else if (G.state === 'build' && museum) { museumUpdate(dt); renderer.render(museum.scene, camera); }
  requestAnimationFrame(frame);
}

/* ---- wiring ---- */
function wireUI() {
  $('go-walk').onclick = () => goChoose();
  $('go-build').onclick = () => goBuild();
  $('go-print').onclick = () => goPrint();
  [...document.querySelectorAll('#skill button')].forEach(b => (b.onclick = () => { G.skill = +b.dataset.v; savePrefs(); goChoose(); }));
  $('choose-start').onclick = () => startRun();
  $('choose-back').onclick = () => goTitle();
  $('btn-pause').onclick = () => togglePause();
  $('pause-resume').onclick = () => togglePause();
  $('pause-quit').onclick = () => goTitle();
  $('hold-walk').onchange = e => { G.holdToWalk = e.target.checked; savePrefs(); };
  $('fast-gfx').onchange = e => { G.fast = e.target.checked; savePrefs(); applyGraphics(); };
  $('over-retry').onclick = () => { disposeRun(); startRun(); };
  $('over-choose').onclick = () => { disposeRun(); goChoose(); };
  $('over-home').onclick = () => goTitle();
  $('hof-name').oninput = () => renderCertificate();
  $('hof-save').onclick = () => saveCertificate();
  $('hof-again').onclick = () => { G.guide = $('hof-name').value.trim(); savePrefs(); disposeRun(); goChoose(); };
  $('hof-home').onclick = () => { G.guide = $('hof-name').value.trim(); savePrefs(); goTitle(); };
  [...document.querySelectorAll('#drawer-btns button')].forEach((b, i) => (b.onclick = () => setDrawer(i)));
  $('tray-close').onclick = () => setDrawer(-1);
  $('build-name').oninput = e => { BUILD.name = e.target.value; BUILD.renamed = true; };
  $('build-walk').onclick = () => { const d = saveDesign(); goChoose('d:' + d.name); };
  $('build-print').onclick = () => { const d = saveDesign(); goPrint({ design: d }); };
  $('build-back').onclick = () => goTitle();
  $('pick-more').onclick = () => { PRINT.page = PRINT.page ? 0 : 1; renderPicker(); };
  [...document.querySelectorAll('#ptype button')].forEach(b => (b.onclick = () => { PRINT.type = b.dataset.v; renderPreview(); }));
  [...document.querySelectorAll('#pstyle button')].forEach(b => (b.onclick = () => { PRINT.colour = b.dataset.v === 'colour'; renderPreview(); }));
  $('print-go').onclick = () => doPrint();
  $('print-back').onclick = () => goTitle();
  $('savebox-close').onclick = () => ($('savebox').hidden = true);
  $('btn-mute').onclick = () => toggleMute();
  $('pause-sound').onclick = () => toggleMute();
}

async function boot() {
  const hot = window.claude && window.claude.hot;
  loadPrefs(hot && hot.data && hot.data.designs ? hot.data : null);
  if (hot && hot.snapshot) hot.snapshot(() => ({ designs: G.designs, guide: G.guide, skill: G.skill, muted: G.muted, holdToWalk: G.holdToWalk, fast: G.fast }));
  Sound.muted = G.muted; syncMute();
  const setLoad = (f, t) => { $('loadbar').style.width = (f * 100) + '%'; if (t) $('loadtxt').textContent = t; };
  try { initRenderer(); } catch (e) { $('loadtxt').textContent = 'This game needs WebGL, which this browser or device has turned off.'; return; }
  wireUI(); initInput();
  if (window.claude && window.claude.use) window.claude.use('downloads').then(d => { G.downloads = d; }).catch(() => {});
  setLoad(0.1, 'Loading fonts…');
  try { await Promise.race([Promise.all([`900 40px Unbounded`, `800 40px Unbounded`, `500 20px "Instrument Sans"`, `700 20px "Instrument Sans"`, `italic 500 20px "Instrument Sans"`, `italic 700 20px "Instrument Sans"`, `500 20px "IBM Plex Mono"`, `700 20px "IBM Plex Mono"`].map(f => document.fonts.load(f))), new Promise(r => setTimeout(r, 3500))]); } catch (e) {}
  setLoad(0.4, 'Growing the forest…'); await nextFrame();
  titleW = buildTitleScene();
  setLoad(0.8, 'Waking the dinosaurs…'); await nextFrame();
  renderer.compile(titleW.scene, camera);
  setLoad(1); await nextFrame();
  goTitle();
  requestAnimationFrame(frame);
  window.__ready = true;
}
boot();

window.__step = (sec, dt = 0.05) => { for (let t = 0; t < sec; t += dt) { if (G.state === 'walk' || G.state === 'over') walkUpdate(dt); } };
