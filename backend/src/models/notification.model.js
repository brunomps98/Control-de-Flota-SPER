import { DataTypes } from 'sequelize';
import { sequelize } from '../config/configServer.js';
import Usuario from './user.model.js';

// Tabla con modelo de notificacion con sus atributos

export const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: { 
        type: DataTypes.INTEGER,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT
    },
    type: {
        type: DataTypes.STRING 
    },
    resource_id: {
        type: DataTypes.INTEGER
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true 
});

// Relación
Notification.belongsTo(Usuario, { foreignKey: 'user_id', as: 'recipient' });
Usuario.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

export default Notification;