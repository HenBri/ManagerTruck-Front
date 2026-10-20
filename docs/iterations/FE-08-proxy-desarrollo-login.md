# FE-08 - Corrección del login: proxy de desarrollo no declarado

Fecha: 2026-10-19.

## Síntoma

El formulario de acceso rechazaba credenciales válidas de las cuatro cuentas de prueba (`admin@kentrukers.test`, `secretaria@kentrukers.test`, `socio@kentrukers.test`, `conductor@kentrukers.test`, contraseña compartida `KenTrukers2026!`) y mostraba un error tras enviar.

## Diagnóstico

| Comprobación                                            | Resultado                                                                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `GET http://localhost:8080/api/users/me` con HTTP Basic | `200` JSON para las cuatro cuentas; datos y estado `ACTIVE` correctos                                                                |
| `GET http://localhost:8080/api/users/me/memberships`    | `200`; `SECRETARY`, `PARTNER` y `DRIVER` en la empresa `990011`; lista vacía para SUPER_ADMIN                                        |
| `GET http://localhost:8080/api/platform/user-roles`     | `200` con `SUPER_ADMIN` para admin; `403` para los usuarios empresariales (esperado y contemplado en `src/app/core/auth/session.ts`) |
| `GET http://localhost:4200/api/users/me` con HTTP Basic | `200` con el HTML de `index.html` en lugar de JSON                                                                                   |

Causa raíz: el servidor de desarrollo se había arrancado como `ng serve` sin `--proxy-config`, y `proxy.conf.json` no estaba declarado en `angular.json`. Sin proxy, el fallback de rutas de la SPA devolvía `index.html` para `/api/**`, el `forkJoin` de `Session.login` recibía HTML en vez de JSON y el acceso fallaba para cualquier cuenta.

Las pruebas E2E permanecían aprobadas porque interceptan HTTP con fixtures (`e2e/mvp-business.spec.ts`, `e2e/workspace.spec.ts`): no ejercitan el proxy real ni el backend.

## Corrección

| Archivo           | Cambio                                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `angular.json`    | `architect.serve.options.proxyConfig = "proxy.conf.json"`; el proxy se aplica en cualquier configuración de `serve`, no solo si se pasa el flag CLI |
| `package.json`    | `"start": "ng serve --proxy-config proxy.conf.json"` → `"start": "ng serve"`; una sola fuente de verdad en `angular.json`                           |
| `README.md`       | Se documenta que el proxy vive en `angular.json` y que un `ng serve` sin él rompe el acceso                                                         |
| `proxy.conf.json` | Sin cambios (`target: http://localhost:8080`)                                                                                                       |

Backend sin cambios: la autenticación HTTP Basic y los endpoints usados por el login ya funcionaban.

## Evidencias ejecutadas

| Verificación                                       | Resultado                                                                                                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Proxy en `localhost:4200` con HTTP Basic           | `200` JSON en `/api/users/me` y `/api/users/me/memberships` para las cuatro cuentas; `/api/platform/user-roles` `200` para admin y `403` para el resto |
| Login real en navegador (Playwright, sin fixtures) | 4/4 cuentas llegan a `/inicio` con la identidad correcta; contraseña incorrecta muestra "Credenciales incorrectas" y permanece en `/login`             |
| `npm run build`                                    | Aprobado; bundle inicial 280.50 kB                                                                                                                     |
| `npm run test:ci`                                  | 7 pruebas aprobadas en 4 archivos                                                                                                                      |
| `npm run test:e2e`                                 | 20 pruebas aprobadas; Chromium escritorio y móvil emulado                                                                                              |

## Impacto y notas

- El login depende del proxy solo en desarrollo; en producción se mantiene el reverse proxy de `deploy/nginx.conf.example`.
- Las pruebas de navegador reales contra el backend se ejecutaron como verificación puntual y no se incorporan a `e2e/` para no condicionar la suite al backend local.
