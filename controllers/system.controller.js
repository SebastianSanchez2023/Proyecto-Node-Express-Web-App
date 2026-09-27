/**
 * Controlador para la ruta de estado del servidor (/status)
 * Retorna respuesta en formato JSON con la salud del servidor
 * Formato consistente: status, message, data (según rúbrica del proyecto)
 */
const getStatus = (req, res) => {
    const uptimeSeconds = Math.floor(process.uptime());

    res.status(200).json({
        status: 'success',
        message: 'Servidor operativo y respondiendo correctamente',
        data: {
            uptime: `${uptimeSeconds} segundos`,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            nodeVersion: process.version,
            platform: process.platform,
            author: 'Sebastian',
            module: 'Módulo 6 - Primeros pasos con Node y Express'
        }
    });
};

/**
 * Controlador para la lectura de los logs guardados en archivo plano
 * Facilita la verificación y auditoría de la persistencia
 */
const fs = require('fs');
const path = require('path');

const getLogs = (req, res) => {
    const logFilePath = path.join(__dirname, '..', 'logs', 'log.txt');

    if (!fs.existsSync(logFilePath)) {
        return res.status(200).json({
            status: 'success',
            message: 'No hay registros en log.txt todavía',
            data: []
        });
    }

    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'No fue posible leer el archivo de registros',
                data: null
            });
        }

        const lines = data.trim().split('\n').filter(Boolean);
        res.status(200).json({
            status: 'success',
            message: `Se encontraron ${lines.length} registros en log.txt`,
            data: lines
        });
    });
};

module.exports = {
    getStatus,
    getLogs
};
