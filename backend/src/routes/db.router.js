import { Router } from "express";
import { __dirname } from "../utils.js";
import express from 'express';
import multer from "multer";
import path from 'path';

import VehicleDao from "../dao/vehicleDao.js";
import UserDao from "../dao/userDao.js";
import SupportController from "../controllers/support.controller.js";

import { userDao } from "../repository/index.js"; 

import jwt from 'jsonwebtoken';
import { verifyToken } from "../config/authMiddleware.js";

const router = Router();

router.use((req, res, next) => {
    console.log(`--> Petición llegó a db.router.js: ${req.method} ${req.url}`);
    next();
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/public/uploads');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});
const upload = multer({ storage: storage });


// --- RUTAS DE AUTENTICACIÓN  ---
router.post('/register', UserDao.registerUser); 

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await userDao.loginUser(username, password);
        const { password: _, ...userPayload } = user.get({ plain: true });

        const token = jwt.sign(userPayload, process.env.SECRET_KEY, { expiresIn: '8h' });
        
        res.status(200).json({ status: 'success', user: userPayload, token });
    
    } catch (error) {
        if (error.message === "Credenciales inválidas") {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
});

router.get('/user/current', verifyToken, (req, res) => {
    res.status(200).json({ user: req.user });
});


// --- RUTAS DE VEHÍCULOS (Protegidas) ---
router.get("/vehicle/:cid", verifyToken, VehicleDao.getVehicleById);
router.put("/vehicle/:productId", verifyToken, VehicleDao.updateVehicle); 
router.post('/addVehicleWithImage', verifyToken, upload.array('thumbnail'), VehicleDao.addVehicle); 
router.post('/addVehicleNoImage', verifyToken, VehicleDao.addVehicle);
router.delete('/vehicle/:pid', verifyToken, VehicleDao.deleteVehicle);
router.delete('/vehicle/:vid/history/:fieldName', verifyToken, VehicleDao.deleteLastHistoryEntry);
router.get('/vehicles', verifyToken, VehicleDao.getVehiclesForUser);


// --- RUTAS DE SOPORTE  ---
router.post('/support', upload.array('files'), SupportController.createTicket); 
router.post('/support-no-files', SupportController.createTicketNoFiles);
router.get('/support-tickets', SupportController.getTickets);
router.get('/support/:ticketId', SupportController.getTicketById);
router.delete('/support/:pid', SupportController.deleteTicket);

export default router;