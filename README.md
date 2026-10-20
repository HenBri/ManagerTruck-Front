# ManagerTruck · Frontend MVP

Aplicación Angular 21.2 para gestión multiempresa de transporte pesado. Sistema visual propio con Atomic Design, Angular CDK, formularios reactivos y rutas con carga diferida.

## Ejecutar localmente

Requisitos: Node.js compatible con Angular 21 (validado con 22.22.2), npm y backend disponible en `http://localhost:8080`.

```bash
npm ci
npm start
```

Abrir `http://localhost:4200`. `proxy.conf.json` redirige `/api/**` al backend local y está declarado en `angular.json` (`architect.serve.options.proxyConfig`), por lo que cualquier `ng serve` (CLI o IDE) lo aplica sin flags adicionales. Un `ng serve` sin ese archivo responde con el `index.html` para `/api/**` y el inicio de sesión falla. Para otro destino, modificar únicamente `target` y reiniciar el servidor de desarrollo.

### Acceso

El backend usa HTTP Basic. Inicia sesión con una cuenta existente y selecciona una empresa. Las credenciales se conservan únicamente en memoria: recargar la página requiere iniciar sesión nuevamente. Cerrar sesión limpia la identidad y el contexto empresarial.

- SECRETARY: gestión operativa y comercial de la empresa autorizada.
- PARTNER: consultas dentro del alcance que devuelve el servidor.
- DRIVER: consulta de operaciones y transiciones de viajes propios permitidas por backend; sin listado de camiones.
- SUPER_ADMIN: abre una empresa desde Administración, incluso sin membresía personal.

La consulta de auditoría `/api/platform/user-roles` permite identificar SUPER_ADMIN; un 403 para usuarios empresariales es esperado. El backend conserva la autorización efectiva de todas las operaciones.

## Módulos

- Inicio, acceso, selección de empresa, perfil y cambio de contraseña.
- Socios, camiones, conductores y asignaciones.
- Clientes, contratos, cargas y contenedores.
- Viajes de socios y de auxilio externo; formulario guiado y transiciones de estado.
- Proveedores de auxilio externo.
- Administración: miembros, incorporación por correo, activación/desactivación y asignación aditiva de roles empresariales.

Los formularios utilizan selectores paginados de relaciones; los listados tienen paginación y filtros compatibles con cada endpoint. Las tablas conservan el desplazamiento horizontal dentro de su contenedor. El menú lateral funciona como drawer en móvil.

## Estructura

```text
src/app/core/       Autenticación, contexto empresarial, HTTP y cambios pendientes
src/app/shared/ui/  Átomos, moléculas, organismos y templates
src/app/features/   Páginas, acceso a datos y reglas específicas de dominio
src/styles/        Tokens visuales
e2e/               Pruebas de navegador con fixtures HTTP
docs/iterations/   Evidencias y decisiones por iteración
```

`features/catalog` contiene el editor/listado compartido para módulos con estructura equivalente, con campos/DTO declarados por dominio. Las políticas específicas de viajes están en `features/journeys`; camiones, perfil y administración tienen implementaciones independientes. Los DTO no incluyen el tenant en las escrituras: se envía en la ruta.

## Verificaciones

```bash
npm run build
npm run test:ci
npx playwright install chromium
npm run test:e2e
npm run format:check
```

- Vitest: sesión, contratos HTTP y reglas de transiciones.
- Playwright: escritorio y móvil Chromium, flujos de flota/cadena comercial/viajes, permisos, administración, cambios sin guardar y reflow de 320 a 1440 px.
- Axe: auditoría automática en pantallas clave; no reemplaza revisión manual con lector de pantalla.
- Reporte E2E: `npx playwright show-report`.

Las pruebas E2E interceptan HTTP con datos sintéticos. No modifican el backend. La aceptación real se realiza siguiendo [el guion manual](docs/ACEPTACION-MVP.md), elegida por el usuario.

## Despliegue

`npm run build` genera `dist/ManagerTruck/browser`. Servir esos archivos estáticos, aplicar fallback de rutas a `index.html` y configurar un reverse proxy `/api/` hacia el backend. Ejemplo en `deploy/nginx.conf.example`; ajustar rutas/host y servir HTTPS en el destino final.

El proxy de Angular solo funciona en desarrollo. No incluir credenciales ni secretos en el bundle. La URL relativa `/api` permite usar el mismo artefacto detrás de distintos proxies.

La configuración CI está en `.github/workflows/frontend.yml`. Publica el artefacto de build después de las verificaciones; el destino de producción debe configurarse aparte.

## Seguimiento

- [Plan inicial](PLAN-FRONTEND.md)
- [Alcance del MVP](docs/MVP-ALCANCE.md)
- [Registro de ejecución](REGISTRO-EJECUCION.md)
- [Guion de presentación y aceptación](docs/ACEPTACION-MVP.md)

Reportes/exportaciones agregadas, recuperación de contraseña, notificaciones, revocación de roles y administración global completa quedan fuera de esta entrega. La API revisada no ofrece todas esas operaciones; no se simulan en producción.
