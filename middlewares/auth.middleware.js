/**
 * ============================================================================
 * MIDDLEWARES DE AUTENTICACIÓN Y AUTORIZACIÓN (JWT)
 * Módulo 8 - Lección 4: Securización de Rutas mediante Tokens Criptográficos
 * ============================================================================
 */

const { verifyToken } = require('../utils/jwt.util');
const { logAuthEvent } = require('../services/audit.service');

/**
 * Middleware para verificar la validez y expiración del token JWT
 */
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader) {
        return res.status(401).json({
            status: 'error',
            message: 'Acceso no autorizado: Token no proporcionado. Debe incluir la cabecera Authorization: Bearer <token>.'
        });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            status: 'error',
            message: 'Formato de cabecera Authorization inválido. Se espera: Bearer <token>.'
        });
    }

    const token = parts[1];

    try {
        const decoded = verifyToken(token);
        // Adjuntamos los datos decodificados del usuario en la solicitud
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            logAuthEvent({
                event: 'TOKEN_EXPIRADO',
                email: 'desconocido',
                ip: req.ip,
                success: false,
                details: 'Intento de acceso con token expirado.'
            });

            return res.status(401).json({
                status: 'error',
                code: 'TOKEN_EXPIRED',
                message: 'El token ha expirado. Por favor, vuelva a iniciar sesión para obtener un nuevo token válido.'
            });
        }

        logAuthEvent({
            event: 'TOKEN_INVALIDO',
            email: 'desconocido',
            ip: req.ip,
            success: false,
            details: `Firma o estructura inválida: ${error.message}`
        });

        return res.status(403).json({
            status: 'error',
            code: 'TOKEN_INVALID',
            message: 'Token no válido o corrupto. Acceso denegado.'
        });
    }
};

/**
 * Middleware para autorización basada en roles (RBAC)
 * @param  {...string} allowedRoles Roles permitidos para acceder a la ruta
 */
const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.rol) {
            return res.status(401).json({
                status: 'error',
                message: 'Usuario no autenticado o rol no determinado.'
            });
        }

        if (!allowedRoles.includes(req.user.rol)) {
            return res.status(403).json({
                status: 'error',
                message: `Acceso restringido: Se requiere uno de los siguientes roles: [${allowedRoles.join(', ')}]. Su rol actual es '${req.user.rol}'.`
            });
        }

        next();
    };
};

module.exports = {
    verifyJWT,
    authorizeRole
};
