// La auditoría de mascotas: misma lógica que petOk, solo lectura y sin mostrar datos.
const { test } = require('node:test'); const assert = require('node:assert'); const fs = require('fs'), path = require('path'); const { checkPet, audit } = require('../scripts/audit-pets.cjs');
const JPEG = 'data:image/jpeg;base64,/9j/AA'; const OK = { id: 'm1', name: 'Canela', species: 'Perro', speciesOther: '', sex: '', breed: '', weight: '12.5', birth: '', photo: JPEG, entries: [], createdAt: 1 };
test('Mascotas legítimas y antiguas compatibles', () => { for (const d of [OK, { name: 'Toby', weight: 8 }, { name: 'X', photo: null, weight: null, species: null }, { name: 'ñandú 🐾', entries: Array(2000).fill({}) }]) assert.deepStrictEqual(checkPet('mabc_-1', d), [], JSON.stringify(d).slice(0, 60)); });
test('Detecta cada motivo de petOk', () => {
  const cases = [[{}, 'sin nombre'], [{ name: '' }, 'sin nombre'], [{ name: 5 }, 'nombre no es texto'], [{ name: 'a'.repeat(201) }, 'nombre de más de 200'], [{ name: 'a', species: 3 }, 'species no es texto o es muy largo'], [{ name: 'a', breed: 'b'.repeat(201) }, 'breed no es texto o es muy largo'], [{ name: 'a', weight: {} }, 'peso con tipo no válido'], [{ name: 'a', photo: 'https://x/y.jpg' }, 'foto no es imagen base64'], [{ name: 'a', photo: 'data:image/svg+xml;base64,AA' }, 'foto no es imagen base64'], [{ name: 'a', photo: {} }, 'foto no es imagen base64'], [{ name: 'a', photo: JPEG + 'A'.repeat(900000) }, 'foto de más de 900000'], [{ name: 'a', entries: Array(2001).fill({}) }, 'más de 2000 registros'], [{ name: 'a', entries: {} }, 'historial no es lista']];
  for (const [d, m] of cases) assert.deepStrictEqual(checkPet('m1', d), [m], m); assert.deepStrictEqual(checkPet('a"b', { name: 'a' }), ['id con caracteres no permitidos']);
});
function fakeDb(docs) { // Solo expone lo que la auditoría puede usar; cualquier otra operación falla.
  const q = (lim, after) => ({ orderBy: () => q(lim, after), limit: (n) => q(n, after), startAfter: (d) => q(lim, d), get: async () => { const i = after ? docs.indexOf(after) + 1 : 0, s = docs.slice(i, i + lim); return { empty: !s.length, size: s.length, docs: s }; } });
  return new Proxy({}, { get: (_, k) => { if (k !== 'collectionGroup') throw new Error('operación no permitida: ' + String(k)); return (n) => { assert.strictEqual(n, 'pets'); return q(200); }; } });
}
const mk = (p, d) => ({ id: p.split('/').pop(), ref: { path: p }, data: () => d });
test('Cuenta por motivo y por ruta, con paginación, sin mostrar datos', async () => {
  const SECRET = 'NombreSecreto', docs = []; for (let i = 0; i < 450; i++) docs.push(mk(`families/f${i}/pets/m${i}`, { ...OK, name: SECRET + i, notes: 'historial' }));
  docs.push(mk('families/fx/pets/mbad', { name: '', photo: 'https://correo@x.co/a.jpg' })); docs.push(mk('users/u1/pets/mold', { name: SECRET, weight: [] }));
  const lines = []; const r = await audit(fakeDb(docs), (l) => lines.push(l));
  assert.strictEqual(r.revisadas, 452); assert.strictEqual(r.compatibles, 450); assert.strictEqual(r.incompatibles, 2); assert.deepStrictEqual(r.porRuta, { families: [450, 1], users: [0, 1] });
  assert.deepStrictEqual(r.motivos, { 'sin nombre': 1, 'foto no es imagen base64': 1, 'peso con tipo no válido': 1 });
  const out = lines.join('\n'); for (const bad of [SECRET, 'correo', 'historial', 'fx', 'mbad', 'u1', 'families/f', '/pets/m']) assert.ok(!out.includes(bad), 'muestra ' + bad);
});
test('El script no contiene operaciones de escritura', () => { const src = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'audit-pets.cjs'), 'utf8').replace(/^\s*\/\/.*$/gm, ''); assert.doesNotMatch(src, /\.(set|update|delete|create|add|batch|bulkWriter|recursiveDelete|runTransaction)\(/); assert.doesNotMatch(src, /cert\(|FIREBASE_SERVICE_ACCOUNT/); });
