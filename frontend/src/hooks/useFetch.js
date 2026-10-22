// ============================================================================
// ARCHIVO: frontend/src/hooks/useFetch.js
// DESCRIPCIÓN: Custom Hook para encapsular peticiones HTTP asíncronas
// ============================================================================
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom Hook para gestionar peticiones HTTP con estados de carga, error y refetch.
 * @param {Function} fetchFn - Función asíncrona que retorna la promesa de datos (ej: () => api.getResumen())
 * @param {Array} deps - Arreglo de dependencias para volver a disparar el fetch
 */
export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    let cancelado = false;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      if (!cancelado) {
        setData(result);
      }
    } catch (err) {
      if (!cancelado) {
        setError(err.message || 'Error al obtener los datos');
      }
    } finally {
      if (!cancelado) {
        setLoading(false);
      }
    }

    return () => {
      cancelado = true;
    };
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
