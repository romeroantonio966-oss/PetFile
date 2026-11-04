// Sirve una copia de la app con Firebase simulado: las pruebas nunca salen a internet.
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const ROOT = path.join(__dirname, '..', '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/json' };

function serve(dir, headers = {}) {
  return new Promise((ok) => {
    const srv = http.createServer((q, r) => {
      let p = q.url.split('?')[0]; if (p === '/') p = '/index.html';
      const f = path.join(dir, path.normalize(p));
      if (!f.startsWith(dir) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', ...headers });
      fs.createReadStream(f).pipe(r);
    }).listen(0, () => ok({ srv, url: `http://localhost:${srv.address().port}` }));
  });
}
// Copia de www con el Firebase simulado y un acceso a las funciones internas para las pruebas.
// Sin CSP se prueba el escape por sí solo; con CSP, la segunda barrera.
function testApp({ csp = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'petfile-test-'));
  fs.cpSync(path.join(ROOT, 'www'), dir, { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'fake-firebase.js'), path.join(dir, 'vendor', 'fake.js'));
  let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  if (!csp) html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\r?\n?/, '');
  html = html.replace(/<script src="vendor\/firebase-(auth|firestore|storage)-compat\.js"[^>]*><\/script>\r?\n?/g, '').replace('vendor/firebase-app-compat.js', 'vendor/fake.js');
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  let js = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');
  if (!js.includes('fromHash();connect();')) throw new Error('No se encontró el arranque de la app');
  js = js.replace('fromHash();connect();', 'window.__E=x=>eval(x);\nfromHash();connect();');
  fs.writeFileSync(path.join(dir, 'app.js'), js);
  return dir;
}
const ts = (days) => ({ __ts: Date.now() + days * 864e5 });
function seed(paid) {
  return {
    db: {
      'users/u1': { email: 'a@b.co', name: 'Ana', lang: 'es', trialStart: ts(-30), familyId: 'u1' },
      'families/u1': Object.assign({ owner: 'u1', members: ['u1'], memberInfo: { u1: { name: 'Ana', email: 'a@b.co' } }, code: 'K7M2QX', name: 'Ana', trialStart: ts(-30) }, paid ? { paidUntil: ts(30) } : {}),
      'invites/K7M2QX': { familyId: 'u1', ownerName: 'Ana' },
    },
    users: { 'a@b.co': { uid: 'u1', email: 'a@b.co', pw: 'secreto1', name: 'Ana' } },
  };
}
async function open(browser, base, s, opt = {}) {
  const c = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: opt.locale || 'es-CR' });
  const external = [];
  await c.route(/.*/, (r) => { const u = r.request().url(); if (u.startsWith(base)) return r.continue(); external.push(u); return r.abort(); });
  if (opt.native) await c.addInitScript(() => { window.Capacitor = { isNativePlatform: () => true, Plugins: {} }; });
  await c.addInitScript((d) => {
    if (d.seed && !localStorage.getItem('FK_DB')) { localStorage.setItem('FK_DB', JSON.stringify(d.seed.db)); localStorage.setItem('FK_USERS', JSON.stringify(d.seed.users)); }
    if (d.as) sessionStorage.setItem('FK_UID', d.as);
    window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));
  }, { seed: s, as: opt.as === undefined ? 'u1' : opt.as });
  const page = await c.newPage(); page.errs = []; page.on('pageerror', (e) => page.errs.push(e.message));
  await page.goto(base + '/'); await page.waitForTimeout(400);
  page.E = (x) => page.evaluate((y) => window.__E(y), x);
  return { c, page, external };
}
module.exports = { ROOT, serve, testApp, seed, open, ts };
