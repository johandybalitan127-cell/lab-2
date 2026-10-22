// ============================================================================
// ARCHIVO: frontend/src/pages/ProductosPage.jsx
// DESCRIPCIÓN: Vista de catálogo con búsqueda, filtros, ordenamiento y CRUD
// ============================================================================
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { BadgeStock, BadgeCategory } from '../components/Badge';
import { ModalConfirm } from '../components/ModalConfirm';

export function ProductosPage() {
  const navigate = useNavigate();

  // Estados locales para filtros y orden
  const [buscar, setBuscar] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [criterioOrden, setCriterioOrden] = useState('nombre_asc');
  
  // Feedback visual
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorAccion, setErrorAccion] = useState('');

  // Estado del modal de eliminación
  const [modalEliminar, setModalEliminar] = useState({ abierto: false, producto: null });

  // Carga de categorías y productos
  const { data: categorias } = useFetch(() => api.getCategorias());
  const { data: productos, loading, error, refetch } = useFetch(() => api.getProductos({ soloActivos: false }));

  // Filtrado y ordenamiento en cliente
  const productosFiltrados = useMemo(() => {
    if (!productos) return [];

    return productos
      .filter((p) => {
        const coincideNombre = p.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(buscar.toLowerCase()));
        
        const coincideCategoria = categoriaSeleccionada === '' || 
          p.categoria_id === Number(categoriaSeleccionada);

        return coincideNombre && coincideCategoria;
      })
      .sort((a, b) => {
        if (criterioOrden === 'nombre_asc') return a.nombre.localeCompare(b.nombre);
        if (criterioOrden === 'nombre_desc') return b.nombre.localeCompare(a.nombre);
        if (criterioOrden === 'precio_asc') return a.precio - b.precio;
        if (criterioOrden === 'precio_desc') return b.precio - a.precio;
        if (criterioOrden === 'stock_asc') return a.stock - b.stock;
        if (criterioOrden === 'stock_desc') return b.stock - a.stock;
        return 0;
      });
  }, [productos, buscar, categoriaSeleccionada, criterioOrden]);

  // Manejador para eliminar producto
  const confirmarEliminar = async () => {
    const prod = modalEliminar.producto;
    if (!prod) return;

    try {
      setErrorAccion('');
      const res = await api.eliminarProducto(prod.id);
      setMensajeExito(res.mensaje || 'Operación completada con éxito.');
      setModalEliminar({ abierto: false, producto: null });
      refetch(); // Recargar datos
    } catch (err) {
      setErrorAccion(err.message || 'Error al eliminar el producto');
      setModalEliminar({ abierto: false, producto: null });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1>Catálogo de Productos</h1>
          <p className="subtitle">Gestión de inventario, precios, stock y categorías de la cafetería</p>
        </div>
        <Link to="/productos/nuevo" className="btn btn-primary">
          ➕ Nuevo Producto
        </Link>
      </div>

      {mensajeExito && (
        <Alert type="success" message={mensajeExito} onClose={() => setMensajeExito('')} />
      )}
      {errorAccion && (
        <Alert type="danger" message={errorAccion} onClose={() => setErrorAccion('')} />
      )}

      {/* Barra de Filtros, Búsqueda y Ordenamiento */}
      <div className="filter-bar">
        <div className="filter-group">
          <div className="search-input-wrapper">
            <input 
              type="text" 
              className="form-control" 
              placeholder="🔍 Buscar por nombre o descripción..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
            />
          </div>

          <select 
            className="form-control" 
            style={{ width: 'auto', minWidth: '180px' }}
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias && categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>

          <select 
            className="form-control" 
            style={{ width: 'auto', minWidth: '180px' }}
            value={criterioOrden}
            onChange={(e) => setCriterioOrden(e.target.value)}
          >
            <option value="nombre_asc">Ordenar: Nombre (A-Z)</option>
            <option value="nombre_desc">Ordenar: Nombre (Z-A)</option>
            <option value="precio_asc">Ordenar: Menor Precio</option>
            <option value="precio_desc">Ordenar: Mayor Precio</option>
            <option value="stock_asc">Ordenar: Menor Stock</option>
            <option value="stock_desc">Ordenar: Mayor Stock</option>
          </select>
        </div>

        <div>
          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
            {productosFiltrados.length} productos encontrados
          </span>
        </div>
      </div>

      {loading && <LoadingSpinner text="Cargando catálogo de productos..." />}
      {error && <Alert type="danger" message={error} onClose={refetch} />}

      {!loading && !error && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    No se encontraron productos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>
                      <div>
                        <strong>{p.nombre}</strong>
                        {p.descripcion && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {p.descripcion}
                          </div>
                        )}
                      </div>
                    </td>
                    <td><BadgeCategory text={p.categoria_nombre} /></td>
                    <td><strong>${p.precio.toFixed(2)}</strong></td>
                    <td>
                      <span style={{ fontWeight: '600' }}>{p.stock}</span>{' '}
                      <small style={{ color: 'var(--color-text-muted)' }}>(Mín: {p.stock_minimo})</small>
                    </td>
                    <td>
                      <BadgeStock stock={p.stock} stockMinimo={p.stock_minimo} activo={p.activo} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button 
                          className="btn btn-outline btn-sm" 
                          onClick={() => navigate(`/productos/${p.id}`)}
                          title="Ver detalle"
                        >
                          👁️
                        </button>
                        <button 
                          className="btn btn-outline btn-sm" 
                          onClick={() => navigate(`/productos/editar/${p.id}`)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn-outline btn-sm" 
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => setModalEliminar({ abierto: true, producto: p })}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      <ModalConfirm 
        isOpen={modalEliminar.abierto}
        title="¿Eliminar producto?"
        message={`¿Estás seguro de que deseas eliminar "${modalEliminar.producto?.nombre}"? Si ya cuenta con ventas históricas, el sistema aplicará un borrado lógico (inactivación) para salvaguardar la contabilidad.`}
        confirmText="Sí, procesar"
        isDanger={true}
        onConfirm={confirmarEliminar}
        onCancel={() => setModalEliminar({ abierto: false, producto: null })}
      />
    </div>
  );
}
