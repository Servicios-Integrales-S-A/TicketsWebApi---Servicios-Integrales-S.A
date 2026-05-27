const { Router } = require('express');
const { verificarToken, soloAgente } = require('../middlewares/auth.middleware');
const {
  crearTicket, listarTickets, obtenerTicket,
  cambiarEstado, asignarAgente, cambiarPrioridad, ocultarTicket, actualizarTicket, consultarPublico, crearTicketPublico,
} = require('../controllers/tickets.controller');
const { agregarNota, listarNotas, listarHistorial } = require('../controllers/notas.controller');

const router = Router();

// Rutas públicas — deben declararse ANTES de router.use(verificarToken)
router.get('/consulta/:numero', consultarPublico);
router.post('/publico',         crearTicketPublico);

router.use(verificarToken);

router.get('/',                    listarTickets);
router.get('/:id',                 obtenerTicket);
router.post('/',                   crearTicket);
router.patch('/:id',               soloAgente, actualizarTicket);
router.put('/:id/estado',          soloAgente, cambiarEstado);
router.put('/:id/asignar',         soloAgente, asignarAgente);
router.put('/:id/prioridad',       soloAgente, cambiarPrioridad);
router.put('/:id/ocultar',         ocultarTicket);

// Notas e historial
router.get('/:id/notas',           listarNotas);
router.post('/:id/notas',          agregarNota);
router.get('/:id/historial',       listarHistorial);

module.exports = router;
