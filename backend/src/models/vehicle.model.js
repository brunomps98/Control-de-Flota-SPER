import { DataTypes } from 'sequelize';
import { sequelize } from '../config/configServer.js';
import Usuario from './user.model.js'; 

// Modelo Principal: Vehiculo 
const Vehiculo = sequelize.define('Vehiculo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    dominio: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false
    },
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
    tableName: 'vehiculos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Modelos Hijos para los arrays

const Kilometraje = sequelize.define('Kilometraje', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
    kilometraje: { type: DataTypes.INTEGER, allowNull: false },
    fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'kilometrajes', timestamps: false });

const Service = sequelize.define('Service', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    fecha_service: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'services', timestamps: false });

const Reparacion = sequelize.define('Reparacion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    fecha_reparacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'reparaciones', timestamps: false });

const Destino = sequelize.define('Destino', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    fecha_destino: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'destinos', timestamps: false });

const Rodado = sequelize.define('Rodado', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    fecha_rodado: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'rodados', timestamps: false });

const Thumbnail = sequelize.define('Thumbnail', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
    url_imagen: { type: DataTypes.TEXT, allowNull: false }
}, { tableName: 'thumbnails', timestamps: false });

const Descripcion = sequelize.define('Descripcion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false }
}, { tableName: 'descripciones', timestamps: false });



// Relaciones Vehiculo y sus "Arrays"
// "Un Vehículo TIENE MUCHOS..."
Vehiculo.hasMany(Kilometraje, { foreignKey: 'vehiculo_id', as: 'kilometrajes' });
Vehiculo.hasMany(Service, { foreignKey: 'vehiculo_id', as: 'services' });
Vehiculo.hasMany(Reparacion, { foreignKey: 'vehiculo_id', as: 'reparaciones' });
Vehiculo.hasMany(Destino, { foreignKey: 'vehiculo_id', as: 'destinos' });
Vehiculo.hasMany(Rodado, { foreignKey: 'vehiculo_id', as: 'rodados' });
Vehiculo.hasMany(Thumbnail, { foreignKey: 'vehiculo_id', as: 'thumbnails' });
Vehiculo.hasMany(Descripcion, { foreignKey: 'vehiculo_id', as: 'descripciones' });

// "...y cada uno de esos registros PERTENECE A UN Vehículo"
Kilometraje.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });
Service.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });
Reparacion.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });
Destino.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });
Rodado.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });
Thumbnail.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });
Descripcion.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });


// Exportación de TODOS los modelos
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