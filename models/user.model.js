/**
 * ============================================================================
 * MODELO DE DATOS: USUARIO (USER) - SEQUELIZE
 * Lección 5: Definición del modelo principal con validaciones
 * ============================================================================
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        nombre: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'El nombre no puede estar vacío.' },
                len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres.' }
            }
        },
        email: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: { msg: 'El correo electrónico ya se encuentra registrado.' },
            validate: {
                isEmail: { msg: 'Debe ingresar un formato de correo electrónico válido.' }
            }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'La contraseña es obligatoria.' }
            }
        },
        rol: {
            type: DataTypes.ENUM('admin', 'cliente', 'operador'),
            defaultValue: 'cliente',
            allowNull: false
        },
        estado: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
        }
    }, {
        tableName: 'usuarios',
        timestamps: true,
        // Exclusión por defecto de la contraseña para proteger datos sensibles
        defaultScope: {
            attributes: { exclude: ['password'] }
        },
        scopes: {
            // Scope opcional si se requiere validar password internamente
            withPassword: {
                attributes: { include: ['password'] }
            }
        }
    });

    return User;
};
