// migration.js
// Script de un solo uso para migrar datos de MongoDB a PostgreSQL (Neon)
// VERSIÓN CORREGIDA

import mongoose from 'mongoose';
import { Sequelize } from 'sequelize'; // Corregido
import { sequelize } from './src/config/configServer.js'; // Corregido

// --- IMPORTAR MODELOS DE SEQUELIZE (NUESTRA DB DE DESTINO) ---
import Usuario from './src/models/user.model.js'; // Corregido
import {
    Vehiculo, Kilometraje, Service, Reparacion,
    Destino, Rodado, Thumbnail, Descripcion
} from './src/models/vehicle.model.js';

// --- DEFINIR MODELOS ANTIGUOS DE MONGOOSE (NUESTRA DB DE ORIGEN) ---
// (Como sobrescribimos los archivos, los redefinimos aquí temporalmente)

// Modelo User de Mongoose
const userSchemaMongo = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    admin: { type: Boolean, default: false },
    unidad: { type: String, required: true },
    up1: { type: Boolean, default: false },
    up3: { type: Boolean, default: false },
    up4: { type: Boolean, default: false },
    up5: { type: Boolean, default: false },
    up6: { type: Boolean, default: false },
    up7: { type: Boolean, default: false },
    up8: { type: Boolean, default: false },
    up9: { type: Boolean, default: false },
    dg: { type: Boolean, default: false },
    inst: { type: Boolean, default: false }
});
const OldUser = mongoose.model('user', userSchemaMongo);

// Modelo Vehicle (Producto) de Mongoose
const productSchemaMongo = new mongoose.Schema({
    title: { type: String },
    description: { type: [String] },
    dominio: { type: String, unique: true },
    kilometros: { type: [Number] },
    thumbnail: { type: [String] },
    destino: { type: [String] },
    anio: { type: String },
    modelo: { type: String },
    tipo: { type: String },
    chasis: { type: String },
    motor: { type: String },
    cedula: { type: String },
    service: { type: [String] },
    rodado: { type: [String] },
    reparaciones: { type: [String] },
    marca: { type: String },
    usuario: { type: String } // El nombre del chofer
});
const OldVehicle = mongoose.model('productos', productSchemaMongo);


// --- CONFIGURACIÓN DE CONEXIÓN ---

// ⚠️ ¡IMPORTANTE! Pega tu cadena de conexión de MongoDB aquí
const MONGO_URI = "mongodb+srv://registrosper:hhz3Y5gmxdRnwVnd@cluster0.n8xbufk.mongodb.net/";


// --- FUNCIÓN DE MIGRACIÓN ---

