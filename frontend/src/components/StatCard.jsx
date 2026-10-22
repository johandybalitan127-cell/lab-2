// ============================================================================
// ARCHIVO: frontend/src/components/StatCard.jsx
// DESCRIPCIÓN: Componente reutilizable para tarjetas de métricas del dashboard
// ============================================================================
import React from 'react';

export function StatCard({ title, value, icon, variant = 'default', subtitle }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${variant}`}>
        {icon}
      </div>
      <div className="stat-data">
        <span className="stat-label">{title}</span>
        <span className="stat-value">{value}</span>
        {subtitle && <small style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{subtitle}</small>}
      </div>
    </div>
  );
}
