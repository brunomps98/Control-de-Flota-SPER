import { Soporte, SoporteArchivo } from '../models/support.model.js';
import { sequelize } from '../config/configServer.js';
import { Op } from 'sequelize';

// Creamos la clase SupportRepository que contendrá los métodos para manejar los tickets de soporte
class SupportRepository {

    // Crear Ticket 
    async addSupportTicket(ticket) {
        // Iniciamos una transacción
        const t = await sequelize.transaction();
        try {
            // Separamos los archivos del resto de los datos del ticket
            const { files, ...ticketData } = ticket;
            // Creamos el ticket principal
            const newTicket = await Soporte.create(ticketData, { transaction: t });
            // Si hay archivos, los creamos en la tabla soporte_archivos
            if (files && files.length > 0) {
                // Preparamos los datos para la inserción masiva
                const fileData = files.map(url => ({
                    soporte_id: newTicket.id,
                    url_archivo: url
                }));
                // Realizamos la inserción masiva
                await SoporteArchivo.bulkCreate(fileData, { transaction: t });
            }
            // Confirmamos la transacción
            await t.commit();
            // Devolvemos el ticket creado
            return newTicket;
            // Manejo de errores con rollback
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    // Eliminar ticket por ID
    async deleteSupportTicket(id) {
        // Buscamos el ticket por su ID
        const ticket = await Soporte.findByPk(id);
        if (ticket) {
            // Si existe, lo eliminamos
            await ticket.destroy();
            return ticket;
        }
        // Si no existe, devolvemos null
        return null;
    }

    // Obtener todos los tickets (Con filtros)
    async getAllSupportTickets(filters = {}) {
        // Construimos la cláusula WHERE dinámicamente según los filtros proporcionados
        const whereClause = {};
        // Filtros opcionales
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

        // Realizamos la consulta con los filtros aplicados
        return await Soporte.findAll({
            where: whereClause,
            include: [{
                model: SoporteArchivo,
                as: 'archivos'
            }],
            // Los ordenamos por fecha de creación descendente
            order: [['created_at', 'DESC']]
        });
    }

    // Obtener ticket por id
    async getSupportTicketById(id) {
        // Buscamos el ticket por su ID incluyendo los archivos asociados
        return await Soporte.findByPk(id, {
            include: [{
                model: SoporteArchivo,
                as: 'archivos'
            }]
        });
    }
}

// Exportamos la clase SupportRepository
export { SupportRepository };