// ============================================================================
// ARCHIVO: frontend/src/pages/ProductoDetallePage.jsx
// DESCRIPCIÓN: Vista de detalle ampliado de un producto (GET /api/productos/:id)
// ============================================================================
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { BadgeStock, BadgeCategory } from '../components/Badge';

export function ProductoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: producto, loading, error, refetch } = useFetch(() => api.getProductoPorId(id), [id]);

  if (loading) return <LoadingSpinner text="Cargando detalle del producto..." />;
  if (error) return <Alert type="danger" message={error} onClose={() => navigate('/productos')} />;
  if (!producto) return null;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/productos" style={{ textDecoration: 'none', color: 'var(--color-accent)', fontWeight: '600' }}>
          ← Volver al Catálogo de Productos
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              PRODUCTO #{producto.id}
            </span>
            <h1 style={{ fontSize: '1.85rem', margin: '0.25rem 0' }}>{producto.nombre}</h1>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
              <BadgeCategory text={producto.categoria_nombre} />
              <BadgeStock stock={producto.stock} stockMinimo={producto.stock_minimo} activo={producto.activo} />
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Precio unitario</span>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)' }}>
              ${producto.precio.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.4rem', fontSize: '1rem', color: 'var(--color-text-muted)' }}>Descripción</h3>
          <p style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
            {producto.descripcion || 'Sin descripción registrada para este producto.'}
          </p>
        </div>

        {/* Ficha técnica de stock */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: 'var(--color-bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Existencias Actuales</span>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: producto.stock <= producto.stock_minimo ? 'var(--color-warning)' : 'var(--color-primary)' }}>
              {producto.stock} unidades
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Stock Mínimo Permitido</span>
            <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>
              {producto.stock_minimo} unidades
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Estado del Producto</span>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '0.2rem' }}>
              {producto.activo === 1 ? '✅ Habilitado para venta' : '❌ Descontinuado / Inactivo'}
            </div>
          </div>
        </div>

        {/* Información de Categoría Relacionada */}
        {producto.categoria_descripcion && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.25rem' }}>Acerca de la categoría ({producto.categoria_nombre}):</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{producto.categoria_descripcion}</p>
          </div>
        )}

        {/* Botones de navegación */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <button className="btn btn-outline" onClick={() => navigate('/productos')}>
            Volver
          </button>
          <Link to={`/productos/editar/${producto.id}`} className="btn btn-primary">
            ✏️ Modificar Producto
          </Link>
        </div>
      </div>
    </div>
  );
}
