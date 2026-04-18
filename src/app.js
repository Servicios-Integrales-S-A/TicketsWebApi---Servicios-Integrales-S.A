const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const authRoutes       = require('./routes/auth.routes');
const usuariosRoutes   = require('./routes/usuarios.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const reglasRoutes     = require('./routes/reglas.routes');
const ticketsRoutes        = require('./routes/tickets.routes');
const integracionesRoutes  = require('./routes/integraciones.routes');
const swaggerSpec          = require('./config/swagger');

const app = express();

app.use(cors());
app.use(express.json());

// Documentación Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
app.use('/api/auth',       authRoutes);
app.use('/api/usuarios',   usuariosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/reglas',     reglasRoutes);
app.use('/api/tickets',        ticketsRoutes);
app.use('/api/integraciones',  integracionesRoutes);

// Ruta de salud
app.get('/', (req, res) => {
  res.json({ mensaje: 'API Sistema de Tickets - Servicios Integrales S.A.', version: '1.0.0' });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada.' });
});

module.exports = app;
