/**
 * ============================================================================
 * INICIALIZACIÓN DE MODELOS Y ASOCIACIONES
 * Lecciones 1, 2, 5 y 6: Sincronización, Relaciones y Carga de Datos Iniciales (Seed)
 * ============================================================================
 */

const { sequelize } = require('../config/db.config');
const defineUser = require('./user.model');
const defineOrder = require('./order.model');

// Instanciación de modelos
const User = defineUser(sequelize);
const Order = defineOrder(sequelize);

// ============================================================================
// ASOCIACIONES (RELACIÓN 1:N) - LECCIÓN 6
// Un Usuario tiene muchos Pedidos (1:N)
// Un Pedido pertenece a un Usuario (N:1)
// ============================================================================
User.hasMany(Order, {
    foreignKey: 'usuarioId',
    as: 'pedidos',
    onDelete: 'CASCADE'
});

Order.belongsTo(User, {
    foreignKey: 'usuarioId',
    as: 'usuario'
});

// Función para poblar la base de datos con al menos 3 usuarios iniciales simulados
const seedInitialData = async () => {
    try {
        const count = await User.count();
        if (count === 0) {
            console.log(' Inicializando datos semilla (seed)...');
            
            // Creamos 3 usuarios iniciales (Lección 2)
            const u1 = await User.create({
                nombre: 'Sebastián Sánchez',
                email: 'seba.sanchez@example.com',
                password: 'hash_super_seguro_123',
                rol: 'admin',
                estado: true
            });

            const u2 = await User.create({
                nombre: 'Lucía Fernández',
                email: 'lucia.fernandez@example.com',
                password: 'hash_super_seguro_456',
                rol: 'cliente',
                estado: true
            });

            const u3 = await User.create({
                nombre: 'Carlos Mendoza',
                email: 'carlos.mendoza@example.com',
                password: 'hash_super_seguro_789',
                rol: 'operador',
                estado: true
            });

            // Creamos pedidos asociados para demostrar la relación 1:N (Lección 6)
            await Order.bulkCreate([
                {
                    numeroPedido: 'PED-2026-001',
                    descripcion: 'Licencia Servidor Backend Cloud Pro',
                    total: 199.99,
                    estado: 'pagado',
                    usuarioId: u1.id
                },
                {
                    numeroPedido: 'PED-2026-002',
                    descripcion: 'Suscripción Anual Base de Datos Relacional',
                    total: 89.50,
                    estado: 'pendiente',
                    usuarioId: u1.id
                },
                {
                    numeroPedido: 'PED-2026-003',
                    descripcion: 'Consultoría Técnica de Arquitectura Modular',
                    total: 350.00,
                    estado: 'pagado',
                    usuarioId: u2.id
                }
            ]);

            console.log(' [OK] Datos semilla creados con éxito: 3 usuarios y 3 pedidos.');
        }
    } catch (error) {
        console.error(' Error al inicializar datos semilla:', error.message);
    }
};

// Sincronización de esquemas con la base de datos
const syncDatabase = async (force = false) => {
    try {
        await sequelize.sync({ force });
        console.log(' Tablas sincronizadas correctamente en MySQL.');
        await seedInitialData();
    } catch (error) {
        console.error(' Error en la sincronización de modelos:', error.message);
    }
};

module.exports = {
    sequelize,
    User,
    Order,
    syncDatabase
};
