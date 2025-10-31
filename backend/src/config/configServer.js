import { Sequelize } from 'sequelize';
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("La variable de entorno DATABASE_URL no está definida. Revisa tu archivo .env");
}

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false, 
    
    dialectOptions: { 
        ssl: {
            require: true,
            rejectUnauthorized: false 
        }
    }
});

const connectToDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`✅ Conectado exitosamente a PostgreSQL (Supabase)`);
    } catch (error) {
        console.error('❌ No se pudo conectar a la base de datos:', error);
        throw error;
    }
};

export { sequelize, connectToDB };