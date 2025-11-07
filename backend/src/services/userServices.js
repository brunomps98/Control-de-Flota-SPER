import Usuario from "../models/user.model.js"; 
import bcrypt from 'bcryptjs';
import { UniqueConstraintError } from 'sequelize';

export default class userManager {

    regUser = async (username, unidad, email, password) => {
        try {

            // 1. Inicializar todos los permisos en 'false'
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

            // 2. Usar la 'unidad' (string) para setear el flag booleano correcto
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

            // 3. Crear el payload final para la base de datos
            const newUserPayload = {
                username,
                unidad, // Guardamos el string 
                email,
                password, // El hook 'beforeCreate' lo hasheará
                ...permissions 
            };


            // 4. Crear el usuario
            const newUser = await Usuario.create(newUserPayload);
            
            return newUser;

        } catch (error) {
            if (error instanceof UniqueConstraintError) {
                // Captura el error si el email ya existe
                throw new Error('Email already in use');
            }
            throw error; // Lanza otros errores
        }
    }

    logInUser = async (username, password) => {
        // 1. Encontrar al usuario SOLO por el username
        const user = await Usuario.findOne({ 
            where: { username },
            // Nos aseguramos de traer los permisos booleanos al hacer login
            attributes: {
                exclude: ['password'] // Excluimos el password, pero traemos todo lo demás
            }
        });

        if (!user) {
            // No decimos "usuario no encontrado" por seguridad
            throw new Error("Credenciales inválidas");
        }
        
        // Buscamos al usuario de nuevo, pero ESTA VEZ pidiendo el password
        const userWithPass = await Usuario.findOne({ where: { username } });

        // 2. Comparar la contraseña hasheada de la DB con la que mandó el usuario
        const isPasswordValid = await bcrypt.compare(password, userWithPass.password);

        if (!isPasswordValid) {
            // Contraseña incorrecta
            throw new Error("Credenciales inválidas");
        }

        // 3. Si todo está bien, devuelve el usuario (sin el password)
        return user;
    }

    getUserByUsername = async (username) => {
        const user = await Usuario.findOne({ where: { username } });
        return user;
    }
}