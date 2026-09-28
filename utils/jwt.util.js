/**
 * ============================================================================
 * UTILIDAD DE JSON WEB TOKENS (JWT)
 * Módulo 8: Generación y verificación criptográfica de tokens
 * ============================================================================
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_default_para_desarrollo_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

/**
 * Genera un token JWT firmado con el secret y tiempo de expiración
 * @param {Object} payload Datos a incluir en el token (id, email, rol, nombre)
 * @returns {String} Token JWT firmado
 */
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        algorithm: 'HS256'
    });
};

/**
 * Verifica y decodifica un token JWT
 * @param {String} token Token JWT en texto plano
 * @returns {Object} Payload decodificado
 */
const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

module.exports = {
    generateToken,
    verifyToken
};
