import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './SupportTickets.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 7.973 1.011a.75.75 0 0 1 .472.691l1.524 8.283a.75.75 0 0 1-.472.691A18.66 18.66 0 0 1 12 15c-2.755 0-5.455-.232-7.973-1.011a.75.75 0 0 1-.472-.691l-1.524-8.283a.75.75 0 0 1 .472-.691A18.66 18.66 0 0 1 12 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v5.25m0 0 3-3m-3 3-3-3" />
    </svg>
);

// CAMBIO 1: Recibimos debounceDelay como prop con valor por defecto 400
const SupportTickets = ({ debounceDelay = 400 }) => {
    const navigate = useNavigate();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        name: '',
        surname: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        // Si es web, no hacemos nada
        if (Capacitor.getPlatform() === 'web') return;

        let backButtonListener;

        const setupListener = async () => {
            // addListener es asíncrono, esperamos a que nos de el handler
            backButtonListener = await App.addListener('backButton', () => {
                navigate('/vehicle');
            });
        };

        setupListener();

        // Cleanup function
        return () => {
            // Verificamos si el listener fue creado antes de intentar removerlo
            if (backButtonListener) {
                backButtonListener.remove();
            }
        };
    }, [navigate]);

    useEffect(() => {
        setFilters({
            name: searchParams.get('name') || '',
            surname: searchParams.get('surname') || '',
            email: searchParams.get('email') || '',
            phone: searchParams.get('phone') || ''
        });
    }, [searchParams]);

    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.get('/api/support-tickets', {
                    params: Object.fromEntries(searchParams)
                });
                setTickets(response.data.tickets || []);
            } catch (err) {
                setError(err.response?.data?.message || 'No se pudieron cargar los tickets.');
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, [searchParams]);

    // CAMBIO 2: Usamos debounceDelay en el setTimeout
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
        }, debounceDelay); // <--- Aquí usamos la prop
        return () => clearTimeout(timer);
    }, [filters, setSearchParams, searchParams, debounceDelay]); // Agregamos debounceDelay a dependencias

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
        setFilters({ name: '', surname: '', email: '', phone: '' });
    };

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
                    await apiClient.delete(`/api/support/${ticketId}`);
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
                    <h1 id="information-title">Listado de Casos de Soporte</h1>

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


                    {loading && <p className="loading-message">Cargando tickets...</p>}
                    {error && <p className="error-message">Error: {error}</p>}

                    {!loading && !error && (
                        <>
                            {tickets.length === 0 ? (
                                <div className="no-tickets-message">
                                    <p>No se encontraron casos de soporte con esos filtros.</p>
                                </div>
                            ) : (
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