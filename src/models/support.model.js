import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';

const supportCollection = 'support';

const supportSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    surname: {
        type: String, 
        required: false
    },
    email: {
        type: String,
        required: false, 
        index: false,
        unique: false,
    },
    phone: {
        type: String, 
        required: false
    },
    problem_description: {
        type: String, 
        required: false
    },
    files: {
        type: [String], 
        required: false,
    }
});

mongoose.set('strictQuery', false);
supportSchema.plugin(mongoosePaginate);

export const supportModel = mongoose.model(supportCollection, supportSchema);

