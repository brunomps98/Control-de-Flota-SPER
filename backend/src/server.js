import app from './app.js'; 
import { connectToDB } from "./config/configServer.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; 

// Funcion para controlar el inicio a la base de datos y el servidor
const startServer = async () => {
    try {
        await connectToDB(); // Primero conectamos a la DB

        app.listen(PORT, HOST, () => { // Luego iniciamos el servidor
            console.log(`Acceso local: http://localhost:${PORT}/\n`);
        });
    } catch (err) {
        console.error("❌ Error al iniciar el servidor:", err);
    }
};

// Llamamos a la función para arrancar todo
startServer();