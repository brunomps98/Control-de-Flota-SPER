
class userRepository {
    constructor(dao){
        this.dao = dao
    }

    async registerUser(username, unidad, email, password){
        return await this.dao.regUser(username, unidad, email, password)
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

}

export {userRepository}