-- ============================================================================
-- LABORATORIO #2: SISTEMA POS E INVENTARIO PARA CAFETERÍA "AROMA & CÓDIGO"
-- ARCHIVO: backend/schema.sql
-- MOTOR: SQLite 3
-- DESCRIPCIÓN: Estructura de tablas, relaciones, restricciones y datos de prueba.
-- ============================================================================

-- 1. ACTIVACIÓN DE RESTRICCIONES DE CLAVES FORÁNEAS (OBLIGATORIO EN SQLITE)
PRAGMA foreign_keys = ON;

-- 2. LIMPIEZA DE TABLAS PREVIAS (Orden inverso a las dependencias de claves foráneas)
DROP TABLE IF EXISTS detalle_ventas;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias;

-- ============================================================================
-- TABLA 1: CATEGORIAS
-- ============================================================================
CREATE TABLE categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

-- ============================================================================
-- TABLA 2: PRODUCTOS
-- Restricciones:
-- - precio > 0 (no se admiten precios negativos ni en cero)
-- - stock >= 0 (no se admite stock negativo)
-- - stock_minimo >= 0 (umbral para alertas del Agente IA)
-- - activo IN (0, 1) (borrado lógico: 1 = visible, 0 = descontinuado)
-- ============================================================================
CREATE TABLE productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio REAL NOT NULL CHECK(precio > 0),
  stock INTEGER NOT NULL CHECK(stock >= 0),
  stock_minimo INTEGER NOT NULL DEFAULT 5 CHECK(stock_minimo >= 0),
  categoria_id INTEGER NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1)),
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ============================================================================
-- TABLA 3: VENTAS (Cabecera)
-- ============================================================================
CREATE TABLE ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  cliente TEXT NOT NULL DEFAULT 'Consumidor Final',
  metodo_pago TEXT NOT NULL CHECK(metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
  total REAL NOT NULL DEFAULT 0 CHECK(total >= 0)
);

-- ============================================================================
-- TABLA 4: DETALLE_VENTAS (Líneas de la venta)
-- ============================================================================
CREATE TABLE detalle_ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL,
  producto_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL CHECK(cantidad > 0),
  precio_unitario REAL NOT NULL CHECK(precio_unitario > 0),
  subtotal REAL NOT NULL CHECK(subtotal > 0),
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ============================================================================
-- DATOS INICIALES REALISTAS DE PRUEBA (SEED DATA)
-- ============================================================================

INSERT INTO categorias (id, nombre, descripcion) VALUES
  (1, 'Bebidas Calientes', 'Cafés clásicos, espressos, lattes y tés calientes artesanales'),
  (2, 'Bebidas Frías', 'Cold brew, frappés, café helado y jugos naturales'),
  (3, 'Repostería y Panadería', 'Pasteles, croissants, muffins y galletas horneadas hoy'),
  (4, 'Snacks y Almuerzos', 'Sandwiches gourmet, paninis, quiches y ensaladas');

INSERT INTO productos (id, nombre, descripcion, precio, stock, stock_minimo, categoria_id, activo) VALUES
  (1, 'Café Americano 12oz', 'Espresso doble rebajado con agua purificada caliente', 2.50, 45, 10, 1, 1),
  (2, 'Cappuccino Italiano 8oz', 'Espresso con partes iguales de leche vaporizada y espuma cremosa', 3.75, 30, 8, 1, 1),
  (3, 'Espresso Doble', 'Extracción pura y concentrada de grano arábica de especialidad', 2.00, 50, 10, 1, 1),
  (4, 'Latte Vainilla 12oz', 'Café con leche suave endulzado con jarabe artesanal de vainilla', 4.25, 25, 8, 1, 1),
  (5, 'Caramel Frappé 16oz', 'Café frío batido con hielo, salsa de caramelo y crema batida', 4.90, 18, 5, 2, 1),
  (6, 'Cold Brew Clásico', 'Macerado en frío por 18 horas, suave y con baja acidez', 3.80, 12, 6, 2, 1),
  (7, 'Croissant de Mantequilla', 'Hojaldre clásico francés horneado al amanecer', 2.80, 4, 6, 3, 1),
  (8, 'Muffin de Arándanos', 'Bizcocho esponjoso relleno de arándanos frescos', 2.60, 3, 5, 3, 1),
  (9, 'Panini Pavo y Queso', 'Pan ciabatta tostado con pechuga de pavo y queso gouda derretido', 5.50, 15, 4, 4, 1),
  (10, 'Cheesecake de Frutos Rojos', 'Porción individual con base crujiente y mermelada natural', 4.50, 8, 4, 3, 1);

INSERT INTO ventas (id, fecha, cliente, metodo_pago, total) VALUES
  (1, '2026-10-21 08:30:00', 'Carlos Mendoza', 'tarjeta', 6.25),
  (2, '2026-10-21 09:15:00', 'Ana Morales', 'efectivo', 9.50),
  (3, '2026-10-22 08:10:00', 'Beatriz Silva', 'transferencia', 5.50),
  (4, '2026-10-22 08:45:00', 'Consumidor Final', 'efectivo', 8.00);

INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES
  (1, 1, 1, 2.50, 2.50),
  (1, 2, 1, 3.75, 3.75),
  (2, 5, 1, 4.90, 4.90),
  (2, 8, 1, 2.60, 2.60),
  (2, 3, 1, 2.00, 2.00),
  (3, 9, 1, 5.50, 5.50),
  (4, 1, 1, 2.50, 2.50),
  (4, 9, 1, 5.50, 5.50);
