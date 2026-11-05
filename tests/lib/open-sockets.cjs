// Control de cierre: al terminar una suite no deben quedar conexiones abiertas, porque mantienen vivo el proceso.
// Espera un momento porque el SDK y fetch cierran las suyas poco después de la limpieza.
const openSockets = () => process.getActiveResourcesInfo().filter((x) => x === 'TCPSocketWrap').length;
async function noOpenSockets({ wait = 15000 } = {}) {
  const end = Date.now() + wait;
  while (openSockets() > 0 && Date.now() < end) await new Promise((r) => setTimeout(r, 100));
  const n = openSockets(); if (n > 0) throw new Error(`Quedan ${n} conexiones abiertas tras la limpieza; el proceso no terminaría solo.`);
}
module.exports = { openSockets, noOpenSockets };
