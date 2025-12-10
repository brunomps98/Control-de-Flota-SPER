import {
    Vehiculo, Kilometraje, Service, Reparacion,
    Destino, Rodado, Thumbnail, Descripcion
} from '../models/vehicle.model.js';
import Usuario from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import { sequelize } from '../config/configServer.js';
import { Op } from 'sequelize';
import { sendVehicleActionEmail } from './email.service.js';
import { getIO } from '../socket/socketHandler.js';
import { sendPushNotification } from './notification.service.js';

/*
Verifica si un usuario tiene permisos para ver o editar una unidad específica.
    user: Objeto del usuario (req.user)
    vehicleTitle: Nombre de la unidad del vehículo (ej: "Unidad Penal 1").
    retorna true si tiene permiso o false si no tiene.
 */

const checkPermission = (user, vehicleTitle) => {
    if (user.admin) {
        return true;
    }

    const unitMap = {
        "Direccion General": "dg",
        "Unidad Penal 1": "up1",
        "Unidad Penal 3": "up3",
        "Unidad Penal 4": "up4",
        "Unidad Penal 5": "up5",
        "Unidad Penal 6": "up6",
        "Unidad Penal 7": "up7",
        "Unidad Penal 8": "up8",
        "Unidad Penal 9": "up9",
        "Instituto": "inst",
        "Tratamiento": "trat"
    };

    const requiredPermission = unitMap[vehicleTitle];

    if (!requiredPermission || !user[requiredPermission]) {
        return false;
    }

    return true;
};

// Helper para notificar admins
const notifyAdmins = async (actionType, user, vehicleData) => {
    try {
        // Buscar todos los admins
        const admins = await Usuario.findAll({ where: { admin: true } });
        if (!admins.length) return;

        const adminEmails = admins.map(a => a.email);

        // Enviar Correo
        sendVehicleActionEmail(adminEmails, actionType, user, vehicleData);

        // Preparar datos para notificaciones en tiempo real
        const title = actionType === 'CREATE' ? 'Nuevo Vehículo' : 'Vehículo Actualizado';
        const body = `El usuario ${user.username} (${user.unidad}) ha ${actionType === 'CREATE' ? 'cargado' : 'actualizado'} el vehículo ${vehicleData.dominio}.`;

        const notificationData = {
            title,
            message: body,
            timestamp: new Date(),
            type: 'vehicle_update',
            resourceId: vehicleData.id
        };

        // Persistencia en la base de datos
        const notificationsToCreate = admins.map(admin => ({
            user_id: admin.id,
            title: title,
            message: body,
            type: 'vehicle_update',
            resource_id: vehicleData.id,
            is_read: false
        }));
        await Notification.bulkCreate(notificationsToCreate); // Guardado masivo

        // Enviar Socket (Campanita) a la sala de admins
        const io = getIO();
        if (io) {
            io.to('admin_room').emit('new_notification', notificationData);
        }

        // Enviar Push Notification (Firebase) a admins
        for (const admin of admins) {
            if (admin.fcm_token) {
                // Enviamos data para navegación en móvil también
                sendPushNotification(admin.fcm_token, title, body, {
                    type: 'vehicle',
                    id: String(vehicleData.id)
                });
            }
        }

    } catch (error) {
        console.error('[VehicleService] Error notificando admins:', error);
    }
};


export default class VehicleManager {

    /*
    Obtiene una lista paginada de vehículos aplicando filtros dinámicos.
    Si el usuario no es admin, filtra automáticamente solo su unidad
    queryParams: Parámetros de la URL (page, limit, dominio, etc.).
    retorna objeto con docs, totalDocs, page, totalPages.
     */

