// ============================================================================
// ARCHIVO: frontend/src/App.jsx
// DESCRIPCIÓN: Enrutador principal de la aplicación React con React Router v6+
// ============================================================================
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ProductosPage } from './pages/ProductosPage';
import { ProductoFormPage } from './pages/ProductoFormPage';
import { ProductoDetallePage } from './pages/ProductoDetallePage';
import { PosPage } from './pages/PosPage';
import { VentasPage } from './pages/VentasPage';
import { AsistentePage } from './pages/AsistentePage';

export function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* 1. Panel de Métricas / Dashboard */}
            <Route path="/" element={<DashboardPage />} />

            {/* 2. Catálogo de Productos y CRUD */}
            <Route path="/productos" element={<ProductosPage />} />
            <Route path="/productos/nuevo" element={<ProductoFormPage />} />
            <Route path="/productos/editar/:id" element={<ProductoFormPage />} />
            <Route path="/productos/:id" element={<ProductoDetallePage />} />

            {/* 3. Punto de Venta POS (Transacciones) */}
            <Route path="/pos" element={<PosPage />} />

            {/* 4. Historial Contable de Ventas */}
            <Route path="/ventas" element={<VentasPage />} />

            {/* 5. Agente de Inteligencia Artificial (n8n) */}
            <Route path="/asistente-ia" element={<AsistentePage />} />

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
