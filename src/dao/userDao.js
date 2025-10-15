// 1. Se corrige el nombre del archivo importado de 'bcryps.js' a 'bcrypt.js'
import { createHash, isValidatePassword } from "../config/bcrypt.js";
import { userDao } from "../repository/index.js";


class UserDao {

    static loginUser = async (req, res) => {
        res.status(501).json({ message: 'Esta ruta de login está obsoleta, usar la del router principal.' });
    }

    static getCurrentSession = async (req, res) => {
        res.status(501).json({ message: 'Esta ruta de sesión está obsoleta.' });
    }

    static home = async (req, res) => {
        res.render('home')
    }
    static login = async (req, res) => {
        res.render('login')
    }
    static register = async (req, res) => {
        res.render('register')
    }

    static logout = async (req, res) => {
        res.redirect('/');
    }

    static registerUser = async (req, res) => {
        const { username, unidad, email, passw } = req.body;
        try {
            let password = await createHash(passw);
            console.log(password);
            
            const newUser = await userDao.registerUser(username, unidad, email, password);
            console.log(newUser);
            res.redirect('/login');
        } catch (error) {
            if (error.message === 'Email already in use') {
                console.log('El correo electrónico ya está en uso', error);
                res.render('register', { error: 'El correo electrónico ya está en uso' });
            } else {
                console.log('Error al registrar usuario:', error)
                res.render('register', { error: 'Error al registrar usuario' });
            }
        }
    }

}
export default UserDao;