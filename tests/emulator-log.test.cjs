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
test('Hay más de un archivo y el ejecutor no los lanza en paralelo', () => { const src = fs.readFileSync(path.join(__dirname, 'emulator', 'run.cjs'), 'utf8'); assert.match(src, /for \(const f of files\)/); assert.ok(fs.readdirSync(path.join(__dirname, 'emulator')).filter((f) => f.endsWith('.test.cjs')).length >= 2); });
// Regresión: las conexiones que quedan abiertas no deben colgar la corrida ni ocultar fallos.
const { runFile, nodeOk } = require('./lib/run-file.cjs'); const FX = (n) => path.join(__dirname, 'fixtures', n); const quick = { testTimeout: 2000, watchdog: 30000, stdio: 'pipe' };
test('Conexión abierta tras pasar: termina con éxito y sin colgarse', () => { const t = Date.now(), r = runFile(FX('open-handle-pass.cjs'), quick); assert.strictEqual(r.ok, true, r.why); assert.ok(Date.now() - t < 20000); assert.doesNotMatch(r.output, /still pending/); });
test('Conexión abierta tras fallar: sigue reportando el fallo', () => { const r = runFile(FX('open-handle-fail.cjs'), quick); assert.strictEqual(r.ok, false); assert.match(r.why, /código de salida/); assert.match(r.output, /fallo real/); });
test('Promesa pendiente: falla por tiempo, no queda colgada', () => { const r = runFile(FX('pending-promise.cjs'), quick); assert.strictEqual(r.ok, false); assert.match(r.why, /código de salida/); assert.match(r.output, /timed out/); });
test('El vigilante reporta una corrida que no termina', () => { const r = runFile(FX('pending-promise.cjs'), { testTimeout: 60000, watchdog: 1500, stdio: 'pipe' }); assert.strictEqual(r.ok, false); assert.match(r.why, /no terminó/); });
test('Versión de Node', () => { assert.strictEqual(nodeOk('18.20.0'), false); assert.strictEqual(nodeOk('22.0.0'), true); assert.strictEqual(nodeOk('26.13.0'), true); });

