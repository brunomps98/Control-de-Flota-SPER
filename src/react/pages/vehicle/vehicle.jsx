import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Vehicle.css';
import VehicleCard from '../../components/common/VehicleCard/VehicleCard';

const Vehicle = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        dominio: '', modelo: '', destino: '', marca: '', año: '', tipo: ''
    });

    const fetchVehicles = async (queryParams = '') => {
        setLoading(true);
        try {
            const response = await fetch(`/api/vehicles?${queryParams}`, {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('La respuesta de la red no fue exitosa');
            }
            const data = await response.json();
            setVehicles(data.docs || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        const queryParams = new URLSearchParams(filters).toString();
        fetchVehicles(queryParams);
    };
    
    const handleClearFilters = () => {
        setFilters({
            dominio: '', modelo: '', destino: '', marca: '', año: '', tipo: ''
        });
        fetchVehicles();
    };

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
            
            <div className={`vehicle-grid ${loading ? 'loading' : ''}`}>
                {vehicles.length > 0 ? (
                    vehicles.map(vehicle => (
                        <VehicleCard key={vehicle._id} vehicle={vehicle} />
                    ))
                ) : (
                    // No mostramos este mensaje mientras carga la primera vez
                    !loading && <p style={{ textAlign: 'center' }}>No se encontraron vehículos.</p>
                )}
            </div>

            
        </>
    );
};

export default Vehicle;