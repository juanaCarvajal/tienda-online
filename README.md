# Tienda Online de cartas Pokémon TCG – App móvil híbrida (Android)

Aplicación de tienda online desarrollada con **Ionic 8 + Angular 19 + Capacitor 7** como proyecto ABP del Módulo 6 (Publicación y distribución).

| Funcionalidad | Estado | Responsable |
|---|---|---|
| Autenticación con Firebase (registro, login, Google, recuperar contraseña) | ✅ | Integrante 1 |
| Catálogo de cartas Pokémon TCG (expansiones, filtros por tipo y nombre, orden, detalle con precio) | ✅ | Integrante 1 |
| Seguridad (token, HTTPS, claves) | ✅ | Integrante 1 |
| Carrito de compras + almacenamiento local | 🚧 | Integrante 2 |
| Build Android (AAB firmado) | 🚧 | Integrante 2 |
| Pruebas en emulador y dispositivo | 🚧 | Integrante 3 |

## APIs utilizadas

Ambas funcionan por HTTPS. TCGdex no requiere clave; Firebase usa una configuración web que es pública por diseño (ver más abajo).

**1. Autenticación – [Firebase Authentication](https://firebase.google.com/docs/auth)**

- Crear cuenta con nombre, correo y contraseña.
- Iniciar sesión con correo y contraseña, o con Google (en la versión web).
- Recuperar contraseña por correo.
- La sesión se mantiene al cerrar y abrir la app.

**2. Catálogo de cartas Pokémon TCG – [TCGdex](https://tcgdex.dev)** (en español)

| Uso | Método y endpoint |
|---|---|
| Expansiones | `GET /v2/es/sets` |
| Tipos de energía | `GET /v2/es/types` |
| Cartas de un tipo | `GET /v2/es/types/{tipo}` |
| Cartas de una expansión | `GET /v2/es/sets/{id}` |
| Buscar por nombre | `GET /v2/es/cards?name=pikachu&pagination:page=1&pagination:itemsPerPage=20` |
| Detalle y precio | `GET /v2/es/cards/{id}` |

**Filtros del catálogo:** buscar en la expansión elegida o en todas, tipo de energía (Fuego, Agua…), nombre (sin importar tildes ni mayúsculas) y orden por número o nombre. Los filtros se combinan entre sí y se pueden limpiar con un botón.

El precio de cada carta es el precio de referencia de mercado que publica TCGdex (Cardmarket en EUR o, si no hay, TCGPlayer en USD). Las cartas sin precio se muestran como "Precio no disponible".

> Se descartó pokemontcg.io porque está en desuso: no acepta registros nuevos y las claves existentes dejan de funcionar el 1 de marzo de 2027.

## Diseño "Dex TCG"

Interfaz propia inspirada en un escáner retro: carcasa roja, lente azul con brillo, luces LED y pantallas oscuras tipo LCD.

- Catálogo en cuadrícula con inclinación 3D y brillo holográfico que sigue al cursor o al dedo (`src/app/shared/tilt.directive.ts`).
- Lente animado reutilizable (`src/app/shared/dex-lens/`), que pulsa más rápido mientras carga.
- Transiciones con curvas *ease-in-out*, entrada escalonada de las cartas, esqueletos de carga con barrido.
- Respeta `prefers-reduced-motion`: si el usuario desactiva animaciones en su teléfono, se apagan.
- Paleta y animaciones globales en `src/styles.scss`.

## Estructura

```
src/app/
├── core/
│   ├── models/          user.model.ts, product.model.ts
│   ├── services/        auth.service.ts (Firebase), product.service.ts (TCGdex)
│   ├── interceptors/    auth.interceptor.ts   (solo HTTPS; token solo a backend propio)
│   └── guards/          auth.guard.ts         (authGuard, guestGuard)
├── shared/            dex-lens (lente animado), tilt.directive (efecto 3D)
├── pages/
│   ├── login/               Inicio de sesión (correo, Google, recuperar contraseña)
│   ├── registro/            Crear cuenta
│   ├── catalogo/            Lista, búsqueda, categorías, scroll infinito
│   ├── producto-detalle/    Detalle del producto
│   └── carrito/             (Integrante 2)
├── app.routes.ts
└── app.config.ts
android/                     Proyecto nativo generado por Capacitor
docs/                        SEGURIDAD.md, FLUJO_DE_TRABAJO.md
scripts/check-secrets.mjs    Revisión de claves expuestas
```

## Requisitos

- Node.js 20 o superior
- Android Studio (Ladybug o superior) con SDK 35
- JDK 21 (incluido en Android Studio)

## Configurar Firebase (una sola vez)

1. Entrar a [console.firebase.google.com](https://console.firebase.google.com) y crear un proyecto.
2. **Authentication → Sign-in method**: activar **Correo electrónico/contraseña** y **Google**.
3. **Configuración del proyecto → Tus apps → Web (`</>`)**: registrar la app y copiar `apiKey`, `authDomain`, `projectId` y `appId`.
4. Pegar esos valores en `src/environments/environment.ts` **y** en `src/environments/environment.prod.ts` (reemplazando `PEGAR_AQUI`).
5. **Authentication → Settings → Authorized domains**: agregar el dominio donde se prueba la app (por ejemplo el de Codespaces, `xxxx-4200.app.github.dev`). `localhost` ya viene autorizado.

> La configuración web de Firebase **no es secreta**: Google la diseñó para ir dentro de la app. Lo que protege la cuenta son los dominios autorizados y las reglas de Firebase. Ver [docs/SEGURIDAD.md](docs/SEGURIDAD.md).

## Ejecutar

```bash
npm install
npm start                 # navegador: http://localhost:4200
```

## Compilar para Android

```bash
npm run android:sync      # ng build --configuration production + npx cap sync android
npm run android:open      # abre el proyecto en Android Studio
```

En Android Studio: **Build → Generate Signed App Bundle / APK → Android App Bundle**.

> La carpeta `android/` ya está creada (`npx cap add android`), por eso **no** se debe volver a ejecutar `cap add`; solo `cap sync`.

## Seguridad

Ver [docs/SEGURIDAD.md](docs/SEGURIDAD.md). Antes de cada commit:

```bash
npm run check:secrets
```

## Ramas y forma de trabajo

Ver [docs/FLUJO_DE_TRABAJO.md](docs/FLUJO_DE_TRABAJO.md).

## Integrantes

- Integrante 1 – Autenticación, API y repositorio
- Integrante 2 – Carrito y build Android
- Integrante 3 – Pruebas y documentación
