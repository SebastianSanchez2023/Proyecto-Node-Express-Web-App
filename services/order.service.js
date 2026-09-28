/**
 * ============================================================================
 * SERVICIO DE GESTIÓN DE PEDIDOS Y PRODUCTOS (ORDER SERVICE)
 * Módulo 7 y 8: CRUD de Pedidos, Relación 1:N con Usuario y N:M con Productos
 * ============================================================================
 */

const { Order, User, Product, OrderProduct, sequelize } = require('../models');

/**
 * Obtener todos los pedidos con soporte de filtros
 */
const getAllOrders = async ({ estado, usuarioId }) => {
    const where = {};
    if (estado) where.estado = estado;
    if (usuarioId) where.usuarioId = usuarioId;

    return await Order.findAll({
        where,
        include: [
            {
                model: User,
                as: 'usuario',
                attributes: ['id', 'nombre', 'email', 'avatar']
            },
            {
                model: Product,
                as: 'productos',
                through: { attributes: ['cantidad', 'precioUnitario'] }
            }
        ],
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Obtener pedido por ID con detalles y productos anidados
 */
const getOrderById = async (id) => {
    const order = await Order.findByPk(id, {
        include: [
            {
                model: User,
                as: 'usuario',
                attributes: ['id', 'nombre', 'email', 'rol']
            },
            {
                model: Product,
                as: 'productos',
                through: { attributes: ['cantidad', 'precioUnitario'] }
            }
        ]
    });

    if (!order) {
        const error = new Error(`El pedido con ID ${id} no existe.`);
        error.statusCode = 404;
        throw error;
    }

    return order;
};

/**
 * Crear un nuevo pedido vinculando productos (Relación N:M transaccional)
 */
const createOrder = async ({ descripcion, total, productos = [], usuarioId }) => {
    const t = await sequelize.transaction();

    try {
        const userExists = await User.findByPk(usuarioId);
        if (!userExists) {
            const err = new Error(`El usuario con ID ${usuarioId} no existe para asignarle el pedido.`);
            err.statusCode = 404;
            throw err;
        }

        const numeroPedido = `PED-${Date.now().toString().slice(-6)}`;

        // Crear el pedido
        const newOrder = await Order.create({
            numeroPedido,
            descripcion,
            total: total || 0,
            estado: 'pendiente',
            usuarioId
        }, { transaction: t });

        // Asociar productos si fueron enviados (Relación N:M)
        if (productos && productos.length > 0) {
            for (const item of productos) {
                const prod = await Product.findByPk(item.productoId);
                if (prod) {
                    await OrderProduct.create({
                        pedidoId: newOrder.id,
                        productoId: prod.id,
                        cantidad: item.cantidad || 1,
                        precioUnitario: prod.precio
                    }, { transaction: t });
                }
            }
        }

        await t.commit();
        return await getOrderById(newOrder.id);
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

/**
 * Actualizar estado de un pedido
 */
const updateOrderStatus = async (id, nuevoEstado) => {
    const validStates = ['pendiente', 'pagado', 'enviado', 'cancelado'];
    if (!validStates.includes(nuevoEstado)) {
        const error = new Error(`Estado inválido. Valores permitidos: ${validStates.join(', ')}.`);
        error.statusCode = 400;
        throw error;
    }

    const order = await Order.findByPk(id);
    if (!order) {
        const error = new Error(`Pedido con ID ${id} no encontrado.`);
        error.statusCode = 404;
        throw error;
    }

    order.estado = nuevoEstado;
    await order.save();

    return order;
};

/**
 * Eliminar un pedido
 */
const deleteOrder = async (id) => {
    const order = await Order.findByPk(id);
    if (!order) {
        const error = new Error(`Pedido con ID ${id} no existe.`);
        error.statusCode = 404;
        throw error;
    }

    await order.destroy();
    return { id, message: `Pedido ${id} eliminado correctamente.` };
};

module.exports = {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    deleteOrder
};
