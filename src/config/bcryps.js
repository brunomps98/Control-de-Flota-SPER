import bcryps from  'bcrypt';


//registro
export const createHash = (passw) => {
    return bcryps.hashSync(passw, bcryps.genSaltSync(10))
}
export const isValidatePassword = (passw, hashedPassword) => {
    return bcryps.compare(passw, hashedPassword);
}
