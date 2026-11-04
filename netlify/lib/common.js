// Utilidades compartidas por las funciones de PETFILE.
const admin = require('firebase-admin');

let app = null;

// Acepta la clave tal como se pegue en Netlify: con o sin las llaves { } de los extremos,
// con comillas o espacios de más, o codificada en base64.
function parseServiceAccount(raw) {
  let t = String(raw).trim().replace(/^[`'"]+|[`'"]+$/g, (m) => (m.includes('"') && m.length === 1 ? m : ''));
  if (!t.startsWith('{') && /^[A-Za-z0-9+/=\s]+$/.test(t)) {
    try { t = Buffer.from(t, 'base64').toString('utf8').trim(); } catch {}
  }
  const tries = [t, '{' + t, t + '}', '{' + t + '}', '{' + t.replace(/,\s*$/, '') + '}'];
  for (const c of tries) {
    try { const o = JSON.parse(c); if (o && o.private_key && o.client_email) return o; } catch {}
  }
  throw new Error('La variable FIREBASE_SERVICE_ACCOUNT no tiene el contenido completo del archivo JSON de Firebase');
}
function firebase() {
  if (!app) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('Falta la variable FIREBASE_SERVICE_ACCOUNT en Netlify');
    app = admin.initializeApp({ credential: admin.credential.cert(parseServiceAccount(raw)) });
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

// Los datos de la licencia viven en un documento que solo el servidor puede leer.
// Las familias antiguas pueden tenerlos todavía en su documento: se siguen reconociendo.
const licenseRef = (db, familyId) => db.collection('familyLicenses').doc(familyId);
async function familyOfLicense(db, key) {
  const now = await db.collection('familyLicenses').where('licenseKey', '==', key).limit(1).get();
  if (!now.empty) return now.docs[0].id;
  const old = await db.collection('families').where('licenseKey', '==', key).limit(1).get();
  return old.empty ? null : old.docs[0].id;
}

const storeOk = (storeId) => !process.env.LEMON_STORE_ID || String(storeId) === String(process.env.LEMON_STORE_ID);

const json = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

module.exports = { firebase, paidUntilFrom, lemonActivate, storeOk, json, licenseRef, familyOfLicense };
