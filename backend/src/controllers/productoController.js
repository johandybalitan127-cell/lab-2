// ============================================================================
// ARCHIVO: backend/src/controllers/productoController.js
// DESCRIPCIÓN: Controlador para el CRUD de Productos
// ============================================================================
const productoService = require('../services/productoService');

const productoController = {
  // GET /api/productos
  obtenerTodos(req, res, next) {
    try {
      const { categoria_id, buscar, solo_activos } = req.query;
      const productos = productoService.obtenerTodos({
        categoriaId: categoria_id,
        buscar,
        soloActivos: solo_activos
      });
      res.status(200).json(productos);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/productos/:id
  obtenerPorId(req, res, next) {
    try {
      const { id } = req.params;
      const producto = productoService.obtenerPorId(id);
      if (!producto) {
        return res.status(404).json({ error: `Producto con ID ${id} no encontrado` });
      }
      res.status(200).json(producto);
    } catch (err) {
      next(err);
    }
  },

  // POST /api/productos
  crear(req, res, next) {
    try {
      const nuevoProducto = productoService.crear(req.body);
      res.status(201).json(nuevoProducto);
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/productos/:id
  actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const productoActualizado = productoService.actualizar(id, req.body);
      res.status(200).json(productoActualizado);
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/productos/:id
  eliminar(req, res, next) {
    try {
      const { id } = req.params;
      const resultado = productoService.eliminar(id);
      res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = productoController;
