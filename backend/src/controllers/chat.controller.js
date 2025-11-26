import { ChatRoom, ChatMessage } from '../models/chat.model.js';
import Usuario from '../models/user.model.js';
import { Op } from 'sequelize';
import { onlineUsers } from '../socket/onlineUsers.js';
import { supabase } from '../config/supabaseClient.js'; 
import path from 'path'; 

class ChatController {

    static uploadChatFile = async (req, res) => {
        try {
            const files = req.files; 

            if (!files || files.length === 0) {
                return res.status(400).json({ message: "No se han subido archivos." });
            }

            const uploadPromises = files.map(async (file) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const extension = path.extname(file.originalname);
                const fileName = `chat/${uniqueSuffix}${extension}`;

                const { error: uploadError } = await supabase.storage
                    .from('uploads')
                    .upload(fileName, file.buffer, {
                        contentType: file.mimetype,
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw new Error('Error Supabase: ' + uploadError.message);

                const { data: publicUrlData } = supabase.storage
                    .from('uploads')
                    .getPublicUrl(fileName);

                let fileType = 'file';
                if (file.mimetype.startsWith('image/')) fileType = 'image';
                else if (file.mimetype.startsWith('video/')) fileType = 'video';
                else if (file.mimetype.startsWith('audio/')) fileType = 'audio';

                return {
                    fileUrl: publicUrlData.publicUrl,
                    fileType: fileType,
                    originalName: file.originalname
                };
            });

            const results = await Promise.all(uploadPromises);

            res.status(200).json({ 
                message: "Archivos subidos correctamente",
                files: results 
            });

        } catch (error) {
            console.error('[CHAT] Error en uploadChatFile:', error);
            res.status(500).json({ message: 'Error al subir archivos.', error: error.message });
        }
    }

    static getMyRoom = async (req, res) => {
        try {
            const userId = req.user.id; 
            const [room, created] = await ChatRoom.findOrCreate({
                where: { user_id: userId },
                defaults: {
                    user_id: userId,
                    last_message: null 
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
                    attributes: ['id', 'username', 'admin', 'profile_picture']
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

    static getAdminRooms = async (req, res) => {
        try {
            // Filtramos para traer solo salas que tengan un last_message real
            const activeRooms = await ChatRoom.findAll({
                where: {
                    last_message: { [Op.ne]: null } 
                },
                include: [{
                    model: Usuario,
                    as: 'user',
                    where: { admin: false },
                    attributes: ['id', 'username', 'email', 'unidad', 'profile_picture']
                }],
                order: [['updated_at', 'DESC']]
            });

            const userIdsWithRooms = [];
            const activeRoomsWithStatus = activeRooms.map(room => {
                const plainRoom = room.get({ plain: true });
                const isOnline = !!onlineUsers[plainRoom.user_id];
                userIdsWithRooms.push(plainRoom.user_id);
                return { ...plainRoom, isOnline };
            });

            const adminUsers = await Usuario.findAll({ where: { admin: true }, attributes: ['id'] });
            const adminIds = adminUsers.map(admin => admin.id);
            
            // Excluimos a los que ya tienen sala CON MENSAJES y a los admins
            const allExcludedIds = [...userIdsWithRooms, ...adminIds];
            
            const newChatUsers = await Usuario.findAll({
                where: { id: { [Op.notIn]: allExcludedIds } },
                attributes: ['id', 'username', 'email', 'unidad', 'profile_picture'],
                order: [['username', 'ASC']]
            });

            const newChatUsersWithStatus = newChatUsers.map(user => {
                const plainUser = user.get({ plain: true });
                const isOnline = !!onlineUsers[plainUser.id];
                return { ...plainUser, isOnline };
            });

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
                    attributes: ['id', 'username', 'admin', 'profile_picture']
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

    static findOrCreateRoomForUser = async (req, res) => {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: "Falta el ID del usuario." });

        try {
            const [room, created] = await ChatRoom.findOrCreate({
                where: { user_id: userId },
                defaults: { 
                    user_id: userId, 
                    last_message: null // Inicializamos en NULL para que no aparezca en la bandeja
                }
            });

            if (created) console.log(`[CHAT] Admin ha creado una nueva sala para el usuario ${userId}`);

            const finalRoom = await ChatRoom.findByPk(room.id, {
                include: [{
                    model: Usuario,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'unidad', 'profile_picture']
                }]
            });

            const isOnline = !!onlineUsers[finalRoom.user_id];
            res.status(200).json({ ...finalRoom.get({ plain: true }), isOnline });

        } catch (error) {
            console.error('[CHAT] Error en findOrCreateRoomForUser:', error);
            res.status(500).json({ message: 'Error al crear o buscar la sala.' });
        }
    }
}

export default ChatController;