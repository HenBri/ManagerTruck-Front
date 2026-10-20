# FE-04 · Cadena comercial

Implementados clientes → contratos → cargas → contenedores mediante formularios y tablas con selectores de relación paginados. Los DTO de edición omiten las relaciones inmutables.

Filtros: clientes por `active`; contratos por `clientId/state`; cargas por `contractId/state`; contenedores por `chargeId/state`. Estados de cliente usan `{ clientState: boolean }`; otros módulos usan `{ status }`.

Los formularios aplican importes con dos decimales y peso con tres. Los estados y restricciones efectivas se verifican también en el servidor; errores de conflicto se presentan sin descartar el formulario.

E2E automatiza la cadena con fixtures de contrato. La validez de estados y referencias contra dataset real se comprueba durante aceptación manual.
