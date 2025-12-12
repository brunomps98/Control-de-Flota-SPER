import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './SupportTickets.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// Inicialización de la librería de alertas SweetAlert2
const MySwal = withReactContent(Swal);

// Componente visual para el icono de filtro
const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 7.973 1.011a.75.75 0 0 1 .472.691l1.524 8.283a.75.75 0 0 1-.472.691A18.66 18.66 0 0 1 12 15c-2.755 0-5.455-.232-7.973-1.011a.75.75 0 0 1-.472-.691l-1.524-8.283a.75.75 0 0 1 .472-.691A18.66 18.66 0 0 1 12 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v5.25m0 0 3-3m-3 3-3-3" />
    </svg>
);

// Componente principal de Tickets de Soporte
const SupportTickets = ({ debounceDelay = 400 }) => {
    // Hooks de navegación y estado
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Estado inicial para los filtros de búsqueda
    const [filters, setFilters] = useState({
        name: '',
        surname: '',
        email: '',
        phone: ''
    });

    // Efecto para manejar el botón físico de "Atrás" en Android (Capacitor)
    useEffect(() => {
        // Si estamos en web, salimos
        if (Capacitor.getPlatform() === 'web') return;
        
        let backButtonListener;
        const setupListener = async () => {
            // Escuchamos el evento backButton y redirigimos a vehicle
            backButtonListener = await App.addListener('backButton', () => {
                navigate('/vehicle');
            });
        };
        setupListener();

        // Limpieza del listener al desmontar
        return () => {
            if (backButtonListener) {
                backButtonListener.remove();
            }
        };
    }, [navigate]);

    // Efecto para sincronizar el estado local de filtros con la URL
    useEffect(() => {
        setFilters({
            name: searchParams.get('name') || '',
            surname: searchParams.get('surname') || '',
            email: searchParams.get('email') || '',
            phone: searchParams.get('phone') || ''
        });
    }, [searchParams]);

    // Efecto principal para obtener los tickets desde el Backend
    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);
            setError(null);
            try {
                // Petición GET con los filtros actuales
                const response = await apiClient.get('/api/support-tickets', {
                    params: Object.fromEntries(searchParams)
                });
                setTickets(response.data.tickets || []);
            } catch (err) {
                // Manejo de errores en la carga
                setError(err.response?.data?.message || 'No se pudieron cargar los tickets.');
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, [searchParams]);

    // Efecto Debounce: actualiza la URL solo cuando el usuario deja de escribir
    useEffect(() => {
        const timer = setTimeout(() => {
            const query = {};
            let paramsChanged = false;
            
            // Compara filtros actuales con la URL para detectar cambios
            for (const key in filters) {
                const urlValue = searchParams.get(key) || '';
                if (filters[key] !== urlValue) {
                    paramsChanged = true;
                }
                if (filters[key]) {
                    query[key] = filters[key];
                }
            }
            // Actualiza los parámetros de búsqueda si hubo cambios
            if (paramsChanged || Object.keys(query).length === 0) {
                setSearchParams(query);
            }
        }, debounceDelay);
        
        return () => clearTimeout(timer);
    }, [filters, setSearchParams, searchParams, debounceDelay]);

    // Maneja los cambios en los inputs del formulario de filtro
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Aplica los filtros manualmente al enviar el formulario
    const handleFilterSubmit = (e) => {
        e.preventDefault();
        const query = {};
        for (const key in filters) {
            if (filters[key]) query[key] = filters[key];
        }
        setSearchParams(query);
    };

    // Resetea los filtros a su estado vacío
    const handleClearFilters = () => {
        setFilters({ name: '', surname: '', email: '', phone: '' });
    };

    // Función para eliminar un ticket con confirmación
    const handleDelete = (ticketId) => {
        MySwal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Petición delete al backend
                    await apiClient.delete(`/api/support/${ticketId}`);
                    // Actualiza el estado local eliminando el ticket
                    setTickets(prevTickets => prevTickets.filter(t => t.id !== ticketId));
                    MySwal.fire(
                        '¡Eliminado!',
                        'El ticket ha sido eliminado.',
                        'success'
                    );
                } catch (err) {
                    MySwal.fire(
                        'Error',
                        err.response?.data?.message || 'No se pudo eliminar el ticket.',
                        'error'
                    );
                }
            }
        });
    };

    return (
        <div className="login-page">
            <main>
                <div className="tickets-container">
                    {/* Encabezado y botón toggle para filtros móviles */}
                    <h1 id="information-title">Listado de Casos de Soporte</h1>
                    <button
                        className="btn-filter-toggle"
                        onClick={() => setIsFilterOpen(prev => !prev)}
                    >
                        <FilterIcon />
                        {isFilterOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </button>

                    {/* Contenedor del formulario de filtros */}
                    <form
                        className={`filter-container ${isFilterOpen ? 'filter-mobile-open' : ''}`}
                        onSubmit={handleFilterSubmit}
                    >
                        <h3 className="filter-title">Filtrar Casos</h3>
                        
                        <div className="filter-group">
                            <label htmlFor="name">Nombre:</label>
                            <input type="text" id="name" name="name" value={filters.name} onChange={handleFilterChange} placeholder="John" />
                        </div>

                        <div className="filter-group">
                            <label htmlFor="surname">Apellido:</label>
                            <input type="text" id="surname" name="surname" value={filters.surname} onChange={handleFilterChange} placeholder="Doe" />
                        </div>

                        <div className="filter-group">
                            <label htmlFor="email">Email:</label>
                            <input type="text" id="email" name="email" value={filters.email} onChange={handleFilterChange} placeholder="ejemplo@mail.com" />
                        </div>

                        <div className="filter-group">
                            <label htmlFor="phone">Teléfono:</label>
                            <input type="text" id="phone" name="phone" value={filters.phone} onChange={handleFilterChange} placeholder="343..." />
                        </div>

                        <div className="filter-buttons">
                            <button type="submit" className="btn-filter-primary">Filtrar</button>
                            <button type="button" className="btn-filter-secondary" onClick={handleClearFilters}>Limpiar</button>
                        </div>
                    </form>

                    {/* Renderizado condicional: Carga, Error o Lista */}
                    {loading && <p className="loading-message">Cargando tickets...</p>}
                    {error && <p className="error-message">Error: {error}</p>}

                    {!loading && !error && (
                        <>
                            {/* Verificación si hay tickets vacíos */}
                            {tickets.length === 0 ? (
                                <div className="no-tickets-message">
                                    <p>No se encontraron casos de soporte con esos filtros.</p>
                                </div>
                            ) : (
                                // Mapeo de la lista de tickets
                                tickets.map(ticket => (
                                    <div className="ticket-card" key={ticket.id}>
                                        <div className="ticket-header">
                                            <h2>{ticket.name} {ticket.surname}</h2>
                                        </div>
                                        <div className="ticket-body">
                                            <p><strong>Email:</strong> {ticket.email}</p>
                                            <p><strong>Teléfono:</strong> {ticket.phone}</p>
                                            <p><strong>Problema:</strong> {ticket.problem_description}</p>
                                        </div>
                                        <div className="ticket-actions">
                                            <Link to={`/case/${ticket.id}`} className="btn-action btn-view-case">Ver Caso Completo</Link>
                                            <button
                                                className="btn-action btn-delete-case"
                                                onClick={() => handleDelete(ticket.id)}
                                            >
                                                Eliminar Caso
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

export default SupportTickets;