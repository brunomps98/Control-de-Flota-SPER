import { DataTypes } from 'sequelize';
import { sequelize } from '../config/configServer.js';
import Usuario from './user.model.js'; 

// 1. Definición del Modelo ChatRoom
const ChatRoom = sequelize.define('ChatRoom', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'usuarios',
            key: 'id'
        },
        allowNull: false,
        unique: true 
    },
    last_message: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'chat_rooms',
    timestamps: true, 
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// 2. Definición del Modelo ChatMessage
const ChatMessage = sequelize.define('ChatMessage', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    room_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'chat_rooms', 
            key: 'id'
        },
        allowNull: false
    },
    sender_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'usuarios', 
            key: 'id'
        },
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false 
    },
    read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'chat_messages',
    timestamps: true, 
    createdAt: 'created_at',
    updatedAt: false 
});


// --- 3. ASOCIACIONES  ---
ChatRoom.belongsTo(Usuario, { foreignKey: 'user_id', as: 'user' });
ChatMessage.belongsTo(Usuario, { foreignKey: 'sender_id', as: 'sender' });
ChatMessage.belongsTo(ChatRoom, { foreignKey: 'room_id', as: 'room' });

Usuario.hasOne(ChatRoom, { foreignKey: 'user_id', as: 'chatRoom' });
Usuario.hasMany(ChatMessage, { foreignKey: 'sender_id', as: 'sentMessages' });
ChatRoom.hasMany(ChatMessage, { foreignKey: 'room_id', as: 'messages' });

export { ChatRoom, ChatMessage };