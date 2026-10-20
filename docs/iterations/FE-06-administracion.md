# FE-06 · Administración e inicio

Dashboard con totales `totalElements` de endpoints paginados y accesos rápidos por permisos; sin cifras simuladas.

Administración:

- Listar empresas para SUPER_ADMIN y abrir contexto explícito.
- Listar miembros paginados de la empresa activa.
- Incorporar por correo de una cuenta existente.
- Activar/desactivar membresía.
- Asignar SECRETARY/PARTNER/DRIVER a miembros activos.

Asignación de roles es aditiva, como implementa `AssignCompanyUserRolesUseCase`; no hay interfaz de revocación inexistente. No se asigna SUPER_ADMIN desde UI. Modificar la propia membresía/roles cierra la sesión para recargar permisos.

E2E verifica SUPER_ADMIN sin membresía y asignación de rol empresarial. No se implementa alta global de empresas/cuentas en este MVP.
