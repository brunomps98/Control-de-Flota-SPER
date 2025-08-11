import { createHash , isValidatePassword } from "../config/bcryps.js";
import { userDao } from "../repository/index.js";


class UserDao {


    static loginUser = async (req, res) => {
        try {
            const { username, passw } = req.body;
            const user = await userDao.getUserByUsername(username);
            if (!user) {
                req.session.failedAttempts = (req.session.failedAttempts || 0) + 1;
                throw new Error('Usuario no encontrado');
            }
            const isValidPassword = await isValidatePassword(passw, user.password);
            if (isValidPassword) {
                req.session.user = user;
                req.session.failedAttempts = 0; // reset the counter on successful login
                res.redirect('/vehicle');
            } else {
                req.session.failedAttempts = (req.session.failedAttempts || 0) + 1;
                throw new Error('Credenciales inválidas');
            }
        } catch (error) {
            console.log('Error de autenticación', error);
            res.render('login', { error: 'Credenciales inválidas' });
        }
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
        req.session.destroy((err) => {
            if (err) res.send('Failed Logout')
            res.redirect('/')
        })
    }
    
    static registerUser = async (req, res) => {
        const { username, unidad, email, passw } = req.body;
        try {
            let password = await createHash(passw);
            console.log(password);
            const newUser = await userDao.registerUser(username, unidad, email, password); 
            req.session.user = newUser;
            console.log(newUser);
            res.redirect('/login');
        } catch (error) {
            if (error.message === 'Email already in use') {
                // Manejar el caso en el que el correo electrónico ya está en uso
                console.log('El correo electrónico ya está en uso', error);
                res.render('register', { error: 'El correo electrónico ya está en uso' });
            } else {
                // Manejar otros errores
                console.log('Error al registrar usuario:', error)
                res.render('register', { error: 'Error al registrar usuario' });
            }
        }
    }
    
}
export default UserDao;