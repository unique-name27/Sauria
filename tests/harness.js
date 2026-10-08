// Opens the built game in headless Chromium with software WebGL.
// three.js is served from node_modules so the tests don't depend on the CDN.
// Set NO_FONTS=1 to stub out Google Fonts when offline.
const path = require('path');
const { chromium } = require('playwright');

const THREE_JS = process.env.THREE_PATH || require.resolve('three/build/three.min.js');
const GAME = 'file://' + path.resolve(__dirname, '..', 'dist', 'index.html');

async function launch() {
  return chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
}

async function openGame(browser, pageOptions = {}) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, ...pageOptions });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\/three\.min\.js/, r => r.fulfill({ path: THREE_JS, headers: { 'content-type': 'application/javascript' } }));
  if (process.env.NO_FONTS) await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  await page.goto(GAME);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  return { page, errors };
}

module.exports = { launch, openGame };
