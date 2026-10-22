# ☕ Cafetería "Aroma & Código" — Sistema POS, Inventario & Agente IA
## Laboratorio #2 de Desarrollo Front End / Full Stack

Aplicación web integral desarrollada con **React (Vite)**, **Node.js + Express**, **SQLite relacional (`better-sqlite3`)** y un **Agente de Inteligencia Artificial en n8n**.

---

## 🏛️ 1. Arquitectura General del Sistema

El sistema implementa una arquitectura desacoplada por capas:

```mermaid
graph TD
    subgraph Frontend["Frontend SPA (React + Vite - Puerto 5173)"]
        UI["Interfaz Responsive (CSS Puro)"]
        Router["React Router v6"]
        Hooks["Custom Hook: useFetch"]
        ApiClient["Cliente API (services/api.js)"]
    end

    subgraph Backend["Backend API REST (Node.js + Express - Puerto 4000)"]
        Routes["Rutas (/api/...)"]
        Controllers["Controladores (HTTP Status: 200, 201, 400, 404, 409)"]
        Services["Servicios (Lógica de Negocio y Transacciones ACID)"]
        DBDriver["better-sqlite3 (PRAGMA foreign_keys = ON)"]
    end

    subgraph Database["Base de Datos Relacional"]
        SQLite[("SQLite: cafeteria.db<br/>(4 Tablas Relacionadas)")]
    end

    subgraph Automation["Automatización con IA (n8n - Puerto 5678)"]
        Webhook["Webhook /asistente-cafeteria"]
        Validation["Validación de Entrada"]
        AIAgent["AI Agent (LangChain) + Gemini/OpenAI"]
        Tool["Herramienta HTTP: GET /api/productos"]
        Respond["Respond to Webhook { ok, data, error }"]
    end

    UI --> Router --> Hooks --> ApiClient
    ApiClient -->|HTTP REST /api| Routes
    Routes --> Controllers --> Services --> DBDriver --> SQLite
    ApiClient -.->|POST Webhook /asistente-cafeteria| Webhook
    Webhook --> Validation --> AIAgent --> Respond
    AIAgent -.->|Tool HTTP GET| Routes
    Respond -.->|JSON { ok, data, error }| UI
```

---

## 🗄️ 2. Modelo de Base de Datos Relacional (SQLite)

El esquema relacional incluye **4 tablas interconectadas**, restricciones de integridad (`NOT NULL`, `CHECK`, `UNIQUE`) y activación obligatoria de claves foráneas con `PRAGMA foreign_keys = ON;`.

```mermaid
erDiagram
    CATEGORIAS ||--o{ PRODUCTOS : "clasifica (1:N)"
    VENTAS ||--|{ DETALLE_VENTAS : "contiene (1:N)"
    PRODUCTOS ||--o{ DETALLE_VENTAS : "se incluye en (1:N)"

    CATEGORIAS {
        INTEGER id PK
        TEXT nombre UK
        TEXT descripcion
    }

    PRODUCTOS {
        INTEGER id PK
        TEXT nombre NOT_NULL
        TEXT descripcion
        REAL precio "CHECK(precio > 0)"
        INTEGER stock "CHECK(stock >= 0)"
        INTEGER stock_minimo "CHECK(stock_minimo >= 0)"
        INTEGER categoria_id FK
        INTEGER activo "CHECK(activo IN (0, 1))"
    }

    VENTAS {
        INTEGER id PK
        TEXT fecha "DEFAULT datetime('now')"
        TEXT cliente NOT_NULL
        TEXT metodo_pago "CHECK(in efectivo, tarjeta, transferencia)"
        REAL total "CHECK(total >= 0)"
    }

    DETALLE_VENTAS {
        INTEGER id PK
        INTEGER venta_id FK
        INTEGER producto_id FK
        INTEGER cantidad "CHECK(cantidad > 0)"
        REAL precio_unitario "CHECK(precio_unitario > 0)"
        REAL subtotal "CHECK(subtotal > 0)"
    }
```

---

## 🔌 3. Catálogo de Endpoints de la API REST

Base URL: `http://localhost:4000/api`

| Recurso | Método | Endpoint | Descripción | Códigos HTTP |
| :--- | :---: | :--- | :--- | :---: |
| **Resumen** | `GET` | `/resumen` | Métricas calculadas con SQL (`COUNT`, `SUM`, `AVG`, `GROUP BY`) | `200` |
| **Categorías** | `GET` | `/categorias` | Lista de categorías con conteo de productos | `200` |
| **Categorías** | `GET` | `/categorias/:id` | Detalle de una categoría específica | `200`, `404` |
| **Productos** | `GET` | `/productos` | Lista de productos con filtros (`?categoria_id=`, `?buscar=`) | `200` |
| **Productos** | `GET` | `/productos/:id` | Detalle de un producto con información de su categoría | `200`, `404` |
| **Productos** | `POST` | `/productos` | Registrar nuevo producto con validación de precios y stock | `201`, `400` |
| **Productos** | `PUT` | `/productos/:id` | Actualizar información de producto existente | `200`, `400`, `404` |
| **Productos** | `DELETE` | `/productos/:id` | Eliminar producto (aplica borrado lógico si tiene ventas) | `200`, `404` |
| **Ventas** | `GET` | `/ventas` | Historial contable de ventas con total y fecha | `200` |
| **Ventas** | `GET` | `/ventas/:id` | Venta cabecera con lista completa de ítems asociados | `200`, `404` |
| **Ventas** | `POST` | `/ventas` | **Transacción ACID:** Registra venta y descuenta stock | `201`, `400`, `409` |
| **Agente IA** | `POST` | `/agente-ia` | Endpoint simulador/respaldo con contrato `{ ok, data, error }` | `200`, `400` |

