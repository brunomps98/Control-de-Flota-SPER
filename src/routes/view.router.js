import { Router } from "express";
import { __dirname } from "../utils.js";
import { verifyToken, isAdmin } from "../config/authMiddleware.js";
import express from 'express';
import multer from "multer";
import path from 'path';
import UserDao from "../dao/userDao.js";
import VehicleDao from "../dao/vehicleDao.js";
import SupportController from "../controllers/support.controller.js";

const router = Router();
const upload = multer({ });


// ... (rutas estáticas)
router.use('/support', express.static(path.join(__dirname, 'public')));
// ...

router.get('/eddit/:productId', VehicleDao.edditVehicle);


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