class vehicleRepository { 
    constructor(dao){
        this.dao = dao
        
    }
    async getVehicle(){
        return await this.dao.getVehicle()
    }
    async addVehicle(vehicle){
        return await this.dao.addVehicle(vehicle)
    }
    async getVehicleById(id){
        return await this.dao.getVehicleById(id)
    }
    async updateVehicle(id, vehicle){
        return await this.dao.updateVehicle(id, vehicle)
    }
    async deleteVehicle(id){
        return await this.dao.deleteVehicle(id)
    }
    
} 
export {vehicleRepository}