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
        // Los campos de texto del formulario están en req.body
        const ticketData = req.body;
        
        if (req.files && req.files.length > 0) {
            // Creamos un array con solo los nombres de los archivos
            // y lo guardamos en la propiedad 'files' de nuestro objeto
            ticketData.files = req.files.map(file => file.filename);
        }

        // Guardamos el ticket con los datos de texto y los nombres de archivo
        await supportRepository.addSupportTicket(ticketData);
        
        res.redirect('/support-tickets');
    } catch (error) {
        console.error("ERROR AL CREAR TICKET:", error);
        res.status(500).render('error', { message: 'No se pudo crear el ticket.' });
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
}



export default SupportController;