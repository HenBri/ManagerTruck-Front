# FE-07 · Validación y entrega del MVP

Fecha: 2026-10-19.

## Evidencias ejecutadas

| Verificación                                    | Resultado                                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `npm run build`                                 | Aprobado; bundle inicial 280.50 kB, transferencia estimada 77.20 kB                                    |
| `npm run test:ci`                               | 7 pruebas aprobadas en 4 archivos                                                                      |
| `npm run test:e2e`                              | 20 pruebas aprobadas; Chromium escritorio y móvil emulado                                              |
| Axe en E2E                                      | Sin violaciones detectadas en escenarios auditados de login, inicio, camiones, viajes y administración |
| Reflow                                          | Anchos 320, 390, 768, 1024 y 1440 px sin desbordamiento global en inicio                               |
| API local, `GET /api/users/me` sin credenciales | 401 JSON esperado; backend accesible                                                                   |

Los flujos de negocio automatizados incluyen cliente → contrato → carga → contenedor → asignación → viaje PARTNER → completar, además de proveedor y viaje AUXILIARY. Se verifican cuerpos HTTP, controles de permisos, tenant, selección de relaciones y política de transiciones. Los datos y respuestas son fixtures; no equivalen a persistencia real ni prueban las reglas internas del backend.

## Incidencias resueltas durante la iteración

- Desbordamiento de tablas dentro de grid móvil.
- Nombre accesible del logo/menú y acciones de detalle.
- Etiquetas de select mezcladas con opciones: asociación explícita `for/id`.
- Sincronización E2E al cerrar detalle y mostrar simultáneamente éxito/carga.
- Separación de rutas de módulos para ejecutar guard de cambios al cambiar de módulo.
- Selección empresarial cancelada restaura el valor visible del selector.
- Diferenciación entre estado enviado (`status`) y propiedad de respuesta del dominio.

## Entrega

`npm run format:check` aprobado tras formatear código, pruebas y documentación. `git diff --check` sin errores de whitespace. Revisada visualmente la captura móvil del dashboard generada por Playwright.

- Pipeline GitHub Actions con formato, build, unitarias y E2E; archivo preparado, no ejecutado remotamente en esta sesión.
- Ejemplo nginx de proxy y fallback de rutas; no desplegado en un servidor.
- README actualizado; alcance y guion manual documentados.
- Registro de ejecución y archivos FE-00 a FE-07 conservados.

## Pendientes de aceptación

El usuario eligió **validación manual**. Ejecutar `docs/ACEPTACION-MVP.md` con cuentas y dataset reales; anotar los resultados. Pendientes también: aprobación visual, revisión con lector de pantalla, Firefox/Safari reales y despliegue con HTTPS en un destino definido.

Estado final: implementación del alcance MVP y verificaciones automatizadas completadas; aceptación de negocio y despliegue pendientes.
