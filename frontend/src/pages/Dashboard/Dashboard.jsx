import React, { useEffect, useState } from 'react';
import apiClient from '../../api/axiosConfig';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './Dashboard.css';

// Registrar los componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Llamar al endpoint del backend al cargar
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get('/api/dashboard/stats');
                setStats(response.data);
                setError(null);
            } catch (err) {
                setError(err.response?.data?.message || 'Error al cargar las estadísticas.');
                console.error("Error en dashboard:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // 3. Funciones para preparar los datos para los gráficos
    
    // Gráfico 1: Vehículos por Unidad
    const getUnidadChartData = () => {
        if (!stats?.vehiculosPorUnidad) return null;
        return {
            labels: stats.vehiculosPorUnidad.map(item => item.title),
            datasets: [{
                label: 'Vehículos',
                data: stats.vehiculosPorUnidad.map(item => item.count),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                ],
            }]
        };
    };

    // Gráfico 2: Vehículos por Año
    const getAnioChartData = () => {
        if (!stats?.vehiculosPorAnio) return null;
        return {
            labels: stats.vehiculosPorAnio.map(item => item.anio),
            datasets: [{
                label: 'Cantidad de Vehículos',
                data: stats.vehiculosPorAnio.map(item => item.count),
                backgroundColor: '#36A2EB',
            }]
        };
    };

    // Gráfico 3: Vehículos por Tipo
    const getTipoChartData = () => {
        if (!stats?.vehiculosPorTipo) return null;
        return {
            labels: stats.vehiculosPorTipo.map(item => item.tipo),
            datasets: [{
                label: 'Cantidad de Vehículos',
                data: stats.vehiculosPorTipo.map(item => item.count),
                backgroundColor: '#4BC0C0',
            }]
        };
    };
    
    // Gráfico 4: Top 5 KM
    const getTopKmChartData = () => {
        if (!stats?.top5KmVehiculos) return null;
        return {
            labels: stats.top5KmVehiculos.map(item => item.dominio),
            datasets: [{
                label: 'Kilometraje Máximo',
                data: stats.top5KmVehiculos.map(item => item.max_kilometraje),
                backgroundColor: '#FF9F40',
            }]
        };
    };

    // --- Renderizado ---
    if (loading) {
        return <div className="dashboard-container"><h2>Cargando estadísticas...</h2></div>;
    }
    if (error) {
        return <div className="dashboard-container"><div className="alert alert-danger">{error}</div></div>;
    }
    if (!stats) {
        return <div className="dashboard-container"><h2>No se encontraron datos.</h2></div>;
    }

    // Opciones para los gráficos de barras 
    const barOptions = {
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: false } }
    };
    
    const pieOptions = {
        plugins: { legend: { position: 'right' } }
    };

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">Dashboard de la Flota</h1>
            
            <div className="dashboard-grid">
                
                {/* Gráfico 1 */}
                <div className="chart-card">
                    <h3>Vehículos por Unidad</h3>
                    <div className="chart-wrapper pie-chart">
                        {getUnidadChartData() && <Pie data={getUnidadChartData()} options={pieOptions} />}
                    </div>
                </div>

                {/* Gráfico 2 */}
                <div className="chart-card">
                    <h3>Top 5 por Kilometraje</h3>
                    <div className="chart-wrapper">
                        {getTopKmChartData() && <Bar data={getTopKmChartData()} options={barOptions} />}
                    </div>
                </div>

                {/* Gráfico 3 */}
                <div className="chart-card">
                    <h3>Vehículos por Año</h3>
                    <div className="chart-wrapper">
                        {getAnioChartData() && <Bar data={getAnioChartData()} options={barOptions} />}
                    </div>
                </div>

                {/* Gráfico 4 */}
                <div className="chart-card">
                    <h3>Vehículos por Tipo</h3>
                    <div className="chart-wrapper">
                        {getTipoChartData() && <Bar data={getTipoChartData()} options={barOptions} />}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;