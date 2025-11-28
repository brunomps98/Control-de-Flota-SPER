class userRepository {
    constructor(dao){
        this.dao = dao
    }

    async registerUser(username, unidad, email, password, profilePicture){
        return await this.dao.regUser(username, unidad, email, password, profilePicture)
    }

    async loginUser(username, password){
        return await this.dao.logInUser(username, password)
    }

    async getUserByUsername(username){
        return await this.dao.getUserByUsername(username)
    }

    async findUserByEmail(email){
        return await this.dao.findUserByEmail(email);
    }

    async updateUserPassword(userId, newPassword){
        return await this.dao.updateUserPassword(userId, newPassword);
    }

    async getAllUsers(filters) { 
        return await this.dao.getAllUsers(filters);
    }

    async deleteUser(userId) {
        return await this.dao.deleteUser(userId);
    }

    async updateUser(userId, userData) {
        return await this.dao.updateUser(userId, userData);
    }
    
    async getUserById(id) {
        return await this.dao.getUserById(id);
    }
}

export {userRepository}