// PETFILE: service worker mínimo para que la app se pueda instalar.
// No guarda caché: siempre carga la versión más reciente desde Netlify.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