---

## 🛡️ 4. Reglas de Negocio Implementadas

1. **Integridad de Precios y Stock:**
   - La base de datos y la capa de servicio prohíben precios menores o iguales a cero (`CHECK(precio > 0)`).
   - No se admite stock negativo (`CHECK(stock >= 0)`).
2. **Transacción Atómica de Ventas (ACID):**
   - Una venta involucra: crear cabecera en `ventas`, crear ítems en `detalle_ventas` y restar existencias en `productos`.
   - Si no hay suficiente stock para cualquier ítem, se interrumpe la operación, se ejecuta **`ROLLBACK` automático** y se responde con **HTTP 409 Conflict**, garantizando que ninguna tabla quede alterada a medias.
3. **Preservación del Historial Contable (Borrado Lógico):**
   - Si se solicita eliminar un producto que ya tiene ventas registradas, el sistema no lo borra físicamente para no corromper la contabilidad histórica; en su lugar, cambia `activo = 0` (borrado lógico), ocultándolo del Punto de Venta.
4. **Formato Uniforme de Respuestas de Error:**
   - Todo error en el servidor devuelve siempre el estándar: `{ "error": "mensaje descriptivo" }`.

---

## 🚀 5. Instrucciones de Instalación y Ejecución

### Requisitos Previos
- **Node.js** v18 o superior (verificado con Node v22).
- Terminal en Windows (PowerShell) o Linux/macOS.

---

### Paso 1: Configurar e Inicializar el Backend y la Base de Datos

1. Abre una terminal y navega a la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicializa y verifica la base de datos SQLite con los datos semilla y pruebas automáticas:
   ```bash
   npm run db:init
   ```
4. Ejecuta la suite de 10 pruebas automatizadas para comprobar endpoints y transacciones:
   ```bash
   npm test
   ```
5. Inicia el servidor backend:
   ```bash
   npm run dev
   ```
   > El servidor quedará activo en: **`http://localhost:4000`**

---

### Paso 2: Configurar y Levantar el Frontend en React

1. Abre una **segunda terminal** y navega a la carpeta `frontend`:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```
   > Abre en tu navegador el enlace mostrado: **`http://localhost:5173`**

---

### Paso 3: Configurar el Agente IA en n8n

1. En una **tercera terminal**, inicia n8n:
   ```bash
   npx n8n
   ```
   > Abre en tu navegador: **`http://localhost:5678`**
2. En n8n, haz clic en **Import from File...** y selecciona el archivo [workflow_n8n.json](file:///c:/Users/fwd80/Downloads/lab%202/workflow_n8n.json) ubicado en la raíz del proyecto.
3. Asigna tu credencial gratuita de **Google Gemini** o de **OpenAI** en el nodo de modelo de lenguaje.
4. Activa el workflow con el botón **Active**.
5. En la aplicación React, ve a la pestaña **Agente IA** (`/asistente-ia`) y realiza consultas analíticas en vivo.
   *(Nota: Si deseas probar sin encender n8n, la pantalla incluye el botón `🛡️ API Local Respaldo (:4000)` para realizar la simulación inmediata)*.

---

## 🤖 6. Contrato del Agente de Inteligencia Artificial

Tanto n8n como el endpoint local devuelven estrictamente:

### Respuesta Exitosa (HTTP 200)
```json
{
  "ok": true,
  "data": {
    "mensaje": "Plan de reabastecimiento: Pedir 12 unidades de Muffin...",
    "timestamp": "2026-10-22T..."
  },
  "error": null
}
```

### Respuesta Fallida (HTTP 400)
```json
{
  "ok": false,
  "data": null,
  "error": "La consulta es obligatoria y debe ser un texto válido."
}
```

---

## 📁 7. Estructura Completa del Repositorio

```text
lab 2/
├── schema.sql                        <-- Esquema de base de datos relacional SQLite
├── workflow_n8n.json                 <-- Workflow visual exportado de n8n (sin credenciales)
├── BITACORA_IA.md                    <-- Bitácora de 5 registros de decisiones y prompts de IA
├── README.md                         <-- Documentación técnica completa
├── .gitignore                        <-- Exclusión de temporales, build y dependencias
├── backend/
│   ├── .env                          <-- Variables de entorno (PORT=4000)
│   ├── package.json                  <-- Dependencias (better-sqlite3, express, cors, dotenv)
│   ├── init_db.js                    <-- Inicialización y verificación de restricciones
│   ├── test_api.js                   <-- Suite de pruebas de integración HTTP (10 tests)
│   └── src/
│       ├── app.js                    <-- Configuración de Express, CORS y error handler
│       ├── db.js                     <-- Conexión SQLite con PRAGMA foreign_keys = ON
│       ├── routes/                   <-- Rutas desacopladas (productos, ventas, categorias, resumen, agente)
│       ├── controllers/              <-- Controladores con códigos de estado HTTP
│       └── services/                 <-- Servicios con consultas SQL y transacciones ACID
└── frontend/
    ├── index.html                    <-- Plantilla HTML con SEO y favicon
    ├── package.json                  <-- Dependencias de React y React Router
    ├── src/
    │   ├── main.jsx                  <-- Montaje en el DOM
    │   ├── App.jsx                   <-- Enrutador con 5 vistas principales
    │   ├── index.css                 <-- Sistema de diseño en Vanilla CSS (responsivo)
    │   ├── services/api.js           <-- Cliente HTTP con manejo uniforme de errores
    │   ├── hooks/useFetch.js         <-- Custom hook para peticiones asíncronas
    │   ├── components/               <-- Navbar, StatCard, Badge, Alert, ModalConfirm, Spinner
    │   └── pages/                    <-- Dashboard, Productos, ProductoForm, Detalle, POS, Ventas, Asistente
```
