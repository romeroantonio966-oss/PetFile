// Separa el ruido del SDK de los fallos reales en las pruebas con emulador.
// Código 10: Firestore lo reintenta solo. Código 7: rechazo de reglas; solo es fallo si la prueba no lo esperaba.
function classify(text) {
  if (!/@firebase\/firestore|Firestore \(/.test(text)) return null;
  if (/Uncaught Error in snapshot listener/.test(text)) return 'uncaught';
  const code = (text.match(/Code:\s*(\d+)/) || [])[1];
  if (code === '10' || /ABORTED/.test(text)) return 'aborted';
  if (code === '7' || /PERMISSION_DENIED|permission-denied/.test(text)) return 'denied';
  return null;
}
function install() {
  const totals = { aborted: 0, denied: 0, uncaught: 0 }, samples = [];
  for (const m of ['warn', 'error', 'log']) {
    const orig = console[m].bind(console);
    console[m] = (...a) => { const text = a.map(String).join(' '), k = classify(text); if (!k) return orig(...a); totals[k]++; if (k === 'uncaught') samples.push(text); };
  }
  return { totals, samples, snapshot: () => ({ ...totals }), since: (s) => ({ aborted: totals.aborted - s.aborted, denied: totals.denied - s.denied, uncaught: totals.uncaught - s.uncaught }) };
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
module.exports = { classify, install, pause };
