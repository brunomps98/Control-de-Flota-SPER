// Configuracion para conectar a la base de datos SQL con Sequelize

import { Sequelize } from 'sequelize';
import dotenv from "dotenv";

dotenv.config();

// Leemos las variables de entorno de PostgreSQL
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;

// 1. Creamos la instancia de Sequelize
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'postgres',
    logging: false,
    dialectOptions: { 
        ssl: {
            require: true,
            rejectUnauthorized: false 
        }
    }
});

// 2. Creamos una función para conectar y autenticar
const connectToDB = async () => {
    try {
        await sequelize.authenticate();
        // Hacemos el log dinámico con el nombre de tu DB de Neon
        console.log(`✅ Conectado exitosamente a PostgreSQL (${dbName})`);
    } catch (error) {
        console.error('❌ No se pudo conectar a la base de datos:', error);
        throw error;
    }
};

// 3. Exportamos la instancia de sequelize y la función de conexión
export { sequelize, connectToDB };