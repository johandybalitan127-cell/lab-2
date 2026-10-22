// ============================================================================
// ARCHIVO: backend/src/services/resumenService.js
// DESCRIPCIÓN: Consultas analíticas SQL con COUNT, SUM, AVG y GROUP BY
// ============================================================================
const db = require('../db');

const resumenService = {
  obtenerMetricas() {
    // 1. Métricas globales de ventas y pedidos
    const metricasVentas = db.prepare(`
      SELECT 
        COUNT(id) AS total_pedidos,
        ROUND(COALESCE(SUM(total), 0), 2) AS ingresos_totales,
        ROUND(COALESCE(AVG(total), 0), 2) AS ticket_promedio
      FROM ventas
    `).get();

    // 2. Métricas de inventario
    const metricasInventario = db.prepare(`
      SELECT 
        COUNT(id) AS total_productos,
        COALESCE(SUM(CASE WHEN stock <= stock_minimo THEN 1 ELSE 0 END), 0) AS productos_stock_critico,
        COALESCE(SUM(stock), 0) AS unidades_totales_stock
      FROM productos
      WHERE activo = 1
    `).get();

    // 3. Ventas agrupadas por categoría (GROUP BY)
    const ventasPorCategoria = db.prepare(`
      SELECT 
        c.nombre AS categoria,
        COALESCE(SUM(dv.cantidad), 0) AS unidades_vendidas,
        ROUND(COALESCE(SUM(dv.subtotal), 0), 2) AS total_facturado
      FROM categorias c
      LEFT JOIN productos p ON p.categoria_id = c.id
      LEFT JOIN detalle_ventas dv ON dv.producto_id = p.id
      GROUP BY c.id, c.nombre
      ORDER BY total_facturado DESC
    `).all();

    // 4. Top 5 productos más vendidos (GROUP BY + ORDER BY DESC)
    const topProductos = db.prepare(`
      SELECT 
        p.id,
        p.nombre,
        c.nombre AS categoria,
        SUM(dv.cantidad) AS unidades_vendidas,
        ROUND(SUM(dv.subtotal), 2) AS ingresos_generados
      FROM detalle_ventas dv
      JOIN productos p ON p.id = dv.producto_id
      JOIN categorias c ON c.id = p.categoria_id
      GROUP BY p.id, p.nombre, c.nombre
      ORDER BY unidades_vendidas DESC
      LIMIT 5
    `).all();

    // 5. Lista de productos con stock bajo o en alerta (útil para el Agente IA de n8n)
    const productosCriticos = db.prepare(`
      SELECT 
        p.id,
        p.nombre,
        p.stock,
        p.stock_minimo,
        c.nombre AS categoria
      FROM productos p
      JOIN categorias c ON c.id = p.categoria_id
      WHERE p.activo = 1 AND p.stock <= p.stock_minimo
      ORDER BY p.stock ASC
    `).all();

    return {
      resumen: {
        total_pedidos: metricasVentas.total_pedidos,
        ingresos_totales: metricasVentas.ingresos_totales,
        ticket_promedio: metricasVentas.ticket_promedio,
        total_productos: metricasInventario.total_productos,
        productos_stock_critico: metricasInventario.productos_stock_critico,
        unidades_totales_stock: metricasInventario.unidades_totales_stock
      },
      ventas_por_categoria: ventasPorCategoria,
      top_productos: topProductos,
      productos_criticos: productosCriticos
    };
  }
};

module.exports = resumenService;
