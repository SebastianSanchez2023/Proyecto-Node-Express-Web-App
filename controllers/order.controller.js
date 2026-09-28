/**
 * ============================================================================
 * CONTROLADOR DE PEDIDOS (ORDER CONTROLLER)
 * Módulo 8: Endpoints RESTful para la entidad Pedido con formato { status, message, data }
 * ============================================================================
 */

const orderService = require('../services/order.service');

/**
 * GET /pedidos (y GET /api/pedidos)
 */
const getOrders = async (req, res, next) => {
    try {
        const { estado, usuarioId } = req.query;
        const orders = await orderService.getAllOrders({ estado, usuarioId });

        res.status(200).json({
            status: 'success',
            message: 'Lista de pedidos recuperada exitosamente.',
            data: {
                total: orders.length,
                pedidos: orders
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /pedidos/:id
 */
const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await orderService.getOrderById(id);

        res.status(200).json({
            status: 'success',
            message: `Detalle del pedido con ID ${id} obtenido con éxito.`,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /pedidos (Ruta protegida por JWT)
 */
const createOrder = async (req, res, next) => {
    try {
        const { descripcion, total, productos } = req.body;
        // Asignar el ID de usuario del token autenticado si no viene explícito
        const usuarioId = req.body.usuarioId || req.user.id;

        const newOrder = await orderService.createOrder({
            descripcion,
            total,
            productos,
            usuarioId
        });

        res.status(201).json({
            status: 'success',
            message: 'Pedido generado exitosamente y asociado a productos (N:M).',
            data: newOrder
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /pedidos/:id/estado (Ruta protegida por JWT)
 */
const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const updatedOrder = await orderService.updateOrderStatus(id, estado);

        res.status(200).json({
            status: 'success',
            message: `Estado del pedido ${id} actualizado a '${estado}'.`,
            data: updatedOrder
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /pedidos/:id (Ruta protegida por JWT)
 */
const deleteOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await orderService.deleteOrder(id);

        res.status(200).json({
            status: 'success',
            message: result.message,
            data: { idEliminado: result.id }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    deleteOrder
};
