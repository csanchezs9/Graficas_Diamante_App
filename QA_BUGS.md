# QA Report — Gráficas Diamante App

**Fecha:** 2026-03-17
**Revisado por:** Claude (QA automatizado)
**Estado:** Pendiente de corrección

---

## Resumen

| Severidad | Cantidad |
|-----------|----------|
| Crítico   | 5        |
| Alto      | 5        |
| Medio     | 3        |
| **Total** | **13**   |

---

## Bugs Críticos

### ~~1. IP hardcodeada en API service~~ ✅ CORREGIDO
- **Archivo:** `frontend/services/api.ts:5`
- **Fix:** Se usa `EXPO_PUBLIC_API_URL` desde `frontend/.env`. Fallback a `localhost:3000`.

### ~~2. Upload sin validación de archivos~~ ✅ CORREGIDO
- **Archivo:** `backend/src/routes/upload.js`
- **Fix:** Whitelist de MIME types (JPEG, PNG, WebP), límite 5MB, whitelist de buckets (`maquinas`, `mantenimientos`, `repuestos`). Errores descriptivos en español.

### ~~3. Borrar máquina no verifica mantenimientos hijos~~ ✅ CORREGIDO
- **Archivo:** `backend/src/controllers/maquinas.js:40`
- **Fix:** Verifica si hay mantenimientos asociados antes de borrar. Retorna 409 con mensaje descriptivo que el frontend muestra al usuario.

### ~~4. Borrar mantenimiento no verifica repuestos hijos~~ ✅ CORREGIDO
- **Archivo:** `backend/src/controllers/mantenimientos.js:64`
- **Fix:** Verifica si hay repuestos asociados antes de borrar. Retorna 409 con mensaje descriptivo que el frontend muestra al usuario.

### ~~5. Sin validación de campos requeridos en create~~ ✅ CORREGIDO
- **Archivos:** `backend/src/controllers/maquinas.js`, `mantenimientos.js`, `repuestos.js`
- **Fix:** Validación de campos requeridos antes de insertar. Retorna 400 con lista de campos faltantes.
  - Máquinas: `nombre`, `código`
  - Mantenimientos: `máquina`, `descripción`, `técnico responsable`, `tipo`
  - Repuestos: `mantenimiento`, `nombre`, `tipo`

---

## Bugs Altos

### 6. Sin timeout en llamadas fetch
- **Archivo:** `frontend/services/api.ts` (todos los fetch)
- **Descripción:** Ninguna llamada al API tiene timeout. En redes lentas o si el servidor no responde, la app se queda colgada indefinidamente mostrando el spinner.
- **Impacto:** UX degradada. El usuario no sabe si la app está muerta o cargando.
- **Solución:** Implementar wrapper con `AbortController` y timeout de 10-15 segundos. Mostrar mensaje de error al usuario si se agota el tiempo.

### 7. Errores de subida de imagen silenciosos
- **Archivos:**
  - `frontend/app/(tabs)/index.tsx:79-82`
  - `frontend/app/(tabs)/mantenimientos.tsx:116-123`
  - `frontend/app/(tabs)/repuestos.tsx:69-76`
- **Descripción:** Si `api.uploadImage()` falla, el error se captura pero el formulario se envía de todos modos con `imagen_url: null`. El usuario cree que subió la imagen pero nunca se guardó.
- **Impacto:** Pérdida de datos. El usuario piensa que la imagen se subió.
- **Solución:** Mostrar alert al usuario cuando falla el upload y preguntar si desea continuar sin imagen o reintentar.

### 8. Componentes `<Image>` sin manejo de error
- **Archivos:**
  - `frontend/components/LinkedItemCard.tsx:43-53`
  - `frontend/components/MaquinaCard.tsx:52-62`
  - `frontend/app/maquina/[id].tsx:195-199`
  - `frontend/app/mantenimiento/[id].tsx:301-305`
  - `frontend/app/repuesto/[id].tsx:174-181`
- **Descripción:** Si la URL de una imagen devuelve 404 o es inválida, el componente `<Image>` muestra un espacio en blanco sin feedback visual.
- **Impacto:** UI rota. Espacios vacíos sin explicación.
- **Solución:** Agregar `onError` handler que muestre el fallback icon cuando la imagen falla.

### 9. Font loading sin manejo de error
- **Archivo:** `frontend/app/_layout.tsx:8-21`
- **Descripción:** Si `useFonts()` falla, `fontsLoaded` queda en `false` para siempre y la app se queda en splash screen infinito.
- **Impacto:** App inutilizable si las fuentes no cargan (ej. sin conexión en primer launch).
- **Solución:** Capturar `fontError` del hook y renderizar la app con fuentes del sistema como fallback.

### 10. Update endpoints aceptan cualquier campo
- **Archivos:**
  - `backend/src/controllers/mantenimientos.js:78`
  - `backend/src/controllers/repuestos.js:80`
- **Descripción:** Los endpoints de update usan `const fields = req.body` directamente, permitiendo modificar campos del sistema como `id`, `created_at`, o cambiar foreign keys arbitrariamente.
- **Impacto:** Riesgo de corrupción de datos si se envía un body malformado.
- **Solución:** Hacer destructuring explícito de solo los campos editables, como ya se hace en `maquinas.js:52-65`.

---

## Bugs Medios

### 11. Comparación de fechas con posible error de timezone
- **Archivo:** `frontend/app/(tabs)/mantenimientos.tsx:56-63`
- **Descripción:** El filtro de fecha compara usando `getFullYear()`, `getMonth()`, `getDate()` sobre un `new Date(fecha_realizacion)`. Si el servidor guarda la fecha en UTC y el dispositivo está en UTC-5, una fecha del 1 de enero a las 2am UTC se muestra como 31 de diciembre local.
- **Impacto:** Un mantenimiento podría no aparecer al filtrar por fecha correcta.
- **Solución:** Normalizar las fechas a la misma zona horaria antes de comparar, o comparar solo la parte de fecha del string ISO.

### 12. Todos los errores HTTP devuelven 500
- **Archivos:** Todos los controllers del backend
- **Descripción:** Sin importar el tipo de error (validación, no encontrado, conflicto), todos retornan `status(500)`. Esto hace difícil debuggear y el frontend no puede distinguir entre un error de servidor y un error del usuario.
- **Impacto:** Debugging difícil. Frontend no puede mostrar mensajes apropiados.
- **Solución:** Usar códigos HTTP apropiados: 400 (validación), 404 (no encontrado), 409 (conflicto/dependencias), 500 (error de servidor).

### 13. Sin accesibilidad (a11y)
- **Archivos:** Toda la app frontend
- **Descripción:** Ningún componente `<Pressable>` tiene `accessibilityLabel` o `accessibilityRole`. Los inputs de formulario no tienen labels accesibles. Botones de solo icono (back, edit, delete) no tienen descripción para screen readers.
- **Impacto:** App inutilizable para usuarios con discapacidad visual.
- **Solución:** Agregar `accessibilityLabel` a todos los `Pressable` y `accessibilityRole="button"`. Asociar labels a inputs con `accessibilityLabel`.

---

## Notas adicionales

- **Código duplicado:** `tipoConfig` y `estadoConfig` están definidos independientemente en múltiples archivos. Considerar extraerlos a un archivo compartido de constantes.
- **Métricas:** El módulo de métricas está registrado en el tab navigator pero pendiente de implementar según `CLAUDE.md`.
- **HTTP vs HTTPS:** Android bloquea tráfico HTTP por defecto (cleartext). En producción se necesita HTTPS o configurar `android:usesCleartextTraffic` (no recomendado).
