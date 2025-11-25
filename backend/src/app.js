import express from "express";
import { __dirname } from "./utils.js";
import dbRouter from './routes/db.router.js';
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
console.log('\n');

// Mensaje log de petición recibida
app.use((req, res, next) => {
  console.log(`[BACK] --> Petición recibida: ${req.method} ${req.originalUrl}`);
  next();
});


// Definimos las opciones de CORS 
const rawFront = process.env.FRONT_URL || "";
const allowedFromEnv = rawFront
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);


// Todas las URL permitidas ademas de la que contiene FRONT_URL
const extras = [
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "http://127.0.0.1",
  "http://localhost:5173", 
  "http://10.0.2.2"
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
    
    // Si está en la lista o si coincide con el Regex de Vercel, permitir
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