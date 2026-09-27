/**
 * ============================================================================
 * CONTROLADOR DE USUARIOS Y DATOS (USER CONTROLLER)
 * Módulo 7: Manejo de solicitudes HTTP y respuestas estandarizadas
 * Formato consistente: { status, message, data }
 * ============================================================================
 */

const userService = require('../services/user.service');

/**
 * GET /usuarios
 * Lección 2: Obtener usuarios con datos sensibles excluidos y filtros opcionales
 */
const getUsers = async (req, res, next) => {
    try {
        const { nombre, rol, page, limit } = req.query;
        const result = await userService.getAllUsers({ nombre, rol, page, limit });

        res.status(200).json({
            status: 'success',
            message: 'Lista de usuarios recuperada exitosamente desde la base de datos.',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /usuarios/:id
 */
const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await userService.getUserById(id);

        res.status(200).json({
            status: 'success',
            message: `Usuario con ID ${id} recuperado correctamente.`,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /usuarios
 */
const createUser = async (req, res, next) => {
    try {
        const nuevoUsuario = await userService.createUser(req.body);

        res.status(201).json({
            status: 'success',
            message: 'Usuario registrado exitosamente en la base de datos.',
            data: nuevoUsuario
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /usuarios/:id
 * Lección 3: Modificación controlada de campos
 */
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const usuarioActualizado = await userService.updateUser(id, req.body);

        res.status(200).json({
            status: 'success',
            message: `Usuario con ID ${id} actualizado correctamente.`,
            data: usuarioActualizado
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /usuarios/:id
 * Lección 3: Eliminación con validación previa de existencia
 */
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const resultado = await userService.deleteUser(id);

        res.status(200).json({
            status: 'success',
            message: resultado.message,
            data: { idEliminado: resultado.id }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /usuarios/transaccion
 * Lección 4: Transaccionalidad ACID con simulación de rollback y log de errores
 */
const executeTransaction = async (req, res, next) => {
    try {
        const { usuario, pedido, forceError } = req.body;

        if (!usuario || !usuario.nombre || !usuario.email) {
            return res.status(400).json({
                status: 'error',
                message: 'Se requiere información básica del usuario (nombre, email) para la transacción.'
            });
        }

        const resultado = await userService.registerUserWithOrderTransaction({
            usuario,
            pedido,
            forceError: forceError === true || forceError === 'true'
        });

        res.status(201).json({
            status: 'success',
            message: 'Transacción ACID completada con éxito. Usuario y pedido atómicamente creados.',
            data: resultado
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: 'error',
            message: error.message,
            detalles: error.details || null,
            registroArchivo: 'Fallo registrado en logs/transactions_errors.log para auditoría.'
        });
    }
};

/**
 * GET /usuarios-con-relaciones
 * Lección 6: Consulta con relaciones 1:N utilizando include
 */
const getUsersWithRelations = async (req, res, next) => {
    try {
        const usuariosConPedidos = await userService.getUsersWithOrders();

        res.status(200).json({
            status: 'success',
            message: 'Usuarios y sus pedidos asociados obtenidos mediante relación 1:N (Eager Loading con include).',
            data: {
                totalUsuarios: usuariosConPedidos.length,
                usuarios: usuariosConPedidos
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /usuarios-comparativa-sql-orm
 * Lección 5: Comparación de resultados entre SQL manual y ORM Sequelize
 */
const getComparisonSqlVsOrm = async (req, res, next) => {
    try {
        const comparativa = await userService.compareSqlVsOrm();

        res.status(200).json({
            status: 'success',
            message: 'Comparativa de ejecución: Consulta SQL Manual vs Métodos del ORM Sequelize.',
            data: comparativa
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    executeTransaction,
    getUsersWithRelations,
    getComparisonSqlVsOrm
};
