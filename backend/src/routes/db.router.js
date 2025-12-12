// Importaciones
import { Router } from "express";
import { __dirname } from "../utils.js";
import multer from "multer";
import VehicleController from "../controllers/vehicle.controller.js";
import UserController from "../controllers/user.controller.js";
import SupportController from "../controllers/support.controller.js";
import { userDao as userRepository } from "../repository/index.js";
import jwt from 'jsonwebtoken';
import { verifyToken } from "../config/authMiddleware.js";
import ChatController from "../controllers/chat.controller.js";
import Usuario from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import { Op } from 'sequelize';
import axios from 'axios';
import { sendPasswordResetEmail } from "../services/email.service.js";
import DashboardController from "../controllers/dashboard.controller.js";

// Verificación: "¿Es admin o no?"
const verifyAdmin = (req, res, next) => {
    if (!req.user || !req.user.admin) {
        // Si no es admin, mostramos error
        return res.status(403).json({ message: 'Acción no autorizada. Solo los administradores pueden realizar esta acción.' });
    }
    // Si es admin, dejamos continuar
    next();
};

// Definición del router
// Esto crea un nuevo router de Express para manejar las rutas relacionadas con la base de datos
const router = Router();

// Middleware para todas las rutas
router.use((req, res, next) => {
    next();
});

// Configuración de multer para manejo de archivos en memoria
const storage = multer.memoryStorage();
// Inicializamos multer con la configuración de almacenamiento
const upload = multer({ storage: storage });


// Ruta para que funcione UpTimeRobot
router.get("/health", (req, res) => {
    // Respuesta simple para indicar que el servidor está activo
    // Cada 5 minutos UpTimeRobot hará una petición a esta ruta
    res.status(200).send("OK");
});

//  Rutas de autenticación

// Ruta de registro de usuario (solo admin puede crear usuarios)
router.post('/register', verifyToken, verifyAdmin, upload.single('profile_picture'), UserController.registerUser);

