// ============================================================================
// ARCHIVO: backend/src/services/categoriaService.js
// DESCRIPCIÓN: Capa de servicio para operaciones de categorías
// ============================================================================
const db = require('../db');

const categoriaService = {
  obtenerTodas() {
    const stmt = db.prepare(`
      SELECT c.*, COUNT(p.id) AS total_productos
      FROM categorias c
      LEFT JOIN productos p ON p.categoria_id = c.id AND p.activo = 1
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `);
    return stmt.all();
  },

  obtenerPorId(id) {
    const stmt = db.prepare('SELECT * FROM categorias WHERE id = ?');
    return stmt.get(id);
  }
};

module.exports = categoriaService;
