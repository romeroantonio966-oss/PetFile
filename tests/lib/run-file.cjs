// Corre un archivo de pruebas y garantiza que termine, con un resultado claro.
// --test-force-exit: el SDK de Firebase puede dejar conexiones abiertas tras terminar; sin esto el proceso queda colgado.
// --test-timeout: una promesa que nunca se resuelve falla esa prueba, en vez de esperar sin fin.
// El resultado no se altera: si una prueba falla, el código de salida sigue siendo distinto de 0.
const { spawnSync } = require('child_process');
function runFile(file, { testTimeout = 120000, watchdog = 600000, stdio = 'inherit' } = {}) {
  const env = { ...process.env }; delete env.NODE_TEST_CONTEXT; // Corrida independiente, aunque se llame desde otra prueba.
  const r = spawnSync(process.execPath, ['--test', '--test-force-exit', `--test-timeout=${testTimeout}`, file], { stdio, timeout: watchdog, encoding: 'utf8', env });
  if (r.error && r.error.code === 'ETIMEDOUT') return { ok: false, why: `no terminó en ${watchdog / 1000} s`, output: r.stdout };
  if (r.error) return { ok: false, why: r.error.message, output: r.stdout };
  return { ok: r.status === 0, why: r.status === 0 ? '' : `código de salida ${r.status}`, output: r.stdout };
}
const nodeOk = (v = process.versions.node) => Number(v.split('.')[0]) >= 22;
module.exports = { runFile, nodeOk };
