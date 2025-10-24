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
    
    async getVehicleById(id) {
        return await this.dao.getVehicleById(id);
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
}

export { vehicleRepository };