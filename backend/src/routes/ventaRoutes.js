const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');

router.get('/', ventaController.obtenerTodas);
router.get('/:id', ventaController.obtenerPorId);
router.post('/', ventaController.crear);

module.exports = router;
