import jwt from 'jsonwebtoken';
import { ChatRoom, ChatMessage } from '../models/chat.model.js';
import Usuario from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import { onlineUsers } from './onlineUsers.js';
export const onlineAdmins = new Set();
import { sendPushNotification } from '../services/notification.service.js';
import { sendNewMessageEmail } from '../services/email.service.js';

let ioInstance = null;

export const initializeSocket = (io) => {

    ioInstance = io;

    // Middleware de autenticación para Socket.IO
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

        // LÓGICA DE ONLINE/OFFLINE 
        if (socket.user.admin) {
            socket.join('admin_room');
            userRoomName = 'admin_room';

            // Lógica de Admin Online
            onlineAdmins.add(socket.user.id);
            if (onlineAdmins.size === 1) { // Si es el primer admin en conectarse
                io.emit('support_status_change', { isOnline: true });
            }
            console.log(`[SOCKET] 👑 ${socket.user.username} se unió... (Admins Online: ${onlineAdmins.size})`);

        } else {
            // Lógica de Usuario Normal
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

        // --- LÓGICA DE BORRADO DE SALA ---
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

                //  Si el usuario es ADMIN, se borra todo para todos.
                if (socket.user.admin) {
                    await room.destroy(); // Borra de la DB

                    // Notifica a todos en la sala (incluido el invitado)
                    io.to(`room_${roomId}`).emit('room_deleted', {
                        roomId: roomId
                    });

                    socket.emit('operation_success', { message: 'Chat eliminado permanentemente' });

                    // Si el usuario es el INVITADO (dueño de la sala)
                } else if (room.user_id === socket.user.id) {

                    // NO borramos la sala de la DB.
                    socket.emit('room_deleted', {
                        roomId: roomId
                    });

                    socket.emit('operation_success', { message: 'Has salido del chat.' });

                    // Actualizamos el 'last_message' para que el admin vea
                    await room.update({ last_message: "El usuario ha abandonado el chat." });

                    // Notificamos al admin que la bandeja de entrada debe refrescarse
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

        // --- LÓGICA DE BORRADO DE MENSAJE ---
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
                // Admin puede borrar todo, usuario solo sus mensajes
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

        //  LÓGICA "ESCRIBIENDO..." 
        socket.on('typing_start', (payload) => {
            try {
                const { roomId } = payload;
                if (!roomId) return;
                const roomName = `room_${roomId}`;
                // Emitir a todos en la sala MENOS al que envía
                socket.to(roomName).emit('show_typing', { userId: socket.user.id, username: socket.user.username });
            } catch (error) {
                console.error("[SOCKET] Error en 'typing_start':", error);
            }
        });
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

        // EVENTO PARA QUE EL ADMIN ENTRE A ESCUCHAR UNA SALA
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


        // --- LÓGICA 'send_message' (MULTIMEDIA + EMAIL + DB + PUSH) ---
        socket.on('send_message', async (payload) => {
            try {
                const { roomId, content, type, file_url } = payload;
                const senderId = socket.user.id;

                if ((!content || content.trim() === "") && !file_url) {
                    return socket.emit('operation_error', { message: 'El mensaje no puede estar vacío.' });
                }

                // Validación de seguridad: si no es admin, solo puede escribir en SU sala
                if (!socket.user.admin && userRoomName !== `room_${roomId}`) {
                    console.warn(`[SOCKET] ⚠️ Intento de escritura no autorizado...`);
                    return;
                }

                // Creamos el mensaje en DB con los nuevos campos
                const newMessage = await ChatMessage.create({
                    room_id: roomId,
                    sender_id: senderId,
                    content: content || null,
                    type: type || 'text',
                    file_url: file_url || null
                });

                // Preparamos el texto de vista previa para la sala
                // Si es texto, mostramos el texto. Si es archivo, mostramos un indicador.
                const previewText = type === 'text'
                    ? content
                    : `📎 [${type === 'image' ? 'Imagen' : type}]`;

                await ChatRoom.update(
                    { last_message: previewText.substring(0, 50) },
                    { where: { id: roomId } }
                );

                // Obtenemos el mensaje completo con datos del usuario para devolverlo
                const messageWithSender = await ChatMessage.findByPk(newMessage.id, {
                    include: [{
                        model: Usuario,
                        as: 'sender',
                        attributes: ['id', 'username', 'admin']
                    }]
                });

                // Emitimos a la sala en tiempo real
                const targetRoomName = `room_${roomId}`;
                io.to(targetRoomName).emit('new_message', messageWithSender);

                // --- SISTEMA DE NOTIFICACIONES ---

                // Si el remitente NO es admin 
                if (!socket.user.admin) {

                    // Notificación visual en Dashboard (Bandeja de entrada admin) - SOCKET
                    io.to('admin_room').emit('new_message_notification', {
                        message: messageWithSender,
                        roomId: roomId
                    });

                    // Buscar todos los admins para notificar
                    const admins = await Usuario.findAll({ where: { admin: true } });

                    // NOTIFICACION DB
                    const title = `💬 Mensaje nuevo de ${socket.user.username}`;
                    const notifBody = `${previewText.substring(0, 100)}`; // Muestra el contenido del mensaje

                    const notificationsToCreate = admins.map(admin => ({
                        user_id: admin.id,
                        title: title,
                        message: notifBody,
                        type: 'chat_message',
                        resource_id: roomId,
                        is_read: false
                    }));
                    await Notification.bulkCreate(notificationsToCreate);

                    // NOTIFICACION PUSH
                    for (const admin of admins) {
                        if (admin.fcm_token && !onlineAdmins.has(admin.id)) {
                            sendPushNotification(admin.fcm_token, title, notifBody, { chatRoomId: String(roomId) });
                        }
                    }

                    const emailContent = content || "📎 El usuario ha enviado un archivo adjunto.";
                    const adminEmails = admins.map(a => a.email);
                    sendNewMessageEmail(adminEmails, socket.user.username, socket.user.unidad, emailContent);

                } else {
                    // Si el remitente ES admin (respondiendo), notificar al usuario si está desconectado
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


        // --- Logica Disconnect  ---
        socket.on('disconnect', () => {
            console.log(`[SOCKET] ❌ Cliente desconectado: ${socket.user.username} (ID: ${socket.id})`);

            if (socket.user.admin && socket.user.id) {
                onlineAdmins.delete(socket.user.id);
                if (onlineAdmins.size === 0) {
                    io.emit('support_status_change', { isOnline: false });
                }
                console.log(`[SOCKET] Status update: Admin ${socket.user.username} está offline. (Admins Online: ${onlineAdmins.size})`);
            }

            if (!socket.user.admin && socket.user.id) {
                delete onlineUsers[socket.user.id];
                console.log(`[SOCKET] Status update: ${socket.user.username} está offline. (Online: ${Object.keys(onlineUsers).length})`);
            }
        });
    });
}

/**
 * Obtiene la instancia de Socket.IO para emitir eventos desde otros módulos.
 * @returns {import('socket.io').Server}
 */
export const getIO = () => {
    if (!ioInstance) {
        console.error("Socket.IO no ha sido inicializado.");
    }
    return ioInstance;
}