// ============================================================================
// ARCHIVO: backend/src/services/productoService.js
// DESCRIPCIÓN: Reglas de negocio y consultas SQL para el recurso Productos
// ============================================================================
const db = require('../db');

const productoService = {
  // Obtener lista con filtros opcionales (búsqueda por texto y categoría)
  obtenerTodos({ categoriaId, buscar, soloActivos = '1' }) {
    let query = `
      SELECT p.*, c.nombre AS categoria_nombre
      FROM productos p
      JOIN categorias c ON c.id = p.categoria_id
      WHERE 1=1
    `;
    const params = [];

    if (soloActivos === '1' || soloActivos === true) {
      query += ` AND p.activo = 1`;
    }

    if (categoriaId) {
      query += ` AND p.categoria_id = ?`;
      params.push(categoriaId);
    }

    if (buscar && buscar.trim() !== '') {
      query += ` AND (p.nombre LIKE ? OR p.descripcion LIKE ?)`;
      params.push(`%${buscar.trim()}%`, `%${buscar.trim()}%`);
    }

    query += ` ORDER BY p.id DESC`;

    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  // Obtener un solo producto por ID con información de categoría
  obtenerPorId(id) {
    const stmt = db.prepare(`
      SELECT p.*, c.nombre AS categoria_nombre, c.descripcion AS categoria_descripcion
      FROM productos p
      JOIN categorias c ON c.id = p.categoria_id
      WHERE p.id = ?
    `);
    return stmt.get(id);
  },

  // Crear producto con validación de reglas de negocio
  crear({ nombre, descripcion, precio, stock, stock_minimo, categoria_id }) {
    // 1. Validaciones de negocio (Servidor)
    if (!nombre || nombre.trim() === '') {
      const err = new Error('El nombre del producto es obligatorio');
      err.status = 400;
      throw err;
    }

    const numPrecio = Number(precio);
    if (isNaN(numPrecio) || numPrecio <= 0) {
      const err = new Error('El precio debe ser un número estrictamente mayor a 0');
      err.status = 400;
      throw err;
    }

    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      const err = new Error('El stock debe ser un número entero mayor o igual a 0');
      err.status = 400;
      throw err;
    }

    const numStockMin = stock_minimo !== undefined ? Number(stock_minimo) : 5;
    if (isNaN(numStockMin) || numStockMin < 0) {
      const err = new Error('El stock mínimo debe ser mayor o igual a 0');
      err.status = 400;
      throw err;
    }

    // Verificar que la categoría exista
    const categoria = db.prepare('SELECT id FROM categorias WHERE id = ?').get(categoria_id);
    if (!categoria) {
      const err = new Error(`La categoría con ID ${categoria_id} no existe`);
      err.status = 404;
      throw err;
    }

    // 2. Inserción con consulta parametrizada
    const stmt = db.prepare(`
      INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, categoria_id, activo)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      nombre.trim(),
      descripcion ? descripcion.trim() : null,
      numPrecio,
      numStock,
      numStockMin,
      categoria_id
    );

    return this.obtenerPorId(result.lastInsertRowid);
  },

  // Actualizar producto existente
  actualizar(id, { nombre, descripcion, precio, stock, stock_minimo, categoria_id, activo }) {
    const productoExistente = this.obtenerPorId(id);
    if (!productoExistente) {
      const err = new Error(`Producto con ID ${id} no encontrado`);
      err.status = 404;
      throw err;
    }

    if (nombre !== undefined && nombre.trim() === '') {
      const err = new Error('El nombre del producto no puede estar vacío');
      err.status = 400;
      throw err;
    }

    if (precio !== undefined && (isNaN(Number(precio)) || Number(precio) <= 0)) {
      const err = new Error('El precio debe ser mayor a 0');
      err.status = 400;
      throw err;
    }

    if (stock !== undefined && (isNaN(Number(stock)) || Number(stock) < 0 || !Number.isInteger(Number(stock)))) {
      const err = new Error('El stock debe ser un entero mayor o igual a 0');
      err.status = 400;
      throw err;
    }

    if (categoria_id !== undefined) {
      const categoria = db.prepare('SELECT id FROM categorias WHERE id = ?').get(categoria_id);
      if (!categoria) {
        const err = new Error(`La categoría con ID ${categoria_id} no existe`);
        err.status = 404;
        throw err;
      }
    }

    const nuevoNombre = nombre !== undefined ? nombre.trim() : productoExistente.nombre;
    const nuevaDesc = descripcion !== undefined ? (descripcion ? descripcion.trim() : null) : productoExistente.descripcion;
    const nuevoPrecio = precio !== undefined ? Number(precio) : productoExistente.precio;
    const nuevoStock = stock !== undefined ? Number(stock) : productoExistente.stock;
    const nuevoStockMin = stock_minimo !== undefined ? Number(stock_minimo) : productoExistente.stock_minimo;
    const nuevaCategoria = categoria_id !== undefined ? categoria_id : productoExistente.categoria_id;
    const nuevoActivo = activo !== undefined ? (activo ? 1 : 0) : productoExistente.activo;

    const stmt = db.prepare(`
      UPDATE productos 
      SET nombre = ?, descripcion = ?, precio = ?, stock = ?, stock_minimo = ?, categoria_id = ?, activo = ?
      WHERE id = ?
    `);

    stmt.run(nuevoNombre, nuevaDesc, nuevoPrecio, nuevoStock, nuevoStockMin, nuevaCategoria, nuevoActivo, id);
    return this.obtenerPorId(id);
  },

  // Eliminar producto respetando integridad referencial
  eliminar(id) {
    const producto = this.obtenerPorId(id);
    if (!producto) {
      const err = new Error(`Producto con ID ${id} no encontrado`);
      err.status = 404;
      throw err;
    }

    // Regla de negocio: Verificar si el producto ya tiene ventas históricas asociadas
    const ventasAsociadas = db.prepare('SELECT COUNT(*) AS total FROM detalle_ventas WHERE producto_id = ?').get(id);

    if (ventasAsociadas.total > 0) {
      // Conflicto de negocio (409): No se puede eliminar físicamente para no corromper la contabilidad histórica.
      // Se aplica borrado lógico desactivando el producto.
      db.prepare('UPDATE productos SET activo = 0 WHERE id = ?').run(id);
      return { 
        mensaje: `El producto tiene ${ventasAsociadas.total} ventas registradas. Se ha desactivado (borrado lógico) para preservar el historial.`,
        desactivado: true 
      };
    }

    // Si no tiene ventas asociadas, se puede eliminar físicamente de forma segura
    db.prepare('DELETE FROM productos WHERE id = ?').run(id);
    return { 
      mensaje: 'Producto eliminado definitivamente del inventario.',
      eliminado: true 
    };
  }
};

module.exports = productoService;
