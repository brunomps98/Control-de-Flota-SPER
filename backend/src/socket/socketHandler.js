import jwt from 'jsonwebtoken';
import { ChatRoom, ChatMessage } from '../models/chat.model.js';
import Usuario from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import { onlineUsers } from './onlineUsers.js';
import { onlineAdmins } from './onlineAdmins.js';
import { sendPushNotification } from '../services/notification.service.js';
import { sendNewMessageEmail } from '../services/email.service.js';

let ioInstance = null;

// Función principal para inicializar y configurar Socket.IO
export const initializeSocket = (io) => {

    // Guardamos la instancia de IO para usarla globalmente
    ioInstance = io;

    // Middleware de autenticación: se ejecuta antes de conectar el socket
    io.use((socket, next) => {
        try {
            // Extraemos el token enviado desde el cliente
            const token = socket.handshake.auth.token;
            // Si no hay token, denegamos la conexión
            if (!token) {
                // Manejo de eRRORES
                return next(new Error('Autenticación fallida: No hay token.'));
            }
            // Verificamos el token con la clave secreta
            const userPayload = jwt.verify(token, process.env.SECRET_KEY);
            // Adjuntamos los datos del usuario al objeto socket
            socket.user = userPayload;
            next();
        } catch (err) {
            // Si el token no es válido, denegamos la conexión
            return next(new Error('Autenticación fallida: Token inválido.'));
        }
    });

    // Evento principal: se dispara cuando un cliente se conecta exitosamente
    io.on('connection', async (socket) => {

        let userRoomName = '';

        // Lógica para manejar usuarios según su rol (Admin o Usuario normal)
        if (socket.user.admin) {
            // Si es admin, lo unimos a la sala general de administradores
            socket.join('admin_room');
            userRoomName = 'admin_room';
            // Lo añadimos al set de admins online
            onlineAdmins.add(socket.user.id);
            // Si es el primer admin en conectarse, avisamos a todos que hay soporte disponible
            if (onlineAdmins.size === 1) {
                io.emit('support_status_change', { isOnline: true });
            }
            
        } else {
            try {
                // Si es usuario, buscamos o creamos su sala de chat privada
                const [room] = await ChatRoom.findOrCreate({
                    where: { user_id: socket.user.id },
                    defaults: { user_id: socket.user.id }
                });

                // Definimos el nombre de la sala única para este usuario
                userRoomName = `room_${room.id}`;
                // Unimos el socket a esa sala
                socket.join(userRoomName);
                // Marcamos al usuario como conectado en el objeto de rastreo
                onlineUsers[socket.user.id] = true;
            
            } catch (error) {
                // Manejo silencioso de error al crear sala
            }
        }

        // Evento para eliminar una sala de chat
        socket.on('delete_room', async (payload) => {
            try {
                const { roomId } = payload;
                if (!roomId) return socket.emit('operation_error', { message: 'ID de sala no válido.' });

                // Buscamos la sala en la base de datos
                const room = await ChatRoom.findByPk(roomId);
                if (!room) return socket.emit('operation_error', { message: 'La sala no existe.' });

                // Si quien borra es Admin, la eliminación es física (base de datos)
                if (socket.user.admin) {
                    await room.destroy();
                    // Notificamos a la sala que fue eliminada
                    io.to(`room_${roomId}`).emit('room_deleted', { roomId: roomId });
                    socket.emit('operation_success', { message: 'Chat eliminado permanentemente' });

                } else if (room.user_id === socket.user.id) {
                    // Si quien borra es el Usuario, es una "salida" lógica, no borra la sala de la BD
                    socket.emit('room_deleted', { roomId: roomId });
                    socket.emit('operation_success', { message: 'Has salido del chat.' });
                    // Actualizamos el último mensaje para reflejar la acción
                    await room.update({ last_message: "El usuario ha abandonado el chat." });
                    // Avisamos a los admins que el usuario salió
                    io.to('admin_room').emit('new_message_notification', {
                        message: { content: "El usuario ha abandonado el chat.", created_at: new Date().toISOString() },
                        roomId: roomId
                    });
                } else {
                    // Si no es dueño ni admin, denegamos
                    socket.emit('operation_error', { message: 'No tienes permiso para esta acción.' });
                }

            } catch (error) {
                // Manejo de errores
                console.error("[SOCKET] Error en 'delete_room':", error);
                socket.emit('operation_error', { message: 'Error al eliminar el chat.' });
            }
        });

        // Evento para limpiar el historial visible del usuario (sin borrar datos del servidor)
        socket.on('clear_history', async (payload) => {
            try {
                const { roomId } = payload;
                if (!roomId) return;

                // Verificamos que la sala exista
                const room = await ChatRoom.findByPk(roomId);
                if (!room) return socket.emit('operation_error', { message: 'La sala no existe.' });

                // Verificamos que la sala pertenezca al usuario solicitante
                if (room.user_id !== socket.user.id) {
                    return socket.emit('operation_error', { message: 'No tienes permiso para vaciar este chat.' });
                }

                // Actualizamos el estado de la sala, pero no borramos mensajes de la BD
                await room.update({ last_message: " El usuario ha vaciado su historial/salido." });

                // Avisamos al Admin que el usuario realizó esta acción
                io.to('admin_room').emit('new_message_notification', {
                    message: {
                        content: " El usuario ha vaciado su historial/salido.",
                        created_at: new Date().toISOString(),
                        type: 'info' 
                    },
                    roomId: roomId
                });

                // Confirmamos la acción al usuario
                socket.emit('operation_success', { message: 'Historial vaciado correctamente.' });
                // Emitimos evento para que el frontend del usuario limpie la vista
                socket.emit('room_deleted', { roomId: roomId });

            } catch (error) {
                // Manejo de errores
                console.error("[SOCKET] Error en 'clear_history':", error);
                socket.emit('operation_error', { message: 'Error al limpiar el historial.' });
            }
        });

        // Evento para eliminar un mensaje específico
        socket.on('delete_message', async (payload) => {
            try {
                const { messageId } = payload;
                if (!messageId) return socket.emit('operation_error', { message: 'ID de mensaje no válido.' });

                // Buscamos el mensaje
                const message = await ChatMessage.findByPk(messageId);
                if (!message) return socket.emit('operation_error', { message: 'El mensaje no existe.' });

                // Solo permitimos borrar si es Admin o si es el dueño del mensaje
                if (socket.user.admin || message.sender_id === socket.user.id) {
                    const roomId = message.room_id;

                    // Eliminamos el mensaje de la base de datos
                    await message.destroy();

                    // Buscamos cuál es el nuevo último mensaje de la sala para actualizar la vista previa
                    const previousMessage = await ChatMessage.findOne({
                        where: { room_id: roomId },
                        order: [['created_at', 'DESC']]
                    });

                    let newLastMessageText = null;
                    let newUpdatedAt = new Date();

                    // Si queda algún mensaje, formateamos el texto para la vista previa
                    if (previousMessage) {
                        newLastMessageText = previousMessage.type === 'text'
                            ? previousMessage.content
                            : `[${previousMessage.type === 'image' ? 'Imagen' : previousMessage.type}]`;
                        newUpdatedAt = previousMessage.created_at;
                    }

                    // Actualizamos la información de la sala con el nuevo "último mensaje"
                    await ChatRoom.update(
                        { last_message: newLastMessageText, updated_at: newUpdatedAt },
                        { where: { id: roomId } }
                    );

                    // Notificamos a todos en la sala que el mensaje desapareció
                    io.to(`room_${roomId}`).emit('message_deleted', {
                        messageId: messageId,
                        roomId: roomId
                    });

                    // Notificamos a los admins para que actualicen su lista de chats
                    io.to('admin_room').emit('new_message_notification', {
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
                // Manejo de errores
                console.error("[SOCKET] Error en 'delete_message':", error);
                socket.emit('operation_error', { message: 'Error al eliminar el mensaje.' });
            }
        });

        // Evento que indica que el usuario está escribiendo
        socket.on('typing_start', (payload) => {
            try {
                const { roomId } = payload;
                if (!roomId) return;
                const roomName = `room_${roomId}`;
                // Emite a los demás en la sala (menos al que escribe)
                socket.to(roomName).emit('show_typing', { userId: socket.user.id, username: socket.user.username });
            } catch (error) {
                console.error("[SOCKET] Error en 'typing_start':", error);
            }
        });
        
        // Evento que indica que el usuario dejó de escribir
        socket.on('typing_stop', (payload) => {
            try {
                const { roomId } = payload;
                if (!roomId) return;
                const roomName = `room_${roomId}`;
                // Emite a los demás en la sala
                socket.to(roomName).emit('hide_typing', { userId: socket.user.id });
            } catch (error) {
                console.error("[SOCKET] Error en 'typing_stop':", error);
            }
        });

        // Evento exclusivo para que un Admin entre a una sala específica
        socket.on('admin_join_room', (roomId) => {
            try {
                // Validación de seguridad: solo admins pueden usar esto
                if (!socket.user.admin) {
                    console.warn(`[SOCKET]  Intento no autorizado de ${socket.user.username} para unirse a sala ${roomId}`);
                    return;
                }
                const roomName = `room_${roomId}`;
                socket.join(roomName);
            } catch (error) {
            }
        });

        // Evento principal para enviar mensajes
        socket.on('send_message', async (payload) => {
            try {
                const { roomId, content, type, file_url } = payload;
                const senderId = socket.user.id;

                // Validación básica: no enviar mensajes vacíos (salvo que sea un archivo)
                if ((!content || content.trim() === "") && !file_url) {
                    return socket.emit('operation_error', { message: 'El mensaje no puede estar vacío.' });
                }

                // Seguridad: Validar que el usuario tenga permiso de escribir en esa sala
                if (!socket.user.admin && userRoomName !== `room_${roomId}`) {
                    console.warn(`[SOCKET]  Intento de escritura no autorizado...`);
                    return;
                }

                // Creamos el mensaje en la base de datos
                const newMessage = await ChatMessage.create({
                    room_id: roomId,
                    sender_id: senderId,
                    content: content || null,
                    type: type || 'text',
                    file_url: file_url || null
                });

                // Generamos el texto de previsualización para la lista de chats
                const previewText = type === 'text'
                    ? content
                    : ` [${type === 'image' ? 'Imagen' : type}]`;

                // Actualizamos la sala con el último mensaje
                await ChatRoom.update(
                    { last_message: previewText.substring(0, 50) },
                    { where: { id: roomId } }
                );

                // Recuperamos el mensaje con los datos del remitente para enviarlo al front
                const messageWithSender = await ChatMessage.findByPk(newMessage.id, {
                    include: [{
                        model: Usuario,
                        as: 'sender',
                        attributes: ['id', 'username', 'admin']
                    }]
                });

                // Emitimos el mensaje a la sala específica
                const targetRoomName = `room_${roomId}`;
                io.to(targetRoomName).emit('new_message', messageWithSender);

                // Bloque de notificaciones (Push, Email, DB)
                
                if (!socket.user.admin) {
                    // Si escribe un Usuario, notificamos a la sala de admins
                    io.to('admin_room').emit('new_message_notification', {
                        message: messageWithSender,
                        roomId: roomId
                    });

                    // Buscamos a todos los admins para notificarles
                    const admins = await Usuario.findAll({ where: { admin: true } });

                    // Preparamos datos para notificación Push y DB
                    const title = ` Mensaje nuevo de ${socket.user.username}`;
                    const notifBody = `${previewText.substring(0, 100)}`;

                    // Guardamos notificaciones en DB para cada admin
                    const notificationsToCreate = admins.map(admin => ({
                        user_id: admin.id,
                        title: title,
                        message: notifBody,
                        type: 'chat_message',
                        resource_id: roomId,
                        is_read: false
                    }));
                    await Notification.bulkCreate(notificationsToCreate);

                    // Enviamos Push Notifications a los admins (si tienen token y no están online)
                    for (const admin of admins) {
                        if (admin.fcm_token && !onlineAdmins.has(admin.id)) {
                            sendPushNotification(admin.fcm_token, title, notifBody, { chatRoomId: String(roomId) });
                        }
                    }

                    // Enviamos Email a los admins avisando del nuevo mensaje
                    const emailContent = content || "El usuario ha enviado un archivo adjunto.";
                    const adminEmails = admins.map(a => a.email);
                    sendNewMessageEmail(adminEmails, socket.user.username, socket.user.unidad, emailContent);

                } else {
                    // Si escribe un Admin, verificamos si el usuario está offline para enviarle Push
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
                // Manejo de errores
                console.error(`[SOCKET] Error en 'send_message':`, error);
                socket.emit('send_message_error', { message: 'No se pudo enviar tu mensaje.' });
            }
        });

        // Evento de desconexión del socket
        socket.on('disconnect', () => {

            // Si se desconecta un admin, actualizamos la lista y el estado de soporte global
            if (socket.user.admin && socket.user.id) {
                onlineAdmins.delete(socket.user.id);
                if (onlineAdmins.size === 0) {
                    io.emit('support_status_change', { isOnline: false });
                }
            }

            // Si se desconecta un usuario, actualizamos su estado
            if (!socket.user.admin && socket.user.id) {
                delete onlineUsers[socket.user.id];
            }
        });
    });
}

// Función para obtener la instancia de IO desde otros archivos
export const getIO = () => {
    if (!ioInstance) {
        console.error("Socket.IO no ha sido inicializado.");
    }
    return ioInstance;
}