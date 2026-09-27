/**
 * ============================================================================
 * RUTAS DE ACCESO Y GESTIÓN DE USUARIOS (USER ROUTES)
 * Módulo 7: Endpoints CRUD, Transaccionalidad, Relaciones y ORM
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

// 1. Lección 5: Comparativa técnica SQL manual vs ORM (Debe ir antes de :id)
router.get('/comparativa-sql-orm', getComparisonSqlVsOrm);

// 2. Lección 6: Consulta con relaciones 1:N (Usuario -> Pedidos con include)
router.get('/relaciones', getUsersWithRelations);

// 3. Lección 4: Transaccionalidad ACID con opción de forzar Rollback
router.post('/transaccion', executeTransaction);

// 4. Lección 2: Obtener todos los usuarios (excluye passwords, soporta ?nombre= & ?rol= & ?page=)
router.get('/', getUsers);

// 5. Obtener usuario por ID
router.get('/:id', getUserById);

// 6. Crear nuevo usuario
router.post('/', createUser);

// 7. Lección 3: Modificación controlada de campos
router.put('/:id', updateUser);

// 8. Lección 3: Eliminación con validación previa de existencia
router.delete('/:id', deleteUser);

module.exports = router;
