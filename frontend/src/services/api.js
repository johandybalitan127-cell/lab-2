// ============================================================================
// ARCHIVO: frontend/src/services/api.js
// DESCRIPCIÓN: Cliente HTTP centralizado para interactuar con el backend Express
// ============================================================================

const API_BASE_URL = 'http://localhost:4000/api';

// Función auxiliar para procesar peticiones y extraer errores uniformemente
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      // El servidor siempre responde con { error: "mensaje" }
      const errorMsg = data?.error || `Error ${response.status}: ${response.statusText}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor backend en http://localhost:4000. Verifica que esté iniciado.');
    }
    throw error;
  }
}

export const api = {
  // --- MÉTRICAS (GET /api/resumen) ---
  async getResumen() {
    return request('/resumen');
  },

  // --- CATEGORÍAS (GET /api/categorias) ---
  async getCategorias() {
    return request('/categorias');
  },

  // --- PRODUCTOS (CRUD) ---
  async getProductos({ categoriaId, buscar, soloActivos } = {}) {
    const params = new URLSearchParams();
    if (categoriaId) params.append('categoria_id', categoriaId);
    if (buscar) params.append('buscar', buscar);
    if (soloActivos !== undefined) params.append('solo_activos', soloActivos ? '1' : '0');

    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/productos${query}`);
  },

  async getProductoPorId(id) {
    return request(`/productos/${id}`);
  },

  async crearProducto(producto) {
    return request('/productos', {
      method: 'POST',
      body: JSON.stringify(producto)
    });
  },

  async actualizarProducto(id, producto) {
    return request(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(producto)
    });
  },

  async eliminarProducto(id) {
    return request(`/productos/${id}`, {
      method: 'DELETE'
    });
  },

  // --- VENTAS / POS ---
  async getVentas() {
    return request('/ventas');
  },

  async getVentaPorId(id) {
    return request(`/ventas/${id}`);
  },

  async crearVenta(venta) {
    return request('/ventas', {
      method: 'POST',
      body: JSON.stringify(venta)
    });
  },

  // --- WEBHOOK N8N (FASE 5) ---
  async consultarWebhookIA(webhookUrl, payload) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      // Si n8n responde 404 (webhook no registrado o modo test vs producción)
      if (!response.ok) {
        // Si estábamos probando en n8n (:5678), intentamos automáticamente la otra URL de n8n
        if (webhookUrl.includes(':5678')) {
          const alternateUrl = webhookUrl.includes('webhook-test')
            ? webhookUrl.replace('webhook-test', 'webhook')
            : webhookUrl.replace('/webhook/', '/webhook-test/');

          try {
            const altResponse = await fetch(alternateUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (altResponse.ok) {
              const altData = await altResponse.json();
              return { ...altData, urlUsada: alternateUrl };
            }
          } catch (altErr) {
            // Continuar al fallback
          }

          // Si n8n no está escuchando en ninguna ruta, conectamos con el respaldo local
          const fallbackRes = await fetch('http://localhost:4000/api/agente-ia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const fallbackData = await fallbackRes.json();
          return {
            ...fallbackData,
            aviso: 'n8n no tenía el webhook activo en este momento. Se utilizó el endpoint local para responder de inmediato.'
          };
        }

        return {
          ok: false,
          data: null,
          error: data?.error || data?.message || `Error ${response.status} en el webhook`
        };
      }

      return data;
    } catch (err) {
      // Fallback automático si la red falla
      try {
        const fallbackRes = await fetch('http://localhost:4000/api/agente-ia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const fallbackData = await fallbackRes.json();
        return {
          ...fallbackData,
          aviso: 'Conexión con n8n no disponible. Se utilizó el endpoint de respaldo local para responder.'
        };
      } catch (err2) {
        return { ok: false, data: null, error: err.message || 'Error de conexión con el agente' };
      }
    }
  }
};
