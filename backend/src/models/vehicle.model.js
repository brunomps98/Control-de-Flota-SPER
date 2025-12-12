import { DataTypes } from 'sequelize';
import { sequelize } from '../config/configServer.js';
import Usuario from './user.model.js'; 

// Creamos el modelo Vehiculo

const Vehiculo = sequelize.define('Vehiculo', {
    // Definimos los atributos del modelo

    // ID del vehiculo
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // ID del usuario propietario
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'usuarios', 
            key: 'id'
        }
    },
    // Dominio unico del vehiculo
    dominio: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false
    },
    // Datos de vehiculo
    marca: { type: DataTypes.STRING(100) },
    modelo: { type: DataTypes.STRING(100) },
    anio: { type: DataTypes.INTEGER }, 
    tipo: { type: DataTypes.STRING(100) },
    chasis: { type: DataTypes.STRING(100), unique: true },
    motor: { type: DataTypes.STRING(100), unique: true },
    cedula: { type: DataTypes.STRING(100) },
    title: { type: DataTypes.STRING(255) },
    chofer: { 
    type: DataTypes.STRING(255),
    allowNull: true
}
}, {
    // Opciones del modelo
    tableName: 'vehiculos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Modelos Hijos para los arrays

// Kilometrajes
const Kilometraje = sequelize.define('Kilometraje', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
    kilometraje: { type: DataTypes.INTEGER, allowNull: false },
    fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'kilometrajes', timestamps: false });

// Services
const Service = sequelize.define('Service', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    fecha_service: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'services', timestamps: false });

// Reparaciones
const Reparacion = sequelize.define('Reparacion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    fecha_reparacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'reparaciones', timestamps: false });

// Destinos
const Destino = sequelize.define('Destino', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    fecha_destino: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'destinos', timestamps: false });

// Rodados
const Rodado = sequelize.define('Rodado', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    fecha_rodado: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'rodados', timestamps: false });

// Miniatura
const Thumbnail = sequelize.define('Thumbnail', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
    url_imagen: { type: DataTypes.TEXT, allowNull: false }
}, { tableName: 'thumbnails', timestamps: false });

// Descripciones
const Descripcion = sequelize.define('Descripcion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false }
}, { tableName: 'descripciones', timestamps: false });



// Relaciones Vehiculo y sus "Arrays"
// "Un Vehículo tiene muchos..."
Vehiculo.hasMany(Kilometraje, { foreignKey: 'vehiculo_id', as: 'kilometrajes' });
Vehiculo.hasMany(Service, { foreignKey: 'vehiculo_id', as: 'services' });
Vehiculo.hasMany(Reparacion, { foreignKey: 'vehiculo_id', as: 'reparaciones' });
Vehiculo.hasMany(Destino, { foreignKey: 'vehiculo_id', as: 'destinos' });
Vehiculo.hasMany(Rodado, { foreignKey: 'vehiculo_id', as: 'rodados' });
Vehiculo.hasMany(Thumbnail, { foreignKey: 'vehiculo_id', as: 'thumbnails' });
Vehiculo.hasMany(Descripcion, { foreignKey: 'vehiculo_id', as: 'descripciones' });

// "...y cada uno de esos registros pertenece a un vehiculo"
Kilometraje.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });
Service.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });
Reparacion.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });
Destino.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });
Rodado.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });
Thumbnail.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });
Descripcion.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });
Vehiculo.belongsTo(Usuario, { foreignKey: 'user_id', as: 'owner' });


// Exportación de todos los modelos (padre e hijos)
export {
    Vehiculo,
    Kilometraje,
    Service,
    Reparacion,
    Destino,
    Rodado,
    Thumbnail,
    Descripcion
};