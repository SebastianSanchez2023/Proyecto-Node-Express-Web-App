/**
 * ============================================================================
 * INICIALIZACIÓN DE MODELOS Y ASOCIACIONES (ORM SEQUELIZE)
 * Módulo 7 & 8: Sincronización, Relaciones (1:1, 1:N, N:M) y Migración de Semillas
 * ============================================================================
 */

const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db.config');
const defineUser = require('./user.model');
const defineProfile = require('./profile.model');
const defineOrder = require('./order.model');
const defineProduct = require('./product.model');
const defineOrderProduct = require('./orderProduct.model');

// Instanciación de modelos
const User = defineUser(sequelize);
const Profile = defineProfile(sequelize);
const Order = defineOrder(sequelize);
const Product = defineProduct(sequelize);
const OrderProduct = defineOrderProduct(sequelize);

// ============================================================================
// ASOCIACIONES DEL ORM
// ============================================================================

// 1. RELACIÓN 1:1: Un Usuario tiene un Perfil, un Perfil pertenece a un Usuario
User.hasOne(Profile, {
    foreignKey: 'usuarioId',
    as: 'perfil',
    onDelete: 'CASCADE'
});
Profile.belongsTo(User, {
    foreignKey: 'usuarioId',
    as: 'usuario'
});

// 2. RELACIÓN 1:N: Un Usuario tiene muchos Pedidos, un Pedido pertenece a un Usuario
User.hasMany(Order, {
    foreignKey: 'usuarioId',
    as: 'pedidos',
    onDelete: 'CASCADE'
});
Order.belongsTo(User, {
    foreignKey: 'usuarioId',
    as: 'usuario'
});

// 3. RELACIÓN N:M: Un Pedido tiene muchos Productos y un Producto puede estar en muchos Pedidos
Order.belongsToMany(Product, {
    through: OrderProduct,
    as: 'productos',
    foreignKey: 'pedidoId'
});
Product.belongsToMany(Order, {
    through: OrderProduct,
    as: 'pedidos',
    foreignKey: 'productoId'
});

// Función idempotente para migrar y asegurar datos semilla de los Módulos 6, 7 y 8
const seedInitialData = async () => {
    try {
        console.log(' [Seed] Verificando integridad de esquemas, relaciones y usuarios...');

        // 1. Asegurar contraseñas con hash Bcrypt real para usuarios preexistentes
        const existingUsers = await User.scope('withPassword').findAll();
        for (const u of existingUsers) {
            if (!u.password.startsWith('$2a$') && !u.password.startsWith('$2b$')) {
                const defaultPass = u.rol === 'admin' ? 'AdminPassword123!' : 'ClientePassword123!';
                u.password = defaultPass; // El hook beforeUpdate o save lo hasheará
                await u.save();
                console.log(` [Seed] Contraseña hasheada con Bcrypt para usuario ID ${u.id} (${u.email})`);
            }
        }

        // 2. Asegurar que exista el usuario Administrador canónico (admin@alkemy.com)
        let adminUser = await User.findOne({ where: { email: 'admin@alkemy.com' } });
        if (!adminUser) {
            adminUser = await User.create({
                nombre: 'Sebastián Sánchez (Admin)',
                email: 'admin@alkemy.com',
                password: 'AdminPassword123!',
                rol: 'admin',
                estado: true,
                avatar: '/uploads/avatar-admin.png'
            });
            console.log(' [Seed] Usuario admin@alkemy.com creado.');
        }

        // 3. Asegurar que exista usuario Cliente canónico (lucia@example.com)
        let clienteUser = await User.findOne({ where: { email: 'lucia@example.com' } });
        if (!clienteUser) {
            clienteUser = await User.create({
                nombre: 'Lucía Fernández',
                email: 'lucia@example.com',
                password: 'ClientePassword123!',
                rol: 'cliente',
                estado: true,
                avatar: '/uploads/avatar-lucia.png'
            });
            console.log(' [Seed] Usuario lucia@example.com creado.');
        }

        // 4. Asegurar que cada usuario tenga su Perfil (Relación 1:1)
        const allUsers = await User.findAll({ include: [{ model: Profile, as: 'perfil' }] });
        for (const u of allUsers) {
            if (!u.perfil) {
                await Profile.create({
                    usuarioId: u.id,
                    biografia: u.rol === 'admin' ? 'Líder Técnico Backend & Arquitecto Cloud' : 'Desarrollador y usuario de la plataforma.',
                    telefono: '+56 9 1234 5678',
                    direccion: 'Av. Providencia 1234, Santiago, Chile',
                    avatar: u.avatar || '/uploads/default-avatar.png'
                });
                console.log(` [Seed] Perfil 1:1 inicializado para usuario ID ${u.id}`);
            }
        }

        // 5. Asegurar catálogo de productos para relación N:M
        let p1 = await Product.findOne({ where: { nombre: 'Licencia Servidor Backend Cloud Pro' } });
        if (!p1) {
            p1 = await Product.create({
                nombre: 'Licencia Servidor Backend Cloud Pro',
                categoria: 'Infraestructura Cloud',
                precio: 199.99,
                stock: 50
            });
            await Product.create({
                nombre: 'Suscripción Anual Base de Datos MySQL',
                categoria: 'Bases de Datos',
                precio: 89.50,
                stock: 100
            });
            await Product.create({
                nombre: 'Consultoría Técnica de Arquitectura Modular',
                categoria: 'Servicios Profesionales',
                precio: 350.00,
                stock: 20
            });
            await Product.create({
                nombre: 'Certificado de Seguridad SSL & JWT Enterprise',
                categoria: 'Ciberseguridad',
                precio: 49.99,
                stock: 200
            });
            console.log(' [Seed] Catálogo de productos para relación N:M inicializado.');
        }

        // 6. Asegurar pedidos para usuarios y asociar a productos (Relación 1:N y N:M)
        const orders = await Order.findAll({ include: [{ model: Product, as: 'productos' }] });
        if (orders.length === 0) {
            const o1 = await Order.create({
                numeroPedido: 'PED-2026-001',
                descripcion: 'Pack Infraestructura Cloud y Seguridad',
                total: 249.98,
                estado: 'pagado',
                usuarioId: adminUser.id
            });
            await OrderProduct.create({
                pedidoId: o1.id,
                productoId: p1.id,
                cantidad: 1,
                precioUnitario: p1.precio
            });
            console.log(' [Seed] Pedido inicial con productos (N:M) creado.');
        } else {
            // Verificar si algún pedido carece de productos asociados
            for (const ord of orders) {
                if (!ord.productos || ord.productos.length === 0) {
                    await OrderProduct.create({
                        pedidoId: ord.id,
                        productoId: p1.id,
                        cantidad: 1,
                        precioUnitario: p1.precio
                    });
                }
            }
        }

        console.log(' [OK] Semillas y relaciones (1:1, 1:N, N:M) completamente validadas.');
    } catch (error) {
        console.error(' [Seed] Error al inicializar/migrar datos semilla:', error.message);
    }
};

// Sincronización de esquemas con la base de datos
const syncDatabase = async (force = false) => {
    try {
        await sequelize.sync({ force, alter: true });
        console.log(' [DB] Tablas sincronizadas correctamente en MySQL (alter: true para nuevos campos).');
        await seedInitialData();
    } catch (error) {
        console.error(' [DB] Error en la sincronización de modelos:', error.message);
    }
};

module.exports = {
    sequelize,
    User,
    Profile,
    Order,
    Product,
    OrderProduct,
    syncDatabase
};
