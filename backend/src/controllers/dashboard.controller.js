import { Vehiculo, Kilometraje } from '../models/vehicle.model.js';
import { sequelize } from '../config/configServer.js';
import { Op } from 'sequelize';

class DashboardController {

    /**
     * @summary Obtiene todas las estadísticas para el dashboard principal.
     */
    static getDashboardStats = async (req, res) => {
        try {
            // Vehículos por Unidad (Gráfico de Torta)
            const vehiculosPorUnidad = await Vehiculo.findAll({
                attributes: [
                    'title', // La columna de la unidad
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'] // Contar cuántos hay
                ],
                group: ['title'], 
                order: [['count', 'DESC']] 
            });

            // Vehículos por Año (Gráfico de Barras)
            const vehiculosPorAnio = await Vehiculo.findAll({
                attributes: [
                    'anio',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['anio'],
                order: [['anio', 'ASC']] 
            });

            // Vehículos por Tipo (Gráfico de Barras)
            const vehiculosPorTipo = await Vehiculo.findAll({
                attributes: [
                    'tipo', // La columna del tipo
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['tipo'],
                order: [['count', 'DESC']]
            });

            // Top 5 vehiculos por kilometraje 
            const maxKilometrajeSubQuery = `(
                SELECT MAX(k.kilometraje)
                FROM kilometrajes k
                WHERE k.vehiculo_id = "Vehiculo"."id"
            )`;

            const top5KmVehiculos = await Vehiculo.findAll({
                attributes: [
                    'dominio',
                    [sequelize.literal(maxKilometrajeSubQuery), 'max_kilometraje'] // Usamos la subconsulta
                ],
                where: sequelize.literal(`EXISTS (
                    SELECT 1 
                    FROM kilometrajes k 
                    WHERE k.vehiculo_id = "Vehiculo"."id"
                )`),
                order: [
                    [sequelize.literal('max_kilometraje'), 'DESC'] // Ordenar por el resultado
                ],
                limit: 5 // Solo el Top 5
            });

            // Devolvemos todo en un solo objeto
            res.status(200).json({
                vehiculosPorUnidad,
                vehiculosPorAnio,
                vehiculosPorTipo,
                top5KmVehiculos
            });

        } catch (error) {
            console.error('[DASHBOARD] Error en getDashboardStats:', error);
            res.status(500).json({
                message: 'Error interno del servidor al obtener las estadísticas',
                error: error.message
            });
        }
    }
}

export default DashboardController;