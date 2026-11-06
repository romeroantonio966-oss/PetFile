# Respaldo de reglas publicadas

`firestore.published-2026-11-06.rules` es copia exacta de las reglas de Firestore publicadas en producción,
copiadas desde Firebase Console el 2026-11-06. Coinciden con `firestore.rules` de `main` (0688783), salvo comentarios.

SHA-256 con saltos de línea LF: `fd283083cddccc2c518ff2deb8636db8946031788c5c5c6fe0e38cd3a9015dea`

No editar este archivo: una prueba lo compara con ese hash.

Falta respaldar las reglas de **Storage** publicadas, porque `mobile-app` también cambia `storage.rules`.

## Antes de publicar reglas nuevas
1. En Firebase Console → Firestore Database → Reglas, copiar las reglas publicadas y comprobar que coincidan con este archivo.
2. Anotar la fecha y hora de la versión publicada que aparece en el historial de esa pestaña.
3. Tener abierto este archivo para restaurarlo si hace falta.

## Restaurar (unos minutos)
**Opción A, desde el historial de la consola:** Firestore Database → Reglas → en el historial, elegir la versión anterior a la publicación y restaurarla. Después, publicar.

**Opción B, pegando el respaldo:** abrir este archivo, copiar todo, pegarlo en Firestore Database → Reglas y presionar **Publicar**.

Las reglas tardan hasta unos minutos en aplicarse. No cambian ni borran datos: solo vuelven a permitir o rechazar operaciones.

## Comprobar la restauración
- Abrir la web publicada, entrar con una cuenta de prueba, crear un registro y verlo después de recargar.
- En Reglas, confirmar que el texto publicado coincide con este archivo.
