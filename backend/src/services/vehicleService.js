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

// Función auxiliar para validar si el usuario tiene permiso sobre la unidad del vehículo
const checkPermission = (user, vehicleTitle) => {
    // Si el usuario es superadmin, tiene acceso total
    if (user.admin) {
        return true;
    }
    // Mapeo entre el título del vehículo y la propiedad del usuario que otorga permiso
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

    // Verifica si la unidad existe en el mapa y si el usuario tiene ese flag en true
    if (!requiredPermission || !user[requiredPermission]) {
        return false;
    }
    return true;
};

// Función encargada de notificar a los administradores por múltiples canales (Email, DB, Socket, Push)
const notifyAdmins = async (actionType, user, vehicleData) => {
    try {
        // Busca todos los usuarios con rol de administrador en la base de datos
        const admins = await Usuario.findAll({ where: { admin: true } });
        if (!admins.length) return;

        // Extrae los emails de los administradores encontrados
        const adminEmails = admins.map(a => a.email);

        // Envía el correo electrónico de notificación
        sendVehicleActionEmail(adminEmails, actionType, user, vehicleData);

        // Define el título y cuerpo del mensaje según si es creación o actualización
        const title = actionType === 'CREATE' ? 'Nuevo Vehículo' : 'Vehículo Actualizado';
        const body = `El usuario ${user.username} (${user.unidad}) ha ${actionType === 'CREATE' ? 'cargado' : 'actualizado'} el vehículo ${vehicleData.dominio}.`;

        // Objeto con los datos para el evento de socket
        const notificationData = {
            title,
            message: body,
            timestamp: new Date(),
            type: 'vehicle_update',
            resourceId: vehicleData.id
        };

        // Prepara el array de notificaciones para insertar en la base de datos (una por admin)
        const notificationsToCreate = admins.map(admin => ({
            user_id: admin.id,
            title: title,
            message: body,
            type: 'vehicle_update',
            resource_id: vehicleData.id,
            is_read: false
        }));
        
        // Inserta las notificaciones en la base de datos de forma masiva
        await Notification.bulkCreate(notificationsToCreate);

        // Emite el evento por Socket.io a la sala de administradores para alertas en tiempo real
        const io = getIO();
        if (io) {
            io.to('admin_room').emit('new_notification', notificationData);
        }

        // Envía notificaciones Push (Firebase) a los dispositivos móviles de los admins
        for (const admin of admins) {
            if (admin.fcm_token) {
                sendPushNotification(admin.fcm_token, title, body, {
                    type: 'vehicle',
                    id: String(vehicleData.id)
                });
            }
        }

    } catch (error) {
        // Manejo de errores
        console.error('[VehicleService] Error notificando admins:', error);
    }
};

// Clase principal que maneja la lógica de negocio de los vehículos
export default class VehicleManager {

    // Obtiene una lista paginada de vehículos aplicando filtros y control de acceso por unidad
    getVehicles = async (queryParams) => {
        try {
            // Desestructuración de parámetros de consulta y filtros
            const {
                page = 1, limit = 10, dominio, modelo, destino,
                marca, año, tipo, title,
                user
            } = queryParams;     
            
            // Cálculo del offset para la paginación
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const filter = {};
            const includeWhere = [];

            // Lógica de filtrado por permisos: Si hay un título específico o filtro por usuario no admin
            if (title) {
                filter.title = { [Op.iLike]: `%${title}%` };

            } else if (user && !user.admin) {
                // Construye la lista de unidades permitidas para este usuario
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

                // Aplica el filtro para mostrar solo unidades permitidas
                filter.title = { [Op.in]: allowedUnits };
            }

            // Aplicación de filtros dinámicos si existen en la query
            if (dominio) filter.dominio = { [Op.iLike]: `%${dominio}%` };
            if (modelo) filter.modelo = { [Op.iLike]: `%${modelo}%` };
            if (marca) filter.marca = { [Op.iLike]: `%${marca}%` };
            if (año) filter.anio = parseInt(año);
            if (tipo) filter.tipo = { [Op.iLike]: `%${tipo}%` };
            
            // Filtro especial para destinos (requiere include)
            if (destino) {
                includeWhere.push({
                    model: Destino,
                    as: 'destinos',
                    where: { descripcion: { [Op.iLike]: `%${destino}%` } },
                    required: true
                });
            }
            // Incluye las imágenes en miniatura
            includeWhere.push({ model: Thumbnail, as: 'thumbnails', required: false });
            
            // Ejecuta la consulta a la base de datos con paginación
            const { count, rows } = await Vehiculo.findAndCountAll({
                where: filter,
                include: includeWhere,
                limit: parseInt(limit),
                offset: offset,
                order: [['dominio', 'ASC']],
            });

            // Calcula metadatos de paginación
            const totalPages = Math.ceil(count / limit);
            
            // Mapea los resultados para formatear la respuesta
            const docs = rows.map(product => {
                const plainProduct = product.get({ plain: true });
                const thumbnailUrls = plainProduct.thumbnails ? plainProduct.thumbnails.map(t => t.url_imagen) : [];
                return { ...plainProduct, thumbnail: thumbnailUrls };
            });

            // Retorna el objeto de respuesta paginado
            return {
                docs, totalDocs: count, limit: parseInt(limit), page: parseInt(page),
                totalPages, hasPrevPage: page > 1, hasNextPage: page < totalPages,
                prevPage: page > 1 ? page - 1 : null, nextPage: page < totalPages ? page + 1 : null,
            };

        } catch (err) {
            // Manejo de errores
            console.error("Error en getVehicles service:", err);
            throw err;
        }
    }

