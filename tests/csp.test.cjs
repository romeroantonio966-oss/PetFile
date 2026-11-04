// Comprueba la política de seguridad con el SDK real de Firebase y jsPDF, sin salir a internet.
const { test, before, after } = require('node:test'); const assert = require('node:assert'); const fs = require('fs'), path = require('path');
const { chromium } = require('playwright'); const { ROOT, serve, testApp, seed, open } = require('./lib/harness.cjs');
const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8'); const CSP = /Content-Security-Policy = "([^"]+)"/.exec(toml)[1];
const META = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(fs.readFileSync(path.join(ROOT, 'www', 'index.html'), 'utf8'))[1];
const directive = (c, d) => (c.split(';').map((x) => x.trim()).find((x) => x.startsWith(d + ' ')) || '');
let b; before(async () => { b = await chromium.launch(); }); after(async () => b.close());
const MOD = (f) => path.join(ROOT, 'node_modules', f);
for (const [n, c] of [['web', CSP], ['app', META]]) test(`CSP ${n}: sin opciones inseguras para scripts`, () => { const s = directive(c, 'script-src'); assert.ok(s); assert.ok(!/unsafe-inline|unsafe-eval|\*|data:|https:(?!\/\/)/.test(s), s); assert.ok(/object-src 'none'/.test(c)); assert.ok(/base-uri 'none'/.test(c)); assert.ok(!/style-src-elem[^;]*unsafe-inline/.test(c)); });
test('HTML público sin scripts, estilos ni manejadores en línea', () => { for (const f of ['index.html', 'privacidad.html', 'terminos.html']) { const h = fs.readFileSync(path.join(ROOT, 'public', f), 'utf8'); assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(h), f + ' script'); assert.ok(!/<style[\s>]/.test(h), f + ' style'); assert.ok(!/\son[a-z]+=["']/.test(h), f + ' handler'); } const js = fs.readFileSync(path.join(ROOT, 'public', 'app.js'), 'utf8'); assert.ok(!/\beval\(|new Function\(|javascript:/.test(js)); });

async function webPage(extra) {
  const s = await serve(path.join(ROOT, 'public'), { 'Content-Security-Policy': CSP });
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-CR', userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36' });
  const seen = [];
  await c.route(/.*/, (r) => { const u = r.request().url(); if (u.startsWith(s.url)) return r.continue(); seen.push(u);
    const m = /gstatic\.com\/firebasejs\/10\.12\.2\/(firebase-[a-z]+-compat\.js)/.exec(u); if (m) return r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(MOD('firebase/' + m[1])) });
    if (u.includes('jspdf.umd.min.js')) return r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(MOD('jspdf/dist/jspdf.umd.min.js')) });
    if (u.includes('fonts.googleapis.com')) return r.fulfill({ contentType: 'text/css', body: "@font-face{font-family:'Instrument Sans';src:url(https://fonts.gstatic.com/x.woff2)}" });
    return r.abort(); });
  await c.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI)); });
  const page = await c.newPage(); page.errs = []; page.on('pageerror', (e) => page.errs.push(e.message)); await page.goto(s.url + '/'); await page.waitForTimeout(1500);
  return { c, s, page, seen };
}
test('Web con CSP: el SDK real de Firebase arranca y muestra el acceso, también con navegador móvil', async () => {
  const { c, s, page, seen } = await webPage(); assert.ok(await page.$('#authform'), 'pantalla de acceso'); assert.deepStrictEqual(page.errs, []);
  const v = await page.evaluate(() => window.__csp); console.log('  bloqueos esperados del SDK:', v.join(' | ') || 'ninguno'); assert.ok(v.every((x) => /apis\.google\.com|firebaseapp\.com/.test(x)), JSON.stringify(v));
  await page.fill('#au-email', 'prueba@example.com'); await page.fill('#au-pw', 'secreto1'); await page.click('#au-go'); await page.waitForTimeout(1200);
  const hosts = seen.filter((u) => /googleapis\.com/.test(u) && !u.includes('fonts.')); assert.ok(hosts.some((u) => u.includes('identitytoolkit.googleapis.com')), 'la CSP deja salir el inicio de sesión (la prueba lo corta antes de internet)');
  const v2 = await page.evaluate(() => window.__csp.filter((x) => x.startsWith('connect-src'))); assert.deepStrictEqual(v2, []); await c.close(); s.srv.close();
});
test('Web con CSP: páginas legales cargan sus archivos y el correo', async () => { const s = await serve(path.join(ROOT, 'public'), { 'Content-Security-Policy': CSP }); const c = await b.newContext(); await c.route(/.*/, (r) => (r.request().url().startsWith(s.url) ? r.continue() : r.abort())); const page = await c.newPage(); await page.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective)); }); for (const f of ['privacidad.html', 'terminos.html']) { await page.goto(`${s.url}/${f}`); await page.waitForTimeout(120); assert.ok((await page.textContent('[data-correo]')).includes('@')); assert.notStrictEqual(await page.evaluate(() => getComputedStyle(document.querySelector('.card')).borderRadius), ''); assert.deepStrictEqual(await page.evaluate(() => window.__csp), []); } await c.close(); s.srv.close(); });

let app; before(async () => { app = await serve(testApp()); }); after(() => app.srv.close());
test('App con CSP: flujos normales sin bloqueos', async () => {
  const d = seed(true); d.db['families/u1/pets/p'] = { id: 'p', name: 'Canela', species: 'Perro', photo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/AAwAEAQGA2QjRxQAAAABJRU5ErkJggg==', entries: [{ id: 'e', type: 'cita', title: 'Vet', date: '2031-01-01T10:00' }] };
  const { c, page, external } = await open(b, app.url, d, { native: true }); for (const v of ["go('home')", "go('agenda')", "go('mascotas')", "go('familia')", "go('ayuda')", "go('pet','p')", 'accountSheet()']) { await page.E(v); await page.waitForTimeout(60); }
  await page.evaluate(() => { document.querySelector('#layer').innerHTML = ''; window.__dl = 0; HTMLAnchorElement.prototype.click = function () { if (this.download) window.__dl++; }; });
  await page.click('[data-act=export]'); await page.waitForTimeout(60); await page.click('[data-act=exp-pdf]'); await page.waitForTimeout(900);
  assert.strictEqual(await page.evaluate(() => window.__dl), 1, 'jsPDF genera el PDF con CSP'); assert.deepStrictEqual(await page.evaluate(() => window.__csp), []); assert.deepStrictEqual(page.errs, []); assert.deepStrictEqual(external, []);
  assert.ok(await page.evaluate(() => getComputedStyle(document.querySelector('.topbar')).position !== '' && document.fonts.check("700 20px 'Bricolage Grotesque'"))); await c.close();
});
test('App con CSP: un script inyectado queda bloqueado aunque falle el escape', async () => {
  const { c, page } = await open(b, app.url, seed(true), { native: true });
  await page.evaluate(() => { const d = document.createElement('div'); d.innerHTML = '<img src=x onerror="window.__xss=1"><a id=l href="javascript:window.__xss=2">x</a>'; document.body.appendChild(d); document.getElementById('l').click(); const s = document.createElement('script'); s.textContent = 'window.__xss=3'; document.body.appendChild(s); const r = document.createElement('script'); r.src = 'https://evil.example/a.js'; document.body.appendChild(r); }); await page.waitForTimeout(250);
  assert.strictEqual(await page.evaluate(() => window.__xss || 0), 0); const v = await page.evaluate(() => window.__csp.join(' ')); assert.ok(v.includes('script-src')); await c.close();
});
