// Screenshot headless di un gioco del repo, per controllare personaggi ed effetti.
//
// Uso:
//   node .claude/skills/game-visuals/scripts/shoot.js <file.html> <out.png> [opzioni]
// Opzioni:
//   --wait <ms>          attesa prima dello screenshot (default 2500)
//   --click <selettore>  clic prima di attendere (es. '#start', '#mSandbox')
//   --keys <tasti>       tasti da premere in sequenza, separati da virgola (es. 'Enter,Enter,KeyD')
//   --eval <js>          codice eseguito nella pagina dopo clic e tasti (es. "__iron.setBiome('snow')")
//   --until <js>         aspetta finché l'espressione è vera (es. "Math.max(...flashL.map(l=>l.intensity))>25")
//   --three <percorso>   three.min.js locale da usare al posto di cdnjs (utile senza rete)
//   --size <WxH>         dimensione della finestra (default 1280x720)
//
// Richiede Playwright con Chromium. WebGL headless usa swiftshader.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const file = args[0], out = args[1];
if (!file || !out) { console.error('uso: node shoot.js <file.html> <out.png> [opzioni]'); process.exit(1); }
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const [w, h] = (opt('size') || '1280x720').split('x').map(Number);

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  if (opt('three')) {
    const body = fs.readFileSync(opt('three'));
    await page.route('**/three.min.js', r => r.fulfill({ body, contentType: 'text/javascript' }));
  }
  await page.goto('file://' + path.resolve(file));
  await page.waitForTimeout(1200);
  if (opt('click')) { await page.click(opt('click')); await page.waitForTimeout(400); }
  for (const k of (opt('keys') || '').split(',').filter(Boolean)) { await page.keyboard.press(k); await page.waitForTimeout(500); }
  if (opt('eval')) await page.evaluate(opt('eval'));
  if (opt('until')) await page.waitForFunction(opt('until'), null, { timeout: 60000, polling: 50 });
  else await page.waitForTimeout(Number(opt('wait') || 2500));
  await page.screenshot({ path: out });
  console.log(errors.length ? errors.join('\n') : 'nessun errore');
  await browser.close();
})();
