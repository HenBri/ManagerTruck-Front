# FE-00 · Estabilización

Estado: completada para la base existente.

## Trabajo y evidencia

- Corregidos nombres accesibles del logo y menú de usuario sin sustituir su texto visible.
- Corregido desbordamiento de tablas dentro de CSS Grid mediante columnas `minmax(0, 1fr)`.
- Ajustada sincronización de la prueba de cierre del detalle móvil.
- `npm run test:e2e`: **12/12 aprobadas**, escritorio y Pixel 7 emulado, incluyendo axe en login, inicio y camiones.
- Las pruebas usan fixtures HTTP; no certifican persistencia en el backend real.

## Continuación

Selectores de entidades relacionadas, guardado de filtros, contexto SUPER_ADMIN, administración mínima y protección de cambios sin guardar.
