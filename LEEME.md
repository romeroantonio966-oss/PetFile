# PETFILE · Grupo ARCA

- `public/` — la app (lo que ve el cliente).
- `netlify/functions/activate.js` — activa Premium con el código de licencia que llega por correo.
- `netlify/functions/lemon-webhook.js` — activa Premium solo, apenas Lemon Squeezy confirma la compra.
- `netlify/functions/fs-photo.js` — entrega al PDF las fotos del bucket de PETFILE, solo imágenes.
- `firestore.rules` — reglas de seguridad para pegar en Firestore → Reglas.
- `storage.rules` — reglas de seguridad para pegar en Storage → Reglas (fotos de los registros).

## Variables de entorno en Netlify (Site configuration → Environment variables)

| Variable | Valor |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Todo el contenido del archivo JSON de la cuenta de servicio de Firebase |
| `LEMON_WEBHOOK_SECRET` | La misma clave secreta que pongas en el webhook de Lemon Squeezy |
| `LEMON_STORE_ID` | (Opcional) El número de tu tienda en Lemon Squeezy |

Nunca subas el archivo JSON de la cuenta de servicio a GitHub.

## Encender las fotos en los registros (pendiente)

Están apagadas porque Firebase Storage todavía no está activo. Para encenderlas:

1. Pasar el proyecto a Blaze, crear Storage en `US-CENTRAL1` y pegar `storage.rules`.
2. En `public/index.html`, poner `RECORD_PHOTOS=true`.
3. Volver a agregar a la lista Premium el tope de 5 fotos, y revisar el texto de ayuda de Recetas y `privacidad.html`.

## Encender los certificados de pedigrí y microchip (pendiente)

Pedigrí y microchip funcionan sin esto. Solo los certificados adjuntos (foto o PDF) esperan, porque usan la colección `certs` y necesitan la regla nueva:

1. `npm run test:rules` sin fallos.
2. Publicar solo las reglas de Firestore: `firebase deploy --only firestore:rules` (respaldo y vuelta atrás en `rules-backup/`).
3. En `public/app.js`, poner `CERT_FILES=true` y publicar la web.

Los certificados se guardan en `families/{familia}/certs/{mascota}_{ped|chip}`, nunca dentro de la mascota, con un máximo de unos 680 KB.

## Pruebas de seguridad

- `npm test`: funciones, ataques XSS, flujos normales y política de seguridad, con Firebase simulado. Requiere `npx playwright install chromium` la primera vez.
- `npm run test:rules`: reglas de Firestore y Storage contra el emulador local. Requiere Java y usa el proyecto `demo-petfile`, que no puede tocar producción.

Los datos de licencia nuevos se guardan en `familyLicenses`, que solo lee el servidor. `scripts/migrate-license-fields.cjs` mueve los antiguos; solo cambia datos con `--apply`.

## Versiones viejas y aviso de actualización

- Toda escritura de una mascota lleva `wAt` (hora del servidor). La regla de `pets` rechaza las que no la traen, así una versión vieja de la app (abierta en segundo plano o con cambios en cola sin conexión) no puede reescribir el historial y borrar registros.
- **Orden al publicar:** primero la web (envía `wAt`; las reglas actuales lo aceptan) y después las reglas. Si se publican las reglas antes, la web actual no puede guardar.
- `public/version.json` y `APP_VERSION` en `public/app.js` deben coincidir (hay una prueba). Al publicar una versión nueva, cambiar los dos: la web que esté abierta avisa con **Actualizar** o recarga sola al volver a la app si no hay un formulario abierto.
