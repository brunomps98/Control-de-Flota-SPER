import { DataTypes } from 'sequelize';
import { sequelize } from '../config/configServer.js'; 
import bcrypt from 'bcryptjs';

// Creamos el modelo de Usuario

const Usuario = sequelize.define('Usuario', {
    // Definición de columnas

    // ID de usuario
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Nombre de usuario
    username: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    // Correo electrónico
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    // Contraseña
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    // Nombre de la unidad asignada al usuario
    unidad: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    // Columna FCM Token
    fcm_token: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    // Foto de perfil
    profile_picture: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
    },
    // Roles y permisos de usuario (¿Es admin o no?)
    admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // Establecimientos
    up1: { type: DataTypes.BOOLEAN, defaultValue: false },
    up3: { type: DataTypes.BOOLEAN, defaultValue: false },
    up4: { type: DataTypes.BOOLEAN, defaultValue: false },
    up5: { type: DataTypes.BOOLEAN, defaultValue: false },
    up6: { type: DataTypes.BOOLEAN, defaultValue: false },
    up7: { type: DataTypes.BOOLEAN, defaultValue: false },
    up8: { type: DataTypes.BOOLEAN, defaultValue: false },
    up9: { type: DataTypes.BOOLEAN, defaultValue: false },
    dg: { type: DataTypes.BOOLEAN, defaultValue: false },
    inst: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    // Opciones del modelo
    tableName: 'usuarios', 
    timestamps: true,      
    createdAt: 'created_at', 
    updatedAt: 'updated_at'  
});

// Hook para hashear la contraseña antes de crear un usuario
Usuario.beforeCreate(async (usuario) => {
    if (usuario.password) {
        // Hasheamos la contraseña
        const salt = bcrypt.genSaltSync(10);
        usuario.password = bcrypt.hashSync(usuario.password, salt);
    }
});

// Exportamos el modelo
export default Usuario;