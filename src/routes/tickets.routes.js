const { Router } = require('express');
const { verificarToken, soloAgente } = require('../middlewares/auth.middleware');
const {
  crearTicket, listarTickets, obtenerTicket,
  cambiarEstado, asignarAgente, cambiarPrioridad,
} = require('../controllers/tickets.controller');

const router = Router();

router.use(verificarToken);

router.get('/',                    listarTickets);
router.get('/:id',                 obtenerTicket);
router.post('/',                   crearTicket);
router.put('/:id/estado',          soloAgente, cambiarEstado);
router.put('/:id/asignar',         soloAgente, asignarAgente);
router.put('/:id/prioridad',       soloAgente, cambiarPrioridad);

module.exports = router;
