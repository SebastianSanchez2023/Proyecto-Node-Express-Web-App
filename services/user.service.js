/**
 * ============================================================================
 * CAPA DE SERVICIO: GESTIÓN DE USUARIOS Y DATOS (USER SERVICE)
 * Módulos 6, 7 y 8: Lógica de negocio, CRUD, Transacciones ACID, Relaciones 1:1, 1:N y N:M
 * ============================================================================
 */

const { Op, QueryTypes } = require('sequelize');
const { sequelize, User, Profile, Order, Product } = require('../models');
const { logTransactionError } = require('./audit.service');

/**
 * 1. Obtener usuarios con soporte de filtrado dinámico y paginación
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
        include: [
            {
                model: Profile,
                as: 'perfil',
                attributes: ['biografia', 'telefono', 'direccion', 'avatar']
            },
            {
                model: Order,
                as: 'pedidos',
                attributes: ['id', 'numeroPedido', 'descripcion', 'total', 'estado']
            }
        ],
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
 * 2. Obtener un usuario por ID con perfil (1:1), pedidos (1:N) y productos (N:M)
 */
const getUserById = async (id) => {
    const user = await User.findByPk(id, {
        include: [
            {
                model: Profile,
                as: 'perfil'
            },
            {
                model: Order,
                as: 'pedidos',
                include: [
                    {
                        model: Product,
                        as: 'productos',
                        through: { attributes: ['cantidad', 'precioUnitario'] }
                    }
                ]
            }
        ]
    });

    if (!user) {
        const error = new Error(`El usuario con ID ${id} no existe.`);
        error.statusCode = 404;
        throw error;
    }
    return user;
};

/**
 * 3. Crear usuario y su perfil asociado (Relación 1:1)
 */
const createUser = async (userData) => {
    const { nombre, email, password, rol, biografia, telefono, direccion } = userData;
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

    const nuevoUsuario = await User.create({
        nombre,
        email,
        password,
        rol: rol || 'cliente',
        estado: true
    });

    // Crear perfil 1:1
    await Profile.create({
        usuarioId: nuevoUsuario.id,
        biografia: biografia || 'Nuevo miembro en el sistema.',
        telefono: telefono || null,
        direccion: direccion || null,
        avatar: '/uploads/default-avatar.png'
    });

    return await getUserById(nuevoUsuario.id);
};

/**
 * 4. Actualización selectiva y controlada
 * Lección 3: Solo se permite modificar ciertos campos para preservar integridad
 */
const updateUser = async (id, updateData) => {
    const user = await getUserById(id);

    // Campos permitidos para actualización controlada
    const allowedFields = ['nombre', 'rol', 'estado', 'avatar'];
    const fieldsToUpdate = {};

    allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
            fieldsToUpdate[field] = updateData[field];
        }
    });

    if (Object.keys(fieldsToUpdate).length === 0) {
        const error = new Error('No se enviaron campos válidos para actualizar. Campos permitidos: nombre, rol, estado, avatar.');
        error.statusCode = 400;
        throw error;
    }

    await user.update(fieldsToUpdate);
    return user;
};

/**
 * 5. Eliminación con validación previa de existencia
 */
const deleteUser = async (id) => {
    const user = await getUserById(id);
    await user.destroy();
    return { id: parseInt(id, 10), message: 'Usuario y sus registros asociados eliminados satisfactoriamente.' };
};

/**
 * 6. Operación transaccional atómica (ACID) con Rollback asegurado
 */
const registerUserWithOrderTransaction = async ({ usuario, pedido, forceError = false }) => {
    const t = await sequelize.transaction();

    try {
        console.log('[Transacción Iniciada] Creando usuario y pedido inicial...');

        // Acción 1: Crear Usuario
        const nuevoUsuario = await User.create({
            nombre: usuario.nombre,
            email: usuario.email,
            password: usuario.password || 'PasswordSeguro123!',
            rol: usuario.rol || 'cliente'
        }, { transaction: t });

        // Crear Perfil 1:1 dentro de la transacción
        await Profile.create({
            usuarioId: nuevoUsuario.id,
            biografia: 'Perfil autogenerado en transacción.',
            avatar: '/uploads/default-avatar.png'
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

        // Registro en archivo plano de transacciones fallidas
        logTransactionError({
            timestamp: new Date().toISOString(),
            error: error.message,
            payload: { usuario, pedido, forceError }
        });

        const err = new Error(`Transacción revertida (Rollback aplicado): ${error.message}`);
        err.statusCode = 400;
        err.details = error.message;
        throw err;
    }
};

/**
 * 7. Consulta con relaciones completas: 1:1 (Perfil), 1:N (Pedidos) y N:M (Productos)
 * Demuestra Eager Loading con include anidado
 */
const getUsersWithFullRelations = async () => {
    return await User.findAll({
        include: [
            {
                model: Profile,
                as: 'perfil',
                attributes: ['biografia', 'telefono', 'direccion', 'avatar']
            },
            {
                model: Order,
                as: 'pedidos',
                attributes: ['id', 'numeroPedido', 'descripcion', 'total', 'estado', 'createdAt'],
                include: [
                    {
                        model: Product,
                        as: 'productos',
                        through: { attributes: ['cantidad', 'precioUnitario'] }
                    }
                ]
            }
        ],
        order: [['id', 'ASC']]
    });
};

/**
 * 8. Comparación de resultados entre SQL manual y ORM Sequelize
 */
const compareSqlVsOrm = async () => {
    const startSql = process.hrtime();
    const sqlResults = await sequelize.query(
        'SELECT id, nombre, email, rol, estado, createdAt FROM usuarios ORDER BY id ASC',
        { type: QueryTypes.SELECT }
    );
    const [secondsSql, nanosSql] = process.hrtime(startSql);
    const durationSqlMs = (secondsSql * 1000 + nanosSql / 1e6).toFixed(2);

    const startOrm = process.hrtime();
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
    getUsersWithOrders: getUsersWithFullRelations,
    getUsersWithFullRelations,
    compareSqlVsOrm
};
