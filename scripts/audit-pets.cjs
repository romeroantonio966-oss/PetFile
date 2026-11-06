// Auditoría de compatibilidad de mascotas con petOk (firestore.rules). SOLO LECTURA.
// Imprime únicamente conteos por motivo: nunca ids, rutas, nombres, fotos ni historiales.
// Lee cada documento de mascota (families/*/pets y la ruta antigua users/*/pets) en páginas de 200.
// Credenciales: Application Default Credentials (gcloud), sin claves. Ver rules-backup/AUDITORIA-MASCOTAS.md
const ID = /^[A-Za-z0-9_-]{1,128}$/, IMG = /^data:image\/(jpeg|png|webp|gif);base64,/;
const len = (s) => [...s].length; // Las reglas cuentan caracteres, no unidades UTF-16.
const isStr = (v, max) => typeof v === 'string' && len(v) <= max;
const optStr = (d, k, max) => !(k in d) || d[k] == null || isStr(d[k], max);
// Misma lógica que petOk. Devuelve los motivos por los que esa mascota no se podría volver a guardar.
function checkPet(id, d) {
  const r = [];
  if (!ID.test(id)) r.push('id con caracteres no permitidos');
  const name = 'name' in d ? d.name : '';
  if (typeof name !== 'string') r.push('nombre no es texto'); else if (!name.length) r.push('sin nombre'); else if (len(name) > 200) r.push('nombre de más de 200');
  for (const [k, max] of [['species', 80], ['speciesOther', 80], ['sex', 40], ['breed', 200], ['birth', 40]]) if (!optStr(d, k, max)) r.push(`${k} no es texto o es muy largo`);
  if ('weight' in d && d.weight != null && typeof d.weight !== 'number' && !isStr(d.weight, 40)) r.push('peso con tipo no válido');
  if ('photo' in d && d.photo != null && !(typeof d.photo === 'string' && d.photo.length <= 900000 && IMG.test(d.photo))) r.push(typeof d.photo === 'string' && IMG.test(d.photo) ? 'foto de más de 900000' : 'foto no es imagen base64');
  if ('entries' in d && !(Array.isArray(d.entries) && d.entries.length <= 2000)) r.push(Array.isArray(d.entries) ? 'más de 2000 registros' : 'historial no es lista');
  return r;
}
async function audit(db, log = console.log, page = 200) {
  const res = { revisadas: 0, compatibles: 0, incompatibles: 0, motivos: {}, porRuta: { families: [0, 0], users: [0, 0] } };
  let last = null;
  for (;;) {
    let q = db.collectionGroup('pets').orderBy('__name__').limit(page); if (last) q = q.startAfter(last);
    const s = await q.get(); if (s.empty) break;
    for (const doc of s.docs) {
      const rs = checkPet(doc.id, doc.data()), root = doc.ref.path.split('/')[0] === 'users' ? 'users' : 'families';
      res.revisadas++; res.porRuta[root][rs.length ? 1 : 0]++;
      if (rs.length) { res.incompatibles++; rs.forEach((m) => { res.motivos[m] = (res.motivos[m] || 0) + 1; }); } else res.compatibles++;
    }
    last = s.docs[s.docs.length - 1]; if (s.size < page) break;
  }
  log(`Mascotas revisadas: ${res.revisadas}. Compatibles: ${res.compatibles}. Incompatibles: ${res.incompatibles}.`);
  log(`  families/*/pets: ${res.porRuta.families[0]} compatibles, ${res.porRuta.families[1]} incompatibles.`);
  log(`  users/*/pets (versión anterior): ${res.porRuta.users[0]} compatibles, ${res.porRuta.users[1]} incompatibles.`);
  for (const [m, n] of Object.entries(res.motivos)) log(`  Motivo "${m}": ${n}`);
  return res;
}
if (require.main === module) {
  const project = (process.argv.find((a) => a.startsWith('--project=')) || '').slice(10);
  if (!project) { console.error('Uso: node scripts/audit-pets.cjs --project=petfile-15279'); process.exit(2); }
  console.log(`Proyecto: ${project}${process.env.FIRESTORE_EMULATOR_HOST ? ' (EMULADOR ' + process.env.FIRESTORE_EMULATOR_HOST + ')' : ' (PRODUCCIÓN, solo lectura)'}`);
  const { initializeApp, applicationDefault } = require('firebase-admin/app'), { getFirestore } = require('firebase-admin/firestore');
  initializeApp({ credential: applicationDefault(), projectId: project });
  audit(getFirestore()).then(() => process.exit(0)).catch((e) => { console.error('Error: ' + (e.code || '') + ' ' + String(e.message).split('\n')[0]); process.exit(1); });
}
module.exports = { checkPet, audit };
