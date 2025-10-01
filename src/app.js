import express from "express";
import viewRouter from "./routes/view.router.js";
import { __dirname } from "./utils.js";
import handlebars from "express-handlebars";
import cookieParser from 'cookie-parser';
import connectToDB from "./config/configServer.js";
import session from "express-session";
import MongoStore from 'connect-mongo';
import dbRouter from './routes/db.router.js';
import dotenv from "dotenv";
import cors from "cors";
import os from 'os';

dotenv.config();

const app = express();

app.use((req, res, next) => {
    console.log(`--> Petición recibida: ${req.method} ${req.originalUrl}`);
    next();
});

app.use(express.static("public"));

// --- INICIO DE LA CORRECCIÓN CLAVE ---
// Lista de orígenes permitidos
const allowedOrigins = [
    'http://localhost:5173',      // Para el desarrollo en desktop
    'http://10.175.41.247:5173', // Para desarrollo en desktop usando la IP
    'capacitor://localhost',      // Origen para apps de Capacitor en Android/iOS
    'http://localhost'            // Origen que a veces usa el WebView de Android
];

// Configuración de CORS robusta
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('La política de CORS no permite el acceso desde este origen.'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
// --- FIN DE LA CORRECCIÓN CLAVE ---


app.use(cookieParser("CoderCookie"));

// --- INICIO DE LA CORRECCIÓN DE SESIÓN ---
app.use(session({
    store: MongoStore.create({
        mongoUrl: process.env.URL_MONGO,
        ttl: 3 * 60 * 60
    }),
    secret: process.env.SECRET_KEY,
    resave: true,
    saveUninitialized: true,
    cookie: {
        sameSite: 'lax', // Permite cookies entre sitios en la mayoría de los casos
        secure: false    // Poner en 'true' solo cuando se usa HTTPS
    }
}));
// --- FIN DE LA CORRECCIÓN DE SESIÓN ---

const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.engine("handlebars", handlebars.engine());
app.set('view engine', 'handlebars');
app.set("views", __dirname + "/views");

// ... (El resto de tu archivo app.js no necesita cambios) ...
app.use("/api", dbRouter);
app.use("/", viewRouter);

// Función para obtener IP (esto ya estaba bien)
const getLocalIpAddress = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '0.0.0.0';
};
const localIp = getLocalIpAddress();

const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor escuchando en el puerto ${PORT}`);
    console.log('   Acceder en:');
    console.log(`   - Local:     http://localhost:${PORT}/`);
    console.log(`   - Red local: http://${localIp}:${PORT}/`);
});
connectToDB();