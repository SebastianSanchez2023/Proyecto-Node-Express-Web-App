/**
 * ============================================================================
 * SERVICIO DE AUTENTICACIÓN (AUTH SERVICE)
 * Módulo 8: Lógica de Registro, Login con JWT y Criptografía con Bcrypt
 * ============================================================================
 */

const { User, Profile, Order } = require('../models');
const { generateToken } = require('../utils/jwt.util');
const { logAuthEvent } = require('./audit.service');

/**
 * Registro de un nuevo usuario en el sistema
 */
const registerUser = async ({ nombre, email, password, rol = 'cliente', biografia, telefono, direccion }, clientIp) => {
    // Validar existencia previa de correo
    const existing = await User.findOne({ where: { email } });
    if (existing) {
        const error = new Error(`El correo electrónico '${email}' ya se encuentra registrado.`);
        error.statusCode = 409;
        throw error;
    }

    // Creación del usuario (el hook de Sequelize aplicará el hash bcrypt automáticamente)
    const newUser = await User.create({
        nombre,
        email,
        password,
        rol,
        estado: true
    });

    // Crear perfil asociado (Relación 1:1)
    await Profile.create({
        usuarioId: newUser.id,
        biografia: biografia || 'Nuevo miembro de la plataforma.',
        telefono: telefono || null,
        direccion: direccion || null,
        avatar: '/uploads/default-avatar.png'
    });

    // Generar token JWT para el usuario recién registrado
    const tokenPayload = {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol
    };
    const token = generateToken(tokenPayload);

    // Registro de auditoría en archivo plano
    logAuthEvent({
        event: 'REGISTRO_EXITOSO',
        email: newUser.email,
        ip: clientIp,
        success: true,
        details: `Usuario registrado con rol '${newUser.rol}' y perfil inicializado.`
    });

    return {
        usuario: {
            id: newUser.id,
            nombre: newUser.nombre,
            email: newUser.email,
            rol: newUser.rol,
            estado: newUser.estado,
            createdAt: newUser.createdAt
        },
        token,
        tokenType: 'Bearer'
    };
};

/**
 * Inicio de sesión y verificación de credenciales con bcrypt
 */
const loginUser = async ({ email, password }, clientIp) => {
    if (!email || !password) {
        const error = new Error('Debe proporcionar tanto correo electrónico como contraseña.');
        error.statusCode = 400;
        throw error;
    }

    // Buscar usuario incluyendo la contraseña mediante el scope especializado
    const user = await User.scope('withPassword').findOne({
        where: { email },
        include: [{ model: Profile, as: 'perfil' }]
    });

    if (!user) {
        logAuthEvent({
            event: 'LOGIN_FALLIDO',
            email,
            ip: clientIp,
            success: false,
            details: 'Correo electrónico no encontrado en la base de datos.'
        });

        const error = new Error('Credenciales inválidas: Correo o contraseña incorrectos.');
        error.statusCode = 401;
        throw error;
    }

    if (!user.estado) {
        const error = new Error('La cuenta de usuario se encuentra inactiva. Contacte al administrador.');
        error.statusCode = 403;
        throw error;
    }

    // Verificación segura de la contraseña con bcrypt
    const isPasswordValid = user.validPassword(password);
    if (!isPasswordValid) {
        logAuthEvent({
            event: 'LOGIN_FALLIDO',
            email,
            ip: clientIp,
            success: false,
            details: 'Contraseña incorrecta ingresada.'
        });

        const error = new Error('Credenciales inválidas: Correo o contraseña incorrectos.');
        error.statusCode = 401;
        throw error;
    }

    // Generar token JWT firmado
    const tokenPayload = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
    };
    const token = generateToken(tokenPayload);

    // Registro de auditoría
    logAuthEvent({
        event: 'LOGIN_EXITOSO',
        email: user.email,
        ip: clientIp,
        success: true,
        details: `Inicio de sesión exitoso. Token emitido.`
    });

    return {
        usuario: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            estado: user.estado,
            avatar: user.avatar,
            perfil: user.perfil
        },
        token,
        tokenType: 'Bearer'
    };
};

/**
 * Obtener perfil completo del usuario autenticado (con 1:1 y 1:N)
 */
const getAuthenticatedProfile = async (userId) => {
    const user = await User.findByPk(userId, {
        include: [
            { model: Profile, as: 'perfil' },
            { model: Order, as: 'pedidos' }
        ]
    });

    if (!user) {
        const error = new Error('Usuario autenticado no encontrado en los registros.');
        error.statusCode = 404;
        throw error;
    }

    return user;
};

module.exports = {
    registerUser,
    loginUser,
    getAuthenticatedProfile
};
