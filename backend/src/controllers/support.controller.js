import { supportRepository } from "../repository/index.js";
import { supabase } from '../config/supabaseClient.js';
import path from 'path';
import { sendNewTicketEmail } from '../services/email.service.js';
import Usuario from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import { getIO } from '../socket/socketHandler.js';
import { sendPushNotification } from '../services/notification.service.js';

class SupportController {

    // Función que busca a todos los admins y les envía el email de notificación 

    static _sendNotificationToAdmins = async (newTicket, fileUrls, creatorName = "Usuario") => {
        try {
            // Buscamos todos los emails de admins
            const admins = await Usuario.findAll({
                where: { admin: true }
            });

            if (admins.length === 0) {
                console.warn("[Support Controller] No se encontraron admins para notificar.");
                return;
            }

            const adminEmails = admins.map(admin => admin.email);

            //  Envia correo a los admins
            sendNewTicketEmail(adminEmails, newTicket, fileUrls);

            const title = `🎫 Nuevo Ticket de Soporte`;
            const body = `Creado por: ${creatorName}\nProblema: ${newTicket.problem_description.substring(0, 40)}...`;

            // Guardamos en la base de datos la notificación
            const notificationsToCreate = admins.map(admin => ({
                user_id: admin.id,
                title: title,
                message: body,
                type: 'new_ticket',
                resource_id: newTicket.id,
                is_read: false
            }));
            await Notification.bulkCreate(notificationsToCreate); // Guardado masivo

            // Enviar socket (Campanita)
            const io = getIO();
            if (io) {
                io.to('admin_room').emit('new_notification', {
                    title: title,
                    message: body,
                    type: "new_ticket",       // Tipo para navegar
                    resourceId: newTicket.id  // ID para navegar
                });
            }

            // Enviar Push Notification a los admins
            for (const admin of admins) {
                if (admin.fcm_token) {
                    sendPushNotification(admin.fcm_token, title, body, {
                        type: 'new_ticket',
                        id: String(newTicket.id)
                    });
                }
            }

        } catch (error) {
            // Manejo de errores
            console.error("[Support Controller] Error al buscar admins para notificar:", error);
        }
    };


    // Función para obtener todos los tickets
    static getTickets = async (req, res) => {
        try {
            const filters = req.query;
            const tickets = await supportRepository.getAllSupportTickets(filters);
            res.status(200).json({ tickets: tickets });
        } catch (error) {
            // Manejo de errores
            res.status(500).json({ message: 'Error al obtener los tickets' });
        }
    };

    // Función para obtener un ticket por su id
    static getTicketById = async (req, res) => {
        try {
            const { ticketId } = req.params;
            const ticket = await supportRepository.getSupportTicketById(ticketId);
            if (!ticket) {
                return res.status(404).json({ message: 'Ticket no encontrado' });
            }
            res.status(200).json({ ticket: ticket });
        } catch (error) {
            // Manejo de errores
            console.error("Error al obtener el ticket por ID:", error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    };

    // Función para crear un ticket con archivos
    static createTicket = async (req, res) => {
        try {
            const ticketData = req.body;
            let fileUrls = [];

            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    const extension = path.extname(file.originalname);
                    const fileName = `files-${uniqueSuffix}${extension}`;

                    const { error: uploadError } = await supabase.storage
                        .from('uploads')
                        .upload(fileName, file.buffer, {
                            contentType: file.mimetype,
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (uploadError) {
                        // Manejo de errores
                        throw new Error('Error al subir el archivo de soporte a Supabase: ' + uploadError.message);
                    }

                    const { data: publicUrlData } = supabase.storage
                        .from('uploads')
                        .getPublicUrl(fileName);

                    if (!publicUrlData) {
                        // Error del lado de la url de supabase
                        throw new Error('No se pudo obtener la URL pública de Supabase para el archivo de soporte.');
                    }

                    fileUrls.push(publicUrlData.publicUrl);
                }
            }

            ticketData.files = fileUrls;

            const newTicket = await supportRepository.addSupportTicket(ticketData);

            // Capturamos el nombre
            const creatorName = req.user ? req.user.username : ticketData.name;

            // Implementamos await para que las notificaciones terminen antes de responder
            await SupportController._sendNotificationToAdmins(newTicket, fileUrls, creatorName);
            // Mensaje de exito de creación de tickets
            res.status(201).json({ message: 'Ticket de soporte creado con éxito.' });
        } catch (error) {
            // Manejo de errores
            console.error("ERROR AL CREAR TICKET (con archivos):", error);
            res.status(500).json({ message: 'No se pudo crear el ticket.' });
        }
    };

    // Función para crear un nuevo ticket sin archivos 
    static createTicketNoFiles = async (req, res) => {
        try {
            const ticketData = req.body;
            ticketData.files = [];
            const newTicket = await supportRepository.addSupportTicket(ticketData);
            const creatorName = req.user ? req.user.username : ticketData.name;
            await SupportController._sendNotificationToAdmins(newTicket, [], creatorName);
            // Mostramos mensaje de exito
            res.status(201).json({ message: 'Ticket de soporte creado con éxito.' });
        } catch (error) {
            // Manejo de errores
            console.error("ERROR AL CREAR TICKET (sin archivos):", error);
            res.status(500).json({ message: 'No se pudo crear el ticket.' });
        }
    };


    // Función para eliminar un ticket
    static deleteTicket = async (req, res) => {
        try {
            const id = req.params.pid;
            const deletedTicket = await supportRepository.deleteSupportTicket(id);
            if (!deletedTicket) {
                // Mensaje de error que el ticket no fue encontrado
                return res.status(404).json({ status: "error", message: "Ticket not found" });
            }
            // Mensaje de exito en la elimninación
            res.status(200).json({ status: "success", message: "Ticket deleted successfully" });
        } catch (error) {
            // Mensaje de error al eliminar ticket
            res.status(500).json({ status: "error", message: error.message });
        }
    };
}

export default SupportController;