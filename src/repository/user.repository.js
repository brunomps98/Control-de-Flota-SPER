
class userRepository {
    constructor(dao){
        this.dao = dao
    }

    async registerUser(username, unidad, email, password){
        return await this.dao.regUser(username, unidad, email, password)
    }

    async loginUser(username, password){
        return await this.dao.loginUser(username, password)
    }

    async getUserByUsername(username){
        return await this.dao.getUserByUsername(username)
    }

}

export {userRepository}