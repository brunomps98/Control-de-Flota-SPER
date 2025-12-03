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
import Notification from '../models/notification.model.js';
import { Op } from 'sequelize';
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
    next();
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Ruta para que funcione UpTimeRobot
router.get("/health", (req, res) => {
    res.status(200).send("OK");
});

//  Rutas de autenticación
router.post('/register', verifyToken, verifyAdmin, upload.single('profile_picture'), UserDao.registerUser);

// Ruta de login
router.post('/login', async (req, res) => {
    const { username, password, recaptchaToken } = req.body;

    try {
        if (recaptchaToken) {
            const secretKey = process.env.RECAPTCHA_SECRET_KEY;
            if (!secretKey) return res.status(500).json({ message: 'Error de configuración del servidor.' });

            const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
            try {
                const response = await axios.post(verificationURL);
                const { success, score } = response.data;
                if (!success || score < 0.5) return res.status(403).json({ message: 'Verificación de reCAPTCHA fallida.' });
            } catch (recaptchaError) {
                return res.status(500).json({ message: 'Error del servidor durante la verificación.' });
            }
        }

        const user = await userDao.loginUser(username, password);
        const { password: _, ...userPayload } = user.get({ plain: true });
        const token = jwt.sign(userPayload, process.env.SECRET_KEY, { expiresIn: '365d' });

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

router.get('/users/profile/:id', verifyToken, async (req, res) => {
    try {
        const user = await userDao.getUserById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        // Devolvemos solo datos seguros
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            unidad: user.unidad,
            profile_picture: user.profile_picture,
            admin: user.admin
        });
    } catch (error) {
        console.error("Error en GET /profile:", error);
        res.status(500).json({ message: 'Error al obtener perfil' });
    }
});

// Actualizar mi propia foto de perfil
router.put('/user/profile/photo', verifyToken, upload.single('profile_picture'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No se subió ninguna imagen' });
        const updatedUser = await UserDao.updateSelfProfilePicture(req.user.id, req.file);
        res.json({ message: 'Foto actualizada', user: updatedUser });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar foto' });
    }
});

// Borrar foto de perfil (Dueño o Admin)
router.delete('/users/profile/:id/photo', verifyToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.id);
        const requestingUser = req.user;

        // Verificar permisos: ¿Es el dueño O es admin?
        if (requestingUser.id !== targetUserId && !requestingUser.admin) {
            return res.status(403).json({ message: 'No tienes permiso para modificar este perfil.' });
        }

        // Llamamos al DAO para poner la foto en null
        await UserDao.deleteProfilePicture(targetUserId);
        
        res.json({ message: 'Foto eliminada correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar foto' });
    }
});

// Rutas de gestión de datos (CRUD)
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const filters = req.query;
        const users = await UserDao.getAllUsers(filters);
        res.status(200).json(users);
    } catch (error) {
        console.error("Error en GET /api/users:", error);
        res.status(500).json({ message: 'Error al obtener los usuarios', error: error.message });
    }
});

router.put('/users/:id', verifyToken, verifyAdmin, upload.single('profile_picture'), UserDao.updateUser);

router.delete('/users/:id', verifyToken, verifyAdmin, UserDao.deleteUserContoller);


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
        if (!fcmToken) return res.status(400).json({ message: 'No se proporcionó token.' });

        await Usuario.update({ fcm_token: null }, { where: { fcm_token: fcmToken, id: { [Op.ne]: userId } } });
        await Usuario.update({ fcm_token: fcmToken }, { where: { id: userId } });

        res.status(200).json({ message: 'Token FCM actualizado.' });
    } catch (error) {
        console.error("Error al guardar FCM token:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


// Rutas de Vehiculos
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

// Rutas de Chat
router.get("/chat/myroom", verifyToken, ChatController.getMyRoom);
router.get("/chat/rooms", verifyToken, verifyAdmin, ChatController.getAdminRooms);
router.get("/chat/room/:roomId/messages", verifyToken, verifyAdmin, ChatController.getMessagesForRoom);
router.post("/chat/find-or-create-room", verifyToken, verifyAdmin, ChatController.findOrCreateRoomForUser);
router.post("/chat/upload", verifyToken, upload.array('files', 10), ChatController.uploadChatFile);


// Rutas de Soporte
router.post('/support', upload.array('files'), SupportController.createTicket);
router.post('/support-no-files', SupportController.createTicketNoFiles);
router.get('/support-tickets', SupportController.getTickets);
router.get('/support/:ticketId', SupportController.getTicketById);
router.delete('/support/:pid', SupportController.deleteTicket);

// Rutas de notificaciones
router.get('/notifications', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
        });
        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error al obtener notificaciones:", error);
        res.status(500).json({ message: "Error al cargar notificaciones" });
    }
});

//Ruta para marcar todas las notificaciones como marcadas
router.put('/notifications/mark-all-read', verifyToken, verifyAdmin, async (req, res) => {
    try {
        await Notification.update({ is_read: true }, { where: { user_id: req.user.id, is_read: false } });
        res.status(200).json({ success: true, message: "Todas las notificaciones marcadas como leídas" });
    } catch (error) {
        console.error("Error al marcar todas como leídas:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
});

router.put('/notifications/:id/read', verifyToken, verifyAdmin, async (req, res) => {
    try {
        await Notification.update({ is_read: true }, { where: { id: req.params.id, user_id: req.user.id } });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar notificación" });
    }
});

// Ruta para vaciar notificaciones
router.delete('/notifications/clear-all', verifyToken, verifyAdmin, async (req, res) => {
    try {
        await Notification.destroy({ where: { user_id: req.user.id } });
        res.status(200).json({ success: true, message: "Bandeja vaciada." });
    } catch (error) {
        console.error("Error al vaciar notificaciones:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
});

// Ruta generica de notifaciones con ID
router.delete('/notifications/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const result = await Notification.destroy({ where: { id: notificationId, user_id: req.user.id } });
        if (result === 0) return res.status(404).json({ message: "Notificación no encontrada." });
        res.status(200).json({ success: true, message: "Notificación eliminada." });
    } catch (error) {
        console.error("Error al eliminar notificación:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
});

// Ruta para el dashboard
router.get("/dashboard/stats", verifyToken, verifyAdmin, DashboardController.getDashboardStats);

export default router;