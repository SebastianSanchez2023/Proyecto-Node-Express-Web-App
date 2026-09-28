/**
 * ============================================================================
 * CONTROLADOR DE AUTENTICACIÓN (AUTH CONTROLLER)
 * Módulo 8: Respuestas estandarizadas { status, message, data } para Auth
 * ============================================================================
 */

const authService = require('../services/auth.service');

/**
 * POST /auth/register
 */
const register = async (req, res, next) => {
    try {
        const clientIp = req.ip || req.connection.remoteAddress;
        const result = await authService.registerUser(req.body, clientIp);

        res.status(201).json({
            status: 'success',
            message: 'Usuario registrado exitosamente. Se ha generado su token JWT.',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /auth/login (y POST /login)
 */
const login = async (req, res, next) => {
    try {
        const clientIp = req.ip || req.connection.remoteAddress;
        const result = await authService.loginUser(req.body, clientIp);

        res.status(200).json({
            status: 'success',
            message: 'Autenticación exitosa. Token JWT generado correctamente.',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /auth/perfil (Ruta protegida con JWT)
 */
const getProfile = async (req, res, next) => {
    try {
        const userProfile = await authService.getAuthenticatedProfile(req.user.id);

        res.status(200).json({
            status: 'success',
            message: 'Perfil de usuario obtenido mediante autenticación JWT segura.',
            data: userProfile
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getProfile
};
