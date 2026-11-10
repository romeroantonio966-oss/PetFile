// Regresión de E-01 (proxy), E-06, E-07, S-03 y S-06 con servicios simulados.
const { test } = require('node:test'); const assert = require('node:assert');
const Module = require('module'), crypto = require('crypto'), path = require('path');
let store = {}, pushes = [];
const FV = { arrayRemove: (...a) => ({ __r: a }), delete: () => ({ __d: 1 }), serverTimestamp: () => new Date() };
const applyU = (o, d) => { for (const k in d) { const p = k.split('.'); let c = o; for (let i = 0; i < p.length - 1; i++) c = c[p[i]] = c[p[i]] || {}; const l = p[p.length - 1], v = d[k]; if (v && v.__d) delete c[l]; else if (v && v.__r) c[l] = (c[l] || []).filter((x) => !v.__r.includes(x)); else c[l] = v; } };
const doc = (p) => ({ id: p.split('/').pop(), path: p, parent: { parent: { id: p.split('/')[1] } }, get: async () => snap(p), set: async (d, o) => { store[p] = o && o.merge ? Object.assign(store[p] || {}, d) : d; }, update: async (d) => applyU(store[p], d), delete: async () => { delete store[p]; }, collection: (c) => col(p + '/' + c) });
const snap = (p) => ({ id: p.split('/').pop(), ref: doc(p), exists: !!store[p], get: (k) => (store[p] || {})[k], data: () => store[p] });
const kids = (p) => Object.keys(store).filter((k) => k.startsWith(p + '/') && k.split('/').length === p.split('/').length + 1);
const col = (p) => ({ doc: (i) => doc(p + '/' + i), where: (f, o, v) => ({ limit: () => ({ get: async () => { const d = kids(p).filter((k) => store[k][f] === v).map(snap); return { empty: !d.length, docs: d }; } }) }), get: async () => { const d = kids(p).map(snap); return { docs: d, size: d.length }; } });
const admin = { firestore: Object.assign(() => ({ collection: col, collectionGroup: (n) => ({ get: async () => { const d = Object.keys(store).filter((k) => k.split('/').slice(-2)[0] === n).map(snap); return { docs: d, size: d.length }; } }), runTransaction: async (f) => f({ get: (r) => r.get(), update: (r, d) => applyU(store[r.path], d) }), recursiveDelete: async (r) => { Object.keys(store).forEach((k) => { if (k === r.path || k.startsWith(r.path + '/')) delete store[k]; }); } }), { FieldValue: FV, Timestamp: { fromDate: (d) => ({ toDate: () => d }) } }),
  auth: () => ({ verifyIdToken: async (t) => { if (!/^ok-/.test(t)) throw new Error('bad'); return { uid: t.slice(3) }; }, deleteUser: async () => {} }), storage: () => ({ bucket: () => ({ deleteFiles: async () => {} }) }), initializeApp: () => ({}), credential: { cert: () => ({}) } };
