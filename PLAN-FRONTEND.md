# Plan de desarrollo del frontend — ManagerTruck

## 1. Objetivo y punto de partida

Construir una aplicación administrativa profesional, responsiva y accesible para operar el backend de ManagerTruck, con componentes reutilizables mediante Atomic Design y entregas incrementales verificables.

Base verificada en el repositorio:

- Angular 21.2, TypeScript 5.9, RxJS 7.8 y Vitest 4.
- Proyecto inicial con configuración de compilación y pruebas; rutas aún vacías.
- Presupuestos de producción existentes: bundle inicial de 500 kB de advertencia y 1 MB de error.
- No se encontró documentación del contrato del backend en la raíz ni funcionalidad de integración en las rutas revisadas.

Los módulos de vehículos, conductores, viajes, mantenimiento y reportes de este documento son una propuesta de alcance por el contexto de ManagerTruck. Su existencia, nombres, campos, operaciones y prioridades se deben confirmar contra el backend. No se asumen endpoints ni roles existentes.

## 2. Alcance y prioridades

### P0 — Base y primera entrega operativa

- Sistema visual y componentes base.
- Header, footer, menú lateral colapsable y menú de usuario.
- Inicio de sesión, cierre de sesión y control de acceso conforme al backend.
- Primer módulo de negocio completo: listado, filtros, detalle y operaciones permitidas.
- Estados de carga, vacío, error y acceso denegado.
- Navegación responsiva, accesibilidad y pruebas automatizadas esenciales.

### P1 — Versión funcional completa

- Resto de módulos confirmados y flujos entre entidades.
- Dashboard con indicadores reales y definiciones acordadas.
- Perfil y administración de usuarios/permisos cuando la API los permita.
- Reportes, filtros y exportaciones compatibles con el backend.
- Validación integral y despliegue reproducible.

### P2 — Evolución posterior

- Tema oscuro, preferencias avanzadas y personalización del dashboard.
- Notificaciones persistentes, actualizaciones en tiempo real o mapas únicamente si hay casos de uso y soporte de API.
- Evitar que estas mejoras bloqueen la primera entrega operativa.

## 3. Arquitectura técnica

### Decisiones recomendadas

- Mantener Angular 21.2 y usar componentes standalone, carga diferida por área funcional y detección de cambios OnPush donde corresponda.
- Signals para estado local y derivado; RxJS para peticiones, cancelación, búsqueda y composición asíncrona.
- Reactive Forms tipados para formularios en esta versión de Angular.
- HttpClient, servicios de acceso a datos por dominio e interceptores funcionales.
- Angular Material/CDK compatible con Angular 21 como base de controles e interacciones accesibles, con tema visual propio. No combinar bibliotecas completas de UI.
- CSS con variables de diseño, Grid y Flexbox; enfoque mobile-first.
- Vitest y TestBed para pruebas unitarias/integración; Playwright para E2E; axe para apoyo a la auditoría de accesibilidad.
- Renderizado en cliente para el panel autenticado; rutas protegidas y fallback del servidor a index.html.
- Configuración separada por entorno para URL de API y parámetros públicos. Ningún secreto en el frontend.

### Estructura propuesta

```text
src/app/
  core/
    auth/                 # Sesión, guards y permisos
    http/                 # Interceptores y tratamiento común de errores
    config/               # Configuración de entorno
  shared/
    ui/
      atoms/
      molecules/
      organisms/
      templates/
    models/               # Tipos realmente transversales
    utils/
  features/
    auth/
    dashboard/
    vehicles/             # Ejemplo, sujeto a contrato
      data-access/        # API, DTO y adaptadores
      models/
      ui/                 # Componentes propios del dominio
      pages/              # Páginas de Atomic Design
      vehicles.routes.ts
    ...otros-dominios/
  app.routes.ts
  app.config.ts
src/styles/
  tokens.css
  theme.css
  utilities.css
```

Reglas: shared no depende de features; los componentes visuales reciben datos y emiten eventos; páginas coordinan navegación y casos de uso; servicios encapsulan HTTP. Mantener el estado cerca de su consumidor, sin incorporar un store global hasta que exista una necesidad concreta. Crear componentes con Angular CLI y seguir el estilo de nombres del proyecto.

## 4. Atomic Design aplicado

