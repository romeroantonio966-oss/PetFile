// Concurrencia con el SDK real y el emulador local (Java requerido). Proyecto demo: no puede tocar producción.
// Comprueba lo que el simulador no puede: reglas, combinación real en servidor y cola real sin conexión.
const { test, before, after, beforeEach } = require('node:test'); const assert = require('node:assert'); const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc, getDoc, deleteDoc, arrayUnion, arrayRemove, writeBatch, onSnapshot, disableNetwork, enableNetwork, Timestamp } = require('firebase/firestore');
const P = 'families/f/pets/p', rec = (id, more) => ({ id, type: 'consulta', title: id, date: '2026-01-01', ...more }); let env; const ctx = {};
const db = (u) => (ctx[u] = ctx[u] || env.authenticatedContext(u).firestore());
const read = () => env.withSecurityRulesDisabled(async (c) => (await getDoc(doc(c.firestore(), P))).data());
const members = ['a', 'b', 'c', 'd', 'e', 'g'];
const edit = (d, old, nu) => { const r = doc(d, P), b = writeBatch(d); b.update(r, { entries: arrayRemove(old) }); b.update(r, { entries: arrayUnion(nu) }); return b.commit(); };
before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-petfile', firestore: { rules: fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8') } }); });
after(() => env.cleanup());
beforeEach(() => env.withSecurityRulesDisabled(async (c) => { const d = c.firestore(); await setDoc(doc(d, 'families/f'), { owner: 'a', members, memberInfo: {}, code: 'ABCDEF', paidUntil: Timestamp.fromMillis(Date.now() + 864e7), name: 'F' }); await setDoc(doc(d, P), { id: 'p', name: 'C', weight: 12.5, entries: [rec('r1'), { title: 'sin id', date: '2019-01-01' }] }); }));

test('Las reglas aceptan agregar, editar con lote y eliminar; el resto del historial queda igual', async () => {
  await updateDoc(doc(db('a'), P), { entries: arrayUnion(rec('n1')) }); await edit(db('b'), rec('r1'), rec('r1', { notes: 'x' })); await updateDoc(doc(db('c'), P), { entries: arrayRemove(rec('n1')) });
  const d = await read(); assert.deepStrictEqual(d.entries, [{ title: 'sin id', date: '2019-01-01' }, rec('r1', { notes: 'x' })]); assert.strictEqual(d.weight, 12.5);
});
test('Seis integrantes escriben a la vez: quedan los 60 registros', async () => {
  await Promise.all(members.flatMap((u) => Array.from({ length: 10 }, (_, i) => updateDoc(doc(db(u), P), { entries: arrayUnion(rec(u + i)) }))));
  assert.strictEqual((await read()).entries.length, 62);
});
test('Sin conexión: dos integrantes guardan, se ve localmente, y al volver quedan ambos', async () => {
  const A = db('a'), B = db('b'); const seen = []; const un = onSnapshot(doc(A, P), (s) => seen.push((s.data().entries || []).length)); await new Promise((r) => setTimeout(r, 200));
  await disableNetwork(A); await disableNetwork(B); await getDoc(doc(B, P)).catch(() => {});
  const w1 = updateDoc(doc(A, P), { entries: arrayUnion(rec('Ana')) }), w2 = updateDoc(doc(B, P), { entries: arrayUnion(rec('Beto')) }), w3 = edit(A, rec('r1'), rec('r1', { notes: 'offline' }));
  await new Promise((r) => setTimeout(r, 200)); assert.strictEqual((await read()).entries.length, 2, 'nada llegó al servidor'); assert.ok(seen.includes(3), 'quien guarda lo ve de inmediato');
  await enableNetwork(A); await enableNetwork(B); await Promise.all([w1, w2, w3]); un();
  const es = (await read()).entries; assert.strictEqual(es.length, 4); assert.ok(es.some((e) => e.notes === 'offline'));
});
test('Editar datos de la mascota no toca el historial', async () => { const a = updateDoc(doc(db('a'), P), { name: 'Lola' }), b = updateDoc(doc(db('b'), P), { entries: arrayUnion(rec('n')) }); await Promise.all([a, b]); const d = await read(); assert.strictEqual(d.name, 'Lola'); assert.strictEqual(d.entries.length, 3); });
test('Mascota eliminada: el guardado se rechaza y no la recrea', async () => { await deleteDoc(doc(db('a'), P)); await assert.rejects(updateDoc(doc(db('b'), P), { entries: arrayUnion(rec('x')) })); assert.strictEqual(await read(), undefined); });
test('Un ajeno no puede agregar registros', async () => { await assert.rejects(updateDoc(doc(db('z'), P), { entries: arrayUnion(rec('x')) })); });
test('La regla de 2000 registros sigue vigente', async () => { await env.withSecurityRulesDisabled((c) => updateDoc(doc(c.firestore(), P), { entries: Array.from({ length: 2000 }, (_, i) => ({ id: 'r' + i })) })); await assert.rejects(updateDoc(doc(db('a'), P), { entries: arrayUnion(rec('x')) })); });
