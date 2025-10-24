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

            const newUser = await userDao.registerUser(username, unidad, email, passw);

            console.log(newUser);
            res.redirect('/login');
        } catch (error) {
            // 3. Manejo de errores de API (con JSON)
            if (error.message === 'Email already in use') {
                console.log('El correo electrónico ya está en uso', error);
                // Devolvemos un 409 Conflict (buena práctica para duplicados)
                res.status(409).json({ error: 'El correo electrónico ya está en uso' });
            } else {
                console.log('Error al registrar usuario:', error)
                // Devolvemos un 500 Internal Server Error
                res.status(500).json({ error: 'Error al registrar usuario', details: error.message });
            }
        }
    }

}
export default UserDao;