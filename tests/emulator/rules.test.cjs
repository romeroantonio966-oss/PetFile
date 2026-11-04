// Reglas contra el emulador local (Java requerido). Proyecto demo: no puede tocar producción.
// Ejecutar: npm run test:rules
const { test, before, after, beforeEach } = require('node:test'); const assert = require('node:assert'); const fs = require('fs'), path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc, getDoc, deleteDoc, arrayUnion, arrayRemove, deleteField, serverTimestamp, Timestamp, writeBatch } = require('firebase/firestore');
const { ref, uploadBytes } = require('firebase/storage');
const ROOT = path.join(__dirname, '..', '..'); let env;
const FUT = Timestamp.fromMillis(Date.now() + 864e7), PAST = Timestamp.fromMillis(Date.now() - 864e5);
const db = (u) => env.authenticatedContext(u).firestore();
const seed = (fn) => env.withSecurityRulesDisabled((c) => fn(c.firestore()));
before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-petfile', firestore: { rules: fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8') }, storage: { rules: fs.readFileSync(path.join(ROOT, 'storage.rules'), 'utf8') } }); });
after(() => env.cleanup());
beforeEach(async () => { await env.clearFirestore(); await seed(async (d) => {
  await setDoc(doc(d, 'families/f'), { owner: 'o', members: ['o', 'm'], memberInfo: { o: { name: 'O', email: 'o@x' }, m: { name: 'M', email: 'm@x' } }, code: 'ABCDEF', paidUntil: FUT, name: 'F' });
  await setDoc(doc(d, 'families/f/pets/p'), { id: 'p', name: 'C', entries: [] });
  await setDoc(doc(d, 'familyLicenses/f'), { licenseKey: 'K' });
  await setDoc(doc(d, 'invites/ABCDEF'), { familyId: 'f', ownerName: 'O' });
}); });
const JOIN = (u, extra) => ({ members: arrayUnion(u), ['memberInfo.' + u]: { name: 'N', email: 'n@x' }, joinCode: 'ABCDEF', ...extra });
test('Licencia: nadie lee familyLicenses', async () => { await assertFails(getDoc(doc(db('o'), 'familyLicenses/f'))); await assertFails(setDoc(doc(db('o'), 'familyLicenses/f'), { licenseKey: 'x' })); });
test('Premium: ni el administrador se lo pone', async () => { await assertFails(updateDoc(doc(db('o'), 'families/f'), { paidUntil: FUT })); await assertFails(setDoc(doc(db('z'), 'families/z'), { owner: 'z', members: ['z'], memberInfo: { z: {} }, code: 'ABCDEG', paidUntil: FUT, trialStart: serverTimestamp() })); });
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
