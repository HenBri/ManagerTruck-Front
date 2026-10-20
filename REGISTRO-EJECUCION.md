# Registro de ejecución — ManagerTruck frontend

## 2026-10-17 · Inicio de ejecución

### Fuentes verificadas

- Frontend: Angular 21.2, Vitest, aplicación inicial.
- Backend localizado en `../ManagerTruck-Back/truck` y contratos en `../ManagerTruck-Back/docs/modules`.
- `SecurityConfig.java`: HTTP Basic sin sesión de servidor; no existen endpoints de login JWT ni refresh.
- API local confirmada por el usuario: `http://localhost:8080`. `GET /api/users/me` respondió 401 JSON: servicio accesible, requiere cuenta de prueba.
- API multiempresa: tenant explícito en `/api/companies/{companyId}/...`.
- DTO de usuario no expone roles globales. Membresías propias exponen `roleNames` y estado. No inferir SUPER_ADMIN desde datos introducidos por el usuario.
- El controller y SecurityConfig actuales prevalecen ante contratos históricos: DRIVER no tiene lectura de camiones.

### Decisiones

- CDK para foco/drawer y menú accesible; tema CSS propio basado en tokens. Se evita cargar Material completo para conservar un diseño propio ligero.
- Credencial Basic solo en memoria, eliminada al cerrar sesión; recargar exige autenticarse de nuevo. HTTPS obligatorio en despliegue.
- Comenzar con camiones como módulo vertical, selección de empresa, perfil y consulta de módulos disponibles.
- No se inventarán indicadores, gráficos, recuperación de contraseña, notificaciones ni endpoints de reportes.
- Los resultados automatizados con fixtures se registrarán separados de la aceptación contra backend real.

### Estado por iteración

| Iteración            | Estado    | Evidencia / pendiente                                                      |
| -------------------- | --------- | -------------------------------------------------------------------------- |
| 0 Contratos          | En curso  | Backend localizado; API accesible; falta cuenta/dataset de aceptación      |
| 1 UX                 | En curso  | Implementación del sistema visual y layouts; pendiente revisión de usuario |
| 2 Base técnica       | En curso  | CDK, Playwright y axe instalados; componentes creados con CLI              |
| 3 Shell              | Pendiente | Header/sidebar/footer/menú usuario                                         |
| 4 Autenticación      | Pendiente | Basic + membresías reales                                                  |
| 5 Camiones           | Pendiente | Listado, detalle, creación, edición y estado                               |
| 6 Otros módulos      | Pendiente | Entregas según contratos y permisos                                        |
| 7 Dashboard/reportes | Pendiente | No hay endpoint agregado de indicadores confirmado                         |
| 8 Calidad            | Pendiente | Build, unitarias, E2E, axe, móvil                                          |
| 9 Despliegue         | Pendiente | Documentación y configuración; falta destino de despliegue                 |

### Cambios preexistentes preservados

`angular.json`, `.agents/`, `skills-lock.json` y el plan previo estaban modificados/no versionados al inicio. No se realizaron commits.

## Continuación · Ejecución del plan MVP frontend

El estado de la tabla inicial es histórico. Desde entonces se implementaron shell, login Basic, perfil, dashboard, camiones y formularios/tablas de nueve módulos. Se continúa sobre ese código.

- FE-00 completada: **12/12 E2E aprobadas** tras corregir accesibilidad y desbordamiento móvil. Detalle: `docs/iterations/FE-00-estabilizacion.md`.
- FE-01/02 en desarrollo: contexto empresarial, selectores de relaciones, filtros y protección de cambios.
- Pendiente de aceptación real: cuentas por rol y dataset de prueba; la API local fue accesible, pero no se ha validado una operación autenticada real.
- Alcance confirmado por el usuario: exclusivamente frontend. No se modifica el backend.

## 2026-10-19 · Entrega de implementación MVP

### Estado consolidado (sustituye el estado histórico inicial)

