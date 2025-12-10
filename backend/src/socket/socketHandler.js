import jwt from 'jsonwebtoken';
import { ChatRoom, ChatMessage } from '../models/chat.model.js';
import Usuario from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import { onlineUsers } from './onlineUsers.js';
import { onlineAdmins } from './onlineAdmins.js';
import { sendPushNotification } from '../services/notification.service.js';
import { sendNewMessageEmail } from '../services/email.service.js';

let ioInstance = null;

// Inicializamos SocketIO
export const initializeSocket = (io) => {

    ioInstance = io;

    // Middleware de autenticación para Socket.IO
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            // Manejo de errores por tokens
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

    // Conexión
    io.on('connection', async (socket) => {

    
        let userRoomName = '';

        // Lógica de online/offline
        if (socket.user.admin) {
            socket.join('admin_room');
            userRoomName = 'admin_room';
            onlineAdmins.add(socket.user.id);
            if (onlineAdmins.size === 1) {
                io.emit('support_status_change', { isOnline: true });
            }
            
        } else {
            try {
                const [room] = await ChatRoom.findOrCreate({
                    where: { user_id: socket.user.id },
                    defaults: { user_id: socket.user.id }
                });

                userRoomName = `room_${room.id}`;
                socket.join(userRoomName);
                onlineUsers[socket.user.id] = true;
            
            } catch (error) {
            }
        }

        // Lógica de borrado de sala
        socket.on('delete_room', async (payload) => {
            try {
                const { roomId } = payload;
                if (!roomId) return socket.emit('operation_error', { message: 'ID de sala no válido.' });

                const room = await ChatRoom.findByPk(roomId);
                if (!room) return socket.emit('operation_error', { message: 'La sala no existe.' });

                if (socket.user.admin) {
                    await room.destroy();
                    io.to(`room_${roomId}`).emit('room_deleted', { roomId: roomId });
                    socket.emit('operation_success', { message: 'Chat eliminado permanentemente' });

                } else if (room.user_id === socket.user.id) {
                    socket.emit('room_deleted', { roomId: roomId });
                    socket.emit('operation_success', { message: 'Has salido del chat.' });
                    await room.update({ last_message: "El usuario ha abandonado el chat." });
                    io.to('admin_room').emit('new_message_notification', {
                        message: { content: "El usuario ha abandonado el chat.", created_at: new Date().toISOString() },
                        roomId: roomId
                    });
                } else {
                    socket.emit('operation_error', { message: 'No tienes permiso para esta acción.' });
                }

            } catch (error) {
                console.error("[SOCKET] Error en 'delete_room':", error);
                socket.emit('operation_error', { message: 'Error al eliminar el chat.' });
            }
        });

        // Lógica de limpiar historial solo para el usuario
        socket.on('clear_history', async (payload) => {
            try {
                const { roomId } = payload;
                if (!roomId) return;

                // Verificamos que la sala exista
                const room = await ChatRoom.findByPk(roomId);
                if (!room) return socket.emit('operation_error', { message: 'La sala no existe.' });

                // Verificamos que la sala pertenezca al usuario que quiere limpiar
                if (room.user_id !== socket.user.id) {
                    return socket.emit('operation_error', { message: 'No tienes permiso para vaciar este chat.' });
                }

                // No borramos la sala de la BD (para que el Admin siga viendo el historial)

                await room.update({ last_message: " El usuario ha vaciado su historial/salido." });

                // Avisamos al Admin (si está conectado) que el usuario hizo esto
                io.to('admin_room').emit('new_message_notification', {
                    message: {
                        content: " El usuario ha vaciado su historial/salido.",
                        created_at: new Date().toISOString(),
                        type: 'info' 
                    },
                    roomId: roomId
                });

                // Confirmamos al usuario
                socket.emit('operation_success', { message: 'Historial vaciado correctamente.' });
                socket.emit('room_deleted', { roomId: roomId });

            } catch (error) {
                console.error("[SOCKET] Error en 'clear_history':", error);
                socket.emit('operation_error', { message: 'Error al limpiar el historial.' });
            }
        });

        // Lógica de borrado de mensaje
        socket.on('delete_message', async (payload) => {
            try {
                const { messageId } = payload;
                if (!messageId) return socket.emit('operation_error', { message: 'ID de mensaje no válido.' });

                const message = await ChatMessage.findByPk(messageId);
                if (!message) return socket.emit('operation_error', { message: 'El mensaje no existe.' });

                if (socket.user.admin || message.sender_id === socket.user.id) {
                    const roomId = message.room_id;

                    // Borramos el mensaje
                    await message.destroy();

                    // Recalcular el 'last_message' de la sala 
                    const previousMessage = await ChatMessage.findOne({
                        where: { room_id: roomId },
                        order: [['created_at', 'DESC']] // Buscamos el último mensaje que queda
                    });

                    let newLastMessageText = null;
                    let newUpdatedAt = new Date();

                    if (previousMessage) {
                        newLastMessageText = previousMessage.type === 'text'
                            ? previousMessage.content
                            : `📎 [${previousMessage.type === 'image' ? 'Imagen' : previousMessage.type}]`;
                        newUpdatedAt = previousMessage.created_at;
                    }

                    // Actualizamos la sala con el mensaje anterior (o null si se vació)
                    await ChatRoom.update(
                        { last_message: newLastMessageText, updated_at: newUpdatedAt },
                        { where: { id: roomId } }
                    );

                    // Notificar a la sala que el mensaje se borró
                    io.to(`room_${roomId}`).emit('message_deleted', {
                        messageId: messageId,
                        roomId: roomId
                    });

                    io.to('admin_room').emit('new_message_notification', {
                        // Enviamos un objeto fake para que el front sepa que actualizar
                        message: {
                            content: newLastMessageText,
                            type: previousMessage ? previousMessage.type : 'text',
                            created_at: newUpdatedAt
                        },
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

        //  Lógica Escribiendo...
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
        // Lógica Dejó de escribir
        socket.on('typing_stop', (payload) => {
            try {
                const { roomId } = payload;
                if (!roomId) return;
                const roomName = `room_${roomId}`;
                socket.to(roomName).emit('hide_typing', { userId: socket.user.id });
            } catch (error) {
                console.error("[SOCKET] Error en 'typing_stop':", error);
            }
        });
        // Lógica Admin se unió a la sala
        socket.on('admin_join_room', (roomId) => {
            try {
                if (!socket.user.admin) {
                    console.warn(`[SOCKET]  Intento no autorizado de ${socket.user.username} para unirse a sala ${roomId}`);
                    return;
                }
                const roomName = `room_${roomId}`;
                socket.join(roomName);
            } catch (error) {
            }
        });

        // Lógica envio de mensajes
        socket.on('send_message', async (payload) => {
            try {
                const { roomId, content, type, file_url } = payload;
                const senderId = socket.user.id;

                if ((!content || content.trim() === "") && !file_url) {
                    return socket.emit('operation_error', { message: 'El mensaje no puede estar vacío.' });
                }

                if (!socket.user.admin && userRoomName !== `room_${roomId}`) {
                    console.warn(`[SOCKET]  Intento de escritura no autorizado...`);
                    return;
                }

                const newMessage = await ChatMessage.create({
                    room_id: roomId,
                    sender_id: senderId,
                    content: content || null,
                    type: type || 'text',
                    file_url: file_url || null
                });

                const previewText = type === 'text'
                    ? content
                    : `📎 [${type === 'image' ? 'Imagen' : type}]`;

                await ChatRoom.update(
                    { last_message: previewText.substring(0, 50) },
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

                // Notificaciones
                
                if (!socket.user.admin) {

                    io.to('admin_room').emit('new_message_notification', {
                        message: messageWithSender,
                        roomId: roomId
                    });

                    const admins = await Usuario.findAll({ where: { admin: true } });

                    // Personalización de la notificación
                    const title = `💬 Mensaje nuevo de ${socket.user.username}`;
                    const notifBody = `${previewText.substring(0, 100)}`;

                    const notificationsToCreate = admins.map(admin => ({
                        user_id: admin.id,
                        title: title,
                        message: notifBody,
                        type: 'chat_message',
                        resource_id: roomId,
                        is_read: false
                    }));
                    await Notification.bulkCreate(notificationsToCreate);

                    for (const admin of admins) {
                        if (admin.fcm_token && !onlineAdmins.has(admin.id)) {
                            sendPushNotification(admin.fcm_token, title, notifBody, { chatRoomId: String(roomId) });
                        }
                    }

                    const emailContent = content || "📎 El usuario ha enviado un archivo adjunto.";
                    const adminEmails = admins.map(a => a.email);
                    sendNewMessageEmail(adminEmails, socket.user.username, socket.user.unidad, emailContent);

                } else {
                    const room = await ChatRoom.findByPk(roomId);
                    if (room && !onlineUsers[room.user_id]) {
                        const user = await Usuario.findByPk(room.user_id);
                        const title = `Nuevo mensaje de Soporte`;
                        const notifBody = previewText.substring(0, 100);
                        if (user && user.fcm_token) {
                            sendPushNotification(user.fcm_token, title, notifBody, { chatRoomId: String(roomId) });
                        }
                    }
                }

            } catch (error) {
                console.error(`[SOCKET] ⚠️ Error en 'send_message':`, error);
                socket.emit('send_message_error', { message: 'No se pudo enviar tu mensaje.' });
            }
        });

        // Desconexión 
        socket.on('disconnect', () => {

            if (socket.user.admin && socket.user.id) {
                onlineAdmins.delete(socket.user.id);
                if (onlineAdmins.size === 0) {
                    io.emit('support_status_change', { isOnline: false });
                }
            }

            if (!socket.user.admin && socket.user.id) {
                delete onlineUsers[socket.user.id];
            }
        });
    });
}

export const getIO = () => {
    if (!ioInstance) {
        console.error("Socket.IO no ha sido inicializado.");
    }
    return ioInstance;
}