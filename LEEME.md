# PETFILE · Grupo ARCA

- `public/` — la app (lo que ve el cliente).
- `netlify/functions/activate.js` — activa Premium con el código de licencia que llega por correo.
- `netlify/functions/lemon-webhook.js` — activa Premium solo, apenas Lemon Squeezy confirma la compra.
- `firestore.rules` — reglas de seguridad para pegar en Firestore → Reglas.

## Variables de entorno en Netlify (Site configuration → Environment variables)

| Variable | Valor |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Todo el contenido del archivo JSON de la cuenta de servicio de Firebase |
| `LEMON_WEBHOOK_SECRET` | La misma clave secreta que pongas en el webhook de Lemon Squeezy |
| `LEMON_STORE_ID` | (Opcional) El número de tu tienda en Lemon Squeezy |

Nunca subas el archivo JSON de la cuenta de servicio a GitHub.
