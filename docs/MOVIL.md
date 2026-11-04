# PETFILE móvil (Capacitor)

Base móvil de la rama `mobile-app`. `public/` sigue siendo la única fuente de la interfaz y la web de Netlify no usa nada de lo que está aquí.

## Cómo se arma

`npm run mobile:build` crea `www/` a partir de `public/`:

- Firebase 10.12.2, jsPDF 2.5.1 y las fuentes quedan dentro de la app, en `www/vendor/`, con las mismas versiones de la web.
- `sw.js` no se incluye.
- `public/` no se modifica. El script se detiene con error si `index.html` cambió y un reemplazo ya no coincide.

`www/` y las copias dentro de `android/` e `ios/` se generan y no van en Git.

| Comando | Qué hace |
|---|---|
| `npm ci` | Instala las versiones exactas del `package-lock.json` |
| `npm run mobile:build` | Genera `www/` |
| `npm run mobile:sync` | Genera `www/` y lo copia a Android e iOS |
| `npm run mobile:android` | Lo anterior y abre Android Studio |

## Abrir en Android Studio (Windows)

Necesitas Node.js 22 o superior, Git y Android Studio actualizado, con Android SDK 36. Capacitor 8 usa JDK 21, que viene incluido en Android Studio.

```
git clone -b mobile-app https://github.com/romeroantonio966-oss/PetFile.git
cd PetFile
npm ci
npm run mobile:android
```

1. Espera a que termine "Gradle Sync" la primera vez.
2. Elige un teléfono con depuración USB o un emulador.
3. Presiona Run.

Después de cambiar algo en `public/`, ejecuta de nuevo `npm run mobile:sync`.

## Comportamiento solo en la app nativa

`NATIVE` en `public/index.html` es verdadero solo dentro de Capacitor. En la web queda falso y conserva sus avisos, textos, precio y enlaces.

- Sin avisos ni guías de instalación PWA.
- Invitaciones con `https://petfilearca.netlify.app/?familia=CODIGO` y menú nativo de compartir.
- Sin franja de versión gratis.
- Premium se muestra a ₡1.500 mensuales con "Disponible pronto" y sin compras. Esta oferta es solo para el APK de pruebas: no publicar así, porque aún no existen las suscripciones y los términos siguen describiendo el pago único.

"Copiar código" es el único cambio que también aparecerá en la web cuando esta rama se una a `main`.

## Notificaciones locales

La app programa en el teléfono los mismos avisos que `send-reminders`: resumen a las 7:00 y aviso una hora antes de cada cita con hora. Requieren Premium, igual que en la web.

Limitaciones:

- **Cambios de otras personas:** los avisos se actualizan cuando la app recibe los datos. Si un familiar cambia algo y este teléfono no abre la app, el aviso programado queda desactualizado o no existe.
- **Horizonte:** se programan como máximo 60 avisos dentro de 60 días. Hay que abrir la app para programar los siguientes.
- **Hora exacta:** Android puede retrasarlos si no concede alarmas exactas o por ahorro de batería. Algunos fabricantes pueden cancelarlos si se fuerza el cierre de la app.
- **Resumen con vencidos:** se calcula al programarlo, con los datos de ese momento.
- **Otros teléfonos:** cada teléfono activa sus avisos por separado.
- **Cerrar sesión:** cancela los avisos de ese teléfono. Al volver a entrar con la misma cuenta se programan de nuevo.
- **Permiso:** el plugin declara `SCHEDULE_EXACT_ALARM`; hay que revisarlo antes de publicar en Google Play.

Las notificaciones push (FCM) resolverían los cambios familiares y requieren otra fase.

## iOS

La estructura está en `ios/` y usa Swift Package Manager. Compilarla requiere una Mac con Xcode: `npx cap open ios`.

El icono de iOS está ampliado desde el original de 512 px. Antes de publicar hay que reemplazarlo con un original de 1024 px.

## Identidad

- Nombre: PETFILE
- Identificador: `com.grupoarca.petfile`
- Versión inicial: 1.0 (versionCode 1)

## Seguridad

No subas a Git archivos de firma (`.jks`, `.keystore`, `.p12`, `.p8`) ni claves privadas.

Para evitar despliegues en Netlify, el último commit de cada push a esta rama lleva `[skip netlify]` en su mensaje.
