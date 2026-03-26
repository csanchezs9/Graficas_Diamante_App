# Gráficas Diamante App

## Stack
- **Frontend**: Expo + Expo Router + TypeScript + NativeWind (Tailwind CSS for RN)
- **Backend**: Node.js + Express.js (REST API, port 3000)
- **Database**: Supabase (PostgreSQL, free tier)
- **Deploy**: Backend dockerizado en servidor del cliente (nube), DB en Supabase Cloud

## Frontend Design Guidelines
- **Style**: Minimalist, professional, clean. NO Material Design genérico, NO componentes prefabricados.
- **NativeWind** (Tailwind CSS) para todo el styling — control total, sin UI libraries.
- **Paleta**: Oscura/neutra con acentos. Inspiración: Linear, Notion.
- **Tipografía**: Inter (Expo Google Fonts), limpia y legible.
- **Cards**: Bordes sutiles, sombras suaves, mucho espaciado (breathing room).
- **Iconos**: `@expo/vector-icons` (Feather/Lucide style).
- **Animaciones**: Suaves con `react-native-reanimated`.
- **Todo custom** — la app debe verse profesional, no genérica.

## Modules (Bottom Tab Navigation)
1. **Máquinas** — CRUD completo. Campos: nombre, descripcion, codigo, ubicacion, imagen_url, estado, fecha_ultima_inspeccion
2. **Mantenimientos** — CRUD completo. Campos: maquina_id (FK), fecha_realizacion, tecnico_responsable, descripcion, fotos_urls, costo_total, tipo. Asociado a máquinas.
3. **Repuestos** — CRUD completo. Campos: mantenimiento_id (FK), nombre, tipo, cantidad_disponible, costo_unitario, proveedor, fecha, imagen_url (1 imagen). Asociado a mantenimientos.
4. **Métricas** — (por implementar)

## Backend API Endpoints
- `GET /api/maquinas` — listar todas las máquinas
- `POST /api/maquinas` — crear máquina
- `PUT /api/maquinas/:id` — actualizar máquina
- `DELETE /api/maquinas/:id` — eliminar máquina
- `GET /api/mantenimientos` — listar mantenimientos (query: ?maquina_id=)
- `POST /api/mantenimientos` — crear mantenimiento
- `PUT /api/mantenimientos/:id` — actualizar mantenimiento
- `DELETE /api/mantenimientos/:id` — eliminar mantenimiento
- `GET /api/repuestos` — listar repuestos (query: ?mantenimiento_id=)
- `POST /api/repuestos` — crear repuesto
- `PUT /api/repuestos/:id` — actualizar repuesto
- `DELETE /api/repuestos/:id` — eliminar repuesto
- `POST /api/upload` — subir imagen (multipart/form-data, field: "image", query: ?bucket=)
- `GET /api/health` — health check

## Deployment (Docker)
- Backend dockerizado con `Dockerfile` + `docker-compose.yml` en `backend/`
- Imagen base: `node:20-alpine`
- Variables de entorno requeridas: `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Levantar: `docker compose up -d --build`
- El cliente tiene 2 servidores locales + 1 servidor en la nube. Se despliega en el de la nube vía SSH.
- Keep-alive de Supabase sigue activo (ping cada 4h dentro del contenedor)
- Después de desplegar, actualizar la URL del API en el frontend para apuntar a la IP del servidor del cliente

## Project Structure
```
├── frontend/          # Expo app (React Native + NativeWind)
├── backend/           # Express.js API
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .dockerignore
│   └── src/
│       ├── index.js
│       ├── routes/
│       ├── controllers/
│       └── config/supabase.js
└── .gitignore
```
