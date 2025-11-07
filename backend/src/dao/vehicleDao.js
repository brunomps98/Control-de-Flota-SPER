import { vehicleDao } from "../repository/index.js";
import { supabase } from '../config/supabaseClient.js';
import path from 'path';


const renderVehicleView = async (req, res, viewName) => {
    try {
        const query = { ...req.query, user: req.user };
        const result = await vehicleDao.getVehicles(query);

        const createLink = (page) => {
            const params = new URLSearchParams(req.query);
            params.set('page', page);
            return `?${params.toString()}`;
        };

        result.prevLink = result.hasPrevPage ? createLink(result.prevPage) : '';
        result.nextLink = result.hasNextPage ? createLink(result.nextPage) : '';

        res.render(viewName, { ...result, user: req.user });
    } catch (error) {
        console.log(`Error al renderizar ${viewName}`, error);
        res.status(500).json({ error: `error al leer los vehículos` });
    }
};


const getVehicleByIdHelper = async (req, res, renderView) => {
    try {
        const id = req.params.cid || req.params.productId;
        const vehicleInstance = await vehicleDao.getVehicleById(id, req.user);

        if (vehicleInstance == null || vehicleInstance.error) {
            return res.status(404).json({ status: 'error', error: 'product not found' });
        }

        const vehicle = vehicleInstance.get({ plain: true });

        const lastIndexS = (vehicle.services?.length || 0) - 1;
        const lastIndexR = (vehicle.rodados?.length || 0) - 1;
        const lastIndexK = (vehicle.kilometrajes?.length || 0) - 1;
        const lastIndexD = (vehicle.descripciones?.length || 0) - 1;
        const lastIndexT = (vehicle.destinos?.length || 0) - 1;

        const allImages = vehicle.thumbnail || [];

        if (renderView) {
            res.render(renderView, {
                vehicle, allImages, firstImage: true,
                lastIndexS, lastIndexK, lastIndexR, lastIndexD, lastIndexT
            });
        } else {
            res.status(200).json({ vehicle });
        }
    } catch (error) {
        console.error('ERROR CAPTURADO EN getVehicleByIdHelper:', error);
        res.status(500).json({
            error: 'error al leer el vehicle',
            details: error.message 
        });
    }
};


class VehicleDao {

