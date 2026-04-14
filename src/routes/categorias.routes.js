const { Router } = require('express');
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');
const { listarCategorias, obtenerCategoria, crearCategoria, actualizarCategoria, toggleActivo } = require('../controllers/categorias.controller');

const router = Router();

router.use(verificarToken);

router.get('/',                    listarCategorias);
router.get('/:id',                 obtenerCategoria);
router.post('/',                   soloAdmin, crearCategoria);
router.put('/:id',                 soloAdmin, actualizarCategoria);
router.put('/:id/toggle-activo',   soloAdmin, toggleActivo);

module.exports = router;
