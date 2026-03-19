require('dotenv').config();
const express = require('express');
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

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/maquinas', maquinasRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/mantenimientos', mantenimientosRoutes);
app.use('/api/repuestos', repuestosRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startKeepAlive();
});
