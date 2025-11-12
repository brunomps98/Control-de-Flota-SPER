import { DataTypes } from 'sequelize';
import { sequelize } from '../config/configServer.js'; 
import bcrypt from 'bcryptjs';

// Definimos el modelo 'Usuario' que se mapea a la tabla 'usuarios'

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    unidad: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    
    // Columna FCM (¡Esta se queda!)
    fcm_token: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },

    // Roles y permisos
    admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
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
    tableName: 'usuarios', 
    timestamps: true,      
    createdAt: 'created_at', 
    updatedAt: 'updated_at'  
});


Usuario.beforeCreate(async (usuario) => {
    if (usuario.password) {
        const salt = bcrypt.genSaltSync(10);
        usuario.password = bcrypt.hashSync(usuario.password, salt);
    }
});


export default Usuario;