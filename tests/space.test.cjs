// Espacio por mascota: indicador en vivo, aviso al 80 % y ningún registro "fantasma" cuando no cabe.
const { test, before, after } = require('node:test'); const assert = require('node:assert');
const { chromium } = require('playwright'); const { serve, testApp, seed, open } = require('./lib/harness.cjs');
let b, site; before(async () => { b = await chromium.launch(); site = await serve(testApp({ csp: true })); }); after(async () => { await b.close(); site.srv.close(); });
const until = async (p, expr) => { for (let i = 0; i < 100; i++) { if (await p.E(expr)) return; await p.waitForTimeout(50); } throw new Error('no se cumplió: ' + expr); };
const BIG = 'data:image/jpeg;base64,/9j/' + 'A'.repeat(1048420);
async function app(pet) { const d = seed(true); d.db['families/u1/pets/p'] = { id: 'p', name: 'Rocko', species: 'Perro', entries: [{ id: 'a', type: 'vacuna', title: 'V1', date: '2021-01-01' }], ...pet }; const x = await open(b, site.url, d), p = x.page; await until(p, '!!state.pets.p'); await p.E("go('pet','p')"); return x; }
test('Tamaño calculado como Firestore', async () => { const x = await app(), p = x.page; assert.strictEqual(await p.E("docSize({a:'ñ',b:5,c:true,d:[1,'x']})"), 2 + 3 + 2 + 8 + 2 + 1 + 2 + 8 + 2); await x.c.close(); });
test('Indicador en el formulario y en vivo al quitar la foto', async () => {
  const x = await app({ photo: BIG }), p = x.page; await p.E('petForm(state.pets.p)'); const before = await p.locator('#pf-space').innerText();
  assert.match(before, /Espacio usado: 100 %/); assert.match(before, /Queda poco espacio/);
  await p.click('[data-act="rm-photo"]'); const after = await p.locator('#pf-space').innerText(); assert.match(after, /Espacio usado: 0 %/); assert.doesNotMatch(after, /Queda poco/);
  assert.deepStrictEqual(p.errs, []); await x.c.close();
});
test('Mascota llena: el registro no aparece ni se pierde en silencio, y avisa', async () => {
  const x = await app({ photo: BIG }), p = x.page; await p.E("entryForm(state.pets.p,'vacuna')"); await p.fill('#ef-title', 'Cuarta'); await p.fill('#ef-date', '2026-11-08'); await p.click('#entform button[type=submit]'); await p.waitForTimeout(150);
  assert.match(await p.locator('.toast').innerText(), /no tiene espacio/); assert.strictEqual(await p.E('state.pets.p.entries.length'), 1); assert.strictEqual((await p.evaluate(() => JSON.parse(localStorage.FK_DB)['families/u1/pets/p'])).entries.length, 1); await x.c.close();
});
test('Con espacio, agregar funciona igual y una mascota nueva no muestra indicador', async () => {
  const x = await app(), p = x.page; await p.E("entryForm(state.pets.p,'vacuna')"); await p.fill('#ef-title', 'Cuarta'); await p.fill('#ef-date', '2026-11-08'); await p.click('#entform button[type=submit]'); await until(p, 'state.pets.p.entries.length===2');
  assert.match(await p.locator('.toast').innerText(), /Agregado/); await p.E('petForm()'); assert.strictEqual(await p.locator('#pf-space').count(), 0); await p.E('closeSheet()'); await p.E('petForm(state.pets.p)'); assert.match(await p.locator('#pf-space').innerText(), /Espacio usado: 0 %/); await x.c.close();
});
