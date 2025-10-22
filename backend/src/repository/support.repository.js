class SupportRepository {
    constructor(dao) {
        this.dao = dao;
    }

    async addSupportTicket(ticket) {
        return await this.dao.addTicket(ticket);
    }

    async deleteSupportTicket(id) {
        return await this.dao.deleteTicket(id);
    }


    async getAllSupportTickets() {
        return await this.dao.getAllTickets();
    }


    async getSupportTicketById(id) {
        return await this.dao.getTicketById(id);
    }
}

export { SupportRepository };