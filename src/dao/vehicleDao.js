import { productsModel } from "../models/vehicle.model.js";




class VehicleDao {

    static addVehicleWithImage = async (req, res) => {
        try {
            // Obtenemos los campos de texto del formulario desde req.body
            const { title, description, dominio, kilometros, destino, anio, modelo, tipo, chasis, motor, cedula, service, rodado, reparaciones, marca, usuario } = req.body;

            // Obtenemos los archivos de imagen desde req.files, que es donde Multer los coloca.
            // Verificamos que req.files exista para evitar errores.
            const thumbnail = req.files ? req.files.map(file => file.filename) : [];

            // Creamos el objeto del vehículo con la estructura correcta.
            // Los campos de historial deben ser inicializados como arrays que contienen el primer valor.
            const product = {
                title,
                dominio,
                destino: [destino],
                anio,
                modelo,
                tipo,
                chasis,
                motor,
                cedula,
                marca,
                usuario,
                thumbnail,
                description: [description],
                kilometros: [kilometros],
                service: [service],
                rodado: [rodado],
                reparaciones: [reparaciones]
            };

            const newProduct = await productsModel.create(product);

            res.status(201).json({ message: "Vehículo creado con éxito", newProduct });

        } catch (error) {
            console.error("Error al crear vehículo:", error);
            res.status(500).json({ message: "Error interno del servidor", error: error.message });
        }
    }

    static vehicleDetail = async (req, res) => {
        try {
            const id = req.params.cid;
            const vehicle = await productsModel.findById(id).lean().exec();

            if (vehicle == null) {
                return res.status(404).json({ status: 'error', error: 'product not found' });
            }

            const lastIndexS = vehicle.service.length - 1;
            const lastIndexR = vehicle.rodado.length - 1;
            const lastIndexK = vehicle.kilometros.length - 1;
            const lastIndexD = vehicle.description.length - 1;
            const lastIndexT = vehicle.destino.length - 1;

            const allImages = vehicle.thumbnail
            const firstImage = true;

            res.render('vehicleDetail', { vehicle, allImages, firstImage, lastIndexS, lastIndexK, lastIndexR, lastIndexD, lastIndexT });
        } catch (error) {
            res.status(500).json({ error: 'error al leer el vehicle' });
        }
    }

    static vehicleFilter = async (req, res) => {
        try {

            const { dominio, modelo, destino, marca, año, tipo, chofer } = req.query;

            const filter = {};

            if (modelo) {

                filter.modelo = new RegExp(modelo, 'i');
            }

            if (marca) {

                filter.marca = new RegExp(marca, 'i');
            }

            if (dominio) filter.dominio = new RegExp(dominio, 'i');
            if (destino) filter.destino = new RegExp(destino, 'i');
            if (año) filter.año = new RegExp(año, 'i');
            if (tipo) filter.tipo = new RegExp(tipo, 'i');
            if (chofer) filter.usuario = new RegExp(chofer, 'i');



            const user = req.user;
            if (user && !user.admin) {
                filter.title = user.unidad;
            }


            const filteredVehicles = await productsModel.find(filter).lean();


            res.render('vehicle', { docs: filteredVehicles, user });

        } catch (error) {

        }
    }


    // Cargar vista de vehicleInformation 

    static realtimeVehicle = async (req, res) => {
        res.render('realtimeVehicle')
    }

    static edditVehicle = async (req, res) => {
        try {
            const productId = req.params.productId;
            const vehicle = await productsModel.findById(productId).lean()
            res.render('edditVehicle', { vehicle });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }

    }

    static deleteLastHistoryEntry = async (req, res) => {
        try {
            const { vid, fieldName } = req.params;

            // Lista de campos permitidos para evitar modificaciones no deseadas
            const allowedFields = ['kilometros', 'service', 'rodado', 'reparaciones', 'description'];

            if (!allowedFields.includes(fieldName)) {
                return res.status(400).json({ status: 'error', message: 'Campo no válido' });
            }

            // Usamos el operador $pop de MongoDB. { $pop: { campo: 1 } } elimina el último elemento.
            const update = { $pop: { [fieldName]: 1 } };

            await productsModel.findByIdAndUpdate(vid, update);

            res.status(200).json({ status: "success", message: `Último registro de ${fieldName} eliminado.` });
        } catch (error) {
            res.status(500).json({ status: "error", message: "Error interno del servidor", error: error.message });
        }
    }

    static vehicle = async (req, res) => {
        try {
            let pageNum = parseInt(req.query.page) || 1;
            let itemsPorPage = parseInt(req.query.limit) || 10;
            let category = req.query.category ? { category: req.query.category } : {};

            const query = {};

            // Obtener el usuario logueado
            const user = req.user;

            // Filtrar los productos por el campo 'title' igual al valor de la propiedad 'unidad' del usuario
            if (req.query.unidad) {
                category.title = req.query.unidad;
            } else if (user && !user.admin) {
                category.title = user.unidad;
            }

            const products = await productsModel.paginate(category, { page: pageNum, limit: itemsPorPage, sort: query.sort, lean: true });

            products.prevLink = products.hasPrevPage ? `?limit=${itemsPorPage}&page=${products.prevPage}` : '';
            products.nextLink = products.hasNextPage ? `?limit=${itemsPorPage}&page=${products.nextPage}` : '';

            products.page = products.page;
            products.totalPages = products.totalPages;
            res.render('vehicle', products);
        } catch (error) {
            console.log('Error al leer los productos', error);
            res.status(500).json({ error: 'error al leer los productos' });
        }
    }

