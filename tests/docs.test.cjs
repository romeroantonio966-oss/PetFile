// Pedigrí y microchip con la app real, la CSP activa y Firebase simulado (nunca sale a internet).
const { test, before, after } = require('node:test'); const assert = require('node:assert');
const { chromium } = require('playwright'); const { serve, testApp, seed, open } = require('./lib/harness.cjs');
let b, site; before(async () => { b = await chromium.launch(); site = await serve(testApp({ csp: true })); }); after(async () => { await b.close(); site.srv.close(); });
const JPEG = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==', 'base64');
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
const HIST = [{ id: 'e1', type: 'vacuna', title: 'Rabia', date: '2026-01-10', next: '2027-01-10' }, { id: 'e2', type: 'cita', title: 'Control', date: '2026-12-01T10:00' }, { id: 'e3', type: 'receta', title: 'Amoxicilina', date: '2026-02-02' }];
async function app(o = {}) {
  const d = seed(o.paid !== false); d.db['families/u1/pets/p'] = { id: 'p', name: 'Canela', species: 'Perro', breed: 'Beagle', sex: 'Hembra', weight: '12.5', birth: '2020-05-01', entries: HIST, createdAt: 1, ...o.pet };
  const x = await open(b, site.url, d, { locale: o.locale }); const p = x.page; await until(p, '!!state.pets.p'); await p.E("go('pet','p')");
  p.stored = (k = 'families/u1/pets/p') => p.evaluate((k) => JSON.parse(localStorage.FK_DB)[k], k);
  p.pdfs = []; await p.exposeFunction('__pdf', (name, bytes) => p.pdfs.push({ name, text: Buffer.from(bytes, 'base64').toString('latin1') }));
  await p.evaluate(() => { __E('state.caps').downloads = { save: async ({ filename, data }) => { const u = new Uint8Array(await data.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); await window.__pdf(filename, btoa(s)); } }; });
  return { ...x, p };
}
const until = async (p, expr) => { for (let i = 0; i < 100; i++) { if (await p.E(expr)) return; await p.waitForTimeout(50); } throw new Error('no se cumplió: ' + expr); };
const fill = async (p, vals) => { for (const [id, v] of Object.entries(vals)) await p.fill('#' + id, v); };
const yes = (p, k) => p.click(`[data-act="doc-yn"][data-k="${k}"][data-v="1"]`);
const submit = async (p) => { await p.click('#petform button[type=submit]'); await p.waitForTimeout(120); };
const PED = { 'pd-regName': 'Canela de la Montaña', 'pd-regNo': 'ACC-2020-1234', 'pd-kennel': 'Criadero Sol', 'pd-assoc': 'Asociación Canófila Costarricense', 'pd-sire': 'Rocky', 'pd-sireNo': 'ACC-1', 'pd-dam': 'Luna', 'pd-damNo': 'ACC-2', 'pd-owner': 'Ana Pérez', 'pd-address': 'San José', 'pd-transfer': '2021-01-15' };
const CHIP = { 'mc-number': '985 141 000 123 456', 'mc-color': 'Tricolor', 'mc-implant': '2020-08-01', 'mc-vet': 'Dra. Muñoz', 'mc-vetPhone': '+506 2222-3333', 'mc-owner': 'Ana Pérez' };
const done = async (x) => { assert.deepStrictEqual(x.p.errs, [], 'errores de JavaScript'); assert.deepStrictEqual(await x.p.evaluate(() => window.__csp), [], 'bloqueos de CSP'); await x.c.close(); };

