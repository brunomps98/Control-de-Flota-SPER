


import { productsModel } from "../models/vehicle.model.js"

export default class VehicleManager {




    getVehicle = async () => {
        try {
            const products = await productsModel.find().lean();
            const productsWithFirstThumbnail = products.map(product => ({
                ...product,
                thumbnail: product.thumbnail.length > 0 ? product.thumbnail[0] : null
            }));
            return productsWithFirstThumbnail;
        } catch (err) {
            return err;
        }
    }

    getVehicleById = async (id) => {
        try {
            return await productsModel.findById(id)

        } catch (err) {
            return { error: err.message }
        }
    }


    addVehicle = async (product) => {

        console.log("Adding vehicle with product data:", product);
        // correccion para manejar todos los datos solicitados
        try {
            const { usuario, title, description, dominio, kilometros, destino, anio, modelo, tipo, chasis, motor, cedula, service, rodado, reparaciones, marca, thumbnail } = product;
            const newProduct = await productsModel.create({
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
                thumbnail,
                usuario,
            });
            return newProduct;
        } catch (err) {
            return err;
        }
    }

    updateVehicle = async (id, product) => {
        try {    
            const updateFields = {
                $addToSet: {
                    kilometros: product.kilometros,
                    destino: product.destino,
                    description: product.description,
                    service: product.service,
                    rodado: product.rodado,
                    reparaciones: product.reparaciones,
                }
            };
    
            return await productsModel.findByIdAndUpdate(id, updateFields, { new: true });
            
        } catch (err) {
            return err;
        }
    }
    



    deleteVehicle = async (id) => {
        try {
            return await productsModel.findByIdAndDelete(id);
        } catch (err) {
            return err
        }

    }
    getVehicleByDominio = async (domain) => {
        try {
            const filteredProducts = await productsModel.find({ dominio: domain }).lean();
            const productsWithFirstThumbnail = filteredProducts.map(product => {
                if (typeof product.thumbnail === 'string' && product.thumbnail.length > 0) {
                    // Verificar si la ruta de la imagen ya es completa o solo el nombre del archivo
                    if (!product.thumbnail.startsWith('/uploads/')) {
                        product.thumbnail = '/uploads/' + product.thumbnail;
                    }
                }
                return product;
            });
            return productsWithFirstThumbnail;
        } catch (err) {
            return err;
        }
    }
}
