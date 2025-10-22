import mongoose from "mongoose";

import mongoosePaginate from 'mongoose-paginate-v2';


const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: false
    },
    description: {
        type: [String],
        required: false
    },
    dominio: {
        type: String,
        unique: true,
        required: false
    },
    kilometros: {
        type: [Number],
        required: false
    },
    thumbnail: {
        type: [String],
        required: false
    },
    destino: {
        type: [String],
        required: false
    },
    anio: {
        type: String,
        required: false
    },
    modelo: {
        type: String,
        required: false
    },
    tipo: {
        type: String,
        required: false
    },
    chasis: {
        type: String,
        required: false
    },
    motor: {
        type: String,
        required: false
    },
    cedula: {
        type: String,
        required: false
    },
    service: {
        type: [String],
        required: false
    },
    rodado: {
        type: [String],
        required: false
    },
    reparaciones: {
        type: [String],
        required: false
    },
    marca: {
        type: String,
        required: false
    },
    usuario: {
        type: String,
        required: false
    },
})




mongoose.set('strictQuery', false)
productSchema.plugin(mongoosePaginate)

export const productsModel = mongoose.model('productos', productSchema)