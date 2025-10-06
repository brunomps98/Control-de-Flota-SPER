import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../../api/axiosConfig';
import './SupportTickets.css';
import logoSper from '../../assets/images/logo.png';

const SupportTickets = () => {
    // --- ESTADOS ---
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- CARGA DE DATOS CON AXIOS ---
    useEffect(() => {
        const fetchTickets = async () => {
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

    // --- FUNCIÓN DE ELIMINAR CON AXIOS ---
    const handleDelete = async (ticketId) => {
        if (!window.confirm('¿Estás seguro de que querés eliminar este caso?')) {
            return;
        }
        try {
            await apiClient.delete(`/api/support/${ticketId}`);
            
            setTickets(prevTickets => prevTickets.filter(ticket => ticket._id !== ticketId));
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo eliminar el ticket.');
        }
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
                    {error && <p style={{ color: 'red' }}>Error: {error}</p>}

                    {!loading && !error && (
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