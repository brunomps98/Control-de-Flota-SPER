import Usuario from "../models/user.model.js"; 
import bcrypt from 'bcryptjs';
import { UniqueConstraintError, Op } from 'sequelize';
import { sequelize } from '../config/configServer.js';
import { ChatRoom, ChatMessage } from '../models/chat.model.js';

export default class userManager {

    regUser = async (username, unidad, email, password) => {
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

            // Usar la 'unidad' (string) para setear el flag booleano correcto
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
                    // Si la unidad no coincide con ninguna, no se asigna permiso
                    console.warn(`[BACK] Unidad desconocida durante el registro: ${unidad}`);
            }

            //  Crear el payload final para la base de datos
            const newUserPayload = {
                username,
                unidad,
                email,
                password, 
                ...permissions 
            };


            // Crear el usuario
            const newUser = await Usuario.create(newUserPayload);
            
            return newUser;

        } catch (error) {
            if (error instanceof UniqueConstraintError) {
                throw new Error('Email already in use');
            }
            throw error; // Lanza otros errores
        }
    }

    logInUser = async (username, password) => {
        // Encontrar al usuario SOLO por el username
        const user = await Usuario.findOne({ 
            where: { username },
            attributes: {
                exclude: ['password'] 
            }
        });

        if (!user) {
            throw new Error("Credenciales inválidas");
        }
        
        // Buscamos al usuario de nuevo, pero esta vez pidiendo el password
        const userWithPass = await Usuario.findOne({ where: { username } });

        // Comparar la contraseña hasheada de la DB con la que mandó el usuario
        const isPasswordValid = await bcrypt.compare(password, userWithPass.password);

        if (!isPasswordValid) {
            // Contraseña incorrecta
            throw new Error("Credenciales inválidas");
        }

        // Si todo está bien, devuelve el usuario (sin el password)
        return user;
    }

    getUserByUsername = async (username) => {
        const user = await Usuario.findOne({ where: { username } });
        return user;
    }

    //  Encontrar usuario por Email 
    findUserByEmail = async (email) => {
        try {
            const user = await Usuario.findOne({ 
                where: { email },
                attributes: { exclude: ['password'] } 
            });
            return user; // Devuelve el usuario (o null si no se encuentra)
        } catch (error) {
            console.error("Error al buscar usuario por email:", error);
            throw new Error('Error al buscar usuario');
        }
    }

    // Actualizar la contraseña del usuario 
    updateUserPassword = async (userId, newPassword) => {
        try {
            // Hasheamos la nueva contraseña ANTES de guardarla
            const hashedPassword = await bcrypt.hash(newPassword, 10); 
            
            const [affectedRows] = await Usuario.update(
                { password: hashedPassword },
                { where: { id: userId } }
            );

            if (affectedRows === 0) {
                throw new Error('Usuario no encontrado para actualizar contraseña.');
            }

            return { message: 'Contraseña actualizada con éxito.' };
        } catch (error) {
            console.error("Error al actualizar la contraseña:", error);
            throw new Error('Error al actualizar la contraseña');
        }
    }

    //Funcion para traer todos los usuarios desde la vista admin y poder modificar los datos 
    
    getAllUsers = async (filters = {}) => {
        try {
            const whereClause = {};

            // Construimos la consulta dinámicamente
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
            // El frontend envía true como string
            if (filters.admin === 'true') {
                whereClause.admin = true;
            }

            const users = await Usuario.findAll({
                where: whereClause, // Aplicamos los filtros
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

    // --- Función eliminar un usuario ---
    deleteUser = async (userId) => {
        // Usamos una transacción para asegurar que todo se borre
        // o nada se borre si algo falla.
        const t = await sequelize.transaction();
        try {
            // Eliminar los mensajes enviados por el usuario
            await ChatMessage.destroy({
                where: { sender_id: userId }
            }, { transaction: t });

            //  Eliminar la sala de chat del usuario
            await ChatRoom.destroy({
                where: { user_id: userId }
            }, { transaction: t });

            //  Finalmente, eliminar al usuario
            const rowsDeleted = await Usuario.destroy({
                where: { id: userId }
            }, { transaction: t });

            if (rowsDeleted === 0) {
                throw new Error('Usuario no encontrado');
            }

            // Si todo salió bien, confirmamos la transacción
            await t.commit();
            return { message: 'Usuario y sus datos asociados eliminados con éxito.' };

        } catch (error) {
            // Si algo falló, revertimos todo
            await t.rollback();
            console.error("Error al eliminar usuario (transacción revertida):", error);
            throw new Error('Error al eliminar el usuario.');
        }
    }

    // Función actualizar un usuario
    updateUser = async (userId, userData) => {
        try {
            const { username, email, unidad, admin, password } = userData;

            // Lógica de permisos
            const permissions = {
                admin: admin, // Tomamos el valor de admin que nos llega
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

            if (password && password.trim() !== "") {
                dataToUpdate.password = await bcrypt.hash(password.trim(), 10);
            }

            // Actualizamos al usuario en la DB
            await Usuario.update(dataToUpdate, {
                where: { id: userId }
            });

            // Devolvemos el usuario actualizado (sin la contraseña)
            const updatedUser = await Usuario.findByPk(userId, {
                attributes: { exclude: ['password', 'fcm_token'] }
            });
            
            return updatedUser;

        } catch (error) {
            console.error("Error al actualizar el usuario:", error);
            if (error instanceof UniqueConstraintError) {
                throw new Error('El email o nombre de usuario ya está en uso por otra cuenta.');
            }
            throw new Error('Error al actualizar el usuario.');
        }
    }
}
