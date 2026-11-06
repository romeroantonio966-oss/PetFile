# Auditoría de compatibilidad de mascotas (solo lectura)

Comprueba si las mascotas guardadas en producción cumplen `petOk` de las reglas nuevas.
Una mascota que no la cumpla se sigue leyendo, pero no se podría volver a guardar.

## Qué lee y qué muestra
- Lee cada documento de `families/*/pets` y de la ruta anterior `users/*/pets`, en páginas de 200: **una lectura por mascota**.
- Los documentos quedan solo en la memoria de esa ejecución: no se guardan en disco.
- Imprime **solo conteos** por motivo y por ruta: nunca ids, rutas, nombres, correos, fotos ni historiales.
- No escribe: el script no contiene operaciones de escritura, y una prueba automática lo verifica.

## Permisos
- Cuenta de servicio `auditor-lectura`, **sin claves**, con un único rol: **Cloud Datastore Viewer** (`roles/datastore.viewer`), que solo permite leer Firestore.
- Tu cuenta recibe **Service Account Token Creator** únicamente sobre esa cuenta de servicio, para usarla con credenciales temporales (suplantación).
- Las credenciales temporales quedan en tu computadora hasta que las revocas.

## Pasos (PowerShell)
1. Instalar Google Cloud CLI: https://cloud.google.com/sdk/docs/install
2. Google Cloud Console → proyecto `petfile-15279` → IAM y administración → Cuentas de servicio → Crear cuenta de servicio `auditor-lectura`, con el rol **Cloud Datastore Viewer**. No crear claves.
3. Abrir esa cuenta → Permisos → Otorgar acceso: tu correo, con el rol **Creador de tokens de cuenta de servicio**.
4. En PowerShell:
   ```
   gcloud auth application-default login --impersonate-service-account=auditor-lectura@petfile-15279.iam.gserviceaccount.com
   cd C:\Users\hj\PetFile
   git pull origin mobile-app
   Remove-Item Env:FIRESTORE_EMULATOR_HOST -ErrorAction SilentlyContinue
   node scripts/audit-pets.cjs --project=petfile-15279
   ```
5. Limpiar:
   ```
   gcloud auth application-default revoke
   ```
   Luego, en Cuentas de servicio, eliminar `auditor-lectura`.

Si aparece un error que pide **crear un índice**, no crearlo: detenerse y avisar.