| Nivel      | Componentes previstos                                                                      | Responsabilidad                        |
| ---------- | ------------------------------------------------------------------------------------------ | -------------------------------------- |
| Átomos     | Botón, icono, avatar, badge, spinner, texto auxiliar                                       | Apariencia y estados básicos           |
| Moléculas  | Campo con etiqueta/error, buscador, breadcrumb, tarjeta KPI, elemento de navegación        | Interacción pequeña y reutilizable     |
| Organismos | Header, sidebar, menú de usuario, barra de filtros, tabla, diálogo de confirmación, footer | Conjunto funcional de interfaz         |
| Templates  | Layout autenticado, layout público, listado, detalle, formulario                           | Estructura y distribución de contenido |
| Páginas    | Login, inicio, listado/detalle/edición de cada dominio                                     | Datos reales, permisos y casos de uso  |

No crear wrappers sin valor sobre cada control de la biblioteca. Extraer componentes cuando exista una responsabilidad clara o reutilización real. Las páginas se alojan dentro de features para conservar la cohesión del negocio.

Cada componente compartido documentará variantes, tamaños, estados, uso de teclado y ejemplos. El catálogo visual puede implementarse con Storybook si es compatible con las versiones seleccionadas.

## 5. Diseño visual y estructura profesional

### Sistema visual

- Estética administrativa: superficies neutras, color primario sobrio y acentos semánticos para éxito, advertencia y error.
- Tokens para colores, tipografía, espaciados, bordes, sombras, radios y niveles de superposición.
- Escala de espaciado basada en 4/8 px; jerarquía clara entre título, descripción, contenido y acciones.
- Estados consistentes: normal, hover, foco, activo, deshabilitado, carga y error.
- Mensajes en español, claros y accionables; formato de fechas, moneda, unidades y zona horaria acordado con negocio.
- Estados y alertas expresados mediante texto/iconos además del color.

### Header

- Logo/nombre de ManagerTruck y botón para abrir o contraer el menú lateral.
- Título o contexto de la sección sin duplicación innecesaria en móviles.
- Avatar y menú de usuario con nombre, rol si está disponible, perfil y cerrar sesión.
- Cambio de contraseña y preferencias solo cuando exista soporte funcional.
- Notificaciones únicamente cuando haya fuente de datos real.

### Menú lateral

- Agrupación por áreas de negocio, iconos consistentes y ruta activa visible.
- Opciones filtradas por permisos y grupos desplegables cuando sean necesarios.
- En escritorio: expandido o compacto, con etiquetas accesibles y tooltip en modo compacto.
- En móvil/tablet pequeña: drawer sobrepuesto con backdrop; cierre al navegar, pulsar Escape o tocar fuera.
- Gestión de foco al abrir/cerrar, bloqueo del scroll de fondo en modo modal y restauración del foco al disparador.
- Persistir solo preferencias de interfaz, como el modo compacto.

### Contenido y footer

- Breadcrumb cuando aporte contexto, título, descripción opcional y acción principal.
- Filtros, indicadores y contenido con jerarquía uniforme.
- Footer discreto con nombre del sistema, año y versión; ayuda/contacto si están definidos.
- Footer al final del layout sin superponer formularios ni controles; contenido principal flexible en páginas cortas.
- Páginas 403, 404 y error recuperable con navegación de salida.

## 6. Comportamiento responsivo y accesible

| Ancho orientativo | Comportamiento                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| 320–767 px        | Drawer cerrado inicialmente, contenido a una columna, formularios verticales y acciones prioritarias visibles |
| 768–1023 px       | Drawer o sidebar compacto según espacio, formularios de una/dos columnas                                      |
| Desde 1024 px     | Sidebar expandible, filtros horizontales y distribución amplia                                                |

Los cortes se ajustarán al contenido durante validación. Probar al menos 360, 390, 768, 1024 y 1440 px, además de 320 px para reflow.

- Tablas: conservar campos esenciales; mostrar tarjetas cuando mejoren la lectura. Si el caso requiere una tabla completa, usar scroll horizontal dentro de su contenedor con indicación visible.
- Paginación, orden y filtros en servidor cuando el contrato lo soporte; no descargar colecciones completas para simularlos.
- Diálogos adaptados a pantallas pequeñas y formularios utilizables con teclado virtual.
- Objetivo WCAG 2.2 AA: navegación por teclado, foco visible, etiquetas, mensajes asociados a campos, landmarks y enlace de salto al contenido.
- Contraste mínimo de 4.5:1 para texto normal; controles táctiles con objetivo de 44 × 44 px.
- Validar zoom al 200 %, reducción de movimiento y lectura básica con lector de pantalla.

