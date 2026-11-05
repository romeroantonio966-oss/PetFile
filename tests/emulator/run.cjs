// Corre cada archivo por separado. Todos usan el mismo emulador y proyecto: en paralelo, el borrado
// de datos de uno deja sin permiso al otro y las escrituras al mismo documento se bloquean entre sí.
// Uso: node tests/emulator/run.cjs [parte del nombre del archivo]
const fs = require('fs'), path = require('path'); const { runFile, nodeOk } = require('../lib/run-file.cjs');
if (!nodeOk()) { console.error(`Se requiere Node 22 o superior; este es ${process.version}.`); process.exit(2); }
const only = process.argv[2]; const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.test.cjs') && (!only || f.includes(only))).sort();
if (!files.length) { console.error(`No hay archivos de prueba que coincidan con "${only}".`); process.exit(2); }
const failed = [];
for (const f of files) { console.log(`\n=== ${f} (Node ${process.version}) ===`); const r = runFile(path.join(__dirname, f)); if (!r.ok) failed.push(`${f}: ${r.why}`); }
console.log(failed.length ? `\nFALLÓ:\n- ${failed.join('\n- ')}` : `\nAPROBADO: ${files.length} archivo(s) sin fallos`); process.exit(failed.length ? 1 : 0);
