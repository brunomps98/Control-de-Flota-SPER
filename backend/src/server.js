import app from './app.js'; 
import { connectToDB } from "./config/configServer.js";
import dotenv from "dotenv";
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { initializeSocket } from './socket/socketHandler.js'; 
// Importamos los modelos para asegurar que se registren en la DB antes de iniciar
import './models/user.model.js';
import './models/user.model.js';
import './models/vehicle.model.js';
import './models/chat.model.js';
import './models/support.model.js'; 

dotenv.config(); // Carga variables de entorno (.env)

// Usamos http.createServer para poder unir Express + Socket.io en el mismo puerto
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; 
const httpServer = http.createServer(app);

// Configuración de orígenes permitidos
const rawFront = process.env.FRONT_URL || "";
const allowedFromEnv = rawFront
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const mobileOrigins = [
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "http://127.0.0.1",
  "http://localhost:5173",
  "http://10.0.2.2" 
];

const allowedOrigins = Array.from(new Set([...allowedFromEnv, ...mobileOrigins]));

// Para que cors permita cualquier url de vercel con el mismo dominio
const vercelRegex = /^https:\/\/control-de-flota-sper.*\.vercel\.app$/;

// Configuración de socketIO
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: function(origin, callback) {
          
          if (!origin) { 
            if (process.env.ALLOW_UNDEFINED_ORIGIN === 'true') {
              return callback(null, true);
            } else {
              return callback(new Error('CORS (Socket.io) - origin undefined no permitido'), false);
            }
          }
          
          if (vercelRegex.test(origin)) {
            return callback(null, true);
          }
          
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          
          return callback(new Error('CORS (Socket.io) - origen no permitido: ' + origin), false);
        },
        methods: ["GET", "POST"],
        credentials: true
    },
    path: "/socket.io/" 
});
// Inicializamos la lógica de los eventos (Chat, Notificaciones)
initializeSocket(io);

// Función de arranque 
const startServer = async () => {
    try {
      // Primero conectamos a la base de datos
        await connectToDB(); 
        // Si la DB conecta, iniciamos el servidor HTTP
        httpServer.listen(PORT, HOST, () => { 
            console.log(`Servidor HTTP y Sockets escuchando en http://localhost:${PORT}/\n`);
        });
    } catch (err) {
      // Sino arrojamos error
        console.error("Error al iniciar el servidor:", err);
    }
};

// Ejecutar arranque
startServer();