// Compatibilidad: repite las escrituras que hace la web publicada (main, 0688783) tal como las envía,
// contra las reglas publicadas (respaldo del 2026-11-06) y contra las reglas nuevas de mobile-app.
// Proyecto demo en el emulador local: no toca producción.
const { describe, test, before, after, beforeEach } = require('node:test'); const assert = require('node:assert'); const fs = require('fs'), path = require('path');
const { install } = require('../lib/emulator-log.cjs'); const log = install(); const { noOpenSockets } = require('../lib/open-sockets.cjs'); const { clientPool } = require('../lib/emulator-clients.cjs'); const { readDoc } = require('../lib/emulator-read.cjs');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc, getDoc, getDocs, deleteDoc, collection, writeBatch, arrayUnion, arrayRemove, deleteField, serverTimestamp, Timestamp } = require('firebase/firestore');
const ROOT = path.join(__dirname, '..', '..');
const RULES = [['publicadas', 'rules-backup/firestore.published-2026-11-06.rules'], ['mobile-app', 'firestore.rules']];
const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const newCode = () => Array.from({ length: 6 }, () => A[Math.floor(Math.random() * A.length)]).join(''); // igual que main
const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); // ids de mascota de main
const OWNER = 'Kq3xYQ2pLm9TfV1sOwnerAAAAAA1', MEMBER = 'Zr8wPq1nMb7UcX2dMemberBBBBB2', OTHER = 'Hh4tGr5eWq6YuI7oOtherCCCCCC3';
const JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
const receta = (id) => ({ id, type: 'receta', title: 'Amoxicilina 250 mg', date: '2026-11-06', vet: 'Dra. Muñoz', notes: 'Cada 8 horas por 7 días' });
const dieta = (id) => ({ id, type: 'dieta', title: 'Pollo con arroz', ingredients: 'Pollo, arroz', steps: 'Hervir', dose: '200 g', freq: '2 veces al día', date: '2026-11-06', vet: '', notes: '' });
const petLikeMain = (id, more) => ({ id, name: 'Canela', species: 'Perro', speciesOther: '', sex: '', breed: '', weight: '12.5', birth: '', photo: null, entries: [], createdAt: Date.now(), ...more }); // persist() de main
const PET = (fid, id) => `families/${fid}/pets/${id}`;

