// POST /.netlify/functions/delete-account  con  Authorization: Bearer <token de Firebase>
// Elimina la cuenta de la persona y sus datos (derecho de supresión, Ley 8968).
// - Si es administradora y hay más personas en la familia: la siguiente pasa a ser la
//   administradora y las mascotas quedan con la familia.
// - Si está sola en su familia: se borran las mascotas, recetas, el código y la familia.
// - Si es integrante de otra familia: sale de ella.
// Siempre se borran sus teléfonos de notificaciones, su perfil y la cuenta de acceso.
const { firebase, json } = require('../lib/common');

const run = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method' });
  let admin;
  try { admin = firebase(); } catch (e) { console.error(e); return json(500, { error: 'config' }); }

  const token = (event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '');
  let uid;
  try { uid = (await admin.auth().verifyIdToken(token)).uid; } catch { return json(401, { error: 'auth' }); }

  const db = admin.firestore();
  const FV = admin.firestore.FieldValue;
  const userRef = db.collection('users').doc(uid);
  const user = await userRef.get();
  const current = (user.exists && user.get('familyId')) || uid;

  // Sale de la familia a la que se unió (si no es la suya).
  if (current !== uid) {
    const ref = db.collection('families').doc(current);
    await db.runTransaction(async (tx) => {
      const f = await tx.get(ref);
      if (!f.exists || !(f.get('members') || []).includes(uid)) return;
      tx.update(ref, { members: FV.arrayRemove(uid), ['memberInfo.' + uid]: FV.delete() });
    });
  }

  // Su propia familia.
  const ownRef = db.collection('families').doc(uid);
  const own = await ownRef.get();
  if (own.exists) {
    const others = (own.get('members') || []).filter((m) => m !== uid);
    if (others.length) {
      const next = others[0];
      const info = (own.get('memberInfo') || {})[next] || {};
      await ownRef.update({ owner: next, members: FV.arrayRemove(uid), ['memberInfo.' + uid]: FV.delete() });
      const code = own.get('code');
      if (code) await db.collection('invites').doc(code).set({ familyId: uid, ownerName: info.name || info.email || '' }, { merge: true }).catch(() => {});
    } else {
      const code = own.get('code');
      if (code) {
        const inv = await db.collection('invites').doc(code).get();
        if (inv.exists && inv.get('familyId') === uid) await inv.ref.delete();
      }
      await db.recursiveDelete(ownRef); // mascotas, recetas, fotos y la familia
      // Fotos de los registros en Firebase Storage.
      try {
        await admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET || 'petfile-15279.firebasestorage.app').deleteFiles({ prefix: `families/${uid}/` });
      } catch (e) { console.error('storage', e); }
    }
  }

  // Perfil, teléfonos de notificaciones y datos de la versión anterior.
  await db.recursiveDelete(userRef);

  // Cuenta de acceso.
  try { await admin.auth().deleteUser(uid); } catch (e) { if (e.code !== 'auth/user-not-found') throw e; }

  return json(200, { ok: true });
};

exports.handler = async (event) => {
  try { return await run(event); } catch (e) { console.error(e); return json(500, { error: 'server' }); }
};
