import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../../../api/axiosConfig';
import './Vehicle.css';
import VehicleCard from '../../components/common/VehicleCard/VehicleCard';

const Vehicle = () => {
    // --- ESTADOS Y HOOKS ---
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const [filters, setFilters] = useState({
        dominio: searchParams.get('dominio') || '',
        modelo: searchParams.get('modelo') || '',
        destino: searchParams.get('destino') || '',
        marca: searchParams.get('marca') || '',
        año: searchParams.get('año') || '',
        tipo: searchParams.get('tipo') || '',
        title: searchParams.get('title') || ''
    });

    // --- CARGA DE DATOS CON AXIOS Y PARÁMETROS ---
    useEffect(() => {
        const fetchVehicles = async () => {
            setLoading(true);
            try {
                // 2. Usamos apiClient.get para cargar los vehículos.
                const response = await apiClient.get('/api/vehicles', {
                    params: Object.fromEntries(searchParams)
                });
                setVehicles(response.data.docs || []);
            } catch (err) {
                setError(err.response?.data?.message || 'No se pudieron cargar los vehículos.');
            } finally {
                setLoading(false);
            }
        };
        fetchVehicles();
    }, [searchParams]);

    // --- LÓGICA DE FILTROS ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        
        clearTimeout(window.filterTimeout);
        window.filterTimeout = setTimeout(() => {
            const newFilters = { ...filters, [name]: value };
            const query = {};
            for (const key in newFilters) if (newFilters[key]) query[key] = newFilters[key];
            setSearchParams(query);
        }, 400);
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        const newFilters = {};
        for (const key in filters) {
            if (filters[key]) {
                newFilters[key] = filters[key];
            }
        }
        setSearchParams(newFilters);
    };

    const handleClearFilters = () => {
        setFilters({
            dominio: '', modelo: '', destino: '', marca: '', año: '', tipo: '', title: ''
        });
        setSearchParams({});
    };

    // --- RENDERIZADO  ---
    if (error) return <div>Error al cargar los datos: {error}</div>;

    return (
        <>
            <div className="titulo-products">
                <h1>Flota de Vehículos</h1>
            </div>

            <form className="filter-container" onSubmit={handleFilterSubmit}>
                <div className="filter-group">
                    <label htmlFor="dominio">Dominio:</label>
                    <input type="text" id="dominio" name="dominio" value={filters.dominio} onChange={handleFilterChange} />
                </div>
                <div className="filter-group">
                    <label htmlFor="modelo">Modelo:</label>
                    <input type="text" id="modelo" name="modelo" value={filters.modelo} onChange={handleFilterChange} />
                </div>
                <div className="filter-group">
                    <label htmlFor="destino">Destino:</label>
                    <input type="text" id="destino" name="destino" value={filters.destino} onChange={handleFilterChange} />
                </div>
                <div className="filter-group">
                    <label htmlFor="marca">Marca:</label>
                    <input type="text" id="marca" name="marca" value={filters.marca} onChange={handleFilterChange} />
                </div>
                <div className="filter-group">
                    <label htmlFor="año">Año:</label>
                    <input type="text" id="año" name="año" value={filters.año} onChange={handleFilterChange} />
                </div>
                <div className="filter-group">
                    <label htmlFor="tipo">Tipo:</label>
                    <input type="text" id="tipo" name="tipo" value={filters.tipo} onChange={handleFilterChange} />
                </div>
                <div className="filter-buttons">
                    <button type="submit" className="btn btn-primary">Filtrar</button>
                    <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>Limpiar</button>
                </div>
            </form>

            <div className="vehicle-grid">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="vehicle-card-skeleton"></div>
                    ))
                ) : vehicles.length > 0 ? (
                    vehicles.map(vehicle => <VehicleCard key={vehicle._id} vehicle={vehicle} />)
                ) : (
                    <p style={{ textAlign: 'center' }}>No se encontraron vehículos.</p>
                )}
            </div>
        </>
    );
};

export default Vehicle;