import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config();

const URI= process.env.URL_MONGO
 

const connectToDB = () => {
    try {
        mongoose.connect(URI)
        console.log('connected to DB ecommerce')
    } catch (error) {
        console.log(error);
    }
};

export default connectToDB