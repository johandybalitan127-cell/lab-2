// ============================================================================
// ARCHIVO: backend/src/db.js
// DESCRIPCIÓN: Conexión centralizada a SQLite mediante better-sqlite3
// ============================================================================
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbPath = process.env.DB_PATH 
  ? path.resolve(__dirname, '..', process.env.DB_PATH)
  : path.join(__dirname, '../cafeteria.db');

// Instancia de base de datos
const db = new Database(dbPath, {
  // verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// ACTIVACIÓN OBLIGATORIA DE CLAVES FORÁNEAS EN CADA CONEXIÓN DE SQLITE
db.pragma('foreign_keys = ON');

// Modo WAL (Write-Ahead Logging) para lecturas concurrentes sin bloqueo
db.pragma('journal_mode = WAL');

module.exports = db;
