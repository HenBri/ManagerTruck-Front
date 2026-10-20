# FE-02 · Componentes y navegación

- Sistema visual por tokens; Atomic Design: StatusBadge, PageHeading, EntitySelect, EntityLabel, Navigation y Shell.
- Selectores nativos accesibles, con paginación real, etiqueta explícita, carga/error/reintento y opciones no elegibles deshabilitadas.
- Identificadores de relaciones se obtienen de opciones de la empresa activa.
- Resolución de nombres de entidades en tablas/detalles; fallback a ID cuando no se dispone de acceso/datos.
- Filtros y orden de catálogos en query params. Solamente parámetros presentes en los controllers.
- Guards y confirmación al abandonar formularios, cambiar empresa o cerrar sesión. Aviso de recarga/cierre del navegador con cambios pendientes.
- Drawer CDK: foco atrapado, Escape, backdrop y bloqueo de scroll.

Correcciones: nombres accesibles, ancho mínimo de grid, asociación explícita de labels con selects.

Las peticiones de etiquetas se limitan a referencias visibles de la página. A futuro, un endpoint de proyección con nombres permitiría reducir solicitudes, pero esta entrega no modifica backend.
