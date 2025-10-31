import express from "express";
import { __dirname } from "./utils.js";
import dbRouter from './routes/db.router.js';
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();

console.log('\n');

// Middleware para loggear todas las peticiones
app.use((req, res, next) => {
    console.log(`--> Petición recibida: ${req.method} ${req.originalUrl}`);
    next();
});

app.use(express.static(__dirname + "/public"));

// Configuración de CORS
const allowedOrigins = process.env.FRONT_URL ? process.env.FRONT_URL.split(',') : [];
app.use(cors({
    origin: function (origin, callback) {
        console.log('--> Origen de la petición CORS:', origin);
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", dbRouter);

export default app;