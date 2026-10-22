// ============================================================================
// ARCHIVO: frontend/src/components/Badge.jsx
// DESCRIPCIÓN: Etiquetas de estado de stock y categorías
// ============================================================================
import React from 'react';

export function BadgeStock({ stock, stockMinimo, activo = 1 }) {
  if (activo === 0) {
    return <span className="badge badge-danger">Inactivo / Descontinuado</span>;
  }

  if (stock === 0) {
    return <span className="badge badge-danger">Agotado (0 unid.)</span>;
  }

  if (stock <= stockMinimo) {
    return <span className="badge badge-warning">Crítico ({stock} unid.)</span>;
  }

  return <span className="badge badge-success">En Stock ({stock} unid.)</span>;
}

export function BadgeCategory({ text }) {
  return <span className="badge badge-category">{text}</span>;
}
