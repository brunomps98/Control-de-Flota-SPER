import { supportModel } from "../models/support.model.js";

class SupportDao {
    async addTicket(ticket) {
        return await supportModel.create(ticket);
    }

    async deleteTicket(id) {
        return await supportModel.findByIdAndDelete(id);
    }

    // MÉTODO NUEVO: Para la página /information
    async getAllTickets() {
        return await supportModel.find().lean();
    }

    // MÉTODO NUEVO: Para la página /case/:id
    async getTicketById(id) {
        return await supportModel.findById(id).lean();
    }
}

export { SupportDao };
