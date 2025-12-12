// Importamos la librería bcryptjs para el manejo de contraseñas
import bcrypt from 'bcryptjs'; 

// Función para encriptar la contraseña al registrarse
export const createHash = (password) => {
    // Usamos hashSync para devolver la contraseña encriptada directamente
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
}

// Función para validar la contraseña en el login
export const isValidatePassword = (password, hashedPassword) => {
    // Usamos compareSync para que devuelva true o false directamente
    return bcrypt.compareSync(password, hashedPassword);
} 