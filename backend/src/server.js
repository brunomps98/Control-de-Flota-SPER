import app from './app.js'; 
import { connectToDB } from "./config/configServer.js";
import dotenv from "dotenv";
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { initializeSocket } from './socket/socketHandler.js'; 
import './models/user.model.js';
import './models/vehicle.model.js';
import './models/chat.model.js';
import './models/support.model.js'; 

dotenv.config();

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; 
const httpServer = http.createServer(app);

const vercelRegex = /^https:\/\/control-de-flota-sper.*\.vercel\.app$/;

const mobileOrigins = [
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost" 
];

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: [
            "http://localhost:5173", 
            vercelRegex, 
            ...mobileOrigins 
        ], 
        methods: ["GET", "POST"],
        credentials: true
    },
    path: "/socket.io/" 
});



initializeSocket(io);

const startServer = async () => {
    try {
        await connectToDB(); 
        httpServer.listen(PORT, HOST, () => { 
            console.log(`🚀 Servidor HTTP y Sockets escuchando en http://localhost:${PORT}/\n`);
        });
    } catch (err) {
        console.error("❌ Error al iniciar el servidor:", err);
    }
};

startServer();