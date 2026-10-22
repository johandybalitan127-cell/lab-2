// ============================================================================
// ARCHIVO: backend/src/app.js
// DESCRIPCIÓN: Punto de entrada del servidor Express
// ============================================================================
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

// 1. MIDDLEWARES GLOBALES
// CORS: Permite peticiones desde el frontend (Vite corre en 5173 por defecto) y desde n8n
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express JSON: Transforma el cuerpo de peticiones entrantes a JSON
app.use(express.json());

// Logger simple para desarrollo
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// 2. RUTAS DE LA API
app.use('/api', routes);

// 3. MANEJO DE RUTAS NO ENCONTRADAS (404)
app.use((req, res) => {
  res.status(404).json({ error: `La ruta [${req.method}] ${req.originalUrl} no existe en este servidor.` });
});

// 4. MIDDLEWARE GLOBAL DE MANEJO DE ERRORES UNIFORME
// Siempre responde con la estructura estándar { error: "mensaje" }
app.use((err, req, res, next) => {
  console.error(`💥 [Error] en ${req.method} ${req.url}:`, err.message);

  const statusCode = err.status || 500;
  const mensaje = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: mensaje
  });
});

// 5. INICIO DEL SERVIDOR
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🚀 Servidor backend Express activo en http://localhost:${PORT}`);
    console.log(`📌 Documentación base de endpoints en http://localhost:${PORT}/api`);
    console.log('====================================================');
  });
}

module.exports = app;
