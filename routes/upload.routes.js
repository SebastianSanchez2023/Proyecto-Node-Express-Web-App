/**
 * ============================================================================
 * RUTAS DE SUBIDA DE ARCHIVOS (UPLOAD ROUTES)
 * Módulo 8 - Lección 3: Multer y asociación con base de datos
 * ============================================================================
 */

const express = require('express');
const router = express.Router();

const { uploadSingleFile, uploadAvatar } = require('../controllers/upload.controller');
const { handleUpload } = require('../config/multer.config');
const { verifyJWT } = require('../middlewares/auth.middleware');

// Subida general de archivo (Pública o con token opcional)
router.post('/', handleUpload('archivo'), uploadSingleFile);

// Subida de avatar y asociación a usuario autenticado (Protegida con JWT)
router.post('/avatar', verifyJWT, handleUpload('archivo'), uploadAvatar);

module.exports = router;
