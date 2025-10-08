// 1. Se corrige el nombre del archivo importado de 'bcryps.js' a 'bcrypt.js'
import { createHash, isValidatePassword } from "../config/bcrypt.js";
import { userDao } from "../repository/index.js";


class UserDao {

    // La lógica de login ahora vive en db.router.js para generar el token.
    // Esta función ya no se usa directamente para el login con JWT.
    static loginUser = async (req, res) => {
        // La nueva lógica está en el router.
        res.status(501).json({ message: 'Esta ruta de login está obsoleta, usar la del router principal.' });
    }

    // Esta función ya no es necesaria, la reemplazamos por /api/user/current en el router.
    static getCurrentSession = async (req, res) => {
        res.status(501).json({ message: 'Esta ruta de sesión está obsoleta.' });
    }

    // Las funciones para renderizar vistas no cambian.
    static home = async (req, res) => {
        res.render('home')
    }
    static login = async (req, res) => {
        res.render('login')
    }
    static register = async (req, res) => {
        res.render('register')
    }

    // La lógica de logout ahora se maneja principalmente en el frontend al borrar el token.
    static logout = async (req, res) => {
        // Ya no se destruye una sesión. Simplemente se redirige o se da una respuesta exitosa.
        res.redirect('/');
    }

    static registerUser = async (req, res) => {
        const { username, unidad, email, passw } = req.body;
        try {
            // La lógica de hashear la contraseña se movió al user.model.js,
            // pero para mantener compatibilidad si se llama desde aquí, la dejamos.
            // Lo ideal sería que el modelo se encargue 100% de esto.
            let password = await createHash(passw);
            console.log(password);
            
            const newUser = await userDao.registerUser(username, unidad, email, password);
            console.log(newUser);
            // Ya no iniciamos una sesión, solo redirigimos al login para que el usuario inicie sesión y obtenga su token.
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