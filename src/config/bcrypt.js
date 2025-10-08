import bcrypt from 'bcryptjs'; // 1. Usamos 'bcryptjs' y el nombre correcto

// Función para encriptar la contraseña al registrarse
export const createHash = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
}

// Función para validar la contraseña en el login
export const isValidatePassword = (password, hashedPassword) => {
    // 2. Usamos compareSync para que devuelva true o false directamente
    return bcrypt.compareSync(password, hashedPassword);
}