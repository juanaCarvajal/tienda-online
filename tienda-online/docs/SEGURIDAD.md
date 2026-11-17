# Revisión de seguridad – Integrante 1

Checklist de seguridad aplicado a la autenticación, al consumo de la API y al proyecto Android.

## 1. Manejo del token

| Control | Dónde | Estado |
|---|---|---|
| El `accessToken` y el `refreshToken` se guardan con **Capacitor Preferences** (SharedPreferences privadas de la app), no en `localStorage`. | `src/app/core/services/token-storage.service.ts` | ✅ |
| El token se mantiene en memoria (signal) mientras la app está abierta para no leer disco en cada petición. | `auth.service.ts` | ✅ |
| El token se envía **solo** a la API de autenticación (`environment.apiUrl`), nunca a la API del catálogo (TCGdex), a su CDN de imágenes ni a terceros. | `auth.interceptor.ts` | ✅ |
| Los tokens tienen vencimiento corto (30 min, `expiresInMins`). | `environment.ts` | ✅ |
| Si la API responde **401**, se intenta renovar el token una sola vez con `/auth/refresh`; si falla, se cierra la sesión. | `auth.interceptor.ts` | ✅ |
| Al cerrar sesión se borran token, refreshToken y datos del usuario. | `TokenStorageService.clear()` | ✅ |
| Las rutas privadas están protegidas con `authGuard`. | `app.routes.ts` | ✅ |
| `android:allowBackup="false"`: los datos de la app (incluido el token) no se copian a respaldos de Google ni por `adb backup`. | `AndroidManifest.xml` | ✅ |

## 2. HTTPS

| Control | Dónde | Estado |
|---|---|---|
| Las URL de las APIs son `https://dummyjson.com` y `https://api.tcgdex.net`. | `environment.ts` | ✅ |
| El interceptor rechaza cualquier petición `http://`. | `auth.interceptor.ts` | ✅ |
| Android bloquea tráfico sin cifrar: `usesCleartextTraffic="false"` + `network_security_config.xml`. | `android/app/src/main/...` | ✅ |
| El WebView sirve la app como `https://localhost` (`androidScheme: 'https'`) y no permite contenido mixto. | `capacitor.config.ts` | ✅ |
| Content-Security-Policy: solo se permiten conexiones a DummyJSON y TCGdex, e imágenes de `assets.tcgdex.net`. | `src/index.html` | ✅ |

## 3. Claves expuestas

| Control | Estado |
|---|---|
| No hay API keys en el código: ni DummyJSON ni TCGdex requieren clave. | ✅ |
| `.gitignore` excluye `*.jks`, `*.keystore`, `keystore.properties`, `.env`, `google-services.json`, `*.apk`, `*.aab`. | ✅ |
| Script `npm run check:secrets` busca claves de Google, JWT, claves privadas, contraseñas y URLs `http://`. | ✅ |
| GitHub Actions ejecuta `check:secrets` en cada push y pull request. | ✅ |

> **Para el Integrante 2 (firma del AAB):** la llave `.jks` y sus contraseñas **nunca** se suben al repositorio. Se guardan fuera del proyecto o en un `keystore.properties` local (ya ignorado por Git).

## 4. Riesgos conocidos y mitigación

- **Preferences no está cifrado.** En un teléfono con *root* se podría leer el token. Mitigación aplicada: vencimiento corto + borrado al cerrar sesión. Mejora futura: usar un plugin de almacenamiento seguro (Android Keystore).
- **DummyJSON es una API de pruebas.** Acepta cualquier usuario de su lista pública; en producción se reemplaza por un backend propio.
- **El APK/AAB se puede descompilar.** Por eso no debe haber secretos en el frontend: cualquier clave privada debe vivir en un servidor.
