// Identificadores de Firebase hostiles. Firestore admite casi cualquier id, y las reglas antiguas no validaban el de las recetas.
// Corre sin CSP para medir el escape por sí solo, y con CSP para confirmar el caso reproducido en la auditoría.
const { test, before, after } = require('node:test'); const assert = require('node:assert'); const fs = require('fs'), path = require('path');
const { chromium } = require('playwright'); const { serve, testApp, seed } = require('./lib/harness.cjs');
const HOSTILE = 'x"><img id="pwn" src="x" onerror="window.__xss=1"><button id="gad" data-act="fam-leave">y<b a="';
const THUMB = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
let b; const sites = {}; before(async () => { b = await chromium.launch(); sites.off = await serve(testApp({ csp: false })); sites.on = await serve(testApp({ csp: true })); }); after(async () => { await b.close(); sites.off.srv.close(); sites.on.srv.close(); });
async function open(site, d) {
  d.db['families/u1/pets/p'] = d.db['families/u1/pets/p'] || { id: 'p', name: 'Canela', species: 'Perro', entries: [] };
  const c = await b.newContext(); await c.route(/.*/, (r) => (r.request().url().startsWith(site.url) ? r.continue() : r.abort()));
  await c.addInitScript((d) => { if (!localStorage.FK_DB) { localStorage.FK_DB = JSON.stringify(d.db); localStorage.FK_USERS = JSON.stringify(d.users); } sessionStorage.setItem('FK_UID', 'u1'); }, d);
  const p = await c.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message)); await p.goto(site.url + '/'); await p.waitForFunction(() => __E('!!state.pets.p'));
  p.E = (x) => p.evaluate((y) => __E(y), x); p.stored = (k) => p.evaluate((k) => JSON.parse(localStorage.FK_DB)[k], k); return { c, p };
}
const clean = async (p) => { assert.strictEqual(await p.locator('#pwn').count(), 0, 'imagen inyectada'); assert.strictEqual(await p.locator('#gad').count(), 0, 'botón inyectado'); assert.strictEqual(await p.evaluate(() => window.__xss || 0), 0, 'código ejecutado'); };
const withRecipe = (id, more) => { const d = seed(true); d.db['families/u1/recetas/' + id] = { petId: 'p', title: 'Receta', date: '2026-01-01', thumb: THUMB, ...more }; return d; };
const showRecipe = async (p) => { await p.E("go('pet','p')"); await p.waitForSelector('[data-act="rc-view"]'); await p.locator('[data-act="rc-view"]').first().click(); await p.waitForSelector('[data-act="rc-ask-del"]'); };

