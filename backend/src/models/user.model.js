import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; 

const userCollection = 'user';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    admin: { type: Boolean, default: false },
    unidad:{type :String, required:true},
    up1: {  type: Boolean , default: false},
    up3: {  type: Boolean , default: false},
    up4: {  type: Boolean , default: false},
    up5: {  type: Boolean , default: false},
    up6: {  type: Boolean , default: false},
    up7: {  type: Boolean , default: false},
    up8: {  type: Boolean , default: false},
    up9: {  type: Boolean , default: false},
    dg: {  type: Boolean , default: false},
    inst: {  type: Boolean , default: false}
});

// Middleware para hashear la contraseña antes de guardar
userSchema.pre('save', function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = bcrypt.hashSync(this.password, 10);
    next();
});

export const userModel = mongoose.model('User', userSchema, userCollection);