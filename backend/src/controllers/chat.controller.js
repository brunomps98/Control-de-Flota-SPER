import { ChatRoom, ChatMessage } from '../models/chat.model.js';
import Usuario from '../models/user.model.js';
import { Op } from 'sequelize';
import { onlineUsers } from '../socket/onlineUsers.js';

class ChatController {

    /**
     * @summary Obtiene la sala de chat personal de un usuario (invitado)
     * o la crea si no existe.
     * @description Esta es la función principal que llama el widget de chat
     * del invitado para inicializarse.
     */
    static getMyRoom = async (req, res) => {
        try {
            const userId = req.user.id; // Obtenemos el ID del usuario desde el token (verifyToken)

            // 1. Buscamos si el usuario ya tiene una sala
            // Usamos findOrCreate para hacerlo en un solo paso
            const [room, created] = await ChatRoom.findOrCreate({
                where: { user_id: userId },
                defaults: { // Si no existe, la crea con estos valores
                    user_id: userId,
                    last_message: "Inicia tu consulta..."
                }
            });

            // 2. Si la sala se acaba de crear, 'created' será true.
            if (created) {
                console.log(`[CHAT] Nueva sala creada para el usuario ${userId}`);
            }

            // 3. Ahora, obtenemos todos los mensajes de esa sala
            const messages = await ChatMessage.findAll({
                where: { room_id: room.id },
                order: [
                    ['created_at', 'ASC'] // Ordenamos del más antiguo al más nuevo
                ],
                include: [{
                    model: Usuario,
                    as: 'sender',
                    attributes: ['id', 'username', 'admin'] // Solo incluimos datos seguros del remitente
                }]
            });

            // 4. Devolvemos la sala y sus mensajes
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
     * @summary Obtiene TODAS las salas de chat (solo para Admins)
     * @description Devuelve una lista de todas las salas, ordenadas por
     * la más recientemente actualizada (último mensaje).
     */
    static getAdminRooms = async (req, res) => {
        try {
            const rooms = await ChatRoom.findAll({
                include: [{
                    model: Usuario,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'unidad']
                }],
                order: [
                    ['updated_at', 'DESC']
                ]
            });

            // --- Lógica de Status Online ---
            // Mapeamos las salas y añadimos el campo 'isOnline'
            const roomsWithStatus = rooms.map(room => {
                const plainRoom = room.get({ plain: true });
                const isOnline = !!onlineUsers[plainRoom.user_id]; // true si existe, false si no
                return { ...plainRoom, isOnline };
            });

            res.status(200).json(roomsWithStatus); // <-- Devolvemos las salas con el status

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
     * @description Carga el historial de chat de una sala que el admin seleccionó.
     */
    static getMessagesForRoom = async (req, res) => {
        try {
            const { roomId } = req.params;

            // 1. Buscamos la sala para asegurarnos de que existe
            const room = await ChatRoom.findByPk(roomId);
            if (!room) {
                return res.status(404).json({ message: 'Sala no encontrada' });
            }

            // 2. Buscamos todos los mensajes de esa sala
            const messages = await ChatMessage.findAll({
                where: { room_id: roomId },
                order: [
                    ['created_at', 'ASC'] // Ordenamos del más antiguo al más nuevo
                ],
                include: [{
                    model: Usuario,
                    as: 'sender',
                    attributes: ['id', 'username', 'admin'] // Datos del remitente
                }]
            });

            // 3. Devolvemos la sala y sus mensajes
            res.status(200).json({ room, messages });

        } catch (error) {
            console.error('[CHAT] Error en getMessagesForRoom:', error);
            res.status(500).json({
                message: 'Error interno del servidor al obtener los mensajes',
                error: error.message
            });
        }
    }
}


export default ChatController;