const webpush = { setVapidDetails: () => {}, sendNotification: async (s, m) => { pushes.push({ s, m: JSON.parse(m) }); } };
const ol = Module._load; Module._load = function (r, ...a) { if (r === 'firebase-admin') return admin; if (r === 'web-push') return webpush; return ol.call(this, r, ...a); };
Object.assign(process.env, { FIREBASE_SERVICE_ACCOUNT: JSON.stringify({ private_key: 'x', client_email: 'y' }), LEMON_WEBHOOK_SECRET: 'sec', LEMON_STORE_ID: '7', VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b' });
const F = (n) => require(path.join(__dirname, '..', 'netlify', 'functions', n + '.js')).handler;
console.error = () => {}; console.warn = () => {};

// ---------- proxy de fotos
const BK = 'petfile-15279.firebasestorage.app', OBJ = 'families/f1/pets/p1/foto1.jpg', TOK = '123e4567-e89b-12d3-a456-426614174000';
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3]);
const P = (over = {}) => F('fs-photo')(Object.assign({ httpMethod: 'GET', rawUrl: `https://petfilearca.netlify.app/fs/v0/b/${BK}/o/${encodeURIComponent(OBJ)}?alt=media&token=${TOK}`, queryStringParameters: { alt: 'media', token: TOK } }, over));
const upstream = (type, buf = JPEG, ok = true) => { global.__u = []; global.fetch = async (u, o) => { global.__u.push({ u, o }); return { ok, headers: { get: () => type }, arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length) }; }; };
test('Proxy: sirve una foto legítima de PETFILE con cabeceras seguras', async () => { upstream('image/jpeg'); const r = await P(); assert.strictEqual(r.statusCode, 200); assert.ok(r.isBase64Encoded); assert.strictEqual(r.headers['Content-Type'], 'image/jpeg'); assert.strictEqual(r.headers['X-Content-Type-Options'], 'nosniff'); assert.ok(r.headers['Content-Security-Policy'].includes('sandbox')); assert.strictEqual(global.__u[0].o.redirect, 'error'); assert.ok(global.__u[0].u.startsWith(`https://firebasestorage.googleapis.com/v0/b/${BK}/o/families%2Ff1%2Fpets%2Fp1%2Ffoto1.jpg?alt=media&token=`)); });
test('Proxy: acepta la ruta ya decodificada por Netlify', async () => { upstream('image/jpeg'); const r = await P({ rawUrl: undefined, path: `/.netlify/functions/fs-photo/${OBJ}` }); assert.strictEqual(r.statusCode, 200); });
for (const [n, over] of Object.entries({
  'bucket ajeno': { rawUrl: `https://x/fs/v0/b/evil.appspot.com/o/${encodeURIComponent(OBJ)}` },
  'recorrido de ruta': { rawUrl: `https://x/fs/v0/b/${BK}/o/${encodeURIComponent('families/f/pets/p/../../../secret.jpg')}` },
  'ruta fuera de familias': { rawUrl: `https://x/fs/v0/b/${BK}/o/${encodeURIComponent('otros/a.jpg')}` },
  'extensión html': { rawUrl: `https://x/fs/v0/b/${BK}/o/${encodeURIComponent('families/f/pets/p/x.html')}` },
  'extensión svg': { rawUrl: `https://x/fs/v0/b/${BK}/o/${encodeURIComponent('families/f/pets/p/x.svg')}` },
  'sin token': { queryStringParameters: { alt: 'media' } }, 'token con inyección': { queryStringParameters: { alt: 'media', token: 'abc&x=../../evil1234567' } }, 'sin alt=media': { queryStringParameters: { token: TOK } },
})) test('Proxy: bloquea ' + n, async () => { upstream('image/jpeg'); const r = await P(over); assert.strictEqual(r.statusCode, 404); assert.strictEqual(global.__u.length, 0, 'no debe llamar a Storage'); });
test('Proxy: bloquea métodos que no sean GET', async () => { upstream('image/jpeg'); assert.strictEqual((await P({ httpMethod: 'POST' })).statusCode, 405); });
for (const [n, ty, b] of [['HTML con extensión jpg', 'text/html', Buffer.from('<script>alert(1)</script>xxxx')], ['SVG', 'image/svg+xml', Buffer.from('<svg onload=alert(1)>xxxxxxx')], ['HTML disfrazado de JPEG', 'image/jpeg', Buffer.from('<html><script>1</script>xxxx')], ['archivo demasiado grande', 'image/jpeg', Buffer.concat([JPEG, Buffer.alloc(3 * 1024 * 1024)])]]) test('Proxy: rechaza ' + n, async () => { upstream(ty, b); const r = await P(); assert.strictEqual(r.statusCode, 415); assert.strictEqual(r.body, ''); });
test('Proxy: error de Storage no filtra detalle', async () => { upstream('image/jpeg', JPEG, false); assert.strictEqual((await P()).statusCode, 404); global.fetch = async () => { throw new Error('secreto'); }; const r = await P(); assert.strictEqual(r.statusCode, 502); assert.strictEqual(r.body, ''); });
test('netlify.toml: el proxy solo existe para el bucket de PETFILE', () => { const t = require('fs').readFileSync(path.join(__dirname, '..', 'netlify.toml'), 'utf8'); assert.ok(!t.includes('from = "/fs/*"')); assert.ok(!t.includes('to = "https://firebasestorage')); assert.ok(t.includes(`from = "/fs/v0/b/${BK}/o/*"`)); });

