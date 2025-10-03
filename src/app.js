import express from "express"
import viewRouter from "./routes/view.router.js"
import { __dirname } from "./utils.js"
import handlebars from "express-handlebars"
import cookieParser from 'cookie-parser'
import connectToDB from "./config/configServer.js"
import session from "express-session"
import MongoStore from 'connect-mongo'
import dbRouter from './routes/db.router.js';
import dotenv from "dotenv"
import cors from "cors"

dotenv.config()

const app = express()

app.use((req, res, next) => {
    console.log(`--> Petición recibida: ${req.method} ${req.originalUrl}`);
    next();
});

app.use(express.static("public"))

const allowedOrigins = process.env.FRONT_URL ? process.env.FRONT_URL.split(',') : [];

// 2. Usamos una función en la configuración de CORS para validar el origen dinámicamente.
app.use(cors({
    origin: function (origin, callback) {
        // Permitimos peticiones sin origen (ej: Postman, apps móviles) y orígenes en nuestra lista blanca.
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));


app.use(cookieParser("CoderCookie"))
app.use(session({
    store: MongoStore.create({
        mongoUrl: process.env.URL_MONGO,
        ttl: 3 * 60 * 60
    }),
    secret: process.env.SECRET_KEY,
    resave: true,
    saveUninitialized: true
}))

const PORT = process.env.PORT || 8080;

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.engine("handlebars", handlebars.engine())
app.set('view engine', 'handlebars');
app.set("views", __dirname + "/views")

app.get('/setSession', (req, res) => {
    req.session.user = 'userName',
    req.session.admin = true
    res.send('Usuario Logueado')
})

app.get('/getSession', (req, res) => {
    res.send(req.session.user)
})

app.get('/setCookies', (req, res) => {
    res.cookie('CoderCookie', { user: process.env.EMAIL }, {}).send('cookie creada');
});

app.get('/getCookies', (req, res) => {
    res.send(req.cookies)
});

app.use("/api", dbRouter);
app.use("/", viewRouter);

const httpServer = app.listen(PORT, () => {
    try {
        console.log(`Listening to the port ${PORT}\nAcceder a:`);
        console.log(`\t1). http://localhost:${PORT}/`)
    }
    catch (err) {
        console.log(err);
    }
});

connectToDB()