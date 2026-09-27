const express = require('express');
const router = express.Router();

// Importamos los controladores que manejan la lógica de cada endpoint
const { getHome } = require('../controllers/home.controller');
const { getStatus, getLogs } = require('../controllers/system.controller');
const userRoutes = require('./user.routes');

/**
 * ============================================================================
 * DEFINICIÓN DE RUTAS PÚBLICAS Y MODULARES
 * Módulo 6 + Módulo 7 (Acceso a datos)
 * ============================================================================
 */

// Rutas de Módulo 6 (HTML y Sistema)
router.get('/', getHome);
router.get('/status', getStatus);
router.get('/logs', getLogs);

// Rutas de Módulo 7 (Gestión de Datos y Usuarios)
// Disponibles tanto en /usuarios como en /api/usuarios para máxima compatibilidad
router.use('/usuarios', userRoutes);
router.use('/api/usuarios', userRoutes);

module.exports = router;
