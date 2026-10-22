// ============================================================================
// ARCHIVO: frontend/src/pages/PosPage.jsx
// DESCRIPCIÓN: Punto de venta (POS) interactivo para registrar ventas con transacciones
// ============================================================================
import React, { useState } from 'react';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { BadgeStock } from '../components/Badge';

export function PosPage() {
  const { data: productos, loading, error, refetch } = useFetch(() => api.getProductos({ soloActivos: true }));

  // Estados del carrito
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState('Consumidor Final');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [buscar, setBuscar] = useState('');

  // Estados de retroalimentación
  const [procesando, setProcesando] = useState(false);
  const [ticketVenta, setTicketVenta] = useState(null);
  const [errorVenta, setErrorVenta] = useState('');

  // Filtrar productos para el panel izquierdo
  const productosVisibles = (productos || []).filter(p => 
    p.nombre.toLowerCase().includes(buscar.toLowerCase())
  );

  // Agregar al carrito
  const agregarAlCarrito = (producto) => {
    if (producto.stock <= 0) return;

    setCarrito(prev => {
      const existe = prev.find(item => item.producto_id === producto.id);
      if (existe) {
        if (existe.cantidad >= producto.stock) {
          alert(`No puedes agregar más unidades. Stock disponible: ${producto.stock}`);
          return prev;
        }
        return prev.map(item => 
          item.producto_id === producto.id 
            ? { ...item, cantidad: item.cantidad + 1, subtotal: Number(((item.cantidad + 1) * item.precio).toFixed(2)) }
            : item
        );
      } else {
        return [...prev, {
          producto_id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          stockMaximo: producto.stock,
          cantidad: 1,
          subtotal: producto.precio
        }];
      }
    });
  };

  // Modificar cantidad
  const cambiarCantidad = (productoId, delta) => {
    setCarrito(prev => {
      return prev.map(item => {
        if (item.producto_id === productoId) {
          const nuevaCant = item.cantidad + delta;
          if (nuevaCant <= 0) return null; // Eliminar si llega a 0
          if (nuevaCant > item.stockMaximo) {
            alert(`Stock máximo alcanzado (${item.stockMaximo} unid.)`);
            return item;
          }
          return {
            ...item,
            cantidad: nuevaCant,
            subtotal: Number((nuevaCant * item.precio).toFixed(2))
          };
        }
        return item;
      }).filter(Boolean);
    });
  };

  // Calcular total de la orden
  const totalOrden = Number(carrito.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2));

  // Enviar venta a la API
  const procesarVenta = async () => {
    if (carrito.length === 0) return;
    setErrorVenta('');
    setTicketVenta(null);
    setProcesando(true);

    const payload = {
      cliente: cliente.trim() || 'Consumidor Final',
      metodo_pago: metodoPago,
      items: carrito.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad
      }))
    };

    try {
      const ventaRegistrada = await api.crearVenta(payload);
      setTicketVenta(ventaRegistrada);
      setCarrito([]); // Limpiar carrito
      refetch();      // Actualizar stock en tiempo real
    } catch (err) {
      // Captura y muestra el error del servidor (ej: 409 Conflict ante stock insuficiente)
      setErrorVenta(err.message || 'Error al procesar la venta en la base de datos');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Punto de Venta (POS)</h1>
        <p className="subtitle">Módulo de facturación rápida con transacciones atómicas y descuento automático de stock</p>
      </div>

      {errorVenta && (
        <Alert type="danger" message={errorVenta} onClose={() => setErrorVenta('')} />
      )}

      {ticketVenta && (
        <div className="alert alert-success" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>🎉 ¡Venta #{ticketVenta.id} registrada exitosamente con COMMIT atómico!</strong>
            <button className="btn btn-sm btn-outline" onClick={() => setTicketVenta(null)}>Cerrar</button>
          </div>
          <p style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>
            Cliente: <strong>{ticketVenta.cliente}</strong> | Pago: <strong>{ticketVenta.metodo_pago}</strong> | Total: <strong>${ticketVenta.total.toFixed(2)}</strong> | Ítems procesados: <strong>{ticketVenta.items.length}</strong>
          </p>
        </div>
      )}

      <div className="pos-layout">
        {/* Panel Izquierdo: Catálogo de productos */}
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="🔍 Buscar producto en el menú por nombre..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
            />
          </div>

          {loading && <LoadingSpinner text="Cargando productos disponibles..." />}
          {error && <Alert type="danger" message={error} />}

          {!loading && !error && (
            <div className="pos-products-grid">
              {productosVisibles.map(prod => {
                const agotado = prod.stock <= 0;
                return (
                  <div 
                    key={prod.id} 
                    className={`pos-card ${agotado ? 'out-of-stock' : ''}`}
                    onClick={() => !agotado && agregarAlCarrito(prod)}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: '600' }}>
                        {prod.categoria_nombre}
                      </div>
                      <h4 style={{ margin: '0.25rem 0', fontSize: '1rem' }}>{prod.nombre}</h4>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                        ${prod.precio.toFixed(2)}
                      </span>
                      <BadgeStock stock={prod.stock} stockMinimo={prod.stock_minimo} activo={prod.activo} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel Derecho: Carrito / Ticket de Venta */}
        <div className="card pos-cart">
          <h3>🧾 Ticket de Venta</h3>
          
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label" htmlFor="cliente">Nombre del Cliente</label>
            <input 
              id="cliente"
              type="text" 
              className="form-control"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="metodoPago">Método de Pago</label>
            <select 
              id="metodoPago"
              className="form-control"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
            >
              <option value="efectivo">💵 Efectivo</option>
              <option value="tarjeta">💳 Tarjeta de Crédito / Débito</option>
              <option value="transferencia">📱 Transferencia Digital</option>
            </select>
          </div>

          <div className="pos-cart-items">
            {carrito.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '1.5rem 0' }}>
                El ticket está vacío.<br />Haz clic en los productos para agregarlos.
              </p>
            ) : (
              carrito.map(item => (
                <div key={item.producto_id} className="pos-cart-item">
                  <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.nombre}</div>
                    <small style={{ color: 'var(--color-text-muted)' }}>
                      ${item.precio.toFixed(2)} c/u
                    </small>
                  </div>

                  <div className="qty-controls">
                    <button 
                      className="qty-btn" 
                      onClick={() => cambiarCantidad(item.producto_id, -1)}
                    >-</button>
                    <span style={{ minWidth: '22px', textAlign: 'center', fontWeight: 'bold' }}>
                      {item.cantidad}
                    </span>
                    <button 
                      className="qty-btn" 
                      onClick={() => cambiarCantidad(item.producto_id, 1)}
                    >+</button>
                  </div>

                  <div style={{ minWidth: '65px', textAlign: 'right', fontWeight: '700' }}>
                    ${item.subtotal.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0', fontSize: '1.25rem' }}>
            <span>Total a pagar:</span>
            <strong style={{ color: 'var(--color-primary)' }}>${totalOrden.toFixed(2)}</strong>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.85rem' }}
            disabled={carrito.length === 0 || procesando}
            onClick={procesarVenta}
          >
            {procesando ? 'Procesando Transacción...' : `Cobrar $${totalOrden.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
