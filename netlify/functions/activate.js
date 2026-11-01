// POST /.netlify/functions/activate  { key }  con  Authorization: Bearer <token de Firebase>
// El cliente pega el código de licencia que le llegó por correo y su familia pasa a Premium.
const { firebase, paidUntilFrom, lemonActivate, storeOk, json } = require('../lib/common');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method' });
  let admin;
  try { admin = firebase(); } catch (e) { console.error(e); return json(500, { error: 'config' }); }

  // 1) ¿Quién es? (token de la sesión de Firebase)
  const token = (event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '');
  let uid;
  try { uid = (await admin.auth().verifyIdToken(token)).uid; } catch { return json(401, { error: 'auth' }); }

  let key = '';
  try { key = String(JSON.parse(event.body || '{}').key || '').trim(); } catch {}
  if (key.length < 8 || key.length > 100) return json(400, { error: 'invalid' });

  // 2) Su familia actual
  const db = admin.firestore();
  const user = await db.collection('users').doc(uid).get();
  const familyId = (user.exists && user.get('familyId')) || uid;
  const famRef = db.collection('families').doc(familyId);
  const fam = await famRef.get();
  if (!fam.exists || !(fam.get('members') || []).includes(uid)) return json(403, { error: 'family' });

  // 3) Activar en Lemon Squeezy
  const res = await lemonActivate(key, familyId);
  const lk = res.license_key;
  if (!lk || !storeOk(res.meta && res.meta.store_id)) return json(400, { error: 'invalid' });

  if (!res.activated) {
    // Límite de activaciones alcanzado: solo se acepta si el código ya es de esta familia.
    const owner = await db.collection('families').where('licenseKey', '==', key).limit(1).get();
    const mine = fam.get('licenseKey') === key || (!owner.empty && owner.docs[0].id === familyId);
    if (!mine) {
      if (lk.status === 'expired' || lk.status === 'disabled') return json(410, { error: 'expired' });
      return json(409, { error: 'used' });
    }
  }
  if (lk.status === 'expired' || lk.status === 'disabled') return json(410, { error: 'expired' });

  // 4) Guardar la licencia en la familia
  const data = {
    paidUntil: admin.firestore.Timestamp.fromDate(paidUntilFrom(lk)),
    licenseKey: key,
    licenseEmail: (res.meta && res.meta.customer_email) || null,
    licenseUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (res.instance && res.instance.id) data.licenseInstance = res.instance.id;
  await famRef.set(data, { merge: true });
  return json(200, { ok: true, paidUntil: data.paidUntil.toDate().toISOString() });
};
