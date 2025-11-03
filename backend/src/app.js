// app.js (versión mejorada)
import express from "express";
import { __dirname } from "./utils.js";
import dbRouter from './routes/db.router.js';
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();

console.log('\n');

// Middleware logger
app.use((req, res, next) => {
  console.log(`--> Petición recibida: ${req.method} ${req.originalUrl}`);
  next();
});

// Parsear FRONT_URL robustamente (corta espacios, ignora cadenas vacías)
const rawFront = process.env.FRONT_URL || "";
const allowedFromEnv = rawFront
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Orígenes adicionales útiles para mobile/dev
const extras = [
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "http://127.0.0.1",
];

const allowedOrigins = Array.from(new Set([...allowedFromEnv, ...extras]));

console.log('Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: function(origin, callback) {
    console.log('--> CORS origin header:', origin);
    // Permitir solicitudes desde apps nativas o herramientas que no envían Origin
    if (!origin) {
      if (process.env.ALLOW_UNDEFINED_ORIGIN === 'true') {
        console.log('--> Allowing undefined origin because ALLOW_UNDEFINED_ORIGIN=true');
        return callback(null, true);
      } else {
        console.log('--> Rejecting undefined origin (set ALLOW_UNDEFINED_ORIGIN=true to allow)');
        return callback(new Error('CORS - origin undefined not allowed'), false);
      }
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.log(`--> CORS rejecting origin: ${origin}`);
    return callback(new Error('CORS - origin not allowed: ' + origin), false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Asegurar preflight

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.status(200).send('Server is live and healthy!');
});

app.use("/api", dbRouter);

export default app;
