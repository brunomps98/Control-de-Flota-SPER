import React, { useState, useEffect } from 'react';
// CAMBIO: Importamos los componentes para el Gráfico de Barras
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale, BarElement } from 'chart.js';
// CAMBIO: Importamos 'Bar' además de 'Doughnut'
import { Doughnut, Bar } from 'react-chartjs-2';
import apiClient from '../../api/axiosConfig';
import './Dashboard.css';

// CAMBIO: Registramos los nuevos componentes
ChartJS.register(
    ArcElement, Tooltip, Legend, Title, 
    CategoryScale, LinearScale, BarElement
);

const Dashboard = () => {
    const [unitStats, setUnitStats] = useState(null);
    // CAMBIO: Nuevo estado para el gráfico de barras
    const [mileageStats, setMileageStats] = useState(null); 
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllStats = async () => {
            try {
                // CAMBIO: Usamos Promise.all para cargar ambos sets de datos a la vez
                const [unitResponse, mileageResponse] = await Promise.all([
                    apiClient.get('/api/stats/vehicles-per-unit'),
                    apiClient.get('/api/stats/vehicles-by-mileage') // La nueva ruta
                ]);

                // --- 1. Procesar datos del Gráfico de Torta ---
                const unitLabels = unitResponse.data.map(item => item.title);
                const unitDataCounts = unitResponse.data.map(item => item.count);
                setUnitStats({
                    labels: unitLabels,
                    datasets: [{
                        label: 'Vehículos',
                        data: unitDataCounts,
                        backgroundColor: [
                            '#009688', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                            '#9966FF', '#FF9F40', '#E7E9ED', '#3F51B5', '#F44336', 
                            '#8BC34A', '#FFC107'
                        ],
                        borderColor: '#1c2836',
                        borderWidth: 3,
                    }],
                });

                // --- 2. Procesar datos del Gráfico de Barras ---
                const mileageLabels = mileageResponse.data.map(item => `${item.dominio} (${item.modelo})`);
                const mileageDataCounts = mileageResponse.data.map(item => item.latestKilometraje);
                setMileageStats({
                    labels: mileageLabels,
                    datasets: [{
                        label: 'Kilometraje Actual',
                        data: mileageDataCounts,
                        backgroundColor: '#009688',
                        borderColor: '#007a6e',
                        borderWidth: 1,
                    }],
                });

            } catch (err) {
                setError(err.response?.data?.message || 'No se pudieron cargar las estadísticas.');
            } finally {
                setLoading(false);
            }
        };

        fetchAllStats();
    }, []);

    // --- Opciones para el Gráfico de Barras (Nuevo) ---
    const barOptions = {
        indexAxis: 'y', // <-- Esto hace el gráfico horizontal
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false, // Ocultamos la leyenda
            },
            title: {
                display: true,
                text: 'Top 10 Vehículos por Kilometraje',
                color: '#ffffff',
                font: { size: 16 }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.raw.toLocaleString('es-AR')} km`;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#aeb9c4',
                    callback: function(value) {
                        return (value / 1000) + 'k km'; // Formato "100k km"
                    }
                },
                grid: {
                    color: '#4a5568'
                }
            },
            y: {
                ticks: {
                    color: '#aeb9c4',
                    font: { size: 10 }
                },
                grid: {
                    display: false
                }
            }
        }
    };

    if (loading) return <div className="dashboard-container"><p>Cargando estadísticas...</p></div>;
    if (error) return <div className="dashboard-container"><p className="error-message">{error}</p></div>;

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">Dashboard de Administrador</h1>
            
            <div className="widget-grid">
                {/* --- Widget 1: Gráfico de Torta (Modificado) --- */}
                <div className="dashboard-widget">
                    <h2>Vehículos por Unidad</h2>
                    {unitStats && (
                        <div className="chart-container">
                            <Doughnut 
                                data={unitStats} 
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'right', labels: { color: '#f0f0f0', font: { size: 14 } } },
                                        title: { display: true, text: 'Distribución de la Flota', color: '#ffffff', font: { size: 16 } }
                                    }
                                }} 
                            />
                        </div>
                    )}
                </div>

                {/* --- ▼▼ CAMBIO: Widget 2: Gráfico de Barras (Nuevo) ▼▼ --- */}
                <div className="dashboard-widget">
                    <h2>Top 10 Kilometraje</h2>
                    {mileageStats && (
                        <div className="chart-container">
                            <Bar data={mileageStats} options={barOptions} />
                        </div>
                    )}
                </div>
                {/* --- ▲▲ FIN DEL CAMBIO ▲▲ --- */}
            </div>
        </div>
    );
};

export default Dashboard;