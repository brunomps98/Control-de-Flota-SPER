import { DataTypes } from 'sequelize';
import { sequelize } from '../config/configServer.js';

// Modelo de soporte 
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
        type: DataTypes.TEXT 
    }
}, {
    tableName: 'soporte',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false 
});


// Modelo Hijo: SoporteArchivo 
const SoporteArchivo = sequelize.define('SoporteArchivo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    soporte_id: { 
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


// Definición de la Relación 
Soporte.hasMany(SoporteArchivo, {
    foreignKey: 'soporte_id', 
    as: 'archivos'           
});

// "Un Archivo de Soporte PERTENECE A UN ticket de soporte"
SoporteArchivo.belongsTo(Soporte, {
    foreignKey: 'soporte_id'
});


// Exportamos AMBOS modelos
export { Soporte, SoporteArchivo };