// ---------- licencias
const sign = (b) => crypto.createHmac('sha256', 'sec').update(b).digest('hex');
const W = (p) => { const b = JSON.stringify(p); return F('lemon-webhook')({ httpMethod: 'POST', headers: { 'x-signature': sign(b) }, body: b }); };
const A = (key, t = 'ok-u1') => F('activate')({ httpMethod: 'POST', headers: { authorization: 'Bearer ' + t }, body: JSON.stringify({ key }) });
const lemon = (o) => { global.fetch = async () => ({ json: async () => o }); };
test('Licencia: activar guarda los datos fuera de la familia y da Premium', async () => {
  store = { 'users/u1': { familyId: 'u1' }, 'families/u1': { members: ['u1'], owner: 'u1' } }; lemon({ license_key: { status: 'active' }, meta: { store_id: 7, customer_email: 'c@x' }, activated: true, instance: { id: 'i' } });
  assert.strictEqual((await A('goodkey123')).statusCode, 200); const f = store['families/u1'];
  assert.strictEqual(f.licenseKey, undefined); assert.strictEqual(f.licenseEmail, undefined); assert.strictEqual(f.paidUntil.toDate().getFullYear(), 2099); assert.strictEqual(store['familyLicenses/u1'].licenseKey, 'goodkey123');
});
test('Licencia: un código usado (formato nuevo) sigue siendo rechazado para otra familia', async () => { store = { 'users/u1': { familyId: 'u1' }, 'families/u1': { members: ['u1'] }, 'familyLicenses/o': { licenseKey: 'usedkey12' } }; lemon({ license_key: { status: 'active' }, meta: { store_id: 7 }, activated: false }); assert.strictEqual((await A('usedkey12')).statusCode, 409); });
test('Licencia: un código de la familia en formato ANTIGUO se sigue reconociendo', async () => { store = { 'users/u1': { familyId: 'u1' }, 'families/u1': { members: ['u1'], licenseKey: 'oldkey1234' } }; lemon({ license_key: { status: 'active' }, meta: { store_id: 7 }, activated: false }); assert.strictEqual((await A('oldkey1234')).statusCode, 200); });
test('Licencia: un código en formato antiguo de OTRA familia sigue rechazado', async () => { store = { 'users/u1': { familyId: 'u1' }, 'families/u1': { members: ['u1'] }, 'families/o': { members: ['o'], licenseKey: 'oldkey1234' } }; lemon({ license_key: { status: 'active' }, meta: { store_id: 7 }, activated: false }); assert.strictEqual((await A('oldkey1234')).statusCode, 409); });
test('Webhook: compra nueva no expone la licencia a la familia', async () => { store = { 'families/w': { members: ['w'], owner: 'w' } }; lemon({ instance: { id: 'z' } }); await W({ meta: { event_name: 'license_key_created', custom_data: { family_id: 'w' } }, data: { attributes: { key: 'KW', store_id: 7, status: 'inactive', user_email: 'c@x' } } }); assert.strictEqual(store['families/w'].licenseKey, undefined); assert.strictEqual(store['familyLicenses/w'].licenseKey, 'KW'); assert.strictEqual(store['families/w'].paidUntil.toDate().getFullYear(), 2099); });
test('Webhook: reembolso retira Premium con licencia en formato antiguo y nuevo', async () => { for (const s of [{ 'families/w': { members: ['w'], licenseKey: 'KW' } }, { 'families/w': { members: ['w'] }, 'familyLicenses/w': { licenseKey: 'KW' } }]) { store = s; await W({ meta: { event_name: 'license_key_updated' }, data: { attributes: { key: 'KW', store_id: 7, status: 'disabled' } } }); assert.ok(store['families/w'].paidUntil.toDate() <= new Date()); } });
test('Licencias antiguas conservan su fecha: el paso a formato nuevo no toca paidUntil', async () => { const until = { toDate: () => new Date('2099-12-31') }; store = { 'families/l': { members: ['l'], licenseKey: 'K', paidUntil: until } }; const { migrate } = require('../scripts/migrate-license-fields.cjs'); const db = admin.firestore(); const r = await migrate(db, FV, false, () => {}); assert.strictEqual(r.pending, 1); assert.strictEqual(store['families/l'].licenseKey, 'K', 'el modo revisión no cambia nada'); assert.strictEqual(store['familyLicenses/l'], undefined); await migrate(db, FV, true, () => {}); assert.strictEqual(store['families/l'].licenseKey, undefined); assert.strictEqual(store['familyLicenses/l'].licenseKey, 'K'); assert.strictEqual(store['families/l'].paidUntil, until); });

