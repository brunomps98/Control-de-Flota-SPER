import { DataTypes } from 'sequelize';
import { sequelize } from '../config/configServer.js';
import Usuario from './user.model.js';

// Definición del modelo de Notificación

export const Notification = sequelize.define('Notification', {
    // Atributos

    // ID de la notificación
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // ID del usuario destinatario
    user_id: { 
        type: DataTypes.INTEGER,
        allowNull: false
    },
    // Título de la notificación
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Mensaje de la notificación
    message: {
        type: DataTypes.TEXT
    },
    // Tipo de notificación (ej: info, warning, alert)
    type: {
        type: DataTypes.STRING 
    },
    // ID del recurso relacionado
    resource_id: {
        type: DataTypes.INTEGER
    },
    // Estado de lectura de la notificación
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    // Opciones del modelo
    tableName: 'notifications',
    timestamps: true,
    underscored: true 
});

// Relaciónes
Notification.belongsTo(Usuario, { foreignKey: 'user_id', as: 'recipient' });
Usuario.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

// Exportamos el modelo de notificación
export default Notification;