import { ChatRoom, ChatMessage } from '../models/chat.model.js';
import Usuario from '../models/user.model.js';
import { Op } from 'sequelize';
import { onlineUsers } from '../socket/onlineUsers.js';

class ChatController {

    /**
     * @summary 
     */
    static getMyRoom = async (req, res) => {
        try {
            const userId = req.user.id; 
            const [room, created] = await ChatRoom.findOrCreate({
                where: { user_id: userId },
                defaults: {
                    user_id: userId,
                    last_message: "Inicia tu consulta..."
                }
            });
            if (created) {
                console.log(`[CHAT] Nueva sala creada para el usuario ${userId}`);
            }
            const messages = await ChatMessage.findAll({
                where: { room_id: room.id },
                order: [['created_at', 'ASC']],
                include: [{
                    model: Usuario,
                    as: 'sender',
                    attributes: ['id', 'username', 'admin']
                }]
            });
            res.status(200).json({ room, messages });
        } catch (error) {
            console.error('[CHAT] Error en getMyRoom:', error);
            res.status(500).json({
                message: 'Error interno del servidor al obtener el chat',
                error: error.message
            });
        }
    }


    /**
     * @summary Obtiene TODAS las salas y usuarios para la bandeja de entrada del Admin
     * @description Devuelve dos listas: salas activas y usuarios sin sala.
     */
    static getAdminRooms = async (req, res) => {
        try {
            // OBTENER SALAS ACTIVAS
            const activeRooms = await ChatRoom.findAll({
                include: [{
                    model: Usuario,
                    as: 'user',
                    where: { admin: false }, // Asegurarnos de que solo sean chats de invitados
                    attributes: ['id', 'username', 'email', 'unidad']
                }],
                order: [
                    ['updated_at', 'DESC'] // Ordenar por el último mensaje
                ]
            });

            // Inyectar 'isOnline' a las salas activas
            const userIdsWithRooms = []; // Guardamos los IDs para excluirlos después
            const activeRoomsWithStatus = activeRooms.map(room => {
                const plainRoom = room.get({ plain: true });
                const isOnline = !!onlineUsers[plainRoom.user_id]; //
                userIdsWithRooms.push(plainRoom.user_id); // Añadir a la lista de exclusión
                return { ...plainRoom, isOnline };
            });


            // Obtener usuarios sin sala
            
            // Obtenemos los IDs de todos los admins para excluirlos
            const adminUsers = await Usuario.findAll({
                where: { admin: true },
                attributes: ['id']
            });
            const adminIds = adminUsers.map(admin => admin.id);

            // Combinamos todos los IDs a excluir (admins + usuarios que ya tienen chat)
            const allExcludedIds = [...userIdsWithRooms, ...adminIds];
            
            // Buscamos todos los usuarios que NO están en la lista de exclusión
            const newChatUsers = await Usuario.findAll({
                where: {
                    id: { [Op.notIn]: allExcludedIds }
                },
                attributes: ['id', 'username', 'email', 'unidad'], // Solo datos públicos
                order: [['username', 'ASC']] // Orden alfabético
            });

            // Inyectar 'isOnline' a los usuarios nuevos
            const newChatUsersWithStatus = newChatUsers.map(user => {
                const plainUser = user.get({ plain: true });
                const isOnline = !!onlineUsers[plainUser.id]; //
                return { ...plainUser, isOnline }; // Devolvemos el objeto de usuario
            });

            // DEVOLVER AMBAS LISTAS 
            res.status(200).json({
                activeRooms: activeRoomsWithStatus,
                newChatUsers: newChatUsersWithStatus
            });

        } catch (error) {
            console.error('[CHAT] Error en getAdminRooms:', error);
            res.status(500).json({
                message: 'Error interno del servidor al obtener las salas',
                error: error.message
            });
        }
    }

    /**
     * @summary Obtiene los mensajes de UNA sala específica (solo para Admins)
     */
    static getMessagesForRoom = async (req, res) => {
        try {
            const { roomId } = req.params;
            const room = await ChatRoom.findByPk(roomId);
            if (!room) {
                return res.status(404).json({ message: 'Sala no encontrada' });
            }
            const messages = await ChatMessage.findAll({
                where: { room_id: roomId },
                order: [['created_at', 'ASC']],
                include: [{
                    model: Usuario,
                    as: 'sender',
                    attributes: ['id', 'username', 'admin']
                }]
            });
            res.status(200).json({ room, messages });
        } catch (error) {
            console.error('[CHAT] Error en getMessagesForRoom:', error);
            res.status(500).json({
                message: 'Error interno del servidor al obtener los mensajes',
                error: error.message
            });
        }
    }


    /**
     * @summary Busca o crea una sala para un usuario específico (para Admins)
     * @description Permite a un admin iniciar un chat haciendo clic en un usuario.
     */
    static findOrCreateRoomForUser = async (req, res) => {
        const { userId } = req.body; // ID del usuario con el que el admin quiere chatear
        if (!userId) {
            return res.status(400).json({ message: "Falta el ID del usuario." });
        }

        try {
            // Buscar o crear la sala
            const [room, created] = await ChatRoom.findOrCreate({
                where: { user_id: userId },
                defaults: {
                    user_id: userId,
                    last_message: "Conversación iniciada por el admin."
                }
            });

            if (created) {
                console.log(`[CHAT] Admin ha creado una nueva sala para el usuario ${userId}`);
            }

            // Devolver la sala completa, con los datos del usuario
            const finalRoom = await ChatRoom.findByPk(room.id, {
                include: [{
                    model: Usuario,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'unidad']
                }]
            });

            //  Añadir el estado 'isOnline'
            const isOnline = !!onlineUsers[finalRoom.user_id];
            
            res.status(200).json({ ...finalRoom.get({ plain: true }), isOnline });

        } catch (error) {
            console.error('[CHAT] Error en findOrCreateRoomForUser:', error);
            res.status(500).json({ message: 'Error al crear o buscar la sala.' });
        }
    }
}

export default ChatController;