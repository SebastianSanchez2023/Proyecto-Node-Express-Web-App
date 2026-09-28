/**
 * ============================================================================
 * RUTAS DE AUTENTICACIÓN (AUTH ROUTES)
 * Módulo 8 - Lección 4: Endpoints públicos de login/registro y privados con JWT
 * ============================================================================
 */

const express = require('express');
const router = express.Router();

const { register, login, getProfile } = require('../controllers/auth.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');

// Rutas Públicas de Autenticación
router.post('/register', register);
router.post('/login', login);

// Ruta Privada Protegida mediante Middleware JWT
router.get('/perfil', verifyJWT, getProfile);

module.exports = router;
