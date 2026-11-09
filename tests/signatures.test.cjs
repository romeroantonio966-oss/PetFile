// Firmas de quién agrega, modifica o elimina, visibles solo en el PDF y en la versión para imprimir.
const { test, before, after } = require('node:test'); const assert = require('node:assert');
const { chromium } = require('playwright'); const { serve, testApp, seed, open } = require('./lib/harness.cjs');
let b, site; before(async () => { b = await chromium.launch(); site = await serve(testApp({ csp: true })); }); after(async () => { await b.close(); site.srv.close(); });
const until = async (p, expr) => { for (let i = 0; i < 100; i++) { if (await p.E(expr)) return; await p.waitForTimeout(50); } throw new Error('no se cumplió: ' + expr); };
async function app(pet) {
  const d = seed(true); d.db['families/u1/pets/p'] = { id: 'p', name: 'Rocko', species: 'Perro', entries: [{ id: 'viejo', type: 'consulta', title: 'Sin firma', date: '2025-01-01' }], ...pet };
  const x = await open(b, site.url, d), p = x.page; await until(p, '!!state.pets.p'); await p.E("go('pet','p')");
  p.stored = () => p.evaluate(() => JSON.parse(localStorage.FK_DB)['families/u1/pets/p']); p.pdfs = [];
  await p.exposeFunction('__pdf', (n, s) => p.pdfs.push({ n, text: Buffer.from(s, 'base64').toString('latin1') }));
  await p.evaluate(() => { __E('state.caps').downloads = { save: async ({ filename, data }) => { const u = new Uint8Array(await data.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); await window.__pdf(filename, btoa(s)); } }; });
  return x;
}
const addVac = async (p, title) => { await p.E("entryForm(state.pets.p,'vacuna')"); await p.fill('#ef-title', title); await p.fill('#ef-date', '2021-01-08'); await p.click('#entform button[type=submit]'); await until(p, `state.pets.p.entries.some(e=>e.title===${JSON.stringify(title)})`); };
test('Agregar y editar firman el registro, sin cambiar la pantalla', async () => {
  const x = await app(), p = x.page; await addVac(p, 'HIPRADOG 7'); let e = (await p.stored()).entries.find((e) => e.title === 'HIPRADOG 7');
  assert.strictEqual(e.addBy, 'Ana'); assert.strictEqual(e.addUid, 'u1'); assert.ok(e.addAt > 0); assert.ok(!e.modBy);
  assert.doesNotMatch(await p.locator('#app').innerText(), /Agregado por/, 'la pantalla no muestra firmas');
  await p.E("entryForm(state.pets.p,'vacuna',state.pets.p.entries.find(e=>e.title==='HIPRADOG 7'))"); await p.fill('#ef-notes', 'Lote 123'); await p.click('#entform button[type=submit]'); await until(p, "state.pets.p.entries.some(e=>e.notes==='Lote 123')");
  e = (await p.stored()).entries.find((e) => e.title === 'HIPRADOG 7'); assert.strictEqual(e.modBy, 'Ana'); assert.strictEqual(e.addBy, 'Ana'); assert.strictEqual((await p.stored()).entries.length, 2);
  assert.deepStrictEqual(x.errs || p.errs, []); await x.c.close();
});
test('Eliminar registra quién y qué, y conserva solo las últimas 20', async () => {
  const entries = Array.from({ length: 22 }, (_, i) => ({ id: 'r' + i, type: 'consulta', title: 'Registro ' + i, date: '2025-02-01' }));
  const x = await app({ entries }), p = x.page;
  for (let i = 0; i < 22; i++) { await p.E(`deleteEntry('p','r${i}')`); await until(p, `!state.pets.p.entries.some(e=>e.id==='r${i}')`); }
  const d = await p.stored(); assert.strictEqual(d.entries.length, 0); assert.strictEqual(d.deleted.length, 20); assert.strictEqual(d.deleted[0].title, 'Registro 2'); assert.strictEqual(d.deleted[19].title, 'Registro 21'); assert.strictEqual(d.deleted[19].by, 'Ana'); await x.c.close();
});
test('Editar datos de la mascota firma la mascota', async () => {
  const x = await app(), p = x.page; await p.E('petForm(state.pets.p)'); await p.fill('#pf-weight', '8'); await p.click('#petform button[type=submit]'); await until(p, "state.pets.p.weight==='8'");
  const d = await p.stored(); assert.strictEqual(d.modBy, 'Ana'); assert.strictEqual(d.entries.length, 1); await x.c.close();
});
test('PDF e impresión muestran firmas, eliminados y última modificación; lo antiguo sin firma', async () => {
  const x = await app({ modBy: 'Beto', modAt: Date.UTC(2026, 10, 7, 15), deleted: [{ type: 'vacuna', title: 'Rabia vieja', date: '2020-01-01', by: 'Beto', uid: 'u2', at: Date.UTC(2026, 10, 7, 15) }] }), p = x.page;
  await addVac(p, 'HIPRADOG 7'); await p.E('downloadPdf(state.pets.p)'); await until(p, 'true'); for (let i = 0; i < 60 && !p.pdfs.length; i++) await p.waitForTimeout(100);
  const t = p.pdfs[0].text; assert.match(t, /Agregado por Ana/); assert.match(t, /Registros eliminados recientemente/); assert.match(t, /Rabia vieja/); assert.match(t, /Eliminado por Beto/); assert.match(t, /de la mascota: Beto/); assert.match(t, /Sin firma/);
  await p.evaluate(() => { window.print = () => {}; }); await p.E('printHistory(state.pets.p)'); await p.waitForTimeout(200); const h = await p.locator('#printdoc').innerText();
  assert.match(h, /Agregado por Ana/); assert.match(h, /Eliminado por Beto/); assert.match(h, /de la mascota: Beto/); await x.c.close();
});
test('Nombres hostiles en firmas no insertan HTML', async () => {
  const bad = '<img src=x onerror="window.__x=1"><b id="inj">', x = await app({ modBy: bad, modAt: 1, deleted: [{ type: 'consulta', title: bad, date: '', by: bad, uid: 'z', at: 1 }], entries: [{ id: 'e', type: 'consulta', title: 'T', date: '2025-01-01', addBy: bad, addAt: 1 }] }), p = x.page;
  await p.evaluate(() => { window.print = () => {}; }); await p.E('printHistory(state.pets.p)'); await p.waitForTimeout(200); assert.strictEqual(await p.locator('#inj').count(), 0); assert.strictEqual(await p.evaluate(() => window.__x || 0), 0); await x.c.close();
});
