import { userDao } from "../repository/index.js";
import { supabase } from '../config/supabaseClient.js';
import path from 'path';

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

    // REGISTRO DE USUARIO CON FOTO
    static registerUser = async (req, res) => {
        const { username, unidad, email, passw } = req.body;
        let profilePictureUrl = null;

        try {
            // Subir imagen a Supabase si existe
            if (req.file) {
                const file = req.file;
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const extension = path.extname(file.originalname);
                const fileName = `profiles/${uniqueSuffix}${extension}`;

                const { error: uploadError } = await supabase.storage
                    .from('uploads')
                    .upload(fileName, file.buffer, {
                        contentType: file.mimetype,
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw new Error('Error Supabase: ' + uploadError.message);

                const { data: publicUrlData } = supabase.storage
                    .from('uploads')
                    .getPublicUrl(fileName);

                profilePictureUrl = publicUrlData.publicUrl;
            }

            // Guardar usuario (Pasamos la URL como 5to argumento)
            const newUser = await userDao.registerUser(username, unidad, email, passw, profilePictureUrl);

            console.log(newUser);
            res.status(201).json({ message: "Usuario registrado con éxito" });
            
        } catch (error) {
            if (error.message === 'Email already in use' || (error.name && error.name.includes('SequelizeUniqueConstraintError'))) {
                console.log('El correo o usuario ya existe', error);
                res.status(409).json({ message: 'El email o nombre de usuario ya existe.' });
            } else {
                console.log('Error al registrar usuario:', error)
                res.status(500).json({ message: 'Error al registrar usuario', details: error.message });
            }
        }
    }

    // OBTENER TODOS 
    static getAllUsers = async (filters) => {
        return await userDao.getAllUsers(filters);
    }

    // ACTUALIZAR USUARIO (CON FOTO) 
    static updateUser = async (req, res) => {
        const id = req.params.id;
        const userData = req.body;

        try {
            if (String(req.user.id) === String(id) && userData.admin === 'false') {
                 return res.status(403).json({ message: 'No puedes revocar tu propio permiso de administrador.' });
            }
            if (String(id) === '6' && String(req.user.id) !== '6') {
                 return res.status(403).json({ message: 'No se puede editar al usuario Administrador principal.' });
            }

            // Subir nueva imagen si existe
            if (req.file) {
                const file = req.file;
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const extension = path.extname(file.originalname);
                const fileName = `profiles/${uniqueSuffix}${extension}`;

                const { error: uploadError } = await supabase.storage
                    .from('uploads')
                    .upload(fileName, file.buffer, {
                        contentType: file.mimetype,
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw new Error('Error Supabase: ' + uploadError.message);

                const { data: publicUrlData } = supabase.storage
                    .from('uploads')
                    .getPublicUrl(fileName);

                userData.profile_picture = publicUrlData.publicUrl;
            }

            const updatedUser = await userDao.updateUser(id, userData);
            res.status(200).json(updatedUser);

        } catch (error) {
            console.error("Error en updateUser:", error);
            res.status(500).json({ message: 'Error al actualizar el usuario', error: error.message });
        }
    }

    static deleteUser = async (req, res) => { 
        return await userDao.deleteUser(req); 
    }
    
    // Wrapper para el router (Full Controller)
    static deleteUserContoller = async (req, res) => {
        try {
            const userIdToDelete = req.params.id;

            if (String(req.user.id) === String(userIdToDelete)) {
                return res.status(400).json({ message: 'No puedes eliminarte a ti mismo.' });
            }
            
            if (String(userIdToDelete) === '6') {
                 return res.status(403).json({ message: 'No se puede eliminar al usuario Administrador principal.' });
            }

            const result = await userDao.deleteUser(userIdToDelete);
            res.status(200).json(result);

        } catch (error) {
            console.error("Error en DELETE /api/users/:id:", error);
            res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
        }
    }
    
    static findUserByEmail = async (email) => {
        return await userDao.findUserByEmail(email);
    }
    
    static updateUserPassword = async (id, password) => {
        return await userDao.updateUserPassword(id, password);
    }

}
export default UserDao;