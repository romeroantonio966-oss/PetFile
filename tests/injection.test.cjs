// Barrido de inyección: varias cargas en todos los campos, todas las pantallas, entre dos integrantes.
const { test, before, after } = require('node:test'); const assert = require('node:assert');
const { chromium } = require('playwright'); const { serve, testApp, seed, open } = require('./lib/harness.cjs');
const PAYLOADS = [
  '"><img src=x onerror="window.__xss=1">', "'><svg onload='window.__xss=1'>", '</textarea><script>window.__xss=1</script>', '</style><img src=x onerror=window.__xss=1>',
  '" onmouseover="window.__xss=1" x="', "' autofocus onfocus='window.__xss=1' x='", '`${window.__xss=1}`', '<iframe srcdoc="<script>parent.__xss=1</script>"></iframe>',
  'javascript:window.__xss=1', '<a href="javascript:window.__xss=1" id="pwn">x</a>', '&lt;img src=x onerror=window.__xss=1&gt;', '<details open ontoggle=window.__xss=1>', '<math><mtext></mtext><img src=x onerror=window.__xss=1></math>',
];
const SWEEP = `(()=>{const bad=[];document.querySelectorAll('body *').forEach(e=>{if(['SCRIPT'].includes(e.tagName)&&!e.src&&e.textContent.includes('__xss'))bad.push('script');if(e.tagName==='IFRAME'||e.tagName==='OBJECT'||e.tagName==='EMBED')bad.push(e.tagName);for(const a of e.attributes){if(/^on/i.test(a.name))bad.push(e.tagName+'['+a.name+']');if(/^\\s*javascript:/i.test(a.value)&&/^(href|src|action|formaction|xlink:href)$/i.test(a.name))bad.push(a.name+'=js');if(a.name==='src'&&a.value==='x')bad.push('img inyectada')}});return bad})()`;
const SCREENS = ["go('home')", "go('mascotas')", "go('agenda')", "go('familia')", "go('ayuda')", "go('pet','p')", "(state.filter='todo',render())", 'exportSheet(state.pets.p)', 'petForm(state.pets.p)', "typePicker(state.pets.p)", 'accountSheet()', "entryForm(state.pets.p,'consulta',state.pets.p.entries[0])", "entryForm(state.pets.p,'dieta',state.pets.p.entries[1])", 'premiumSheet()', '(window.print=()=>{},printHistory(state.pets.p))'];
let b, s; before(async () => { b = await chromium.launch(); s = await serve(testApp({ csp: false })); }); after(async () => { await b.close(); s.srv.close(); });
function hostile(x) {
  const d = seed(true); const o = d.db['families/u1'];
  Object.assign(o, { members: ['u1', 'm2'], name: x, memberInfo: { u1: { name: 'Ana', email: 'a@b.co' }, m2: { name: x, email: x } } });
  d.db['families/u1/pets/p'] = { id: 'p', name: x, species: x, speciesOther: x, breed: x, weight: x, sex: x, birth: x, photo: x, entries: [
    { id: x, type: 'consulta', title: x, date: x, next: x, end: x, dose: x, freq: x, vet: x, notes: x, photos: [{ url: x, path: x }] }, { id: 'di', type: 'dieta', title: x, date: '2031-01-02', ingredients: x, steps: x, dose: x, freq: x },
    { id: 'ci', type: 'cita', title: x, date: '2031-01-02T10:00', notes: x, vet: x }, { id: 'va', type: 'vacuna', title: x, date: '2026-01-01', next: '2031-01-03' }, { id: 'me', type: 'med', title: x, date: '2026-01-01', end: '2031-01-04', dose: x, freq: x }, { id: 'ty', type: x, title: x, date: '2026-01-01' } ] };
  d.db['families/u1/recetas/r1'] = { petId: 'p', title: x, date: '2026-01-01', vet: x, notes: x, thumb: x }; return d;
}
PAYLOADS.forEach((x, i) => test(`Inyección ${i + 1}: ${x.slice(0, 42)}`, async () => {
  const { c, page } = await open(b, s.url, hostile(x)); const found = [];
  for (const v of SCREENS) { await page.E(v).catch((e) => found.push('error ' + v + ': ' + e.message.slice(0, 60))); await page.waitForTimeout(60); const bad = await page.E(SWEEP); if (bad.length) found.push(v + ' -> ' + bad.join(',')); }
  await page.E(`(()=>{lookupCode=async()=>({familyId:'zz',ownerName:${JSON.stringify(x)}});joinSheet('AAAAAA')})()`); await page.waitForTimeout(100); const j = await page.E(SWEEP); if (j.length) found.push('unirse -> ' + j.join(','));
  assert.deepStrictEqual(found, []); assert.strictEqual(await page.evaluate(() => window.__xss || 0), 0); assert.deepStrictEqual(page.errs, []); await c.close();
}));
test('Entre integrantes: lo que escribe uno no ejecuta código en el otro, en vivo', async () => {
  const d = seed(true); Object.assign(d.db['families/u1'], { members: ['u1', 'u2'], memberInfo: { u1: { name: 'Ana' }, u2: { name: 'Beto' } } }); d.users['b@b.co'] = { uid: 'u2', email: 'b@b.co', pw: 'x', name: 'Beto' }; d.db['users/u2'] = { email: 'b@b.co', name: 'Beto', familyId: 'u1', trialStart: { __ts: 1 } }; d.db['families/u1/pets/p'] = { id: 'p', name: 'Canela', species: 'Perro', entries: [] };
  const { c, page: victima } = await open(b, s.url, d); const atacante = await c.newPage(); await atacante.addInitScript(() => sessionStorage.setItem('FK_UID', 'u2')); await atacante.goto(s.url + '/'); await atacante.waitForTimeout(300);
  await victima.E("go('pet','p')"); await atacante.evaluate(async (X) => { const r = firebase.firestore().collection('families/u1/pets').doc('p'); await r.set({ id: 'p', name: X, photo: X, entries: [{ id: X, type: 'consulta', title: X, date: X }] }); }, '"><img src=x onerror="window.__xss=1">'); await victima.waitForTimeout(350); await victima.evaluate(() => __fk.reload()); await victima.waitForTimeout(350);
  assert.ok((await victima.evaluate(() => document.body.innerText)).includes('<img src=x'), 'la víctima recibió el dato'); assert.strictEqual(await victima.evaluate(() => window.__xss || 0), 0); assert.deepStrictEqual(await victima.E(SWEEP), []); await c.close();
});
test('La URL no inyecta: hash y ?familia=', async () => {
  const X = encodeURIComponent('"><img src=x onerror=window.__xss=1>'); const { c, page } = await open(b, s.url, seed(true)); for (const u of [`/?familia=${X}`, `/#mascota-${X}`, `/#${X}`]) { await page.goto(s.url + u); await page.waitForTimeout(250); assert.strictEqual(await page.evaluate(() => window.__xss || 0), 0, u); assert.deepStrictEqual(await page.E(SWEEP), []); } await c.close();
});
test('Idioma manipulado en localStorage no rompe ni inyecta', async () => { const { c, page } = await open(b, s.url, seed(true)); const k = await page.E('LANGKEY'); await page.evaluate((k) => localStorage.setItem(k, '<img src=x onerror=window.__xss=1>'), k); await page.reload(); await page.waitForTimeout(300); assert.strictEqual(await page.evaluate(() => window.__xss || 0), 0); assert.deepStrictEqual(page.errs, []); await c.close(); });
test('Texto de las notificaciones y del PDF queda como texto', async () => { const { c, page } = await open(b, s.url, hostile('<b>x</b>')); const r = await page.E("expRows(state.pets.p)[0]"); assert.ok(typeof r.title === 'string'); assert.deepStrictEqual(page.errs, []); await c.close(); });
test('Sin código dinámico peligroso en el cliente', () => { const js = require('fs').readFileSync(require('path').join(__dirname, '..', 'public', 'app.js'), 'utf8'); assert.ok(!/\beval\s*\(|new Function\s*\(|document\.write|setTimeout\s*\(\s*['"`]|setInterval\s*\(\s*['"`]/.test(js)); });
