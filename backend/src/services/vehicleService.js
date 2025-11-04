import {
    Vehiculo, Kilometraje, Service, Reparacion,
    Destino, Rodado, Thumbnail, Descripcion
} from '../models/vehicle.model.js';
import Usuario from '../models/user.model.js';
import { sequelize } from '../config/configServer.js';
import { Op } from 'sequelize';

export default class VehicleManager {

    getVehicles = async (queryParams) => {
        try {
            const {
                page = 1, limit = 10, dominio, modelo, destino,
                marca, año, tipo, title, // Leemos 'title'
                user // Objeto user de la sesión
            } = queryParams;

            const offset = (parseInt(page) - 1) * parseInt(limit);
            const filter = {}; // Filtros para la tabla 'vehiculos' (where principal)
            const includeWhere = []; // Filtros para tablas relacionadas (include)

            if (title) {
                // 1. PRIORIDAD: Si se pasa un 'title' en la URL (desde la Navbar o el filtro), usarlo.
                filter.title = { [Op.iLike]: `%${title}%` };
            } else if (user && !user.admin) {
                // 2. Si NO hay filtro 'title' Y el usuario NO es admin, filtrar por su unidad.
                filter.title = user.unidad;
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


            console.log("Aplicando filtro:", filter);

            // Consulta con paginación y filtros
            const { count, rows } = await Vehiculo.findAndCountAll({
                where: filter,
                include: includeWhere,
                limit: parseInt(limit),
                offset: offset,
                order: [['dominio', 'ASC']],
            });

            console.log(`Query encontró ${count} vehículos.`);

            const totalPages = Math.ceil(count / limit);
            const docs = rows.map(product => {
                const plainProduct = product.get({ plain: true });

                // Extraemos TODAS las URLs de Supabase, no solo la primera
                const thumbnailUrls = plainProduct.thumbnails
                    ? plainProduct.thumbnails.map(t => t.url_imagen)
                    : [];

                return {
                    ...plainProduct,
                    thumbnail: thumbnailUrls 
                };
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

    getVehicleById = async (id) => {
        try {
            return await Vehiculo.findByPk(id, {
                include: [
                    { model: Thumbnail, as: 'thumbnails' }
                ]
            });
        } catch (err) {
            throw err;
        }
    }

    addVehicle = async (product) => {
        const t = await sequelize.transaction();
        try {
            const { usuario, title, description, dominio, kilometros, destino, anio, modelo, tipo, chasis, motor, cedula, service, rodado, reparaciones, marca, thumbnail } = product;

            // 2. Creamos el Vehículo
            const newVehicle = await Vehiculo.create({
                title, dominio, anio, modelo, tipo, chasis, motor, cedula, marca,
                chofer: usuario
            }, { transaction: t });

            const vehiculoId = newVehicle.id;
            const createsHijos = [];

            // 3. Creamos los registros "hijos"
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

            return newVehicle;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    // --- FUNCIÓN DE ACTUALIZACIÓN  ---
    updateVehicle = async (id, updateData) => {
        const t = await sequelize.transaction();
        try {
            const vehicle = await Vehiculo.findByPk(id, { transaction: t });
            if (!vehicle) throw new Error("Vehículo no encontrado");

            const setFields = {}; // Campos para $set (actualizar)
            const pushCreates = []; // Promesas para $push (crear historial)
            const arrayFields = ['kilometros', 'service', 'rodado', 'reparaciones', 'description', 'destino'];

            // 1. Clasificamos los datos
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

                    } else {
                        setFields[key] = updateData[key];
                    }
                }
            }

            // 2. Actualizamos el vehículo principal (si hay campos)
            if (Object.keys(setFields).length > 0) {
                await vehicle.update(setFields, { transaction: t });
            }

            // 3. Creamos los nuevos registros de historial
            if (pushCreates.length > 0) {
                await Promise.all(pushCreates);
            }

            await t.commit();
            return vehicle;

        } catch (err) {
            await t.rollback();
            return err;
        }
    }

    deleteVehicle = async (id) => {
        try {
            const vehicle = await Vehiculo.findByPk(id);
            if (!vehicle) throw new Error("Vehículo no encontrado");
            await vehicle.destroy(); 
            return { success: true };
        } catch (err) {
            return err;
        }
    }

    // --- FUNCIÓN PARA BORRAR HISTORIAL ($pop) ---
    deleteLastHistoryEntry = async (vid, fieldName) => {
        try {
            const allowedFields = ['kilometros', 'service', 'rodado', 'reparaciones', 'description', 'destino'];
            if (!allowedFields.includes(fieldName)) {
                throw new Error('Campo no válido');
            }

            let model;
            let orderField;

            switch (fieldName) {
                case 'kilometros': model = Kilometraje; orderField = 'fecha_registro'; break;
                case 'service': model = Service; orderField = 'fecha_service'; break;
                case 'rodado': model = Rodado; orderField = 'fecha_rodado'; break;
                case 'reparaciones': model = Reparacion; orderField = 'fecha_reparacion'; break;
                case 'description': model = Descripcion; orderField = 'id'; break;
                case 'destino': model = Destino; orderField = 'fecha_destino'; break;
            }

            const lastEntry = await model.findOne({
                where: { vehiculo_id: vid },
                order: [[orderField, 'DESC']]
            });

            if (!lastEntry) {
                throw new Error('No se encontraron registros para eliminar');
            }

            await lastEntry.destroy();
            return { success: true, message: `Último registro de ${fieldName} eliminado.` };

        } catch (err) {
            return err;
        }
    }

    // --- FUNCIÓN PARA BORRAR TODO EL HISTORIAL ---
    deleteAllHistory = async (cid, fieldName) => {
        try {
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

            // Destruye TODOS los registros que coincidan con el vehiculo_id
            const count = await model.destroy({
                where: { vehiculo_id: cid }
            });

            return { success: true, message: `Se eliminaron ${count} registros de ${fieldName}.` };

        } catch (err) {
            return err;
        }
    }

    deleteOneHistoryEntry = async (cid, fieldName, historyId) => {
        try {
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

            // Busca la entrada específica por su ID y el ID del vehículo (por seguridad)
            const entry = await model.findOne({
                where: {
                    id: historyId,
                    vehiculo_id: cid
                }
            });

            if (!entry) {
                throw new Error('No se encontró el registro a eliminar.');
            }

            // Destruye el registro encontrado
            await entry.destroy();

            return { success: true, message: `Registro ${historyId} eliminado.` };

        } catch (err) {
            return err;
        }
    }

    getHistoryForVehicle = async (vehiculoId, historyModel, orderField) => {
        try {
            // Función genérica para buscar historial
            return await historyModel.findAll({
                where: { vehiculo_id: vehiculoId },
                order: [[orderField, 'DESC']] // Ordenamos siempre el más nuevo primero
            });
        } catch (err) {
            throw err;
        }
    }

    // Funciones específicas que usan la genérica
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