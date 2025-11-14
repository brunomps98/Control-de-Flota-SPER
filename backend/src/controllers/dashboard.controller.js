import { Vehiculo, Kilometraje } from '../models/vehicle.model.js';
import { sequelize } from '../config/configServer.js';
import { Op } from 'sequelize';

class DashboardController {

    /**
     * @summary Obtiene todas las estadísticas para el dashboard principal.
     */
    static getDashboardStats = async (req, res) => {
        try {
            // 1. Vehículos por Unidad (Gráfico de Torta)
            // [Usamos la columna 'title' como 'unidad']
            const vehiculosPorUnidad = await Vehiculo.findAll({
                attributes: [
                    'title', // La columna de la unidad
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'] // Contar cuántos hay
                ],
                group: ['title'], // Agrupar por esa unidad
                order: [['count', 'DESC']] // Ordenar de mayor a menor
            });

            // 2. Vehículos por Año (Gráfico de Barras)
            const vehiculosPorAnio = await Vehiculo.findAll({
                attributes: [
                    'anio', // La columna del año
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['anio'],
                order: [['anio', 'ASC']] // Ordenar por año, del más viejo al más nuevo
            });

            // 3. Vehículos por Tipo (Gráfico de Barras)
            const vehiculosPorTipo = await Vehiculo.findAll({
                attributes: [
                    'tipo', // La columna del tipo
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['tipo'],
                order: [['count', 'DESC']]
            });

            // 4. Top 5 Vehículos por Kilometraje (Gráfico de Barras Horizontales)
            // Esta es más compleja porque 'kilometrajes' es una tabla separada
            
            // Subconsulta para obtener el 'max_kilometraje' para cada 'vehiculo_id'
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
                where: {
                    // Asegurarnos de que solo traiga vehículos que TENGAN kilometrajes
                    [Op.exists]: sequelize.literal(`SELECT 1 FROM kilometrajes k WHERE k.vehiculo_id = "Vehiculo"."id"`)
                },
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