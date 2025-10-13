import { Router } from "express";
import { __dirname } from "../utils.js";
import express from 'express';
import multer from "multer";
import path from 'path';
import VehicleDao from "../dao/vehicleDao.js";
import UserDao from "../dao/userDao.js";
import SupportController from "../controllers/support.controller.js";
import { userModel } from "../models/user.model.js";

// Nuevas importaciones para JWT
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// 1. Importamos el nuevo middleware de autenticación
import { verifyToken } from "../config/authMiddleware.js";

const router = Router();

router.use((req, res, next) => {
    console.log(`--> Petición llegó a db.router.js: ${req.method} ${req.url}`);
    next();
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        // Generamos un nombre único y seguro
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Extraemos la extensión del archivo original de forma segura
        const extension = path.extname(file.originalname);
        // Construimos el nombre final asegurando que la extensión esté presente
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const upload = multer({ storage: storage });

// 2. Eliminamos setUserInLocals y su uso, ya que dependía de sesiones.

// --- RUTAS DE AUTENTICACIÓN ---

router.post('/register', UserDao.registerUser);

// 3. Ruta de Login MODIFICADA para devolver un token
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await userModel.findOne({ username }).lean();
        if (!user) return res.status(401).json({ message: 'Credenciales incorrectas' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'Credenciales incorrectas' });

        // Extraemos los datos del usuario para el token (sin la contraseña)
        const { password: _, ...userPayload } = user;
        
        const token = jwt.sign(userPayload, process.env.SECRET_KEY, { expiresIn: '8h' });

        res.status(200).json({ status: 'success', user: userPayload, token });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// 4. Ruta para obtener el usuario actual a través del token (reemplaza a session/current)
router.get('/user/current', verifyToken, (req, res) => {
    res.status(200).json({ user: req.user });
});


// --- RUTAS PROTEGIDAS (ACTUALIZADAS con verifyToken) ---

router.get("/vehicle/:cid", verifyToken, VehicleDao.getVehicleById);
router.put("/vehicle/:productId", verifyToken, VehicleDao.updateVehicle);
router.post('/addVehicleWithImage', verifyToken, upload.array('thumbnail'), VehicleDao.addVehicleWithImage);
router.delete('/vehicle/:pid', verifyToken, VehicleDao.deleteVehicle);
router.delete('/vehicle/:vid/history/:fieldName', verifyToken, VehicleDao.deleteLastHistoryEntry);
router.get('/vehicles', verifyToken, VehicleDao.getVehiclesForUser);


// --- RUTAS PÚBLICAS (SIN CAMBIOS) ---
router.post('/support', upload.array('files'), SupportController.createTicket);
router.get('/support-tickets', SupportController.getTickets);
router.get('/support/:ticketId', SupportController.getTicketById);
router.delete('/support/:pid', SupportController.deleteTicket);

export default router;