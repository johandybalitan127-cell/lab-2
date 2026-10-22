// ============================================================================
// ARCHIVO: frontend/src/components/ModalConfirm.jsx
// DESCRIPCIÓN: Ventana modal de confirmación antes de eliminar o realizar acciones críticas
// ============================================================================
import React from 'react';

export function ModalConfirm({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirmar', isDanger = false }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p style={{ marginTop: '0.75rem', color: 'var(--color-text-muted)' }}>{message}</p>
        
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancelar
          </button>
          <button 
            type="button" 
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
