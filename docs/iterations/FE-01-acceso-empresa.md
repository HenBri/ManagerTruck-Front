# FE-01 · Acceso y empresa

Implementado: login HTTP Basic con `/api/users/me`, membresías activas y auditoría de roles de plataforma; credencial solo en memoria. Perfil y cambio de contraseña conforme a DTO. Logout limpia contexto. Guards protegen rutas autenticadas.

El selector muestra nombres obtenidos con `GET /api/companies/{id}`. SUPER_ADMIN puede listar y abrir empresas sin inventar una membresía. Los roles empresariales proceden de la membresía activa, no del navegador.

Archivos: `core/auth`, `core/company-context`, `features/auth`, `features/account`, `shared/ui/templates/shell`.

Pruebas: sesión HTTP, permisos por empresa y E2E de acceso, logout, cambio de empresa y SUPER_ADMIN. Resultados consolidados en FE-07.

Limitación contractual: la API no tiene token refresh ni recuperación de contraseña. Una recarga exige autenticación. Aceptación autenticada real: manual, por decisión del usuario.
