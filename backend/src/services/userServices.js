import Usuario from "../models/user.model.js";
import bcrypt from 'bcryptjs';
import { UniqueConstraintError, Op } from 'sequelize';
import { sequelize } from '../config/configServer.js';
import { ChatRoom, ChatMessage } from '../models/chat.model.js';

// Creamos la clase userManager
export default class userManager {

    /* Funcion que registra un nuevo usuario en el sistema y
    establece los permisos iniciales basados en la unidad asignada */
    regUser = async (username, unidad, email, password, profilePicture) => {
        try {

            // Inicializar todos los permisos en 'false'
            const permissions = {
                admin: false,
                dg: false,
                up1: false,
                up3: false,
                up4: false,
                up5: false,
                up6: false,
                up7: false,
                up8: false,
                up9: false,
                inst: false,
                trat: false
            };

            // Usamos la unidad para setear el flag booleano correcto
            switch (unidad) {
                case "Direccion General":
                    permissions.dg = true;
                    break;
                case "Unidad Penal 1":
                    permissions.up1 = true;
                    break;
                case "Unidad Penal 3":
                    permissions.up3 = true;
                    break;
                case "Unidad Penal 4":
                    permissions.up4 = true;
                    break;
                case "Unidad Penal 5":
                    permissions.up5 = true;
                    break;
                case "Unidad Penal 6":
                    permissions.up6 = true;
                    break;
                case "Unidad Penal 7":
                    permissions.up7 = true;
                    break;
                case "Unidad Penal 8":
                    permissions.up8 = true;
                    break;
                case "Unidad Penal 9":
                    permissions.up9 = true;
                    break;
                case "Instituto":
                    permissions.inst = true;
                    break;
                case "Tratamiento":
                    permissions.trat = true;
                    break;
                default:
                    console.warn(`[BACK] Unidad desconocida durante el registro: ${unidad}`);
            }

            // Agregamos profile_picture al payload
            const newUserPayload = {
                username,
                unidad,
                email,
                password,
                profile_picture: profilePicture || null, // Guardamos la URL o null
                ...permissions
            };

            // Crear el usuario
            const newUser = await Usuario.create(newUserPayload);
            // Lo retornamos
            return newUser;

        } catch (error) {
            // Manejo de errores
            if (error instanceof UniqueConstraintError) {
                // Email en uso
                throw new Error('Email ya en uso');
            }
            throw error;
        }
    }

    // Función que valida las credenciales de un usuario para el inicio de sesión. 
    logInUser = async (username, password) => {
        // Buscamos el usuario por nombre de usuario, excluyendo la contraseña inicialmente
        const user = await Usuario.findOne({
            where: { username },
            attributes: {
                exclude: ['password']
            }
        });
        // Si las credenciales no son validas, lanzamos un error
        if (!user) {
            throw new Error("Credenciales inválidas");
        }

        // Buscamos el usuario nuevamente para obtener la contraseña hasheada y compararla
        const userWithPass = await Usuario.findOne({ where: { username } });
        const isPasswordValid = await bcrypt.compare(password, userWithPass.password);

        // Si la contraseña no es valida, lanzamos error de credenciales invalidas
        if (!isPasswordValid) {
            throw new Error("Credenciales inválidas");
        }
        // Devuelve el usuario
        return user;
    }

    // Obtiene el usuario por su nombre de usuario
    getUserByUsername = async (username) => {
        const user = await Usuario.findOne({ where: { username } });
        return user;
    }

    // Encuentra al usuario por su email
    findUserByEmail = async (email) => {
        try {
            const user = await Usuario.findOne({
                where: { email },
                attributes: { exclude: ['password'] }
            });
            return user;
        } catch (error) {
            // Manejo de errores
            console.error("Error al buscar usuario por email:", error);
            throw new Error('Error al buscar usuario');
        }
    }

    // Actualizar contraseña del usuario
    updateUserPassword = async (userId, newPassword) => {
        try {
            // Hasheamos la nueva contraseña antes de guardarla
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            const [affectedRows] = await Usuario.update(
                { password: hashedPassword },
                { where: { id: userId } }
            );

            if (affectedRows === 0) {
                // Mensaje de error si no se encontró el usuario
                throw new Error('Usuario no encontrado para actualizar contraseña.');
            }
            // Mensaje de exito
            return { message: 'Contraseña actualizada con éxito.' };
        } catch (error) {
            // Manejo de errores
            console.error("Error al actualizar la contraseña:", error);
            throw new Error('Error al actualizar la contraseña');
        }
    }

