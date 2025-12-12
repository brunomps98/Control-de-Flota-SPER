import { DataTypes } from 'sequelize';
import { sequelize } from '../config/configServer.js';
import Usuario from './user.model.js';

// Definición del Modelo ChatRoom
const ChatRoom = sequelize.define('ChatRoom', {
    // ID de la sala de chat
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // ID del usuario asociado a la sala de chat
    user_id: {
        type: DataTypes.INTEGER,
        references: { model: 'usuarios', key: 'id' },
        allowNull: false,
        unique: true
    },
    // Último mensaje en la sala de chat
    last_message: { type: DataTypes.TEXT, allowNull: true }
}, {
    tableName: 'chat_rooms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Definición del Modelo ChatMessage
const ChatMessage = sequelize.define('ChatMessage', {
    // ID del mensaje
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // ID de la sala de chat
    room_id: {
        type: DataTypes.INTEGER,
        references: { model: 'chat_rooms', key: 'id' },
        allowNull: false
    },
    // ID del remitente
    sender_id: {
        type: DataTypes.INTEGER,
        references: { model: 'usuarios', key: 'id' },
        allowNull: false
    },
    // Contenido del mensaje
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Tipo de mensaje
    type: {
        type: DataTypes.STRING,
        defaultValue: 'text' // Puede ser texto, image, video, audio, file
    },
    // Url del archivo
    file_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Indicador de si el mensaje ha sido leído
    read: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    tableName: 'chat_messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

// Asociaciones
ChatRoom.belongsTo(Usuario, { foreignKey: 'user_id', as: 'user' });
ChatMessage.belongsTo(Usuario, { foreignKey: 'sender_id', as: 'sender' });
ChatMessage.belongsTo(ChatRoom, { foreignKey: 'room_id', as: 'room' });
Usuario.hasOne(ChatRoom, { foreignKey: 'user_id', as: 'chatRoom' });
Usuario.hasMany(ChatMessage, { foreignKey: 'sender_id', as: 'sentMessages' });
ChatRoom.hasMany(ChatMessage, { foreignKey: 'room_id', as: 'messages' });

// Exportamos los modelos
export { ChatRoom, ChatMessage };