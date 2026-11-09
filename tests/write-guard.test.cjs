// Versiones viejas: cada escritura de mascota lleva wAt (hora del servidor) para que las reglas rechacen las que no la traen,
// y la web avisa o recarga cuando hay una versión nueva publicada.
const { test, before, after } = require('node:test'); const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright'); const { ROOT, serve, testApp, seed, open } = require('./lib/harness.cjs');
let b, site, dir; before(async () => { b = await chromium.launch(); dir = testApp({ csp: true }); site = await serve(dir); }); after(async () => { await b.close(); site.srv.close(); });
const until = async (p, expr) => { for (let i = 0; i < 100; i++) { if (await p.E(expr)) return; await p.waitForTimeout(50); } throw new Error('no se cumplió: ' + expr); };
const stored = async (p) => { await p.waitForTimeout(120); return p.evaluate(() => JSON.parse(localStorage.FK_DB)['families/u1/pets/p']); };
async function app() { const d = seed(true); d.db['families/u1/pets/p'] = { id: 'p', name: 'Rocko', species: 'Perro', entries: [{ id: 'a', type: 'vacuna', title: 'V1', date: '2021-01-01' }] }; const x = await open(b, site.url, d), p = x.page; await until(p, '!!state.pets.p'); await p.E("go('pet','p')"); return x; }

test('version.json coincide con APP_VERSION', () => {
  const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'version.json'), 'utf8')).v;
  const m = fs.readFileSync(path.join(ROOT, 'public', 'app.js'), 'utf8').match(/const APP_VERSION='([^']+)'/);
  assert.ok(m); assert.strictEqual(m[1], v);
});
test('Toda escritura de la mascota lleva wAt y wAt no queda en el estado', async () => {
  const x = await app(), p = x.page; let last = 0;
  const fresh = async (what) => { const d = await stored(p); assert.ok(d.wAt && d.wAt.__ts > last, what + ' sin wAt'); last = d.wAt.__ts; await p.waitForTimeout(5); };
  await p.E("addEntries('p',[{id:'n1',type:'vacuna',title:'V2',date:'2026-11-09'}])"); await fresh('agregar');
  await p.E("saveEntry('p',state.pets.p.entries.find(e=>e.id==='n1'),Object.assign({},state.pets.p.entries.find(e=>e.id==='n1'),{title:'V2b'}))"); await fresh('editar');
  await p.E("deleteEntry('p','n1')"); await fresh('eliminar');
  await p.E("savePet(Object.assign({},state.pets.p,{breed:'Mezcla'}),state.pets.p)"); await fresh('editar mascota');
  assert.strictEqual(await p.E("'wAt' in state.pets.p"), false);
  const d = await stored(p); assert.deepStrictEqual(d.entries.map((e) => e.id), ['a']); assert.strictEqual(d.breed, 'Mezcla');
  await p.E("savePet({id:'q',name:'Nube',species:'Gato',entries:[]},null)"); await p.waitForTimeout(120);
  const q = await p.evaluate(() => JSON.parse(localStorage.FK_DB)['families/u1/pets/q']); assert.ok(q && q.wAt && q.wAt.__ts);
  assert.deepStrictEqual(p.errs, []); await x.c.close();
});
test('Versión nueva publicada: aviso con Actualizar; misma versión: nada', async () => {
  const x = await app(), p = x.page; await p.waitForTimeout(200); assert.strictEqual(await p.locator('#upd').count(), 0);
  const vf = path.join(dir, 'version.json'), orig = fs.readFileSync(vf, 'utf8');
  try {
    fs.writeFileSync(vf, '{"v":"9999-01-01.1"}');
    await p.E('checkUpdate(false)'); await p.locator('#upd').waitFor();
    assert.match(await p.locator('#upd').innerText(), /versión nueva/);
    await p.E("lang='en';render()"); assert.match(await p.locator('#upd').innerText(), /new version/);
    await Promise.all([p.waitForNavigation(), p.click('#upd button')]);
  } finally { fs.writeFileSync(vf, orig); }
  assert.deepStrictEqual(p.errs, []); await x.c.close();
});
test('Al volver a la app con versión nueva recarga sola si no hay formulario abierto, y no si lo hay', async () => {
  const x = await app(), p = x.page; const vf = path.join(dir, 'version.json'), orig = fs.readFileSync(vf, 'utf8');
  try {
    fs.writeFileSync(vf, '{"v":"9999-01-01.1"}');
    await p.E("entryForm(state.pets.p,'vacuna')"); await p.E('checkUpdate(true)'); await p.locator('#upd').waitFor(); assert.ok(await p.locator('#entform').count());
    await p.E('closeSheet()');
    await Promise.all([p.waitForNavigation(), p.E('checkUpdate(true)')]);
  } finally { fs.writeFileSync(vf, orig); }
  await x.c.close();
});
test('App nativa: no busca versiones', async () => {
  const d = seed(true); const x = await open(b, site.url, d, { native: true }), p = x.page; const reqs = [];
  p.on('request', (r) => { if (r.url().includes('version.json')) reqs.push(r.url()); });
  await p.E('checkUpdate(true)'); await p.waitForTimeout(150); assert.deepStrictEqual(reqs, []); await x.c.close();
});
