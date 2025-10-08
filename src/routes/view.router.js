import { Router } from "express";
import { __dirname } from "../utils.js";
// 1. Cambiamos 'requireAuth' por 'verifyToken'
import { verifyToken, isAdmin } from "../config/authMiddleware.js";
import express from 'express';
import multer from "multer";
import path from 'path';
import UserDao from "../dao/userDao.js";
import VehicleDao from "../dao/vehicleDao.js";
import SupportController from "../controllers/support.controller.js";

const router = Router();
const upload = multer({ /* ... (sin cambios) ... */ });

// 2. Eliminamos setUserInLocals y su uso

// ... (rutas estáticas sin cambios)
router.use('/support', express.static(path.join(__dirname, 'public')));
// ...

router.get('/eddit/:productId', VehicleDao.edditVehicle);

// 3. Reemplazamos 'requireAuth' por 'verifyToken'
router.get("/realtimevehicle", verifyToken, VehicleDao.realtimeVehicle);
router.get('/', (req, res) => res.render('home'));
router.get('/login', UserDao.login);
router.get('/register', UserDao.register);
router.get('/support', SupportController.renderSupportForm);
router.get('/support-tickets', SupportController.renderSupportTicketsPage);
router.get('/case/:tid', SupportController.renderCasePage);
router.get('/logout', UserDao.logout);
router.get("/vehiclegeneral", verifyToken, isAdmin, VehicleDao.vehicleGeneral);
router.get("/vehicle", verifyToken, VehicleDao.vehicle);
router.get("/vehicle/filtrar", verifyToken, VehicleDao.vehicleFilter);
router.get("/vehicleInformation/:cid", verifyToken, VehicleDao.vehicleInformation);
router.get("/:cid", verifyToken, VehicleDao.vehicleDetail);

export default router;