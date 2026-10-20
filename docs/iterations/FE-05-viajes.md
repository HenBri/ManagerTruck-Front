# FE-05 · Asignaciones y viajes

- Asignaciones: selección de camión/conductor, período de validez y finalización mediante `/assignments/{id}/end`.
- Viajes: asistente de tres pasos (carga/trayecto, modalidad, revisión).
- PARTNER usa `assignmentId`; AUXILIARY usa proveedor y datos del vehículo/conductor externo. No se envían campos de la modalidad opuesta.
- Política de estado separada en `features/journeys/models/journey-policy.ts`.
- PLANNED → IN_PROGRESS/CANCELLED; IN_PROGRESS → COMPLETED/CANCELLED; terminales sin transiciones.
- DRIVER solo tiene objetivos IN_PROGRESS/COMPLETED en viajes PARTNER; el backend valida que sean propios y la asignación vigente.
- Inicio/fin real del viaje los establece el backend; no se inventan fechas desde el formulario.

Pruebas: unitarias de transición y E2E de creación de viaje propio/externo. La prueba E2E no certifica reglas SQL ni vigencia real de asignaciones.
