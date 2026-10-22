// ============================================================================
// ARCHIVO: frontend/src/components/LoadingSpinner.jsx
// DESCRIPCIÓN: Indicador visual de carga
// ============================================================================
import React from 'react';

export function LoadingSpinner({ text = 'Cargando datos...' }) {
  return (
    <div className="spinner-container">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
}
