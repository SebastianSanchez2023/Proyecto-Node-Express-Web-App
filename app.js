/**
 * ============================================================================
 * PROYECTO INTEGRADOR - MÓDULO 6: PRIMEROS PASOS CON NODE Y EXPRESS
 * Unidad: Departamento de Desarrollo Backend
 * Autor: Sebastian
 * ============================================================================
 */

// 1. Carga de variables de entorno desde el archivo .env (dotenv)
require('dotenv').config();

// 2. Importación de módulos externos y nativos
const express = require('express');
const path = require('path');

// 3. Importación de middlewares personalizados y rutas modulares
const accessLogger = require('./middlewares/logger.middleware');
const mainRoutes = require('./routes/index.routes');

// 4. Inicialización de la aplicación Express
const app = express();

// 5. Configuración del puerto de escucha (desde variables de entorno o fallback a 3000)
const PORT = process.env.PORT || 3000;

// ============================================================================
// CONFIGURACIÓN DE MIDDLEWARES GLOBALES
// ============================================================================

// Middleware para parsear cuerpos de solicitudes en formato JSON
app.use(express.json());

// Middleware para parsear formularios URL-encoded
app.use(express.urlencoded({ extended: true }));

// Middleware personalizado para la persistencia en archivos planos (logs/log.txt)
// Registra cada acceso registrando: fecha, hora, método y ruta accedida
app.use(accessLogger);

// Middleware para servir archivos estáticos desde el directorio '/public'
// Permite acceder a recursos como HTML, CSS, imágenes y scripts frontend
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================================
// ENRUTAMIENTO MODULAR (ROUTER EXTERNO)
// ============================================================================

// Conexión del router modular externo a la aplicación base
app.use('/', mainRoutes);

// Manejador para rutas no encontradas (Error 404)
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `La ruta solicitada '${req.originalUrl}' no existe en este servidor.`
    });
});

// Manejador global de errores internos (Error 500)
app.use((err, req, res, next) => {
    console.error('Error no controlado:', err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Ocurrió un error interno en el servidor.'
    });
});

// ============================================================================
// INICIALIZACIÓN DEL SERVIDOR
// ============================================================================

// Función que inicia el servidor e imprime el mensaje requerido por la consigna
const startServer = () => {
    app.listen(PORT, () => {
        // Mensaje requerido según Lección 2: "Servidor iniciado"
        console.log('Servidor iniciado');
        console.log(`[OK] Servidor escuchando en: http://localhost:${PORT}`);
        console.log(`[INFO] Modo de ejecución: ${process.env.NODE_ENV || 'development'}`);
    });
};

// Ejecución del inicio del servidor
startServer();

// Exportamos la app para pruebas o módulos futuros
module.exports = app;
