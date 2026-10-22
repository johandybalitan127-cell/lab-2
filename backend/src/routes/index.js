const express = require('express');
const router = express.Router();

const productoRoutes = require('./productoRoutes');
const ventaRoutes = require('./ventaRoutes');
const categoriaRoutes = require('./categoriaRoutes');
const resumenRoutes = require('./resumenRoutes');
const agenteRoutes = require('./agenteRoutes');

router.use('/productos', productoRoutes);
router.use('/ventas', ventaRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/resumen', resumenRoutes);
router.use('/agente-ia', agenteRoutes);

// Ruta base de bienvenida a la API
router.get('/', (req, res) => {
  res.status(200).json({
    mensaje: 'API REST Cafetería "Aroma & Código" activa',
    version: '1.0.0',
    recursos: ['/api/productos', '/api/ventas', '/api/categorias', '/api/resumen']
  });
});

module.exports = router;
