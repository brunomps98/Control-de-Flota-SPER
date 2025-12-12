import { ChatRoom, ChatMessage } from '../models/chat.model.js';
import Usuario from '../models/user.model.js';
import { Op } from 'sequelize';
import { onlineUsers } from '../socket/onlineUsers.js';
import { supabase } from '../config/supabaseClient.js';
import path from 'path';

// Creamos la clase ChatController para manejar las operaciones del chat
class ChatController {

    // Funcion para subir archivos
    static uploadChatFile = async (req, res) => {
        try {
            // Obtenemos los archivos del request
            const files = req.files;
            // Si no hay archivos cargados mostramos mensaje
            if (!files || files.length === 0) {
                return res.status(400).json({ message: "No se han subido archivos." });
            }
            // Procesamos cada archivo
            const uploadPromises = files.map(async (file) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const extension = path.extname(file.originalname);
                const fileName = `chat/${uniqueSuffix}${extension}`;
                // Subimos el archivo a supabase
                const { error: uploadError } = await supabase.storage
                    .from('uploads')
                    .upload(fileName, file.buffer, {
                        contentType: file.mimetype,
                        cacheControl: '3600',
                        upsert: false
                    });
                // Si hay error de carga en supabase, mostramos error
                if (uploadError) throw new Error('Error Supabase: ' + uploadError.message);
                // Obtenemos la URL pública del archivo subido
                const { data: publicUrlData } = supabase.storage
                    .from('uploads')
                    .getPublicUrl(fileName);

                // Tipos de archivos
                let fileType = 'file';
                if (file.mimetype.startsWith('image/')) fileType = 'image';
                else if (file.mimetype.startsWith('video/')) fileType = 'video';
                else if (file.mimetype.startsWith('audio/')) fileType = 'audio';
                // Devolvemos la info del archivo subido
                return {
                    fileUrl: publicUrlData.publicUrl,
                    fileType: fileType,
                    originalName: file.originalname
                };
            });
            // Esperamos a que todas las promesas de subida se completen
            const results = await Promise.all(uploadPromises);
            // Mensaje de exito al subir archivos
            res.status(200).json({
                message: "Archivos subidos correctamente",
                files: results
            });
        } catch (error) {
            // Error al subir archivos
            console.error('[CHAT] Error en uploadChatFile:', error);
            res.status(500).json({ message: 'Error al subir archivos.', error: error.message });
        }
    }

    // Función para obtener sala actual
    static getMyRoom = async (req, res) => {
        try {
            // Obtenemos o creamos la sala del usuario
            const userId = req.user.id;
            const [room, created] = await ChatRoom.findOrCreate({
                where: { user_id: userId },
                defaults: {
                    user_id: userId,
                    last_message: null
                }
            });
            // Obtenemos los mensajes de la sala
            if (created) {
            }
            const messages = await ChatMessage.findAll({
                where: { room_id: room.id },
                include: [{ model: Usuario, as: 'sender', attributes: ['id', 'username', 'admin'] }],
                order: [['created_at', 'ASC']]
            });
            // Devolvemos todo junto
            res.status(200).json({ room, messages });
        } catch (error) {
            // Manejo de errores
            console.error('[CHAT] Error en getMyRoom:', error);
            res.status(500).json({
                message: 'Error interno del servidor al obtener el chat',
                error: error.message
            });
        }
    }

    // Función para obtener salas de admin
    static getAdminRooms = async (req, res) => {
        try {
            // Filtramos para traer solo salas que tengan un last_message real (para que no muestre todos los chats)
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
            // Agregamos estado de online/offline a las salas activas
            const userIdsWithRooms = [];
            const activeRoomsWithStatus = activeRooms.map(room => {
                const plainRoom = room.get({ plain: true });
                const isOnline = !!onlineUsers[plainRoom.user_id];
                userIdsWithRooms.push(plainRoom.user_id);
                return { ...plainRoom, isOnline };
            });
            // Obtenemos los usuarios admin para excluirlos
            const adminUsers = await Usuario.findAll({ where: { admin: true }, attributes: ['id'] });
            const adminIds = adminUsers.map(admin => admin.id);

            // Excluimos a los que ya tienen sala con mensajes y a los admins
            const allExcludedIds = [...userIdsWithRooms, ...adminIds];
            // Obtenemos los usuarios que no tienen sala activa
            const newChatUsers = await Usuario.findAll({
                where: { id: { [Op.notIn]: allExcludedIds } },
                attributes: ['id', 'username', 'email', 'unidad', 'profile_picture'],
                order: [['username', 'ASC']]
            });
            // Agregamos estado de online/offline a los nuevos usuarios
            const newChatUsersWithStatus = newChatUsers.map(user => {
                const plainUser = user.get({ plain: true });
                const isOnline = !!onlineUsers[plainUser.id];
                return { ...plainUser, isOnline };
            });
            // Json con activerooms y newChatUsers
            res.status(200).json({
                activeRooms: activeRoomsWithStatus,
                newChatUsers: newChatUsersWithStatus
            });
        } catch (error) {
            // Manejo de errores
            console.error('[CHAT] Error en getAdminRooms:', error);
            res.status(500).json({
                message: 'Error interno del servidor al obtener las salas',
                error: error.message
            });
        }
    }
    // Función para obtener mensajes de una sala
    static getMessagesForRoom = async (req, res) => {
        try {
            // Obtenemos el ID de la sala desde los parámetros
            const { roomId } = req.params;
            const room = await ChatRoom.findByPk(roomId);
            if (!room) {
                // Si la sala no existe, mostramos un mensaje
                return res.status(404).json({ message: 'Sala no encontrada' });
            }
            // Obtenemos los mensajes de la sala
            const messages = await ChatMessage.findAll({
                where: { room_id: roomId },
                order: [['created_at', 'ASC']],
                include: [{
                    model: Usuario,
                    as: 'sender',
                    attributes: ['id', 'username', 'admin', 'profile_picture']
                }]
            });
            // Devolvemos la sala y sus mensajes
            res.status(200).json({ room, messages });
        } catch (error) {
            // Manejo de errores
            console.error('[CHAT] Error en getMessagesForRoom:', error);
            res.status(500).json({
                message: 'Error interno del servidor al obtener los mensajes',
                error: error.message
            });
        }
    }
    // Función para encontrar o crear sala
    static findOrCreateRoomForUser = async (req, res) => {
        const { userId } = req.body;
        // Mensaje de que no hay ID de usuario
        if (!userId) return res.status(400).json({ message: "Falta el ID del usuario." });
        // Buscamos o creamos la sala
        try {
            const [room, created] = await ChatRoom.findOrCreate({
                where: { user_id: userId },
                defaults: {
                    user_id: userId,
                    last_message: null // Inicializamos en NULL para que no aparezca en la bandeja
                }
            });
            // Obtenemos la sala con los datos del usuario
            const finalRoom = await ChatRoom.findByPk(room.id, {
                include: [{
                    model: Usuario,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'unidad', 'profile_picture']
                }]
            });
            // Devolvemos la sala junto con el estado de online/offline
            const isOnline = !!onlineUsers[finalRoom.user_id];
            // Respuesta con la sala y el estado
            res.status(200).json({ ...finalRoom.get({ plain: true }), isOnline });

        } catch (error) {
            // Manejo de errores
            console.error('[CHAT] Error en findOrCreateRoomForUser:', error);
            res.status(500).json({ message: 'Error al crear o buscar la sala.' });
        }
    }
}

// Exportamos el controlador
export default ChatController;