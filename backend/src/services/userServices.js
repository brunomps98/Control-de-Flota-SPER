import Usuario from "../models/user.model.js";
import bcrypt from 'bcryptjs';
import { UniqueConstraintError, Op } from 'sequelize';
import { sequelize } from '../config/configServer.js';
import { ChatRoom, ChatMessage } from '../models/chat.model.js';

export default class userManager {

    /* Registra un nuevo usuario y asigna permisos booleanos según la unidad seleccionada.
        username: Nombre de usuario único.
        unidad: Nombre de la unidad (ej: "Unidad Penal 1").
        email: Correo electrónico único.
        password: Contraseña en texto plano (será hasheada automáticamente por el modelo o hook).
        profilePicture: URL de la foto de perfil o null.
         Retorna: Promise<Object>: El usuario creado (sin password)
         Arroja error si el email o usuario ya existen.
         */

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

    /*
    Valida las credenciales de un usuario para el inicio de sesión.
    username: Nombre de usuario.
    password: Contraseña ingresada.
    retorna: Promise<Object>: El usuario autenticado
    arroja error si el usuario no existe o la contraseña es incorrecta.
     */

    logInUser = async (username, password) => {
        const user = await Usuario.findOne({
            where: { username },
            attributes: {
                exclude: ['password']
            }
        });

        if (!user) {
            throw new Error("Credenciales inválidas");
        }

        const userWithPass = await Usuario.findOne({ where: { username } });
        const isPasswordValid = await bcrypt.compare(password, userWithPass.password);

        if (!isPasswordValid) {
            throw new Error("Credenciales inválidas");
        }

        return user;
    }

    // Obtiene el usuario
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
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            const [affectedRows] = await Usuario.update(
                { password: hashedPassword },
                { where: { id: userId } }
            );

            if (affectedRows === 0) {
                // Mensaje de error
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

    /*
    Obtiene todos los usuarios aplicando filtros opcionales
    {Object} filters: Filtros de búsqueda (username, email, unidad, admin)
    retorna: Promise<Array>: Lista de usuarios (excluyendo passwords)
     */

    getAllUsers = async (filters = {}) => {
        try {
            const whereClause = {};

            if (filters.id) {
                whereClause.id = sequelize.where(
                    sequelize.cast(sequelize.col('id'), 'TEXT'),
                    { [Op.iLike]: `%${filters.id}%` }
                );
            }
            if (filters.username) {
                whereClause.username = { [Op.iLike]: `%${filters.username}%` };
            }
            if (filters.email) {
                whereClause.email = { [Op.iLike]: `%${filters.email}%` };
            }
            if (filters.unidad) {
                whereClause.unidad = filters.unidad;
            }
            if (filters.admin === 'true') {
                whereClause.admin = true;
            }

            const users = await Usuario.findAll({
                where: whereClause,
                attributes: {
                    exclude: ['password', 'fcm_token']
                },
                order: [['username', 'ASC']]
            });
            return users;
        } catch (error) {
            console.error("Error al obtener todos los usuarios:", error);
            throw new Error('Error al obtener la lista de usuarios');
        }
    }

    /*
    Elimina un usuario y todos sus datos asociados (ChatRoom, Mensajes) en cascada
    Se ejecuta dentro de una transacción para asegurar integridad
    userID: ID del usuario a eliminar.
     */

    deleteUser = async (userId) => {
        const t = await sequelize.transaction();
        try {
            await ChatMessage.destroy({
                where: { sender_id: userId }
            }, { transaction: t });

            await ChatRoom.destroy({
                where: { user_id: userId }
            }, { transaction: t });

            const rowsDeleted = await Usuario.destroy({
                where: { id: userId }
            }, { transaction: t });

            if (rowsDeleted === 0) {
                throw new Error('Usuario no encontrado');
            }

            await t.commit();
            return { message: 'Usuario y sus datos asociados eliminados con éxito.' };

        } catch (error) {
            await t.rollback();
            console.error("Error al eliminar usuario (transacción revertida):", error);
            throw new Error('Error al eliminar el usuario.');
        }
    }

    // Actualizar usuario
    updateUser = async (userId, userData) => {
        try {
            // Extraemos 'delete_profile_picture' también
            const { username, email, unidad, admin, password, profile_picture, delete_profile_picture } = userData;

            const permissions = {
                admin: admin,
                dg: false, up1: false, up3: false, up4: false, up5: false,
                up6: false, up7: false, up8: false, up9: false,
                inst: false, trat: false
            };
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
                    console.warn(`[BACK] Unidad desconocida durante la actualización: ${unidad}`);
            }

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

            if (password && password.trim() !== "") {
                dataToUpdate.password = await bcrypt.hash(password.trim(), 10);
            }

            await Usuario.update(dataToUpdate, {
                where: { id: userId }
            });

            const updatedUser = await Usuario.findByPk(userId, {
                attributes: { exclude: ['password', 'fcm_token'] }
            });

            return updatedUser;

        } catch (error) {
            // Manejo de errores
            console.error("Error al actualizar el usuario:", error);
            if (error instanceof UniqueConstraintError) {
                throw new Error('El email o nombre de usuario ya está en uso por otra cuenta.');
            }
            throw new Error('Error al actualizar el usuario.');
        }
    }

    // Obtener usuario por su id
    getUserById = async (id) => {
        try {
            const user = await Usuario.findByPk(id, {
                attributes: { exclude: ['password', 'fcm_token'] } // Excluimos datos sensibles
            });
            return user;
        } catch (error) {
            console.error("Error en getUserById (DAO):", error);
            throw error;
        }
    }
}