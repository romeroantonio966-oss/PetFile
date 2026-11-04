// Webhook de Lemon Squeezy: activa Premium solo, sin que el cliente pegue el código.
// Eventos: license_key_created y license_key_updated.
const crypto = require('node:crypto');
const { firebase, paidUntilFrom, lemonActivate, storeOk, json, licenseRef, familyOfLicense } = require('../lib/common');

const run = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method' });
  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');

  // 1) Verificar la firma
  const secret = process.env.LEMON_WEBHOOK_SECRET || '';
  const given = Buffer.from(event.headers['x-signature'] || event.headers['X-Signature'] || '', 'utf8');
  const digest = Buffer.from(crypto.createHmac('sha256', secret).update(raw).digest('hex'), 'utf8');
  if (!secret || given.length !== digest.length || !crypto.timingSafeEqual(digest, given)) return json(401, { error: 'signature' });

  const payload = JSON.parse(raw);
  const name = payload.meta && payload.meta.event_name;
  if (name !== 'license_key_created' && name !== 'license_key_updated') return json(200, { ignored: name });

  const lk = (payload.data && payload.data.attributes) || {};
  if (!lk.key || !storeOk(lk.store_id)) return json(200, { ignored: 'store' });

  let admin;
  try { admin = firebase(); } catch (e) { console.error(e); return json(500, { error: 'config' }); }
  const db = admin.firestore();

  // 2) ¿De qué familia es? Primero por el código ya guardado; si no, por el dato que manda la app al comprar.
  const custom = (payload.meta && payload.meta.custom_data) || {};
  const known = await familyOfLicense(db, lk.key);
  const familyId = known || custom.family_id || custom.user_id || null;
  if (!familyId) return json(200, { ignored: 'sin familia (compra fuera de la app: se activa con el código)' });
  const famRef = db.collection('families').doc(familyId);
  if (!(await famRef.get()).exists) return json(200, { ignored: 'familia no existe' });

  const now = admin.firestore.FieldValue.serverTimestamp();
  const data = { paidUntil: admin.firestore.Timestamp.fromDate(paidUntilFrom(lk)), licenseUpdatedAt: now };
  const lic = { licenseKey: lk.key, licenseEmail: lk.user_email || null, licenseUpdatedAt: now };

  // 3) Compra nueva: usar la activación para que el código no sirva en otra cuenta.
  if (name === 'license_key_created' && !known) {
    try { const r = await lemonActivate(lk.key, familyId); if (r.instance && r.instance.id) lic.licenseInstance = r.instance.id; }
    catch (e) { console.warn('activación', e); }
  }
  await licenseRef(db, familyId).set(lic, { merge: true });
  await famRef.set(data, { merge: true });
  return json(200, { ok: true, familyId });
};

// Envoltura: cualquier error inesperado vuelve con el detalle para poder diagnosticarlo.
exports.handler = async (event) => {
  try { return await run(event); }
  catch (e) { console.error('webhook', e); return json(500, { error: 'server' }); }
};