for (const [label, file] of RULES) describe(`Web publicada con reglas ${label}`, () => {
  let env, db; const S = (fn) => env.withSecurityRulesDisabled((c) => fn(c.firestore()));
  before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-petfile', firestore: { rules: fs.readFileSync(path.join(ROOT, file), 'utf8') } }); db = clientPool(env); });
  after(async () => { await env.cleanup(); });
  // Escritura de mascota tal como la envía main (sin wAt). Con las reglas nuevas se rechaza y la misma escritura con wAt pasa.
  const W = () => ({ wAt: serverTimestamp() });
  const oldW = async (mk) => { if (label === 'mobile-app') { await assertFails(mk({})); await assertSucceeds(mk(W())); } else await assertSucceeds(mk({})); };
  // Familia del administrador con Premium vigente, un integrante y una mascota con historial.
  beforeEach(async () => { await env.clearFirestore(); await S(async (d) => {
    await setDoc(doc(d, 'users/' + OWNER), { email: 'o@x.co', name: 'Ana', lang: 'es', trialStart: Timestamp.fromMillis(1), familyId: OWNER });
    await setDoc(doc(d, 'users/' + MEMBER), { email: 'm@x.co', name: 'Beto', lang: 'es', trialStart: Timestamp.fromMillis(2), familyId: OWNER });
    await setDoc(doc(d, 'families/' + OWNER), { owner: OWNER, members: [OWNER, MEMBER], memberInfo: { [OWNER]: { name: 'Ana', email: 'o@x.co' }, [MEMBER]: { name: 'Beto', email: 'm@x.co' } }, code: 'K7M2QX', name: 'Ana', trialStart: Timestamp.fromMillis(1), paidUntil: Timestamp.fromMillis(Date.now() + 864e7) });
    await setDoc(doc(d, 'invites/K7M2QX'), { familyId: OWNER, ownerName: 'Ana' });
    await setDoc(doc(d, PET(OWNER, 'mexist1')), petLikeMain('mexist1', { entries: [receta('r1'), dieta('d1')] }));
  }); });

  test('Cuenta nueva: usuario, familia propia e invitación en un lote', async () => {
    const d = db(OTHER), code = newCode(), ts = serverTimestamp(), b = writeBatch(d), name = 'carla';
    b.set(doc(d, 'users/' + OTHER), { email: 'c@x.co', name, lang: 'es', trialStart: ts, familyId: OTHER });
    b.set(doc(d, 'families/' + OTHER), { owner: OTHER, members: [OTHER], memberInfo: { [OTHER]: { name, email: 'c@x.co' } }, code, name, trialStart: ts });
    b.set(doc(d, 'invites/' + code), { familyId: OTHER, ownerName: name }); await assertSucceeds(b.commit());
  });
  test('Cuenta de la versión anterior: crea su familia, pasa sus mascotas y guarda familyId', async () => {
    await S(async (d) => { await setDoc(doc(d, 'users/' + OTHER), { email: 'c@x.co', name: 'Carla', lang: 'en', trialStart: Timestamp.fromMillis(3) }); await setDoc(doc(d, `users/${OTHER}/pets/mold1`), petLikeMain('mold1', { entries: [receta('r9')] })); });
    const d = db(OTHER), acct = (await getDoc(doc(d, 'users/' + OTHER))).data(), code = newCode(), b = writeBatch(d);
    b.set(doc(d, 'families/' + OTHER), { owner: OTHER, members: [OTHER], memberInfo: { [OTHER]: { name: 'Carla', email: 'c@x.co' } }, code, name: 'Carla', trialStart: acct.trialStart });
    b.set(doc(d, 'invites/' + code), { familyId: OTHER, ownerName: 'Carla' }); await assertSucceeds(b.commit());
    for (const p of (await getDocs(collection(d, `users/${OTHER}/pets`))).docs) await oldW((x) => setDoc(doc(d, PET(OTHER, p.id)), { ...p.data(), ...x }));
    await assertSucceeds(updateDoc(doc(d, 'users/' + OTHER), { familyId: OTHER }));
  });
  test('Mascota: crear con foto, editar y eliminar, como persist() de main', async () => {
    const d = db(OWNER), id = uid('m'); await oldW((x) => setDoc(doc(d, PET(OWNER, id)), petLikeMain(id, { photo: JPEG, birth: '2020-05-01', sex: 'Hembra', ...x })));
    const cur = (await getDoc(doc(d, PET(OWNER, id)))).data(); await oldW((x) => setDoc(doc(d, PET(OWNER, id)), { ...cur, name: 'Canelita', weight: '13', photo: null, ...x }));
    await assertSucceeds(deleteDoc(doc(d, PET(OWNER, id))));
  });
  test('Administrador sin Premium sigue usando su propia familia', async () => {
    await S((d) => updateDoc(doc(d, 'families/' + OWNER), { paidUntil: Timestamp.fromMillis(1) })); const d = db(OWNER), id = uid('m');
    await oldW((x) => setDoc(doc(d, PET(OWNER, id)), petLikeMain(id, x))); await assertSucceeds(getDoc(doc(d, PET(OWNER, 'mexist1'))));
  });
  test('Receta y dieta en el historial: main reescribe la mascota completa', async () => {
    for (const u of [OWNER, MEMBER]) { const d = db(u), cur = (await getDoc(doc(d, PET(OWNER, 'mexist1')))).data();
      await oldW((x) => setDoc(doc(d, PET(OWNER, 'mexist1')), { ...JSON.parse(JSON.stringify({ ...cur, entries: cur.entries.concat(receta('r' + u), dieta('d' + u)) })), ...x })); }
    const cur = (await getDoc(doc(db(OWNER), PET(OWNER, 'mexist1')))).data(); await oldW((x) => setDoc(doc(db(OWNER), PET(OWNER, 'mexist1')), { ...cur, entries: cur.entries.filter((e) => e.id !== 'r1'), ...x }));
  });
  test('Receta y dieta con arrayUnion y arrayRemove, como guarda mobile-app', async () => {
    const r = doc(db(MEMBER), PET(OWNER, 'mexist1')); await assertSucceeds(updateDoc(r, { ...W(), entries: arrayUnion(receta('r2'), dieta('d2')) }));
    const b = writeBatch(db(OWNER)), ro = doc(db(OWNER), PET(OWNER, 'mexist1')); b.update(ro, { ...W(), entries: arrayRemove(dieta('d1')) }); b.update(ro, { ...W(), entries: arrayUnion({ ...dieta('d1'), dose: '250 g' }) }); await assertSucceeds(b.commit());
    await assertSucceeds(updateDoc(r, { ...W(), entries: arrayRemove(receta('r1')) }));
    const es = (await readDoc(env, PET(OWNER, 'mexist1'))).data.entries; assert.deepStrictEqual(es.map((e) => e.id).sort(), ['d1', 'd2', 'r2']); assert.strictEqual(es.find((e) => e.id === 'd1').dose, '250 g');
  });
  test('Unirse con código: se suma, pasa sus mascotas y cambia su familyId', async () => {
    await S(async (d) => { await setDoc(doc(d, 'users/' + OTHER), { email: 'c@x.co', name: 'Carla', lang: 'es', trialStart: Timestamp.fromMillis(3), familyId: OTHER }); await setDoc(doc(d, 'families/' + OTHER), { owner: OTHER, members: [OTHER], memberInfo: { [OTHER]: { name: 'Carla', email: 'c@x.co' } }, code: 'ZZZ222', name: 'Carla', trialStart: Timestamp.fromMillis(3) }); await setDoc(doc(d, PET(OTHER, 'mcarla')), petLikeMain('mcarla', { entries: [dieta('dc')] })); });
    const d = db(OTHER); await assertSucceeds(getDoc(doc(d, 'invites/K7M2QX')));
    await assertSucceeds(updateDoc(doc(d, 'families/' + OWNER), { members: arrayUnion(OTHER), ['memberInfo.' + OTHER]: { name: 'Carla', email: 'c@x.co' }, joinCode: 'K7M2QX' }));
    const p = (await getDoc(doc(d, PET(OTHER, 'mcarla')))).data(); await oldW((x) => setDoc(doc(d, PET(OWNER, 'mcarla')), { ...JSON.parse(JSON.stringify(p)), ...x })); await assertSucceeds(deleteDoc(doc(d, PET(OTHER, 'mcarla'))));
    await assertSucceeds(updateDoc(doc(d, 'users/' + OTHER), { familyId: OWNER }));
  });
  test('Salir de la familia y volver a la propia', async () => {
    await S((d) => setDoc(doc(d, 'families/' + MEMBER), { owner: MEMBER, members: [MEMBER], memberInfo: { [MEMBER]: { name: 'Beto', email: 'm@x.co' } }, code: 'BETO22', name: 'Beto', trialStart: Timestamp.fromMillis(2) }));
    const d = db(MEMBER); await assertSucceeds(updateDoc(doc(d, 'families/' + OWNER), { members: arrayRemove(MEMBER), ['memberInfo.' + MEMBER]: deleteField() }));
    await assertSucceeds(getDoc(doc(d, 'families/' + MEMBER))); await assertSucceeds(updateDoc(doc(d, 'users/' + MEMBER), { familyId: MEMBER }));
  });
  test('Administrador: quita a un integrante y cambia el código', async () => {
    const d = db(OWNER); await assertSucceeds(updateDoc(doc(d, 'families/' + OWNER), { members: arrayRemove(MEMBER), ['memberInfo.' + MEMBER]: deleteField() }));
    const code = newCode(), b = writeBatch(d); b.update(doc(d, 'families/' + OWNER), { code }); b.set(doc(d, 'invites/' + code), { familyId: OWNER, ownerName: 'Ana' }); b.delete(doc(d, 'invites/K7M2QX')); await assertSucceeds(b.commit());
  });
  test('Receta con foto como la creaba main, y su eliminación', async () => {
    const d = db(MEMBER), ref = doc(collection(d, `families/${OWNER}/recetas`)); await assertSucceeds(setDoc(doc(d, `families/${OWNER}/recetasImg/${ref.id}`), { img: JPEG, petId: 'mexist1' }));
    await assertSucceeds(setDoc(ref, { petId: 'mexist1', title: 'Receta', date: '2026-11-06', vet: '', notes: '', thumb: JPEG, createdAt: Date.now() }));
    await assertSucceeds(deleteDoc(ref)); await assertSucceeds(deleteDoc(doc(d, `families/${OWNER}/recetasImg/${ref.id}`)));
  });
  test('Notificaciones web: crear, actualizar con merge y borrar', async () => {
    const d = db(OWNER), r = doc(d, `users/${OWNER}/push/abc123`), sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc:xyz', expirationTime: null, keys: { p256dh: 'BPk', auth: 'q1' } };
    await assertSucceeds(setDoc(r, { sub, tz: 'America/Costa_Rica', lang: 'es', createdAt: Date.now() }));
    await assertSucceeds(setDoc(r, { sub, tz: 'America/Costa_Rica', lang: 'es', updatedAt: Date.now() }, { merge: true })); await assertSucceeds(deleteDoc(r));
  });
  test('Usuarios existentes: leen su expediente y editan una mascota con datos antiguos', async () => {
    await S((d) => setDoc(doc(d, PET(OWNER, 'mviejo')), { id: 'mviejo', name: 'Toby', weight: 8, entries: [{ title: 'sin id', date: '2019-01-01' }, { id: 'v', type: 'vacuna', title: 'Rabia', date: '2020-01-01', next: '2021-01-01' }], createdAt: 5 }));
    for (const u of [OWNER, MEMBER]) { const d = db(u); await assertSucceeds(getDoc(doc(d, 'families/' + OWNER))); await assertSucceeds(getDocs(collection(d, `families/${OWNER}/pets`))); }
    const d = db(MEMBER), cur = (await getDoc(doc(d, PET(OWNER, 'mviejo')))).data(); await oldW((x) => setDoc(doc(d, PET(OWNER, 'mviejo')), { ...cur, entries: cur.entries.concat(receta('rn')), ...x }));
  });
  test('Teléfono con la versión vieja y el historial desactualizado no borra registros nuevos', async () => {
    const stale = (await getDoc(doc(db(MEMBER), PET(OWNER, 'mexist1')))).data();
    await assertSucceeds(updateDoc(doc(db(OWNER), PET(OWNER, 'mexist1')), { ...W(), entries: arrayUnion(receta('rnueva')) }));
    const p = setDoc(doc(db(MEMBER), PET(OWNER, 'mexist1')), { ...stale, name: 'Canela editada' });
    if (label === 'mobile-app') { await assertFails(p); assert.ok((await readDoc(env, PET(OWNER, 'mexist1'))).data.entries.some((e) => e.id === 'rnueva')); } else await assertSucceeds(p);
  });
  test('Un ajeno sigue sin acceso', async () => { const d = db(OTHER); await assertFails(getDoc(doc(d, PET(OWNER, 'mexist1')))); await assertFails(setDoc(doc(d, PET(OWNER, 'x1')), petLikeMain('x1'))); });

  // Diferencias conocidas: solo las reglas nuevas las rechazan. Main nunca envía estos datos, pero una mascota ya guardada así no podría volver a guardarse.
  const known = (name, fn) => test(`Diferencia conocida: ${name}`, async () => { const p = fn(); if (label === 'mobile-app') await assertFails(p); else await assertSucceeds(p); });
  known('mascota con foto que no es imagen base64', () => S((d) => setDoc(doc(d, PET(OWNER, 'mfoto')), petLikeMain('mfoto', { photo: 'https://ejemplo.com/a.jpg' }))).then(() => setDoc(doc(db(OWNER), PET(OWNER, 'mfoto')), petLikeMain('mfoto', { photo: 'https://ejemplo.com/a.jpg', name: 'Otro' }))));
  known('mascota sin nombre', () => setDoc(doc(db(OWNER), PET(OWNER, 'msin')), petLikeMain('msin', { name: '' })));
  known('mascota con más de 2000 registros', () => setDoc(doc(db(OWNER), PET(OWNER, 'mgrande')), petLikeMain('mgrande', { entries: Array.from({ length: 2001 }, (_, i) => ({ id: 'e' + i })) })));
});
after(async () => { console.log(`Resumen del SDK: ${log.totals.aborted} reintentos por bloqueo, ${log.totals.denied} rechazos de reglas (esperados en pruebas negativas), ${log.totals.uncaught} errores de listener.`); await noOpenSockets(); });
