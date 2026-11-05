// Concurrencia del historial con la app real y Firebase simulado: nunca sale a internet.
// El simulador aplica cada lote sobre los datos más recientes y deja en cola lo que se guarda sin conexión.
const { test, before, after } = require('node:test'); const assert = require('node:assert');
const { chromium } = require('playwright'); const { serve, testApp, seed } = require('./lib/harness.cjs');
const PET = 'families/u1/pets/p'; let browser, site;
before(async () => { browser = await chromium.launch(); site = await serve(testApp({ csp: false })); });
after(async () => { await browser.close(); site.srv.close(); });

async function family(n, pet) {
  const d = seed(true), ids = Array.from({ length: n }, (_, i) => 'u' + (i + 1));
  Object.assign(d.db['families/u1'], { members: ids, memberInfo: Object.fromEntries(ids.map((u) => [u, { name: u }])) });
  ids.slice(1).forEach((u) => { d.users[u + '@b.co'] = { uid: u, email: u + '@b.co', pw: 'x', name: u }; d.db['users/' + u] = { email: u + '@b.co', name: u, lang: 'es', familyId: 'u1', trialStart: { __ts: 1 } }; });
  d.db[PET] = Object.assign({ id: 'p', name: 'Canela', species: 'Perro', entries: [] }, pet);
  const c = await browser.newContext(); await c.route(/.*/, (r) => (r.request().url().startsWith(site.url) ? r.continue() : r.abort()));
  await c.addInitScript((d) => { if (!localStorage.FK_DB) { localStorage.FK_DB = JSON.stringify(d.db); localStorage.FK_USERS = JSON.stringify(d.users); } }, d);
  const pages = [];
  for (const u of ids) { const p = await c.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message)); await p.addInitScript((u) => sessionStorage.setItem('FK_UID', u), u); await p.goto(site.url + '/'); pages.push(p); }
  await pages[0].waitForFunction(() => __E('state.pets.p')); for (const p of pages) await p.waitForFunction(() => __E('!!state.pets.p'));
  return { c, pages };
}
const E = (p, x) => p.evaluate((y) => __E(y), x);
const rec = (id, more) => ({ id, type: 'consulta', title: id, date: '2026-01-01', ...more });
const add = (p, r) => E(p, `addEntries('p',${JSON.stringify([r])})`);
const off = (p) => p.evaluate(() => __fkNet(false)); const on = (p) => p.evaluate(() => __fkNet(true));
const stored = async (p) => { await p.waitForTimeout(80); return p.evaluate((k) => JSON.parse(localStorage.FK_DB)[k], PET); };
const titles = (es) => es.map((e) => e.title).sort();
const shown = (p) => E(p, `state.pets.p.entries.map(e=>e.title).sort()`);
const settled = async (pages) => { await pages[0].waitForTimeout(150); };
const fin = async (f) => { for (const p of f.pages) assert.deepStrictEqual(p.errs, []); await f.c.close(); };

