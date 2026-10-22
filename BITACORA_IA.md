# BITÁCORA DE USO DE INTELIGENCIA ARTIFICIAL — LABORATORIO #2
## Proyecto: Sistema POS e Inventario de Cafetería ("Aroma & Código")
**Estudiante:** Desarrollo Front End / Full Stack  
**Tecnologías:** React, Node.js, Express, SQLite (`better-sqlite3`), n8n  

---

### Registro #1: Análisis de Viabilidad y Selección del Caso de Negocio
- **Fecha:** 2026-10-22
- **Prompt enviado a la IA:**  
  *"Analiza los cinco casos propuestos en el laboratorio: Cafetería, Reservas de restaurante, Gastos compartidos, Mesa de ayuda y Tienda online. Compara su dificultad, cantidad de tablas, reglas de negocio, complejidad de las transacciones y dificultad de integrar el agente de IA. Recomienda el caso más apropiado para completar un prototipo funcional en dos sesiones de seis horas."*
- **Respuesta y propuesta de la IA:**  
  La IA comparó los 5 casos en una matriz de complejidad y recomendó el **Caso #1 (Punto de Venta e Inventario de Cafetería)**. Argumentó que modela de manera intuitiva las relaciones 1:N y N:M, permite demostrar una transacción crítica real (venta cabecera + detalle + descuento de inventario con rollback por stock insuficiente) y facilita la integración de un Agente IA para alertas de inventario y promociones.
- **Pruebas y verificación realizada:**  
  Revisé la rúbrica del laboratorio. Verifiqué que el caso de la cafetería cubre holgadamente las 3 tablas requeridas, el endpoint de métricas calculadas con SQL y el contrato `{ ok, data, error }`.
- **Decisión y conclusiones adoptadas:**  
  Acepté la recomendación del Caso #1. Descarté la tienda online por exceso de tablas para 12 horas, y el sistema de reservas porque el manejo de solapamiento de horarios en SQL suele ser propenso a errores en tiempo limitado.

---

### Registro #2: Selección del Motor y Controlador de SQLite (`better-sqlite3`)
- **Fecha:** 2026-10-22
- **Prompt enviado a la IA:**  
  *"Diseña el modelo relacional en SQLite para la cafetería. ¿Qué controlador de SQLite deberíamos usar en Node.js que sea fácil de mantener y defender sin callbacks anidados?"*
- **Respuesta y propuesta de la IA:**  
  La IA propuso usar `better-sqlite3` en lugar del clásico `sqlite3`. Explicó que `better-sqlite3` ejecuta consultas de forma sincrónica y limpia en el hilo de Node.js, elimina el infierno de callbacks ("callback hell") y cuenta con el método nativo `db.transaction()` que maneja `BEGIN`, `COMMIT` y `ROLLBACK` de manera automática y segura ante cualquier excepción.
- **Pruebas y verificación realizada:**  
  Se ejecutó un script de prueba `init_db.js` que intentó violar restricciones `CHECK(precio > 0)`, `CHECK(stock >= 0)` y claves foráneas. El motor lanzó las excepciones esperadas y rechazó los datos corruptos de forma inmediata.
- **Decisión y conclusiones adoptadas:**  
  Se adoptó `better-sqlite3` como la única estrategia de acceso a datos para todo el backend. Se configuró `PRAGMA foreign_keys = ON;` al inicio de cada conexión para garantizar la integridad referencial.

---

### Registro #3: Arquitectura por Capas y Transacciones Atómicas (ACID)
- **Fecha:** 2026-10-22
- **Prompt enviado a la IA:**  
  *"Construye el backend con Node.js y Express usando arquitectura por capas (rutas, controladores, servicios). Implementa una transacción para registrar ventas que descuente el stock y haga rollback si no hay unidades suficientes, devolviendo HTTP 409 Conflict."*
- **Respuesta y propuesta de la IA:**  
  La IA organizó el código en capas desacopladas: rutas delegando a controladores, controladores gestionando la petición/respuesta HTTP, y servicios encapsulando las consultas SQL con sentencias parametrizadas. Implementó `db.transaction()` en `ventaService.js` para asegurar que la inserción de la cabecera, los ítems y la reducción de stock ocurran en un bloque 'todo o nada'.
