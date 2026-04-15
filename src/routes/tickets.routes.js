const { Router } = require('express');
const { verificarToken } = require('../middlewares/auth.middleware');
const { crearTicket } = require('../controllers/tickets.controller');

const router = Router();

router.use(verificarToken);

router.post('/', crearTicket);

module.exports = router;
