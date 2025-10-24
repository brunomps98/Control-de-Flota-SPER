import {
    Vehiculo, Kilometraje, Service, Reparacion,
    Destino, Rodado, Thumbnail, Descripcion
} from '../models/vehicle.model.js';
import Usuario from '../models/user.model.js';
import { sequelize } from '../config/configServer.js';
import { Op } from 'sequelize';

export default class VehicleManager {

    // --- FUNCIÓN DE LECTURA PRINCIPAL  ---
    getVehicles = async (queryParams) => {
        try {
            const {
                page = 1,
                limit = 10,
                dominio,
                modelo,
                destino,
                marca,
                año,
                tipo,
                chofer,
                unidad, // Este es el 'title'
                user // Objeto user de la sesión
            } = queryParams;

            const offset = (parseInt(page) - 1) * parseInt(limit);
            
            const filter = {}; // Filtros para la tabla 'vehiculos'
            const includeWhere = []; // Filtros para tablas relacionadas

            // Filtros de la tabla principal 'vehiculos'
            if (dominio) filter.dominio = { [Op.iLike]: `%${dominio}%` };
            if (modelo) filter.modelo = { [Op.iLike]: `%${modelo}%` };
            if (marca) filter.marca = { [Op.iLike]: `%${marca}%` };
            if (año) filter.anio = parseInt(año);
            if (tipo) filter.tipo = { [Op.iLike]: `%${tipo}%` };
            
            // Filtro por unidad (title) o rol
            if (unidad) {
                filter.title = { [Op.iLike]: `%${unidad}%` };
            } else if (user && !user.admin) {
                filter.title = user.unidad;
            }

            // Filtros en tablas relacionadas
            if (destino) {
                includeWhere.push({
                    model: Destino,
                    as: 'destinos',
                    where: { descripcion: { [Op.iLike]: `%${destino}%` } },
                    required: true // INNER JOIN
                });
            }
            if (chofer) {
                includeWhere.push({
                    model: Usuario,
                    as: 'chofer',
                    where: { username: { [Op.iLike]: `%${chofer}%` } },
                    required: true // INNER JOIN
                });
            } else {
                // Siempre incluir el chofer (LEFT JOIN)
                includeWhere.push({ model: Usuario, as: 'chofer', required: false });
            }
            
            // Incluir siempre la primera imagen
            includeWhere.push({ model: Thumbnail, as: 'thumbnails' });

            // Consulta con paginación y filtros
            const { count, rows } = await Vehiculo.findAndCountAll({
                where: filter,
                include: includeWhere,
                limit: parseInt(limit),
                offset: offset,
                order: [['dominio', 'ASC']],
                distinct: true
            });
            
            // Reconstruir el objeto de paginación
            const totalPages = Math.ceil(count / limit);
            const docs = rows.map(product => {
                const plainProduct = product.get({ plain: true });
                return {
                    ...plainProduct,
                    thumbnail: plainProduct.thumbnails && plainProduct.thumbnails.length > 0 ? plainProduct.thumbnails[0].url_imagen : null
                };
            });

            return {
                docs,
                totalDocs: count,
                limit: parseInt(limit),
                page: parseInt(page),
                totalPages,
                hasPrevPage: page > 1,
                hasNextPage: page < totalPages,
                prevPage: page > 1 ? page - 1 : null,
                nextPage: page < totalPages ? page + 1 : null,
            };

        } catch (err) {
            console.error("Error en getVehicles service:", err);
            return err;
        }
    }

    // --- OBTENER POR ID (YA ESTABA BIEN) ---
    getVehicleById = async (id) => {
        try {
            return await Vehiculo.findByPk(id, {
                include: [
                    { model: Usuario, as: 'chofer' },
                    { model: Kilometraje, as: 'kilometrajes', order: [['fecha_registro', 'DESC']] },
                    { model: Service, as: 'services', order: [['fecha_service', 'DESC']] },
                    { model: Reparacion, as: 'reparaciones', order: [['fecha_reparacion', 'DESC']] },
                    { model: Destino, as: 'destinos', order: [['fecha_destino', 'DESC']] },
                    { model: Rodado, as: 'rodados', order: [['fecha_rodado', 'DESC']] },
                    { model: Thumbnail, as: 'thumbnails' },
                    { model: Descripcion, as: 'descripciones', order: [['id', 'DESC']] }
                ]
            });
        } catch (err) {
            return { error: err.message };
        }
    }

    // --- CREAR VEHÍCULO (YA ESTABA BIEN) ---
    addVehicle = async (product) => {
        const t = await sequelize.transaction();
        try {
            const { usuario, title, description, dominio, kilometros, destino, anio, modelo, tipo, chasis, motor, cedula, service, rodado, reparaciones, marca, thumbnail } = product;

            let choferId = null;
            if (usuario) {
                const chofer = await Usuario.findOne({ where: { username: usuario } }, { transaction: t });
                if (chofer) choferId = chofer.id;
            }

            const newVehicle = await Vehiculo.create({
                title, dominio, anio, modelo, tipo, chasis, motor, cedula, marca,
                usuario_id: choferId
            }, { transaction: t });
            
            const vehiculoId = newVehicle.id;
            const createsHijos = [];

            if (description) createsHijos.push(Descripcion.create({ vehiculo_id: vehiculoId, descripcion }, { transaction: t }));
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
            return err;
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
            await vehicle.destroy(); // ON DELETE CASCADE se encarga del resto
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

            switch(fieldName) {
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
        
        } catch(err) {
            return err;
        }
    }
}