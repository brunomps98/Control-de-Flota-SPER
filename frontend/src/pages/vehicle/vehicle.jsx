// vehicle.jsx (CORREGIDO CON BOTÓN ATRÁS)

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './vehicle.css';
import VehicleCard from '../../components/common/VehicleCard/VehicleCard';
import { toast } from 'react-toastify';
import { App } from '@capacitor/app'; 
import { Capacitor } from '@capacitor/core'; 

const Vehicle = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [filters, setFilters] = useState({
        dominio: '', modelo: '', destino: '', marca: '', año: '', tipo: '', title: ''
    });

    // --- EFECTOS ---

    // Efecto para el Toast de Bienvenida
    useEffect(() => {
        if (location.state?.username) {
            toast.success(`Bienvenido, ${location.state.username}!`);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return; // No hacer nada en web

        const handleBackButton = () => {
            // Acción personalizada: Cerrar sesión y ir al login
            localStorage.removeItem('token');
            navigate('/login');
        };

        // Añadir el listener
        const listenerPromise = App.addListener('backButton', handleBackButton);

        return () => {
            // Limpiar el listener al desmontar
            listenerPromise.then(listener => listener.remove());
        };
    }, [navigate]); // Depende de 'navigate'



    useEffect(() => {
        setFilters({
            dominio: searchParams.get('dominio') || '',
            modelo: searchParams.get('modelo') || '',
            destino: searchParams.get('destino') || '',
            marca: searchParams.get('marca') || '',
            año: searchParams.get('año') || '',
            tipo: searchParams.get('tipo') || '',
            title: searchParams.get('title') || ''
        });
    }, [searchParams]);

    // Efecto para cargar vehículos (Depende de searchParams)
    useEffect(() => {
        const fetchVehicles = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.get('/api/vehicles', {
                    params: Object.fromEntries(searchParams)
                });
                setVehicles(response.data.docs || []);
            } catch (err) {
                toast.error(err.response?.data?.message || 'No se pudieron cargar los vehículos.');
                setError('Error al cargar vehículos.');
            } finally {
                setLoading(false);
            }
        };
        fetchVehicles();
    }, [searchParams]);

    
    // Efecto para Debouncing de filtros (ESTADO -> URL)
    useEffect(() => {
        const timer = setTimeout(() => {
            const query = {};
            let paramsChanged = false; 
            for (const key in filters) {
                const urlValue = searchParams.get(key) || '';
                if (filters[key] !== urlValue) {
                    paramsChanged = true;
                }
                if (filters[key]) {
                    query[key] = filters[key];
                }
            }
            if (paramsChanged || Object.keys(query).length === 0) {
                 setSearchParams(query);
            }
        }, 400); 
        return () => clearTimeout(timer);
    }, [filters, setSearchParams, searchParams]); 

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    const handleFilterSubmit = (e) => {
        e.preventDefault();
        const query = {};
        for (const key in filters) {
            if (filters[key]) query[key] = filters[key];
        }
        setSearchParams(query);
    };
    const handleClearFilters = () => {
        setFilters({
            dominio: '', modelo: '', destino: '', marca: '', año: '', tipo: '', title: ''
        });
    };

    // --- RENDERIZADO ---
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
                    vehicles.map(vehicle => <VehicleCard key={vehicle.id} vehicle={vehicle} />)
                ) : (
                    <p style={{ textAlign: 'center' }}>{error ? 'Error al cargar. Intenta de nuevo.' : 'No se encontraron vehículos.'}</p>
                )}
            </div>
        </>
    );
}

export default Vehicle;