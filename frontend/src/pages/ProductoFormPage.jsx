// ============================================================================
// ARCHIVO: frontend/src/pages/ProductoFormPage.jsx
// DESCRIPCIÓN: Formulario controlado para crear y editar productos
// ============================================================================
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { Alert } from '../components/Alert';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function ProductoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  // Estados del formulario controlado
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [stockMinimo, setStockMinimo] = useState('5');
  const [categoriaId, setCategoriaId] = useState('');
  const [activo, setActivo] = useState(true);

  // Estados de control
  const [erroresValidacion, setErroresValidacion] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(esEdicion);

  // Categorías para el dropdown
  const { data: categorias } = useFetch(() => api.getCategorias());

  // Cargar datos previos si es edición
  useEffect(() => {
    if (esEdicion) {
      setCargandoInicial(true);
      api.getProductoPorId(id)
        .then((prod) => {
          setNombre(prod.nombre);
          setDescripcion(prod.descripcion || '');
          setPrecio(prod.precio.toString());
          setStock(prod.stock.toString());
          setStockMinimo(prod.stock_minimo.toString());
          setCategoriaId(prod.categoria_id.toString());
          setActivo(prod.activo === 1);
        })
        .catch((err) => {
          setErrorServidor(err.message || 'Error al cargar el producto para edición');
        })
        .finally(() => setCargandoInicial(false));
    }
  }, [id, esEdicion]);

  // Validación local en cliente
  const validarFormulario = () => {
    const errs = {};

    if (!nombre.trim()) {
      errs.nombre = 'El nombre del producto es obligatorio.';
    }

    const numPrecio = Number(precio);
    if (!precio || isNaN(numPrecio) || numPrecio <= 0) {
      errs.precio = 'El precio debe ser un número estrictamente mayor a 0 (ej: 3.50).';
    }

    const numStock = Number(stock);
    if (stock === '' || isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      errs.stock = 'El stock debe ser un número entero mayor o igual a 0.';
    }

    const numStockMin = Number(stockMinimo);
    if (stockMinimo === '' || isNaN(numStockMin) || numStockMin < 0 || !Number.isInteger(numStockMin)) {
      errs.stockMinimo = 'El stock mínimo debe ser un número entero mayor o igual a 0.';
    }

    if (!categoriaId) {
      errs.categoriaId = 'Debes seleccionar una categoría.';
    }

    setErroresValidacion(errs);
    return Object.keys(errs).length === 0;
  };

  // Enviar formulario al servidor
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorServidor('');

    if (!validarFormulario()) return;

    setGuardando(true);
    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      precio: Number(precio),
      stock: Number(stock),
      stock_minimo: Number(stockMinimo),
      categoria_id: Number(categoriaId),
      activo: activo ? 1 : 0
    };

    try {
      if (esEdicion) {
        await api.actualizarProducto(id, payload);
      } else {
        await api.crearProducto(payload);
      }
      navigate('/productos');
    } catch (err) {
      // Muestra el mensaje de error del servidor con formato { error: "mensaje" }
      setErrorServidor(err.message || 'Error al guardar el producto en el servidor');
    } finally {
      setGuardando(false);
    }
  };

  if (cargandoInicial) {
    return <LoadingSpinner text="Cargando información del producto..." />;
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/productos" style={{ textDecoration: 'none', color: 'var(--color-accent)', fontWeight: '600' }}>
          ← Volver al Catálogo
        </Link>
        <h1 style={{ marginTop: '0.5rem' }}>
          {esEdicion ? `✏️ Editar Producto #${id}` : '➕ Registrar Nuevo Producto'}
        </h1>
        <p className="subtitle">
          {esEdicion ? 'Actualiza los datos del producto existente.' : 'Completa los datos para dar de alta un producto en el inventario.'}
        </p>
      </div>

      {errorServidor && (
        <Alert type="danger" message={errorServidor} onClose={() => setErrorServidor('')} />
      )}

      <form onSubmit={handleSubmit} className="card">
        {/* Nombre */}
        <div className="form-group">
          <label className="form-label" htmlFor="nombre">Nombre del Producto *</label>
          <input 
            id="nombre"
            type="text" 
            className="form-control"
            placeholder="Ej: Latte Caramel Vainilla 12oz"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          {erroresValidacion.nombre && <div className="form-error">{erroresValidacion.nombre}</div>}
        </div>

        {/* Categoría */}
        <div className="form-group">
          <label className="form-label" htmlFor="categoria">Categoría *</label>
          <select 
            id="categoria"
            className="form-control"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
          >
            <option value="">-- Seleccionar Categoría --</option>
            {categorias && categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
          {erroresValidacion.categoriaId && <div className="form-error">{erroresValidacion.categoriaId}</div>}
        </div>

        {/* Fila: Precio, Stock, Stock Mínimo */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="precio">Precio ($ USD) *</label>
            <input 
              id="precio"
              type="number" 
              step="0.01"
              min="0.01"
              className="form-control"
              placeholder="Ej: 3.50"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
            />
            {erroresValidacion.precio && <div className="form-error">{erroresValidacion.precio}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="stock">Stock Actual *</label>
            <input 
              id="stock"
              type="number" 
              min="0"
              className="form-control"
              placeholder="Ej: 25"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
            {erroresValidacion.stock && <div className="form-error">{erroresValidacion.stock}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="stockMinimo">Stock Mínimo (Alerta) *</label>
            <input 
              id="stockMinimo"
              type="number" 
              min="0"
              className="form-control"
              placeholder="Ej: 5"
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
            />
            {erroresValidacion.stockMinimo && <div className="form-error">{erroresValidacion.stockMinimo}</div>}
          </div>
        </div>

        {/* Descripción */}
        <div className="form-group">
          <label className="form-label" htmlFor="descripcion">Descripción (Opcional)</label>
          <textarea 
            id="descripcion"
            className="form-control"
            placeholder="Breve descripción de ingredientes, preparación o presentación..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        {/* Estado activo (solo en edición) */}
        {esEdicion && (
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <input 
              type="checkbox" 
              id="activoCheck"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
            />
            <label htmlFor="activoCheck" style={{ fontWeight: '500', cursor: 'pointer' }}>
              Producto Activo (Visible en el Punto de Venta)
            </label>
          </div>
        )}

        {/* Botones de acción */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={() => navigate('/productos')}
            disabled={guardando}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : esEdicion ? 'Actualizar Cambios' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
