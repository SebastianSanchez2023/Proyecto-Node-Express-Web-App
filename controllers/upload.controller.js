/**
 * ============================================================================
 * CONTROLADOR DE SUBIDA DE ARCHIVOS (UPLOAD CONTROLLER)
 * Módulo 8 - Lección 3: Multer, validación y asociación con Base de Datos
 * ============================================================================
 */

const { User, Profile } = require('../models');
const { logUploadEvent } = require('../services/audit.service');

/**
 * POST /upload (o POST /api/upload)
 * Subida general de archivos con persistencia física en uploads/ y log plano
 */
const uploadSingleFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No se envió ningún archivo en la petición. Debe usar el campo "archivo".'
            });
        }

        const file = req.file;
        const fileUrl = `/uploads/${file.filename}`;

        // Registrar evento de subida en archivo plano logs/uploads.log
        logUploadEvent({
            originalName: file.originalname,
            savedName: file.filename,
            sizeBytes: file.size,
            mimeType: file.mimetype,
            userId: req.user ? req.user.id : null,
            destination: file.destination
        });

        res.status(201).json({
            status: 'success',
            message: 'Archivo subido y procesado exitosamente en el servidor.',
            data: {
                nombreOriginal: file.originalname,
                nombreGuardado: file.filename,
                mimetype: file.mimetype,
                tamanoBytes: file.size,
                tamanoKb: (file.size / 1024).toFixed(2),
                urlPublica: fileUrl
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/upload/avatar (o POST /api/usuarios/:id/avatar)
 * TAREA PLUS: Asociar el archivo subido a un registro en la base de datos (foto de usuario)
 */
const uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No se envió ninguna imagen. Debe usar el campo "archivo" o "avatar".'
            });
        }

        // Determinar ID del usuario: desde parámetro :id o desde el usuario autenticado (JWT)
        const targetUserId = req.params.id || (req.user ? req.user.id : null);

        if (!targetUserId) {
            return res.status(400).json({
                status: 'error',
                message: 'No se especificó el usuario al cual asociar la imagen de avatar.'
            });
        }

        const user = await User.findByPk(targetUserId, {
            include: [{ model: Profile, as: 'perfil' }]
        });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: `Usuario con ID ${targetUserId} no encontrado para asociar el archivo.`
            });
        }

        const fileUrl = `/uploads/${req.file.filename}`;

        // 1. Actualizar el campo avatar en el modelo User
        user.avatar = fileUrl;
        await user.save();

        // 2. Actualizar también en el modelo Profile (Relación 1:1) si existe
        if (user.perfil) {
            user.perfil.avatar = fileUrl;
            await user.perfil.save();
        }

        // Registrar auditoría en archivo plano
        logUploadEvent({
            originalName: req.file.originalname,
            savedName: req.file.filename,
            sizeBytes: req.file.size,
            mimeType: req.file.mimetype,
            userId: user.id,
            destination: req.file.destination
        });

        res.status(200).json({
            status: 'success',
            message: `Avatar actualizado exitosamente y vinculado al registro del usuario ID ${user.id} en la base de datos.`,
            data: {
                usuarioId: user.id,
                nombre: user.nombre,
                avatarUrl: fileUrl,
                archivo: {
                    nombreOriginal: req.file.originalname,
                    nombreGuardado: req.file.filename,
                    tamanoKb: (req.file.size / 1024).toFixed(2)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadSingleFile,
    uploadAvatar
};
