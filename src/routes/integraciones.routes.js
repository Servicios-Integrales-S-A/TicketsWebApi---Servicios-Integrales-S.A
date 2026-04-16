const express = require('express');
const router = express.Router();

const { verificarApiKey } = require('../middlewares/apiKey.middleware');
const { ticketDesdeForm } = require('../controllers/integraciones.controller');

// POST /api/integraciones/forms  →  ticket desde Google Forms
router.post('/forms', verificarApiKey, ticketDesdeForm);

module.exports = router;
