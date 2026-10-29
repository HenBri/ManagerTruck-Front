# Migración del frontend a Truckv3

Fecha: 2026-10-28.

## Fuente de verdad

Por decisión del usuario, la integración sigue los **controladores, DTO y casos de uso del backend local** en `ManagerTruck-Back/truck/src/main/java/com/manager/truck/truck`, cuando difieren de `docs/frontend-api.md`. No se modificó el backend.

## Implementación

- Rutas globales `/api/{recurso}`; HTTP Basic en memoria.
- Registro público, perfil, contraseña propia y administración de usuarios y definiciones de roles.
- Catálogos actualizados, campos personales y referencias mediante `personId`.
- Flota: pesos, tipo, remolque, seguro e inspección técnica.
- Fletes: contrato/contenedor, transporte de socio o proveedor externo, programación e importe.
- Viajes: `freightId`, asignación opcional, programación, datos auxiliares y entrega. Edición de fletes/viajes solamente en `PENDIENTE`.
- Cambio de estado por entidad, fechas ISO UTC, fechas simples sin conversión de zona, decimales y booleanos JSON.
- Permisos de navegación/rutas/acciones; consultas de relaciones restringidas según capacidades del usuario.
- Listados y selectores paginados; roles no paginados. Filtros exclusivamente aceptados por los controladores.

## Diferencias respecto de frontend-api.md

| Recurso            | Contrato del código local aplicado                                                                                                                                                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Usuarios           | `firstName`, `lastName`, `maternalLastName`, `documentNumber`, `personId`; estado `status: ACTIVE/INACTIVE`                                                                                                                                                                      |
| Clientes           | `clientCi`, `taxId`, `contactPerson`, `contactPhone`; estado `{state: ACTIVE/INACTIVE}`, no booleano                                                                                                                                                                             |
| Contratos          | `contractCode` solo al crear; `contractDate` y `contractAmount` obligatorios; `originLocation`, `destinationLocation`, `expectedStartDate`, `expectedDeliveryDate`, `actualDeliveryDate`, `referenceDocument`, `declaredTotalWeightKg`, `expectedContainerCount`, `observations` |
| Cargas             | `cargoReference`, `goodsDescription`, `hazardousGoods`, `handlingInstructions`; no hay peso/volumen en el DTO local; estados `PENDING/IN_TRANSIT/DELIVERED/CANCELLED`                                                                                                            |
| Contenedores       | `containerWeight`, `grossWeightKg`, `tareWeightKg`, `cargoWeightKg`, `shippingLine`, `customsReference`, `temperatureC`; no existen `payloadCapacityKg` ni `isReefer`; estados `AVAILABLE/LOADED/IN_TRANSIT/DELIVERED`                                                           |
| Socios             | `PERSON/COMPANY`, datos personales; no existen `companyName/taxId` en sus DTO                                                                                                                                                                                                    |
| Conductores        | `driverLicense`, no `licenseNumber`; categoría obligatoria y vencimiento opcional                                                                                                                                                                                                |
| Socios/conductores | `password` opcional en creación: solo se crea cuenta si se proporciona contraseña y no existe cuenta para ese correo. No se inventa un endpoint de personas: `personId` existente se introduce como referencia numérica                                                          |
| Camiones           | `state` y `dateCreate`; actualización no admite cambiar propietario                                                                                                                                                                                                              |
| Fletes             | `state` para cambios; `actualDeparture`, `actualArrival`, `deliveryNotes` admitidos al editar                                                                                                                                                                                    |
| Viajes             | `status` para cambios; admite datos auxiliares y de entrega en creación/edición; fechas de ejecución mostradas desde respuesta del servidor                                                                                                                                      |
| Auxiliares         | `COMPANY/INDEPENDENT`; nombre 150, teléfono 25, correo 255; cambio con `{state}`                                                                                                                                                                                                 |

Todos los cambios de estado usan `{state}`, salvo usuarios y viajes que usan `{status}`. Los campos de las respuestas son `state`, salvo usuarios (`status`). No se envían alias antiguos como `contractState` o `truckState`.

## Dependencias y límites reales del backend

### Identidad y permisos

