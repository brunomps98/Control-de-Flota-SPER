import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';

const supportCollection = 'support';

const supportSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    surname: {
        type: String, // Corregido: Un apellido es un solo texto, no un array.
        required: false
    },
    email: {
        type: String,
        // Resuelto: Se quita 'unique: true' para permitir tickets duplicados por email.
        // 'sparse' ya no es necesario si no es único.
        required: false 
    },
    phone: {
        type: String, // Corregido: Es mejor guardarlo como String para incluir caracteres como '+' o '-'.
        required: false
    },
    problem_description: {
        type: String, // Corregido: La descripción es un solo texto.
        required: false
    },
    files: {
        type: [String], // Esto está bien, pueden ser varios archivos.
        required: false,
    }
});

mongoose.set('strictQuery', false);
supportSchema.plugin(mongoosePaginate);

export const supportModel = mongoose.model(supportCollection, supportSchema);

// Se eliminó la llave '}' extra que causaba un error de sintaxis.