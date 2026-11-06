// La revisión de compatibilidad debe ser de solo lectura y no mostrar contenido de las recetas.
const { test } = require('node:test'); const assert = require('node:assert'); const fs = require('fs'), path = require('path'); const { checkReceta, checkRecetaImg, audit } = require('../scripts/audit-recetas.cjs');
const OK = { petId: 'p', title: 'T', date: '2026-01-01', vet: '', notes: '', thumb: 'data:image/jpeg;base64,AA', createdAt: 1 };
test('Receta legítima sin diferencias', () => { assert.deepStrictEqual(checkReceta('AbC123', OK), []); assert.deepStrictEqual(checkRecetaImg('AbC123', { petId: 'p' }), []); });
test('Detecta cada diferencia', () => { assert.deepStrictEqual(checkReceta('"><b>', { ...OK, date: 5, extra: 1, thumb: 'x', petId: 7, title: {}, createdAt: 'y' }).sort(), ['campos extra', 'createdAt', 'date', 'id', 'petId', 'thumb', 'title'].sort()); });
test('Solo lee y no muestra contenido', async () => {
  const secret = 'NOTA-PRIVADA'; const coll = (docs) => ({ select: () => coll(docs), get: async () => ({ size: docs.length, docs: docs.map(([id, d]) => ({ id, ref: { path: 'families/f/x/' + id }, data: () => d })) }) });
  const db = new Proxy({}, { get: (_, k) => { if (k !== 'collectionGroup') throw new Error('operación no permitida: ' + String(k)); return (n) => coll(n === 'recetas' ? [['bien', OK], ['"><b>', { ...OK, notes: secret, date: 5 }]] : [['bien', { petId: 'p' }]]); } });
  const lines = []; const r = await audit(db, (l) => lines.push(l)); assert.strictEqual(r.recetas, 2); assert.strictEqual(r.conProblema, 1); assert.deepStrictEqual(r.tipos, { id: 1, date: 1 }); assert.ok(!lines.join('\n').includes(secret));
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname, '..', 'scripts', 'audit-recetas.cjs'), 'utf8').replace(/^\/\/.*$/gm, ''), /\.(set|update|delete|create|add|batch|recursiveDelete|runTransaction)\(/);
});