`UserResponse` no incluye autoridades y no existe endpoint para obtener/asignar los roles de una cuenta. `/roles` es únicamente un catálogo. Para que la aplicación actual pueda operar, el inicio de sesión verifica con GET `page=0&size=1` los accesos a `/users`, `/clients`, `/trucks`, `/journeys` y `/drivers`. Solo un 403 se considera falta de capacidad; 401, 404, errores de red o 5xx impiden establecer una sesión parcial.

La UI deriva el perfil operativo de esos permisos. Para acciones de conductor también exige que el perfil devuelto coincida con `user.personId` y que el detalle de la asignación del viaje tenga ese conductor. Esto **no sustituye una API de autoridades** ni garantiza distinguir roles personalizados o cuentas con perfiles inconsistentes. El backend valida cada escritura. La solución definitiva es que `/users/me` exponga los roles efectivos.

En `SecurityConfig`, DRIVER no puede consultar fletes, a diferencia de la documentación adjunta. El frontend no solicita sus detalles con ese perfil y muestra la referencia numérica.

`GetAllDriversUseCase` y `GetAllPartnersUseCase` buscan los perfiles con `userId`, mientras las entidades se identifican por persona. Si `userId != personId`, el servidor puede no devolver el perfil correcto: debe corregirse en backend; el frontend no asume permisos de conductor cuando no puede verificarlo.

### Estados operativos

`SavePartnerUseCase`, `SaveDriverUseCase` y `SaveAuxiliaryProviderUseCase` crean registros en `ACTIVE`, mientras `SaveTruckUseCase`, `AssignTruckDriverUseCase` y `SaveFreightUseCase` exigen `ACTIVO`. Sus actualizaciones aceptan cadenas `state`. La interfaz ofrece `ACTIVO/INACTIVO` para estos recursos y `ACTIVO/MANTENIMIENTO/INACTIVO` para camiones, alineados con los casos de uso operativos. Un registro recién creado debe activarse explícitamente antes de seleccionarlo para esas operaciones. Se muestran los valores originales de respuesta, sin convertir `ACTIVE` silenciosamente en `ACTIVO`.

### Edición y auxiliares

`UpdateFreightUseCase` ignora referencias nulas: no puede quitar un camión o proveedor existente. Por eso la modalidad de un flete se elige al crearlo y permanece bloqueada al editarlo; sí puede cambiarse el recurso dentro de esa modalidad. Los campos opcionales que el backend ignora al recibir null tampoco se consideran borrados localmente: la UI vuelve a mostrar la respuesta real.

El backend local permite cancelar viajes a conductores asignados, pero la UI aplica el alcance solicitado: únicamente iniciar y completar. Las transiciones terminales no se reabren.

### Funcionalidad multiempresa anterior

El backend no expone empresas, membresías, administración de plataforma ni asistente. Se retiraron sus enlaces, montaje del chat e interceptor de la aplicación activa. Se conservaron los prototipos locales existentes en `features/assistant`, `pages/platform-admin` y sus servicios. `Session` conserva un límite de compatibilidad inactivo (sin empresa ni SUPER_ADMIN) para que ese código pueda compilar sin activar peticiones antiguas. Los E2E del asistente se omiten explícitamente hasta disponer de un contrato compatible; sus pruebas unitarias siguen ejecutándose.

## Verificación

```sh
npm run build
npm run test:ci
npm run test:e2e
npm run format:check
```

Las pruebas HTTP y Playwright usan respuestas sintéticas ajustadas al código local, no constituyen una prueba contra la base de datos real.

Aceptación contra un backend disponible:

1. Acceder con ADMIN, SECRETARY, PARTNER y DRIVER; revisar permisos y alcance de los listados.
2. Registrar socio/conductor, proporcionar contraseña si se necesita cuenta y cambiar su estado a `ACTIVO`.
3. Crear camión y asignación; comprobar pesos y fechas simples.
4. Crear cliente → contrato → carga → contenedor → flete → viaje.
5. Iniciar/completar el viaje como conductor asignado; verificar fechas reales y rechazos de edición.
6. Crear proveedor, activarlo y planificar un flete externo.
7. Verificar duplicados, rechazo de recursos inactivos y un segundo viaje para el mismo flete.
8. Actualizar perfil/contraseña; comprobar nuevo acceso y administración de usuarios/roles.
