// PETFILE: arma www/, la versión web que se empaqueta en las apps de Android e iOS.
// public/ es la fuente única y no se modifica; la web de Netlify sigue sirviendo public/ tal cual.
// Uso: npm run mobile:build
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'public');
const OUT = join(ROOT, 'www');
const VENDOR = join(OUT, 'vendor');
const MOD = join(ROOT, 'node_modules');

const fail = (msg) => { console.error(`build-mobile: ${msg}`); process.exit(1); };
const version = (pkg) => JSON.parse(readFileSync(join(MOD, pkg, 'package.json'), 'utf8')).version;

// El reemplazo debe coincidir exactamente: si index.html cambia, el build falla en vez de empaquetar algo a medias.
function swap(html, from, to) {
  const n = html.split(from).length - 1;
  if (n !== 1) fail(`se esperaba 1 coincidencia y hubo ${n}: ${from}`);
  return html.replace(from, () => to);
}

rmSync(OUT, { recursive: true, force: true });
// sw.js no va en la app: las notificaciones nativas no dependen de él.
cpSync(SRC, OUT, { recursive: true, filter: (p) => !p.endsWith('sw.js') });
mkdirSync(join(VENDOR, 'fonts'), { recursive: true });

let html = readFileSync(join(OUT, 'index.html'), 'utf8');

// Firebase: misma versión que usa la web
const FIREBASE = '10.12.2';
if (version('firebase') !== FIREBASE) fail(`firebase instalado ${version('firebase')}, se esperaba ${FIREBASE}`);
for (const part of ['app', 'auth', 'firestore', 'storage']) {
  const file = `firebase-${part}-compat.js`;
  cpSync(join(MOD, 'firebase', file), join(VENDOR, file));
  html = swap(html, `https://www.gstatic.com/firebasejs/${FIREBASE}/${file}`, `vendor/${file}`);
}

// jsPDF: misma versión que usa la web
const JSPDF = '2.5.1';
if (version('jspdf') !== JSPDF) fail(`jspdf instalado ${version('jspdf')}, se esperaba ${JSPDF}`);
cpSync(join(MOD, 'jspdf/dist/jspdf.umd.min.js'), join(VENDOR, 'jspdf.umd.min.js'));
let appJs = readFileSync(join(OUT, 'app.js'), 'utf8');
appJs = swap(appJs, `https://cdnjs.cloudflare.com/ajax/libs/jspdf/${JSPDF}/jspdf.umd.min.js`, 'vendor/jspdf.umd.min.js');

// Fuentes: las mismas familias y nombres que declara el CSS de la app
const FONTS = [
  { pkg: '@fontsource-variable/bricolage-grotesque', css: 'standard.css', family: 'Bricolage Grotesque', slug: 'bricolage-grotesque', axes: 'standard' },
  { pkg: '@fontsource-variable/instrument-sans', css: 'wght.css', family: 'Instrument Sans', slug: 'instrument-sans', axes: 'wght' },
];
let fontCss = '';
for (const f of FONTS) {
  const faces = readFileSync(join(MOD, f.pkg, f.css), 'utf8').match(/@font-face\s*{[^}]*}/g) || [];
  for (const subset of ['latin', 'latin-ext']) {
    const file = `${f.slug}-${subset}-${f.axes}-normal.woff2`;
    const face = faces.find((x) => x.includes(`/${file}`));
    if (!face) fail(`no se encontró ${file} en ${f.pkg}/${f.css}`);
    cpSync(join(MOD, f.pkg, 'files', file), join(VENDOR, 'fonts', file));
    fontCss += face
      .replace(/font-family:\s*'[^']*'/, `font-family: '${f.family}'`)
      .replace(/url\(\.\/files\/[^)]*\)/, `url(fonts/${file})`) + '\n';
  }
}
writeFileSync(join(VENDOR, 'fonts.css'), fontCss);
// Sin salto de línea en el patrón: en Windows, Git puede dejar index.html con CRLF.
html = swap(html, '<link rel="preconnect" href="https://fonts.googleapis.com">', '');
html = swap(html, 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Instrument+Sans:wght@400;500;600;700&display=swap', 'vendor/fonts.css');

// Nada de la interfaz debe quedar cargándose desde internet.
for (const host of ['gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com']) {
  if (html.includes(host) || appJs.includes(host)) fail(`quedó una referencia a ${host}`);
}
// Política de seguridad de la app: la de la web, con los recursos ya empaquetados localmente.
const CSP = [
  "default-src 'none'", "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", "style-src-elem 'self'", "style-src-attr 'unsafe-inline'",
  "font-src 'self'", "img-src 'self' data: blob: https://firebasestorage.googleapis.com",
  "connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebasestorage.googleapis.com https://formsubmit.co",
  "manifest-src 'self'", "form-action 'self'", "base-uri 'none'", "object-src 'none'",
].join('; ');
html = swap(html, '<head>', `<head>\n<meta http-equiv="Content-Security-Policy" content="${CSP}">`);
writeFileSync(join(OUT, 'index.html'), html);
for (const page of ['privacidad.html', 'terminos.html']) {
  const legal = readFileSync(join(OUT, page), 'utf8');
  writeFileSync(join(OUT, page), swap(legal, '<head>', `<head>\n<meta http-equiv="Content-Security-Policy" content="${CSP}">`));
}
writeFileSync(join(OUT, 'app.js'), appJs);
if (!existsSync(join(OUT, 'icon-512.png'))) fail('faltan archivos de public/');
console.log('build-mobile: www/ listo');
