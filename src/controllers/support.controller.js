import { supportRepository } from "../repository/index.js";

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
        // ... (sin cambios)
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

    // Crea un nuevo ticket (CON ARCHIVOS, desde FormData)
    static createTicket = async (req, res) => {
        try {
            const ticketData = req.body;
            // Esta ruta SIEMPRE tiene multer, así que req.files existe
            if (req.files && req.files.length > 0) {
                ticketData.files = req.files.map(file => file.filename);
            }
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
            // No hay 'req.files' aquí, solo 'req.body' (JSON)
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