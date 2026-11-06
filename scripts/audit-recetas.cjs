// Revisa en SOLO LECTURA si las recetas existentes tienen la forma que exigen las reglas nuevas. No escribe nada.
// Solo muestra conteos y rutas, nunca el contenido de las recetas.
// Windows: $env:FIREBASE_SERVICE_ACCOUNT = Get-Content C:\ruta\fuera\del\repo\clave.json -Raw ; node scripts/audit-recetas.cjs
const ID = /^[A-Za-z0-9_-]{1,128}$/, IMG = /^data:image\/(jpeg|png|webp|gif);base64,/, DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const KEYS = ['petId', 'title', 'date', 'vet', 'notes', 'thumb', 'createdAt'];
const optStr = (d, k, max) => !(k in d) || d[k] == null || (typeof d[k] === 'string' && d[k].length <= max);
// Misma lógica que recetaOk en firestore.rules. La lista indica qué fallaría si esa receta se volviera a guardar.
function checkReceta(id, d) {
  const p = [];
  if (!ID.test(id)) p.push('id');
  if (typeof d.petId !== 'string' || !ID.test(d.petId)) p.push('petId');
  if (Object.keys(d).some((k) => !KEYS.includes(k))) p.push('campos extra');
  if (typeof d.thumb !== 'string' || d.thumb.length > 120000 || !IMG.test(d.thumb)) p.push('thumb');
  if (!optStr(d, 'title', 1000)) p.push('title'); if (!optStr(d, 'vet', 1000)) p.push('vet'); if (!optStr(d, 'notes', 100000)) p.push('notes');
  if ('date' in d && !(typeof d.date === 'string' && DATE.test(d.date))) p.push('date');
  if ('createdAt' in d && typeof d.createdAt !== 'number') p.push('createdAt');
  return p;
}
function checkRecetaImg(id, d) { const p = []; if (!ID.test(id)) p.push('id'); if (typeof d.petId !== 'string' || !ID.test(d.petId)) p.push('petId'); return p; }
async function audit(db, log = console.log) {
  const res = { recetas: 0, recetasImg: 0, conProblema: 0, tipos: {} };
  const tally = (ref, problems) => { if (!problems.length) return; res.conProblema++; problems.forEach((k) => { res.tipos[k] = (res.tipos[k] || 0) + 1; }); log(`${JSON.stringify(ref.path)}: ${problems.join(', ')}`); };
  const a = await db.collectionGroup('recetas').get(); res.recetas = a.size; a.docs.forEach((d) => tally(d.ref, checkReceta(d.id, d.data())));
  // Sin descargar las imágenes completas: solo el id y petId.
  const b = await db.collectionGroup('recetasImg').select('petId').get(); res.recetasImg = b.size; b.docs.forEach((d) => tally(d.ref, checkRecetaImg(d.id, d.data())));
  log(`Recetas: ${res.recetas}. Imágenes: ${res.recetasImg}. Con diferencias: ${res.conProblema}. Tipos: ${JSON.stringify(res.tipos)}`);
  return res;
}
if (require.main === module) {
  const admin = require('firebase-admin');
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) { console.error('Falta FIREBASE_SERVICE_ACCOUNT.'); process.exit(2); }
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  audit(admin.firestore()).then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); });
}
module.exports = { checkReceta, checkRecetaImg, audit };
