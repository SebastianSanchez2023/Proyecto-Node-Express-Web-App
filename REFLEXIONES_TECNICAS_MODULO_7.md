# Reflexiones Técnicas y Decisiones de Diseño — Módulo 7
**Proyecto:** Node & Express Web App (Parte 2: Acceso a Datos Relacionales con ORM)  
**Institución:** Alkemy / Duoc UC  
**Autor:** Sebastián Sánchez  
**Stack Tecnológico:** Node.js, Express.js, MySQL 8.0, Sequelize ORM, Dotenv, fs  
**Repositorio GitHub:** [https://github.com/SebastianSanchez2023/Proyecto-Node-Express-Web-App](https://github.com/SebastianSanchez2023/Proyecto-Node-Express-Web-App)  

---

## 1. Conexión a la Base de Datos y Protección de Credenciales (Lección 1)

### 1.1. Elección del Cliente de Conexión y ORM (Sequelize + mysql2)
Se eligió **Sequelize** junto con el driver nativo de alto rendimiento **`mysql2`** por los siguientes motivos técnicos:
- **Abstracción y Portabilidad:** Sequelize permite definir modelos mediante clases y objetos JavaScript, abstrayendo la sintaxis SQL específica del motor subyacente. Si en el futuro se migra de MySQL a PostgreSQL, MariaDB o SQLite, la lógica de negocio permanece intacta.
- **Gestión Avanzada de Conexiones (Connection Pooling):** `mysql2` y Sequelize implementan un grupo de conexiones reutilizables (`pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }`), lo que optimiza la latencia y previene la sobrecarga del servidor de base de datos ante picos de concurrencia.
- **Seguridad contra Inyección SQL:** Al utilizar consultas parametrizadas internamente en todos sus métodos (`findAll`, `create`, `update`), se anula el riesgo de vulnerabilidades de tipo *SQL Injection*.

### 1.2. Estrategia de Protección de Datos Sensibles
Para garantizar la confidencialidad según las mejores prácticas de la industria (OWASP):
1. **Aislamiento de Credenciales:** Todas las variables de acceso al motor (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) se gestionan mediante el módulo `dotenv` y se configuran en el archivo `.env`.
2. **Protección en Git:** El archivo `.env` se encuentra explícitamente ignorado en `.gitignore`. Se provee únicamente `.env.example` con valores de plantilla desprovistos de contraseñas reales.
3. **Exclusión Automática de Contraseñas (Scopes de Sequelize):** En el modelo `User`, se configuró un `defaultScope` con `attributes: { exclude: ['password'] }`. De este modo, cualquier consulta a la base de datos omite el hash de contraseña por defecto, impidiendo su exposición en respuestas HTTP JSON.

---

## 2. Consulta y Modificación Controlada de Datos (Lecciones 2 y 3)

### 2.1. ¿Por qué actualizar únicamente ciertos campos en `PUT /usuarios/:id`?
En la ruta de actualización se restringió la modificación a una lista blanca (*whitelist*) conformada exclusivamente por: `['nombre', 'rol', 'estado']`.
- **Prevención de Atacantes (Mass Assignment Vulnerability):** Si se permitiera actualizar directamente `req.body`, un usuario malintencionado podría sobreescribir campos críticos como `id`, `email`, fechas de auditoría (`createdAt`) o la propia contraseña sin el debido flujo de reautenticación o hashing.
- **Inmutabilidad de Identificadores:** El `id` y el `email` actúan como claves únicas del negocio y no deben mutar a través de un endpoint estándar de actualización de perfil.

### 2.2. Validaciones Aplicadas para Evitar Errores e Inconsistencias
- **Validación de Identificador Numérico y Existencia Previa:** Tanto en `PUT` como en `DELETE`, se ejecuta una búsqueda por clave primaria (`findByPk`). Si el registro no existe, se retorna un código `404 Not Found` con mensaje descriptivo, evitando ejecuciones nulas o errores 500 no controlados.
- **Validación de Esquema a Nivel de Modelo:** Se implementaron validadores nativos de Sequelize:
  - `isEmail: true` para verificar el formato sintáctico del correo.
  - `unique: true` con manejo de duplicados.
  - `len: [2, 100]` para el nombre.
- **Manejo Estandarizado de Códigos de Estado HTTP:**
  - `200 OK`: Consultas y modificaciones exitosas.
  - `201 Created`: Registros y transacciones creadas exitosamente.
  - `400 Bad Request`: Parámetros inválidos o intento de actualizar sin campos permitidos.
  - `404 Not Found`: Recurso no encontrado.
  - `409 Conflict`: Correo electrónico duplicado.

---

## 3. Transaccionalidad y Consistencia ACID (Lección 4)

### 3.1. Caso de Uso Implementado
Se diseñó un flujo atómico en `POST /usuarios/transaccion` que realiza dos operaciones dependientes y secuenciales:
1. **Acción 1:** Creación del registro de `Usuario`.
2. **Acción 2:** Creación de un `Pedido` o suscripción de bienvenida vinculado al `id` del usuario recién generado (`usuarioId`).

### 3.2. Garantía de Rollback ante Fallos
- Ambas acciones se ejecutan dentro del contexto de una transacción de Sequelize (`await sequelize.transaction()`).
- Si cualquier paso falla (o si se envía el parámetro `forceError: true` para demostración académica), el bloque `catch` ejecuta de manera estricta `await t.rollback()`.
- **Resultado:** La base de datos no retiene datos huérfanos (por ejemplo, un usuario creado sin su pedido inicial o viceversa), preservando las propiedades **Atomicity** y **Consistency** del estándar ACID.
- **Auditoría en Archivo Plano (Tarea PLUS):** Cada transacción abortada registra automáticamente la fecha, hora, error y carga útil (*payload*) en `logs/transactions_errors.log` para permitir análisis forense y auditoría operativa.

---

## 4. Comparativa Técnica: SQL Manual vs. ORM Sequelize (Lección 5)

| Criterio | SQL Manual (`sequelize.query`) | ORM Sequelize (`User.findAll()`) |
| :--- | :--- | :--- |
| **Productividad y Mantenibilidad** | Requiere escribir strings SQL manuales. Si cambia un nombre de columna, se deben buscar y editar múltiples archivos. | Los modelos centralizan la estructura. Los cambios se propagan de manera natural en todo el proyecto. |
| **Prevención de Errores** | Errores de sintaxis solo se descubren en tiempo de ejecución. | Validación semántica, métodos fuertemente testeados y tipado implícito. |
| **Seguridad** | Exige sanitizar variables manualmente para evitar SQL Injection. | Parametrización y escape automático de valores en todos los métodos. |
| **Relaciones y Carga Anidada** | Requiere sentencias `JOIN` complejas y mapeo manual de filas a estructuras de objetos anidados. | Carga elegante mediante `include: [{ model: ... }]` (Eager Loading automático). |
| **Rendimiento Puro** | Ligeramente más rápido en microsegundos al no procesar capas de abstracción. | Sobrecarga mínima imperceptible para el 99% de las aplicaciones web modernas. |

**Conclusión:** El uso del ORM Sequelize aporta una ventaja abrumadora en mantenibilidad, velocidad de desarrollo, seguridad y legibilidad del código frente a consultas tradicionales.

---

## 5. Manejo de Relaciones 1:N y Eager Loading (Lección 6)

### 5.1. Modelado de la Relación
Se estableció una relación uno a muchos (**1:N**) entre las entidades `Usuario` y `Pedido`:
```javascript
// models/index.js
User.hasMany(Order, { foreignKey: 'usuarioId', as: 'pedidos', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'usuarioId', as: 'usuario' });
```
- **Integridad Referencial:** Se configuró `onDelete: 'CASCADE'` para que la eliminación de un usuario mantenga la integridad referencial en la base de datos eliminando en cascada sus pedidos dependientes.

### 5.2. Eager Loading con `include`
En el endpoint `GET /usuarios/relaciones`:
- Sequelize ejecuta una consulta optimizada (`LEFT OUTER JOIN pedidos ON usuarios.id = pedidos.usuarioId`).
- Transforma automáticamente los registros planos en una estructura de objetos JSON donde cada usuario contiene un array anidado con sus pedidos (`pedidos: [...]`).
- **Visualización en Front-End (Tarea PLUS):** En `public/index.html` se implementó una interfaz gráfica con tabla dinámica que permite visualizar visualmente los usuarios junto a sus pedidos anidados.

---

## 6. Arquitectura Modular y Escalabilidad (Módulos 6, 7 y 8)

El proyecto evoluciona de manera desacoplada en capas:
1. **`config/`**: Inicialización del motor y conexión a la base de datos (`db.config.js`).
2. **`models/`**: Definición de esquemas, validaciones, scopes y relaciones (`user.model.js`, `order.model.js`).
3. **`services/`**: Lógica de negocio pura, transacciones ACID y consultas ORM (`user.service.js`).
4. **`controllers/`**: Manejo de peticiones HTTP, extracción de parámetros y respuestas estandarizadas (`user.controller.js`).
5. **`routes/`**: Desacoplamiento de rutas de la API (`user.routes.js`, `index.routes.js`).
6. **`middlewares/`**: Funciones intermedias (logger en `log.txt`, control de errores globales).
7. **`public/`**: Recursos estáticos (HTML5, CSS3, JavaScript interactivo).
8. **`logs/`**: Auditoría en archivos planos (`log.txt`, `transactions_errors.log`).

Esta arquitectura deja el backend completamente preparado para la **Parte 3 (Módulo 8)**, donde se incorporará autenticación segura mediante **JWT**, middleware de protección de rutas y subida de archivos con **Multer**.
