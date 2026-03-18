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

### ~~6. Sin timeout en llamadas fetch~~ ✅ CORREGIDO
- **Archivo:** `frontend/services/api.ts`
- **Fix:** Wrapper `fetchWithTimeout` con `AbortController` y timeout de 15 segundos en todas las llamadas. Mensaje de error claro al usuario si se agota el tiempo.

### ~~7. Errores de subida de imagen silenciosos~~ ✅ CORREGIDO
- **Archivos:** `frontend/app/(tabs)/index.tsx`, `mantenimientos.tsx`, `repuestos.tsx`, `maquina/[id].tsx`, `mantenimiento/[id].tsx`, `repuesto/[id].tsx`
- **Fix:** Si `uploadImage()` falla, se muestra toast de error y se detiene el envío del formulario (throw). El modal permanece abierto con los datos del usuario para reintentar.

### ~~8. Componentes `<Image>` sin manejo de error~~ ✅ CORREGIDO
- **Archivos:** `LinkedItemCard.tsx`, `MaquinaCard.tsx`, `maquina/[id].tsx`, `mantenimiento/[id].tsx`, `repuesto/[id].tsx`
- **Fix:** `onError` handler en todos los `<Image>`. Cuando la URL falla, se muestra el fallback icon/placeholder en lugar de un espacio vacío.

### ~~9. Font loading sin manejo de error~~ ✅ CORREGIDO
- **Archivo:** `frontend/app/_layout.tsx`
- **Fix:** Se captura `fontError` del hook `useFonts()`. Si las fuentes fallan, la app renderiza con fuentes del sistema en lugar de quedarse en splash screen infinito.

### ~~10. Update endpoints aceptan cualquier campo~~ ✅ CORREGIDO
- **Archivos:** `backend/src/controllers/mantenimientos.js`, `repuestos.js`
- **Fix:** Destructuring explícito de solo campos editables en ambos endpoints de update, igual que `maquinas.js`. Campos como `id`, `created_at`, `maquina_id`, `mantenimiento_id` ya no se pueden modificar vía update.

---

## Bugs Medios

### ~~11. Comparación de fechas con posible error de timezone~~ ✅ CORREGIDO
- **Archivo:** `frontend/app/(tabs)/mantenimientos.tsx`
- **Fix:** Se compara directamente la parte de fecha del string ISO (`slice(0, 10)`) en vez de crear objetos `Date` que convierten a timezone local. Elimina el desfase UTC vs local.

### ~~12. Todos los errores HTTP devuelven 500~~ ✅ CORREGIDO
- **Archivos:** `backend/src/utils/httpError.js` (nuevo), todos los controllers
- **Fix:** Helper `getHttpStatus()` mapea códigos Supabase/PostgreSQL a HTTP: `PGRST116`→404, `22P02`→400, `23503`→409, `23505`→409, `23502`→400. Todos los `res.status(500)` reemplazados por `res.status(getHttpStatus(error))`.

### ~~13. Sin accesibilidad (a11y)~~ ✅ CORREGIDO
- **Archivos:** Todos los componentes y pantallas del frontend
- **Fix:** `accessibilityRole="button"` y `accessibilityLabel` en todos los `Pressable` de solo icono: back, edit, delete, close, add (FAB), preview close, confirm dialog actions. Cards (`MaquinaCard`, `LinkedItemCard`) con labels descriptivos.

---

## Notas adicionales

- **Código duplicado:** `tipoConfig` y `estadoConfig` están definidos independientemente en múltiples archivos. Considerar extraerlos a un archivo compartido de constantes.
- **Métricas:** El módulo de métricas está registrado en el tab navigator pero pendiente de implementar según `CLAUDE.md`.
- **HTTP vs HTTPS:** Android bloquea tráfico HTTP por defecto (cleartext). En producción se necesita HTTPS o configurar `android:usesCleartextTraffic` (no recomendado).
