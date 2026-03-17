# Gráficas Diamante App

## Stack
- **Frontend**: Expo + Expo Router + TypeScript + NativeWind (Tailwind CSS for RN)
- **Backend**: Node.js + Express.js (REST API, port 3000)
- **Database**: Supabase (PostgreSQL, free tier)
- **Deploy**: Backend on Render, DB on Supabase Cloud

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
1. **Máquinas** — CRUD (listar, crear, eliminar). Campos: nombre, descripcion, codigo, ubicacion, imagen_url, estado, fecha_ultima_inspeccion
2. **Mantenimientos** — (por implementar)
3. **Repuestos** — (por implementar)
4. **Métricas** — (por implementar)

## Backend API Endpoints
- `GET /api/maquinas` — listar todas las máquinas
- `POST /api/maquinas` — crear máquina
- `DELETE /api/maquinas/:id` — eliminar máquina
- `POST /api/upload` — subir imagen (multipart/form-data, field: "image")
- `GET /api/health` — health check

## Project Structure
```
├── frontend/          # Expo app (React Native + NativeWind)
├── backend/           # Express.js API
│   └── src/
│       ├── index.js
│       ├── routes/
│       ├── controllers/
│       └── config/supabase.js
└── .gitignore
```
