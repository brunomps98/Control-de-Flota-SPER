import Usuario from "../models/user.model.js"; 
import bcrypt from 'bcryptjs';
import { UniqueConstraintError } from 'sequelize';

export default class userManager {

    regUser = async (username, unidad, email, password) => {
        try {
            // El 'password' se pasa en texto plano.
            // El hook 'beforeCreate' en el modelo 'Usuario' se encargará de hashearlo.
            const newUser = await Usuario.create({ 
                username, 
                unidad, 
                email, 
                password 
            });
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
        const user = await Usuario.findOne({ where: { username } });

        if (!user) {
            // No decimos "usuario no encontrado" por seguridad
            throw new Error("Credenciales inválidas");
        }

        // 2. Comparar la contraseña hasheada de la DB con la que mandó el usuario
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            // Contraseña incorrecta
            throw new Error("Credenciales inválidas");
        }

        // 3. Si todo está bien, devuelve el usuario
        return user;
    }

    getUserByUsername = async (username) => {
        const user = await Usuario.findOne({ where: { username } });
        return user;
    }
}