/**
 * ============================================================================
 * CONFIGURACIÓN DE SUBIDA DE ARCHIVOS CON MULTER
 * Módulo 8 - Lección 3: Carga, Validación de Tipos y Tamaños de Archivos
 * ============================================================================
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Directorio destino para archivos subidos
const uploadDir = path.join(__dirname, '../uploads');

// Crear la carpeta uploads automáticamente si no existe
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento en disco
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Sanitizar y generar nombre único para evitar colisiones
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        const baseName = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .substring(0, 30);
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    }
});

// Filtro de tipos de archivo permitidos (MIME types seguros)
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        const error = new Error(`Tipo de archivo no permitido: '${file.mimetype}'. Formatos soportados: JPG, PNG, WEBP, GIF, PDF.`);
        error.code = 'INVALID_FILE_TYPE';
        cb(error, false);
    }
};

// Instancia de Multer con límite de 5 Megabytes
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB máximo
    },
    fileFilter: fileFilter
});

// Middleware envoltorio para capturar errores de Multer de forma controlada
const handleUpload = (fieldName = 'archivo') => {
    const singleUpload = upload.single(fieldName);

    return (req, res, next) => {
        singleUpload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        status: 'error',
                        message: 'El archivo excede el tamaño máximo permitido de 5 MB.'
                    });
                }
                return res.status(400).json({
                    status: 'error',
                    message: `Error de carga de archivo: ${err.message}`
                });
            } else if (err) {
                return res.status(400).json({
                    status: 'error',
                    message: err.message || 'Error en la validación del archivo cargado.'
                });
            }
            next();
        });
    };
};

module.exports = {
    upload,
    handleUpload,
    uploadDir
};
