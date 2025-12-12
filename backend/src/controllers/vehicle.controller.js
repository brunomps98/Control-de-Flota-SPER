import { vehicleDao } from "../repository/index.js";
import { supabase } from '../config/supabaseClient.js';
import { getIO } from '../socket/socketHandler.js';
import path from 'path';
import Usuario from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import { sendPushNotification } from '../services/notification.service.js';

// Función para renderizar vista de vehiculos
const renderVehicleView = async (req, res, viewName) => {
    try {
        // Obtenemos los vehículos con paginación
        const query = { ...req.query, user: req.user };
        const result = await vehicleDao.getVehicles(query);
        // Construimos los enlaces de paginación
        const createLink = (page) => {
            const params = new URLSearchParams(req.query);
            params.set('page', page);
            return `?${params.toString()}`;
        };
        // Asignamos los enlaces al resultado
        result.prevLink = result.hasPrevPage ? createLink(result.prevPage) : '';
        result.nextLink = result.hasNextPage ? createLink(result.nextPage) : '';
        // Renderizamos la vista con los datos
        res.render(viewName, { ...result, user: req.user });
    } catch (error) {
        // Manejo de errores
        console.error(`Error al renderizar ${viewName}`, error);
        // Error 500 en caso de fallo
        res.status(500).json({ error: `error al leer los vehículos` });
    }
};

// Obtener vehiculo por ID
const getVehicleByIdHelper = async (req, res, renderView) => {
    try {
        // Obtener el ID del vehiculo
        const id = req.params.cid || req.params.productId;
        // Obtener la instancia del vehiculo
        const vehicleInstance = await vehicleDao.getVehicleById(id, req.user);
        // Verificar si se encontró el vehiculo
        if (vehicleInstance == null || vehicleInstance.error) {
            // Error, vehiculo no encontrado
            return res.status(404).json({ status: 'error', error: 'product not found' });
        }

        // Convertir la instancia a un objeto plano
        const vehicle = vehicleInstance.get({ plain: true });
        // Calcular los últimos índices de los arreglos de historial
        const lastIndexS = (vehicle.services?.length || 0) - 1;
        const lastIndexR = (vehicle.rodados?.length || 0) - 1;
        const lastIndexK = (vehicle.kilometrajes?.length || 0) - 1;
        const lastIndexD = (vehicle.descripciones?.length || 0) - 1;
        const lastIndexT = (vehicle.destinos?.length || 0) - 1;
        // Obtener todas las imágenes del vehículo
        const allImages = vehicle.thumbnail || [];
        // Renderizar la vista o devolver JSON según corresponda
        if (renderView) {
            res.render(renderView, {
                vehicle, allImages, firstImage: true,
                lastIndexS, lastIndexK, lastIndexR, lastIndexD, lastIndexT
            });
        } else {
            res.status(200).json({ vehicle });
        }
    } catch (error) {
        // Manejo de errores
        console.error('ERROR CAPTURADO EN getVehicleByIdHelper:', error);
        res.status(500).json({
            error: 'error al leer el vehicle',
            details: error.message
        });
    }
};

// Creamos el controlador de vehiculo que contendrá todas las funciones relacionadas
class VehicleController {

    // Agregar vehiculo
    static addVehicle = async (req, res) => {
        try {
            // Extraemos los datos del cuerpo de la solicitud
            const { ...productData } = req.body;
            // Array para almacenar las URLs de las miniaturas subidas
            let thumbnailUrls = [];
            // Si hay archivos adjuntos, los subimos a Supabase
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    const extension = path.extname(file.originalname);
                    const fileName = `thumbnail-${uniqueSuffix}${extension}`;
                    const { error: uploadError } = await supabase.storage
                        .from('uploads')
                        .upload(fileName, file.buffer, {
                            contentType: file.mimetype,
                            cacheControl: '3600',
                            upsert: false
                        });
                    // Si hay un error al subir el archivo, lanzamos una excepción
                    if (uploadError) {
                        // Manejo de errores
                        throw new Error('Error al subir el archivo a Supabase: ' + uploadError.message);
                    }
                    // Obtenemos la URL pública del archivo subido
                    const { data: publicUrlData } = supabase.storage
                        .from('uploads')
                        .getPublicUrl(fileName);
                    // Verificamos que se haya obtenido la URL pública
                    if (!publicUrlData) {
                        // Manejo de errores
                        throw new Error('No se pudo obtener la URL pública de Supabase.');
                    }
                    // Agregamos la URL al array de miniaturas
                    thumbnailUrls.push(publicUrlData.publicUrl);
                }
            }
            // Creamos el nuevo vehículo en la base de datos
            const product = { ...productData, thumbnail: thumbnailUrls };
            const newProduct = await vehicleDao.addVehicle(product, req.user);
            // Verificamos si hubo un error al crear el vehículo
            if (newProduct instanceof Error) {
                // Manejo de errores
                throw newProduct;
            }