const migrate = async () => {
    try {
        // 1. Conectar a MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB (Origen)');

        // 2. Conectar a PostgreSQL (Neon)
        await sequelize.authenticate();
        console.log('✅ Conectado a PostgreSQL (Destino)');

        // --- MIGRACIÓN DE USUARIOS ---
        console.log('\nIniciando migración de Usuarios...');
        const oldUsers = await OldUser.find().lean();
        
        // Usamos un Map para guardar la relación entre el email antiguo y el ID nuevo
        const userEmailToNewId = new Map();
        // Usamos un Map para guardar la relación entre el username antiguo y el ID nuevo
        const userNameToNewId = new Map();

        for (const oldUser of oldUsers) {
            try {
                // Creamos el usuario en Postgres
                // Nota: Pasamos la contraseña 'password' hasheada de Mongo.
                // Sequelize NO la volverá a hashear, lo cual está bien.
                const newUser = await Usuario.create({
                    username: oldUser.username,
                    email: oldUser.email,
                    password: oldUser.password, // Ya está hasheada por Mongoose/bcrypt
                    unidad: oldUser.unidad,
                    admin: oldUser.admin,
                    up1: oldUser.up1,
                    up3: oldUser.up3,
                    up4: oldUser.up4,
                    up5: oldUser.up5,
                    up6: oldUser.up6,
                    up7: oldUser.up7,
                    up8: oldUser.up8,
                    up9: oldUser.up9,
                    dg: oldUser.dg,
                    inst: oldUser.inst,
                });
                console.log(`- Usuario migrado: ${newUser.username}`);
                userEmailToNewId.set(newUser.email, newUser.id);
                userNameToNewId.set(newUser.username, newUser.id);
            } catch (err) {
                if (err.name === 'SequelizeUniqueConstraintError') {
                    console.warn(`- Usuario OMITIDO (ya existe): ${oldUser.email}`);
                    // Si ya existe (como 'test_postman'), lo buscamos para guardar su ID
                    const existingUser = await Usuario.findOne({ where: { email: oldUser.email } });
                    if (existingUser) {
                        userEmailToNewId.set(existingUser.email, existingUser.id);
                        userNameToNewId.set(existingUser.username, existingUser.id);
                    }
                } else {
                    console.error(`- Error migrando usuario ${oldUser.email}:`, err.message);
                }
            }
        }
        console.log('✅ Migración de Usuarios completada.');


        // --- MIGRACIÓN DE VEHÍCULOS ---
        console.log('\nIniciando migración de Vehículos...');
        const oldVehicles = await OldVehicle.find().lean();

        for (const oldVehicle of oldVehicles) {
            // Usamos una transacción por cada vehículo
            const t = await sequelize.transaction();
            try {
                // 1. Encontrar el ID del nuevo chofer (usuario)
                // El campo 'usuario' en Mongo guardaba el 'username'
                const newUserId = userNameToNewId.get(oldVehicle.usuario) || null;

                // 2. Crear el Vehículo principal
                const newVehicle = await Vehiculo.create({
                    title: oldVehicle.title,
                    dominio: oldVehicle.dominio,
                    anio: parseInt(oldVehicle.anio) || null,
                    modelo: oldVehicle.modelo,
                    tipo: oldVehicle.tipo,
                    chasis: oldVehicle.chasis,
                    motor: oldVehicle.motor,
                    cedula: oldVehicle.cedula,
                    marca: oldVehicle.marca,
                    usuario_id: newUserId // Asignamos el ID del chofer
                }, { transaction: t });

                const vehiculoId = newVehicle.id;
                
                // 3. Crear registros en tablas "hijas"
                const createsHijos = [];

                // Función auxiliar para migrar arrays
                const migrateArray = (Model, dataArray, fieldName) => {
                    if (dataArray && dataArray.length > 0) {
                        const dataToInsert = dataArray.map(item => ({
                            vehiculo_id: vehiculoId,
                            [fieldName]: item
                        }));
                        createsHijos.push(Model.bulkCreate(dataToInsert, { transaction: t }));
                    }
                };

                // Mapeamos los arrays de Mongo a las nuevas tablas
                migrateArray(Kilometraje, oldVehicle.kilometros, 'kilometraje');
                migrateArray(Service, oldVehicle.service, 'descripcion');
                migrateArray(Reparacion, oldVehicle.reparaciones, 'descripcion');
                migrateArray(Destino, oldVehicle.destino, 'descripcion');
                migrateArray(Rodado, oldVehicle.rodado, 'descripcion');
                migrateArray(Descripcion, oldVehicle.description, 'descripcion');
                migrateArray(Thumbnail, oldVehicle.thumbnail, 'url_imagen');

                await Promise.all(createsHijos);

                // 4. Confirmar transacción
                await t.commit();
                console.log(`- Vehículo migrado: ${newVehicle.dominio}`);

            } catch (err) {
                await t.rollback();
                 if (err.name === 'SequelizeUniqueConstraintError') {
                    console.warn(`- Vehículo OMITIDO (ya existe): ${oldVehicle.dominio}`);
                 } else {
                    console.error(`- Error migrando vehículo ${oldVehicle.dominio}:`, err.message);
                 }
            }
        }
        console.log('✅ Migración de Vehículos completada.');

    } catch (error) {
        console.error('\n❌ ERROR FATAL EN LA MIGRACIÓN:', error);
    } finally {
        // 5. Desconectar ambas bases de datos
        await mongoose.disconnect();
        await sequelize.close();
        console.log('\nDesconectado de ambas bases de datos. Proceso finalizado.');
    }
};

// --- EJECUTAR LA MIGRACIÓN ---
migrate();