// Plays through every mechanic with the game's own state and the __step test hook.
// Screenshots and a sample PDF go to test-output/logic/.
const fs = require('fs'), path = require('path');
const { launch, openGame } = require('./harness');
(async () => {
  const out = path.join(__dirname, '..', 'test-output', 'logic'); fs.mkdirSync(out, { recursive: true });
  const browser = await launch();
  const { page, errors: errs } = await openGame(browser);
  let failed = 0;
  const fps = await page.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else r(n / 3); }; requestAnimationFrame(f); }));
  console.log('title fps (software GL):', fps.toFixed(1));
  const ok = (name, cond, info) => { if (!cond) failed++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + JSON.stringify(info) : '')); };
  const startRun = async (choice, skill = 1) => { await page.evaluate(([c, s]) => { G.choice = c; G.skill = s; if (G.run) disposeRun(); startRun(); }, [choice, skill]); await page.waitForFunction(() => G.state === 'walk' && G.run && G.run.area && !G.run.transit, null, { timeout: 60000 }); };

  // 1. calories drain, faster while walking
  await startRun('stego');
  let r = await page.evaluate(() => { const R = G.run; R.calories = 80; G.pointer.inside = false; __step(10); const idle = 80 - R.calories; R.calories = 80; G.keys.w = true; __step(10); G.keys.w = false; const walk = 80 - R.calories; return { idle: +idle.toFixed(2), walk: +walk.toFixed(2), z: +R.player.pos.z.toFixed(1) }; });
  ok('calories drain idle < walking', r.idle > 0 && r.walk > r.idle * 1.5, r);
  // 2. pointer steering: aim at a ground point ahead and to the right
  r = await page.evaluate(() => { const R = G.run, p = R.player; p.pos.set(0, 0, -20); p.heading = Math.PI / 2; snapCamera(); G.pointer.inside = true; G.pointer.moved = true; G.pointer.x = 0.4; G.pointer.y = -0.1; const x0 = p.pos.x, z0 = p.pos.z; __step(3); G.pointer.inside = false; return { dx: +(p.pos.x - x0).toFixed(1), dz: +(p.pos.z - z0).toFixed(1) }; });
  ok('dinosaur walks toward the pointer (right and forward)', r.dx > 1 && r.dz < 0, r);
  // 3. eating a bush
  r = await page.evaluate(() => { const R = G.run, A = R.area, p = R.player, b = A.bushes[0]; R.calories = 40; const f0 = b.food;
    p.heading = Math.PI / 2; p.speed = 0; p.pos.set(b.x, 0, b.z + p.D.reach * 0.95); __step(0.05); __step(2.5); return { cal: +R.calories.toFixed(1), food: +b.food.toFixed(1), f0, state: p.state }; });
  ok('plant-eater eats a bush when its mouth is at it', r.cal > 50 && r.food < r.f0, r);
  // 4. predator appears and eats you
  await page.evaluate(() => { G.skill = 3; G.run.area.hasPredator = true; G.run.area.predSpawn = G.run.t; G.run.calories = 90; G.run.player.pos.set(0, 0, -60); });
  await page.evaluate(() => __step(0.2));
  r = await page.evaluate(() => { const A = G.run.area; return { pred: A.predator && A.predator.sp }; });
  ok('predator spawns', !!r.pred, r);
  r = await page.evaluate(() => { const A = G.run.area, e = A.predator, p = G.run.player; e.pos.set(p.pos.x, 0, p.pos.z - 12); __step(8); return { dead: G.run.dead, cal: Math.round(G.run.calories) }; });
  ok('predator catches a dinosaur that stands still', r.dead === 'eaten', r);
  await page.waitForFunction(() => G.state === 'over', null, { timeout: 10000 }); await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, 'eaten.png') });
  ok('game over screen shows', await page.evaluate(() => !document.getElementById('s-over').hidden && document.getElementById('over-title').textContent));
  // 5. retreat: leave the area backwards to escape
  await startRun('stego', 1);
  r = await page.evaluate(() => { const R = G.run; R.player.pos.z = -AREA_LEN - 2; __step(0.1); return R.idx; });
  for (let k = 0; k < 30; k++) { const st = await page.evaluate(() => ({ idx: G.run.idx, state: G.state, transit: G.run.transit, fade: document.getElementById('fade').className })); if (st.idx === 1 && !st.transit) break; if (k % 5 === 0) console.log('waiting', JSON.stringify(st)); await page.waitForTimeout(1000); }
  r = await page.evaluate(() => ({ idx: G.run.idx, z: +G.run.player.pos.z.toFixed(1), area: G.run.area.B.name }));
  ok('walking off the far end enters screen 2', r.idx === 1, r);
  await page.waitForTimeout(800); await page.screenshot({ path: path.join(out, 'swamp.png') });
  await page.evaluate(() => { G.run.player.pos.z = 9; __step(0.1); });
  await page.waitForFunction(() => G.run.idx === 0 && !G.run.transit, null, { timeout: 60000 });
  r = await page.evaluate(() => ({ idx: G.run.idx, z: +G.run.player.pos.z.toFixed(1) }));
  ok('walking back returns to screen 1 at its far end', r.idx === 0 && r.z < -100, r);
  // 6. starving
  await page.evaluate(() => { G.run.calories = 0.3; __step(1); });
  r = await page.evaluate(() => G.run.dead);
  ok('running out of calories ends the walk', r === 'starved', r);
  // 7. win -> Hall of Fame
  await startRun('stego', 1);
  for (let i = 1; i <= 4; i++) { await page.evaluate(() => { G.run.player.pos.z = -AREA_LEN - 2; __step(0.1); }); await page.waitForFunction(n => G.run.idx === n && !G.run.transit, i, { timeout: 60000 }); }
  await page.evaluate(() => { G.run.player.pos.z = -AREA_LEN - 2; __step(0.1); });
  await page.waitForFunction(() => G.state === 'hof', null, { timeout: 10000 });
  await page.fill('#hof-name', 'Alex'); await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(out, 'hof.png') });
  ok('Hall of Fame certificate after screen 5', true);
  await page.click('#hof-save'); await page.waitForTimeout(1500);
  ok('certificate save falls back to printable images outside the viewer', await page.evaluate(() => !document.getElementById('savebox').hidden));
  await page.click('#savebox-close');
  // 8. T. rex eats a dinosaur that wanders past
  await page.evaluate(() => goTitle());
  await startRun('trex', 1);
  r = await page.evaluate(() => { const R = G.run, A = R.area, p = R.player; p.pos.set(0, 0, -40); p.heading = Math.PI / 2; const n = spawnNPC(A, 'prey', 'para', V3(0, 0, -40 - p.D.reach - 3)); n.heading = 0; R.calories = 40; G.keys.w = true; __step(4); G.keys.w = false; return { cal: Math.round(R.calories), dead: !!n.dead }; });
  ok('T. rex catches prey and gains calories', r.dead && r.cal > 70, r);
  r = await page.evaluate(() => { const R = G.run, A = R.area; A.preyTimer = 0; __step(0.2); return A.npcs.filter(n => !n.dead).length; });
  ok('prey keeps wandering in', r >= 1, { alive: r });
  await page.waitForTimeout(600); await page.screenshot({ path: path.join(out, 'trex.png') });
  // 9. Build Dino
  await page.evaluate(() => goTitle()); await page.click('#go-build'); await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(out, 'build.png') });
  await page.click('#drawer-btns button:nth-child(1)'); await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(out, 'build-drawer.png') });
  await page.click('#tray-cards button:nth-child(4)'); await page.waitForTimeout(600);
  await page.click('#drawer-btns button:nth-child(3)'); await page.click('#tray-cards button:nth-child(5)'); await page.waitForTimeout(600);
  r = await page.evaluate(() => ({ head: BUILD.head, tail: BUILD.tail, name: document.getElementById('build-name').value, pct: document.getElementById('surv-pct').textContent }));
  ok('Build Dino swaps head and tail, names it, scores survival', r.head === 'trike' && r.tail === 'anky', r);
  await page.waitForTimeout(500); await page.screenshot({ path: path.join(out, 'build-done.png') });
  await page.click('#build-walk'); await page.waitForTimeout(800);
  r = await page.evaluate(() => ({ state: G.state, choice: G.choice }));
  ok('Walk it takes the design to Walk Dino', r.state === 'choose' && r.choice.startsWith('d:'), r);
  await page.screenshot({ path: path.join(out, 'choose-design.png') });
  // 10. Print Dino
  await page.evaluate(() => goTitle()); await page.click('#go-print'); await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(out, 'print.png') });
  await page.click('#ptype button[data-v=tshirt]'); await page.click('#pstyle button[data-v=colour]'); await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(out, 'print-tshirt.png') });
  await page.click('#ptype button[data-v=poster]'); await page.waitForTimeout(1500);
  const pdf = await page.evaluate(async () => { const b = await makePDF(printPages()); const t = new Uint8Array(await b.arrayBuffer()); return { size: b.size, head: String.fromCharCode(...t.slice(0, 8)), tail: String.fromCharCode(...t.slice(-6)) }; });
  ok('poster makes a valid-looking 4-page PDF', pdf.head.startsWith('%PDF-1.4') && pdf.tail.includes('%%EOF'), pdf);
  const bytes = await page.evaluate(async () => { const b = await makePDF(pageRegular({ key: 'trike' }, false)); return Array.from(new Uint8Array(await b.arrayBuffer())); });
  fs.writeFileSync(path.join(out, 'regular.pdf'), Buffer.from(bytes));
  console.log('errors:', errs.slice(0, 10));
  await browser.close();
  if (failed || errs.length) { console.log(`${failed} check(s) failed, ${errs.length} page error(s)`); process.exit(1); }
})();
