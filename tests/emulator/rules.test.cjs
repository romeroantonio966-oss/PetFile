// Reglas contra el emulador local (Java requerido). Proyecto demo: no puede tocar producción.
// Ejecutar: npm run test:rules
const log = require('../lib/emulator-log.cjs').install(); // Los rechazos de reglas de esta suite son esperados: assertFails los exige y assertSucceeds falla si aparece uno indebido.
const { test, before, after, beforeEach } = require('node:test'); const assert = require('node:assert'); const fs = require('fs'), path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc, getDoc, deleteDoc, arrayUnion, arrayRemove, deleteField, serverTimestamp, Timestamp, writeBatch } = require('firebase/firestore');
const { ref, uploadBytes } = require('firebase/storage');
const ROOT = path.join(__dirname, '..', '..'); let env;
const FUT = Timestamp.fromMillis(Date.now() + 864e7), PAST = Timestamp.fromMillis(Date.now() - 864e5);
const db = (u) => env.authenticatedContext(u).firestore();
const seed = (fn) => env.withSecurityRulesDisabled((c) => fn(c.firestore()));
before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-petfile', firestore: { rules: fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8') }, storage: { rules: fs.readFileSync(path.join(ROOT, 'storage.rules'), 'utf8') } }); });
after(async () => { await env.cleanup(); console.log(`Rechazos de reglas registrados por el SDK en esta suite: ${log.totals.denied} (esperados en pruebas negativas). Reintentos por bloqueo: ${log.totals.aborted}.`); });
beforeEach(async () => { await env.clearFirestore(); await seed(async (d) => {
  await setDoc(doc(d, 'families/f'), { owner: 'o', members: ['o', 'm'], memberInfo: { o: { name: 'O', email: 'o@x' }, m: { name: 'M', email: 'm@x' } }, code: 'ABCDEF', paidUntil: FUT, name: 'F' });
  await setDoc(doc(d, 'families/f/pets/p'), { id: 'p', name: 'C', entries: [] });
  await setDoc(doc(d, 'familyLicenses/f'), { licenseKey: 'K' });
  await setDoc(doc(d, 'families/libre'), { owner: 'l', members: ['l'], memberInfo: { l: { name: 'L' } }, code: 'ABCDEG', name: 'L', trialStart: PAST });
  await setDoc(doc(d, 'invites/ABCDEF'), { familyId: 'f', ownerName: 'O' });
}); });
const JOIN = (u, extra) => ({ members: arrayUnion(u), ['memberInfo.' + u]: { name: 'N', email: 'n@x' }, joinCode: 'ABCDEF', ...extra });
test('Licencia: nadie lee familyLicenses', async () => { await assertFails(getDoc(doc(db('o'), 'familyLicenses/f'))); await assertFails(setDoc(doc(db('o'), 'familyLicenses/f'), { licenseKey: 'x' })); });
// Premium es familiar y solo lo escribe el servidor: la fecha nueva siempre debe DIFERIR de la guardada,
// porque Firestore no cuenta como cambio escribir el mismo valor.
const LATER = Timestamp.fromMillis(Date.now() + 9000 * 864e5);
const PAID = (u, id) => doc(db(u), 'families/' + id);
for (const [n, u, id, data] of [
  ['administrador con Premium alarga la fecha', 'o', 'f', { paidUntil: LATER }],
  ['administrador con Premium la adelanta', 'o', 'f', { paidUntil: PAST }],
  ['administrador borra la fecha', 'o', 'f', { paidUntil: deleteField() }],
  ['administrador gratis se da Premium', 'l', 'libre', { paidUntil: LATER }],
  ['administrador mezcla Premium con un cambio permitido', 'o', 'f', { name: 'Nuevo', paidUntil: LATER }],
  ['administrador cambia licencia', 'o', 'f', { licenseKey: 'x' }],
  ['administrador cambia la fecha de prueba', 'l', 'libre', { trialStart: LATER }],
  ['administrador agrega un campo de suscripción', 'o', 'f', { subscription: { active: true, until: LATER } }],
  ['administrador agrega derechos', 'o', 'f', { entitlements: { premium: true } }],
  ['integrante alarga la fecha', 'm', 'f', { paidUntil: LATER }],
  ['integrante se hace administrador', 'm', 'f', { owner: 'm' }],
  ['ajeno da Premium', 'z', 'f', { paidUntil: LATER }],
  ['al unirse con código', 'n', 'f', { members: arrayUnion('n'), 'memberInfo.n': { name: 'N' }, joinCode: 'ABCDEF', paidUntil: LATER }],
  ['al unirse a una familia gratis', 'n', 'libre', { members: arrayUnion('n'), 'memberInfo.n': { name: 'N' }, joinCode: 'ABCDEG', paidUntil: LATER }],
  ['al salir de la familia', 'm', 'f', { members: arrayRemove('m'), 'memberInfo.m': deleteField(), paidUntil: LATER }],
]) test('Premium bloqueado: ' + n, async () => assertFails(updateDoc(PAID(u, id), data)));
test('Premium bloqueado: reemplazar el documento completo', async () => { await assertFails(setDoc(PAID('l', 'libre'), { owner: 'l', members: ['l'], memberInfo: { l: { name: 'L' } }, code: 'ABCDEG', name: 'L', paidUntil: LATER })); await assertFails(setDoc(PAID('o', 'f'), { paidUntil: LATER }, { merge: true })); });
test('Premium bloqueado: en lote con un cambio válido', async () => { const d = db('o'); const b = writeBatch(d); b.update(doc(d, 'families/f'), { name: 'Nuevo' }); b.update(doc(d, 'families/f'), { paidUntil: LATER }); await assertFails(b.commit()); });
test('Premium bloqueado: al crear la familia', async () => { await assertFails(setDoc(doc(db('z'), 'families/z'), { owner: 'z', members: ['z'], memberInfo: { z: {} }, code: 'ABCDEG', paidUntil: LATER, trialStart: serverTimestamp() })); await assertFails(setDoc(doc(db('z'), 'families/z'), { owner: 'z', members: ['z'], memberInfo: { z: {} }, code: 'ABCDEG', subscription: true, trialStart: serverTimestamp() })); });
test('Premium bloqueado: crear la familia de otra persona', async () => assertFails(setDoc(doc(db('z'), 'families/y'), { owner: 'z', members: ['z'], memberInfo: { z: {} }, code: 'ABCDEG', trialStart: serverTimestamp() })));
test('Premium bloqueado: tras cada intento la fecha sigue igual', async () => { await updateDoc(PAID('o', 'f'), { paidUntil: LATER }).catch(() => {}); await seed(async (d) => { const f = (await getDoc(doc(d, 'families/f'))).data(); assert.ok(f.paidUntil.isEqual(FUT)); }); });
test('Premium: reescribir el mismo valor no otorga nada', async () => { await assertSucceeds(updateDoc(PAID('o', 'f'), { paidUntil: FUT })); await seed(async (d) => { assert.ok((await getDoc(doc(d, 'families/f'))).data().paidUntil.isEqual(FUT)); }); await assertFails(getDoc(doc(db('z'), 'families/libre'))); });
test('Premium familiar: un integrante usa los beneficios y al vencer pierde acceso', async () => { await assertSucceeds(getDoc(doc(db('m'), 'families/f/pets/p'))); await seed((d) => updateDoc(doc(d, 'families/f'), { paidUntil: PAST })); await assertFails(getDoc(doc(db('m'), 'families/f/pets/p'))); await assertSucceeds(getDoc(doc(db('o'), 'families/f/pets/p'))); });
test('Premium familiar: hasta seis integrantes', async () => { await seed((d) => updateDoc(doc(d, 'families/f'), { members: ['o', 'm', 'a', 'b', 'c'] })); await assertSucceeds(updateDoc(doc(db('n'), 'families/f'), JOIN('n'))); await seed(async (d) => { assert.strictEqual((await getDoc(doc(d, 'families/f'))).data().members.length, 6); }); await assertFails(updateDoc(doc(db('q'), 'families/f'), JOIN('q'))); });
test('Lectura: ajenos no ven familia ni mascotas', async () => { await assertFails(getDoc(doc(db('z'), 'families/f'))); await assertFails(getDoc(doc(db('z'), 'families/f/pets/p'))); await assertSucceeds(getDoc(doc(db('m'), 'families/f/pets/p'))); });
test('Mascotas: datos legítimos pasan', async () => { await assertSucceeds(setDoc(doc(db('m'), 'families/f/pets/q1'), { id: 'q1', name: 'Tom', species: 'Perro', weight: '12.5', birth: '2020-01-01', photo: null, entries: [{ id: 'e', title: 'x', date: '2026-01-01' }], createdAt: 1 })); await assertSucceeds(setDoc(doc(db('m'), 'families/f/pets/q2'), { name: 'Tom', photo: 'data:image/jpeg;base64,AAAA' })); await assertSucceeds(deleteDoc(doc(db('m'), 'families/f/pets/p'))); });
for (const [n, d, id] of [['foto activa', { name: 'x', photo: '"><img onerror=1>' }, 'a1'], ['foto svg', { name: 'x', photo: 'data:image/svg+xml;base64,AA' }, 'a2'], ['nombre no texto', { name: 5 }, 'a3'], ['sin nombre', { breed: 'x' }, 'a4'], ['entries no lista', { name: 'x', entries: 'no' }, 'a5'], ['id con comillas', { name: 'x' }, 'a"b']]) test('Mascotas: rechaza ' + n, async () => assertFails(setDoc(doc(db('m'), 'families/f/pets/' + id), d)));
test('Unirse: código correcto con Premium', async () => assertSucceeds(updateDoc(doc(db('n'), 'families/f'), JOIN('n'))));
test('Unirse: código malo', async () => assertFails(updateDoc(doc(db('n'), 'families/f'), JOIN('n', { joinCode: 'ZZZZZZ' }))));
test('Unirse: no puede reescribir la ficha de otros', async () => assertFails(updateDoc(doc(db('n'), 'families/f'), JOIN('n', { 'memberInfo.o': { name: 'hack' } }))));
test('Unirse: no puede poner HTML largo ni claves extra en su ficha', async () => assertFails(updateDoc(doc(db('n'), 'families/f'), { members: arrayUnion('n'), 'memberInfo.n': { name: 'x', admin: true }, joinCode: 'ABCDEF' })));
test('Unirse: sin Premium falla', async () => { await seed((d) => updateDoc(doc(d, 'families/f'), { paidUntil: PAST })); await assertFails(updateDoc(doc(db('n'), 'families/f'), JOIN('n'))); });
test('Unirse: máximo 6', async () => { await seed((d) => updateDoc(doc(d, 'families/f'), { members: ['o', 'm', 'a', 'b', 'c', 'e'] })); await assertFails(updateDoc(doc(db('n'), 'families/f'), JOIN('n'))); });
test('Salir: solo su ficha', async () => { await assertSucceeds(updateDoc(doc(db('m'), 'families/f'), { members: arrayRemove('m'), 'memberInfo.m': deleteField() })); });
test('Salir: no puede borrar la ficha de otro', async () => assertFails(updateDoc(doc(db('m'), 'families/f'), { members: arrayRemove('m'), 'memberInfo.o': deleteField() })));
test('Administrador: quita integrante y cambia código válido', async () => { await assertSucceeds(updateDoc(doc(db('o'), 'families/f'), { members: arrayRemove('m'), 'memberInfo.m': deleteField() })); await assertSucceeds(updateDoc(doc(db('o'), 'families/f'), { code: 'ABCDEG' })); await assertFails(updateDoc(doc(db('o'), 'families/f'), { code: '<x>' })); });
test('Cuenta nueva completa (lote del cliente)', async () => { const d = db('n'); const b = writeBatch(d), ts = serverTimestamp(); b.set(doc(d, 'users/n'), { email: 'n@x', name: 'N', lang: 'es', trialStart: ts, familyId: 'n' }); b.set(doc(d, 'families/n'), { owner: 'n', members: ['n'], memberInfo: { n: { name: 'N', email: 'n@x' } }, code: 'QWERTY', name: 'N', trialStart: ts }); b.set(doc(d, 'invites/QWERTY'), { familyId: 'n', ownerName: 'N' }); await assertSucceeds(b.commit()); });
test('Notificaciones: acepta servicios push y rechaza otras URL', async () => { await seed((d) => setDoc(doc(d, 'users/o'), { familyId: 'f' })); await assertSucceeds(setDoc(doc(db('o'), 'users/o/push/1'), { sub: { endpoint: 'https://fcm.googleapis.com/x', keys: {} }, tz: 'UTC', lang: 'es', createdAt: 1 })); await assertFails(setDoc(doc(db('o'), 'users/o/push/2'), { sub: { endpoint: 'https://evil.example/x' } })); await assertFails(setDoc(doc(db('o'), 'users/o/push/3'), { sub: { endpoint: 'https://fcm.googleapis.com.evil.example/x' } })); });
test('Recetas: solo imágenes', async () => { await assertSucceeds(setDoc(doc(db('m'), 'families/f/recetas/r'), { thumb: 'data:image/jpeg;base64,AA', petId: 'p' })); await assertFails(setDoc(doc(db('m'), 'families/f/recetas/r2'), { thumb: '"><img>' })); });
const st = (u) => env.authenticatedContext(u).storage();
test('Storage: JPEG sí; SVG, HTML y ajenos no', async () => { const B = new Uint8Array([255, 216, 255]); await assertSucceeds(uploadBytes(ref(st('m'), 'families/f/pets/p/a.jpg'), B, { contentType: 'image/jpeg' })); await assertFails(uploadBytes(ref(st('m'), 'families/f/pets/p/a.svg'), B, { contentType: 'image/svg+xml' })); await assertFails(uploadBytes(ref(st('m'), 'families/f/pets/p/a.jpg'), B, { contentType: 'text/html' })); await assertFails(uploadBytes(ref(st('z'), 'families/f/pets/p/b.jpg'), B, { contentType: 'image/jpeg' })); });
