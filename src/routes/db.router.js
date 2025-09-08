import { Router } from "express";
import { __dirname } from "../utils.js";
import { requireAuth, isAdmin, limitFailedAttempts } from "../config/authMiddleware.js"
import express from 'express';
import multer from "multer";
import path from 'path';
import VehicleDao from "../dao/vehicleDao.js";
import UserDao from "../dao/userDao.js";
import SupportController from "../controllers/support.controller.js";





const router = Router()

router.use((req, res, next) => {
    console.log(`--> Petición llegó a db.router.js: ${req.method} ${req.url}`);
    next();
});


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
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







router.post('/register', UserDao.registerUser);

router.put("/vehicle/:pid", requireAuth, VehicleDao.updateVehicle);



router.post('/login',limitFailedAttempts, UserDao.loginUser);

router.get('/session/current', UserDao.getCurrentSession);


router.post('/addVehicleWithImage', requireAuth, upload.array('thumbnail'), VehicleDao.addVehicleWithImage);

router.post('/support', upload.array('file'), SupportController.createTicket);




router.delete('/vehicle/:pid', requireAuth, VehicleDao.deleteVehicle);

router.delete('/support/:pid', SupportController.deleteTicket);

/* Ruta para eliminar registros en la pagina de Information */

router.delete('/vehicle/:vid/history/:fieldName', requireAuth, VehicleDao.deleteLastHistoryEntry);

router.get('/vehicles', requireAuth, VehicleDao.getVehiclesForUser);






export default router