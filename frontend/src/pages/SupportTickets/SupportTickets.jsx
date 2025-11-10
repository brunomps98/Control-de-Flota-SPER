import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import apiClient from '../../api/axiosConfig';
import './SupportTickets.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const SupportTickets = () => {
    const navigate = useNavigate();
    
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;
        const handleBackButton = () => navigate('/support');
        const listener = App.addListener('backButton', handleBackButton);
        return () => listener.remove();
    }, [navigate]); 

    useEffect(() => {
        const fetchTickets = async () => {
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

    const handleDelete = (ticketId) => {
        MySwal.fire({
            title: '¿Estás seguro?',
            text: "¡Vas a eliminar este caso de soporte!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545', 
            cancelButtonColor: '#009688', 
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                setError(null);
                try {
                    await apiClient.delete(`/api/support/${ticketId}`);
                    setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== ticketId));
                    MySwal.fire('¡Eliminado!', 'El caso de soporte ha sido eliminado.', 'success');
                } catch (err) {
                    const errorMessage = err.response?.data?.message || 'No se pudo eliminar el ticket.';
                    MySwal.fire('Error', `No se pudo eliminar el ticket: ${errorMessage}`, 'error');
                }
            }
        });
    };

    
    return (
        <div className="login-page">
            

            <main>
                <div className="tickets-container">
                    <h1 id="information-title">Listado de Casos de Soporte</h1>

                    {loading && <p className="loading-message">Cargando tickets...</p>}
                    {error && <p className="error-message">Error: {error}</p>}

                    {!loading && !error && (
                        <>
                            {tickets.length === 0 ? (
                                <div className="no-tickets-message">
                                    <p>Aún no hay casos de soporte para mostrar.</p>
                                    <p>Puedes crear uno nuevo desde la sección de Soporte.</p>
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