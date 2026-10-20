# Alcance de entrega del MVP frontend

## Objetivo

Demostrar acceso empresarial, gestión de flota/personas, cadena comercial y ejecución de viajes, exclusivamente consumiendo el backend existente. Sin cambios Java, SQL ni creación automática de cuentas/datasets.

## Entregas

1. FE-00: estabilización de la base y accesibilidad.
2. FE-01: autenticación Basic, empresa activa, permisos y SUPER_ADMIN.
3. FE-02: componentes compartidos, relaciones, filtros y protección de cambios.
4. FE-03: socios, camiones, conductores.
5. FE-04: clientes, contratos, cargas, contenedores.
6. FE-05: asignaciones, viajes y auxilio externo.
7. FE-06: administración mínima y dashboard.
8. FE-07: verificaciones, CI, documentación y aceptación manual.

## Reglas de finalización

- Build y pruebas automatizadas aprobados.
- Diferenciar verificación con fixtures de aceptación real.
- Mantener el registro de decisiones e incidencias en cada iteración.
- No llamar «desplegado» al artefacto compilado; requiere destino e infraestructura configurados.
- Validación real/manual: pendiente hasta que el usuario complete el guion con sus cuentas.

## Límites de esta entrega

- Catálogos comparten la estructura de tabla/formulario, con configuración por dominio. Se evita duplicar componentes sin reglas diferenciadas.
- Selectores relacionados paginados; filtros de relaciones por ID cuando así los expone la API. No se simula búsqueda global sobre una sola página.
- Las referencias de tablas/detalles se resuelven por endpoints autorizados. Si no se puede obtener el texto, se conserva el identificador como referencia.
- La sesión no sobrevive una recarga, conforme a la decisión de guardar Basic únicamente en memoria.
- No se incluyen altas globales de empresas/cuentas: el MVP parte de cuentas y empresa preparadas en backend. Sí permite incorporarlas a una empresa por membresía.
- Sin meta declarada de cobertura porcentual, medición de Core Web Vitals productivos ni certificación WCAG completa: requieren evaluaciones adicionales.