    // Busca un vehículo por ID incluyendo todas sus relaciones (historiales completos)
    getVehicleById = async (id, user) => {
        try {
            // Consulta el vehículo con todos sus includes (services, reparaciones, etc.)
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

            // Retorna null si no existe
            if (!vehicle) {
                return null;
            }

            // Verifica permisos antes de retornar la información
            if (!checkPermission(user, vehicle.title)) {
                throw new Error('Permiso denegado. No tiene acceso a este vehículo.');
            }

            return vehicle;

        } catch (err) {
            throw err;
        }
    }

    // Crea un nuevo vehículo y sus registros iniciales dentro de una transacción
    addVehicle = async (product, user) => {
        // Inicia una transacción de Sequelize para asegurar integridad
        const t = await sequelize.transaction();
        try {
            const { usuario, title, description, dominio, kilometros, destino, anio, modelo, tipo, chasis, motor, cedula, service, rodado, reparaciones, marca, thumbnail } = product;

            // Valida si el usuario tiene permiso para crear en esa unidad
            if (!checkPermission(user, title)) {
                throw new Error('Permiso denegado. No puede agregar vehículos a esta unidad.');
            }

            // Crea el registro principal del vehículo
            const newVehicle = await Vehiculo.create({
                title, dominio, anio, modelo, tipo, chasis, motor, cedula, marca,
                chofer: usuario,
                user_id: user.id
            }, { transaction: t });

            const vehiculoId = newVehicle.id;
            const createsHijos = [];

            // Prepara las creaciones de registros relacionados (historial inicial)
            if (usuario) createsHijos.push(Descripcion.create({ vehiculo_id: vehiculoId, descripcion: usuario }, { transaction: t }));
            if (description) createsHijos.push(Descripcion.create({ vehiculo_id: vehiculoId, descripcion: description }, { transaction: t }));
            if (kilometros) createsHijos.push(Kilometraje.create({ vehiculo_id: vehiculoId, kilometraje: parseInt(kilometros) }, { transaction: t }));
            if (destino) createsHijos.push(Destino.create({ vehiculo_id: vehiculoId, descripcion: destino }, { transaction: t }));
            if (service) createsHijos.push(Service.create({ vehiculo_id: vehiculoId, descripcion: service }, { transaction: t }));
            if (rodado) createsHijos.push(Rodado.create({ vehiculo_id: vehiculoId, descripcion: rodado }, { transaction: t }));
            if (reparaciones) createsHijos.push(Reparacion.create({ vehiculo_id: vehiculoId, descripcion: reparaciones }, { transaction: t }));

            // Gestiona la creación de imágenes si existen
            if (thumbnail && thumbnail.length > 0) {
                const imagenesData = thumbnail.map(url => ({ vehiculo_id: vehiculoId, url_imagen: url }));
                createsHijos.push(Thumbnail.bulkCreate(imagenesData, { transaction: t }));
            }

            // Ejecuta todas las promesas de creación de hijos
            await Promise.all(createsHijos);
            
            // Confirma la transacción
            await t.commit();

            // Notifica a los administradores si la acción la realizó un usuario estándar
            if (!user.admin) {
                notifyAdmins('CREATE', user, newVehicle);
            }

            return newVehicle;
        } catch (err) {
            // Revierte los cambios si hubo error
            await t.rollback();
            throw err;
        }
    }

