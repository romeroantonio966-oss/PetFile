// Un cliente por usuario. context.firestore() reconfigura el emulador en cada llamada, y el SDK lo rechaza
// (failed-precondition) una vez que el cliente ya operó: hay que guardar el cliente, no el contexto.
function clientPool(env) { const pool = new Map(); return (uid) => { if (!pool.has(uid)) pool.set(uid, env.authenticatedContext(uid).firestore()); return pool.get(uid); }; }
// Solo es pérdida lo que el servidor confirmó y ya no está. Lo que nunca se confirmó es otro fallo, igual de real.
function auditWrites({ attempted, confirmed, kept }) {
  const issues = [], lost = Math.max(0, confirmed - kept), unconfirmed = attempted - confirmed;
  if (unconfirmed > 0) issues.push(`${unconfirmed} de ${attempted} escrituras no se confirmaron; la prueba no valida esos registros`);
  if (lost > 0) issues.push(`PÉRDIDA REAL: ${lost} registros confirmados por el servidor ya no están`);
  return { lost, unconfirmed, issues };
}
module.exports = { clientPool, auditWrites };