// "A la vez" significa aquí que cada uno guarda sin haber recibido lo del otro. La escritura realmente paralela se prueba en tests/emulator/concurrency.test.cjs.
test('Control: el guardado anterior, que reescribía la mascota, sí pierde un registro', async () => {
  const f = await family(2), [A, B] = f.pages; await off(A); await off(B); const old = (p, r) => E(p, `void fb.petsCol.doc('p').set(plain(Object.assign({},state.pets.p,{entries:state.pets.p.entries.concat(${JSON.stringify(r)})})))`);
  await old(A, rec('Ana')); await old(B, rec('Beto')); await on(A); await A.waitForTimeout(30); await on(B);
  assert.strictEqual((await stored(A)).entries.length, 1); await fin(f);
});
test('Dos integrantes agregan a la vez: se conservan ambos registros', async () => {
  const f = await family(2), [A, B] = f.pages; await off(A); await off(B); await add(A, rec('Ana')); await add(B, rec('Beto')); await on(A); await A.waitForTimeout(30); await on(B);
  assert.deepStrictEqual(titles((await stored(A)).entries), ['Ana', 'Beto']); await fin(f);
});
test('Dos integrantes agregan sin conexión y se reconectan: se conservan ambos', async () => {
  const f = await family(2), [A, B] = f.pages; await off(A); await off(B); await add(A, rec('Ana')); await add(B, rec('Beto'));
  assert.deepStrictEqual((await stored(A)).entries, [], 'nada llegó al servidor todavía');
  assert.deepStrictEqual(await shown(A), ['Ana'], 'quien guarda ve su registro sin conexión');
  await on(A); await A.waitForTimeout(30); await on(B); assert.deepStrictEqual(titles((await stored(A)).entries), ['Ana', 'Beto']);
  await settled(f.pages); assert.deepStrictEqual(await shown(A), ['Ana', 'Beto']); assert.deepStrictEqual(await shown(B), ['Ana', 'Beto']); await fin(f);
});
test('Seis integrantes agregan 10 registros cada uno a la vez: quedan los 60', async () => {
  const f = await family(6); for (const p of f.pages) await off(p); await Promise.all(f.pages.flatMap((p, i) => Array.from({ length: 10 }, (_, k) => add(p, rec(`m${i}-${k}`))))); for (const p of f.pages) { await on(p); await p.waitForTimeout(30); }
  assert.strictEqual((await stored(f.pages[0])).entries.length, 60); await fin(f);
});
test('Sincronización: el otro integrante recibe el cambio en vivo y todos convergen', async () => {
  const f = await family(3), [A, B, C] = f.pages; await add(A, rec('Ana')); await B.waitForFunction(() => __E('state.pets.p.entries.length===1')); await C.waitForFunction(() => __E('state.pets.p.entries.length===1'));
  await off(C); await add(C, rec('Caro')); await add(B, rec('Beto')); await on(C); await settled(f.pages);
  const want = ['Ana', 'Beto', 'Caro']; for (const p of f.pages) assert.deepStrictEqual(await shown(p), want); await fin(f);
});
test('Editar registros distintos a la vez conserva ambas ediciones', async () => {
  const f = await family(2, { entries: [rec('r1'), rec('r2'), rec('r3')] }), [A, B] = f.pages; await off(A); await off(B);
  await E(A, `saveEntry('p',state.pets.p.entries[0],Object.assign({},state.pets.p.entries[0],{notes:'de Ana'}))`);
  await E(B, `saveEntry('p',state.pets.p.entries[1],Object.assign({},state.pets.p.entries[1],{notes:'de Beto'}))`);
  await on(A); await A.waitForTimeout(30); await on(B); const es = (await stored(A)).entries, by = Object.fromEntries(es.map((e) => [e.id, e]));
  assert.strictEqual(es.length, 3); assert.strictEqual(by.r1.notes, 'de Ana'); assert.strictEqual(by.r2.notes, 'de Beto'); assert.deepStrictEqual(by.r3, rec('r3')); await fin(f);
});
test('Editar campos distintos del mismo registro con la ficha abierta conserva ambos', async () => {
  const f = await family(2, { entries: [rec('r1', { vet: 'Mora' })] }), [A, B] = f.pages;
  await E(A, `window.__base=state.pets.p.entries[0]`);
  await E(B, `saveEntry('p',state.pets.p.entries[0],Object.assign({},state.pets.p.entries[0],{notes:'de Beto'}))`); await A.waitForFunction(() => __E(`state.pets.p.entries[0].notes==='de Beto'`));
  await E(A, `saveEntry('p',window.__base,Object.assign({},window.__base,{vet:'Rojas'}))`);
  const es = (await stored(A)).entries; assert.strictEqual(es.length, 1); assert.strictEqual(es[0].notes, 'de Beto'); assert.strictEqual(es[0].vet, 'Rojas'); await fin(f);
});
test('Mismo registro editado sin conexión por dos: una sola versión visible, igual en todos, y se limpia al editar', async () => {
  const f = await family(2, { entries: [rec('r1')] }), [A, B] = f.pages; await off(A); await off(B);
  const ed = (p, n) => E(p, `saveEntry('p',state.pets.p.entries[0],Object.assign({},state.pets.p.entries[0],{notes:'${n}'}))`);
  await ed(A, 'de Ana'); await ed(B, 'de Beto'); await on(A); await A.waitForTimeout(30); await on(B); await settled(f.pages);
  assert.strictEqual((await stored(A)).entries.length, 2, 'ninguna versión se descarta en el servidor');
  const see = (p) => E(p, `state.pets.p.entries.map(e=>e.notes)`); assert.deepStrictEqual(await see(A), ['de Beto']); assert.deepStrictEqual(await see(B), ['de Beto']);
  await ed(A, 'final'); assert.deepStrictEqual((await stored(A)).entries.map((e) => e.notes), ['final']); await fin(f);
});
test('Eliminar un registro no afecta los que otro integrante agrega a la vez', async () => {
  const f = await family(2, { entries: [rec('r1'), rec('r2')] }), [A, B] = f.pages; await off(A); await off(B);
  await E(A, `deleteEntry('p','r1')`); await add(B, rec('nuevo')); await on(A); await A.waitForTimeout(30); await on(B);
  assert.deepStrictEqual(titles((await stored(A)).entries), ['nuevo', 'r2']); await fin(f);
});
test('Eliminar y editar el mismo registro a la vez: la edición sobrevive', async () => {
  const f = await family(2, { entries: [rec('r1')] }), [A, B] = f.pages; await off(A); await off(B);
  await E(A, `deleteEntry('p','r1')`); await E(B, `saveEntry('p',state.pets.p.entries[0],Object.assign({},state.pets.p.entries[0],{notes:'importante'}))`); await on(A); await A.waitForTimeout(30); await on(B);
  assert.deepStrictEqual((await stored(A)).entries.map((e) => e.notes), ['importante']); await fin(f);
});
test('Editar la mascota no borra los registros que otro agrega, y dos datos distintos se conservan', async () => {
  const f = await family(2, { weight: '10', entries: [rec('r1')] }), [A, B] = f.pages; await off(A); await off(B);
  await E(A, `savePet(Object.assign({},state.pets.p,{name:'Canelita'}),state.pets.p)`); await E(B, `savePet(Object.assign({},state.pets.p,{weight:'12'}),state.pets.p)`); await add(B, rec('nuevo')); await on(A); await A.waitForTimeout(30); await on(B);
  const d = await stored(A); assert.strictEqual(d.name, 'Canelita'); assert.strictEqual(d.weight, '12'); assert.deepStrictEqual(titles(d.entries), ['nuevo', 'r1']); await fin(f);
});
test('Historial existente: entradas antiguas y raras quedan idénticas y nada reescribe el documento', async () => {
  const legacy = [{ title: 'sin id', date: '2019-01-01' }, { title: 'otro sin id', date: '2019-01-02' }, rec('viejo', { fromRx: true, done: true, extra: { a: 1 }, photos: [{ url: 'https://x/y.jpg', path: 'z' }] }), { id: 'numero', title: 123, date: '2020-01-01' }, rec('editar')];
  const f = await family(2, { weight: 12.5, createdAt: 5, custom: 'campo antiguo', entries: legacy }), [A] = f.pages;
  await add(A, rec('nuevo')); await E(A, `saveEntry('p',state.pets.p.entries.find(e=>e.id==='editar'),Object.assign({},state.pets.p.entries.find(e=>e.id==='editar'),{notes:'n'}))`); await E(A, `deleteEntry('p','nuevo')`); await E(A, `savePet(Object.assign({},state.pets.p,{name:'Lola'}),state.pets.p)`);
  const d = await stored(A); assert.deepStrictEqual(d.entries.slice(0, 4), legacy.slice(0, 4)); assert.strictEqual(d.entries.length, 5); assert.strictEqual(d.custom, 'campo antiguo'); assert.strictEqual(d.weight, 12.5); assert.strictEqual(d.createdAt, 5); assert.strictEqual(d.name, 'Lola');
  assert.strictEqual((await E(A, `state.pets.p.entries.length`)), 5, 'las entradas sin id no se confunden entre sí');
  const modes = await A.evaluate((k) => window.__writes.filter((w) => w.path === k).map((w) => w.mode), PET); assert.ok(modes.length && !modes.includes('set'), 'ninguna operación reemplaza el documento'); await fin(f);
});
test('Desde la pantalla: crear, editar y eliminar con los formularios reales', async () => {
  const f = await family(2), [A, B] = f.pages; await E(A, `go('pet','p')`);
  await E(A, `entryForm(state.pets.p,'consulta')`); await A.fill('#ef-title', 'Control'); await A.fill('#ef-date', '2026-02-02'); await A.click('#entform button[type=submit]');
  await B.waitForFunction(() => __E(`state.pets.p.entries.length===1`));
  await E(A, `entryForm(state.pets.p,'consulta',state.pets.p.entries[0])`); await A.fill('#ef-notes', 'Todo bien'); await A.click('#entform button[type=submit]'); await B.waitForFunction(() => __E(`state.pets.p.entries[0].notes==='Todo bien'`));
  assert.strictEqual((await stored(A)).entries.length, 1);
  await A.click('[data-act="ask-del"]'); await A.click('[data-act="del-entry"]'); await B.waitForFunction(() => __E(`state.pets.p.entries.length===0`));
  assert.deepStrictEqual((await stored(A)).entries, []); await fin(f);
});
test('Registro nuevo sobre mascota recién creada sin conexión: se sube en orden', async () => {
  const f = await family(2), [A, B] = f.pages; await off(A); await E(A, `savePet({id:'q',name:'Tom',species:'Gato',entries:[]},null)`); await E(A, `addEntries('q',[{id:'x',type:'consulta',title:'x',date:'2026-01-01'}])`); await on(A);
  await B.waitForFunction(() => __E(`state.pets.q&&state.pets.q.entries.length===1`)); await fin(f);
});
test('Si otro eliminó la mascota, el guardado pendiente avisa el error y no la recrea', async () => {
  const f = await family(2), [A, B] = f.pages; await off(A); await add(A, rec('tarde')); await E(B, `removePet('p')`); await on(A); await A.waitForTimeout(150);
  assert.strictEqual(await A.evaluate((k) => JSON.parse(localStorage.FK_DB)[k] === undefined, PET), true); assert.match(await A.locator('.toast').first().innerText().catch(() => ''), /./); await f.c.close();
});
test('Permiso denegado: avisa y no cambia lo guardado', async () => {
  const f = await family(2, { entries: [rec('r1')] }), [A] = f.pages; await A.evaluate(() => { window.__deny = (op, path) => op !== 'get' && path.includes('/pets/'); }); await add(A, rec('no')); await A.waitForTimeout(80);
  assert.deepStrictEqual(titles((await stored(A)).entries), ['r1']); assert.match(await A.locator('.toast').first().innerText(), /./); await fin(f);
});
