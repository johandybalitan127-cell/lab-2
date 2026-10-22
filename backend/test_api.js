// ============================================================================
// ARCHIVO: backend/test_api.js
// DESCRIPCIÓN: Suite de pruebas automatizadas para verificar el Backend
// ============================================================================
const http = require('http');
const app = require('./src/app');
const db = require('./src/db');

const PORT = 3099;
let server;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  server = app.listen(PORT);
  console.log('🧪 INICIANDO PRUEBAS AUTOMATIZADAS DEL BACKEND...\n');

  let passed = 0;
  let failed = 0;

  async function assert(desc, fn) {
    try {
      await fn();
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } catch (e) {
      console.error(`❌ [FAIL] ${desc} -> Error: ${e.message}`);
      failed++;
    }
  }

  // 1. GET /api
  await assert('GET /api responde 200 con mensaje de bienvenida', async () => {
    const res = await request('GET', '/api');
    if (res.status !== 200 || !res.body.mensaje) throw new Error(`Status ${res.status}`);
  });

  // 2. GET /api/productos
  await assert('GET /api/productos retorna lista con categoría asociada', async () => {
    const res = await request('GET', '/api/productos');
    if (res.status !== 200 || !Array.isArray(res.body) || res.body.length === 0) throw new Error('No es arreglo o vacío');
    if (!res.body[0].categoria_nombre) throw new Error('Falta el nombre de la categoría');
  });

  // 3. GET /api/productos/1
  await assert('GET /api/productos/1 retorna detalle del producto', async () => {
    const res = await request('GET', '/api/productos/1');
    if (res.status !== 200 || res.body.id !== 1) throw new Error(`Status ${res.status}`);
  });

  // 4. GET /api/productos/99999 (404 Not Found)
  await assert('GET /api/productos/99999 responde 404 Not Found con formato { error }', async () => {
    const res = await request('GET', '/api/productos/99999');
    if (res.status !== 404 || !res.body.error) throw new Error(`Esperado 404, obtenido ${res.status}`);
  });

  // 5. POST /api/productos con datos válidos (201 Created)
  let nuevoProdId;
  await assert('POST /api/productos crea un nuevo producto (201 Created)', async () => {
    const res = await request('POST', '/api/productos', {
      nombre: 'Mochaccino Especial',
      descripcion: 'Café con chocolate amargo y crema',
      precio: 4.80,
      stock: 20,
      stock_minimo: 5,
      categoria_id: 1
    });
    if (res.status !== 201 || !res.body.id) throw new Error(`Esperado 201, obtenido ${res.status}`);
    nuevoProdId = res.body.id;
  });

  // 6. POST /api/productos con datos inválidos (400 Bad Request)
  await assert('POST /api/productos con precio negativo responde 400 Bad Request', async () => {
    const res = await request('POST', '/api/productos', {
      nombre: 'Café Inválido',
      precio: -5.00,
      stock: 10,
      categoria_id: 1
    });
    if (res.status !== 400 || !res.body.error) throw new Error(`Esperado 400, obtenido ${res.status}`);
  });

  // 7. GET /api/resumen (Métricas SQL)
  await assert('GET /api/resumen retorna métricas calculadas con SQL', async () => {
    const res = await request('GET', '/api/resumen');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (typeof res.body.resumen.total_pedidos !== 'number') throw new Error('Falta total_pedidos');
    if (!Array.isArray(res.body.ventas_por_categoria)) throw new Error('Falta ventas_por_categoria');
    if (!Array.isArray(res.body.top_productos)) throw new Error('Falta top_productos');
    if (!Array.isArray(res.body.productos_criticos)) throw new Error('Falta productos_criticos');
  });

  // 8. POST /api/ventas TRANSACCIÓN EXITOSA (201 Created y descuenta stock)
  await assert('POST /api/ventas registra venta atómica y descuenta stock', async () => {
    const prodAntes = db.prepare('SELECT stock FROM productos WHERE id = ?').get(nuevoProdId);
    const stockInicial = prodAntes.stock;

    const res = await request('POST', '/api/ventas', {
      cliente: 'Mariana López',
      metodo_pago: 'tarjeta',
      items: [
        { producto_id: nuevoProdId, cantidad: 2 }
      ]
    });

    if (res.status !== 201 || !res.body.id) throw new Error(`Esperado 201, obtenido ${res.status}`);
    if (res.body.items.length !== 1) throw new Error('Detalle de items incompleto');

    // Comprobar que el stock en la base de datos se descontó exactamente en 2 unidades
    const prodDespues = db.prepare('SELECT stock FROM productos WHERE id = ?').get(nuevoProdId);
    if (prodDespues.stock !== stockInicial - 2) {
      throw new Error(`El stock no se redujo correctamente. Antes: ${stockInicial}, Después: ${prodDespues.stock}`);
    }
  });

  // 9. POST /api/ventas TRANSACCIÓN FALLIDA (409 Conflict y ROLLBACK verificado)
  await assert('POST /api/ventas con stock insuficiente responde 409 Conflict y hace ROLLBACK total', async () => {
    const ventasAntes = db.prepare('SELECT COUNT(*) as count FROM ventas').get().count;
    const prodAntes = db.prepare('SELECT stock FROM productos WHERE id = ?').get(nuevoProdId);

    // Intentamos pedir 9999 unidades (mucho más de las 18 disponibles)
    const res = await request('POST', '/api/ventas', {
      cliente: 'Comprador Masivo',
      metodo_pago: 'efectivo',
      items: [
        { producto_id: nuevoProdId, cantidad: 9999 }
      ]
    });

    if (res.status !== 409 || !res.body.error) {
      throw new Error(`Esperado 409 Conflict, obtenido status ${res.status}`);
    }

    // Comprobar que NO se creó ninguna venta huérfana (ROLLBACK atómico)
    const ventasDespues = db.prepare('SELECT COUNT(*) as count FROM ventas').get().count;
    if (ventasDespues !== ventasAntes) {
      throw new Error('La transacción falló pero creó una fila en ventas (No hubo ROLLBACK)');
    }

    // Comprobar que el stock quedó intacto
    const prodDespues = db.prepare('SELECT stock FROM productos WHERE id = ?').get(nuevoProdId);
    if (prodDespues.stock !== prodAntes.stock) {
      throw new Error('El stock fue alterado a pesar de la falla');
    }
  });

  // 10. DELETE /api/productos/:id con regla de ventas asociadas
  await assert('DELETE /api/productos con ventas previas aplica borrado lógico para proteger histórico', async () => {
    const res = await request('DELETE', `/api/productos/${nuevoProdId}`);
    if (res.status !== 200 || !res.body.desactivado) {
      throw new Error(`Esperado status 200 con desactivado: true, obtenido ${res.status}`);
    }
    const prod = db.prepare('SELECT activo FROM productos WHERE id = ?').get(nuevoProdId);
    if (prod.activo !== 0) throw new Error('El producto no quedó con activo = 0');
  });

  console.log('\n====================================================');
  console.log(`🏁 RESULTADOS: ${passed} pasadas, ${failed} fallidas.`);
  console.log('====================================================');

  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Error en ejecución de tests:', err);
  if (server) server.close();
  process.exit(1);
});
