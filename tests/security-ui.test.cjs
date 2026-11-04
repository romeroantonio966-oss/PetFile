// Regresión de E-02 (XSS guardado), E-09 (datos mal formados) y flujos legítimos de la interfaz.
const { test, before, after } = require('node:test'); const assert = require('node:assert');
const { chromium } = require('playwright'); const { serve, testApp, seed, open } = require('./lib/harness.cjs');
const X = '"><img src=x onerror="window.__xss=(window.__xss||0)+1">';
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/AAwAEAQGA2QjRxQAAAABJRU5ErkJggg==';
let b, s;
before(async () => { b = await chromium.launch(); s = await serve(testApp({ csp: false })); });
after(async () => { await b.close(); s.srv.close(); });
const VIEWS = ["go('home')", "go('agenda')", "go('mascotas')", "go('pet','p')", "petForm(state.pets.p)", "(window.print=()=>{},printHistory(state.pets.p))"];
async function attack(pet, extra) {
  const d = seed(true); d.db['families/u1/pets/p'] = Object.assign({ id: 'p', name: 'B', species: 'Perro', entries: [] }, pet); if (extra) extra(d);
  const { c, page } = await open(b, s.url, d); let hits = 0;
  for (const v of VIEWS) { await page.E(v).catch(() => {}); await page.waitForTimeout(90); hits += await page.evaluate(() => window.__xss || 0); await page.evaluate(() => { document.querySelector('#layer').innerHTML = ''; }); }
  const errs = page.errs.slice(); await c.close(); return { hits, errs };
}
const E = (o) => ({ entries: [Object.assign({ id: 'e', type: 'consulta', title: 't', date: '2030-01-01' }, o)] });
const CASES = {
  'pet.photo (reproducido)': { photo: X }, 'entry.id (reproducido)': E({ id: X }), 'entry.date (reproducido)': E({ date: X }),
  'photo javascript:': { photo: 'javascript:window.__xss=1' }, 'photo svg': { photo: 'data:image/svg+xml;base64,PHN2Zy8+' }, 'photo con comillas': { photo: 'data:image/png;base64,AAA"onerror="window.__xss=1' },
  'pet.name': { name: X }, 'pet.species': { species: X }, 'especie otra': { species: 'Otro', speciesOther: X }, 'pet.breed': { breed: X }, 'pet.weight': { weight: X }, 'pet.sex': { sex: X }, 'pet.birth': { birth: X },
  'entry.title': E({ title: X }), 'entry.dateT': E({ type: 'cita', date: '2030-01-01T10:00' + X }), 'entry.next': E({ type: 'vacuna', next: '2030-01-01' + X }), 'entry.end': E({ type: 'med', end: '2030-01-01' + X }),
  'entry.notes': E({ notes: X }), 'entry.vet': E({ vet: X }), 'entry.dose': E({ type: 'med', dose: X }), 'entry.freq': E({ type: 'med', freq: X }), 'entry.ingredients': E({ type: 'dieta', ingredients: X, steps: X }), 'entry.type': E({ type: X }),
  'entry.photos.url': E({ photos: [{ url: X, path: 'x' }] }),
};
for (const [n, pet] of Object.entries(CASES)) test('XSS bloqueado: ' + n, async () => { const r = await attack(pet); assert.strictEqual(r.hits, 0); assert.deepStrictEqual(r.errs, []); });
test('XSS bloqueado: receta antigua (miniatura e id)', async () => { const r = await attack({}, (d) => { d.db['families/u1/recetas/' + 'r1'] = { petId: 'p', title: X, date: '2030-01-01', thumb: X, vet: X, notes: X }; }); assert.strictEqual(r.hits, 0); });
test('XSS bloqueado: nombres de integrantes, cuenta e invitación', async () => {
  const d = seed(true); Object.assign(d.db['families/u1'], { members: ['u1', 'x"><img src=x onerror=window.__xss=1>'], name: X, memberInfo: { u1: { name: 'Ana', email: 'a@b.co' }, 'x"><img src=x onerror=window.__xss=1>': { name: X, email: X } } });
  const { c, page } = await open(b, s.url, d); await page.E("go('familia')"); await page.waitForTimeout(120); await page.E('accountSheet()'); await page.waitForTimeout(120);
  await page.evaluate(() => { document.querySelector('#layer').innerHTML = ''; });
  await page.evaluate(() => document.querySelector('[data-act=fam-remove]').click()); await page.waitForTimeout(80);
  await page.E(`(()=>{lookupCode=async()=>({familyId:'zz',ownerName:${JSON.stringify(X)}});joinSheet('AAAAAA')})()`); await page.waitForTimeout(150);
  assert.strictEqual(await page.evaluate(() => window.__xss || 0), 0); assert.deepStrictEqual(page.errs, []); await c.close();
});
test('Datos mal formados no rompen la app', async () => {
  const r = await attack({ name: 5, photo: {}, entries: [null, 'x', { id: 'a', type: 'cita', title: 7, date: 123 }, { id: 'b', type: 'vacuna', title: 'T', next: 5 }, { id: 'c', type: 'nada', title: 'T', date: 'x' }, { id: 'd', type: 'consulta', title: 'T', date: '2030-01-01', photos: 'no' }] });
  assert.deepStrictEqual(r.errs, []);
});
test('entries que no es lista no rompe', async () => { const r = await attack({ entries: 'hola' }); assert.deepStrictEqual(r.errs, []); });
test('Legítimo: foto válida se muestra en inicio, ficha y formulario', async () => {
  const d = seed(true); d.db['families/u1/pets/p'] = { id: 'p', name: 'Canela', species: 'Perro', photo: PNG, entries: [] };
  const { c, page } = await open(b, s.url, d); await page.waitForTimeout(100);
  assert.ok(await page.$(`img[src="${PNG}"]`), 'inicio'); await page.E("go('pet','p')"); await page.waitForTimeout(80); assert.ok(await page.$(`.hero img[src="${PNG}"]`), 'ficha');
  await page.E('petForm(state.pets.p)'); await page.waitForTimeout(80); assert.ok(await page.$(`img.ph[src="${PNG}"]`), 'formulario'); await c.close();
});
test('Legítimo: textos con símbolos se ven tal cual, sin doble escape', async () => {
  const d = seed(true); d.db['families/u1/pets/p'] = { id: 'p', name: "Tom & <Jerry> 'O\"", species: 'Perro', entries: [{ id: 'e', type: 'consulta', title: 'A & B', date: '2026-01-15' }] };
  const { c, page } = await open(b, s.url, d); await page.E("go('pet','p')"); await page.waitForTimeout(100); const t = await page.evaluate(() => document.body.innerText);
  assert.ok(t.includes("Tom & <Jerry> 'O\"")); assert.ok(t.includes('A & B')); assert.ok(/15 \S+ 2026/.test(t)); await c.close();
});
test('Legítimo: crear mascota, registro, editar y eliminar', async () => {
  const { c, page } = await open(b, s.url, seed(true));
  await page.click('[data-act=new-pet]'); await page.waitForTimeout(60); await page.fill('#pf-name', 'Canela'); await page.click('#petform button[type=submit]'); await page.waitForTimeout(120);
  await page.click('#fab'); await page.waitForTimeout(60); await page.click('[data-type=cita]'); await page.waitForTimeout(60); await page.fill('#ef-title', 'Vet'); await page.fill('#ef-date', '2031-02-03T10:00'); await page.click('#entform button[type=submit]'); await page.waitForTimeout(120);
  let t = await page.evaluate(() => document.body.innerText); assert.ok(t.includes('Vet') && t.includes('10:00'));
  const id = await page.evaluate(() => { const k = Object.keys(__fk.db).find((x) => x.includes('/pets/')); return __fk.db[k].entries[0].id; });
  await page.click(`[data-act=edit-entry][data-e="${id}"]`); await page.waitForTimeout(60); await page.fill('#ef-title', 'Vet 2'); await page.click('#entform button[type=submit]'); await page.waitForTimeout(100);
  await page.click(`[data-act=ask-del][data-e="${id}"]`); await page.waitForTimeout(40); await page.click(`[data-act=del-entry][data-e="${id}"]`); await page.waitForTimeout(100);
  t = await page.evaluate(() => document.body.innerText); assert.ok(!t.includes('Vet 2')); assert.deepStrictEqual(page.errs, []); await c.close();
});
test('Legítimo: una mascota con id raro se puede abrir y editar', async () => {
  const d = seed(true); d.db['families/u1/pets/a"b'] = { id: 'a"b', name: 'Raro', species: 'Perro', entries: [{ id: 'e"1', type: 'consulta', title: 'T', date: '2026-01-01' }] };
  const { c, page } = await open(b, s.url, d); await page.click('.pcard'); await page.waitForTimeout(100);
  assert.strictEqual(await page.E('state.view.id'), 'a"b'); assert.ok(await page.$('[data-act=edit-entry]')); await page.click('[data-act=edit-entry]'); await page.waitForTimeout(60); assert.ok(await page.$('#entform')); await c.close();
});
test('Legítimo: quitar integrante y unirse siguen funcionando', async () => {
  const d = seed(true); Object.assign(d.db['families/u1'], { members: ['u1', 'u2'], memberInfo: { u1: { name: 'Ana', email: 'a@b.co' }, u2: { name: 'Beto', email: 'b@b.co' } } });
  const { c, page } = await open(b, s.url, d); await page.E("go('familia')"); await page.waitForTimeout(60); await page.click('[data-act=fam-remove]'); await page.waitForTimeout(40); await page.click('[data-act=fam-remove-yes]'); await page.waitForTimeout(150);
  assert.deepStrictEqual(await page.evaluate(() => __fk.db['families/u1'].members), ['u1']); await c.close();
});
