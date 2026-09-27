const express = require('express');
const router = express.Router();

// Importamos los controladores que manejan la lógica de cada endpoint
const { getHome } = require('../controllers/home.controller');
const { getStatus, getLogs } = require('../controllers/system.controller');

/**
 * Definición de Rutas Públicas (Lección 4 y Lección 6)
 */

// Ruta raíz (HTML): Servir la página web principal
router.get('/', getHome);

// Ruta de estado (JSON): Información de salud y uptime del servidor
router.get('/status', getStatus);

// Ruta auxiliar para visualizar los registros persistidos en plano (JSON)
router.get('/logs', getLogs);

module.exports = router;