// Ruta de login
router.post('/login', async (req, res) => {
    // Extraemos los datos del body
    const { username, password, recaptchaToken } = req.body;

    try {
        // Verificación de reCAPTCHA si se proporciona el token
        if (recaptchaToken) {
            // Verificamos el token con la API de Google
            const secretKey = process.env.RECAPTCHA_SECRET_KEY;
            // Si no está configurada la clave secreta, mostramos error
            if (!secretKey) return res.status(500).json({ message: 'Error de configuración del servidor.' });
            // Construimos la URL de verificación
            const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
            try {
                // Hacemos la petición a la API de Google
                const response = await axios.post(verificationURL);
                // Evaluamos la respuesta
                const { success, score } = response.data;
                // Si no es exitosa o el score es bajo, mostramos error
                if (!success || score < 0.5) return res.status(403).json({ message: 'Verificación de reCAPTCHA fallida.' });
            } catch (recaptchaError) {
                // Manejo de errores en la verificación de reCAPTCHA
                return res.status(500).json({ message: 'Error del servidor durante la verificación.' });
            }
        }

        // Intentamos loguear al usuario con el repositorio
        const user = await userRepository.loginUser(username, password);
        // Si no se encuentra el usuario o la contraseña es incorrecta, mostramos error
        const { password: _, ...userPayload } = user.get({ plain: true });
        // Generamos el token JWT con la información del usuario
        const token = jwt.sign(userPayload, process.env.SECRET_KEY, { expiresIn: '1d' });
        // Devolvemos la respuesta exitosa con el usuario y el token
        res.status(200).json({ status: 'success', user: userPayload, token });

    } catch (error) {
        // Manejo de errores
        if (error.message === "Credenciales inválidas") {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }
        // Error genérico del servidor
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
});

// Ruta de obtención de usuario actual
router.get('/user/current', verifyToken, (req, res) => {
    // Devolvemos el usuario autenticado
    res.status(200).json({ user: req.user });
});

// Ruta para obtener los perfiles del usuario
router.get('/users/profile/:id', verifyToken, async (req, res) => {
    try {
        // Obtenemos el usuario por ID
        const user = await userRepository.getUserById(req.params.id);
        // Si no existe, mostramos error
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        // Devolvemos solo datos seguros
        res.json({
            // Datos del usuario
            id: user.id,
            username: user.username,
            email: user.email,
            unidad: user.unidad,
            profile_picture: user.profile_picture,
            admin: user.admin
        });
    } catch (error) {
        // Manejo de errores
        console.error("Error en GET /profile:", error);
        // Error genérico del servidor
        res.status(500).json({ message: 'Error al obtener perfil' });
    }
});

// Ruta para actualizar mi propia foto de perfil
router.put('/user/profile/photo', verifyToken, upload.single('profile_picture'), async (req, res) => {
    try {
        // Verificamos que se haya subido un archivo
        if (!req.file) return res.status(400).json({ message: 'No se subió ninguna imagen' });
        // Llamamos al controlador para actualizar la foto
        const updatedUser = await UserController.updateSelfProfilePicture(req.user.id, req.file);
        // Mostramos exito al actualizar la foto
        res.json({ message: 'Foto actualizada', user: updatedUser });

    } catch (error) {
        // Manejo de errores
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar foto' });
    }
});

// Ruta para borrar foto de perfil (admin o dueño de la misma foto)
router.delete('/users/profile/:id/photo', verifyToken, async (req, res) => {
    try {
        // Obtenemos el ID del usuario objetivo y el usuario que hace la petición
        const targetUserId = parseInt(req.params.id);
        const requestingUser = req.user;
        // Verificar permisos: ¿Es el dueño o es admin?
        if (requestingUser.id !== targetUserId && !requestingUser.admin) {
            // Mostramos error si no hay permiso para ejecutar la operación
            return res.status(403).json({ message: 'No tienes permiso para modificar este perfil.' });
        }
        // Llamamos al controlador para eliminar la foto
        await UserController.deleteProfilePicture(targetUserId);
        // Mostramos exito al eliminar la foto
        res.json({ message: 'Foto eliminada correctamente' });

    } catch (error) {
        // Manejo de errores
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar foto' });
    }
});

// Rutas de gestión de datos (CRUD)

// Ruta para obtener todos los usuarios
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
        // Obtenemos los filtros desde los query params
        const filters = req.query;
        // Llamamos al controlador para obtener los usuarios con los filtros
        const users = await UserController.getAllUsers(filters);
        // Devolvemos la lista de usuarios
        res.status(200).json(users);
    } catch (error) {
        // Manejo de errores
        console.error("Error en GET /api/users:", error);
        res.status(500).json({ message: 'Error al obtener los usuarios', error: error.message });
    }
});

// Ruta para obtener un usuario por ID
router.put('/users/:id', verifyToken, verifyAdmin, upload.single('profile_picture'), UserController.updateUser);

// Ruta para eliminar un usuario por ID
router.delete('/users/:id', verifyToken, verifyAdmin, UserController.deleteUserContoller);