    getVehicles = async (queryParams) => {

        try {
            const {
                page = 1, limit = 10, dominio, modelo, destino,
                marca, año, tipo, title,
                user
            } = queryParams;

            const offset = (parseInt(page) - 1) * parseInt(limit);
            const filter = {};
            const includeWhere = [];

            if (title) {
                filter.title = { [Op.iLike]: `%${title}%` };

            } else if (user && !user.admin) {

                const allowedUnits = [];
                if (user.dg) allowedUnits.push("Direccion General");
                if (user.up1) allowedUnits.push("Unidad Penal 1");
                if (user.up3) allowedUnits.push("Unidad Penal 3");
                if (user.up4) allowedUnits.push("Unidad Penal 4");
                if (user.up5) allowedUnits.push("Unidad Penal 5");
                if (user.up6) allowedUnits.push("Unidad Penal 6");
                if (user.up7) allowedUnits.push("Unidad Penal 7");
                if (user.up8) allowedUnits.push("Unidad Penal 8");
                if (user.up9) allowedUnits.push("Unidad Penal 9");
                if (user.inst) allowedUnits.push("Instituto");
                if (user.trat) allowedUnits.push("Tratamiento");

                filter.title = { [Op.in]: allowedUnits };
            }

            if (dominio) filter.dominio = { [Op.iLike]: `%${dominio}%` };
            if (modelo) filter.modelo = { [Op.iLike]: `%${modelo}%` };
            if (marca) filter.marca = { [Op.iLike]: `%${marca}%` };
            if (año) filter.anio = parseInt(año);
            if (tipo) filter.tipo = { [Op.iLike]: `%${tipo}%` };
            if (destino) {
                includeWhere.push({
                    model: Destino,
                    as: 'destinos',
                    where: { descripcion: { [Op.iLike]: `%${destino}%` } },
                    required: true
                });
            }

            includeWhere.push({ model: Thumbnail, as: 'thumbnails', required: false });


            const { count, rows } = await Vehiculo.findAndCountAll({
                where: filter,
                include: includeWhere,
                limit: parseInt(limit),
                offset: offset,
                order: [['dominio', 'ASC']],
            });


            const totalPages = Math.ceil(count / limit);
            const docs = rows.map(product => {
                const plainProduct = product.get({ plain: true });
                const thumbnailUrls = plainProduct.thumbnails ? plainProduct.thumbnails.map(t => t.url_imagen) : [];
                return { ...plainProduct, thumbnail: thumbnailUrls };
            });

            return {
                docs, totalDocs: count, limit: parseInt(limit), page: parseInt(page),
                totalPages, hasPrevPage: page > 1, hasNextPage: page < totalPages,
                prevPage: page > 1 ? page - 1 : null, nextPage: page < totalPages ? page + 1 : null,
            };

        } catch (err) {
            console.error("Error en getVehicles service:", err);
            throw err;
        }
    }

    /*
    Busca un vehículo por ID e incluye todo su historial (Services, Reparaciones, etc.)
    id: ID del vehículo.
    user: Usuario que solicita la información (para validar permisos).
    retorna el vehículo completo o null si no existe.
    arroja error si el usuario no tiene permisos para ver este vehículo.
     */

    getVehicleById = async (id, user) => {
        try {
            const vehicle = await Vehiculo.findByPk(id, {
                include: [
                    {
                        model: Usuario,
                        as: 'owner',
                        attributes: ['id', 'username', 'unidad', 'profile_picture']
                    },
                    { model: Thumbnail, as: 'thumbnails' },
                    { model: Kilometraje, as: 'kilometrajes', order: [['fecha_registro', 'DESC']] },
                    { model: Service, as: 'services', order: [['fecha_service', 'DESC']] },
                    { model: Reparacion, as: 'reparaciones', order: [['fecha_reparacion', 'DESC']] },
                    { model: Destino, as: 'destinos', order: [['fecha_destino', 'DESC']] },
                    { model: Rodado, as: 'rodados', order: [['fecha_rodado', 'DESC']] },
                    { model: Descripcion, as: 'descripciones', order: [['id', 'DESC']] },
                ]
            });

            if (!vehicle) {
                return null;
            }

            if (!checkPermission(user, vehicle.title)) {
                throw new Error('Permiso denegado. No tiene acceso a este vehículo.');
            }

            return vehicle;

        } catch (err) {
            throw err;
        }
    }

    /*
    Crea un nuevo vehículo y registra sus datos iniciales en una transacción
    Notifica a los administradores si el creador no es admin.
    product: Datos del vehículo (dominio, modelo, kilometros, etc.).
    user: Usuario que crea el vehículo.
    retorna el vehiculo creado
     */

