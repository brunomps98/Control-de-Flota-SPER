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

// Creamos el servidor de Sockets (io) sobre el servidor HTTP
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: "http://localhost:5173", 
        methods: ["GET", "POST"],
        credentials: true
    },
    // Le damos a Socket.io su PROPIA ruta para que no choque con Express
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