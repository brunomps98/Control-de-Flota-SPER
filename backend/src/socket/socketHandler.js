// En: src/socket/socketHandler.js

import jwt from 'jsonwebtoken';
// --- ▼▼ 1. IMPORTAMOS TODOS LOS MODELOS NECESARIOS ▼▼ ---
import { ChatRoom, ChatMessage } from '../models/chat.model.js';
import Usuario from '../models/user.model.js';
// --- ▲▲ -------------------------------------------- ▲▲ ---

export const initializeSocket = (io) => {

    // Middleware de Autenticación (¡Este ya está perfecto!)
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token; 
            if (!token) {
                return next(new Error('Autenticación fallida: No hay token.'));
            }
            const userPayload = jwt.verify(token, process.env.SECRET_KEY);
            socket.user = userPayload;
            next(); 
        } catch (err) {
            return next(new Error('Autenticación fallida: Token inválido.'));
        }
    });

    // Manejo de Conexiones (¡Este ya está perfecto!)
    io.on('connection', async (socket) => {
        
        console.log(`[SOCKET] ✅ Cliente autenticado: ${socket.user.username} (ID: ${socket.user.id})`);
        
        let userRoomName = ''; // Variable para guardar el nombre de la sala del usuario

        if (socket.user.admin) {
            socket.join('admin_room');
            userRoomName = 'admin_room';
            console.log(`[SOCKET] 👑 ${socket.user.username} se unió a 'admin_room'`);
        } else {
            try {
                const [room] = await ChatRoom.findOrCreate({
                    where: { user_id: socket.user.id },
                    defaults: { user_id: socket.user.id }
                });
                
                userRoomName = `room_${room.id}`; // ej: "room_5"
                socket.join(userRoomName);
                console.log(`[SOCKET] 🗣️ ${socket.user.username} se unió a su sala privada: ${userRoomName}`);
            } catch (error) {
                console.error(`[SOCKET] ⚠️ Error al unir a ${socket.user.username} a su sala:`, error);
            }
        }
        
        // --- ▼▼ CÓDIGO NUEVO AÑADIDO ▼▼ ---
        /**
         * @summary Admin se une a una sala específica para chatear
         * @description El admin nos dice qué sala está viendo
         */
        socket.on('admin_join_room', (roomId) => {
            try {
                if (!socket.user.admin) {
                    console.warn(`[SOCKET] ⚠️ Intento no autorizado de ${socket.user.username} para unirse a sala ${roomId}`);
                    return;
                }
                
                const roomName = `room_${roomId}`;
                socket.join(roomName);
                console.log(`[SOCKET] 👑 Admin ${socket.user.username} ahora está escuchando ${roomName}`);
            
            } catch (error) {
                console.error(`[SOCKET] ⚠️ Error en 'admin_join_room':`, error);
            }
        });
        // --- ▲▲ FIN DEL CÓDIGO NUEVO ▲▲ ---


        // --- LÓGICA PARA ENVIAR MENSAJES (Tu código ya estaba perfecto) ---
        socket.on('send_message', async (payload) => {
            try {
                const { roomId, content } = payload; 
                const senderId = socket.user.id;
                
                // Esta verificación ya es correcta: permite a los admins enviar
                if (!socket.user.admin && userRoomName !== `room_${roomId}`) {
                    console.warn(`[SOCKET] ⚠️ Intento de escritura no autorizado de ${socket.user.username} en sala ${roomId}`);
                    return; 
                }

                // 1. Guardar el mensaje en la Base de Datos
                const newMessage = await ChatMessage.create({
                    room_id: roomId,
                    sender_id: senderId,
                    content: content
                });

                // 2. Actualizar 'last_message' en la sala
                await ChatRoom.update(
                    { last_message: content.substring(0, 50) }, 
                    { where: { id: roomId } }
                );

                // 3. Obtener el mensaje con los datos del remitente
                const messageWithSender = await ChatMessage.findByPk(newMessage.id, {
                    include: [{
                        model: Usuario,
                        as: 'sender',
                        attributes: ['id', 'username', 'admin']
                    }]
                });

                // 4. Emitir el mensaje a la sala correcta
                const targetRoomName = `room_${roomId}`;
                io.to(targetRoomName).emit('new_message', messageWithSender);
                
                // 5. Si el remitente NO es admin, notificar a todos los admins
                if (!socket.user.admin) {
                    io.to('admin_room').emit('new_message_notification', {
                        message: messageWithSender,
                        roomId: roomId 
                    });
                }

            } catch (error) {
                console.error(`[SOCKET] ⚠️ Error en 'send_message':`, error);
                socket.emit('send_message_error', { message: 'No se pudo enviar tu mensaje.' });
            }
        });


        socket.on('disconnect', () => {
            console.log(`[SOCKET] ❌ Cliente desconectado: ${socket.user.username} (ID: ${socket.id})`);
        });
    });
}