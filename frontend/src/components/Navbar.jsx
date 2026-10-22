// ============================================================================
// ARCHIVO: frontend/src/components/Navbar.jsx
// DESCRIPCIÓN: Barra de navegación principal con enlaces de React Router
// ============================================================================
import React from 'react';
import { NavLink } from 'react-router-dom';

export function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          <span className="brand-icon">☕</span>
          <div className="brand-text">
            <h2>Aroma & Código</h2>
            <span>Cafetería POS & Lab #2</span>
          </div>
        </NavLink>

        <nav>
          <ul className="nav-links">
            <li>
              <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>📊</span> <span className="text">Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/productos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>📦</span> <span className="text">Productos</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/pos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>🧾</span> <span className="text">Punto de Venta</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/ventas" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>📜</span> <span className="text">Historial</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/asistente-ia" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>🤖</span> <span className="text">Agente IA</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
