/**
 * ============================================================================
 * CAPA DE SERVICIO: GESTIÓN DE USUARIOS Y DATOS (USER SERVICE)
 * Lecciones 2, 3, 4, 5 y 6: Lógica de negocio, CRUD, Transacciones ACID y ORM
 * ============================================================================
 */

const { Op, QueryTypes } = require('sequelize');
const { sequelize, User, Order } = require('../models');
const fs = require('fs');
const path = require('path');

const transactionLogPath = path.join(__dirname, '..', 'logs', 'transactions_errors.log');

/**
 * Función auxiliar para registrar transacciones fallidas en archivo plano
 * Requerimiento PLUS de Lección 4
 */
const logFailedTransaction = (errorDetail, payload) => {
    try {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const logEntry = `[${timestamp}] [TRANSACTION ROLLBACK] Error: ${errorDetail} | Payload: ${JSON.stringify(payload)}\n`;
        fs.appendFileSync(transactionLogPath, logEntry);
    } catch (err) {
        console.error('Error al escribir en transactions_errors.log:', err);
    }
};

/**
 * 1. Obtener usuarios con soporte de filtrado dinámico y paginación
 * Lección 2 (Requerimiento base y Tarea PLUS)
 */
const getAllUsers = async ({ nombre, rol, page = 1, limit = 10 }) => {
    const whereClause = {};

    // Filtrado por query params (?nombre=... o ?rol=...)
    if (nombre) {
        whereClause.nombre = { [Op.like]: `%${nombre}%` };
    }
    if (rol) {
        whereClause.rol = rol;
    }

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const parsedLimit = Math.max(1, parseInt(limit, 10));

    const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        limit: parsedLimit,
        offset: offset,
        order: [['id', 'ASC']]
    });

    return {
        total: count,
        page: parseInt(page, 10),
        totalPages: Math.ceil(count / parsedLimit),
        usuarios: rows
    };
};

/**
 * 2. Obtener un usuario por ID
 */
const getUserById = async (id) => {
    const user = await User.findByPk(id);
    if (!user) {
        const error = new Error(`El usuario con ID ${id} no existe.`);
        error.statusCode = 404;
        throw error;
    }
    return user;
};

/**
 * 3. Crear usuario
 */
const createUser = async (userData) => {
    const { nombre, email, password, rol } = userData;
    if (!nombre || !email || !password) {
        const error = new Error('Los campos nombre, email y password son obligatorios.');
        error.statusCode = 400;
        throw error;
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        const error = new Error(`El email '${email}' ya está registrado.`);
        error.statusCode = 409;
        throw error;
    }

    return await User.create({
        nombre,
        email,
        password,
        rol: rol || 'cliente'
    });
};

/**
 * 4. Actualización selectiva y controlada
 * Lección 3: Solo se permite modificar ciertos campos para preservar integridad
 */
const updateUser = async (id, updateData) => {
    const user = await getUserById(id);

    // Campos permitidos para actualización controlada
    const allowedFields = ['nombre', 'rol', 'estado'];
    const fieldsToUpdate = {};

    allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
            fieldsToUpdate[field] = updateData[field];
        }
    });

    if (Object.keys(fieldsToUpdate).length === 0) {
        const error = new Error('No se enviaron campos válidos para actualizar. Campos permitidos: nombre, rol, estado.');
        error.statusCode = 400;
        throw error;
    }

    await user.update(fieldsToUpdate);
    return user;
};

/**
 * 5. Eliminación con validación previa de existencia
 * Lección 3
 */
const deleteUser = async (id) => {
    const user = await getUserById(id);
    await user.destroy();
    return { id: parseInt(id, 10), message: 'Usuario eliminado satisfactoriamente.' };
};

/**
 * 6. Operación transaccional atómica (ACID) con Rollback asegurado
 * Lección 4: Crea usuario + pedido de bienvenida en una sola transacción.
 * Si forceError es true, se fuerza un fallo para demostrar el ROLLBACK.
 */