## 7. Integración con el backend

Antes de implementar cada módulo, completar una matriz con:

| Campo         | Información requerida                                     |
| ------------- | --------------------------------------------------------- |
| Caso de uso   | Actor, objetivo y resultado esperado                      |
| Operación API | Método, ruta, parámetros y DTO reales                     |
| Acceso        | Autenticación, permiso y alcance de los datos             |
| Reglas        | Campos obligatorios, estados, transiciones y validaciones |
| Consultas     | Paginación, búsqueda, orden y filtros disponibles         |
| Respuestas    | Éxito, error, conflicto y estructura de mensajes          |
| Prueba        | Dataset y escenario de aceptación                         |

Definir además:

- Mecanismo de sesión y expiración. Si se usan cookies: credenciales, CORS y CSRF según backend. Si se usan tokens: estrategia de almacenamiento y renovación acordada; preferir renovación mediante cookie HttpOnly si el backend la ofrece.
- Renovación coordinada para evitar solicitudes simultáneas; evitar ciclos de reintento y limpiar el estado al cerrar sesión.
- Permisos aplicados en rutas y acciones. La autorización efectiva corresponde al backend.
- Manejo de 401, 403, 404, 409, validaciones 400/422 según contrato, 429, fallos 5xx y desconexión.
- Cancelar búsquedas obsoletas y evitar dobles envíos. No reintentar automáticamente escrituras que puedan duplicar operaciones.
- Mantener filtros/página en la URL cuando sea útil; advertir cambios sin guardar.
- Separar DTO de API y modelos de presentación cuando sus formas difieran.
- Usar mocks basados en contratos confirmados para desarrollo; exigir pruebas contra API real antes de aceptar la integración.

## 8. Iteraciones y entregables

Duraciones orientativas en días laborables para una persona frontend dedicada, con backend disponible y revisión de negocio oportuna. Ajustar tras la iteración 0. Cada iteración incluye revisión, pruebas y demostración.

### Iteración 0 — Descubrimiento y contrato (2–3 días)

**Trabajo:** revisar Swagger/OpenAPI o código del backend, identificar usuarios y permisos, inventariar entidades y procesos, acordar MVP y preparar datos de prueba.

**Entregables:** matriz pantalla–endpoint–permiso, mapa de navegación, backlog priorizado y registro de dependencias.

**Aceptación/pruebas:** verificar las operaciones críticas contra un entorno disponible y documentar ejemplos reales. Los módulos sin contrato quedan pendientes de integración, con responsable y siguiente acción.

### Iteración 1 — UX y diseño visual (3–4 días)

**Trabajo:** diseñar tokens, wireframes y prototipos de login, shell, listado, detalle y formulario en móvil/escritorio.

**Entregables:** prototipo navegable y especificación de componentes/estados.

**Aceptación/pruebas:** validar con usuarios representativos la navegación y una tarea principal; revisar contraste, jerarquía, densidad y comportamiento responsivo.

### Iteración 2 — Base técnica y sistema de componentes (3–4 días)

**Trabajo:** organizar arquitectura, configurar HTTP/entornos, estilos, Material/CDK, componentes esenciales, lint y pipeline inicial.

**Entregables:** base reutilizable, catálogo inicial y configuración reproducible.

**Aceptación/pruebas:** build de producción correcto, pruebas de comportamiento de campos/controles relevantes y checks de formato/lint. Sin dependencias circulares entre capas.

### Iteración 3 — Shell profesional responsivo (3–4 días)

**Trabajo:** header, footer, sidebar, submenús, menú de usuario, breadcrumbs, layouts y páginas de navegación/error.

**Entregables:** estructura navegable completa en distintos tamaños.

**Aceptación/pruebas:** E2E del drawer, teclado/Escape/restauración de foco, navegación activa, ruta profunda, scroll y persistencia de preferencias. Sin desbordamiento horizontal global.

### Iteración 4 — Autenticación y permisos (3–5 días)

**Trabajo:** login real, sesión, logout, guards y visibilidad de acciones. Recuperación de contraseña/perfil solo si el contrato los contempla.

**Entregables:** acceso integrado y matriz de permisos implementada.

**Aceptación/pruebas:** login válido/inválido, expiración, retorno a ruta interna permitida, acceso directo sin permiso y limpieza de datos de sesión. Probar renovación concurrente si aplica.

