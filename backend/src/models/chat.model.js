import { DataTypes } from 'sequelize';
import { sequelize } from '../config/configServer.js';
import Usuario from './user.model.js'; // Importa el modelo de Usuario

// 1. Definición del Modelo ChatRoom
const ChatRoom = sequelize.define('ChatRoom', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // El 'dueño' de la sala (el invitado)
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'usuarios', // Referencia a la *tabla* 'usuarios'
            key: 'id'
        },
        allowNull: false,
        unique: true // Un invitado solo puede tener UNA sala
    },
    // Para mostrar una vista previa en la lista de chats del admin
    last_message: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'chat_rooms',
    timestamps: true, // 'createdAt' y 'updatedAt'
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
    // A qué sala pertenece
    room_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'chat_rooms', // Referencia a la *tabla* 'chat_rooms'
            key: 'id'
        },
        allowNull: false
    },
    // Quién envió el mensaje (puede ser el invitado O un admin)
    sender_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'usuarios', // Referencia a la *tabla* 'usuarios'
            key: 'id'
        },
        allowNull: false
    },
    // El contenido del mensaje
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    // Para el "visto"
    read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'chat_messages',
    timestamps: true, // 'createdAt'
    createdAt: 'created_at',
    updatedAt: false // Generalmente no se necesita 'updatedAt' en mensajes
});


// --- 3. ASOCIACIONES CONSOLIDADAS ---
// (Para evitar errores de dependencia circular)

// Relaciones "hijo a padre" (belongsTo)
ChatRoom.belongsTo(Usuario, { foreignKey: 'user_id', as: 'user' });
ChatMessage.belongsTo(Usuario, { foreignKey: 'sender_id', as: 'sender' });
ChatMessage.belongsTo(ChatRoom, { foreignKey: 'room_id', as: 'room' });

// Relaciones "padre a hijo" (hasOne / hasMany)
Usuario.hasOne(ChatRoom, { foreignKey: 'user_id', as: 'chatRoom' });
Usuario.hasMany(ChatMessage, { foreignKey: 'sender_id', as: 'sentMessages' });
ChatRoom.hasMany(ChatMessage, { foreignKey: 'room_id', as: 'messages' });

// --- FIN DE LAS ASOCIACIONES ---

export { ChatRoom, ChatMessage };