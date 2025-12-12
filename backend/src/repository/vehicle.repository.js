// Creamos la clase vehicleRepository que se encargara de manejar la logica de negocio relacionada con los vehiculos
class vehicleRepository {
    
    // Constructor de la clase

    constructor(dao) {
        this.dao = dao;
    }

    // Metodos de vehicle

    // Metodo para obtener todos los vehiculos
    async getVehicles(queryParams) {
        // Llamamos al metodo getVehicles del DAO que recibe los parametros de consulta
        return await this.dao.getVehicles(queryParams);
    }

    // Metodo para agregar un nuevo vehiculo
    async addVehicle(vehicle, user) { 
        // Llamamos al metodo addVehicle del DAO que recibe el vehicle y el usuario
        return await this.dao.addVehicle(vehicle, user); 
    }

    // Metodo para obtener un vehiculo por su id
    async getVehicleById(id, user) { 
        // Llamamos al metodo getVehicleById del DAO que recibe el id del vehicle y el usuario
        return await this.dao.getVehicleById(id, user);
    }

    // Metodo para actualizar un vehiculo por su id
    async updateVehicle(id, vehicleData, user) { 
        // Llamamos al metodo updateVehicle del DAO que recibe el id del vehicle, los datos a actualizar y el usuario
        return await this.dao.updateVehicle(id, vehicleData, user); 
    }

    // Metodo para eliminar un vehiculo por su id
    async deleteVehicle(id, user) {
        // Llamamos al metodo deleteVehicle del DAO que recibe el id del vehicle y el usuario
        return await this.dao.deleteVehicle(id, user); 
    }

    // Metodos de historial
    
    // Metodo para eliminar la ultima entrada al historial de un vehiculo
    async deleteLastHistoryEntry(vid, fieldName) {
        return await this.dao.deleteLastHistoryEntry(vid, fieldName);
    }

    // Metodo para eliminar todo el historial de un vehiculo
    async deleteAllHistory(cid, fieldName, user) {
        // Llamamos al metodo deleteAllHistory del DAO que recibe el id del vehicle, el nombre del campo y el usuario
        return await this.dao.deleteAllHistory(cid, fieldName, user);
    }

    // Metodo para eliminar una entrada especifica del historial de un vehiculo
    async deleteOneHistoryEntry(cid, fieldName, historyId, user) { 
        // Llamamos al metodo deleteOneHistoryEntry del DAO que recibe el id del vehicle, el nombre del campo, el id de la entrada del historial y el usuario
        return await this.dao.deleteOneHistoryEntry(cid, fieldName, historyId, user); 
    }

    // Metodos para obtener los historiales especificos de un vehiculo

    // Metodo para obtener el historial de kilometrajes de un vehiculo
    async getKilometrajesForVehicle(id) {
        // Llamamos al metodo getKilometrajesForVehicle del DAO que recibe el id del vehicle
        return await this.dao.getKilometrajesForVehicle(id);
    }

    // Metodo para obtener el historial de servicios de un vehiculo
    async getServicesForVehicle(id) {
        // Llamamos al metodo getServicesForVehicle del DAO que recibe el id del vehicle
        return await this.dao.getServicesForVehicle(id);
    }

    // Metodo para obtener el historial de reparaciones de un vehiculo
    async getReparacionesForVehicle(id) {
        // Llamamos al metodo getReparacionesForVehicle del DAO que recibe el id del vehicle
        return await this.dao.getReparacionesForVehicle(id);
    }

    // Metodo para obtener el historial de destinos de un vehiculo
    async getDestinosForVehicle(id) {
        // Llamamos al metodo getDestinosForVehicle del DAO que recibe el id del vehicle
        return await this.dao.getDestinosForVehicle(id);
    }

    // Metodo para obtener el historial de rodados de un vehiculo
    async getRodadosForVehicle(id) {
        // Llamamos al metodo getRodadosForVehicle del DAO que recibe el id del vehicle
        return await this.dao.getRodadosForVehicle(id);
    }

    // Metodo para obtener el historial de descripciones de un vehiculo
    async getDescripcionesForVehicle(id) {
        // Llamamos al metodo getDescripcionesForVehicle del DAO que recibe el id del vehicle
        return await this.dao.getDescripcionesForVehicle(id);
    }
}

// Exportamos la clase vehicleRepository
export { vehicleRepository };