import jwt from 'jsonwebtoken';
import { ChatRoom, ChatMessage } from '../models/chat.model.js';
import Usuario from '../models/user.model.js';
import { onlineUsers } from './onlineUsers.js';

export const initializeSocket = (io) => {

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

    io.on('connection', async (socket) => {

        console.log(`[SOCKET] ✅ Cliente autenticado: ${socket.user.username} (ID: ${socket.user.id})`);

        let userRoomName = '';

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

                userRoomName = `room_${room.id}`;
                socket.join(userRoomName);
                onlineUsers[socket.user.id] = true;
                console.log(`[SOCKET] 🗣️ ${socket.user.username} se unió a su sala privada: ${userRoomName}`);
            } catch (error) {
                console.error(`[SOCKET] ⚠️ Error al unir a ${socket.user.username} a su sala:`, error);
            }
        }

        socket.on('delete_room', async (payload) => {
            try {
                const { roomId } = payload;
                if (!roomId) {
                    return socket.emit('operation_error', { message: 'ID de sala no válido.' });
                }

                const room = await ChatRoom.findByPk(roomId);
                if (!room) {
                    return socket.emit('operation_error', { message: 'La sala no existe.' });
                }

                if (socket.user.admin || room.user_id === socket.user.id) {
                    await room.destroy();
                    io.to(`room_${roomId}`).emit('room_deleted', {
                        roomId: roomId
                    });
                    socket.emit('operation_success', { message: 'Chat eliminado' });
                } else {
                    socket.emit('operation_error', { message: 'No tienes permiso para eliminar este chat.' });
                }
            } catch (error) {
                console.error("[SOCKET] Error en 'delete_room':", error);
                socket.emit('operation_error', { message: 'Error al eliminar el chat.' });
            }
        });

        socket.on('delete_message', async (payload) => {
            try {
                const { messageId } = payload;
                if (!messageId) {
                    return socket.emit('operation_error', { message: 'ID de mensaje no válido.' });
                }

                const message = await ChatMessage.findByPk(messageId);
                if (!message) {
                    return socket.emit('operation_error', { message: 'El mensaje no existe.' });
                }

                if (socket.user.admin || message.sender_id === socket.user.id) {
                    const roomId = message.room_id;
                    await message.destroy();
                    io.to(`room_${roomId}`).emit('message_deleted', {
                        messageId: messageId,
                        roomId: roomId
                    });
                    socket.emit('operation_success', { message: 'Mensaje eliminado' });
                } else {
                    socket.emit('operation_error', { message: 'No tienes permiso para borrar este mensaje.' });
                }
            } catch (error) {
                console.error("[SOCKET] Error en 'delete_message':", error);
                socket.emit('operation_error', { message: 'Error al eliminar el mensaje.' });
            }
        });

        // Oyente para "empezó a escribir"
        socket.on('typing_start', (payload) => {
            try {
                const { roomId } = payload;
                if (!roomId) return;
                
                const roomName = `room_${roomId}`;
                socket.to(roomName).emit('show_typing', { userId: socket.user.id, username: socket.user.username });
            
            } catch (error) {
                console.error("[SOCKET] Error en 'typing_start':", error);
            }
        });

        // Oyente para "dejó de escribir"
        socket.on('typing_stop', (payload) => {
            try {
                const { roomId } = payload;
                if (!roomId) return;
                
                const roomName = `room_${roomId}`;
                // Le avisamos a la sala que el usuario dejó de escribir
                socket.to(roomName).emit('hide_typing', { userId: socket.user.id });

            } catch (error) {
                console.error("[SOCKET] Error en 'typing_stop':", error);
            }
        });

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

        socket.on('send_message', async (payload) => {
            try {
                const { roomId, content } = payload;
                const senderId = socket.user.id;
                
                if (!content || content.trim() === "") {
                    return socket.emit('operation_error', { message: 'No se puede enviar un mensaje vacío.' });
                }

                if (!socket.user.admin && userRoomName !== `room_${roomId}`) {
                    console.warn(`[SOCKET] ⚠️ Intento de escritura no autorizado de ${socket.user.username} en sala ${roomId}`);
                    return;
                }

                const newMessage = await ChatMessage.create({
                    room_id: roomId,
                    sender_id: senderId,
                    content: content
                });

                await ChatRoom.update(
                    { last_message: content.substring(0, 50) },
                    { where: { id: roomId } }
                );

                const messageWithSender = await ChatMessage.findByPk(newMessage.id, {
                    include: [{
                        model: Usuario,
                        as: 'sender',
                        attributes: ['id', 'username', 'admin']
                    }]
                });

                const targetRoomName = `room_${roomId}`;
                io.to(targetRoomName).emit('new_message', messageWithSender);

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
            
            if (!socket.user.admin && socket.user.id) {
                delete onlineUsers[socket.user.id];
                console.log(`[SOCKET] Status update: ${socket.user.username} está offline. (Online: ${Object.keys(onlineUsers).length})`);
            }
        });
    });
}