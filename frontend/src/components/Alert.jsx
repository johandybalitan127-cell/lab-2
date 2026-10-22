// ============================================================================
// ARCHIVO: frontend/src/components/Alert.jsx
// DESCRIPCIÓN: Notificaciones de error, éxito y advertencia
// ============================================================================
import React from 'react';

export function Alert({ type = 'danger', message, onClose }) {
  if (!message) return null;

  return (
    <div className={`alert alert-${type}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>{type === 'danger' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
        <span>{message}</span>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'inherit' }}
          title="Cerrar"
        >
          &times;
        </button>
      )}
    </div>
  );
}
