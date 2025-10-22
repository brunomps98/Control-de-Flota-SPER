import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import apiClient from '../../api/axiosConfig';
import './SupportTickets.css';
import logoSper from '../../assets/images/logo.png';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// Initialize SweetAlert for React
const MySwal = withReactContent(Swal);

const SupportTickets = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Estado para errores de carga o eliminación

    // --- LÓGICA DEL BOTÓN ATRÁS ---
    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;

        const handleBackButton = () => {
            navigate('/support');
        };

        const listener = App.addListener('backButton', handleBackButton);

        return () => {
            listener.remove();
        };
    }, [navigate]); 


    // --- CARGA DE DATOS CON AXIOS ---
    useEffect(() => {
        const fetchTickets = async () => {
            // Limpiamos errores previos al cargar
            setError(null);
            try {
                const response = await apiClient.get('/api/support-tickets');
                setTickets(response.data.tickets || []);
            } catch (err) {
                setError(err.response?.data?.message || 'No se pudieron cargar los tickets.');
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    // --- FUNCIÓN DE ELIMINAR CON SWEETALERT Y AXIOS ---
    const handleDelete = (ticketId) => {
        MySwal.fire({
            title: '¿Estás seguro?',
            text: "¡Vas a eliminar este caso de soporte!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Limpiamos errores previos
                setError(null);
                try {
                    await apiClient.delete(`/api/support/${ticketId}`);
                    // Actualizamos el estado local para quitar el ticket
                    setTickets(prevTickets => prevTickets.filter(ticket => ticket._id !== ticketId));
                    // Mostramos éxito
                    MySwal.fire(
                        '¡Eliminado!',
                        'El caso de soporte ha sido eliminado.',
                        'success'
                    );
                } catch (err) {
                    // Guardamos el error para mostrarlo
                    const errorMessage = err.response?.data?.message || 'No se pudo eliminar el ticket.';
                    setError(errorMessage);
                    MySwal.fire(
                        'Error',
                        `No se pudo eliminar el ticket: ${errorMessage}`,
                        'error'
                    );
                }
            }
        });
    };
    
    // --- RENDERIZADO ---
    return (
        <div className="page-container">
            <header className="top-bar-support">
                <div className="top-bar-left-support">
                    <div className="logo-support">
                        <Link to="/">
                            <img src={logoSper} alt="Logo Sper" width="60" height="60" />
                        </Link>
                    </div>
                    <div className="title-support">
                        <h1>SPER</h1>
                    </div>
                </div>
            </header>

            <main>
                <div className="tickets-container">
                    <h1 id="information-title">Listado de Casos de Soporte</h1>

                    {loading && <p>Cargando tickets...</p>}
                    {/* Mostramos el error si existe */}
                    {error && <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>}

                    {!loading && !error && ( // Solo renderiza si no hay loading NI error de carga inicial
                        <>
                            {tickets.length === 0 ? (
                                <div className="no-tickets-message">
                                    <p>Aún no hay casos de soporte para mostrar.</p>
                                    <p>Puedes crear uno nuevo desde la sección de Soporte.</p>
                                </div>
                            ) : (
                                tickets.map(ticket => (
                                    <div className="ticket-card" key={ticket._id}>
                                        <div className="ticket-header">
                                            <h2>{ticket.name} {ticket.surname}</h2>
                                        </div>
                                        <div className="ticket-body">
                                            <p><strong>Email:</strong> {ticket.email}</p>
                                            <p><strong>Teléfono:</strong> {ticket.phone}</p>
                                            <p><strong>Problema:</strong> {ticket.problem_description}</p>
                                        </div>
                                        <div className="ticket-actions">
                                            <Link to={`/case/${ticket._id}`} className="btn-action btn-view-case">Ver Caso Completo</Link>
                                            <button
                                                className="btn-action btn-delete-case delete-case-btn"
                                                onClick={() => handleDelete(ticket._id)}
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

            <footer className="footer-bar">
                <p>© 2025 SPER - Departamento de Seguridad Informática</p>
            </footer>
        </div>
    );
}

export default SupportTickets;