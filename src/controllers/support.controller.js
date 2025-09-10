import { supportRepository } from "../repository/index.js";

class SupportController {

    // --- MÉTODOS PARA RENDERIZAR VISTAS ---

    // 1. Muestra el formulario para crear un ticket
    static renderSupportForm = (req, res) => {
        res.render('support');
    };

    // 2. Obtiene todos los tickets y los muestra en la página de información
    static renderSupportTicketsPage = async (req, res) => {
        try {
            const tickets = await supportRepository.getAllSupportTickets();
            res.render('support-tickets', { tickets });
        } catch (error) {
            res.status(500).render('error', { message: 'Error al cargar los tickets' });
        }
    };

    static getTicketsAPI = async (req, res) => {
        try {
            const tickets = await supportRepository.getAllSupportTickets();
            // ¡IMPORTANTE! En lugar de res.render, devolvemos JSON con res.json
            res.status(200).json({ tickets: tickets });
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener los tickets' });
        }
    };

    // 3. Obtiene un ticket por su ID y muestra sus detalles
    static renderCasePage = async (req, res) => {
        try {
            const ticketId = req.params.tid; // El ID viene de la URL
            const ticket = await supportRepository.getSupportTicketById(ticketId);
            if (!ticket) {
                return res.status(404).render('error', { message: 'Ticket no encontrado' });
            }



            res.render('case', { ticket });
        } catch (error) {
            res.status(500).render('error', { message: 'Error al cargar el caso' });
        }
    };

    // --- MÉTODOS DE API ---

static createTicket = async (req, res) => {
    try {
        const ticketData = req.body; 
        
        if (req.files && req.files.length > 0) {
            ticketData.files = req.files.map(file => file.filename); 
        }

        await supportRepository.addSupportTicket(ticketData); 
        
        // --- CAMBIO CLAVE: EN LUGAR DE REDIRIGIR, ENVIAMOS UNA RESPUESTA JSON ---
        res.status(201).json({ message: 'Ticket de soporte creado con éxito.' });

    } catch (error) {
        console.error("ERROR AL CREAR TICKET:", error); 
        // --- CAMBIO CLAVE: ENVIAMOS UN ERROR EN FORMATO JSON ---
        res.status(500).json({ message: 'No se pudo crear el ticket.' });
    }
};

    // 5. Elimina un ticket 
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

     static getTicketByIdAPI = async (req, res) => {
        try {
            const { ticketId } = req.params; // Obtenemos el ID de la URL
            const ticket = await supportRepository.getSupportTicketById(ticketId);

            if (!ticket) {
                // Si no se encuentra el ticket, devolvemos un 404
                return res.status(404).json({ message: 'Ticket no encontrado' });
            }

            // Si se encuentra, lo devolvemos como JSON
            res.status(200).json({ ticket: ticket });

        } catch (error) {
            console.error("Error al obtener el ticket por ID:", error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    };
}



export default SupportController;