### Iteración 5 — Primer módulo vertical y MVP (4–6 días)

**Trabajo:** elegir el módulo de mayor valor confirmado; vehículos es candidato. Implementar listado, filtros, detalle, creación/edición y baja/archivo únicamente según operaciones permitidas.

**Entregables:** primer flujo de negocio conectado de extremo a extremo y patrones reutilizables para los siguientes módulos.

**Aceptación/pruebas:** completar el flujo contra API real; verificar datos persistidos, validaciones, paginación, errores, permisos, dobles envíos y móvil. La baja exige confirmación y manejo de conflictos si existe.

**Hito:** MVP demostrable con shell, autenticación y un módulo completo.

### Iteración 6 — Módulos restantes (4–6 días por módulo)

**Trabajo:** repetir entregas verticales por cada dominio confirmado, respetando dependencias. Candidatos: conductores, viajes/asignaciones y mantenimiento.

**Entregables:** una entrega independiente por módulo; las reglas específicas se implementan explícitamente, sin forzarlas a un CRUD genérico.

**Aceptación/pruebas:** relaciones entre entidades, restricciones y transiciones de estado reales; datos vacíos, errores de referencia, concurrencia/conflictos si el backend los contempla y regresión del MVP.

### Iteración 7 — Dashboard, reportes y administración (4–6 días)

**Trabajo:** implementar indicadores con definición y fuente acordadas, reportes y administración disponibles en la API.

**Entregables:** inicio operativo, visualizaciones accesibles y consultas/exportaciones soportadas.

**Aceptación/pruebas:** contrastar totales con backend, validar fechas/zona horaria, permisos y ausencia de datos. No calcular totales globales a partir de una página parcial. Exportaciones respetan filtros y acceso.

### Iteración 8 — Calidad integral y aceptación (3–5 días)

**Trabajo:** regresión E2E, auditoría de accesibilidad, revisión visual, rendimiento, navegadores y prueba con usuarios.

**Entregables:** informe de resultados, incidencias priorizadas y evidencia de aceptación de flujos críticos.

**Aceptación/pruebas:** todos los flujos críticos aprobados; sin bloqueadores abiertos; comprobar Chrome, Edge, Firefox y Safari/WebKit, más al menos un dispositivo móvil real cuando esté disponible.

### Iteración 9 — Despliegue y cierre (2–3 días)

**Trabajo:** pipeline de release, staging, configuración productiva, fallback de rutas, documentación, observabilidad y procedimiento de rollback.

**Entregables:** versión desplegada, manual breve de usuario, guía técnica y registro de release.

**Aceptación/pruebas:** smoke test de login, consulta y operación principal; recarga de rutas profundas; verificación de API/HTTPS; ensayo de rollback. No registrar credenciales ni datos sensibles en telemetría.

### Dependencias y estimación global

- Secuencia base: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9.
- Los diseños de futuros módulos pueden avanzar mientras se integra el módulo actual si hay capacidad disponible.
- Hasta el MVP: aproximadamente 18–26 días laborables.
- Total: 27–40 días más 4–6 días por módulo adicional de la iteración 6.
- Con tres módulos adicionales: 39–58 días, aproximadamente 8–12 semanas antes de contingencia.
- Reservar 15–20 % para ajustes de contratos, feedback e integración. No incluye desarrollar capacidades nuevas del backend.

## 9. Estrategia de pruebas

| Nivel                | Cobertura prioritaria                                                | Herramienta/ejecución                         |
| -------------------- | -------------------------------------------------------------------- | --------------------------------------------- |
| Unitarias            | Validadores, adaptadores, permisos, estados y reglas de presentación | Vitest; cada cambio                           |
| Componentes          | Formularios, errores, filtros, menú y acciones de usuario            | TestBed y harnesses cuando aplique            |
| Integración HTTP     | Parámetros, DTO, manejo de errores, sesión y cancelación             | HttpTestingController                         |
| Integración de rutas | Guards, redirects, permisos y rutas anidadas                         | RouterTestingHarness                          |
| Contrato             | Compatibilidad de respuestas y errores con API                       | Fixtures de contrato y entorno de integración |
| E2E                  | Login → módulo → operación → persistencia → logout                   | Playwright; cada entrega y release            |
| Visual/responsiva    | Layouts y estados críticos en anchos acordados                       | Capturas de referencia y revisión humana      |
| Accesibilidad        | Semántica, foco, teclado, contraste y lector de pantalla             | axe + pruebas manuales                        |
| Rendimiento          | Bundle, carga diferida, layout estable y tablas extensas             | Build budgets + Lighthouse/DevTools           |
| Aceptación           | Tareas reales por perfil de usuario                                  | Sesión guiada y acta de resultados            |

