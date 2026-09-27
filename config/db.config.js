/**
 * ============================================================================
 * CONFIGURACIÓN DE CONEXIÓN A BASE DE DATOS - SEQUELIZE ORM (MYSQL)
 * Lección 1: Conexión segura con variables de entorno y logs de confirmación
 * ============================================================================
 */

const { Sequelize } = require('sequelize');

// Variables de entorno cargadas desde .env
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 3306;
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'modulo7_db';
const dbDialect = process.env.DB_DIALECT || 'mysql';

// Instanciación de Sequelize con pool de conexiones optimizado
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: dbDialect,
    logging: process.env.NODE_ENV === 'development' ? (msg) => console.log(`[SQL Log] ${msg}`) : false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: true,
        underscored: false
    }
});

// Función para testear y autenticar la conexión a la base de datos
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log(' Conexión a la base de datos MySQL establecida exitosamente.');
        console.log(` Base de datos: ${dbName} | Servidor: ${dbHost}:${dbPort}`);
        return true;
    } catch (error) {
        console.error(' Error crítico al conectar con la base de datos MySQL:', error.message);
        return false;
    }
};

module.exports = {
    sequelize,
    testConnection
};
