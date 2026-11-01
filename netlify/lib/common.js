// Utilidades compartidas por las funciones de PETFILE.
const admin = require('firebase-admin');

let app = null;
function firebase() {
  if (!app) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('Falta la variable FIREBASE_SERVICE_ACCOUNT en Netlify');
    app = admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
  }
  return admin;
}

// Licencia sin vencimiento = de por vida.
const FOREVER = new Date('2099-12-31T23:59:59Z');

// Fecha hasta la que la familia tiene Premium, según el estado de la licencia en Lemon Squeezy.
function paidUntilFrom(lk) {
  if (!lk || lk.disabled || lk.status === 'expired' || lk.status === 'disabled') return new Date();
  return lk.expires_at ? new Date(lk.expires_at) : FOREVER;
}

// Activa la licencia en Lemon Squeezy para una familia (consume una activación).
async function lemonActivate(key, familyId) {
  const r = await fetch('https://api.lemonsqueezy.com/v1/licenses/activate', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ license_key: key, instance_name: 'familia:' + familyId }),
  });
  return r.json().catch(() => ({}));
}

const storeOk = (storeId) => !process.env.LEMON_STORE_ID || String(storeId) === String(process.env.LEMON_STORE_ID);

const json = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

module.exports = { firebase, paidUntilFrom, lemonActivate, storeOk, json };