            try {
                // Aviso de nuevo vehiculo a admins
                const admins = await Usuario.findAll({ where: { admin: true } });
                const title = `Nuevo vehículo cargado`;
                const body = `Cargado por: ${req.user.username} (${req.user.unidad})\nDominio: ${newProduct.dominio}`;
                // Notificacion para admins
                const notifs = admins.map(admin => ({
                    user_id: admin.id,
                    title: title,
                    message: body,
                    type: 'vehicle_update',
                    resource_id: newProduct.id,
                    is_read: false
                }));
                // Enviamos las notificaciones
                await Notification.bulkCreate(notifs);
                // Enviamos la notificación en tiempo real vía socket.io
                const io = getIO();
                if (io) {
                    io.to('admin_room').emit('new_notification', {
                        title, message: body, type: 'vehicle_update', resourceId: newProduct.id
                    });
                }
                // Enviamos notificaciones push a los admins
                for (const admin of admins) {
                    if (admin.fcm_token) {
                        sendPushNotification(admin.fcm_token, title, body, { vehicleId: String(newProduct.id) });
                    }
                }
            } catch (notifError) {
                // Manejo de errores
                console.error("Error enviando notificación de vehículo:", notifError);
            }
            // Mensaje de exito
            res.status(201).json({ message: "Vehículo creado con éxito", newProduct });
        } catch (error) {
            // Manejo de errores
            console.error("Error al crear vehículo:", error);
            res.status(500).json({ message: "Error interno del servidor", error: error.message });
        }
    }
    // Rutas estáticas que llaman a los helpers
    static addVehicleWithImage = this.addVehicle;
    static addVehicleNoImage = this.addVehicle;
    static vehicleDetail = (req, res) => getVehicleByIdHelper(req, res, 'vehicleDetail');
    static vehicleInformation = (req, res) => getVehicleByIdHelper(req, res, 'vehicleInformation');
    static edditVehicle = (req, res) => getVehicleByIdHelper(req, res, 'edditVehicle');
    static getVehicleById = (req, res) => getVehicleByIdHelper(req, res, null);
    static vehicle = (req, res) => renderVehicleView(req, res, 'vehicle');
    static vehicleGeneral = (req, res) => renderVehicleView(req, res, 'vehicleGeneral');
    static vehicleFilter = (req, res) => renderVehicleView(req, res, 'vehicle');

    // Obtener vehiculo para el usuario
    static getVehiclesForUser = async (req, res) => {
        try {
            // Obtenemos los vehículos con un límite alto para el usuario
            const query = { ...req.query, user: req.user, limit: 1000, page: 1 };
            const result = await vehicleDao.getVehicles(query);
            // Devolvemos solo los documentos
            res.status(200).json({ docs: result.docs });
        } catch (error) {
            // Manejo de errores
            console.error('Error al obtener vehículos:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    // Actualizar vehiculo
    static updateVehicle = async (req, res) => {
        try {
            // Obtener ID y datos del cuerpo
            const id = req.params.productId;
            const body = req.body;
            const updatedVehicle = await vehicleDao.updateVehicle(id, body, req.user);
            if (updatedVehicle instanceof Error) throw updatedVehicle;
            if (!updatedVehicle) {
                // Mensaje: vehículo no encontrado
                return res.status(404).json({ status: "error", message: "Vehículo no encontrado." });
            }
            // Enviar notificaciones de actualización
            try {
                // Aviso de actualización de vehiculo a admins
                const admins = await Usuario.findAll({ where: { admin: true } });
                const title = "Vehículo Actualizado";
                const body = `Se ha modificado el vehículo: ${updatedVehicle.dominio}`;
                // Notificacion para admins
                const notifs = admins.map(admin => ({
                    user_id: admin.id,
                    title: title,
                    message: body,
                    type: 'vehicle_update',
                    resource_id: updatedVehicle.id,
                    is_read: false
                }));
                // Enviamos las notificaciones
                await Notification.bulkCreate(notifs);
                // Enviamos la notificación en tiempo real vía socket.io
                const io = getIO();
                if (io) {
                    io.to('admin_room').emit('new_notification', {
                        title, message: body, type: 'vehicle_update', resourceId: updatedVehicle.id
                    });
                }
                // Enviamos notificaciones push a los admins
                for (const admin of admins) {
                    if (admin.fcm_token) {
                        sendPushNotification(admin.fcm_token, title, body, { vehicleId: String(updatedVehicle.id) });
                    }
                }
            } catch (notifError) {
                // Manejo de errores de notificación
                console.error("Error enviando notificación de vehículo:", notifError);
            }
            // Actualización exitosa
            res.status(200).json({ status: "success", updatedVehicle });
        } catch (error) {
            // Manejo de errores al actualizar
            console.error("Error al actualizar vehículo:", error);
            res.status(500).json({ status: "error", message: "Error interno del servidor", error: error.message });
        }
    }

    //Eliminar vehiculo
    static deleteVehicle = async (req, res) => {
        try {
            // Obtener ID del vehiculo
            const id = req.params.pid || req.params.cid;
            // Llamar al DAO para eliminar el vehiculo
            const result = await vehicleDao.deleteVehicle(id, req.user);
            if (result instanceof Error) throw result;
            // Mensaje de exito
            res.status(200).json({ status: "success", deletedProduct: result });
        } catch (error) {
            // Mensaje de error
            res.status(500).json({ status: "error", message: "Internal Server Error", error: error.message });
        }
    }

    // Eliminar ultimo registro del historial
    static deleteLastHistoryEntry = async (req, res) => {
        // Obtener ID del vehiculo y nombre del campo
        try {
            const { vid, fieldName } = req.params;
            const result = await vehicleDao.deleteLastHistoryEntry(vid, fieldName);
            if (result instanceof Error) throw result;
            // Mensaje de exito
            res.status(200).json({ status: "success", message: result.message });
        } catch (error) {
            // Mensaje de error
            res.status(500).json({ status: "error", message: "Error interno del servidor", error: error.message });
        }
    }

    // Eliminar un registro del historial
    static deleteOneHistoryEntry = async (req, res) => {
        // Obtener ID del vehiculo, nombre del campo e ID del historial
        let { cid, fieldName, historyId } = req.params;
        // Intentamos eliminar el registro
        try {
            // Llamada al DAO para eliminar el registro
            const result = await vehicleDao.deleteOneHistoryEntry(cid, fieldName, historyId, req.user);
            if (result instanceof Error) throw result;
            // Mensaje de exito
            res.status(200).json({ status: "success", message: `Registro de ${fieldName} eliminado.` });
        } catch (error) {
            // Mensaje de error
            console.error(`Error al eliminar un registro de ${fieldName} (ID: ${historyId}):`, error);
            res.status(500).json({ status: "error", message: "Error interno del servidor", error: error.message });
        }
    }

    // Eliminar todo el historial de un vehiculo
    static deleteAllHistory = async (req, res) => {
        // Obtener ID del vehiculo y nombre del campo
        const { cid, fieldName } = req.params;
        // Intentamos eliminar todo el historial
        try {
            // Llamada al DAO para eliminar todo el historial
            const result = await vehicleDao.deleteAllHistory(cid, fieldName, req.user);
            if (result instanceof Error) throw result;
            // Mensaje de exito
            res.status(200).json({ status: "success", message: `Historial de ${fieldName} eliminado.` });
        } catch (error) {
            // Mensaje de error
            console.error(`Error al eliminar todo el historial de ${fieldName}:`, error);
            res.status(500).json({ status: "error", message: "Error interno del servidor", error: error.message });
        }
    }

    // Ruta estática para agregado de vehiculo
    static realtimeVehicle = async (req, res) => {
        // Renderizamos la vista de vehiculo en tiempo real
        res.render('realtimeVehicle');
    }

    // Obtener historial de vehiculo
    static getVehicleHistory = async (req, res, historyMethodName) => {
        try {
            // Obtener el cid del vehiculo
            const { cid } = req.params;
            // Llamada al DAO para obtener el historial
            const history = await vehicleDao[historyMethodName](cid);
            // Renderizado del historial
            res.status(200).json({ history });
        } catch (error) {
            // Manejo de er rores
            console.error(`Error al obtener historial (${historyMethodName}):`, error);
            res.status(500).json({ message: 'Error interno del servidor', error: error.message });
        }
    }

    // Métodos específicos que usan el genérico
    static getKilometrajes = (req, res) => this.getVehicleHistory(req, res, 'getKilometrajesForVehicle');
    static getServices = (req, res) => this.getVehicleHistory(req, res, 'getServicesForVehicle');
    static getReparaciones = (req, res) => this.getVehicleHistory(req, res, 'getReparacionesForVehicle');
    static getDestinos = (req, res) => this.getVehicleHistory(req, res, 'getDestinosForVehicle');
    static getRodados = (req, res) => this.getVehicleHistory(req, res, 'getRodadosForVehicle');
    static getDescripciones = (req, res) => this.getVehicleHistory(req, res, 'getDescripcionesForVehicle');
}

// Exportamos el controlador de vehiculo
export default VehicleController;