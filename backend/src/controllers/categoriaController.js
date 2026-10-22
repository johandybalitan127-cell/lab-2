// ============================================================================
// ARCHIVO: backend/src/controllers/categoriaController.js
// DESCRIPCIÓN: Controlador para endpoints de categorías
// ============================================================================
const categoriaService = require('../services/categoriaService');

const categoriaController = {
  obtenerTodas(req, res, next) {
    try {
      const categorias = categoriaService.obtenerTodas();
      res.status(200).json(categorias);
    } catch (err) {
      next(err);
    }
  },

  obtenerPorId(req, res, next) {
    try {
      const { id } = req.params;
      const categoria = categoriaService.obtenerPorId(id);
      if (!categoria) {
        return res.status(404).json({ error: `Categoría con ID ${id} no encontrada` });
      }
      res.status(200).json(categoria);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = categoriaController;
