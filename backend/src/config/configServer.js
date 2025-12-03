import { Sequelize } from 'sequelize';
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

// Condicional para verificar si la variable de entorno DATABASE_URL está o no en el archivo .env

if (!databaseUrl) {
    throw new Error("La variable de entorno DATABASE_URL no está definida. Revisa tu archivo .env");
}

// Creación de constante para poder conectarse a postgresql mediante Sequelize

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false, 
    
    pool: {
        max: 5,         // Máximo de conexiones simultáneas
        min: 0,         // Mínimo de conexiones (0 permite desconectar si no hay uso)
        acquire: 30000, // Tiempo máximo para intentar conectar antes de tirar error (30s)
        idle: 10000     // Tiempo máximo que una conexión puede estar inactiva (10s)
    },

    dialectOptions: { 
        ssl: {
            require: true,
            rejectUnauthorized: false 
        },
        keepAlive: true 
    }
});

// Conectamos a la DB y sino arrojamos error 

const connectToDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(` Conectado exitosamente a PostgreSQL (Supabase)`);
    } catch (error) {
        console.error(' No se pudo conectar a la base de datos:', error);
        throw error;
    }
};

export { sequelize, connectToDB };