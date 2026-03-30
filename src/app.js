const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de salud
app.get('/', (req, res) => {
  res.json({ mensaje: 'API Sistema de Tickets - Servicios Integrales S.A.', version: '1.0.0' });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada.' });
});

module.exports = app;
