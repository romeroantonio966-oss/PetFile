// Copia licenseKey, licenseEmail y licenseInstance de families/{id} a familyLicenses/{id}.
// NO SE HA EJECUTADO. Por defecto solo informa; no cambia nada sin --apply.
//   Revisar:  FIREBASE_SERVICE_ACCOUNT="$(cat clave.json)" node scripts/migrate-license-fields.cjs
//   Aplicar:  ... node scripts/migrate-license-fields.cjs --apply
// Con --apply copia y borra del documento de la familia solo si la copia se pudo escribir.
const FIELDS = ['licenseKey', 'licenseEmail', 'licenseInstance'];

async function migrate(db, FieldValue, apply, log = console.log) {
  const snap = await db.collection('families').get();
  let pending = 0, done = 0;
  for (const doc of snap.docs) {
    const d = doc.data();
    const lic = {};
    FIELDS.forEach((k) => { if (d[k] !== undefined) lic[k] = d[k]; });
    if (!Object.keys(lic).length) continue;
    pending++;
    log(`${apply ? 'migrando' : 'pendiente'}: familia ${doc.id} (${Object.keys(lic).join(', ')})`);
    if (!apply) continue;
    await db.collection('familyLicenses').doc(doc.id).set(lic, { merge: true });
    const clear = {};
    FIELDS.forEach((k) => { if (d[k] !== undefined) clear[k] = FieldValue.delete(); });
    await doc.ref.update(clear);
    done++;
  }
  log(`Familias revisadas: ${snap.size}. Con datos por mover: ${pending}. Movidas: ${done}.`);
  return { total: snap.size, pending, done };
}

if (require.main === module) {
  const admin = require('firebase-admin');
  const apply = process.argv.includes('--apply');
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  migrate(admin.firestore(), admin.firestore.FieldValue, apply).catch((e) => { console.error(e); process.exit(1); });
}
module.exports = { migrate };