// Regresión: leer con withSecurityRulesDisabled devolvía siempre undefined, y una prueba de "mascota eliminada" pasaba sin comprobar nada.
const { readDoc, mustRead } = require('./lib/emulator-read.cjs');
const voidEnv = { withSecurityRulesDisabled: async (cb) => { await cb({}); } }; // Igual que la biblioteca: descarta el retorno.
const found = (d) => async () => ({ exists: () => d !== undefined, data: () => d });
test('La lectura devuelve el dato aunque la biblioteca descarte el retorno', async () => { assert.deepStrictEqual(await mustRead(voidEnv, 'families/f/pets/p', found({ name: 'C' })), { name: 'C' }); assert.strictEqual((await readDoc(voidEnv, 'x/y', found(undefined))).exists, false); });
test('Si falta el documento, el error dice cuál y no undefined', async () => { await assert.rejects(mustRead(voidEnv, 'families/f/pets/p', found(undefined)), /Falta families\/f\/pets\/p.*families\/f tampoco existe/); });
const TAKES_RETURN = /withSecurityRulesDisabled\([^\n{]*\.(data\(\)|entries)/;
test('Ninguna prueba toma el retorno de withSecurityRulesDisabled', () => {
  assert.match("const read = () => env.withSecurityRulesDisabled(async (c) => (await getDoc(doc(c.firestore(), P))).data());", TAKES_RETURN);
  assert.match("const kept = await env.withSecurityRulesDisabled(async (c) => (await x).data().entries.length);", TAKES_RETURN);
  for (const f of ['emulator/concurrency.test.cjs', 'emulator/rules.test.cjs', 'load/emulator-load.cjs']) assert.doesNotMatch(fs.readFileSync(path.join(__dirname, f), 'utf8'), TAKES_RETURN, f);
});

// Regresión: una llamada de más a enableNetwork dejaba una conexión del SDK abierta y el proceso seguía vivo al terminar las pruebas.
const net = require('net'); const { noOpenSockets, openSockets } = require('./lib/open-sockets.cjs');
test('El control de cierre pasa sin conexiones y falla si queda una abierta', async () => {
  await noOpenSockets({ wait: 200 });
  const srv = net.createServer().listen(0); await new Promise((r) => srv.once('listening', r)); const c = net.connect(srv.address().port); await new Promise((r) => c.once('connect', r));
  assert.ok(openSockets() > 0); await assert.rejects(noOpenSockets({ wait: 300 }), /Quedan \d+ conexiones abiertas/);
  c.destroy(); for (const k of [...(srv._conns || [])]) k.destroy(); await new Promise((r) => srv.close(r)); await noOpenSockets({ wait: 2000 });
});
test('La suite no reactiva una red ya activa', () => { const src = fs.readFileSync(path.join(__dirname, 'emulator', 'concurrency.test.cjs'), 'utf8'); assert.doesNotMatch(src, /finally \{[^}\n]*(?<!if \(offline\) \{ await )enableNetwork\(A\)/); assert.match(src, /if \(offline\) \{ await enableNetwork/); assert.match(src, /await noOpenSockets\(\)/); });
test('La aplicación no usa enableNetwork ni disableNetwork', () => { assert.doesNotMatch(fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8'), /(enable|disable)Network/); });

// Regresión: la prueba de carga guardaba el contexto y volvía a llamar firestore(); solo salía la primera escritura de cada integrante.
const { clientPool, auditWrites } = require('./lib/emulator-clients.cjs');
const strictEnv = () => { let ctxs = 0; return { get ctxs() { return ctxs; }, authenticatedContext: () => { ctxs++; let used = false; const client = {}; return { firestore: () => { if (used) throw Object.assign(new Error('Firestore has already been started'), { code: 'failed-precondition' }); used = true; return client; } }; } }; };
test('Un cliente por usuario, sin reconfigurar Firestore', () => { const env = strictEnv(), db = clientPool(env), a = db('a'); assert.strictEqual(db('a'), a); assert.notStrictEqual(db('b'), a); assert.strictEqual(env.ctxs, 2); });
test('El error original sí falla con el simulador de la biblioteca', () => { const env = strictEnv(), ctx = {}, bad = (u) => (ctx[u] = ctx[u] || env.authenticatedContext(u)).firestore(); bad('a'); assert.throws(() => bad('a'), /already been started/); });
test('Ninguna prueba guarda el contexto para volver a pedir firestore()', () => { for (const f of ['load/emulator-load.cjs', 'emulator/concurrency.test.cjs']) assert.doesNotMatch(fs.readFileSync(path.join(__dirname, f), 'utf8'), /authenticatedContext\(\w+\)\)\.firestore\(\)/, f); assert.match(fs.readFileSync(path.join(__dirname, 'load/emulator-load.cjs'), 'utf8'), /clientPool\(env\)/); assert.doesNotMatch("const db = (u) => (ctx[u] = ctx[u] || env.authenticatedContext(u).firestore());", /authenticatedContext\(\w+\)\)\.firestore\(\)/); assert.match("(ctx[u] = ctx[u] || env.authenticatedContext(u)).firestore()", /authenticatedContext\(\w+\)\)\.firestore\(\)/); });
test('Auditoría: distingue perdidos, sin confirmar y correcto', () => {
  assert.deepStrictEqual(auditWrites({ attempted: 90, confirmed: 90, kept: 90 }).issues, []);
  const never = auditWrites({ attempted: 90, confirmed: 6, kept: 6 }); assert.strictEqual(never.lost, 0); assert.strictEqual(never.unconfirmed, 84); assert.strictEqual(never.issues.length, 1, 'no es pérdida, pero sigue siendo fallo');
  const lost = auditWrites({ attempted: 90, confirmed: 90, kept: 89 }); assert.strictEqual(lost.lost, 1); assert.match(lost.issues[0], /PÉRDIDA REAL/);
});

// El respaldo de las reglas publicadas no debe modificarse: es la base para restaurar producción.
test('Respaldo de reglas publicadas intacto', () => {
  const crypto = require('crypto'), dir = path.join(__dirname, '..', 'rules-backup'); const want = fs.readFileSync(path.join(dir, 'README.md'), 'utf8').match(/SHA-256[^`]*`([0-9a-f]{64})`/)[1];
  assert.strictEqual(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, 'firestore.published-2026-11-06.rules'), 'utf8').replace(/\r\n/g, '\n')).digest('hex'), want); // Windows puede descargarlo con CRLF
  assert.ok(fs.readdirSync(path.join(__dirname, 'emulator')).includes('compat-main.test.cjs'));
});
