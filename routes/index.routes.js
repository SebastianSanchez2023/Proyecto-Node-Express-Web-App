/**
 * ============================================================================
 * ENRUTADOR PRINCIPAL CENTRALIZADO (INDEX ROUTES)
 * Módulos 6, 7 y 8: Integración modular de rutas de Auth, Usuarios, Pedidos y Uploads
 * ============================================================================
 */

const express = require('express');
const router = express.Router();

// Controladores base (Módulo 6)
const { getHome } = require('../controllers/home.controller');
const { getStatus, getLogs } = require('../controllers/system.controller');

// Sub-rutas modulares (Módulos 7 y 8)
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const orderRoutes = require('./order.routes');
const uploadRoutes = require('./upload.routes');

// Rutas Generales de Presentación y Estado del Servidor
router.get('/', getHome);
router.get('/status', getStatus);
router.get('/logs', getLogs);

// Rutas de la API RESTful (Módulo 8)
// Disponibles con prefijo /api/ y también directas para máxima compatibilidad
router.use('/api/auth', authRoutes);
router.use('/auth', authRoutes);

router.use('/api/usuarios', userRoutes);
router.use('/usuarios', userRoutes);

router.use('/api/pedidos', orderRoutes);
router.use('/pedidos', orderRoutes);

router.use('/api/upload', uploadRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
