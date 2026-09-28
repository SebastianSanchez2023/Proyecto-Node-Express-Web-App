/**
 * ============================================================================
 * MODELO INTERMEDIO: DETALLE PEDIDO PRODUCTO (ORDER_PRODUCT) - SEQUELIZE
 * Tabla pivote para relación N:M entre Pedido y Producto
 * ============================================================================
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const OrderProduct = sequelize.define('OrderProduct', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        pedidoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'pedidos',
                key: 'id'
            }
        },
        productoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'productos',
                key: 'id'
            }
        },
        cantidad: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1
            }
        },
        precioUnitario: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        }
    }, {
        tableName: 'pedido_productos',
        timestamps: true
    });

    return OrderProduct;
};