// ---------- eliminar cuenta
const D = (t) => F('delete-account')({ httpMethod: 'POST', headers: { authorization: 'Bearer ' + t }, body: '{}' });
test('Eliminar administrador: no deja su correo y la familia conserva Premium', async () => { const until = { toDate: () => new Date('2099-12-31') }; store = { 'users/o': { familyId: 'o' }, 'families/o': { members: ['o', 'm'], owner: 'o', code: 'B', memberInfo: { o: { email: 'o@x' }, m: { name: 'M' } }, licenseEmail: 'o@x', paidUntil: until }, 'familyLicenses/o': { licenseKey: 'K', licenseEmail: 'o@x' }, 'invites/B': { familyId: 'o' } }; assert.strictEqual((await D('ok-o')).statusCode, 200); assert.ok(!JSON.stringify(store).includes('o@x')); assert.strictEqual(store['families/o'].owner, 'm'); assert.strictEqual(store['families/o'].paidUntil, until); assert.strictEqual(store['familyLicenses/o'].licenseKey, 'K'); });
test('Eliminar persona sola: también borra su licencia', async () => { store = { 'users/a': { familyId: 'a' }, 'families/a': { members: ['a'], owner: 'a' }, 'familyLicenses/a': { licenseKey: 'K' } }; await D('ok-a'); assert.deepStrictEqual(Object.keys(store), []); });

// ---------- recordatorios
const h1 = () => new Date(Date.now() + 90 * 60e3).toISOString().slice(0, 16);
const paid = () => ({ members: ['r', 'z'], paidUntil: { toDate: () => new Date(Date.now() + 864e6) } });
const R = async (extra) => { pushes = []; store = Object.assign({ 'users/z': { familyId: 'g' }, 'users/z/push/1': { sub: { endpoint: 'https://fcm.googleapis.com/fcm/send/z' }, tz: 'UTC', lang: 'es' }, 'families/g': paid(), 'families/g/pets/p': { name: 'D', entries: [{ type: 'cita', title: 'OK', date: h1() }] } }, extra); return F('send-reminders')({}); };
test('Recordatorios: legítimo envía el aviso', async () => { await R(); assert.ok(pushes.some((p) => p.m.body === 'OK (D)')); });
test('Recordatorios: datos dañados de una familia no frenan a las demás', async () => { const r = await R({ 'users/a/push/1': { sub: { endpoint: 'https://fcm.googleapis.com/a' }, tz: 'UTC' }, 'users/a': { familyId: 'b' }, 'families/b': Object.assign(paid(), { members: ['a'] }), 'families/b/pets/x': { name: 'X', entries: [null, { type: 'cita', title: 'M', date: 12345 }, { type: 'vacuna', next: 7 }] } }); assert.strictEqual(r.statusCode, 200); assert.ok(pushes.some((p) => p.s.endpoint.endsWith('/z'))); });
test('Recordatorios: zona horaria inválida no frena a las demás', async () => { const r = await R({ 'users/a/push/1': { sub: { endpoint: 'https://fcm.googleapis.com/a' }, tz: 'Marte/Olimpo' } }); assert.strictEqual(r.statusCode, 200); assert.ok(pushes.some((p) => p.s.endpoint.endsWith('/z'))); });
for (const u of ['http://169.254.169.254/latest', 'https://evil.example/x', 'https://fcm.googleapis.com.evil.example/x', 'https://fcm.googleapis.com:8443/x']) test('Recordatorios: no envía a ' + u, async () => { await R({ 'users/z/push/9': { sub: { endpoint: u }, tz: 'UTC' } }); assert.ok(!pushes.some((p) => p.s.endpoint === u)); assert.ok(pushes.length >= 1); });
for (const u of ['https://web.push.apple.com/x', 'https://updates.push.services.mozilla.com/x', 'https://wns2-par02p.notify.windows.com/x']) test('Recordatorios: acepta ' + u, async () => { pushes = []; await R({ 'users/z/push/9': { sub: { endpoint: u }, tz: 'UTC' } }); assert.ok(pushes.some((p) => p.s.endpoint === u)); });

