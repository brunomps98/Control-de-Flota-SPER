import { Soporte, SoporteArchivo } from '../models/support.model.js';
import { sequelize } from '../config/configServer.js';
import { Op } from 'sequelize';

class SupportDao {

    async addTicket(ticket) {
        // Usamos una transacción para asegurar que el ticket Y sus archivos se creen
        const t = await sequelize.transaction();

        try {
            //Separamos los 'files' del resto de los datos del ticket
            const { files, ...ticketData } = ticket;

            //Creamos el ticket principal
            const newTicket = await Soporte.create(ticketData, { transaction: t });

            //Si hay archivos, los creamos en la tabla 'soporte_archivos'
            if (files && files.length > 0) {
                const fileData = files.map(url => ({
                    soporte_id: newTicket.id,
                    url_archivo: url
                }));
                await SoporteArchivo.bulkCreate(fileData, { transaction: t });
            }

            //Confirmamos la transacción
            await t.commit();
            return newTicket;

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async deleteTicket(id) {
        const ticket = await Soporte.findByPk(id);
        if (ticket) {
            await ticket.destroy();
            return ticket;
        }
        return null;
    }

    async getAllTickets(filters = {}) { 

        const whereClause = {};

        // Verificamos que 'filters' no sea nulo antes de usarlo
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
            where: whereClause, // Aplicar filtros 
            include: [{
                model: SoporteArchivo,
                as: 'archivos'
            }],
            order: [['created_at', 'DESC']]
        });
    }

    async getTicketById(id) {
        return await Soporte.findByPk(id, {
            include: [{
                model: SoporteArchivo,
                as: 'archivos'
            }]
        });
    }
}

export { SupportDao };