import {productsModel} from "../models/vehicle.model.js";
import { vehicleDao } from "../repository/index.js";


class VehicleDao {

    static addVehicleWithImage = async (req, res) => {
        try {
            const { title, description, dominio, kilometros, destino, anio, modelo, tipo, chasis, motor, cedula, service, rodado, reparaciones, marca } = req.body;
            const thumbnail = req.files.map(file => file.filename);
            const product = {
                title,
                description,
                dominio,
                kilometros,
                destino,
                anio,
                modelo,
                tipo,
                chasis,
                motor,
                cedula,
                service,
                rodado,
                reparaciones,
                marca,
                thumbnail
            };
            const newProduct = await productsModel.create(product);
            res.status(201).json(newProduct);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static vehicleDetail = async (req, res) => {
        try {
            const id = req.params.cid;
            const vehicle = await productsModel.findById(id).lean().exec();
            console.log(vehicle)
            if (vehicle == null) {
                return res.status(404).json({ status: 'error', error: 'product not found' });
            }

            const lastIndexS = vehicle.service.length - 1;
            const lastIndexR = vehicle.rodado.length - 1;
            const lastIndexK = vehicle.kilometros.length - 1;
            const lastIndexD = vehicle.description.length - 1;
            const lastIndexT = vehicle.destino.length - 1;

            const allImages = vehicle.thumbnail
            console.log(allImages);
            const firstImage = true;

            res.render('partials/vehicleDetail', { vehicle, allImages, firstImage, lastIndexS, lastIndexK, lastIndexR, lastIndexD, lastIndexT });
        } catch (error) {
            res.status(500).json({ error: 'error al leer el vehicle' });
        }
    }

    static vehicleFilter = async (req, res) => {
        try {
            const dominio = req.query.dominio;
            const user = req.session.user;
            const userUnidad = user.unidad;
            console.log(userUnidad);
            let filteredVehicles = await productsModel.find({ dominio: dominio }).lean();
            if (user.admin) {
                filteredVehicles = filteredVehicles;
            } else {
                const filteredByUnidad = await productsModel.find({ dominio: dominio }).lean();
                filteredVehicles = filteredByUnidad.filter(vehicle => vehicle.title === userUnidad);
            }
            const firstImage = true;
            res.render('vehicle', { docs: filteredVehicles, firstImage });
        } catch (error) {
            console.log('Error al filtrar productos', error);
            res.status(500).json({ error: 'Error al filtrar productos' });
        }
    }

    static realtimeVehicle = async (req, res) => {
        res.render('realtimeVehicle')
    }

    static edditVehicle = async (req, res) => {
        try {
            const productId = req.params.productId;
            const vehicle = await productsModel.findById(productId).lean()
            console.log(vehicle)
            res.render('edditVehicle', { vehicle });
        }catch (error) {
            res.status(500).json({ message: error.message });
        }

    }

    static vehicle = async (req, res) => {
        try {
            let pageNum = parseInt(req.query.page) || 1;
            let itemsPorPage = parseInt(req.query.limit) || 10;
            let category = req.query.category ? { category: req.query.category } : {};

            const query = {};

            // Obtener el usuario logueado
            const user = req.session.user;

            // Filtrar los productos por el campo 'title' igual al valor de la propiedad 'unidad' del usuario
            if (req.query.unidad) {
                category.title = req.query.unidad;
            } else {
                category.title = user.unidad;
            }

            const products = await productsModel.paginate(category, { page: pageNum, limit: itemsPorPage, sort: query.sort, lean: true });

            products.prevLink = products.hasPrevPage ? `?limit=${itemsPorPage}&page=${products.prevPage}` : '';
            products.nextLink = products.hasNextPage ? `?limit=${itemsPorPage}&page=${products.nextPage}` : '';

            products.page = products.page;
            products.totalPages = products.totalPages;
            console.log(products)
            res.render('vehicle', products);
        } catch (error) {
            console.log('Error al leer los productos', error);
            res.status(500).json({ error: 'error al leer los productos' });
        }
    }

    static vehicleGeneral = async (req, res) => {
        try {
            let pageNum = parseInt(req.query.page) || 1;
            let itemsPorPage = parseInt(req.query.limit) || 10;
            let category = req.query.category ? { category: req.query.category } : {};

            const query = {};

            if (req.query.unidad) {
                category.title = req.query.unidad;
            }

            const vehicle = await productsModel.paginate(category, { page: pageNum, limit: itemsPorPage, sort: query.sort, lean: true });
            vehicle.prevLink = vehicle.hasPrevPage ? `?limit=${itemsPorPage}&page=${vehicle.prevPage}` : '';
            vehicle.nextLink = vehicle.hasNextPage ? `?limit=${itemsPorPage}&page=${vehicle.nextPage}` : '';
            vehicle.page = vehicle.page;
            vehicle.totalPages = vehicle.totalPages;
            console.log(vehicle)
            res.render('vehicleGeneral', vehicle);
        } catch (error) {
            console.log('Error al leer los productos', error);
            res.status(500).json({ error: 'error al leer los productos' });
        }
    }

    static deleteVehicle = async (req, res) => {
        try {
            const id = req.params.pid;
            const deletedProduct = await productsModel.findByIdAndDelete(id);
            res.status(200).json({ status: "success", deletedProduct });
        } catch (error) {
            res.status(500).json({ status: "error", message: "Internal Server Error", error: error.message });
        }
    }

    static updateVehicle = async (req, res) => {
        try {
            const id = req.params.pid;
            const obj = req.body;
            const updatedProduct = await vehicleDao.updateVehicle(id, obj);
            res.status(200).json({ status: "success", updatedProduct });
        } catch (error) {
            res.status(500).json({ status: "error", message: "Internal Server Error", error: error.message });
        }
    }

}

export default VehicleDao;