const registerUserWithOrderTransaction = async ({ usuario, pedido, forceError = false }) => {
    const t = await sequelize.transaction();

    try {
        console.log('[Transacción Iniciada] Creando usuario y pedido inicial...');

        // Acción 1: Crear Usuario
        const nuevoUsuario = await User.create({
            nombre: usuario.nombre,
            email: usuario.email,
            password: usuario.password || 'temporal_123',
            rol: usuario.rol || 'cliente'
        }, { transaction: t });

        // Simulación de error intencional para demostrar el ROLLBACK
        if (forceError) {
            throw new Error('Error forzado para demostración de Rollback en Lección 4.');
        }

        // Acción 2: Crear Pedido Inicial asignado al usuario recién creado
        const nuevoPedido = await Order.create({
            numeroPedido: pedido?.numeroPedido || `PED-${Date.now()}`,
            descripcion: pedido?.descripcion || 'Kit de Bienvenida y Activación de Cuenta',
            total: pedido?.total || 49.99,
            estado: 'pagado',
            usuarioId: nuevoUsuario.id
        }, { transaction: t });

        // Si ambas operaciones son exitosas, confirmamos los cambios (COMMIT)
        await t.commit();
        console.log('[Transacción Confirmada - COMMIT] Usuario y pedido guardados correctamente.');

        return {
            transaccionExitosa: true,
            usuario: nuevoUsuario,
            pedido: nuevoPedido
        };
    } catch (error) {
        // En caso de cualquier error, revertimos todas las operaciones (ROLLBACK)
        await t.rollback();
        console.error('[Transacción Revertida - ROLLBACK] Causa del fallo:', error.message);

        // Registro en archivo plano de transacciones fallidas (Tarea PLUS Lección 4)
        logFailedTransaction(error.message, { usuario, pedido, forceError });

        const err = new Error(`Transacción revertida (Rollback aplicado): ${error.message}`);
        err.statusCode = 400;
        err.details = error.message;
        throw err;
    }
};

/**
 * 7. Consulta con relaciones 1:N (Eager Loading con 'include')
 * Lección 6: Devuelve los usuarios junto con sus pedidos en una sola consulta
 */
const getUsersWithOrders = async () => {
    return await User.findAll({
        include: [
            {
                model: Order,
                as: 'pedidos',
                attributes: ['id', 'numeroPedido', 'descripcion', 'total', 'estado', 'createdAt']
            }
        ],
        order: [['id', 'ASC']]
    });
};

/**
 * 8. Comparación de resultados entre SQL manual y ORM Sequelize
 * Lección 5: Comparativa técnica de ejecución
 */
const compareSqlVsOrm = async () => {
    const startSql = process.hrtime();
    // 1. Consulta SQL manual nativa
    const sqlResults = await sequelize.query(
        'SELECT id, nombre, email, rol, estado, createdAt FROM usuarios ORDER BY id ASC',
        { type: QueryTypes.SELECT }
    );
    const [secondsSql, nanosSql] = process.hrtime(startSql);
    const durationSqlMs = (secondsSql * 1000 + nanosSql / 1e6).toFixed(2);

    const startOrm = process.hrtime();
    // 2. Consulta a través de los métodos del ORM Sequelize
    const ormResults = await User.findAll({
        order: [['id', 'ASC']]
    });
    const [secondsOrm, nanosOrm] = process.hrtime(startOrm);
    const durationOrmMs = (secondsOrm * 1000 + nanosOrm / 1e6).toFixed(2);

    return {
        resumenComparativo: {
            cantidadRegistros: ormResults.length,
            duracionSqlManual: `${durationSqlMs} ms`,
            duracionOrmSequelize: `${durationOrmMs} ms`,
            metodoSql: 'sequelize.query (SELECT directo con QueryTypes.SELECT)',
            metodoOrm: 'User.findAll() con abstracción de modelos y scopes automáticos'
        },
        muestraSql: sqlResults.slice(0, 2),
        muestraOrm: ormResults.slice(0, 2)
    };
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    registerUserWithOrderTransaction,
    getUsersWithOrders,
    compareSqlVsOrm
};
