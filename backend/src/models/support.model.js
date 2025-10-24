import { DataTypes } from 'sequelize';
import { sequelize } from '../config/configServer.js';

// --- 1. Modelo Principal: Soporte ---
const Soporte = sequelize.define('Soporte', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255)
    },
    surname: {
        type: DataTypes.STRING(255)
    },
    email: {
        type: DataTypes.STRING(255)
    },
    phone: {
        type: DataTypes.STRING(50)
    },
    problem_description: {
        type: DataTypes.TEXT // Usamos TEXT para descripciones largas
    }
}, {
    tableName: 'soporte',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false // No definimos un updated_at en esta tabla
});


// --- 2. Modelo "Hijo": SoporteArchivo ---
const SoporteArchivo = sequelize.define('SoporteArchivo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    soporte_id: { // La clave foránea
        type: DataTypes.INTEGER,
        allowNull: false
    },
    url_archivo: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'soporte_archivos',
    timestamps: false 
});


// --- 3. Definición de la Relación ---
Soporte.hasMany(SoporteArchivo, {
    foreignKey: 'soporte_id', // La columna en SoporteArchivo que nos conecta
    as: 'archivos'            // Un alias para cuando consultemos
});

// "Un Archivo de Soporte PERTENECE A UN ticket de soporte"
SoporteArchivo.belongsTo(Soporte, {
    foreignKey: 'soporte_id'
});


// Exportamos AMBOS modelos
export { Soporte, SoporteArchivo };