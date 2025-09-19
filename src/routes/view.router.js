import { Router } from "express";
import { __dirname } from "../utils.js";
import { requireAuth, isAdmin } from "../config/authMiddleware.js"
import express from 'express';
import multer from "multer";
import path from 'path';
import UserDao from "../dao/userDao.js";
import VehicleDao from "../dao/vehicleDao.js";
import SupportController from "../controllers/support.controller.js";







const router = Router()

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public/uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});
const upload = multer({ storage: storage });

// Middleware para pasar el objeto user a las vistas
const setUserInLocals = (req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
};

// Usar el middleware en todas las rutas
router.use(setUserInLocals);

router.use('/support', express.static(path.join(__dirname, 'public')))
router.use('/support-tickets', express.static(path.join(__dirname, 'public')))
router.use('/case', express.static(path.join(__dirname, 'public')))
router.use('/vehicle', express.static(path.join(__dirname, 'public')));
router.use('/eddit/:productId', express.static(path.join(__dirname, 'public')));
router.use('/realtimevehicle', express.static(path.join(__dirname, 'public')));
router.use('/vehicleInformation', express.static(path.join(__dirname, 'public')));




router.get('/eddit/:productId', VehicleDao.edditVehicle);

router.get("/realtimevehicle", requireAuth, VehicleDao.realtimeVehicle);



router.get('/', (req, res) => {
    res.render('home'); 
});




router.get('/login', UserDao.login);

router.get('/register', UserDao.register);

// Muestra el formulario en /support
router.get('/support', SupportController.renderSupportForm);

// Muestra la lista de tickets en /support-tickets
router.get('/support-tickets', SupportController.renderSupportTicketsPage);

// Muestra un caso específico
router.get('/case/:tid', SupportController.renderCasePage);


router.get('/logout', UserDao.logout);

router.get("/vehiclegeneral", requireAuth, isAdmin, VehicleDao.vehicleGeneral);

router.get("/vehicle", requireAuth, VehicleDao.vehicle);

router.get("/vehicle/filtrar", requireAuth, VehicleDao.vehicleFilter);

// Obtener información de vehiculos 

router.get("/vehicleInformation/:cid", requireAuth, VehicleDao.vehicleInformation);

router.get("/:cid", requireAuth, VehicleDao.vehicleDetail);






export default router