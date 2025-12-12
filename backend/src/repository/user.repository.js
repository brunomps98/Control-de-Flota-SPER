// Creamos la clase userRepository que interactuara con el DAO de usuario
class userRepository {

    // Constructor de clase
    constructor(dao) {
        this.dao = dao
    }

    // Metodos de usuario

    // Registro de usuario
    async registerUser(username, unidad, email, password, profilePicture) {
        // Llamamos al metodo del DAO para registrar usuario
        return await this.dao.regUser(username, unidad, email, password, profilePicture)
    }

    // Login de usuario
    async loginUser(username, password) {
        // Llamamos al metodo del DAO para loguear usuario
        return await this.dao.logInUser(username, password)
    }

    // Obtener usuario por username
    async getUserByUsername(username) {
        // Llamamos al metodo del DAO para obtener usuario por username
        return await this.dao.getUserByUsername(username)
    }

    // Obtener usuario por email
    async findUserByEmail(email) {
        // Llamamos al metodo del DAO para obtener usuario por email
        return await this.dao.findUserByEmail(email);
    }

    // Actualizar contraseña de usuario
    async updateUserPassword(userId, newPassword) {
        // Llamamos al metodo del DAO para actualizar la contraseña del usuario
        return await this.dao.updateUserPassword(userId, newPassword);
    }

    // Obtener todos los usuarios con filtros opcionales
    async getAllUsers(filters) {
        // Llamamos al metodo del DAO para obtener todos los usuarios
        return await this.dao.getAllUsers(filters);
    }

    // Eliminar usuario por ID
    async deleteUser(userId) {
        // Llamamos al metodo del DAO para eliminar usuario por ID
        return await this.dao.deleteUser(userId);
    }
    
    // Actualizar datos de usuario
    async updateUser(userId, userData) {
        // Llamamos al metodo del DAO para actualizar los datos del usuario
        return await this.dao.updateUser(userId, userData);
    }

    // Obtener usuario por ID
    async getUserById(id) {
        // Llamamos al metodo del DAO para obtener usuario por ID
        return await this.dao.getUserById(id);
    }
}

// Exportamos la clase userRepository
export { userRepository }