// ---------- autorización y errores en todas las funciones
const allFns = ['activate', 'delete-account', 'lemon-webhook', 'fs-photo'];
for (const n of allFns) { test(`${n}: GET/OPTIONS/PUT no autorizan operaciones`, async () => { store = { 'users/u1': { familyId: 'u1' }, 'families/u1': { members: ['u1'] } }; upstream('image/jpeg'); for (const m of n === 'fs-photo' ? ['PUT', 'DELETE', 'OPTIONS'] : ['GET', 'PUT', 'DELETE', 'OPTIONS']) { const r = await F(n)({ httpMethod: m, headers: { authorization: 'Bearer ok-u1', origin: 'https://localhost' }, body: '{}', queryStringParameters: {} }); const expect = n === 'delete-account' && m === 'OPTIONS' ? 204 : 405; assert.strictEqual(r.statusCode, expect, m); if (n === 'delete-account' && m === 'OPTIONS') { assert.strictEqual(r.headers['Access-Control-Allow-Origin'], 'https://localhost'); assert.ok(String(r.headers['Access-Control-Allow-Methods'] || '').includes('POST')); assert.ok(String(r.headers['Access-Control-Allow-Headers'] || '').includes('Authorization')); } } assert.ok(store['users/u1'], 'nada se borró'); }); }

