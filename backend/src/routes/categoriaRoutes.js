const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

router.get('/', categoriaController.obtenerTodas);
router.get('/:id', categoriaController.obtenerPorId);

module.exports = router;