    // Función que obtiene todos los usuarios aplicando filtros opcionales
    getAllUsers = async (filters = {}) => {
        try {
            const whereClause = {};
            // Filtro por ID 
            if (filters.id) {
                whereClause.id = sequelize.where(
                    sequelize.cast(sequelize.col('id'), 'TEXT'),
                    { [Op.iLike]: `%${filters.id}%` }
                );
            }
            // Filtro por nombre de usuario 
            if (filters.username) {
                whereClause.username = { [Op.iLike]: `%${filters.username}%` };
            }
            // Filtro por email
            if (filters.email) {
                whereClause.email = { [Op.iLike]: `%${filters.email}%` };
            }
            // Filtro por unidad exacta
            if (filters.unidad) {
                whereClause.unidad = filters.unidad;
            }
            // Filtro por rol de administrador
            if (filters.admin === 'true') {
                whereClause.admin = true;
            }

            // Realizamos la consulta excluyendo datos sensibles
            const users = await Usuario.findAll({
                where: whereClause,
                attributes: {
                    exclude: ['password', 'fcm_token']
                },
                order: [['username', 'ASC']]
            });
            // Retornamos los usuarios
            return users;
        } catch (error) {
            // Manejo de errores
            console.error("Error al obtener todos los usuarios:", error);
            throw new Error('Error al obtener la lista de usuarios');
        }
    }

    // Función que elimina un usuario y todos sus datos asociados (ChatRoom, Mensajes) en cascada
    // y se ejecuta dentro de una transacción para asegurar integridad
    deleteUser = async (userId) => {
        const t = await sequelize.transaction();
        try {
            // Eliminar mensajes enviados por el usuario
            await ChatMessage.destroy({
                where: { sender_id: userId }
            }, { transaction: t });

            // Eliminar sala de chat asociada al usuario
            await ChatRoom.destroy({
                where: { user_id: userId }
            }, { transaction: t });

            // Eliminar el usuario
            const rowsDeleted = await Usuario.destroy({
                where: { id: userId }
            }, { transaction: t });

            if (rowsDeleted === 0) {
                throw new Error('Usuario no encontrado');
            }
            // Confirmamos la transacción
            await t.commit();
            // Retornamos mensaje de exito
            return { message: 'Usuario y sus datos asociados eliminados con éxito.' };

        } catch (error) {
            // Manejo de errores
            await t.rollback();
            console.error("Error al eliminar usuario (transacción revertida):", error);
            throw new Error('Error al eliminar el usuario.');
        }
    }

    // Función que actualiza datos del usuario
    updateUser = async (userId, userData) => {
        try {
            // Extraemos los datos a actualizar, incluyendo la bandera para borrar foto
            const { username, email, unidad, admin, password, profile_picture, delete_profile_picture } = userData;

            // Reiniciamos permisos y asignamos según la nueva unidad
            const permissions = {
                admin: admin,
                dg: false, up1: false, up3: false, up4: false, up5: false,
                up6: false, up7: false, up8: false, up9: false,
                inst: false, trat: false
            };
            // Unidades
            switch (unidad) {
                case "Direccion General": permissions.dg = true; break;
                case "Unidad Penal 1": permissions.up1 = true; break;
                case "Unidad Penal 3": permissions.up3 = true; break;
                case "Unidad Penal 4": permissions.up4 = true; break;
                case "Unidad Penal 5": permissions.up5 = true; break;
                case "Unidad Penal 6": permissions.up6 = true; break;
                case "Unidad Penal 7": permissions.up7 = true; break;
                case "Unidad Penal 8": permissions.up8 = true; break;
                case "Unidad Penal 9": permissions.up9 = true; break;
                case "Instituto": permissions.inst = true; break;
                case "Tratamiento": permissions.trat = true; break;
                case "ADMIN": break;
                default:
                    // Mensaje de error si no se encontró la unidad
                    console.warn(`[BACK] Unidad desconocida durante la actualización: ${unidad}`);
            }

            // Datos a actualizar con sus permisos
            const dataToUpdate = {
                username,
                email,
                unidad,
                ...permissions
            };

            // Lógica para manejar borrado o actualización de foto
            if (delete_profile_picture === 'true' || delete_profile_picture === true) {
                // Si la bandera de borrar está activa, forzamos null en la base de datos
                dataToUpdate.profile_picture = null;
            } else if (profile_picture) {
                // Si no se borra, pero viene una foto nueva, la actualizamos
                dataToUpdate.profile_picture = profile_picture;
            }
            // Si se proporciona una nueva contraseña, la hasheamos
            if (password && password.trim() !== "") {
                dataToUpdate.password = await bcrypt.hash(password.trim(), 10);
            }
            // Ejecutamos la actualización
            await Usuario.update(dataToUpdate, {
                where: { id: userId }
            });
            // Retornamos el usuario actualizado sin datos sensibles
            const updatedUser = await Usuario.findByPk(userId, {
                attributes: { exclude: ['password', 'fcm_token'] }
            });
            // Mensaje de exito
            return updatedUser;

        } catch (error) {
            // Manejo de errores
            console.error("Error al actualizar el usuario:", error);
            if (error instanceof UniqueConstraintError) {
                // Mensaje de error si el email o nombre de usuario ya está en uso
                throw new Error('El email o nombre de usuario ya está en uso por otra cuenta.');
            }
            // Error génerico
            throw new Error('Error al actualizar el usuario.');
        }
    }

    // Obtener usuario por su id
    getUserById = async (id) => {
        try {
            // Obtenemos el usuario
            const user = await Usuario.findByPk(id, {
                attributes: { exclude: ['password', 'fcm_token'] } // Excluimos datos sensibles
            });
            return user;
        } catch (error) {
            // Mensaje de error en el dao
            console.error("Error en getUserById (DAO):", error);
            throw error;
        }
    }
}