import { userDao } from "../repository/index.js";
import { supabase } from '../config/supabaseClient.js';
import Usuario from '../models/user.model.js';
import path from 'path';

// Creamos el controlador de usuarios que manejará la lógica de negocio
class UserController {

    // Ruta obsoletas
    static loginUser = async (req, res) => {
        res.status(501).json({ message: 'Esta ruta de login está obsoleta, usar la del router principal.' });
    }
    // Ruta obsoleta
    static getCurrentSession = async (req, res) => {
        res.status(501).json({ message: 'Esta ruta de sesión está obsoleta.' });
    }
    // Vistas obsoletas
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

    // Registro de usuario con foto
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
                // Subir el archivo
                const { error: uploadError } = await supabase.storage
                    .from('uploads')
                    .upload(fileName, file.buffer, {
                        contentType: file.mimetype,
                        cacheControl: '3600',
                        upsert: false
                    });
                // Manejo de errores de subida
                if (uploadError) throw new Error('Error Supabase: ' + uploadError.message);

                // Obtener la URL pública
                const { data: publicUrlData } = supabase.storage
                    .from('uploads')
                    .getPublicUrl(fileName);

                // Asignar la URL de la imagen subida
                profilePictureUrl = publicUrlData.publicUrl;
            }

            // Guardar usuario (Pasamos la URL como 5to argumento)
            const newUser = await userDao.registerUser(username, unidad, email, passw, profilePictureUrl);

            // Mensaje de exito
            res.status(201).json({ message: "Usuario registrado con éxito" });

        } catch (error) {
            // Mensajes de errores

            // Distinguir errores de correo/usuario duplicados
            if (error.message === 'Email already in use' || (error.name && error.name.includes('SequelizeUniqueConstraintError'))) {
                console.error('El correo o usuario ya existe', error);
                res.status(409).json({ message: 'El email o nombre de usuario ya existe.' });
            } else {
                // Error 500 genérico
                console.error('Error al registrar usuario:', error)
                res.status(500).json({ message: 'Error al registrar usuario', details: error.message });
            }
        }
    }

    // Obtener todos los usuarios
    static getAllUsers = async (filters) => {
        // Devolvemos todos los usuarios con filtros opcionales
        return await userDao.getAllUsers(filters);
    }

    // Actualizar usuario (con foto)
    static updateUser = async (req, res) => {
        // Obtener ID y datos del cuerpo
        const id = req.params.id;
        const userData = req.body;

        try {
            // Mensajes de errores
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
                // Subir el archivo
                const { error: uploadError } = await supabase.storage
                    .from('uploads')
                    .upload(fileName, file.buffer, {
                        contentType: file.mimetype,
                        cacheControl: '3600',
                        upsert: false
                    });
                // Manejo de errores de subida
                if (uploadError) throw new Error('Error Supabase: ' + uploadError.message);
                // Obtener la URL pública
                const { data: publicUrlData } = supabase.storage
                    .from('uploads')
                    .getPublicUrl(fileName);
                // Asignar la URL de la imagen subida
                userData.profile_picture = publicUrlData.publicUrl;
            }
            // Actualizar usuario
            const updatedUser = await userDao.updateUser(id, userData);
            // Devolver usuario actualizado
            res.status(200).json(updatedUser);

        } catch (error) {
            // Manejo de errores
            console.error("Error en updateUser:", error);
            res.status(500).json({ message: 'Error al actualizar el usuario', error: error.message });
        }
    }

    // Función para eliminar usuarios
    static deleteUser = async (req, res) => {
        // Llamamos al DAO y devolvemos su resultado
        return await userDao.deleteUser(req);
    }


    // Metodo para eliminar foto de perfil desde el mismo perfil
    static deleteProfilePicture = async (userId) => {
        // Actualizamos la base de datos
        await Usuario.update({ profile_picture: null }, { where: { id: userId } });
    }

    // Wrapper para el router 
    static deleteUserContoller = async (req, res) => {
        try {
            // Obtener ID del usuario a eliminar
            const userIdToDelete = req.params.id;
            // Validaciones de seguridad
            if (String(req.user.id) === String(userIdToDelete)) {
                return res.status(400).json({ message: 'No puedes eliminarte a ti mismo.' });
            }
            if (String(userIdToDelete) === '6') {
                return res.status(403).json({ message: 'No se puede eliminar al usuario Administrador principal.' });
            }
            // Llamar al DAO para eliminar el usuario
            const result = await userDao.deleteUser(userIdToDelete);
            // Devolver resultado
            res.status(200).json(result);

        } catch (error) {
            // Manejo de errores
            console.error("Error en DELETE /api/users/:id:", error);
            //Devolvemos error 500
            res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
        }
    }

    // Encontrar usuario por email
    static findUserByEmail = async (email) => {
        // Devolvemos el usuario encontrado
        return await userDao.findUserByEmail(email);
    }

    //Actualizar contraseña
    static updateUserPassword = async (id, password) => {
        // Devolvemos el resultado de la actualización
        return await userDao.updateUserPassword(id, password);
    }

    // Actualizar propia imagen de perfil
    static updateSelfProfilePicture = async (userId, file) => {
        // Subir a Supabase 
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        const fileName = `profiles/${uniqueSuffix}${extension}`;
        const { error } = await supabase.storage.from('uploads').upload(fileName, file.buffer, {
            contentType: file.mimetype, upsert: false
        });
        // Manejo de errores
        if (error) throw new Error(error.message);
        // Obtener URL pública
        const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
        const publicUrl = data.publicUrl;

        // Actualizar usuario
        await Usuario.update({ profile_picture: publicUrl }, { where: { id: userId } });

        // Devolver usuario actualizado
        return await Usuario.findByPk(userId, { attributes: { exclude: ['password'] } });
    }

}

// Exportamos el controlador
export default UserController;