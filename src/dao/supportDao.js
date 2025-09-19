import { supportModel } from "../models/support.model.js";

class SupportDao {
    async addTicket(ticket) {
        return await supportModel.create(ticket);
    }

    async deleteTicket(id) {
        return await supportModel.findByIdAndDelete(id);
    }

    async getAllTickets() {
        return await supportModel.find().lean();
    }

    async getTicketById(id) {
        return await supportModel.findById(id).lean();
    }
}

export { SupportDao };
