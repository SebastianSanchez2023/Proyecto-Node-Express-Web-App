/**
 * ============================================================================
 * SERVICIO DE AUDITORÍA Y PERSISTENCIA EN ARCHIVOS PLANOS
 * Módulos 6, 7 y 8: Registro persistente en logs/ para transacciones, auth y uploads
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');

// Asegurar que la carpeta de logs exista
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Registra eventos de autenticación (login exitoso, login fallido, registro)
 */
const logAuthEvent = ({ event, email, ip, success, details }) => {
    try {
        const filePath = path.join(logsDir, 'auth_audit.log');
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [EVENTO: ${event}] [EMAIL: ${email || 'N/A'}] [ESTADO: ${success ? 'ÉXITO' : 'FALLO'}] [IP: ${ip || '127.0.0.1'}] Detalles: ${details || 'Sin detalles'}\n`;
        fs.appendFileSync(filePath, logEntry, 'utf8');
    } catch (err) {
        console.error('Error al registrar auditoría de auth:', err.message);
    }
};

/**
 * Registra eventos de subida de archivos con Multer
 */
const logUploadEvent = ({ originalName, savedName, sizeBytes, mimeType, userId, destination }) => {
    try {
        const filePath = path.join(logsDir, 'uploads.log');
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [UPLOAD] [USUARIO ID: ${userId || 'Público'}] Archivo: ${originalName} -> Guardado como: ${savedName} | Tamaño: ${(sizeBytes / 1024).toFixed(2)} KB | Tipo: ${mimeType} | Destino: ${destination}\n`;
        fs.appendFileSync(filePath, logEntry, 'utf8');
    } catch (err) {
        console.error('Error al registrar auditoría de subida de archivo:', err.message);
    }
};

/**
 * Registra errores de transacciones abortadas (Módulo 7)
 */
const logTransactionError = ({ timestamp, error, payload }) => {
    try {
        const filePath = path.join(logsDir, 'transactions_errors.log');
        const logEntry = `[${timestamp}] ROLLBACK DE TRANSACCIÓN: ${error} | Payload: ${JSON.stringify(payload)}\n`;
        fs.appendFileSync(filePath, logEntry, 'utf8');
    } catch (err) {
        console.error('Error al registrar auditoría de transacción:', err.message);
    }
};

module.exports = {
    logAuthEvent,
    logUploadEvent,
    logTransactionError
};
