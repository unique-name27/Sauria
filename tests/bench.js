// Draw calls, triangles and render time for the title and each of the five screens.
// Software WebGL is far slower than a real GPU, so compare runs against each other, not against 60 fps.
const { launch, openGame } = require('./harness');
(async () => {
  const browser = await launch();
  const { page } = await openGame(browser);
  const measure = () => page.evaluate(() => {
    const gl = renderer.getContext(), px = new Uint8Array(4), sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const scene = G.state === 'title' ? titleW.scene : G.run.area.scene;
    renderer.setPixelRatio(1); renderer.render(scene, camera); sync();
    const info = { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
    const t0 = performance.now(); for (let i = 0; i < 4; i++) { renderer.render(scene, camera); sync(); }
    info.msPerFrame = Math.round((performance.now() - t0) / 4);
    return info;
  });
  await page.evaluate(() => { G.paused = true; });
  console.log('title     ', JSON.stringify(await measure()));
  await page.evaluate(() => { G.choice = 'stego'; G.skill = 1; startRun(); });
  await page.waitForFunction(() => G.state === 'walk' && G.run && G.run.area && !G.run.transit, null, { timeout: 60000 });
  for (let i = 0; i < 5; i++) {
    if (i > 0) { await page.evaluate(i => enterArea(i, 'south'), i); await page.waitForFunction(i => G.run.idx === i && !G.run.transit, i, { timeout: 60000 }); }
    await page.evaluate(() => { G.paused = true; const p = G.run.player; p.pos.set(0, G.run.area.hAt(0, -30), -30); p.D.root.position.copy(p.pos); G.run.area.update(0.016, p.pos); snapCamera(); });
    console.log(`screen ${i + 1}  `, JSON.stringify(await measure()));
  }
  await browser.close();
})();