    addVehicle = async (product, user) => {
        const t = await sequelize.transaction();
        try {
            const { usuario, title, description, dominio, kilometros, destino, anio, modelo, tipo, chasis, motor, cedula, service, rodado, reparaciones, marca, thumbnail } = product;

            if (!checkPermission(user, title)) {
                throw new Error('Permiso denegado. No puede agregar vehículos a esta unidad.');
            }


            const newVehicle = await Vehiculo.create({
                title, dominio, anio, modelo, tipo, chasis, motor, cedula, marca,
                chofer: usuario,
                user_id: user.id
            }, { transaction: t });

            const vehiculoId = newVehicle.id;
            const createsHijos = [];

            if (usuario) createsHijos.push(Descripcion.create({ vehiculo_id: vehiculoId, descripcion: usuario }, { transaction: t }));
            if (description) createsHijos.push(Descripcion.create({ vehiculo_id: vehiculoId, descripcion: description }, { transaction: t }));

            if (kilometros) createsHijos.push(Kilometraje.create({ vehiculo_id: vehiculoId, kilometraje: parseInt(kilometros) }, { transaction: t }));
            if (destino) createsHijos.push(Destino.create({ vehiculo_id: vehiculoId, descripcion: destino }, { transaction: t }));
            if (service) createsHijos.push(Service.create({ vehiculo_id: vehiculoId, descripcion: service }, { transaction: t }));
            if (rodado) createsHijos.push(Rodado.create({ vehiculo_id: vehiculoId, descripcion: rodado }, { transaction: t }));
            if (reparaciones) createsHijos.push(Reparacion.create({ vehiculo_id: vehiculoId, descripcion: reparaciones }, { transaction: t }));

            if (thumbnail && thumbnail.length > 0) {
                const imagenesData = thumbnail.map(url => ({ vehiculo_id: vehiculoId, url_imagen: url }));
                createsHijos.push(Thumbnail.bulkCreate(imagenesData, { transaction: t }));
            }

            await Promise.all(createsHijos);
            await t.commit();

            // Notificar a admins si el creador no es admin
            if (!user.admin) {
                notifyAdmins('CREATE', user, newVehicle);
            }

            return newVehicle;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    /*
    Actualiza datos de un vehículo y agrega entradas al historial si cambiaron
    id: ID del vehículo a modificar
    updateData: Objeto con los campos a actualizar
    user: Usuario que realiza la acción.
     */

    updateVehicle = async (id, updateData, user) => {
        const t = await sequelize.transaction();
        try {
            const vehicle = await Vehiculo.findByPk(id, { transaction: t });
            if (!vehicle) throw new Error("Vehículo no encontrado");

            if (!checkPermission(user, vehicle.title)) {
                throw new Error('Permiso denegado. No puede modificar este vehículo.');
            }

            const pushCreates = [];
            const arrayFields = ['kilometros', 'service', 'rodado', 'reparaciones', 'description', 'destino'];

            for (const key in updateData) {
                if (updateData[key] && updateData[key] !== '') {
                    if (arrayFields.includes(key)) {
                        const data = { vehiculo_id: id };
                        if (key === 'kilometros') data.kilometraje = parseInt(updateData[key]);
                        else data.descripcion = updateData[key];

                        if (key === 'kilometros') pushCreates.push(Kilometraje.create(data, { transaction: t }));
                        if (key === 'service') pushCreates.push(Service.create(data, { transaction: t }));
                        if (key === 'rodado') pushCreates.push(Rodado.create(data, { transaction: t }));
                        if (key === 'reparaciones') pushCreates.push(Reparacion.create(data, { transaction: t }));
                        if (key === 'description') pushCreates.push(Descripcion.create(data, { transaction: t }));
                        if (key === 'destino') pushCreates.push(Destino.create(data, { transaction: t }));

                    } else if (key === 'usuario') {
                        pushCreates.push(Descripcion.create({ vehiculo_id: id, descripcion: updateData[key] }, { transaction: t }));
                    }
                }
            }

            if (pushCreates.length > 0) {
                await Promise.all(pushCreates);
            }

            await t.commit();

            // Notificar a admins si el editor no es admin
            if (!user.admin) {
                notifyAdmins('UPDATE', user, vehicle);
            }

            return vehicle;

        } catch (err) {
            await t.rollback();
            return err;
        }
    }

    // Eliminar vehiculo
    deleteVehicle = async (id, user) => {
        try {
            const vehicle = await Vehiculo.findByPk(id);
            if (!vehicle) throw new Error("Vehículo no encontrado");
            if (!checkPermission(user, vehicle.title)) {
                throw new Error('Permiso denegado. No puede eliminar este vehículo.');
            }
            await vehicle.destroy();
            return { success: true };
        } catch (err) {
            return err;
        }
    }

    // Eliminar todo el historial 
    deleteAllHistory = async (cid, fieldName, user) => {
        try {
            const vehicle = await Vehiculo.findByPk(cid);
            if (!vehicle) throw new Error("Vehículo no encontrado");
            if (!checkPermission(user, vehicle.title)) {
                throw new Error('Permiso denegado.');
            }

            let model;
            switch (fieldName) {
                case 'kilometrajes': model = Kilometraje; break;
                case 'services': model = Service; break;
                case 'rodados': model = Rodado; break;
                case 'reparaciones': model = Reparacion; break;
                case 'descripciones': model = Descripcion; break;
                case 'destinos': model = Destino; break;
                default:
                    throw new Error('Campo de historial no válido');
            }

            const count = await model.destroy({ where: { vehiculo_id: cid } });
            return { success: true, message: `Se eliminaron ${count} registros de ${fieldName}.` };

        } catch (err) {
            return err;
        }
    }
    // Eliminar una sola entrada del historial 
    deleteOneHistoryEntry = async (cid, fieldName, historyId, user) => {
        try {
            const vehicle = await Vehiculo.findByPk(cid);
            if (!vehicle) throw new Error("Vehículo no encontrado");
            if (!checkPermission(user, vehicle.title)) {
                throw new Error('Permiso denegado.');
            }

            let model;
            switch (fieldName) {
                case 'kilometrajes': model = Kilometraje; break;
                case 'services': model = Service; break;
                case 'rodados': model = Rodado; break;
                case 'reparaciones': model = Reparacion; break;
                case 'descripciones': model = Descripcion; break;
                case 'destinos': model = Destino; break;
                default:
                    throw new Error('Campo de historial no válido');
            }

            const entry = await model.findOne({ where: { id: historyId, vehiculo_id: cid } });
            if (!entry) {
                throw new Error('No se encontró el registro a eliminar.');
            }

            await entry.destroy();
            return { success: true, message: `Registro ${historyId} eliminado.` };

        } catch (err) {
            return err;
        }
    }

    // Obtener todo el historial de un vehiculo
    getHistoryForVehicle = async (vehiculoId, historyModel, orderField) => {
        try {
            return await historyModel.findAll({
                where: { vehiculo_id: vehiculoId },
                order: [[orderField, 'DESC']]
            });
        } catch (err) {
            throw err;
        }
    }

    // Obtener datos del vehiculo
    getKilometrajesForVehicle = async (vehiculoId) => {
        return this.getHistoryForVehicle(vehiculoId, Kilometraje, 'fecha_registro');
    }
    getServicesForVehicle = async (vehiculoId) => {
        return this.getHistoryForVehicle(vehiculoId, Service, 'fecha_service');
    }
    getReparacionesForVehicle = async (vehiculoId) => {
        return this.getHistoryForVehicle(vehiculoId, Reparacion, 'fecha_reparacion');
    }
    getDestinosForVehicle = async (vehiculoId) => {
        return this.getHistoryForVehicle(vehiculoId, Destino, 'fecha_destino');
    }
    getRodadosForVehicle = async (vehiculoId) => {
        return this.getHistoryForVehicle(vehiculoId, Rodado, 'fecha_rodado');
    }
    getDescripcionesForVehicle = async (vehiculoId) => {
        return this.getHistoryForVehicle(vehiculoId, Descripcion, 'id');
    }
}