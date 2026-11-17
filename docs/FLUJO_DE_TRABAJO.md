# Flujo de trabajo en GitHub

## Ramas

| Rama | Para qué | Responsable |
|---|---|---|
| `main` | Versión estable que se entrega. Solo recibe merges desde `develop`. | Integrante 1 |
| `develop` | Integración de todo el equipo. | Todos |
| `feature/auth-api` | Login, guard, interceptor y servicio de catálogo. | Integrante 1 |
| `feature/carrito-storage` | Carrito de compras y almacenamiento local. | Integrante 2 |
| `feature/build-android` | Ajustes de Android, firma y generación del AAB. | Integrante 2 |
| `docs/pruebas` | Documento de pruebas y capturas. | Integrante 3 |
| `fix/<descripcion>` | Correcciones de errores reportados en pruebas. | Quien corrija |

## Cómo trabajar

```bash
git checkout develop
git pull
git checkout -b feature/mi-tarea
# ... cambios ...
git add .
git commit -m "feat: descripción corta"
git push -u origin feature/mi-tarea
```

Luego abrir un **Pull Request** hacia `develop` en GitHub. Cuando todo esté probado, el Integrante 1 hace el merge de `develop` a `main`.

## Mensajes de commit

- `feat:` nueva funcionalidad
- `fix:` corrección de error (indicar el caso de prueba, ej. `fix: CP-LOGIN-03 mensaje sin conexión`)
- `docs:` documentación
- `chore:` configuración, dependencias

## Protección de `main` (en GitHub)

Settings → Branches → Add branch protection rule → `main`:
- Require a pull request before merging
- Require status checks to pass (seleccionar **CI / build**)