### Casos transversales obligatorios

1. Mostrar carga sin saltos importantes de layout; distinguir vacío de error.
2. Reintentar una consulta fallida conservando filtros.
3. Bloquear envíos duplicados y recuperar controles después de un error.
4. Mostrar validaciones de servidor junto al campo correspondiente cuando sea posible.
5. Acceder directamente a una URL restringida y recibir el comportamiento correcto.
6. Cerrar sesión y comprobar que no se muestran datos privados en la UI al volver atrás.
7. Usar sidebar y menú de usuario solo con teclado.
8. Completar el flujo principal en móvil, incluyendo formularios y confirmaciones.
9. Comprobar que respuestas antiguas de búsqueda no reemplazan resultados recientes.
10. Recargar una ruta profunda en el entorno desplegado.

Usar datos sintéticos y cuentas de prueba por perfil, con limpieza controlada. Las pruebas no deben depender del orden de ejecución ni de datos productivos.

### Puertas de calidad

- Cada cambio: instalación reproducible, formato/lint una vez configurados, unitarias/integración y build de producción.
- Cada integración: E2E de flujos afectados y smoke contra backend real.
- Cada release: regresión crítica, revisión móvil/accesible y aceptación de negocio.
- Cobertura orientativa de al menos 80 % en lógica crítica, sin convertir el porcentaje en sustituto de pruebas útiles.
- Conservar los presupuestos actuales de build; cualquier aumento debe justificarse y medirse.
- Objetivos de experiencia: LCP ≤ 2.5 s, INP ≤ 200 ms y CLS ≤ 0.1, evaluados con condiciones documentadas. En staging usar medición de laboratorio; confirmar percentil 75 en producción cuando exista muestra suficiente.

Comandos existentes: `npm run build` y `npm test -- --watch=false`. Los comandos de lint, E2E, cobertura y accesibilidad se incorporarán y documentarán al configurar sus herramientas.

## 10. Definición de terminado por funcionalidad

- Criterios de negocio y contrato confirmados.
- UI consistente con el sistema visual y con todas sus variantes relevantes.
- Integración real comprobada; mocks identificados como tales en desarrollo.
- Permisos, validaciones y estados de carga/vacío/error resueltos.
- Comportamiento móvil y teclado validado.
- Pruebas relevantes y build aprobados.
- Revisión de código y demostración aceptadas.
- Documentación actualizada y sin incidencias bloqueantes.

Una tarea inicia con endpoint, reglas, permisos, datos de prueba y criterios de aceptación definidos. Si falta una dependencia, registrar su responsable y separar el avance visual de la aceptación de integración.

## 11. Riesgos y decisiones pendientes

| Riesgo/dependencia                                         | Acción prevista                                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Contrato del backend aún no disponible en este repositorio | Obtener OpenAPI, colección de API o ubicación del código durante iteración 0         |
| Roles o reglas ambiguas                                    | Acordar matriz de permisos y transiciones antes del módulo                           |
| Cambios de API                                             | Versionar contrato y adaptar en data-access                                          |
| Colecciones voluminosas                                    | Confirmar paginación/filtros de servidor y medir con datos representativos           |
| Alcance creciente                                          | Priorizar P0/P1/P2 y reestimar por módulo                                            |
| Sesión/CORS distintos en producción                        | Probar con dominios reales desde staging                                             |
| Función deseada sin endpoint                               | Registrar dependencia backend; no presentar datos ficticios como funcionalidad final |

Información necesaria para cerrar el backlog: ubicación/documentación del backend, método de autenticación, perfiles y permisos, módulos reales, prioridad de negocio, identidad visual, zona horaria/moneda, entorno de despliegue y fecha objetivo.

## 12. Primera ejecución recomendada

1. Completar el inventario del backend y seleccionar el primer flujo de negocio.
2. Aprobar el prototipo del shell y sus variantes móvil/escritorio.
3. Configurar arquitectura, controles base y validación continua.
4. Entregar shell, autenticación y primer módulo integrado como MVP.
5. Ampliar por módulos con demostración y pruebas en cada iteración.
