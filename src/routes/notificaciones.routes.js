const { Router } = require('express');
const { verificarToken } = require('../middlewares/auth.middleware');
const { listarNotificaciones, contarNoLeidas, leerTodas, leerUna } = require('../controllers/notificaciones.controller');

const router = Router();

router.use(verificarToken);

router.get('/',             listarNotificaciones);
router.get('/no-leidas',    contarNoLeidas);
router.put('/leer-todas',   leerTodas);    // debe ir ANTES de /:id para no colisionar
router.put('/:id/leer',     leerUna);

module.exports = router;
