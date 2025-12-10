import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation, useNavigate, useOutletContext } from 'react-router-dom'; // 1. Importar useOutletContext
import apiClient from '../../api/axiosConfig';
import './Vehicle.css';
import VehicleCard from '../../components/common/VehicleCard/VehicleCard';
import { toast } from 'react-toastify';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// Inicializamos Swal
const MySwal = withReactContent(Swal);

// Icono
const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 7.973 1.011a.75.75 0 0 1 .472.691l1.524 8.283a.75.75 0 0 1-.472.691A18.66 18.66 0 0 1 12 15c-2.755 0-5.455-.232-7.973-1.011a.75.75 0 0 1-.472-.691l-1.524-8.283a.75.75 0 0 1 .472-.691A18.66 18.66 0 0 1 12 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v5.25m0 0 3-3m-3 3-3-3" />
    </svg>
);

const Vehicle = () => {
    // Obtener usuario del layout
    const { user } = useOutletContext() || {}; 
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        dominio: '', modelo: '', destino: '', marca: '', año: '', tipo: '', title: ''
    });

    // UseEffect para mensaje de bienvenida (Bienvenido "Usuario")
    useEffect(() => {
        if (location.state?.username) {
            toast.success(`Bienvenido, ${location.state.username}!`);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // UseEffect para Capacitor y manejo de botón atras
    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;
        const listenerPromise = App.addListener('backButton', (event) => {
            if (location.pathname === '/vehicle') {
                event.preventDefault();
                App.exitApp(); 
            }
        });
        return () => {
            listenerPromise.then(listener => listener.remove());
        };
    }, [location.pathname]);

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

    // UseEffect para obtener vehiculos
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
                // Mensaje de error
                toast.error(err.response?.data?.message || 'No se pudieron cargar los vehículos.');
                setError('Error al cargar vehículos.');
            } finally {
                setLoading(false);
            }
        };
        fetchVehicles();
    }, [searchParams]);

    // Timer para timeout
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
    
    // Todo para filtrar

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

    // Manejar eliminación desde la Card
    const handleDeleteVehicle = (vehicleId) => {
        MySwal.fire({
            // Confirmación
            title: '¿Estás seguro?',
            text: "¡Vas a eliminar este vehículo! Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/api/vehicle/${vehicleId}`);
                    
                    // Actualizamos el estado local filtrando el vehículo eliminado
                    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
                    
                    MySwal.fire(
                        '¡Eliminado!',
                        'El vehículo ha sido eliminado correctamente.',
                        'success'
                    );
                } catch (err) {
                    console.error(err);
                    MySwal.fire(
                        // Mensaje de error 
                        'Error',
                        'Hubo un problema al eliminar el vehículo.',
                        'error'
                    );
                }
            }
        });
    };

    return (
        <div className="login-page" style={{ padding: '30px 40px' }}>
            <div className="titulo-products">
                <h1>Flota de Vehículos</h1>
            </div>

            <button
                className="btn-filter-toggle"
                onClick={() => setIsFilterOpen(prev => !prev)}
            >
                <FilterIcon />
                {isFilterOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>

            <form
                className={`filter-container ${isFilterOpen ? 'filter-mobile-open' : ''}`}
                onSubmit={handleFilterSubmit}
            >
               <h3 className="filter-title">Filtrar Vehículos</h3>
                <div className="filter-group">
                    <label htmlFor="dominio">Dominio:</label>
                    <input type="text" id="dominio" name="dominio" value={filters.dominio} onChange={handleFilterChange} placeholder="AA-123-BB" />
                </div>
                <div className="filter-group">
                    <label htmlFor="modelo">Modelo:</label>
                    <input type="text" id="modelo" name="modelo" value={filters.modelo} onChange={handleFilterChange} placeholder="Ranger" />
                </div>
                <div className="filter-group">
                    <label htmlFor="destino">Destino:</label>
                    <input type="text" id="destino" name="destino" value={filters.destino} onChange={handleFilterChange} placeholder="U.P. N°1" />
                </div>
                <div className="filter-group">
                    <label htmlFor="marca">Marca:</label>
                    <input type="text" id="marca" name="marca" value={filters.marca} onChange={handleFilterChange} placeholder="Ford" />
                </div>
                <div className="filter-group">
                    <label htmlFor="año">Año:</label>
                    <input type="text" id="año" name="año" value={filters.año} onChange={handleFilterChange} placeholder="2020" />
                </div>
                <div className="filter-group">
                    <label htmlFor="tipo">Tipo:</label>
                    <input type="text" id="tipo" name="tipo" value={filters.tipo} onChange={handleFilterChange} placeholder="Camioneta" />
                </div>
                <div className="filter-buttons">
                    <button type="submit" className="btn-filter-primary">Filtrar</button>
                    <button type="button" className="btn-filter-secondary" onClick={handleClearFilters}>Limpiar</button>
                </div>
            </form>

            <div className="vehicle-grid">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="vehicle-card-skeleton"></div>
                    ))
                ) : vehicles.length > 0 ? (
                    vehicles.map(vehicle => (
                        // Pasamos props isAdmin y onDelete
                        <VehicleCard 
                            key={vehicle.id} 
                            vehicle={vehicle} 
                            isAdmin={user?.admin}
                            onDelete={handleDeleteVehicle} 
                        />
                    ))
                ) : (
                    <p className="no-vehicles-message">{error ? 'Error al cargar. Intenta de nuevo.' : 'No se encontraron vehículos.'}</p>
                )}
            </div>
        </div>
    );
}

export default Vehicle;