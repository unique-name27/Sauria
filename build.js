// Bundles src/ into one self-contained page.
//   dist/sauria.html  the page body (what the Claude artifact publishes)
//   dist/index.html   a standalone page you can open in a browser or serve from GitHub Pages
const fs = require('fs'), path = require('path');
const src = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const ORDER = ['lib.js', 'dino.js', 'art.js', 'world.js', 'vox.js', 'd3.js', 'env3d.js', 'print.js', 'audio.js', 'game3d.js'];
const js = ORDER.map(src).join('\n');
if (js.includes('</script')) throw new Error('a script contains </script, which would end the inline block early');
const body = src('page.html').replace('/*__SCRIPTS__*/', () => js);
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'sauria.html'), body);
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>' + body + '</body></html>');
console.log(`built dist/ (${Math.round(body.length / 1024)} KB)`);