    // Actualiza el vehículo añadiendo nuevos registros al historial (no sobrescribe)
    updateVehicle = async (id, updateData, user) => {
        const t = await sequelize.transaction();
        try {
            // Busca el vehículo dentro de la transacción
            const vehicle = await Vehiculo.findByPk(id, { transaction: t });
            if (!vehicle) throw new Error("Vehículo no encontrado");

            // Verifica permisos de edición
            if (!checkPermission(user, vehicle.title)) {
                throw new Error('Permiso denegado. No puede modificar este vehículo.');
            }

            const pushCreates = [];
            const arrayFields = ['kilometros', 'service', 'rodado', 'reparaciones', 'description', 'destino'];

            // Itera sobre los campos a actualizar para crear los registros históricos correspondientes
            for (const key in updateData) {
                if (updateData[key] && updateData[key] !== '') {
                    if (arrayFields.includes(key)) {
                        const data = { vehiculo_id: id };
                        if (key === 'kilometros') data.kilometraje = parseInt(updateData[key]);
                        else data.descripcion = updateData[key];

                        // Añade la promesa correspondiente al array de ejecución
                        if (key === 'kilometros') pushCreates.push(Kilometraje.create(data, { transaction: t }));
                        if (key === 'service') pushCreates.push(Service.create(data, { transaction: t }));
                        if (key === 'rodado') pushCreates.push(Rodado.create(data, { transaction: t }));
                        if (key === 'reparaciones') pushCreates.push(Reparacion.create(data, { transaction: t }));
                        if (key === 'description') pushCreates.push(Descripcion.create(data, { transaction: t }));
                        if (key === 'destino') pushCreates.push(Destino.create(data, { transaction: t }));

                    } else if (key === 'usuario') {
                        // Caso especial para cambio de chofer/usuario
                        pushCreates.push(Descripcion.create({ vehiculo_id: id, descripcion: updateData[key] }, { transaction: t }));
                    }
                }
            }

            // Ejecuta las inserciones si hay datos nuevos
            if (pushCreates.length > 0) {
                await Promise.all(pushCreates);
            }

            // Confirma la transacción
            await t.commit();

            // Notifica a los administradores
            if (!user.admin) {
                notifyAdmins('UPDATE', user, vehicle);
            }

            return vehicle;

        } catch (err) {
            await t.rollback();
            return err;
        }
    }

    // Elimina un vehículo físicamente de la base de datos
    deleteVehicle = async (id, user) => {
        try {
            const vehicle = await Vehiculo.findByPk(id);
            if (!vehicle) throw new Error("Vehículo no encontrado");
            
            // Valida permisos antes de eliminar
            if (!checkPermission(user, vehicle.title)) {
                throw new Error('Permiso denegado. No puede eliminar este vehículo.');
            }
            
            await vehicle.destroy();
            return { success: true };
        } catch (err) {
            return err;
        }
    }

    // Elimina todo el historial de un tipo específico (ej. todos los services)
    deleteAllHistory = async (cid, fieldName, user) => {
        try {
            const vehicle = await Vehiculo.findByPk(cid);
            if (!vehicle) throw new Error("Vehículo no encontrado");
            if (!checkPermission(user, vehicle.title)) {
                throw new Error('Permiso denegado.');
            }

            let model;
            // Selecciona el modelo correspondiente según el campo solicitado
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

            // Elimina los registros coincidentes
            const count = await model.destroy({ where: { vehiculo_id: cid } });
            return { success: true, message: `Se eliminaron ${count} registros de ${fieldName}.` };

        } catch (err) {
            return err;
        }
    }
    
    // Elimina una entrada puntual del historial por su ID
    deleteOneHistoryEntry = async (cid, fieldName, historyId, user) => {
        try {
            const vehicle = await Vehiculo.findByPk(cid);
            if (!vehicle) throw new Error("Vehículo no encontrado");
            if (!checkPermission(user, vehicle.title)) {
                throw new Error('Permiso denegado.');
            }

            let model;
            // Selecciona el modelo correcto
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

            // Busca el registro específico verificando que pertenezca al vehículo
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

    // Método genérico para obtener el historial ordenado de un modelo específico
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

    // Wrappers específicos para obtener cada tipo de historial usando el método genérico
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