// ============================================================================
// ARCHIVO: frontend/src/pages/VentasPage.jsx
// DESCRIPCIÓN: Historial contable de ventas con detalle ampliado
// ============================================================================
import React, { useState } from 'react';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';

export function VentasPage() {
  const { data: ventas, loading, error, refetch } = useFetch(() => api.getVentas());
  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const verDetalle = async (id) => {
    setCargandoDetalle(true);
    try {
      const data = await api.getVentaPorId(id);
      setVentaDetalle(data);
    } catch (err) {
      alert(err.message || 'Error al obtener el detalle de la venta');
    } finally {
      setCargandoDetalle(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Historial de Ventas</h1>
          <p className="subtitle">Registro contable y auditoría de todas las órdenes procesadas</p>
        </div>
        <button className="btn btn-outline" onClick={refetch}>
          🔄 Actualizar
        </button>
      </div>

      {loading && <LoadingSpinner text="Consultando historial de ventas..." />}
      {error && <Alert type="danger" message={error} onClose={refetch} />}

      {!loading && !error && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Venta #</th>
                <th>Fecha y Hora</th>
                <th>Cliente</th>
                <th>Método de Pago</th>
                <th>Ítems</th>
                <th>Total Facturado</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {(!ventas || ventas.length === 0) ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    No hay ventas registradas todavía.
                  </td>
                </tr>
              ) : (
                ventas.map(v => (
                  <tr key={v.id}>
                    <td><strong>#{v.id}</strong></td>
                    <td>{v.fecha}</td>
                    <td>{v.cliente}</td>
                    <td>
                      <span className="badge" style={{ background: '#f0f0f0' }}>
                        {v.metodo_pago}
                      </span>
                    </td>
                    <td>{v.total_items} productos ({v.total_unidades} unid.)</td>
                    <td><strong style={{ color: 'var(--color-primary)' }}>${v.total.toFixed(2)}</strong></td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => verDetalle(v.id)}
                        disabled={cargandoDetalle}
                      >
                        👁️ Ver Ticket
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para ver el ticket detallado */}
      {ventaDetalle && (
        <div className="modal-overlay" onClick={() => setVentaDetalle(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <h3>🧾 Ticket de Venta #{ventaDetalle.id}</h3>
              <button 
                onClick={() => setVentaDetalle(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >&times;</button>
            </div>

            <div style={{ margin: '1rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              <p>Fecha: <strong>{ventaDetalle.fecha}</strong></p>
              <p>Cliente: <strong>{ventaDetalle.cliente}</strong></p>
              <p>Método de Pago: <strong>{ventaDetalle.metodo_pago}</strong></p>
            </div>

            <h4 style={{ margin: '1rem 0 0.5rem 0' }}>Detalle de Productos:</h4>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>P. Unit</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {ventaDetalle.items.map(item => (
                    <tr key={item.id}>
                      <td><strong>{item.producto_nombre}</strong></td>
                      <td>{item.cantidad}</td>
                      <td>${item.precio_unitario.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}><strong>${item.subtotal.toFixed(2)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '2px solid var(--color-border)', fontSize: '1.2rem' }}>
              <span>Total Pagado:</span>
              <strong style={{ color: 'var(--color-primary)' }}>${ventaDetalle.total.toFixed(2)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn btn-primary" onClick={() => setVentaDetalle(null)}>
                Cerrar Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
