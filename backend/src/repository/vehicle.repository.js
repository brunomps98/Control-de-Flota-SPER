class vehicleRepository {
    constructor(dao) {
        this.dao = dao;
    }

    async getVehicles(queryParams) {
        return await this.dao.getVehicles(queryParams);
    }

    async addVehicle(vehicle, user) { 
        return await this.dao.addVehicle(vehicle, user); 
    }

    async getVehicleById(id, user) { 
        return await this.dao.getVehicleById(id, user);
    }

    async updateVehicle(id, vehicleData, user) { 
        return await this.dao.updateVehicle(id, vehicleData, user); 
    }

    async deleteVehicle(id, user) {
        return await this.dao.deleteVehicle(id, user); 
    }

    async deleteLastHistoryEntry(vid, fieldName) {
        return await this.dao.deleteLastHistoryEntry(vid, fieldName);
    }

    async deleteAllHistory(cid, fieldName, user) {
        return await this.dao.deleteAllHistory(cid, fieldName, user);
    }

    async deleteOneHistoryEntry(cid, fieldName, historyId, user) { 
        return await this.dao.deleteOneHistoryEntry(cid, fieldName, historyId, user); 
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