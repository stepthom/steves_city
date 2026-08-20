/* Boots Steve's City headlessly for testing.
 *
 * The game loads three.js from a CDN via an importmap. Tests run offline, so we
 * vendor three from node_modules, rewrite the importmap in a throwaway copy of
 * index.html, serve the folder over http, and drive the page with Playwright.
 *
 * Nothing here touches your real index.html — it reads it and writes a patched
 * copy into a temp build dir.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');           // the repo folder (index.html lives here)
const GAME = path.join(ROOT, 'index.html');
const BUILD = path.join(__dirname, '.build');          // throwaway test build

function locateThree(){
  // resolve three from node_modules without depending on its package "exports"
  const main = require.resolve('three');                 // e.g. .../three/build/three.cjs
  let base = path.dirname(main);
  if(path.basename(base) === 'build') base = path.dirname(base);
  const three = {
    module: path.join(base, 'build', 'three.module.js'),
    addons: path.join(base, 'examples', 'jsm'),
  };
  if(!fs.existsSync(three.module)) throw new Error('three.module.js not found at ' + three.module + ' — run `npm install`');
  return three;
}

function prepareBuild(){
  if(!fs.existsSync(GAME)) throw new Error('Cannot find index.html at ' + GAME);
  fs.rmSync(BUILD, {recursive:true, force:true});
  fs.mkdirSync(path.join(BUILD, 'vendor'), {recursive:true});
  const three = locateThree();
  fs.copyFileSync(three.module, path.join(BUILD, 'vendor', 'three.module.js'));
  fs.cpSync(three.addons, path.join(BUILD, 'vendor', 'addons'), {recursive:true});
  let html = fs.readFileSync(GAME, 'utf-8');
  html = html
    .replace('https://unpkg.com/three@0.160.0/build/three.module.js', './vendor/three.module.js')
    .replace('https://unpkg.com/three@0.160.0/examples/jsm/', './vendor/addons/');
  fs.writeFileSync(path.join(BUILD, 'game.html'), html);
  // copy the saved test city if present, so tests can load a known scenario
  const city = path.join(ROOT, 'test_paths.json');
  if(fs.existsSync(city)) fs.copyFileSync(city, path.join(BUILD, 'test_paths.json'));
  return { hasCity: fs.existsSync(city) };
}

const MIME = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json'};
function serve(dir){
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const f = path.join(dir, u === '/' ? 'game.html' : u);
    if(!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, {'Content-Type': MIME[path.extname(f)] || 'application/octet-stream'});
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({server, port: server.address().port})));
}

async function launch(){
  const { chromium } = require('playwright');
  const opts = { args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] };
  // allow pointing at a preinstalled chromium via env (CI / sandboxes)
  if(process.env.CHROMIUM_PATH) opts.executablePath = process.env.CHROMIUM_PATH;
  return chromium.launch(opts);
}

// Boot the page and (optionally) load the saved test city. Returns {browser,page,close,errors}.
async function boot({ loadCity = false } = {}){
  const { hasCity } = prepareBuild();
  const { server, port } = await serve(BUILD);
  const browser = await launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if(m.type() === 'error' && !m.text().includes('404')) errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://127.0.0.1:' + port + '/game.html');
  // interval polling: the WebGL render loop starves requestAnimationFrame polling under swiftshader
  await page.waitForFunction(
    () => !!(window.__city && window.__city.agents && window.__city.tripPlan),
    null, { polling: 200, timeout: 45000 });
  if(loadCity){
    if(!hasCity) throw new Error('test_paths.json not found next to index.html — cannot load the saved test city');
    const city = JSON.parse(fs.readFileSync(path.join(BUILD, 'test_paths.json'), 'utf-8'));
    // stash the raw save so tests can reload the exact scenario after fuzzing
    await page.evaluate(c => { window.__savedCity = c; window.__city.applyCity(c); }, city);
  }
  const close = async () => { await browser.close(); server.close(); };
  return { browser, page, close, errors };
}

module.exports = { boot };
