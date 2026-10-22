// ============================================================================
// ARCHIVO: backend/src/controllers/ventaController.js
// DESCRIPCIÓN: Controlador para Ventas (Consultas y Transacciones)
// ============================================================================
const ventaService = require('../services/ventaService');

const ventaController = {
  // GET /api/ventas
  obtenerTodas(req, res, next) {
    try {
      const ventas = ventaService.obtenerTodas();
      res.status(200).json(ventas);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/ventas/:id
  obtenerPorId(req, res, next) {
    try {
      const { id } = req.params;
      const venta = ventaService.obtenerPorId(id);
      res.status(200).json(venta);
    } catch (err) {
      next(err);
    }
  },

  // POST /api/ventas
  crear(req, res, next) {
    try {
      const nuevaVenta = ventaService.crearVenta(req.body);
      res.status(201).json(nuevaVenta);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = ventaController;
