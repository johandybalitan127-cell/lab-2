// ============================================================================
// ARCHIVO: frontend/src/pages/DashboardPage.jsx
// DESCRIPCIÓN: Panel principal de control y métricas de negocio conectadas a SQL
// ============================================================================
import React from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { BadgeStock } from '../components/Badge';

export function DashboardPage() {
  const { data, loading, error, refetch } = useFetch(() => api.getResumen());

  if (loading) return <LoadingSpinner text="Consultando indicadores SQL en tiempo real..." />;
  if (error) return <Alert type="danger" message={error} onClose={refetch} />;
  if (!data) return null;

  const { resumen, ventas_por_categoria, top_productos, productos_criticos } = data;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1>Panel de Control & Indicadores SQL</h1>
          <p className="subtitle">Métricas calculadas en servidor mediante COUNT, SUM, AVG y GROUP BY</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={refetch} title="Refrescar métricas">
            🔄 Actualizar
          </button>
          <Link to="/pos" className="btn btn-primary">
            ☕ Nueva Venta (POS)
          </Link>
        </div>
      </div>

      {/* Grid de 5 StatCards principales */}
      <div className="stats-grid">
        <StatCard 
          title="Total Pedidos" 
          value={resumen.total_pedidos} 
          icon="🧾" 
          subtitle="Ventas registradas (COUNT)" 
        />
        <StatCard 
          title="Ingresos Totales" 
          value={`$${resumen.ingresos_totales.toFixed(2)}`} 
          icon="💵" 
          variant="accent" 
          subtitle="Facturación acumulada (SUM)" 
        />
        <StatCard 
          title="Ticket Promedio" 
          value={`$${resumen.ticket_promedio.toFixed(2)}`} 
          icon="📈" 
          subtitle="Gasto medio por cliente (AVG)" 
        />
        <StatCard 
          title="Productos Activos" 
          value={resumen.total_productos} 
          icon="☕" 
          subtitle="Catálogo disponible" 
        />
        <StatCard 
          title="Stock Crítico" 
          value={resumen.productos_stock_critico} 
          icon="⚠️" 
          variant={resumen.productos_stock_critico > 0 ? "warning" : "success"}
          subtitle="Stock menor o igual al mínimo" 
        />
      </div>

      {/* Sección con Top Productos y Categorías */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Top 5 Productos */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>⭐ Top 5 Productos Más Vendidos</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>GROUP BY producto_id</span>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th style={{ textAlign: 'center' }}>Unidades</th>
                  <th style={{ textAlign: 'right' }}>Recaudación</th>
                </tr>
              </thead>
              <tbody>
                {top_productos.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center' }}>No hay ventas registradas aún.</td></tr>
                ) : (
                  top_productos.map((prod) => (
                    <tr key={prod.id}>
                      <td><strong>{prod.nombre}</strong></td>
                      <td>{prod.categoria}</td>
                      <td style={{ textAlign: 'center' }}><strong>{prod.unidades_vendidas}</strong></td>
                      <td style={{ textAlign: 'right' }}>${prod.ingresos_generados.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ventas por Categoría */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>🏷️ Facturación por Categoría</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>GROUP BY categoria_id</span>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th style={{ textAlign: 'center' }}>Unid. Vendidas</th>
                  <th style={{ textAlign: 'right' }}>Total Facturado</th>
                </tr>
              </thead>
              <tbody>
                {ventas_por_categoria.map((cat, idx) => (
                  <tr key={idx}>
                    <td><strong>{cat.categoria}</strong></td>
                    <td style={{ textAlign: 'center' }}>{cat.unidades_vendidas}</td>
                    <td style={{ textAlign: 'right' }}><strong>${cat.total_facturado.toFixed(2)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Alertas de Inventario Crítico (Enlace natural con n8n) */}
      <div className="card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <h3>⚠️ Alertas de Inventario Crítico ({productos_criticos.length})</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Productos que requieren reposición inmediata o recomendaciones del Agente IA.
            </p>
          </div>
          <Link to="/asistente-ia" className="btn btn-accent btn-sm">
            🤖 Consultar al Agente IA para sugerir compra
          </Link>
        </div>

        {productos_criticos.length === 0 ? (
          <p style={{ color: 'var(--color-success)', fontWeight: '500' }}>✅ Todos los productos tienen existencias saludables.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock Actual</th>
                  <th>Stock Mínimo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {productos_criticos.map((prod) => (
                  <tr key={prod.id}>
                    <td><strong>{prod.nombre}</strong></td>
                    <td>{prod.categoria}</td>
                    <td><strong style={{ color: 'var(--color-warning)' }}>{prod.stock} unid.</strong></td>
                    <td>{prod.stock_minimo} unid.</td>
                    <td>
                      <BadgeStock stock={prod.stock} stockMinimo={prod.stock_minimo} activo={1} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
