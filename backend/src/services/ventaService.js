// ============================================================================
// ARCHIVO: backend/src/services/ventaService.js
// DESCRIPCIÓN: Servicio de Ventas con manejo de TRANSACCIONES ATÓMICAS (ACID)
// ============================================================================
const db = require('../db');

const ventaService = {
  // Obtener todas las ventas registradas
  obtenerTodas() {
    const stmt = db.prepare(`
      SELECT 
        v.id,
        v.fecha,
        v.cliente,
        v.metodo_pago,
        v.total,
        COUNT(dv.id) AS total_items,
        COALESCE(SUM(dv.cantidad), 0) AS total_unidades
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON dv.venta_id = v.id
      GROUP BY v.id
      ORDER BY v.fecha DESC
    `);
    return stmt.all();
  },

  // Obtener una venta por ID con su lista detallada de productos
  obtenerPorId(id) {
    const venta = db.prepare('SELECT * FROM ventas WHERE id = ?').get(id);
    if (!venta) {
      const err = new Error(`Venta con ID ${id} no encontrada`);
      err.status = 404;
      throw err;
    }

    // Consultar los ítems asociados a la venta
    const items = db.prepare(`
      SELECT 
        dv.id,
        dv.producto_id,
        p.nombre AS producto_nombre,
        c.nombre AS categoria_nombre,
        dv.cantidad,
        dv.precio_unitario,
        dv.subtotal
      FROM detalle_ventas dv
      JOIN productos p ON p.id = dv.producto_id
      JOIN categorias c ON c.id = p.categoria_id
      WHERE dv.venta_id = ?
    `).all(id);

    return {
      ...venta,
      items
    };
  },

  // REGISTRAR VENTA: OPERACIÓN ATÓMICA CON TRANSACCIÓN (BEGIN - COMMIT - ROLLBACK)
  crearVenta({ cliente = 'Consumidor Final', metodo_pago, items }) {
    // 1. Validaciones previas
    const metodosValidos = ['efectivo', 'tarjeta', 'transferencia'];
    if (!metodo_pago || !metodosValidos.includes(metodo_pago.toLowerCase())) {
      const err = new Error(`Método de pago inválido. Permitidos: ${metodosValidos.join(', ')}`);
      err.status = 400;
      throw err;
    }

    if (!Array.isArray(items) || items.length === 0) {
      const err = new Error('La venta debe incluir al menos un producto en items');
      err.status = 400;
      throw err;
    }

    // 2. Definición de la transacción con better-sqlite3
    // db.transaction() inicia un bloque BEGIN TRANSACTION.
    // Si la función retorna con éxito, ejecuta COMMIT.
    // Si se lanza cualquier error (throw err), ejecuta ROLLBACK automático.
    const ejecutarTransaccion = db.transaction((clienteNombre, metodo, listaItems) => {
      // Paso A: Insertar la cabecera de la venta con total inicial 0
      const insertVenta = db.prepare(`
        INSERT INTO ventas (cliente, metodo_pago, total)
        VALUES (?, ?, 0)
      `);
      const infoVenta = insertVenta.run(clienteNombre.trim() || 'Consumidor Final', metodo.toLowerCase());
      const ventaId = infoVenta.lastInsertRowid;

      let totalVenta = 0;

      // Sentencias preparadas para el bucle
      const stmtProducto = db.prepare('SELECT id, nombre, precio, stock, activo FROM productos WHERE id = ?');
      const stmtInsertDetalle = db.prepare(`
        INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `);
      const stmtDescontarStock = db.prepare(`
        UPDATE productos 
        SET stock = stock - ? 
        WHERE id = ?
      `);

      // Paso B: Procesar cada producto de la lista
      for (const item of listaItems) {
        const prodId = Number(item.producto_id);
        const cant = Number(item.cantidad);

        if (!prodId || isNaN(prodId)) {
          const err = new Error('Cada ítem debe tener un producto_id válido');
          err.status = 400;
          throw err;
        }

        if (isNaN(cant) || cant <= 0 || !Number.isInteger(cant)) {
          const err = new Error(`Cantidad inválida para el producto ID ${prodId}. Debe ser entero mayor a 0`);
          err.status = 400;
          throw err;
        }

        const producto = stmtProducto.get(prodId);
        if (!producto || producto.activo !== 1) {
          const err = new Error(`El producto ID ${prodId} no existe o no está activo para la venta`);
          err.status = 404;
          throw err;
        }

        // Regla de Negocio Crítica: Verificación de Stock Disponible
        if (producto.stock < cant) {
          // Lanza conflicto de negocio (409) -> Esto dispara el ROLLBACK automático
          const err = new Error(`Stock insuficiente para "${producto.nombre}". Solicitado: ${cant}, Disponible: ${producto.stock}`);
          err.status = 409;
          throw err;
        }

        const subtotal = Number((producto.precio * cant).toFixed(2));
        totalVenta += subtotal;

        // B.1 Insertar línea de detalle
        stmtInsertDetalle.run(ventaId, prodId, cant, producto.precio, subtotal);

        // B.2 Descontar stock en la tabla productos
        stmtDescontarStock.run(cant, prodId);
      }

      // Paso C: Actualizar el total definitivo en la venta cabecera
      totalVenta = Number(totalVenta.toFixed(2));
      db.prepare('UPDATE ventas SET total = ? WHERE id = ?').run(totalVenta, ventaId);

      return ventaId;
    });

    // Ejecutar la transacción
    const nuevaVentaId = ejecutarTransaccion(cliente, metodo_pago, items);

    // Retornar la venta completa con sus detalles recién creados
    return this.obtenerPorId(nuevaVentaId);
  }
};

module.exports = ventaService;
