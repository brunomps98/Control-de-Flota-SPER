class vehicleRepository {
    constructor(dao) {
        this.dao = dao;
    }

    async getVehicles(queryParams) {
        return await this.dao.getVehicles(queryParams);
    }

    async addVehicle(vehicle) {
        return await this.dao.addVehicle(vehicle);
    }

    async getVehicleById(id, user) { 
        return await this.dao.getVehicleById(id, user);
    }

    async updateVehicle(id, vehicleData) {
        return await this.dao.updateVehicle(id, vehicleData);
    }

    async deleteVehicle(id) {
        return await this.dao.deleteVehicle(id);
    }

    async deleteLastHistoryEntry(vid, fieldName) {
        return await this.dao.deleteLastHistoryEntry(vid, fieldName);
    }

    async deleteAllHistory(cid, fieldName) {
        return await this.dao.deleteAllHistory(cid, fieldName);
    }

    async deleteOneHistoryEntry(cid, fieldName, historyId) {
        return await this.dao.deleteOneHistoryEntry(cid, fieldName, historyId);
    }

    async getKilometrajesForVehicle(id) {
        return await this.dao.getKilometrajesForVehicle(id);
    }
    async getServicesForVehicle(id) {
        return await this.dao.getServicesForVehicle(id);
    }
    async getReparacionesForVehicle(id) {
        return await this.dao.getReparacionesForVehicle(id);
    }
    async getDestinosForVehicle(id) {
        return await this.dao.getDestinosForVehicle(id);
    }
    async getRodadosForVehicle(id) {
        return await this.dao.getRodadosForVehicle(id);
    }
    async getDescripcionesForVehicle(id) {
        return await this.dao.getDescripcionesForVehicle(id);
    }
}

export { vehicleRepository };