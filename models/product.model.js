/**
 * ============================================================================
 * MODELO DE DATOS: PRODUCTO (PRODUCT) - SEQUELIZE
 * Relación N:M con Pedido (Order belongsToMany Product through OrderProduct)
 * ============================================================================
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Product = sequelize.define('Product', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        nombre: {
            type: DataTypes.STRING(120),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'El nombre del producto no puede estar vacío.' }
            }
        },
        categoria: {
            type: DataTypes.STRING(60),
            allowNull: false,
            defaultValue: 'Software & Cloud'
        },
        precio: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                isDecimal: true,
                min: 0.01
            }
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 100
        }
    }, {
        tableName: 'productos',
        timestamps: true
    });

    return Product;
};
