# FE-03 · Flota y personas

Socios, camiones y conductores: listado, alta, detalle, edición de escalares y cambio de estado. Selección de propietarios y vínculos existentes. Validaciones de longitud, placa obligatoria, precisión decimal y números no negativos.

Contratos: `/api/companies/{companyId}/partners`, `/trucks`, `/drivers`; estado enviado con `{ status }`. Camiones no pueden cambiar `ownerPartnerId` por edición. Relaciones de conductores/socios no editables respetan DTO de actualización.

MVP evita eliminar registros: las bajas son cambios de estado. DRIVER no dispone de lectura de camiones según SecurityConfig actual.

Pruebas HTTP y E2E: creación, edición, cambio de estado, lectura de PARTNER, cambio de tenant y protección de cambios. Persistencia real: guion manual FE-07.