    static addVehicle = async (req, res) => {
        try {
            const { ...productData } = req.body;
            let thumbnailUrls = []; 

            if (req.files && req.files.length > 0) {
                console.log(`Subiendo ${req.files.length} archivos a Supabase...`);

                for (const file of req.files) {
                    // Creamos un nombre de archivo único
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    const extension = path.extname(file.originalname);
                    const fileName = `thumbnail-${uniqueSuffix}${extension}`;

                    // Subimos el archivo (que está en memoria/buffer) a Supabase
                    const { error: uploadError } = await supabase.storage
                        .from('uploads')
                        .upload(fileName, file.buffer, {
                            contentType: file.mimetype,
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (uploadError) {
                        throw new Error('Error al subir el archivo a Supabase: ' + uploadError.message);
                    }

                    // Obtenemos la URL pública de la imagen que acabamos de subir
                    const { data: publicUrlData } = supabase.storage
                        .from('uploads')
                        .getPublicUrl(fileName);

                    if (!publicUrlData) {
                        throw new Error('No se pudo obtener la URL pública de Supabase.');
                    }

                    thumbnailUrls.push(publicUrlData.publicUrl);
                }
            }

            // Creamos el objeto final del producto con las URLs de Supabase
            const product = { ...productData, thumbnail: thumbnailUrls };

            // Llamamos al repositorio para guardar en la base de datos
            const newProduct = await vehicleDao.addVehicle(product, req.user);

            if (newProduct instanceof Error) {
                throw newProduct;
            }

            res.status(201).json({ message: "Vehículo creado con éxito", newProduct });
        } catch (error) {
            console.error("Error al crear vehículo:", error);
            res.status(500).json({ message: "Error interno del servidor", error: error.message });
        }
    }
    static addVehicleWithImage = this.addVehicle;
    static addVehicleNoImage = this.addVehicle;

    static vehicleDetail = (req, res) => getVehicleByIdHelper(req, res, 'vehicleDetail');
    static vehicleInformation = (req, res) => getVehicleByIdHelper(req, res, 'vehicleInformation');
    static edditVehicle = (req, res) => getVehicleByIdHelper(req, res, 'edditVehicle');
    static getVehicleById = (req, res) => getVehicleByIdHelper(req, res, null);

    static vehicle = (req, res) => renderVehicleView(req, res, 'vehicle');
    static vehicleGeneral = (req, res) => renderVehicleView(req, res, 'vehicleGeneral');
    static vehicleFilter = (req, res) => renderVehicleView(req, res, 'vehicle');
    static getVehiclesForUser = async (req, res) => {
        try {
            const query = { ...req.query, user: req.user, limit: 1000, page: 1 };
            const result = await vehicleDao.getVehicles(query);
            res.status(200).json({ docs: result.docs });
        } catch (error) {
            console.error('Error al obtener vehículos:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    static updateVehicle = async (req, res) => {
        try {
            const id = req.params.productId;
            const body = req.body;

            const updatedVehicle = await vehicleDao.updateVehicle(id, body, req.user);

            if (updatedVehicle instanceof Error) throw updatedVehicle;
            if (!updatedVehicle) {
                return res.status(404).json({ status: "error", message: "Vehículo no encontrado." });
            }

            res.status(200).json({ status: "success", updatedVehicle });
        } catch (error) {
            console.error("Error al actualizar vehículo:", error);
            res.status(500).json({ status: "error", message: "Error interno del servidor", error: error.message });
        }
    }

    static deleteVehicle = async (req, res) => {
        try {
            const id = req.params.pid || req.params.cid;
            const result = await vehicleDao.deleteVehicle(id, req.user);

            if (result instanceof Error) throw result;

            res.status(200).json({ status: "success", deletedProduct: result });
        } catch (error) {
            res.status(500).json({ status: "error", message: "Internal Server Error", error: error.message });
        }
    }

    static deleteLastHistoryEntry = async (req, res) => {
        try {
            const { vid, fieldName } = req.params;
            const result = await vehicleDao.deleteLastHistoryEntry(vid, fieldName);

            if (result instanceof Error) throw result;

            res.status(200).json({ status: "success", message: result.message });
        } catch (error) {
            res.status(500).json({ status: "error", message: "Error interno del servidor", error: error.message });
        }
    }

    static deleteOneHistoryEntry = async (req, res) => {
        let { cid, fieldName, historyId } = req.params;

        try {
            const result = await vehicleDao.deleteOneHistoryEntry(cid, fieldName, historyId, req.user);

            if (result instanceof Error) throw result;

            res.status(200).json({ status: "success", message: `Registro de ${fieldName} eliminado.` });
        } catch (error) {
            console.error(`Error al eliminar un registro de ${fieldName} (ID: ${historyId}):`, error);
            res.status(500).json({ status: "error", message: "Error interno del servidor", error: error.message });
        }
    }

    static deleteAllHistory = async (req, res) => {
        try {
            const { cid, fieldName } = req.params;

            const result = await vehicleDao.deleteAllHistory(cid, fieldName, req.user);

            if (result instanceof Error) throw result;

            res.status(200).json({ status: "success", message: `Historial de ${fieldName} eliminado.` });
        } catch (error) {
            console.error(`Error al eliminar todo el historial de ${fieldName}:`, error);
            res.status(500).json({ status: "error", message: "Error interno del servidor", error: error.message });
        }
    }

    // Ruta estática
    static realtimeVehicle = async (req, res) => {
        res.render('realtimeVehicle');
    }

    static getVehicleHistory = async (req, res, historyMethodName) => {
        try {
            const { cid } = req.params;
            const history = await vehicleDao[historyMethodName](cid);
            res.status(200).json({ history });
        } catch (error) {
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

export default VehicleDao;