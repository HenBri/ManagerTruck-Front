# ManagerTruck · Frontend Truckv3

Aplicación Angular 21.2 para gestión de transporte pesado integrada con el backend local Truckv3. Sistema visual propio con Atomic Design, Angular CDK, formularios reactivos y rutas con carga diferida.

## Ejecutar localmente

Requisitos: Node.js compatible con Angular 21 (validado con 22.22.2), npm y backend disponible en `http://localhost:8080`.

```bash
npm ci
npm start
```

Abrir `http://localhost:4200`. `proxy.conf.json` redirige `/api/**` al backend local y está declarado en `angular.json` (`architect.serve.options.proxyConfig`), por lo que cualquier `ng serve` (CLI o IDE) lo aplica sin flags adicionales. Un `ng serve` sin ese archivo responde con el `index.html` para `/api/**` y el inicio de sesión falla. Para otro destino, modificar únicamente `target` y reiniciar el servidor de desarrollo.

### Acceso

El backend usa HTTP Basic. Inicia sesión con una cuenta existente o usa `/registro`. Las credenciales se conservan únicamente en memoria: recargar la página requiere iniciar sesión nuevamente. Cerrar sesión limpia identidad, permisos y credenciales.

- ADMIN: gestión operativa, usuarios y catálogo de roles.
- SECRETARY: gestión operativa y comercial.
- PARTNER: consultas dentro del alcance que devuelve el servidor.
- DRIVER: consulta de operaciones y transiciones de viajes propios permitidas por backend; sin listado de camiones.

El backend local no devuelve roles en `/api/users/me`. El frontend comprueba capacidades mediante consultas GET mínimas a usuarios, clientes, camiones, viajes y conductores; los 403 esperados no cierran la sesión. La autorización definitiva y el alcance de datos pertenecen al servidor. Véanse las limitaciones en [Migración Truckv3](docs/MIGRACION-TRUCKV3.md).

## Módulos

- Inicio, acceso, registro público, perfil y cambio de contraseña.
- Socios, camiones, conductores y asignaciones.
- Clientes, contratos, cargas y contenedores.
- Fletes de socios o proveedores externos, vinculados a contratos y contenedores.
- Viajes vinculados a fletes; formulario guiado y transiciones de estado.
- Proveedores de auxilio externo.
- Administración: alta administrativa, consulta/edición de usuarios, activación/desactivación y catálogo de roles.

Los formularios utilizan selectores paginados de relaciones; los listados tienen paginación y filtros compatibles con cada endpoint. Las tablas conservan el desplazamiento horizontal dentro de su contenedor. El menú lateral funciona como drawer en móvil.

## Estructura

```text
src/app/core/       Autenticación, selectores de entidades, HTTP y cambios pendientes
src/app/shared/ui/  Átomos, moléculas, organismos y templates
src/app/features/   Páginas, acceso a datos y reglas específicas de dominio
src/styles/        Tokens visuales
e2e/               Pruebas de navegador con fixtures HTTP
docs/iterations/   Evidencias y decisiones por iteración
```

`features/catalog` contiene el editor/listado compartido, con campos de creación/edición declarados por dominio. Las políticas específicas de viajes están en `features/journeys`; camiones, perfil y administración tienen implementaciones independientes. Las rutas son globales `/api/{recurso}`, sin empresa en la URL ni en los payloads.

## Verificaciones

```bash
npm run build
npm run test:ci
npx playwright install chromium
npm run test:e2e
npm run format:check
```

- Vitest: sesión, contratos HTTP y reglas de transiciones.
- Playwright: escritorio y móvil Chromium, flota, cadena comercial con fletes, viajes, permisos, administración, paginación y cambios sin guardar.
- Axe: auditoría automática en pantallas clave; no reemplaza revisión manual con lector de pantalla.
- Reporte E2E: `npx playwright show-report`.

Las pruebas E2E interceptan HTTP con datos sintéticos. No modifican el backend. La aceptación real de Truckv3 y sus dependencias se detalla en [Migración Truckv3](docs/MIGRACION-TRUCKV3.md). Los documentos del MVP multiempresa son históricos.

## Despliegue

`npm run build` genera `dist/ManagerTruck/browser`. Servir esos archivos estáticos, aplicar fallback de rutas a `index.html` y configurar un reverse proxy `/api/` hacia el backend. Ejemplo en `deploy/nginx.conf.example`; ajustar rutas/host y servir HTTPS en el destino final.

El proxy de Angular solo funciona en desarrollo. No incluir credenciales ni secretos en el bundle. La URL relativa `/api` permite usar el mismo artefacto detrás de distintos proxies.

La configuración CI está en `.github/workflows/frontend.yml`. Publica el artefacto de build después de las verificaciones; el destino de producción debe configurarse aparte.

## Seguimiento

- [Migración actual y contrato del backend local](docs/MIGRACION-TRUCKV3.md)

- [Plan inicial](PLAN-FRONTEND.md)
- [Alcance del MVP](docs/MVP-ALCANCE.md)
- [Registro de ejecución](REGISTRO-EJECUCION.md)
- [Guion de presentación y aceptación](docs/ACEPTACION-MVP.md)

Reportes/exportaciones agregadas, recuperación de contraseña, notificaciones, revocación de roles y administración global completa quedan fuera de esta entrega. La API revisada no ofrece todas esas operaciones; no se simulan en producción.
