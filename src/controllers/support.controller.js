import { supportRepository } from "../repository/index.js";

class SupportController {

    // --- MÉTODOS PARA RENDERIZAR VISTAS ---

    // 1. Muestra el formulario para crear un ticket
    static renderSupportForm = (req, res) => {
        res.render('support');
    };

    // 2. Obtiene todos los tickets y los muestra en la página de información
    static renderInformationPage = async (req, res) => {
        try {
            const tickets = await supportRepository.getAllSupportTickets();
            res.render('information', { tickets });
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

    // 4. Crea un nuevo ticket con los datos del formulario
    static createTicket = async (req, res) => {
        try {
            const ticketData = req.body;
            await supportRepository.addSupportTicket(ticketData);
            res.redirect('/information');
        } catch (error) {
            // --- ESTE ES EL CAMBIO IMPORTANTE ---
            // Imprime el error DETALLADO en la consola del servidor.
            console.error("ERROR AL CREAR TICKET:", error);

            // Ahora renderiza la página de error que creamos.
            res.status(500).render('error', { message: 'No se pudo crear el ticket. Revisa la consola del servidor para más detalles.' });
        }
    };

    // 5. Elimina un ticket (este ya lo tenías)
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