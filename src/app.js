import express from "express"
import viewRouter from "./routes/view.router.js"
import {__dirname} from "./utils.js"
import handlebars from "express-handlebars"
import cookieParser from 'cookie-parser'
import connectToDB from "./config/configServer.js"
import session from "express-session"
import MongoStore from 'connect-mongo'
import dbRouter from "./routes/db.router.js"
import dotenv from "dotenv"
import cors from "cors"

dotenv.config()

const app=express()

app.use(express.static(__dirname+"/public"))
app.use(cors({origin:"http://127.0.0.1:5500", methods:["GET","POST","PUT","DELETE"]}))

app.use(cookieParser("CoderCookie"))
app.use(session({
    store: MongoStore.create({
        mongoUrl:process.env.URL_MONGO,
        ttl:3*60*60
    }),
    secret:process.env.SECRET_KEY,
    resave: true,
    saveUninitialized:true
}))



const PORT=process.env.PORT||8080;


app.use(express.json())
app.use(express.urlencoded({extended:true}))



app.engine("handlebars",handlebars.engine())
app.set('view engine', 'handlebars');
app.set("views",__dirname+"/views")

app.get('/setSession',(req,res)=>{
    req.session.user = 'userName',
    req.session.admin = true

    res.send('Usuario Logueado')
})

app.get('/getSession',(req,res)=>{
    

    res.send(req.session.user)
})

app.get('/setCookies', (req, res) => {
    res.cookie('CoderCookie', {user: process.env.EMAIL}, {}).send('cookie creada');
});

app.get('/getCookies', (req, res) => {
    res.send(req.cookies)
});


app.use("/",viewRouter)
app.use("/",dbRouter)

 
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



