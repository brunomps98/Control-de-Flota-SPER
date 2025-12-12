import { DataTypes } from 'sequelize';
import { sequelize } from '../config/configServer.js';

// Creamos el modelo de soporte principal (el modelo padre)
const Soporte = sequelize.define('Soporte', {
    // Definición de los campos del modelo
    // Campos basicos de informacion del usuario que solicita soporte

    // ID unico de cada ticket de soporte
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Nombre del usuario que solicita soporte
    name: {
        type: DataTypes.STRING(255)
    },
    // Apellido del usuario que solicita soporte
    surname: {
        type: DataTypes.STRING(255)
    },
    // Email del usuario que solicita soporte
    email: {
        type: DataTypes.STRING(255)
    },
    // Telefono del usuario que solicita soporte
    phone: {
        type: DataTypes.STRING(50)
    },
    // Descripcion del problema reportado
    problem_description: {
        type: DataTypes.TEXT
    }
}, {
    // Configuraciones del modelo
    tableName: 'soporte',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});


// Modelo Hijo: SoporteArchivo 
const SoporteArchivo = sequelize.define('SoporteArchivo', {
    // Definición de los campos del modelo

    // ID unico de cada archivo adjunto
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // ID del ticket de soporte al que pertenece el archivo
    soporte_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    // URL o ruta del archivo adjunto
    url_archivo: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    // Configuraciones del modelo
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


// Exportamos ambos modelos
export { Soporte, SoporteArchivo };