// ---------- solicitud pública de eliminación (nunca borra)
const RD = (body, over = {}) => F('request-delete-account')(Object.assign({ httpMethod: 'POST', headers: { 'content-type': 'application/json', 'x-nf-client-connection-ip': '203.0.113.10' }, body: JSON.stringify(body) }, over));
test('Solicitud pública: OPTIONS permitido y GET no borra', async () => {
  store = { 'users/u1': { familyId: 'u1' } };
  const opt = await F('request-delete-account')({ httpMethod: 'OPTIONS', headers: {} });
  assert.strictEqual(opt.statusCode, 204);
  assert.strictEqual((await F('request-delete-account')({ httpMethod: 'GET', headers: {} })).statusCode, 405);
  assert.ok(store['users/u1']);
});
test('Solicitud pública: sin confirmación o correo inválido no envía ni borra', async () => {
  store = { 'users/a': { familyId: 'a' } }; global.__u = []; global.fetch = async () => { throw new Error('no debía llamarse'); };
  assert.strictEqual((await RD({ email: 'a@b.co' })).statusCode, 400);
  assert.strictEqual((await RD({ email: 'no-es-correo', confirm: true })).statusCode, 400);
  assert.ok(store['users/a']);
});
test('Solicitud pública: honeypot responde ok sin borrar ni avisar', async () => {
  store = { 'users/a': { familyId: 'a' } }; let called = 0; global.fetch = async () => { called++; return { ok: true, json: async () => ({ success: 'true' }) }; };
  const r = await RD({ email: 'a@b.co', confirm: true, website: 'http://spam' });
  assert.strictEqual(r.statusCode, 200);
  assert.strictEqual(JSON.parse(r.body).deleted, false);
  assert.strictEqual(called, 0);
  assert.ok(store['users/a']);
});
test('Solicitud pública: envía al canal admin y no elimina la cuenta', async () => {
  store = { 'users/a': { familyId: 'a' } }; const sent = [];
  const origAuth = admin.auth;
  global.fetch = async (u, o) => { sent.push({ u, o }); return { ok: true, json: async () => ({ success: 'true' }) }; };
  admin.auth = () => ({ verifyIdToken: async (t) => { if (!/^ok-/.test(t)) throw new Error('bad'); return { uid: t.slice(3) }; }, deleteUser: async () => { throw new Error('no borrar'); }, getUserByEmail: async () => ({ uid: 'a' }) });
  try {
    const r = await RD({ email: 'titular@example.com', confirm: true, note: 'No puedo entrar', lang: 'es' });
    assert.strictEqual(r.statusCode, 200);
    const j = JSON.parse(r.body);
    assert.strictEqual(j.ok, true);
    assert.strictEqual(j.deleted, false);
    assert.ok(sent[0].u.includes('formsubmit.co'));
    const payload = JSON.parse(sent[0].o.body);
    assert.match(payload._subject, /eliminaci/i);
    assert.match(payload.message, /NO elimina/i);
    assert.ok(store['users/a'], 'Firestore intacto');
  } finally { admin.auth = origAuth; }
});
test('Sin token: activar y eliminar no hacen nada', async () => { store = { 'users/u1': { familyId: 'u1' }, 'families/u1': { members: ['u1'] } }; const snapshot = JSON.stringify(store); for (const h of [{}, { authorization: '' }, { authorization: 'Bearer ' }, { authorization: 'Basic ok-u1' }]) { assert.strictEqual((await F('activate')({ httpMethod: 'POST', headers: h, body: '{"key":"abcdefgh"}' })).statusCode, 401); assert.strictEqual((await F('delete-account')({ httpMethod: 'POST', headers: h, body: '{}' })).statusCode, 401); } assert.strictEqual(JSON.stringify(store), snapshot); });
test('Eliminar solo afecta a quien tiene el token, aunque el cuerpo pida otra cuenta', async () => { store = { 'users/a': { familyId: 'a' }, 'families/a': { members: ['a'], owner: 'a' }, 'users/b': { familyId: 'b' }, 'families/b': { members: ['b'], owner: 'b' } }; await F('delete-account')({ httpMethod: 'POST', headers: { authorization: 'Bearer ok-a' }, body: JSON.stringify({ uid: 'b' }) }); assert.ok(store['users/b'] && store['families/b']); assert.ok(!store['users/a']); });
test('Activar: no se puede activar la familia de otra persona con el cuerpo', async () => { store = { 'users/u1': { familyId: 'u1' }, 'families/u1': { members: ['u1'] }, 'families/x': { members: ['x'] } }; lemon({ license_key: { status: 'active' }, meta: { store_id: 7 }, activated: true }); await F('activate')({ httpMethod: 'POST', headers: { authorization: 'Bearer ok-u1' }, body: JSON.stringify({ key: 'goodkey123', familyId: 'x' }) }); assert.ok(!store['families/x'].paidUntil); });
test('Activar: familyId de otra familia en su perfil no da acceso', async () => { store = { 'users/u1': { familyId: 'x' }, 'families/x': { members: ['x'] } }; lemon({ license_key: { status: 'active' }, meta: { store_id: 7 }, activated: true }); assert.strictEqual((await A('goodkey123')).statusCode, 403); assert.ok(!store['families/x'].paidUntil); });
test('Webhook: sin secreto configurado rechaza todo', async () => { const k = process.env.LEMON_WEBHOOK_SECRET; process.env.LEMON_WEBHOOK_SECRET = ''; const b = '{}'; const r = await F('lemon-webhook')({ httpMethod: 'POST', headers: { 'x-signature': crypto.createHmac('sha256', '').update(b).digest('hex') }, body: b }); process.env.LEMON_WEBHOOK_SECRET = k; assert.strictEqual(r.statusCode, 401); });
test('Errores internos no exponen detalles', async () => { const orig = admin.firestore; admin.firestore = Object.assign(() => { throw new Error('SECRETO interno /ruta/clave'); }, orig); for (const [n, ev] of [['activate', { httpMethod: 'POST', headers: { authorization: 'Bearer ok-u1' }, body: '{"key":"abcdefgh"}' }], ['delete-account', { httpMethod: 'POST', headers: { authorization: 'Bearer ok-u1' }, body: '{}' }], ['send-reminders', {}]]) { const r = await F(n)(ev); assert.strictEqual(r.statusCode, 500, n); assert.ok(!r.body.includes('SECRETO'), n); } admin.firestore = orig; });
test('Recordatorios: sin claves no envía nada', async () => { const k = process.env.VAPID_PRIVATE_KEY; delete process.env.VAPID_PRIVATE_KEY; pushes = []; const r = await F('send-reminders')({}); process.env.VAPID_PRIVATE_KEY = k; assert.strictEqual(r.statusCode, 200); assert.strictEqual(pushes.length, 0); });
