/**
 * ============================================================================
 * RUTAS DE ACCESO Y GESTIÓN DE USUARIOS (USER ROUTES)
 * Módulo 7 & 8: CRUD, Relaciones ORM, Transacciones y Rutas Protegidas con JWT
 * ============================================================================
 */

const express = require('express');
const router = express.Router();

const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    executeTransaction,
    getUsersWithRelations,
    getComparisonSqlVsOrm
} = require('../controllers/user.controller');

const { uploadAvatar } = require('../controllers/upload.controller');
const { handleUpload } = require('../config/multer.config');
const { verifyJWT, authorizeRole } = require('../middlewares/auth.middleware');

// ============================================================================
// RUTAS PÚBLICAS
// ============================================================================

// 1. Comparativa técnica SQL manual vs ORM (Debe ir antes de :id)
router.get('/comparativa-sql-orm', getComparisonSqlVsOrm);

// 2. Consulta con relaciones completas 1:1, 1:N y N:M con Eager Loading
router.get('/relaciones', getUsersWithRelations);

// 3. Transaccionalidad ACID con opción de forzar Rollback
router.post('/transaccion', executeTransaction);

// 4. Listar usuarios (soporta filtros ?nombre=, ?rol=, ?page=, ?limit=)
router.get('/', getUsers);

// 5. Obtener usuario por ID con perfil y pedidos
router.get('/:id', getUserById);

// 6. Crear nuevo usuario (Registro público o desde panel)
router.post('/', createUser);

// ============================================================================
// RUTAS PRIVADAS Y PROTEGIDAS MEDIANTE JWT (Módulo 8 - Lección 4)
// ============================================================================

// 7. Modificación controlada de campos (Protegida con JWT)
router.put('/:id', verifyJWT, updateUser);

// 8. Eliminación de usuario (Protegida con JWT y rol admin)
router.delete('/:id', verifyJWT, authorizeRole('admin'), deleteUser);

// 9. Carga de foto de perfil / avatar y vinculación a BD (Módulo 8 Lección 3 + PLUS)
router.post('/:id/avatar', verifyJWT, handleUpload('archivo'), uploadAvatar);

module.exports = router;
