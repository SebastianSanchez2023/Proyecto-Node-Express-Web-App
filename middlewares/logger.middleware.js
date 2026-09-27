// Importación de módulos nativos de Node.js
const fs = require('fs');
const path = require('path');

// Definición de la ruta absoluta hacia el archivo de registro dentro de la carpeta /logs
const logDirectory = path.join(__dirname, '..', 'logs');
const logFilePath = path.join(logDirectory, 'log.txt');

/**
 * Middleware para registrar cada acceso a las rutas en un archivo plano (log.txt)
 * Requisito: Módulo 6 - Lección 5 (fs.appendFile con Fecha, Hora y Ruta)
 */
const accessLogger = (req, res, next) => {
    // Obtenemos la fecha y hora actual en formato ISO y local
    const now = new Date();
    const fecha = now.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const hora = now.toTimeString().split(' ')[0]; // Formato HH:mm:ss
    const ruta = req.originalUrl || req.url;
    const metodo = req.method;

    // Estructura de línea según consigna: fecha, hora, ruta accedida (+ método HTTP)
    const logEntry = `[${fecha} ${hora}] Método: ${metodo} | Ruta: ${ruta}\n`;

    // Nos aseguramos de que el directorio /logs exista
    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, { recursive: true });
    }

    // Escritura asíncrona no bloqueante en el archivo de texto
    fs.appendFile(logFilePath, logEntry, 'utf8', (err) => {
        if (err) {
            console.error('Error al registrar acceso en log.txt:', err.message);
        }
    });

    // Continuar la ejecución hacia el siguiente middleware o controlador
    next();
};

module.exports = accessLogger;