- **Pruebas y verificación realizada:**  
  Creamos una suite automatizada `test_api.js` con 10 pruebas de integración. En la prueba #9, intentamos comprar 9,999 unidades de un producto con stock 18. Verificamos que el servidor respondió con HTTP 409 Conflict y que en la base de datos NO se creó ninguna fila huérfana en la tabla `ventas`, ni se alteró el stock original.
- **Decisión y conclusiones adoptadas:**  
  La arquitectura modular demostró ser robusta y fácil de auditar. Se estandarizó el formato de error `{ error: mensaje }` en toda la aplicación y se configuró el puerto 4000 para evitar conflictos con otros servicios locales.

---

### Registro #4: Desarrollo del Frontend en React, Custom Hook `useFetch` y Control de Estado
- **Fecha:** 2026-10-22
- **Prompt enviado a la IA:**  
  *"Diseña el frontend en React con Vite y React Router. Crea un custom hook useFetch que gestione estados de carga, error y refetch. Implementa formularios controlados con validaciones y una vista de Punto de Venta (POS) en tiempo real usando CSS puro sin librerías externas."*
- **Respuesta y propuesta de la IA:**  
  La IA implementó el hook `useFetch` con una función de limpieza para prevenir fugas de memoria al desmontar componentes. Desarrolló un sistema de diseño propio en `index.css` con variables CSS para la paleta de la cafetería (tonos café, ámbar y crema). Creó vistas dedicadas: Dashboard con métricas SQL, Catálogo con búsqueda/filtros, Formulario controlado para altas/ediciones, Detalle del producto y Pantalla de Punto de Venta (POS) con cálculo reactivo de totales.
- **Pruebas y verificación realizada:**  
  Se ejecutó `npm run build` en el frontend, transformando los 38 módulos con éxito en 259ms sin errores de sintaxis ni tipos. Se verificó que al intentar enviar productos con precio negativo o stock vacío, las validaciones del cliente impiden el envío, y que si el servidor responde con 409 o 400, los mensajes se despliegan en componentes `Alert` controlados.
- **Decisión y conclusiones adoptadas:**  
  Se descartó Tailwind en favor de Vanilla CSS para mantener el control total del estilo sin dependencias adicionales. Se centralizó la comunicación HTTP en `services/api.js` para desacoplar los componentes de la URL base del servidor.

---

### Registro #5: Integración del Agente de Inteligencia Artificial con n8n y Contrato de Respuesta
- **Fecha:** 2026-10-22
- **Prompt enviado a la IA:**  
  *"Construye el workflow de n8n con Webhook, validación de entrada, AI Agent con Google Gemini / OpenAI, herramientas HTTP Request para consultar el inventario real y Respond to Webhook. Exporta el workflow en JSON sin credenciales y estandariza la respuesta bajo el contrato { ok, data, error }."*
- **Respuesta y propuesta de la IA:**  
  La IA estructuró un workflow con 8 nodos en n8n: el Webhook recibe la petición en modo 'Using Respond to Webhook Node', un nodo Code valida que la consulta no venga vacía (emitiendo HTTP 400 con `{ ok: false, data: null, error }` si falta información), y el AI Agent analiza el stock crítico usando Gemini o OpenAI, con la herramienta 'Consultar Inventario API' conectada a `GET http://localhost:4000/api/productos`.
- **Pruebas y verificación realizada:**  
  Exportamos el workflow a `workflow_n8n.json` y creamos un endpoint de respaldo en Express (`POST /api/agente-ia`) para validar el contrato. Probamos una consulta vacía y obtuvimos HTTP 400 con `{ ok: false, data: null, error: "La consulta es obligatoria..." }`. Probamos una consulta de reabastecimiento y recibimos HTTP 200 con `{ ok: true, data: { mensaje: "..." }, error: null }` identificando con precisión los productos con stock crítico (Muffin y Croissant).
- **Decisión y conclusiones adoptadas:**  
  Se garantizó que el archivo JSON del workflow esté 100% desprovisto de claves API privadas para salvaguardar la seguridad del proyecto y permitir que cualquier evaluador importe el flujo en su propia instancia de n8n con sus propias credenciales.



