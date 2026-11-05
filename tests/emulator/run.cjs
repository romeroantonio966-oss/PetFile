// Corre cada archivo por separado. Todos usan el mismo emulador y proyecto: en paralelo, el borrado
// de datos de uno deja sin permiso al otro y las escrituras al mismo documento se bloquean entre sí.
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path');
const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.test.cjs')).sort(); let failed = [];
for (const f of files) { console.log(`\n=== ${f} ===`); const r = spawnSync(process.execPath, ['--test', path.join(__dirname, f)], { stdio: 'inherit' }); if (r.status !== 0) failed.push(f); }
console.log(failed.length ? `\nFALLÓ: ${failed.join(', ')}` : `\nAPROBADO: ${files.length} archivos sin fallos`); process.exit(failed.length ? 1 : 0);
