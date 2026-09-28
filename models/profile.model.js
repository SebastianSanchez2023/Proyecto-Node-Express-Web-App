/**
 * ============================================================================
 * MODELO DE DATOS: PERFIL (PROFILE) - SEQUELIZE
 * Relación 1:1 con Usuario (User hasOne Profile / Profile belongsTo User)
 * ============================================================================
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Profile = sequelize.define('Profile', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        biografia: {
            type: DataTypes.STRING(255),
            defaultValue: 'Desarrollador backend en formación.'
        },
        telefono: {
            type: DataTypes.STRING(30),
            allowNull: true
        },
        direccion: {
            type: DataTypes.STRING(150),
            allowNull: true
        },
        avatar: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: '/uploads/default-avatar.png'
        },
        usuarioId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true, // Garantiza unicidad para la relación 1:1
            references: {
                model: 'usuarios',
                key: 'id'
            }
        }
    }, {
        tableName: 'perfiles',
        timestamps: true
    });

    return Profile;
};
