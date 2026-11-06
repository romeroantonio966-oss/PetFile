// Paridad: el veredicto de scripts/audit-pets.cjs debe coincidir con lo que firestore.rules acepta al volver a guardar la mascota.
const { test, before, after } = require('node:test'); const assert = require('node:assert'); const fs = require('fs'), path = require('path');
require('../lib/emulator-log.cjs').install(); const { noOpenSockets } = require('../lib/open-sockets.cjs');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing'); const { doc, setDoc, Timestamp } = require('firebase/firestore'); const { checkPet } = require('../../scripts/audit-pets.cjs');
const JPEG = 'data:image/jpeg;base64,/9j/AA'; let env;
const SAMPLES = [['ok', { name: 'Canela', species: 'Perro', weight: '12.5', photo: JPEG, entries: [] }], ['viejo', { name: 'Toby', weight: 8 }], ['nulos', { name: 'X', photo: null, weight: null, species: null }], ['emoji', { name: 'ñandú 🐾'.repeat(20) }],
  ['sinNombre', {}], ['vacio', { name: '' }], ['numNombre', { name: 5 }], ['largo', { name: 'a'.repeat(201) }], ['especie', { name: 'a', species: 3 }], ['raza', { name: 'a', breed: 'b'.repeat(201) }], ['peso', { name: 'a', weight: { k: 1 } }],
  ['url', { name: 'a', photo: 'https://x/y.jpg' }], ['svg', { name: 'a', photo: 'data:image/svg+xml;base64,AA' }], ['fotoGrande', { name: 'a', photo: JPEG + 'A'.repeat(900000) }], ['muchos', { name: 'a', entries: Array.from({ length: 2001 }, (_, i) => ({ i })) }], ['noLista', { name: 'a', entries: { a: 1 } }], ['limite', { name: 'a', entries: Array.from({ length: 2000 }, (_, i) => ({ i })) }]];
before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-petfile', firestore: { rules: fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8') } });
  await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'families/f'), { owner: 'o', members: ['o'], memberInfo: {}, code: 'ABCDEF', name: 'F', paidUntil: Timestamp.fromMillis(Date.now() + 864e7) })); });
after(async () => { await env.cleanup(); await noOpenSockets(); });
for (const [id, d] of SAMPLES) test(`Paridad con las reglas: ${id}`, async () => {
  const want = checkPet(id, d).length === 0; let got = true; try { await setDoc(doc(env.authenticatedContext('o').firestore(), 'families/f/pets/' + id), d); } catch (e) { assert.strictEqual(e.code, 'permission-denied', e.message); got = false; }
  assert.strictEqual(got, want, `script dice ${want ? 'compatible' : 'incompatible'}, reglas ${got ? 'aceptan' : 'rechazan'}`);
});
