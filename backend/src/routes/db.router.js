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
import Notification from '../models/notification.model.js'; // <--- IMPORT NUEVO
import { Op } from 'sequelize';
import rateLimit from 'express-rate-limit';
import axios from 'axios'; 
import { sendPasswordResetEmail } from "../services/email.service.js";
import DashboardController from "../controllers/dashboard.controller.js";

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
    standardHeaders: true, 
    legacyHeaders: false, 
    skip: (req, res) => process.env.NODE_ENV === 'development',
});

// --- RUTA PARA QUE FUNCIONE UPTIMEROBOT ---
router.get("/health", (req, res) => {
    res.status(200).send("OK");
});

// --- RUTAS DE AUTENTICACIÓN ---
router.post('/register', verifyToken, verifyAdmin, UserDao.registerUser);

// --- RUTA DE LOGIN ---
router.post('/login', loginLimiter, async (req, res) => { 
    const { username, password, recaptchaToken } = req.body;
    
    try {
        //  VERIFICACIÓN RECAPTCHA 
        if (recaptchaToken) {
            const secretKey = process.env.RECAPTCHA_SECRET_KEY;
            
            if (!secretKey) {
                console.error("RECAPTCHA_SECRET_KEY no está definida en las variables de entorno.");
                return res.status(500).json({ message: 'Error de configuración del servidor.' });
            }

            const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
            
            try {
                const response = await axios.post(verificationURL);
                const { success, score } = response.data;
                
                if (!success || score < 0.5) { 
                    return res.status(403).json({ message: 'Verificación de reCAPTCHA fallida. Inténtelo de nuevo.' });
                }
                
            } catch (recaptchaError) {
                console.error("Error al verificar reCAPTCHA:", recaptchaError.message);
                return res.status(500).json({ message: 'Error del servidor durante la verificación.' });
            }
        }

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

// --- RUTAS DE GESTIÓN DE USUARIOS (CRUD) ---
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const filters = req.query; 
        const users = await userDao.getAllUsers(filters); 
        res.status(200).json(users);
    } catch (error) {
        console.error("Error en GET /api/users:", error);
        res.status(500).json({ message: 'Error al obtener los usuarios', error: error.message });
    }
});

router.put('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const userIdToUpdate = req.params.id;
        const userData = req.body;

        if (req.user.id == userIdToUpdate && userData.admin === false) {
            return res.status(403).json({ message: 'No puedes revocar tu propio permiso de administrador.' });
        }
        
        if (userIdToUpdate == 6 && req.user.id != 6) {
             return res.status(403).json({ message: 'No se puede editar al usuario Administrador principal.' });
        }

        const updatedUser = await userDao.updateUser(userIdToUpdate, userData);
        res.status(200).json(updatedUser);

    } catch (error) {
        console.error("Error en PUT /api/users/:id:", error);
        res.status(500).json({ message: 'Error al actualizar el usuario', error: error.message });
    }
});

router.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const userIdToDelete = req.params.id;

        if (req.user.id == userIdToDelete) {
            return res.status(400).json({ message: 'No puedes eliminarte a ti mismo.' });
        }
        
        if (userIdToDelete == 6) {
             return res.status(403).json({ message: 'No se puede eliminar al usuario Administrador principal.' });
        }

        const result = await userDao.deleteUser(userIdToDelete);
        res.status(200).json(result);

    } catch (error) {
        console.error("Error en DELETE /api/users/:id:", error);
        res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await userDao.findUserByEmail(email);
        if (!user) {
            return res.status(200).json({ message: 'Si existe una cuenta con ese email, se ha enviado un enlace de recuperación.' });
        }
        const resetPayload = { userId: user.id, email: user.email };
        const resetToken = jwt.sign(resetPayload, process.env.SECRET_KEY, { expiresIn: '15m' }); 
        const frontendUrl = process.env.FRONT_URL.split(',')[0]; 
        const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

        await sendPasswordResetEmail(user.email, resetLink);
        res.status(200).json({ message: 'Si existe una cuenta con ese email, se ha enviado un enlace de recuperación.' });
    } catch (error) {
        console.error("Error en /forgot-password:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Faltan el token o la nueva contraseña.' });
    }
    try {
        const payload = jwt.verify(token, process.env.SECRET_KEY);
        const { userId } = payload;
        await userDao.updateUserPassword(userId, newPassword);
        res.status(200).json({ message: 'Contraseña actualizada con éxito. Ya puedes iniciar sesión.' });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'El enlace de recuperación ha expirado. Por favor, solicita uno nuevo.' });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'El enlace de recuperación no es válido.' });
        }
        console.error("Error en /reset-password:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.post('/user/fcm-token', verifyToken, async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const userId = req.user.id;
        if (!fcmToken) {
            return res.status(400).json({ message: 'No se proporcionó token.' });
        }
        await Usuario.update({ fcm_token: null }, {
            where: { fcm_token: fcmToken, id: { [Op.ne]: userId } }
        });
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
router.post("/chat/find-or-create-room", verifyToken, verifyAdmin, ChatController.findOrCreateRoomForUser);

// --- RUTAS DE SOPORTE ---
router.post('/support', upload.array('files'), SupportController.createTicket);
router.post('/support-no-files', SupportController.createTicketNoFiles);
router.get('/support-tickets', SupportController.getTickets);
router.get('/support/:ticketId', SupportController.getTicketById);
router.delete('/support/:pid', SupportController.deleteTicket);

// --- RUTAS DE NOTIFICACIONES (NUEVAS) ---
router.get('/notifications', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit: 50 
        });
        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error al obtener notificaciones:", error);
        res.status(500).json({ message: "Error al cargar notificaciones" });
    }
});

router.put('/notifications/mark-all-read', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const userId = req.user.id;
        // Actualizamos TODAS las notificaciones de este usuario que no estén leídas
        await Notification.update(
            { is_read: true }, 
            { 
                where: { 
                    user_id: userId,
                    is_read: false 
                } 
            }
        );
        res.status(200).json({ success: true, message: "Todas las notificaciones marcadas como leídas" });
    } catch (error) {
        console.error("Error al marcar todas como leídas:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
});

router.put('/notifications/:id/read', verifyToken, verifyAdmin, async (req, res) => {
    try {
        await Notification.update({ is_read: true }, {
            where: { id: req.params.id, user_id: req.user.id }
        });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar notificación" });
    }
});

router.delete('/notifications/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;

        // Eliminamos solo si el ID coincide y pertenece al usuario actual
        const result = await Notification.destroy({
            where: {
                id: notificationId,
                user_id: userId
            }
        });

        if (result === 0) {
            return res.status(404).json({ message: "Notificación no encontrada o no te pertenece." });
        }

        res.status(200).json({ success: true, message: "Notificación eliminada." });
    } catch (error) {
        console.error("Error al eliminar notificación:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
});

// --- BORRAR TODAS LAS NOTIFICACIONES ---
router.delete('/notifications/clear-all', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.destroy({
            where: { user_id: userId }
        });

        res.status(200).json({ success: true, message: "Bandeja vaciada." });
    } catch (error) {
        console.error("Error al vaciar notificaciones:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
});

// --- RUTAS DASHBOARD --- 
router.get("/dashboard/stats", verifyToken, verifyAdmin, DashboardController.getDashboardStats);

export default router;