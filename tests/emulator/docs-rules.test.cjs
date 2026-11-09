// Pedigrí, microchip y certificados con las reglas reales en el emulador (proyecto demo, no toca producción).
const { test, before, after, beforeEach } = require('node:test'); const assert = require('node:assert'); const fs = require('fs'), path = require('path');
require('../lib/emulator-log.cjs').install(); const { noOpenSockets } = require('../lib/open-sockets.cjs'); const { clientPool } = require('../lib/emulator-clients.cjs');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc, getDoc, deleteDoc, Timestamp } = require('firebase/firestore');
const W = () => ({ wAt: require('firebase/firestore').serverTimestamp() }); // marca que exigen las reglas en toda escritura de mascota
let env, db; const P = 'families/f/pets/p', CERT = (id = 'p_ped') => `families/f/certs/${id}`;
const PED = { on: true, regName: 'Canela', regNo: 'R1', owner: 'Ana' }, CHIP = { on: true, number: '985141000123456', owner: 'Ana', cert: { name: 'c.jpg', type: 'image/jpeg', size: 10, at: 1 } };
const JPG = 'data:image/jpeg;base64,/9j/4AAQ', PDF = 'data:application/pdf;base64,JVBERi0xLjQK';
const cert = (more) => ({ petId: 'p', kind: 'ped', name: 'pedigri.jpg', type: 'image/jpeg', data: JPG, size: 10, at: Date.now(), ...more });
before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-petfile', firestore: { rules: fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8') } }); db = clientPool(env); });
after(async () => { await env.cleanup(); await noOpenSockets(); });
beforeEach(async () => { await env.clearFirestore(); await env.withSecurityRulesDisabled(async (c) => { const d = c.firestore(); await setDoc(doc(d, 'families/f'), { owner: 'o', members: ['o', 'm'], memberInfo: {}, code: 'ABCDEF', name: 'F', paidUntil: Timestamp.fromMillis(Date.now() + 864e7) }); await setDoc(doc(d, P), { id: 'p', name: 'Canela', entries: [{ id: 'e', type: 'vacuna', title: 'Rabia', date: '2026-01-01' }] }); }); });

test('Integrantes guardan y editan pedigrí y microchip sin tocar el historial', async () => {
  await assertSucceeds(updateDoc(doc(db('o'), P), { ...W(), pedigree: PED })); await assertSucceeds(updateDoc(doc(db('m'), P), { ...W(), microchip: CHIP })); await assertSucceeds(updateDoc(doc(db('m'), P), { ...W(), pedigree: { ...PED, on: false } }));
  let d; await env.withSecurityRulesDisabled(async (c) => { d = (await getDoc(doc(c.firestore(), P))).data(); }); assert.strictEqual(d.entries.length, 1); assert.strictEqual(d.pedigree.on, false); assert.strictEqual(d.microchip.number, CHIP.number);
});
test('Mascota nueva con ambos apartados', async () => { await assertSucceeds(setDoc(doc(db('o'), 'families/f/pets/q'), { ...W(), id: 'q', name: 'Max', entries: [], pedigree: PED, microchip: CHIP })); });
test('Rechaza pedigrí o microchip que no sean un mapa corto', async () => { for (const v of ['texto', 5, ['a'], Object.fromEntries(Array.from({ length: 30 }, (_, i) => ['k' + i, 'v']))]) { await assertFails(updateDoc(doc(db('o'), P), { ...W(), pedigree: v })); await assertFails(updateDoc(doc(db('o'), P), { ...W(), microchip: v })); } });
test('Un ajeno no lee ni escribe pedigrí, microchip ni certificados', async () => {
  await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), CERT()), cert())); const z = db('z');
  await assertFails(getDoc(doc(z, P))); await assertFails(updateDoc(doc(z, P), { pedigree: PED })); await assertFails(getDoc(doc(z, CERT()))); await assertFails(setDoc(doc(z, CERT()), cert())); await assertFails(deleteDoc(doc(z, CERT())));
});
test('Certificados: un integrante sube foto o PDF, lo lee, lo reemplaza y lo elimina', async () => {
  const m = db('m'); await assertSucceeds(setDoc(doc(m, CERT()), cert())); await assertSucceeds(getDoc(doc(m, CERT()))); await assertSucceeds(setDoc(doc(m, CERT()), cert({ name: 'c.pdf', type: 'application/pdf', data: PDF })));
  await assertSucceeds(setDoc(doc(m, CERT('p_chip')), cert({ kind: 'chip' }))); await assertSucceeds(deleteDoc(doc(m, CERT())));
});
test('Certificados: rechaza tipos, contenido, ids y tamaños incorrectos', async () => {
  const o = db('o');
  for (const [id, d] of [['p_ped', cert({ type: 'image/png' })], ['p_ped', cert({ data: 'data:text/html;base64,PHNjcmlwdD4=' })], ['p_ped', cert({ type: 'application/pdf', data: JPG })], ['p_ped', cert({ data: 'data:image/jpeg;base64,"><script>' })], ['p_ped', cert({ kind: 'otro' })],
    ['q_ped', cert()], ['p_chip', cert()], ['x"><b>_ped', cert({ petId: 'x"><b>' })], ['p_ped', cert({ extra: 1 })], ['p_ped', cert({ size: 'x' })], ['p_ped', cert({ name: 'n'.repeat(121) })], ['p_ped', cert({ data: JPG + 'A'.repeat(940000) })]]) await assertFails(setDoc(doc(o, CERT(id)), d));
});
test('Certificados: un integrante de familia sin Premium vigente no accede', async () => {
  await env.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), CERT()), cert()); await updateDoc(doc(c.firestore(), 'families/f'), { paidUntil: Timestamp.fromMillis(1) }); });
  await assertFails(getDoc(doc(db('m'), CERT()))); await assertSucceeds(getDoc(doc(db('o'), CERT())), 'el administrador sigue usando su familia');
});
