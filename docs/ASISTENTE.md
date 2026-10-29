# Asistente flotante

El componente `src/app/features/assistant/assistant-chat.ts` se monta desde el shell autenticado. El botón está en la esquina inferior derecha y abre el chat sobre la pantalla actual.

- Cerrar, Nueva conversación, recargar, cambiar de empresa o cerrar sesión elimina los mensajes temporales.
- No hay historial, almacenamiento de chats en el navegador ni recuperación de conversaciones anteriores.
- La entrega es conversación escrita con Groq. No incluye voz de entrada, voz de salida ni administración visual del conocimiento: ese código fue eliminado y las capacidades relacionadas ya no se anuncian.
- Los datos actuales se consultan mediante herramientas autorizadas, no mediante instantáneas de viajes indexadas.
- SECRETARY y SUPER_ADMIN pueden consultar clientes, contratos, cargas y contenedores con las nuevas herramientas comerciales. Las guías del backend se mantienen en 16 archivos Markdown versionados; el contrato HTTP del chat permanece compatible.
- La ayuda de errores conserva solo un código HTTP reciente de la empresa actual. Explica posibilidades, no una causa confirmada.

Configuración del backend, migración, variables de entorno, alcance de herramientas y evaluación: `ManagerTruck-Back/docs/ASISTENTE-RAG.md` y `ManagerTruck-Back/docs/EVALUACION-ASISTENTE.md` en el proyecto hermano.

Groq genera respuestas con `GROQ_API_KEY` en el backend y el modelo `GROQ_MODEL` (por defecto `openai/gpt-oss-120b`). Los embeddings opcionales siguen usando Ollama local; por defecto se utiliza búsqueda léxica. La entrega actual no necesita Python ni Edge-TTS. No deben introducirse claves en Angular. El contexto temporal se valida y no concede permisos; el backend vuelve a resolver empresa y usuario en cada consulta.

El panel consulta `/api/companies/{companyId}/assistant/capabilities` al abrirse. El backend comprueba la clave y el modelo mediante una generación mínima sin datos empresariales (consume cuota, caché de un minuto, espera de 4 s) y devuelve `AVAILABLE`, `UNAVAILABLE`, `UNVERIFIED` o `DISABLED`; deshabilitado no realiza llamadas. Esa comprobación no garantiza cuota para consultas posteriores.

## Verificaciones

```powershell
npm run build
npm run test:ci
npx playwright test e2e/assistant.spec.ts
```

Las pruebas de navegador usan fixtures de API. Verifican posición del botón, apertura, accesibilidad del panel, aviso de proveedor no disponible y reinicio del contexto en escritorio y móvil. Las respuestas reales se verifican después de configurar Groq y PostgreSQL.
