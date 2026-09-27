# Reflexiones Técnicas y Decisiones de Diseño
**Proyecto:** Node & Express Web App (Módulo 6)  
**Institución:** Alkemy  
**Alumno:** Sebastián Sánchez  
**Repositorio GitHub:** [https://github.com/SebastianSanchez2023/Proyecto-Node-Express-Web-App](https://github.com/SebastianSanchez2023/Proyecto-Node-Express-Web-App)  

---

## 1. Justificación del Nombre del Archivo Principal (`app.js`)
Se optó por utilizar **`app.js`** en lugar de `index.js` como nombre base del archivo principal del proyecto.
- **Razón técnica:** `app.js` explicita que allí se concentra la definición, configuración y ensamble de la aplicación Express (middlewares, enrutamiento y configuraciones globales).
- **Escalabilidad y Testing:** Esta convención facilita que en etapas posteriores (Módulos 7 y 8) o en entornos de prueba con librerías como *Supertest* o *Jest*, se pueda exportar la instancia de `app` sin necesidad de levantar el servidor HTTP en red, permitiendo crear si se desea un archivo separado `server.js` como punto de entrada de escucha.

---

## 2. Estructura Modular de Carpetas (5 Capas)
Siguiendo las pautas de arquitectura limpia del ecosistema Node.js, el proyecto fue segmentado en al menos 5 directorios bien definidos:

1. **`routes/` (`index.routes.js`):** Desacopla la declaración de endpoints del archivo raíz mediante `express.Router()`.
2. **`controllers/` (`home.controller.js`, `system.controller.js`):** Centraliza la lógica de control y generación de respuestas, manteniendo los controladores puros y reutilizables.
3. **`middlewares/` (`logger.middleware.js`):** Funciones intermedias que interceptan peticiones (en este caso, persistencia y trazabilidad de accesos).
4. **`public/` (`css/style.css`, `index.html`):** Contenido estático servido de forma nativa mediante el middleware `express.static()`.
5. **`logs/` (`log.txt`):** Persistencia en archivos planos separada del código fuente de la aplicación.

**Beneficio futuro:** Esta modularización permite que en las siguientes entregas se añadan carpetas como `models/`, `services/` y `config/` sin alterar la estructura existente.

---

## 3. Persistencia en Archivos Planos (`fs.appendFile`)
Para cumplir con el almacenamiento simple de datos sin base de datos:
- Se implementó una función middleware que captura cada solicitud entrante antes de que llegue a los controladores.
- Se utilizó el método asíncrono no bloqueante **`fs.appendFile()`**, asegurando que las operaciones de lectura/escritura en disco no congelen el *Event Loop* de Node.js ni degraden el tiempo de respuesta del servidor.
- Cada registro almacena la fecha, la hora exacta, el método HTTP y la ruta solicitada en formato estructurado:
  `[YYYY-MM-DD HH:mm:ss] Método: GET | Ruta: /status`.

---

## 4. Gestión de Scripts en `package.json`
- **`npm start` (`node app.js`):** Script optimizado para ejecución estándar y despliegue productivo, sin la sobrecarga de herramientas de monitoreo en memoria.
- **`npm run dev` (`nodemon app.js`):** Script esencial para la experiencia de desarrollo (DX), que observa cambios en archivos `.js` y `.json` y reinicia el servidor en caliente automáticamente.

---

## 5. Configuración de Variables de Entorno (`dotenv`)
El uso de `dotenv` permitió desacoplar la configuración del código fuente:
- Se configuró la variable `PORT=3001` para prevenir colisiones con puertos comunes (como el 3000 que se encontraba ocupado por otros procesos locales).
- Se proporcionó un archivo `.env.example` en el repositorio para que cualquier desarrollador pueda clonar el proyecto y configurarlo en un solo paso.