// Ruta para función de recuperar contraseña (usuario, email, contraseña,etc.)
router.post('/forgot-password', async (req, res) => {
    // Extraemos el email del body
    const { email } = req.body;
    try {
        // Buscamos el usuario por email
        const user = await userRepository.findUserByEmail(email);
        // Si no existe, mostramos mensaje generico para evitar filtrado de emails
        if (!user) {
            // Mensaje generico
            return res.status(200).json({ message: 'Si existe una cuenta con ese email, se ha enviado un enlace de recuperación.' });
        }
        // Generamos un token de reseteo con expiración corta
        const resetPayload = { userId: user.id, email: user.email };
        const resetToken = jwt.sign(resetPayload, process.env.SECRET_KEY, { expiresIn: '15m' });
        const frontendUrl = process.env.FRONT_URL.split(',')[0];
        const resetLink = `${frontendUrl}/reset-password/${resetToken}`;
        // Enviamos el email con el enlace de reseteo
        await sendPasswordResetEmail(user.email, resetLink);
        // Respondemos con mensaje genérico
        res.status(200).json({ message: 'Si existe una cuenta con ese email, se ha enviado un enlace de recuperación.' });
    } catch (error) {
        // Manejo de errores
        console.error("Error en /forgot-password:", error);
        // Devolvemos error genérico del servidor
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Ruta para resetear la contraseña por una nueva
router.post('/reset-password', async (req, res) => {
    // Extraemos el token y la nueva contraseña del body
    const { token, newPassword } = req.body;
    // Verificamos que se hayan proporcionado ambos
    if (!token || !newPassword) {
        // Manejo de errores
        return res.status(400).json({ message: 'Faltan el token o la nueva contraseña.' });
    }
    try {
        // Verificamos token y chequeamos contraseña, si hay exito, mostramos un mensaje
        const payload = jwt.verify(token, process.env.SECRET_KEY);
        const { userId } = payload;
        // Actualizamos la contraseña del usuario
        await userRepository.updateUserPassword(userId, newPassword);
        // Respondemos con éxito
        res.status(200).json({ message: 'Contraseña actualizada con éxito. Ya puedes iniciar sesión.' });
    } catch (error) {
        // Manejo de errores específicos de JWT
        // Mostramos error de que el enlace expiró, pasados los minutos
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'El enlace de recuperación ha expirado. Por favor, solicita uno nuevo.' });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            // Token inválido
            return res.status(401).json({ message: 'El enlace de recuperación no es válido.' });
        }
        // Error en la pagina
        console.error("Error en /reset-password:", error);
        // Devolvemos error genérico del servidor
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Rutas para tokens (verificación, actualización y eliminación)
router.post('/user/fcm-token', verifyToken, async (req, res) => {
    try {
        // Extraemos el token FCM del body
        const { fcmToken } = req.body;
        const userId = req.user.id;
        // Verificamos que se haya proporcionado un token
        if (!fcmToken) return res.status(400).json({ message: 'No se proporcionó token.' });
        // Eliminamos el token FCM de otros usuarios que lo tengan asignado
        await Usuario.update({ fcm_token: null }, { where: { fcm_token: fcmToken, id: { [Op.ne]: userId } } });
        // Actualizamos el token FCM del usuario actual
        await Usuario.update({ fcm_token: fcmToken }, { where: { id: userId } });
        // Respondemos con éxito
        res.status(200).json({ message: 'Token FCM actualizado.' });
    } catch (error) {
        // Manejo de errores
        console.error("Error al guardar FCM token:", error);
        // Devolvemos error genérico del servidor
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


// Rutas de Vehiculos

// Rutas para obtener vehículos, agregar, actualizar y eliminar
router.get("/vehicle/:cid", verifyToken, VehicleController.getVehicleById);
router.put("/vehicle/:productId", verifyToken, VehicleController.updateVehicle);
router.post('/addVehicleWithImage', verifyToken, upload.array('thumbnail'), VehicleController.addVehicle);
router.post('/addVehicleNoImage', verifyToken, VehicleController.addVehicle);
router.delete('/vehicle/:pid', verifyToken, VehicleController.deleteVehicle);
router.delete('/vehicle/:vid/history/:fieldName', verifyToken, VehicleController.deleteLastHistoryEntry);
router.delete('/vehicle/:cid/history/all/:fieldName', verifyToken, VehicleController.deleteAllHistory);
router.delete('/vehicle/:cid/history/:fieldName/:historyId', verifyToken, VehicleController.deleteOneHistoryEntry);
router.get('/vehicles', verifyToken, VehicleController.getVehiclesForUser);
router.get("/vehicle/:cid/kilometrajes", verifyToken, VehicleController.getKilometrajes);
router.get("/vehicle/:cid/services", verifyToken, VehicleController.getServices);
router.get("/vehicle/:cid/reparaciones", verifyToken, VehicleController.getReparaciones);
router.get("/vehicle/:cid/destinos", verifyToken, VehicleController.getDestinos);
router.get("/vehicle/:cid/rodados", verifyToken, VehicleController.getRodados);
router.get("/vehicle/:cid/descripciones", verifyToken, VehicleController.getDescripciones);

// Rutas de Chat

// Rutas para obtener salas de chat, mensajes y subir archivos
router.get("/chat/myroom", verifyToken, ChatController.getMyRoom);
router.get("/chat/rooms", verifyToken, verifyAdmin, ChatController.getAdminRooms);
router.get("/chat/room/:roomId/messages", verifyToken, verifyAdmin, ChatController.getMessagesForRoom);
router.post("/chat/find-or-create-room", verifyToken, verifyAdmin, ChatController.findOrCreateRoomForUser);
router.post("/chat/upload", verifyToken, upload.array('files', 10), ChatController.uploadChatFile);


// Rutas de Soporte

// Rutas para crear tickets de soporte, obtener tickets y eliminar tickets
router.post('/support', upload.array('files'), SupportController.createTicket);
router.post('/support-no-files', SupportController.createTicketNoFiles);
router.get('/support-tickets', SupportController.getTickets);
router.get('/support/:ticketId', SupportController.getTicketById);
router.delete('/support/:pid', SupportController.deleteTicket);


// Rutas de notificaciones

// Ruta para obtener las notificaciones del usuario autenticado
router.get('/notifications', verifyToken, verifyAdmin, async (req, res) => {
    try {
        // Obtener notificaciones del usuario autenticado
        const userId = req.user.id;
        const notifications = await Notification.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
        });
        // Devolver las notificaciones
        res.status(200).json(notifications);
    } catch (error) {
        // Manejo de errores
        console.error("Error al obtener notificaciones:", error);
        res.status(500).json({ message: "Error al cargar notificaciones" });
    }
});

// Ruta para marcar todas las notificaciones como marcadas
router.put('/notifications/mark-all-read', verifyToken, verifyAdmin, async (req, res) => {
    try {
        // Actualizar todas las notificaciones del usuario a leídas
        await Notification.update({ is_read: true }, { where: { user_id: req.user.id, is_read: false } });
        res.status(200).json({ success: true, message: "Todas las notificaciones marcadas como leídas" });
    } catch (error) {
        // Manejo de errores
        console.error("Error al marcar todas como leídas:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
});

// Ruta para marcar UNA notificacion por ID como leida
router.put('/notifications/:id/read', verifyToken, verifyAdmin, async (req, res) => {
    try {
        // Actualizar la notificación específica a leída
        await Notification.update({ is_read: true }, { where: { id: req.params.id, user_id: req.user.id } });
        res.status(200).json({ success: true });
    } catch (error) {
        // Manejo de errores
        res.status(500).json({ message: "Error al actualizar notificación" });
    }
});

// Ruta para vaciar todas las notificaciones
router.delete('/notifications/clear-all', verifyToken, verifyAdmin, async (req, res) => {
    try {
        // Eliminar todas las notificaciones del usuario
        await Notification.destroy({ where: { user_id: req.user.id } });
        res.status(200).json({ success: true, message: "Bandeja vaciada." });
    } catch (error) {
        // Manejo de errores
        console.error("Error al vaciar notificaciones:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
});

// Ruta generica de eliminación de notificaciones por ID
router.delete('/notifications/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const notificationId = req.params.id;
        // Eliminar la notificación específica del usuario
        const result = await Notification.destroy({ where: { id: notificationId, user_id: req.user.id } });
        if (result === 0) return res.status(404).json({ message: "Notificación no encontrada." });
        // Responde con éxito
        res.status(200).json({ success: true, message: "Notificación eliminada." });
    } catch (error) {
        // Manejo de errores
        console.error("Error al eliminar notificación:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
});

// Ruta para el dashboard

// Ruta para obtener estadísticas del dashboard
router.get("/dashboard/stats", verifyToken, verifyAdmin, DashboardController.getDashboardStats);

// Exportamos el router para usarlo en otros archivos
export default router;