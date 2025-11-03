import { supportRepository } from "../repository/index.js";
import { supabase } from '../config/supabaseClient.js'; 
import path from 'path'; 

class SupportController {

    // --- MÉTODOS PARA RENDERIZAR VISTAS (LEGACY) ---
    static renderSupportForm = (req, res) => {
        res.render('support');
    };

    static renderSupportTicketsPage = async (req, res) => {
        try {
            const tickets = await supportRepository.getAllSupportTickets();
            res.render('support-tickets', { tickets });
        } catch (error) {
            res.status(500).render('error', { message: 'Error al cargar los tickets' });
        }
    };

    static renderCasePage = async (req, res) => {
        try {
            const ticketId = req.params.tid;
            const ticket = await supportRepository.getSupportTicketById(ticketId);
            if (!ticket) {
                return res.status(404).render('error', { message: 'Ticket no encontrado' });
            }
            res.render('case', { ticket });
        } catch (error) {
            res.status(500).render('error', { message: 'Error al cargar el caso' });
        }
    };


    // --- MÉTODOS PARA REACT ---

    // Obtiene TODOS los tickets
    static getTickets = async (req, res) => {
        try {
            const tickets = await supportRepository.getAllSupportTickets();
            res.status(200).json({ tickets: tickets });
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener los tickets' });
        }
    };

    // Obtiene UN ticket por su ID
    static getTicketById = async (req, res) => {
        try {
            const { ticketId } = req.params;
            const ticket = await supportRepository.getSupportTicketById(ticketId);
            if (!ticket) {
                return res.status(404).json({ message: 'Ticket no encontrado' });
            }
            res.status(200).json({ ticket: ticket });
        } catch (error) {
            console.error("Error al obtener el ticket por ID:", error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    };


    static createTicket = async (req, res) => {
        try {
            const ticketData = req.body;
            let fileUrls = []; // Array para las URLs públicas

            if (req.files && req.files.length > 0) {
                console.log(`Subiendo ${req.files.length} archivos de soporte a Supabase...`);

                for (const file of req.files) {
                    // Creamos un nombre de archivo único
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    const extension = path.extname(file.originalname);
                    // Usamos un prefijo 'files-' para diferenciarlo de 'thumbnail-'
                    const fileName = `files-${uniqueSuffix}${extension}`; 

                    // Subimos el archivo (buffer) al bucket 'uploads'
                    const { error: uploadError } = await supabase.storage
                        .from('uploads') 
                        .upload(fileName, file.buffer, {
                            contentType: file.mimetype,
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (uploadError) {
                        throw new Error('Error al subir el archivo de soporte a Supabase: ' + uploadError.message);
                    }

                    // Obtenemos la URL pública
                    const { data: publicUrlData } = supabase.storage
                        .from('uploads')
                        .getPublicUrl(fileName);
                    
                    if (!publicUrlData) {
                        throw new Error('No se pudo obtener la URL pública de Supabase para el archivo de soporte.');
                    }
                    
                    fileUrls.push(publicUrlData.publicUrl);
                }
            }
            

            ticketData.files = fileUrls;

            await supportRepository.addSupportTicket(ticketData);
            res.status(201).json({ message: 'Ticket de soporte creado con éxito.' });
        } catch (error) {
            console.error("ERROR AL CREAR TICKET (con archivos):", error);
            res.status(500).json({ message: 'No se pudo crear el ticket.' });
        }
    };


    // Crea un nuevo ticket (SIN ARCHIVOS, desde JSON)
    static createTicketNoFiles = async (req, res) => {
        try {
            const ticketData = req.body;
            
            ticketData.files = []; 
            
            await supportRepository.addSupportTicket(ticketData);
            res.status(201).json({ message: 'Ticket de soporte creado con éxito.' });
        } catch (error) {
            console.error("ERROR AL CREAR TICKET (sin archivos):", error);
            res.status(500).json({ message: 'No se pudo crear el ticket.' });
        }
    };

    // Elimina un ticket
    static deleteTicket = async (req, res) => {
        try {
            const id = req.params.pid;
            const deletedTicket = await supportRepository.deleteSupportTicket(id);
            if (!deletedTicket) {
                return res.status(404).json({ status: "error", message: "Ticket not found" });
            }
            res.status(200).json({ status: "success", message: "Ticket deleted successfully" });
        } catch (error) {
            res.status(500).json({ status: "error", message: error.message });
        }
    };
}

export default SupportController;