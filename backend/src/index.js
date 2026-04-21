require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const maquinasRoutes = require('./routes/maquinas');
const uploadRoutes = require('./routes/upload');
const mantenimientosRoutes = require('./routes/mantenimientos');
const repuestosRoutes = require('./routes/repuestos');
const { startKeepAlive } = require('./utils/keepAlive');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes (must come before static files)
app.use('/api/health', healthRoutes);
app.use('/api/maquinas', maquinasRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/mantenimientos', mantenimientosRoutes);
app.use('/api/repuestos', repuestosRoutes);

// Serve frontend web build (from frontend/dist)
const webDir = path.join(__dirname, '../../frontend/dist');
app.use(express.static(webDir));

// All non-API routes → index.html (SPA client-side routing)
app.get('*path', (req, res) => {
  res.sendFile(path.join(webDir, 'index.html'));
});

// Prevent crashes from killing the keep-alive
process.on('unhandledRejection', (err) => {
  console.error('[Process] Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught exception:', err);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startKeepAlive();
});
