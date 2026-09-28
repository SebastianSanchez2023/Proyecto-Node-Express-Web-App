/**
 * ============================================================================
 * PROYECTO INTEGRADOR - MÓDULOS 6, 7 & 8: NODE, EXPRESS Y BASE DE DATOS RELACIONAL
 * Unidad: Departamento de Desarrollo Backend
 * Autor: Sebastian Sanchez
 * ============================================================================
 */

// 1. Carga de variables de entorno desde el archivo .env (dotenv)
require('dotenv').config();

// 2. Importación de módulos externos y nativos
const express = require('express');
const path = require('path');

// 3. Importación de conexión a BD y sincronización de modelos (Módulos 7 y 8)
const { testConnection } = require('./config/db.config');
const { syncDatabase } = require('./models');

// 4. Importación de documentación Swagger (Módulo 8 - PLUS)
const { setupSwagger } = require('./config/swagger.config');

// 5. Importación de middlewares personalizados y rutas modulares
const accessLogger = require('./middlewares/logger.middleware');
const mainRoutes = require('./routes/index.routes');

// 6. Inicialización de la aplicación Express
const app = express();

// 7. Configuración del puerto de escucha
const PORT = process.env.PORT || 3000;

// ============================================================================
// CONFIGURACIÓN DE MIDDLEWARES GLOBALES
// ============================================================================

// Middleware para parsear cuerpos de solicitudes en formato JSON
app.use(express.json());

// Middleware para parsear formularios URL-encoded
app.use(express.urlencoded({ extended: true }));

// Middleware personalizado para la persistencia en archivos planos (logs/log.txt)
app.use(accessLogger);

// Middleware para servir archivos estáticos del front-end interactivo desde '/public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para servir archivos subidos públicamente desde '/uploads' (Módulo 8)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de Swagger UI en la ruta /api-docs (Módulo 8 - PLUS)
setupSwagger(app);

// ============================================================================
// ENRUTAMIENTO MODULAR
// ============================================================================

// Conexión del router modular a la aplicación base
app.use('/', mainRoutes);

// Manejador para rutas no encontradas (Error 404)
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `La ruta solicitada '${req.originalUrl}' no existe en este servidor.`
    });
});

// Manejador global de errores (Error 500 / errores personalizados)
app.use((err, req, res, next) => {
    console.error('[Error Capturado]:', err.stack || err.message);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Ocurrió un error interno en el servidor.',
        detalles: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// ============================================================================
// INICIALIZACIÓN DEL SERVIDOR Y CONEXIÓN A BASE DE DATOS
// ============================================================================

const startServer = async () => {
    // 1. Probar conexión a la base de datos MySQL
    const isConnected = await testConnection();

    if (isConnected) {
        // 2. Sincronizar modelos y poblar datos semilla iniciales
        await syncDatabase();
    } else {
        console.warn(' Advertencia: El servidor arrancará, pero la base de datos no está disponible.');
    }

    // 3. Iniciar escucha HTTP
    app.listen(PORT, () => {
        console.log('Servidor iniciado');
        console.log(`[OK] Servidor escuchando en: http://localhost:${PORT}`);
        console.log(`[DOCS] Documentación Swagger UI en: http://localhost:${PORT}/api-docs`);
        console.log(`[UPLOADS] Directorio estático público en: http://localhost:${PORT}/uploads`);
        console.log(`[INFO] Modo de ejecución: ${process.env.NODE_ENV || 'development'}`);
        console.log(`[DB] MySQL host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    });
};

if (require.main === module) {
    startServer();
}

module.exports = app;
module.exports.startServer = startServer;
