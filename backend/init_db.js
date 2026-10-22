// ============================================================================
// ARCHIVO: backend/init_db.js
// DESCRIPCIÓN: Script de inicialización y verificación de la base de datos SQLite
// ============================================================================
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'cafeteria.db');
const schemaPath = path.join(__dirname, 'schema.sql');

console.log('------------------------------------------------------------');
console.log('☕ INICIALIZANDO BASE DE DATOS DE LA CAFETERÍA (SQLite)');
console.log('------------------------------------------------------------');
console.log(`📁 Archivo DB: ${dbPath}`);
console.log(`📜 Archivo Schema: ${schemaPath}`);

// 1. Conexión a la base de datos (se creará el archivo si no existe)
const db = new Database(dbPath);

// 2. ACTIVAR CLAVES FORÁNEAS (Fundamental en SQLite)
db.pragma('foreign_keys = ON');

// Verificar que las claves foráneas quedaron activas
const fkStatus = db.pragma('foreign_keys', { simple: true });
console.log(`🔒 Claves Foráneas (PRAGMA foreign_keys): ${fkStatus === 1 ? 'ACTIVADAS (Correcto)' : 'DESACTIVADAS (Error)'}`);

if (fkStatus !== 1) {
  console.error('❌ Error crítico: Las claves foráneas no pudieron ser activadas.');
  process.exit(1);
}

// 3. Leer y ejecutar el script schema.sql
try {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
  console.log('✅ Esquema y datos semilla aplicados exitosamente.');
} catch (error) {
  console.error('❌ Error ejecutando schema.sql:', error.message);
  process.exit(1);
}

// 4. Verificación de conteo de registros en cada tabla
console.log('\n📊 VERIFICACIÓN DE TABLAS Y REGISTROS:');
const tablas = ['categorias', 'productos', 'ventas', 'detalle_ventas'];
for (const tabla of tablas) {
  const row = db.prepare(`SELECT COUNT(*) as count FROM ${tabla}`).get();
  console.log(`   - Tabla [${tabla}]: ${row.count} registros insertados.`);
}

// 5. PRUEBA DE RESTRICCIONES (COMPROBACIÓN AUTOMATIZADA)
console.log('\n🧪 EJECUTANDO PRUEBAS DE INTEGRIDAD Y RESTRICCIONES:');

// Prueba A: Violación de CHECK (Precio negativo)
try {
  db.prepare(`INSERT INTO productos (nombre, precio, stock, categoria_id) VALUES ('Prueba Negativa', -10, 5, 1)`).run();
  console.error('❌ FALLÓ: Permitió insertar un precio negativo (Violación de CHECK).');
} catch (err) {
  console.log('✅ CORRECTO: Rechazó precio negativo ->', err.message);
}

// Prueba B: Violación de Clave Foránea (Categoría inexistente)
try {
  db.prepare(`INSERT INTO productos (nombre, precio, stock, categoria_id) VALUES ('Café Fantasma', 3.50, 10, 9999)`).run();
  console.error('❌ FALLÓ: Permitió asociar una categoría inexistente (Violación de FK).');
} catch (err) {
  console.log('✅ CORRECTO: Rechazó categoría inexistente ->', err.message);
}

// Prueba C: Violación de NOT NULL (Producto sin nombre)
try {
  db.prepare(`INSERT INTO productos (nombre, precio, stock, categoria_id) VALUES (NULL, 3.50, 10, 1)`).run();
  console.error('❌ FALLÓ: Permitió insertar un nombre nulo (Violación de NOT NULL).');
} catch (err) {
  console.log('✅ CORRECTO: Rechazó nombre NULL ->', err.message);
}

db.close();
console.log('\n🎉 Base de datos lista y validada al 100%.');
console.log('------------------------------------------------------------');
