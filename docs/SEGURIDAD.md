# Revisión de seguridad – Integrante 1

Checklist de seguridad aplicado a la autenticación (Firebase), al consumo de la API del catálogo (TCGdex) y al proyecto Android.

## 1. Autenticación y manejo de la sesión

| Control | Dónde | Estado |
|---|---|---|
| Las contraseñas nunca pasan por código propio ni se guardan en la app: las procesa Firebase Authentication. | `auth.service.ts` | ✅ |
| Contraseña mínima de 6 caracteres y confirmación en el registro. | `registro.page.ts` | ✅ |
| La sesión la persiste el SDK de Firebase en IndexedDB, dentro del almacenamiento privado del WebView de la app (no en `localStorage`). | `auth.service.ts` (`indexedDBLocalPersistence`) | ✅ |
| Los tokens de Firebase duran 1 hora y el SDK los renueva automáticamente; no se manipulan a mano. | Firebase SDK | ✅ |
| El token **no se envía a TCGdex** ni a ningún tercero; el interceptor solo lo agregaría a un backend propio (`environment.apiUrl`, hoy vacío). | `auth.interceptor.ts` | ✅ |
| Al cerrar sesión se llama a `signOut()`, que borra la sesión guardada. | `AuthService.logout()` | ✅ |
| Las rutas privadas están protegidas con `authGuard`; la sesión se restaura (`authStateReady`) antes de evaluarlas. | `app.routes.ts`, `app.config.ts` | ✅ |
| Mensajes de error genéricos ("Correo o contraseña incorrectos") para no revelar si un correo existe. | `authErrorMessage()` | ✅ |
| Firebase bloquea temporalmente tras muchos intentos fallidos (`auth/too-many-requests`). | Firebase | ✅ |
| `android:allowBackup="false"`: los datos de la app (incluida la sesión) no se copian a respaldos. | `AndroidManifest.xml` | ✅ |

## 2. HTTPS

| Control | Dónde | Estado |
|---|---|---|
| Todas las URL son HTTPS: Firebase (`*.googleapis.com`) y TCGdex (`api.tcgdex.net`). | `environment.ts` | ✅ |
| El interceptor rechaza cualquier petición `http://`. | `auth.interceptor.ts` | ✅ |
| Android bloquea tráfico sin cifrar: `usesCleartextTraffic="false"` + `network_security_config.xml`. | `android/app/src/main/...` | ✅ |
| El WebView sirve la app como `https://localhost` (`androidScheme: 'https'`) y no permite contenido mixto. | `capacitor.config.ts` | ✅ |
| Content-Security-Policy: solo se permiten conexiones a Firebase Auth y TCGdex, imágenes de TCGdex y Google, y las ventanas de inicio de sesión de Google/Firebase. | `src/index.html` | ✅ |

## 3. Claves expuestas

| Control | Estado |
|---|---|
| La configuración web de Firebase (`apiKey`, `authDomain`, `projectId`, `appId`) **no es un secreto**: identifica el proyecto y Google la diseñó para ir en el cliente. Solo se permite dentro de `src/environments/`. | ✅ |
| Lo que protege el proyecto: **dominios autorizados** en Firebase (Authentication → Settings) y, si se agrega base de datos, sus reglas de seguridad. | ✅ |
| Recomendado en Google Cloud Console: restringir la `apiKey` a las APIs *Identity Toolkit* y *Token Service*. | Pendiente (opcional) |
| TCGdex no requiere clave. | ✅ |
| `.gitignore` excluye `*.jks`, `*.keystore`, `keystore.properties`, `.env`, `google-services.json`, `*.apk`, `*.aab`. | ✅ |
| `npm run check:secrets` busca claves de Google, JWT, claves privadas, contraseñas y URLs `http://`. Una clave de Google **fuera** de `src/environments/` se reporta como error. | ✅ |
| GitHub Actions ejecuta `check:secrets` en cada push y pull request. | ✅ |

> **Para el Integrante 2 (firma del AAB):** la llave `.jks` y sus contraseñas **nunca** se suben al repositorio. Si se activa Google en Android, el archivo `google-services.json` tampoco se sube (ya está en `.gitignore`).

## 4. Riesgos conocidos y mitigación

- **Inicio de sesión con Google en Android.** El método de ventana emergente solo funciona en navegador; en el APK el botón se oculta. Para habilitarlo se requiere el plugin nativo `@capacitor-firebase/authentication`, la huella SHA-1 del keystore y `google-services.json`.
- **Verificación de correo.** Actualmente no se exige verificar el correo; puede activarse con `sendEmailVerification()`.
- **El APK/AAB se puede descompilar.** Por eso no hay secretos en el frontend: cualquier clave privada debe vivir en un servidor.