    static vehicleInformation = async (req, res) => {
        try {
            // 1. Obtenemos el ID del vehículo desde la URL (ej: /vehicleInformation/60f8c2b7c9e77c001f8e4d3a)
            const id = req.params.cid;
            const vehicle = await productsModel.findById(id).lean().exec();

            // 2. Verificamos si el vehículo existe
            if (vehicle == null) {
                return res.status(404).json({ status: 'error', error: 'product not found' });
            }

            // 3. Calculamos los últimos índices de los arrays (para mostrar el último servicio, kilometraje, etc.)
            const lastIndexS = vehicle.service.length - 1;
            const lastIndexR = vehicle.rodado.length - 1;
            const lastIndexK = vehicle.kilometros.length - 1;
            const lastIndexD = vehicle.description.length - 1;

            // 4. Renderizamos la vista 'vehicleInformation' y le pasamos los datos del vehículo
            res.render('vehicleInformation', { vehicle, lastIndexS, lastIndexK, lastIndexR, lastIndexD });

        } catch (error) {
            // Manejo de errores
            res.status(500).json({ error: 'error al leer el vehicle' });
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
            res.render('vehicleGeneral', vehicle);
        } catch (error) {
            console.log('Error al leer los productos', error);
            res.status(500).json({ error: 'error al leer los productos' });
        }
    }

    static updateVehicle = async (req, res) => {
        try {
            const id = req.params.productId;
            const body = req.body;

            const updateData = {
                $push: {}, // Objeto para los campos de historial
                $set: {}   // Objeto para campos que se actualizan directamente
            };

            // Lista de los campos que deben tratarse como un historial (arrays)
            const arrayFields = ['kilometros', 'service', 'rodado', 'reparaciones', 'description', 'destino'];

            // Recorremos los datos que llegan del formulario
            for (const key in body) {
                // MUY IMPORTANTE: Solo procesamos el campo si tiene un valor y no es un string vacío.
                if (body[key] && body[key] !== '') {
                    if (arrayFields.includes(key)) {
                        // Si es un campo de historial, lo añadimos con $push
                        updateData.$push[key] = body[key];
                    } else {
                        // Si no, es un campo normal que se debe reemplazar con $set
                        updateData.$set[key] = body[key];
                    }
                }
            }

            // Si después de filtrar no quedó nada en $push, lo eliminamos
            if (Object.keys(updateData.$push).length === 0) {
                delete updateData.$push;
            }
            // Si no quedó nada en $set, lo eliminamos
            if (Object.keys(updateData.$set).length === 0) {
                delete updateData.$set;
            }

            // Si no hay ningún dato para actualizar, simplemente retornamos éxito sin hacer nada en la DB.
            if (!updateData.$push && !updateData.$set) {
                return res.status(200).json({ status: "success", message: "No se enviaron campos para actualizar." });
            }

            // Ejecutamos la actualización en la base de datos
            const updatedVehicle = await productsModel.findByIdAndUpdate(id, updateData, { new: true });

            if (!updatedVehicle) {
                return res.status(404).json({ status: "error", message: "Vehículo no encontrado." });
            }

            res.status(200).json({ status: "success", updatedVehicle });

        } catch (error) {
            console.error("Error al actualizar vehículo:", error);
            res.status(500).json({ status: "error", message: "Error interno del servidor", error: error.message });
        }
    }

    static getVehicleById = async (req, res) => {
        try {
            const { cid } = req.params; // Obtenemos el ID de la URL
            const vehicle = await productsModel.findById(cid).lean();

            if (!vehicle) {
                // Si no se encuentra el vehículo, devolvemos un 404
                return res.status(404).json({ message: 'Vehículo no encontrado' });
            }

            // Si se encuentra, lo devolvemos como JSON para que React lo pueda usar
            res.status(200).json({ vehicle: vehicle });

        } catch (error) {
            console.error("Error al obtener vehículo por ID:", error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    };


    static getVehiclesForUser = async (req, res) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ message: 'Usuario no autenticado' });
            }

            const filter = {};
            // Obtenemos los posibles filtros desde la URL (req.query)
            const { dominio, modelo, destino, marca, año, tipo, title } = req.query;

            // Aplicamos los filtros de texto del formulario
            if (dominio) filter.dominio = new RegExp(dominio, 'i');
            if (modelo) filter.modelo = new RegExp(modelo, 'i');
            if (destino) filter.destino = new RegExp(destino, 'i');
            if (marca) filter.marca = new RegExp(marca, 'i');
            if (año) filter.año = new RegExp(año, 'i');
            if (tipo) filter.tipo = new RegExp(tipo, 'i');

            // --- LÓGICA MEJORADA PARA EL FILTRO DE UNIDAD ---
            if (title) {
                // Si la URL pide un 'title' (ej: desde la NavBar), ese es el filtro que usamos.
                filter.title = new RegExp(title, 'i');
            } else if (!user.admin) {
                // Si la URL NO pide un 'title', y el usuario NO es admin,
                // entonces filtramos por la unidad del usuario logueado.
                filter.title = user.unidad;
            }
            // Si el usuario es admin y no se especifica un 'title', no se aplica ningún filtro de unidad.

            const vehicles = await productsModel.find(filter).lean();
            res.status(200).json({ docs: vehicles });

        } catch (error) {
            console.error('Error al obtener vehículos:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    static deleteVehicle = async (req, res) => {
        try {
            const id = req.params.pid;
            console.log("Deleting vehicle with ID:", id);
            const deletedProduct = await productsModel.findByIdAndDelete(id);
            res.status(200).json({ status: "success", deletedProduct });
        } catch (error) {
            res.status(500).json({ status: "error", message: "Internal Server Error", error: error.message });
        }
    }




}

export default VehicleDao;