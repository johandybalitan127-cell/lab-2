// ============================================================================
// ARCHIVO: backend/src/controllers/resumenController.js
// DESCRIPCIÓN: Controlador para el endpoint de métricas e indicadores de negocio
// ============================================================================
const resumenService = require('../services/resumenService');

const resumenController = {
  // GET /api/resumen
  obtenerResumen(req, res, next) {
    try {
      const resumen = resumenService.obtenerMetricas();
      res.status(200).json(resumen);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = resumenController;
