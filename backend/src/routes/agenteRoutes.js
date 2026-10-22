// ============================================================================
// ARCHIVO: backend/src/routes/agenteRoutes.js
// DESCRIPCIÓN: Simulador/Proxy de Agente IA con contrato { ok, data, error }
// ============================================================================
const express = require('express');
const router = express.Router();
const resumenService = require('../services/resumenService');

router.post('/', (req, res) => {
  const { consulta, contexto } = req.body;

  // Validación de contrato
  if (!consulta || typeof consulta !== 'string' || consulta.trim() === '') {
    return res.status(400).json({
      ok: false,
      data: null,
      error: 'La consulta es obligatoria y debe ser un texto válido.'
    });
  }

  // Obtenemos los datos frescos de la cafetería
  const metricas = resumenService.obtenerMetricas();
  const criticos = metricas.productos_criticos;
  const top = metricas.top_productos;

  let respuestaGenerada = '';

  const q = consulta.toLowerCase();
  if (q.includes('compra') || q.includes('reabastecimiento') || q.includes('stock')) {
    if (criticos.length === 0) {
      respuestaGenerada = `📋 **INFORME DE REABASTECIMIENTO:**\n\nActualmente todos los productos cuentan con niveles de stock óptimos. No se requieren órdenes de compra urgentes hoy.`;
    } else {
      const listaSugerida = criticos.map(p => 
        `- **${p.nombre}** (${p.categoria}): Stock actual = ${p.stock} unid. (Mínimo: ${p.stock_minimo}).\n  👉 *Recomendación:* Pedir lote de **${(p.stock_minimo * 3) - p.stock} unidades** para asegurar 10 días de operación.`
      ).join('\n\n');

      respuestaGenerada = `📋 **PLAN DE REABASTECIMIENTO PRIORITARIO:**\n\nSe detectaron ${criticos.length} productos en estado crítico de inventario:\n\n${listaSugerida}\n\n💡 *Consejo logístico:* Contactar primero al proveedor de repostería fresca para hornear temprano.`;
    }
  } else if (q.includes('promo') || q.includes('combo') || q.includes('ventas')) {
    const prodEstrella = top[0]?.nombre || 'Café Americano';
    respuestaGenerada = `🏷️ **PROPUESTA DE COMBOS Y PROMOCIONES DEL DÍA:**\n\n` +
      `1. **Combo Despertar Tech (15% OFF):**\n` +
      `   Combina nuestro producto estrella (*${prodEstrella}*) con un *Croissant de Mantequilla* recién horneado.\n` +
      `   *Objetivo:* Impulsar la venta matutina y rotar la repostería.\n\n` +
      `2. **Combo Tarde Dulce ($6.50 Especial):**\n` +
      `   *Latte Vainilla 12oz* + *Cheesecake de Frutos Rojos*.\n` +
      `   *Objetivo:* Incrementar el ticket promedio por encima de los $6.00.`;
  } else {
    respuestaGenerada = `☕ **ASISTENTE DE CAFETERÍA 'AROMA & CÓDIGO':**\n\n` +
      `He procesado tu consulta: "${consulta}".\n` +
      `- Pedidos procesados en el sistema: **${metricas.resumen.total_pedidos}**\n` +
      `- Ingresos totales facturados: **$${metricas.resumen.ingresos_totales.toFixed(2)}**\n` +
      `- Productos con stock crítico: **${metricas.resumen.productos_stock_critico}**\n\n` +
      `¿Deseas que genere una orden de compra detallada o una promoción para aumentar ventas?`;
  }

  // Estructura oficial del laboratorio
  return res.status(200).json({
    ok: true,
    data: {
      mensaje: respuestaGenerada,
      timestamp: new Date().toISOString(),
      motor: 'Agente IA (Simulador / n8n Webhook Endpoint)'
    },
    error: null
  });
});

module.exports = router;
