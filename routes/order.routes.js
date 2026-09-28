/**
 * ============================================================================
 * RUTAS DE PEDIDOS (ORDER ROUTES)
 * Módulo 8: Endpoints RESTful con métodos GET, POST, PUT, DELETE y protección JWT
 * ============================================================================
 */

const express = require('express');
const router = express.Router();

const {
    getOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    deleteOrder
} = require('../controllers/order.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');

// Rutas Públicas de Consulta
router.get('/', getOrders);
router.get('/:id', getOrderById);

// Rutas Privadas Protegidas con Token JWT
router.post('/', verifyJWT, createOrder);
router.put('/:id/estado', verifyJWT, updateOrderStatus);
router.delete('/:id', verifyJWT, deleteOrder);

module.exports = router;
