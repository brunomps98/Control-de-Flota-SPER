import { Router } from "express";
import { __dirname } from "../utils.js";
import { requireAuth, isAdmin } from "../config/authMiddleware.js"
import express from 'express';
import multer from "multer";
import path from 'path';
import UserDao from "../dao/userDao.js";
import VehicleDao from "../dao/vehicleDao.js";




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

router.use('/vehicle', express.static(path.join(__dirname, 'public')));
router.use('/eddit/:productId', express.static(path.join(__dirname, 'public')));
router.use('/realtimevehicle', express.static(path.join(__dirname, 'public')));



router.get('/eddit/:productId', VehicleDao.edditVehicle);

router.get("/realtimevehicle", requireAuth, VehicleDao.realtimeVehicle);

router.get('/', UserDao.home);

router.get('/login', UserDao.login);

router.get('/register',  UserDao.register);

router.get('/logout', UserDao.logout);

router.get("/vehiclegeneral", requireAuth, isAdmin, VehicleDao.vehicleGeneral);

router.get("/vehicle", requireAuth, VehicleDao.vehicle);

router.get("/:cid", requireAuth, VehicleDao.vehicleDetail);

router.get("/vehicle/filtrar", requireAuth, VehicleDao.vehicleFilter);


export default router