| Iteración             | Implementación / verificación         | Evidencia                                                                      |
| --------------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| FE-00 Estabilización  | Completada                            | Correcciones de móvil y accesibilidad; base E2E aprobada                       |
| FE-01 Acceso/empresa  | Implementada, verificada con fixtures | Basic, membresías, nombres de empresa, contexto SUPER_ADMIN, perfil            |
| FE-02 Componentes     | Implementada, verificada con fixtures | Selectores paginados, etiquetas relacionadas, filtros/URL, cambios pendientes  |
| FE-03 Flota/personas  | Implementada                          | Socios, camiones, conductores; HTTP y E2E de camiones                          |
| FE-04 Comercial       | Implementada, flujo E2E aprobado      | Clientes → contratos → cargas → contenedores                                   |
| FE-05 Viajes          | Implementada, flujo E2E aprobado      | Asignaciones, asistente, PARTNER/AUXILIARY y transiciones                      |
| FE-06 Administración  | Implementada, E2E aprobado            | Empresa sin membresía para SUPER_ADMIN, miembros y asignación aditiva de roles |
| FE-07 Calidad/entrega | Verificación local completada         | Build aprobado, 7 unitarias/HTTP y 20 E2E aprobadas                            |

### Resultados y decisiones finales

- Build inicial: **280.50 kB**, dentro del presupuesto existente de 500 kB de advertencia.
- **7/7 pruebas unitarias/HTTP** y **20/20 E2E** aprobadas. Auditorías axe en pantallas clave sin violaciones detectadas.
- API real disponible en `localhost:8080`, respuesta 401 esperada sin credenciales.
- **El usuario eligió aceptación manual contra el backend real.** Guion en `docs/ACEPTACION-MVP.md`; no se registra como aprobada.
- No se crearon cuentas, empresas ni registros en backend durante la ejecución.
- No se realizaron commits ni publicación/despliegue. CI y nginx preparados, sujetos a ejecución/configuración en el destino.
- Memoria de iteraciones: `docs/iterations/FE-00-estabilizacion.md` a `FE-07-validacion-mvp.md`.
- Alcance y límites en `docs/MVP-ALCANCE.md`: administración global completa y funciones sin contrato quedan fuera de esta entrega.

### Siguiente paso operativo

Formato verificado con Prettier y `git diff --check` sin errores. Captura móvil del dashboard revisada visualmente.

Ejecutar `npm start`, iniciar sesión con cuentas reales de prueba y completar el guion de aceptación. Registrar cualquier diferencia del contrato/entorno antes de dar por aprobado el MVP para presentación.

## 2026-10-19 - Corrección del acceso (FE-08)

- Síntoma: el formulario de login rechazaba las cuatro cuentas de prueba (`admin@`, `secretaria@`, `socio@`, `conductor@kentrukers.test`) pese a que el backend las autenticaba correctamente.
- Causa: `proxy.conf.json` no estaba declarado en `angular.json`. El servidor de desarrollo se había arrancado como `ng serve` sin `--proxy-config`, de modo que `/api/**` devolvía el `index.html` de la SPA en lugar de JSON y el `forkJoin` de `Session.login` fallaba. Las E2E seguían aprobadas porque interceptan HTTP con fixtures y no ejercitan el proxy real.
- Corrección (solo frontend): `architect.serve.options.proxyConfig` en `angular.json`, script `start` simplificado a `ng serve` y nota en `README.md`. `proxy.conf.json` sin cambios y backend sin cambios.
- Evidencia: el proxy de `localhost:4200` responde JSON con HTTP Basic para las cuatro cuentas (`/api/platform/user-roles` devuelve `403` esperado para los usuarios empresariales); login real en navegador con las cuatro identidades llega a `/inicio` y una contraseña incorrecta muestra el mensaje de credenciales. `npm run build` (280.50 kB), `npm run test:ci` 7/7 y `npm run test:e2e` 20/20 aprobados.
- Detalle: `docs/iterations/FE-08-proxy-desarrollo-login.md`.
- Al no modificarse el backend, no se genera registro en `ManagerTruck-Back/docs/iterations/`.
