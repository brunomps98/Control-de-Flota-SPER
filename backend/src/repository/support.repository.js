import { Soporte, SoporteArchivo } from '../models/support.model.js';
import { sequelize } from '../config/configServer.js';
import { Op } from 'sequelize';

class SupportRepository {

    // Crear Ticket (Con transacción)
    async addSupportTicket(ticket) {
        const t = await sequelize.transaction();

        try {
            // Separamos los archivos del resto de los datos del ticket
            const { files, ...ticketData } = ticket;

            // Creamos el ticket principal
            const newTicket = await Soporte.create(ticketData, { transaction: t });

            // Si hay archivos, los creamos en la tabla soporte_archivos
            if (files && files.length > 0) {
                const fileData = files.map(url => ({
                    soporte_id: newTicket.id,
                    url_archivo: url
                }));
                await SoporteArchivo.bulkCreate(fileData, { transaction: t });
            }

            // Confirmamos la transacción
            await t.commit();
            return newTicket;
            // Manejo de errores con rollback
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    // Eliminar ticket por ID
    async deleteSupportTicket(id) {
        const ticket = await Soporte.findByPk(id);
        if (ticket) {
            await ticket.destroy();
            return ticket;
        }
        return null;
    }

    // Obtener todos los tickets (Con filtros)
    async getAllSupportTickets(filters = {}) { 
        const whereClause = {};
        
        if (filters && filters.name) {
            whereClause.name = { [Op.iLike]: `%${filters.name}%` };
        }
        if (filters && filters.surname) {
            whereClause.surname = { [Op.iLike]: `%${filters.surname}%` };
        }
        if (filters && filters.email) {
            whereClause.email = { [Op.iLike]: `%${filters.email}%` };
        }
        if (filters && filters.phone) {
            whereClause.phone = { [Op.iLike]: `%${filters.phone}%` };
        }

        return await Soporte.findAll({
            where: whereClause,
            include: [{
                model: SoporteArchivo,
                as: 'archivos'
            }],
            order: [['created_at', 'DESC']]
        });
    }

    // Obtener ticket por id
    async getSupportTicketById(id) {
        return await Soporte.findByPk(id, {
            include: [{
                model: SoporteArchivo,
                as: 'archivos'
            }]
        });
    }
}
// Exportamos
export { SupportRepository };