test('1. Mascota nueva sin pedigrí ni microchip: no agrega campos', async () => {
  const x = await app(), p = x.p; await p.E('petForm()'); assert.strictEqual(await p.locator('#df-ped').isHidden(), true); assert.strictEqual(await p.locator('#df-chip').isHidden(), true);
  await p.fill('#pf-name', 'Toby'); await submit(p); const id = await p.E("Object.keys(state.pets).find(k=>k!=='p')"); const d = await p.stored('families/u1/pets/' + id);
  assert.strictEqual(d.name, 'Toby'); assert.ok(!('pedigree' in d) && !('microchip' in d)); await done(x);
});
test('2. Mascota nueva con pedigrí', async () => {
  const x = await app(), p = x.p; await p.E('petForm()'); await p.fill('#pf-name', 'Max'); await yes(p, 'ped'); assert.strictEqual(await p.locator('#df-ped').isVisible(), true);
  assert.strictEqual(await p.inputValue('#pd-owner'), 'Ana', 'propietario autocompletado con la cuenta'); await fill(p, PED); await submit(p);
  const id = await p.E("Object.keys(state.pets).find(k=>k!=='p')"), d = (await p.stored('families/u1/pets/' + id)).pedigree;
  assert.strictEqual(d.on, true); assert.strictEqual(d.regNo, 'ACC-2020-1234'); assert.strictEqual(d.assoc, 'Asociación Canófila Costarricense'); assert.ok(!('name' in d) && !('breed' in d), 'no duplica datos de la mascota');
  assert.match(await p.locator('#doc-ped').innerText(), /Canela de la Montaña[\s\S]*ACC-2020-1234/); await done(x);
});
test('3. Microchip: validación, número normalizado y destacado en la ficha', async () => {
  const x = await app(), p = x.p; await p.E("petForm(state.pets.p)"); await yes(p, 'chip'); await p.fill('#mc-number', '12-34'); await p.fill('#mc-owner', ''); await submit(p);
  assert.strictEqual(await p.locator('#pf-doc-err').isVisible(), true); assert.match(await p.locator('#mc-number-e').innerText(), /9 a 15/); assert.match(await p.locator('#mc-owner-e').innerText(), /Obligatorio/);
  assert.strictEqual((await p.stored()).microchip, undefined, 'no guardó datos inválidos');
  await fill(p, { ...CHIP, 'mc-vetPhone': 'abc' }); await submit(p); assert.match(await p.locator('#mc-vetPhone-e').innerText(), /no válido/);
  await fill(p, CHIP); await submit(p); const d = (await p.stored()).microchip; assert.strictEqual(d.number, '985141000123456'); assert.strictEqual(d.on, true);
  assert.match(await p.locator('#doc-chip .chipno').innerText(), /985 141 000 123 456/); await done(x);
});
test('4 y 14. Ambos apartados en una mascota con historial: los registros y citas quedan intactos', async () => {
  const x = await app(), p = x.p; await p.E('petForm(state.pets.p)'); await yes(p, 'ped'); await fill(p, PED); await yes(p, 'chip'); await fill(p, CHIP); await submit(p);
  const d = await p.stored(); assert.deepStrictEqual(d.entries, HIST); assert.ok(d.pedigree.on && d.microchip.on); assert.strictEqual(await p.locator('.doccard').count(), 2);
  assert.ok(await p.evaluate(() => window.__writes.filter((w) => w.path.endsWith('/pets/p')).every((w) => w.mode === 'update')), 'solo actualiza, no reescribe la mascota'); await done(x);
});
test('5 y 6. Editar datos existentes y conservarlos tras recargar', async () => {
  const x = await app({ pet: { pedigree: { on: true, regName: 'Canela', regNo: 'R1', owner: 'Ana' } } }), p = x.p;
  await p.click('[data-act="doc-edit"][data-k="ped"]'); assert.strictEqual(await p.locator('#df-ped').isVisible(), true); assert.strictEqual(await p.inputValue('#pd-regNo'), 'R1');
  await p.fill('#pd-regNo', 'R2'); await p.fill('#pd-notes', 'Línea de exposición'); await submit(p); await p.reload(); await until(p, '!!state.pets.p');
  const d = (await p.stored()).pedigree; assert.strictEqual(d.regNo, 'R2'); assert.strictEqual(d.notes, 'Línea de exposición'); assert.match(await p.locator('#doc-ped').innerText(), /R2/); await done(x);
});
test('Sí a No con datos: pide confirmar y conserva todo para recuperarlo', async () => {
  const x = await app({ pet: { microchip: { on: true, number: '985141000123456', owner: 'Ana' } } }), p = x.p; await p.E('petForm(state.pets.p)');
  await p.click('[data-act="doc-yn"][data-k="chip"][data-v="0"]'); assert.strictEqual(await p.locator('#dc-chip .confirm').isVisible(), true); await p.click('[data-act="doc-off-no"]'); assert.strictEqual(await p.locator('#df-chip').isVisible(), true);
  await p.click('[data-act="doc-yn"][data-k="chip"][data-v="0"]'); await p.click('[data-act="doc-off"]'); await submit(p);
  const d = (await p.stored()).microchip; assert.strictEqual(d.on, false); assert.strictEqual(d.number, '985141000123456'); assert.strictEqual(await p.locator('.doccard').count(), 0);
  await p.E('petForm(state.pets.p)'); await yes(p, 'chip'); assert.strictEqual(await p.inputValue('#mc-number'), '985141000123456'); await done(x);
});
test('7. Mascotas anteriores y datos con formato incorrecto se ven sin errores', async () => {
  const x = await app({ pet: { breed: undefined, sex: undefined, pedigree: 'texto', microchip: { on: 'si', number: 5, owner: ['x'], extra: { a: 1 } } } }), p = x.p;
  await p.E("go('pet','p')"); await p.waitForTimeout(80); assert.strictEqual(await p.locator('.doccard').count(), 0); assert.deepStrictEqual(await p.E('state.pets.p.microchip'), { on: false });
  await p.E('petForm(state.pets.p)'); assert.strictEqual(await p.locator('#df-chip').isHidden(), true); await done(x);
});
test('Datos hostiles se muestran como texto, sin insertar HTML', async () => {
  const bad = '"><img src=x onerror="window.__x=1"><b id="inj">';
  const x = await app({ pet: { pedigree: { on: true, regName: bad, regNo: bad, owner: bad }, microchip: { on: true, number: bad, owner: bad } } }), p = x.p; await p.E("go('pet','p')"); await p.E('petForm(state.pets.p)');
  assert.strictEqual(await p.locator('#inj').count(), 0); assert.strictEqual(await p.evaluate(() => window.__x || 0), 0); assert.strictEqual(await p.inputValue('#pd-regNo'), bad); await done(x);
});
test('9. Ambos PDF: logo, datos, fecha y aviso informativo', async () => {
  const x = await app({ pet: { name: 'Ñandú', pedigree: { on: true, regName: 'Ñandú del Valle', regNo: 'R-9', sire: 'Rocky', dam: 'Luna', owner: 'Ana' }, microchip: { on: true, number: '985141000123456', vet: 'Dra. Muñoz', owner: 'Ana' } } }), p = x.p;
  await p.E("go('pet','p')"); await p.click('[data-act="doc-pdf"][data-k="ped"]'); await p.click('[data-act="doc-pdf"][data-k="chip"]'); for (let i = 0; i < 50 && p.pdfs.length < 2; i++) await p.waitForTimeout(100);
  const [ped, chip] = p.pdfs; assert.strictEqual(ped.name, 'pedigri-nandu.pdf'); assert.strictEqual(chip.name, 'microchip-nandu.pdf');
  for (const f of [ped, chip]) { assert.ok(f.text.startsWith('%PDF-')); assert.match(f.text, /PETFILE/); assert.match(f.text, /\/Subtype \/Image/, 'incluye el logo'); assert.match(f.text, /Ficha informativa generada por PETFILE|Registro informativo generado por PETFILE/); }
  assert.match(ped.text, /R-9/); assert.match(ped.text, /Rocky/); assert.match(ped.text, /certificado oficial de/); assert.match(chip.text, /985141000123456/); assert.match(chip.text, /registro oficial/); await done(x);
});
test('8. Certificados con la regla publicada: adjuntar foto, ver, reemplazar por PDF y eliminar', async () => {
  const x = await app({ pet: { pedigree: { on: true, regName: 'C', regNo: 'R', owner: 'Ana' } } }), p = x.p; await p.E('CERT_FILES=true'); await p.E("go('pet','p')");
  let ch = p.waitForEvent('filechooser'); await p.click('[data-act="cert-add"][data-k="ped"]'); await (await ch).setFiles({ name: 'pedigri.jpg', mimeType: 'image/jpeg', buffer: JPEG }); await until(p, '!!(state.pets.p.pedigree.cert)');
  let c = await p.stored('families/u1/certs/p_ped'); assert.strictEqual(c.type, 'image/jpeg'); assert.match(c.data, /^data:image\/jpeg;base64,/); const pet = await p.stored(); assert.ok(!JSON.stringify(pet).includes('base64'), 'la mascota no guarda el archivo'); assert.strictEqual(pet.pedigree.cert.name, 'pedigri.jpg');
  await p.click('[data-act="cert-view"][data-k="ped"]'); await p.waitForSelector('.viewer img'); await p.click('[data-act="cert-dl"]'); await p.waitForTimeout(150); assert.match(p.pdfs.at(-1).name, /pedigri-canela-certificado\.jpg/); await p.click('.viewer [data-act="close"]');
  await p.click('[data-act="cert-ask"][data-k="ped"][data-op="rep"]'); assert.match(await p.locator('#cq-ped').innerText(), /reemplazará/); ch = p.waitForEvent('filechooser'); await p.click('[data-act="cert-rep"]'); await (await ch).setFiles({ name: 'cert.pdf', mimeType: 'application/pdf', buffer: PDF });
  await until(p, "state.pets.p.pedigree.cert.type==='application/pdf'"); c = await p.stored('families/u1/certs/p_ped'); assert.match(c.data, /^data:application\/pdf;base64,JVBERi0/);
  await p.click('[data-act="cert-view"][data-k="ped"]'); await p.waitForTimeout(150); assert.ok(p.pdfs.at(-1).text.startsWith('%PDF-1.4'));
  await p.click('[data-act="cert-ask"][data-k="ped"][data-op="rm"]'); await p.click('[data-act="cert-rm"]'); await until(p, '!state.pets.p.pedigree.cert');
  assert.strictEqual(await p.stored('families/u1/certs/p_ped'), undefined); assert.strictEqual((await p.stored()).pedigree.regNo, 'R'); await done(x);
});
test('8b. Certificados: rechaza archivos falsos o grandes, y los botones no aparecen sin la regla publicada', async () => {
  const x = await app({ pet: { microchip: { on: true, number: '985141000123456', owner: 'Ana' } } }), p = x.p; await p.E("go('pet','p')"); assert.strictEqual(await p.locator('[data-act^="cert-"]').count(), 0);
  await p.E('CERT_FILES=true'); await p.E('render()');
  for (const [file, msg] of [[{ name: 'x.pdf', mimeType: 'application/pdf', buffer: Buffer.from('<html>') }, /foto o un archivo PDF/], [{ name: 'g.pdf', mimeType: 'application/pdf', buffer: Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(700 * 1024)]) }, /muy grande/], [{ name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('x') }, /foto o un archivo PDF/]]) {
    const ch = p.waitForEvent('filechooser'); await p.click('[data-act="cert-add"][data-k="chip"]'); await (await ch).setFiles(file); await p.waitForTimeout(150); assert.match(await p.locator('.toast').innerText(), msg); }
  assert.strictEqual(await p.stored('families/u1/certs/p_chip'), undefined); await done(x);
});
test('Eliminar la mascota borra también sus certificados', async () => {
  const x = await app({ pet: { microchip: { on: true, number: '985141000123456', owner: 'Ana', cert: { name: 'c.jpg', type: 'image/jpeg', size: 1, at: 1 } } } }), p = x.p;
  await p.evaluate(() => { const d = JSON.parse(localStorage.FK_DB); d['families/u1/certs/p_chip'] = { petId: 'p', kind: 'chip', type: 'image/jpeg', data: 'data:image/jpeg;base64,AA', name: 'c.jpg', size: 1, at: 1 }; localStorage.FK_DB = JSON.stringify(d); });
  await p.E("removePet('p')"); await p.waitForTimeout(150); assert.strictEqual(await p.stored('families/u1/certs/p_chip'), undefined); await done(x);
});
test('10 y 11. Teléfono e inglés: sin desbordes y textos traducidos', async () => {
  const x = await app({ locale: 'en-US', pet: { pedigree: { on: true, regName: 'Canela of the Hills', regNo: 'ACC-2020-1234-XYZ', owner: 'Ana' }, microchip: { on: true, number: '985141000123456', implant: '2020-08-01', owner: 'Ana' } } }), p = x.p;
  await p.E("lang='en';go('pet','p')"); const txt = await p.locator('#app').innerText(); assert.match(txt, /Pedigree and microchip/); assert.match(txt, /Implant date/); assert.match(txt, /Aug/);
  assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'ficha sin desborde horizontal');
  await p.E('petForm(state.pets.p)'); assert.match(await p.locator('#petform').innerText(), /Does your pet have a pedigree\?[\s\S]*Registration number[\s\S]*Does your pet have a microchip\?/); assert.ok(await p.evaluate(() => { const s = document.querySelector('.sheet'); return s.scrollWidth <= s.clientWidth; }), 'formulario sin desborde');
  await p.fill('#mc-number', 'x'); await submit(p); assert.match(await p.locator('#mc-number-e').innerText(), /Use 9 to 15/); await done(x);
});
test('15. Versión gratuita: puede usar pedigrí y microchip, y el límite de mascotas no cambia', async () => {
  const x = await app({ paid: false }), p = x.p; assert.strictEqual(await p.E('isPremium()'), false); await p.E('petForm(state.pets.p)'); assert.strictEqual(await p.locator('#df-ped ~ * .pbadge, [data-k="ped"] .pbadge').count(), 0);
  await yes(p, 'chip'); await fill(p, CHIP); await submit(p); assert.ok((await p.stored()).microchip.on); assert.strictEqual(await p.E('FREE_PETS'), 1); assert.strictEqual(await p.E('petLimit()'), true); await done(x);
});
