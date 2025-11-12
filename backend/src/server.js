import app from './app.js'; 
import { connectToDB } from "./config/configServer.js";
import dotenv from "dotenv";

// --- ▼▼ 1. IMPORTACIONES PARA SOCKET.IO ▼▼ ---
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { initializeSocket } from './socket/socketHandler.js'; 

// --- ▼▼ 2. IMPORTACIONES DE MODELOS (para Sequelize) ▼▼ ---
import './models/user.model.js';
import './models/vehicle.model.js';
import './models/chat.model.js';
import './models/support.model.js'; 

dotenv.config();

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; 

// --- ▼▼ 3. LÓGICA DEL SERVIDOR ---
const httpServer = http.createServer(app);

// 1. Definimos un "comodín" (Regex) para todas tus URLs de Vercel
const vercelRegex = /^https:\/\/control-de-flota-sper.*\.vercel\.app$/;

// 2. Creamos el servidor 'io' con la configuración de CORS correcta
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: [
            "http://localhost:5173", // Tu local (para seguir probando)
            vercelRegex 
        ], 
        methods: ["GET", "POST"],
        credentials: true
    },
    path: "/socket.io/" 
});

// Le pasamos el servidor 'io' a nuestro manejador de lógica
initializeSocket(io);

// Funcion para controlar el inicio a la base de datos y el servidor
const startServer = async () => {
    try {
        await connectToDB(); // Primero conectamos a la DB
        httpServer.listen(PORT, HOST, () => { 
            console.log(`🚀 Servidor HTTP y Sockets escuchando en http://localhost:${PORT}/\n`);
        });
    } catch (err) {
        console.error("❌ Error al iniciar el servidor:", err);
    }
};

// Llamamos a la función para arrancar todo
startServer();