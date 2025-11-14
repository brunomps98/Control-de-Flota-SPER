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
import ChatController from "../controllers/chat.controller.js";
import Usuario from '../models/user.model.js'; 
import { Op } from 'sequelize';
import rateLimit from 'express-rate-limit';

const verifyAdmin = (req, res, next) => {
    if (!req.user || !req.user.admin) {
        return res.status(403).json({ message: 'Acción no autorizada. Solo los administradores pueden realizar esta acción.' });
    }
    next();
};

const router = Router();

router.use((req, res, next) => {
    console.log(`--> Petición llegó a db.router.js: ${req.method} ${req.url}`);
    next();
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Límite de 5 intentos de login por IP cada 15 minutos
    message: { message: 'Demasiados intentos de inicio de sesión desde esta IP. Por favor, intente de nuevo después de 15 minutos.' },
    standardHeaders: true, // Devuelve la info del límite en los headers `RateLimit-*`
    legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*` (obsoletos)
});


// --- RUTAS DE AUTENTICACIÓN ---
router.post('/register', verifyToken, verifyAdmin, UserDao.registerUser);

router.post('/login', loginLimiter, async (req, res) => { 
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

// Ruta para guardar token FCM

router.post('/user/fcm-token', verifyToken, async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const userId = req.user.id;

        if (!fcmToken) {
            return res.status(400).json({ message: 'No se proporcionó token.' });
        }
        
        // Desvincula este token de cualquier *otro* usuario
        await Usuario.update({ fcm_token: null }, {
            where: { 
                fcm_token: fcmToken,
                id: { [Op.ne]: userId } // [Op.ne] significa "no es igual"
            }
        });

        // Asigna el token al usuario actual
        await Usuario.update({ fcm_token: fcmToken }, {
            where: { id: userId }
        });

        res.status(200).json({ message: 'Token FCM actualizado.' });
    } catch (error) {
        console.error("Error al guardar FCM token:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


// --- RUTAS DE VEHÍCULOS (Protegidas) ---
router.get("/vehicle/:cid", verifyToken, VehicleDao.getVehicleById);
router.put("/vehicle/:productId", verifyToken, VehicleDao.updateVehicle);
router.post('/addVehicleWithImage', verifyToken, upload.array('thumbnail'), VehicleDao.addVehicle);
router.post('/addVehicleNoImage', verifyToken, VehicleDao.addVehicle);
router.delete('/vehicle/:pid', verifyToken, VehicleDao.deleteVehicle);
router.delete('/vehicle/:vid/history/:fieldName', verifyToken, VehicleDao.deleteLastHistoryEntry);
router.delete('/vehicle/:cid/history/all/:fieldName', verifyToken, VehicleDao.deleteAllHistory);
router.delete('/vehicle/:cid/history/:fieldName/:historyId', verifyToken, VehicleDao.deleteOneHistoryEntry);
router.get('/vehicles', verifyToken, VehicleDao.getVehiclesForUser);
router.get("/vehicle/:cid/kilometrajes", verifyToken, VehicleDao.getKilometrajes);
router.get("/vehicle/:cid/services", verifyToken, VehicleDao.getServices);
router.get("/vehicle/:cid/reparaciones", verifyToken, VehicleDao.getReparaciones);
router.get("/vehicle/:cid/destinos", verifyToken, VehicleDao.getDestinos);
router.get("/vehicle/:cid/rodados", verifyToken, VehicleDao.getRodados);
router.get("/vehicle/:cid/descripciones", verifyToken, VehicleDao.getDescripciones);

// --- RUTAS DE CHAT (Protegidas) ---
router.get("/chat/myroom", verifyToken, ChatController.getMyRoom);
router.get("/chat/rooms", verifyToken, verifyAdmin, ChatController.getAdminRooms);
router.get("/chat/room/:roomId/messages", verifyToken, verifyAdmin, ChatController.getMessagesForRoom);

// --- RUTAS DE SOPORTE  ---
router.post('/support', upload.array('files'), SupportController.createTicket);
router.post('/support-no-files', SupportController.createTicketNoFiles);
router.get('/support-tickets', SupportController.getTickets);
router.get('/support/:ticketId', SupportController.getTicketById);
router.delete('/support/:pid', SupportController.deleteTicket);

export default router;