import express from "express";
import { __dirname } from "./utils.js";
import dbRouter from './routes/db.router.js';
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();

console.log('\n');

app.use((req, res, next) => {
  console.log(`[BACK] --> Petición recibida: ${req.method} ${req.originalUrl}`);
  next();
});


// 1. Definimos las opciones de CORS 
const rawFront = process.env.FRONT_URL || "";
const allowedFromEnv = rawFront
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const extras = [
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "http://127.0.0.1",
  "http://localhost:5173" 
];
const allowedOrigins = Array.from(new Set([...allowedFromEnv, ...extras]));

// Definimos el "comodín" (Regex) de Vercel
const vercelRegex = /^https:\/\/control-de-flota-sper.*\.vercel\.app$/;

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) {
      if (process.env.ALLOW_UNDEFINED_ORIGIN === 'true') {
        return callback(null, true);
      } else {
        return callback(new Error('CORS - origin undefined not allowed'), false);
      }
    }
    
    // Permitir si está en la lista O si coincide con el Regex de Vercel
    if (allowedOrigins.includes(origin) || vercelRegex.test(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('CORS - origin not allowed: ' + origin), false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.status(200).send('Server is live and healthy!');
});

// Aplicamos el middleware de CORS y las opciones
app.use("/api", cors(corsOptions), dbRouter);

// Manejamos las peticiones OPTIONS explícitamente *solo* para /api
app.options('/api/*', cors(corsOptions)); 

export default app;