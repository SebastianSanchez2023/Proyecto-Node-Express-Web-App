/**
 * ============================================================================
 * MODELO DE DATOS: PEDIDO (ORDER) - SEQUELIZE
 * Lección 6: Manejo de Relaciones 1:N (Usuario tiene muchos Pedidos)
 * ============================================================================
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Order = sequelize.define('Order', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        numeroPedido: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        descripcion: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                isDecimal: true,
                min: 0.01
            }
        },
        estado: {
            type: DataTypes.ENUM('pendiente', 'pagado', 'enviado', 'cancelado'),
            defaultValue: 'pendiente',
            allowNull: false
        },
        usuarioId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'usuarios',
                key: 'id'
            }
        }
    }, {
        tableName: 'pedidos',
        timestamps: true
    });

    return Order;
};
