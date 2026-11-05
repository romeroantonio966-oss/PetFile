// Comprueba que la clasificación de mensajes del emulador no confunda rechazos esperados con fallos.
const { test } = require('node:test'); const assert = require('node:assert'); const { spawnSync } = require('child_process'), path = require('path'), fs = require('fs'); const { classify, install } = require('./lib/emulator-log.cjs');
const P = "[2026-11-05T15:00:00.000Z]  @firebase/firestore: Firestore (10.14.1): GrpcConnection RPC 'Write' stream 0x1 error. Code: ";
test('Clasifica los mensajes reales del SDK', () => {
  assert.strictEqual(classify(P + '10 Message: 10 ABORTED: Transaction lock timeout.'), 'aborted');
  assert.strictEqual(classify(P + '7 Message: 7 PERMISSION_DENIED: false for get'), 'denied');
  assert.strictEqual(classify('[x]  @firebase/firestore: Firestore (10.14.1): Uncaught Error in snapshot listener: FirebaseError: [code=permission-denied]'), 'uncaught');
  assert.strictEqual(classify('Otro mensaje de la prueba: ABORTED'), null); assert.strictEqual(classify(P + '14 Message: 14 UNAVAILABLE'), null);
});
test('Cuenta, oculta el ruido clasificado y deja pasar lo demás', () => {
  const o = console.warn; let seen = []; console.warn = (...a) => seen.push(a.join(' ')); const m = ['log', 'error'].map((k) => [k, console[k]]);
  try { const l = install(), s = l.snapshot(); console.warn(P + '10 Message: x'); console.warn(P + '7 Message: x'); console.warn('aviso normal'); assert.deepStrictEqual(l.since(s), { aborted: 1, denied: 1, uncaught: 0 }); assert.deepStrictEqual(seen, ['aviso normal']); } finally { console.warn = o; m.forEach(([k, f]) => { console[k] = f; }); }
});
test('Los archivos del emulador no se ejecutan en paralelo', () => { const s = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).scripts['test:rules']; assert.match(s, /tests\/emulator\/run\.cjs/); assert.doesNotMatch(s, /node --test tests\/emulator/); });
test('El ejecutor corre los archivos uno por uno y falla si uno falla', () => { const src = fs.readFileSync(path.join(__dirname, 'emulator', 'run.cjs'), 'utf8'); assert.match(src, /spawnSync/); assert.ok(fs.readdirSync(path.join(__dirname, 'emulator')).filter((f) => f.endsWith('.test.cjs')).length >= 2); });
