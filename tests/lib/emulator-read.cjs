// Lee del emulador sin reglas. withSecurityRulesDisabled devuelve Promise<void> y descarta lo que retorna
// la función interna: el valor debe salir por una variable externa.
const { doc, getDoc } = require('firebase/firestore');
const fetchDoc = (ctx, path) => getDoc(doc(ctx.firestore(), path));
async function readDoc(env, path, fetch = fetchDoc) {
  let out; await env.withSecurityRulesDisabled(async (c) => { const s = await fetch(c, path); out = { exists: s.exists(), data: s.data() }; });
  if (!out) throw new Error(`La lectura de ${path} no se ejecutó`);
  return out;
}
// Para documentos que deben existir: si falta, dice cuál y qué comprobar.
async function mustRead(env, path, fetch = fetchDoc) {
  const r = await readDoc(env, path, fetch);
  if (!r.exists) { const parent = path.split('/').slice(0, 2).join('/'), p = await readDoc(env, parent, fetch); throw new Error(`Falta ${path} en el emulador; ${parent} ${p.exists ? 'sí existe' : 'tampoco existe'}. Revisar la preparación de datos o si otra suite borró el emulador.`); }
  return r.data;
}
module.exports = { readDoc, mustRead };