for (const mode of ['off', 'on']) test(`Id de receta hostil, CSP ${mode}: "Eliminar" no inserta HTML`, async () => {
  const { c, p } = await open(sites[mode], withRecipe(HOSTILE)); await showRecipe(p); await clean(p); await p.click('[data-act="rc-ask-del"]'); await p.waitForSelector('[data-act="rc-del"]'); await clean(p); assert.deepStrictEqual(p.errs, []); await c.close();
});
test('Acciones familiares: un id hostil no agrega botones, y borrar actúa solo sobre esa receta', async () => {
  const d = withRecipe(HOSTILE); d.db['families/u1/recetas/normal'] = { petId: 'p', title: 'Otra', date: '2026-01-02', thumb: THUMB }; const { c, p } = await open(sites.off, d);
  const fam0 = await p.stored('families/u1'); await p.E(`recetaView(${JSON.stringify(HOSTILE)})`); await p.waitForSelector('[data-act="rc-ask-del"]'); await p.click('[data-act="rc-ask-del"]');
  assert.strictEqual(await p.locator('#layer [data-act^="fam-"]').count(), 0); assert.strictEqual(await p.locator('[data-act="rc-del"]').getAttribute('data-id'), HOSTILE, 'el botón real conserva el id exacto');
  await p.click('[data-act="rc-del"]'); await p.waitForTimeout(150);
  assert.strictEqual(await p.stored('families/u1/recetas/' + HOSTILE), undefined, 'se pudo eliminar la receta hostil'); assert.ok(await p.stored('families/u1/recetas/normal'), 'la otra receta sigue'); assert.deepStrictEqual(await p.stored('families/u1'), fam0, 'la familia no cambió'); await clean(p); await c.close();
});
test('Receta legítima: se ve y se elimina como siempre', async () => {
  const { c, p } = await open(sites.on, withRecipe('AbC123xyz_-', { title: 'Amoxicilina ñandú', vet: 'Dra. Mora', notes: 'Cada 8 h', createdAt: 5 })); await showRecipe(p);
  assert.match(await p.locator('#layer').innerText(), /Amoxicilina ñandú/); assert.match(await p.locator('#layer').innerText(), /Dra\. Mora/); assert.match(await p.locator('#layer').innerText(), /Cada 8 h/);
  await p.click('[data-act="rc-ask-del"]'); await p.click('[data-act="rc-del"]'); await p.waitForTimeout(150); assert.strictEqual(await p.stored('families/u1/recetas/AbC123xyz_-'), undefined); assert.deepStrictEqual(p.errs, []); await c.close();
});
test('Id de mascota e integrante hostiles: ninguna pantalla ni flujo inserta HTML', async () => {
  const d = seed(true), o = d.db['families/u1']; Object.assign(o, { members: ['u1', HOSTILE], memberInfo: { u1: { name: 'Ana' }, [HOSTILE]: { name: 'Beto' } } });
  d.db['families/u1/pets/' + HOSTILE] = { id: HOSTILE, name: 'Mala', species: 'Perro', entries: [{ id: HOSTILE, type: 'consulta', title: 'T', date: '2026-01-01' }] }; const { c, p } = await open(sites.off, d);
  for (const s of ["go('home')", "go('mascotas')", "go('agenda')", "go('familia')", `go('pet',${JSON.stringify(HOSTILE)})`, 'accountSheet()', `exportSheet(state.pets[${JSON.stringify(HOSTILE)}])`, 'familySheet()']) { await p.E(s).catch(() => {}); await p.waitForTimeout(60); await clean(p); }
  const rm = p.locator('[data-act="fam-remove"]'); if (await rm.count()) { await rm.first().click(); await p.waitForTimeout(60); await clean(p); assert.strictEqual(await p.locator('[data-act="fam-remove-yes"]').first().getAttribute('data-id'), HOSTILE); }
  await c.close();
});
test('cleanReceta: normaliza tipos incorrectos y conserva lo legítimo', async () => {
  const { c, p } = await open(sites.off, seed(true));
  const legit = { id: 'r', petId: 'p', title: 'T', date: '2026-01-01', vet: 'V', notes: 'N', thumb: THUMB, createdAt: 9, otro: { a: 1 } };
  assert.deepStrictEqual(await p.E(`cleanReceta(${JSON.stringify(legit)})`), legit, 'una receta legítima queda idéntica');
  const bad = await p.E(`cleanReceta({id:'r',petId:7,title:{a:1},date:20260101,vet:[],notes:true,thumb:5})`); assert.deepStrictEqual(bad, { id: 'r' });
  await c.close();
});
test('Recetas con tipos incorrectos no rompen la ficha ni ocultan el historial', async () => {
  const d = withRecipe('malformada', { date: 20260101, title: { a: 1 }, vet: 5, notes: [1], thumb: 7 }); d.db['families/u1/recetas/buena'] = { petId: 'p', title: 'Buena', date: '2026-02-02', thumb: THUMB };
  d.db['families/u1/pets/p'] = { id: 'p', name: 'Canela', species: 'Perro', entries: [{ id: 'e', type: 'consulta', title: 'Consulta real', date: '2026-01-05' }] }; const { c, p } = await open(sites.off, d);
  await p.E("go('pet','p')"); await p.waitForSelector('[data-act="rc-view"]'); const txt = await p.locator('#app').innerText(); assert.match(txt, /Buena/); assert.match(txt, /Consulta real/); assert.deepStrictEqual((await p.locator('[data-act="rc-view"]').evaluateAll((els) => [...new Set(els.map((e) => e.dataset.id))])).sort(), ['buena', 'malformada'], 'la receta malformada sigue visible y se puede eliminar');
  assert.strictEqual((await p.E("expRows(state.pets.p)")).length, 3); assert.deepStrictEqual(p.errs, []); await c.close();
});
test('Ningún valor de dataset vuelve a insertarse en HTML sin escapar', () => {
  const js = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8'); assert.doesNotMatch(js, /\$\{\s*[\w.$]*\.dataset\.\w+\s*\}/);
  assert.match('data-id="${el.dataset.id}"', /\$\{\s*[\w.$]*\.dataset\.\w+\s*\}/, 'el control detecta el patrón original');
});
