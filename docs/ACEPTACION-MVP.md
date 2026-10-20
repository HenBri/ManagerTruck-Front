# Guion manual de aceptación y presentación

El usuario eligió **validación manual** contra la API real. Este documento está pendiente de ejecución; no representa resultados aprobados.

## Preparación

- Iniciar backend en `localhost:8080` y frontend con `npm start`.
- Contar con una empresa ACTIVE y cuentas de prueba SECRETARY, PARTNER y DRIVER vinculadas correctamente. SUPER_ADMIN opcional para probar administración global.
- Acordar moneda, unidad de capacidad/peso y zona horaria de la demostración. La UI no inventa unidades que no figuran en el contrato.
- Usar datos identificables como DEMO; recordar que el frontend persiste operaciones reales y que la API usa bajas por estado.

## Recorrido principal

| Paso | Acción                            | Resultado esperado                                         | Resultado real |
| ---- | --------------------------------- | ---------------------------------------------------------- | -------------- |
| 1    | Login SECRETARY                   | Identidad y empresa correctas                              | Pendiente      |
| 2    | Consultar inicio                  | Totales proceden de API                                    | Pendiente      |
| 3    | Registrar socio activo            | Aparece en listado y selector de propietario               | Pendiente      |
| 4    | Registrar camión                  | Placa única, propietario correcto, estado ACTIVE           | Pendiente      |
| 5    | Registrar conductor               | Datos/licencia correctos; vínculos si corresponde          | Pendiente      |
| 6    | Crear asignación vigente          | Camión y conductor seleccionados; sin conflicto de período | Pendiente      |
| 7    | Crear cliente y contrato          | Relación correcta; aplicar estado requerido por backend    | Pendiente      |
| 8    | Crear carga y contenedor          | Relaciones correctas; estados aptos para el viaje          | Pendiente      |
| 9    | Planificar viaje PARTNER          | Tres pasos; asignación y contenedor correctos              | Pendiente      |
| 10   | Iniciar y completar viaje         | Transiciones válidas; fechas establecidas por servidor     | Pendiente      |
| 11   | Crear proveedor y viaje AUXILIARY | Datos externos guardados sin assignmentId                  | Pendiente      |
| 12   | Consultar detalle nuevamente      | Datos persistidos coinciden                                | Pendiente      |
| 13   | Repetir navegación en móvil       | Drawer, formularios y acciones operables                   | Pendiente      |
| 14   | Logout y volver atrás             | Datos privados no visibles; solicita login                 | Pendiente      |

## Acceso y casos negativos

- PARTNER: consultas limitadas por backend, sin controles de escritura.
- DRIVER: iniciar/completar un viaje propio PARTNER; no cancelar ni operar viajes ajenos.
- Intentar placa duplicada: mostrar conflicto, mantener formulario.
- Intentar relación inválida/inactiva: mensaje del servidor y ninguna confirmación ficticia.
- Cambiar empresa con formulario modificado: cancelar conserva empresa y datos.
- Navegar con cambios sin guardar: confirmar o cancelar funciona.
- Interrumpir API durante consulta: error y reintento.
- Cambiar contraseña: nuevo acceso obligatorio; contraseña anterior rechazada.
- Modificar roles/membresía propia: sesión cerrada para actualizar permisos.

## Administración

- SUPER_ADMIN sin membresías puede abrir una empresa ACTIVE.
- Incorporar correo de cuenta existente, asignar rol COMPANY y comprobar que roles previos se conservan.
- Verificar que la UI nunca ofrece asignar SUPER_ADMIN.

## Presentación desplegada

- Configurar HTTPS y proxy `/api/`; no basta con copiar el proxy de desarrollo.
- Abrir una URL profunda directamente: debe devolver la aplicación y solicitar login al no existir sesión en memoria.
- Probar Chrome/Edge y Firefox/Safari reales según disponibilidad; las pruebas automatizadas entregadas utilizan Chromium.
- Revisión manual de teclado, foco, zoom al 200 % y lector de pantalla.

## Cierre

Registrar fecha, perfil, empresa, pasos, resultado y evidencia sin contraseñas. Cada fallo debe incluir endpoint/estado HTTP visible, captura y pasos de reproducción. Actualizar FE-07 y `REGISTRO-EJECUCION.md` cuando finalice la aceptación.
