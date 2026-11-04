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
