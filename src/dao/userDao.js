import { createHash, isValidatePassword } from "../config/bcryps.js";
import { userDao } from "../repository/index.js";


class UserDao {


    static loginUser = async (req, res) => {
        try {
            const { username, password } = req.body;
            const user = await userDao.getUserByUsername(username);

            if (!user) {
                // Envía un error 401 (No autorizado) con un mensaje JSON
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            const isValidPassword = await isValidatePassword(password, user.password);

            if (isValidPassword) {
                req.session.user = user;
                req.session.failedAttempts = 0;
                // Envía una respuesta 200 (OK) con un mensaje y los datos del usuario
                return res.status(200).json({ message: 'Login exitoso', user: user });
            } else {
                req.session.failedAttempts = (req.session.failedAttempts || 0) + 1;
                // Envía un error 401 (No autorizado) con un mensaje JSON
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }
        } catch (error) {
            console.log('Error de autenticación', error);
            // Envía un error 500 (Error interno del servidor)
            return res.status(500).json({ message: 'Error interno del servidor' });
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