// Mediciones locales, sin internet ni servicios reales. Uso: node tests/load/measure-local.cjs
// Mide lo que no depende de la red: tamaño de documento, costo de pantalla, memoria y recordatorios con latencia simulada.
const path = require('path'), Module = require('module');
const { chromium } = require('playwright'); const { serve, testApp, seed, open } = require('../lib/harness.cjs');
const ENTRY = (i) => ({ id: 'r' + (1e9 + i).toString(36) + 'abcde', type: ['vacuna', 'consulta', 'med', 'cita'][i % 4], title: 'Control de rutina ' + i, date: '2025-0' + (1 + i % 9) + '-1' + (i % 9), next: i % 4 === 0 ? '2031-0' + (1 + i % 9) + '-10' : undefined, vet: 'Dra. Mora', dose: i % 4 === 2 ? '1 pastilla' : undefined, freq: i % 4 === 2 ? 'cada 12 horas' : undefined, notes: 'Observaciones habituales de la visita, con detalle de lo indicado por el veterinario.' });
const PHOTO = 'data:image/jpeg;base64,' + 'A'.repeat(70000);
const mb = () => Math.round(process.memoryUsage().rss / 1048576);
async function ui() {
  const b = await chromium.launch(), s = await serve(testApp({ csp: false })); const out = [];
  for (const n of [10, 100, 500, 1000, 2000, 3500]) {
    const d = seed(true); const pet = { id: 'p', name: 'Canela', species: 'Perro', photo: null, entries: Array.from({ length: n }, (_, i) => JSON.parse(JSON.stringify(ENTRY(i)))) }; d.db['families/u1/pets/p'] = pet;
    const bytes = Buffer.byteLength(JSON.stringify(pet)); const { c, page } = await open(b, s.url, d);
    const t = await page.E(`(()=>{const m=(f)=>{const a=performance.now();f();return Math.round(performance.now()-a)};const ficha=m(()=>{go('pet','p')});const inicio=m(()=>{go('home')});const agenda=m(()=>{go('agenda')});const plan=m(()=>{ntPlan(Object.values(state.pets),NT_TXT.es,Date.now())});return {ficha,inicio,agenda,plan}})()`);
    out.push({ registros: n, bytes, ...t }); console.log(JSON.stringify(out[out.length - 1])); await c.close();
  }
  await b.close(); s.srv.close(); return out;
}
function reminders(subs, latency) {
  const store = {}, stats = { reads: 0, push: 0 }; const wait = (ms) => (ms ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());
  const h1 = new Date(Date.now() + 90 * 60e3).toISOString().slice(0, 16);
  for (let i = 0; i < subs; i++) { store['users/u' + i] = { familyId: 'f' + i }; store['users/u' + i + '/push/1'] = { sub: { endpoint: 'https://fcm.googleapis.com/x/' + i }, tz: 'UTC', lang: 'es' }; store['families/f' + i] = { members: ['u' + i], paidUntil: { toDate: () => new Date(Date.now() + 864e6) } }; store['families/f' + i + '/pets/p'] = { name: 'C', entries: [ENTRY(i), { type: 'cita', title: 'Vet', date: h1 }] }; }
  const kids = {}; for (const k of Object.keys(store)) { const i = k.lastIndexOf('/'); (kids[k.slice(0, i)] = kids[k.slice(0, i)] || []).push(k); }
  const snap = (p) => ({ id: p.split('/').pop(), ref: { parent: { parent: { id: p.split('/')[1] } }, delete: async () => {} }, exists: !!store[p], get: (k) => (store[p] || {})[k], data: () => store[p] });
  const doc = (p) => ({ get: async () => { stats.reads++; await wait(latency.read); return snap(p); }, collection: (c) => col(p + '/' + c) }); const col = (p) => ({ doc: (i) => doc(p + '/' + i), get: async () => { await wait(latency.read); const ks = kids[p] || []; stats.reads += ks.length; return { docs: ks.map(snap) }; } });
  const admin = { firestore: () => ({ collection: col, collectionGroup: () => ({ get: async () => { const ks = []; for (let i = 0; i < subs; i++) ks.push('users/u' + i + '/push/1'); stats.reads += ks.length; await wait(latency.read); return { docs: ks.map(snap), size: ks.length }; } }) }), initializeApp: () => ({}), credential: { cert: () => ({}) } };
  const webpush = { setVapidDetails() {}, sendNotification: async () => { stats.push++; await wait(latency.push); } };
  const ol = Module._load; Module._load = function (r, ...a) { if (r === 'firebase-admin') return admin; if (r === 'web-push') return webpush; return ol.call(this, r, ...a); };
  Object.assign(process.env, { FIREBASE_SERVICE_ACCOUNT: JSON.stringify({ private_key: 'x', client_email: 'y' }), VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b' });
  for (const k of Object.keys(require.cache)) if (k.includes('netlify')) delete require.cache[k];
  const fn = require(path.join(__dirname, '..', '..', 'netlify', 'functions', 'send-reminders.js')).handler; Module._load = ol;
  return { fn, stats };
}
(async () => {
  const log = console.error; console.error = () => {};
  console.log('--- Documento de mascota y costo de pantalla (Chromium en este equipo, sin red)'); console.table(await ui());
  const entry = Buffer.byteLength(JSON.stringify(ENTRY(1))); console.log('Bytes por registro de ejemplo:', entry, '| Registros hasta 1 MiB sin foto:', Math.floor(1048576 / entry), '| con foto de 70 KB:', Math.floor((1048576 - PHOTO.length) / entry));
  console.log('--- Recordatorios: tiempo con latencia SIMULADA (lectura 25 ms, push 80 ms)');
  const rows = []; for (const n of [100, 250, 500]) { const { fn, stats } = reminders(n, { read: 25, push: 80 }); const a = Date.now(); await fn({}); console.log('sub', n, Date.now() - a); rows.push({ suscripciones: n, segundos: +((Date.now() - a) / 1000).toFixed(1), lecturas: stats.reads, avisos: stats.push, limite30s: Date.now() - a <= 30000 ? 'dentro' : 'EXCEDE' }); } console.table(rows);
  console.log('--- Recordatorios: CPU y memoria, sin latencia'); const cpu = []; for (const n of [1000, 10000, 100000]) { const { fn, stats } = reminders(n, { read: 0, push: 0 }); const a = Date.now(), m0 = mb(); await fn({}); cpu.push({ suscripciones: n, segundos: +((Date.now() - a) / 1000).toFixed(2), rssMB: mb(), crecimientoMB: mb() - m0, lecturas: stats.reads }); } console.table(cpu);
  console.error = log; process.exit(0);
})();
