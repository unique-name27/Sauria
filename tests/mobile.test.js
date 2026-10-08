// Phone layouts: no sideways scrolling, and the pause menu fits on screen.
const fs = require('fs'), path = require('path');
const { launch, openGame } = require('./harness');
(async () => {
  const out = path.join(__dirname, '..', 'test-output', 'mobile'); fs.mkdirSync(out, { recursive: true });
  const browser = await launch();
  let failed = 0;
  for (const [name, width, height] of [['landscape', 844, 390], ['portrait', 390, 844]]) {
    const { page, errors } = await openGame(browser, { viewport: { width, height }, hasTouch: true, isMobile: true });
    await page.waitForTimeout(600); await page.screenshot({ path: path.join(out, `${name}-title.png`) });
    await page.evaluate(() => { G.choice = 'stego'; startRun(); });
    await page.waitForFunction(() => G.state === 'walk' && G.run && G.run.area && !G.run.transit, null, { timeout: 60000 });
    await page.waitForTimeout(800); await page.screenshot({ path: path.join(out, `${name}-walk.png`) });
    await page.evaluate(() => togglePause()); await page.waitForTimeout(300); await page.screenshot({ path: path.join(out, `${name}-pause.png`) });
    const r = await page.evaluate(() => { const d = document.querySelector('#s-pause .dialog').getBoundingClientRect(); return { scrollW: document.documentElement.scrollWidth, innerW: innerWidth, top: d.top, bottom: d.bottom, innerH: innerHeight }; });
    const ok = r.scrollW <= r.innerW && r.top >= 0 && r.bottom <= r.innerH && !errors.length;
    if (!ok) failed++;
    console.log((ok ? 'PASS ' : 'FAIL ') + name, JSON.stringify(r), errors.length ? errors : '');
    await page.close();
  }
  await browser.close();
  if (failed) process.exit(1);
})();
