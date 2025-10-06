import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../../api/axiosConfig';
import './Case.css';
import logoSper from '../../assets/images/logo.png';

const Case = () => {
    // --- ESTADOS Y HOOKS 
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- CARGA DE DATOS CON AXIOS ---
    useEffect(() => {
        const fetchTicket = async () => {
            try {
                // 2. Usamos apiClient.get para cargar los datos del ticket.
                const response = await apiClient.get(`/api/support/${ticketId}`);
                // En Axios, los datos ya vienen en formato JSON dentro de `response.data`
                setTicket(response.data.ticket);
            } catch (err) {
                // 3. Mejoramos el manejo de errores con la información que provee Axios.
                setError(err.response?.data?.message || 'No se pudo encontrar el caso de soporte.');
            } finally {
                setLoading(false);
            }
        };

        fetchTicket();
    }, [ticketId]);

    // --- FUNCIÓN DE ELIMINAR CON AXIOS ---
    const handleDelete = async () => {
        if (window.confirm('¿Estás seguro de que querés eliminar este caso? Esta acción no se puede deshacer.')) {
            try {
                // 4. Usamos apiClient.delete para la petición de borrado.
                await apiClient.delete(`/api/support/${ticketId}`);
                // Si la petición es exitosa, navegamos a la página de tickets.
                navigate('/support-tickets');
            } catch (err) {
                setError(err.response?.data?.message || 'No se pudo eliminar el ticket.');
            }
        }
    };

    // --- RENDERIZADO
    if (loading) {
        return <p>Cargando detalles del caso...</p>;
    }
    if (error) {
        return <p style={{ color: 'red' }}>Error: {error}</p>;
    }
    if (!ticket) {
        return <p>No se encontró el ticket.</p>;
    }

    return (
        <div className="page-container">
            <header className="top-bar-support">
                <Link to="/">
                    <div className="top-bar-left-support">
                        <div className="logo-support">
                            <img src={logoSper} alt="Logo Sper" width="60" height="60" />
                        </div>
                        <div className="title-support">
                            <h1>SPER</h1>
                        </div>
                    </div>
                </Link>
            </header>

            <main className="main-case-view">
                <div className="case-container">
                    <h1>Detalle del Caso de Soporte</h1>
                    <div className="ticket-header">
                        <h2>Reportado por: {ticket.name} {ticket.surname}</h2>
                    </div>
                    <div className="case-details">
                        <p><strong>Email de Contacto:</strong> {ticket.email}</p>
                        <p><strong>Teléfono de Contacto:</strong> {ticket.phone}</p>
                        <hr style={{ margin: '20px 0' }} />
                        <h3>Descripción del Problema Reportado:</h3>
                        <p>{ticket.problem_description}</p>
                    </div>
                    <hr style={{ margin: '20px 0' }} />
                    {ticket.files && ticket.files.length > 0 && (
                        <>
                            <h3>Imágenes Adjuntas:</h3>
                            <div className="image-gallery" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
                                {ticket.files.map((file, index) => (
                                    <a href={`${import.meta.env.VITE_API_URL}/uploads/support/${file}`} target="_blank" rel="noopener noreferrer" key={index}>
                                        <img
                                            src={`${import.meta.env.VITE_API_URL}/uploads/support/${file}`}
                                            alt={`Imagen del caso ${index + 1}`}
                                            style={{ maxWidth: '200px', borderRadius: '5px', border: '1px solid #ddd' }}
                                        />
                                    </a>
                                ))}
                            </div>
                        </>
                    )}
                    <div className="ticket-actions">
                        <Link to="/support-tickets" className="btn-action btn-view-case">Volver a la Lista</Link>
                        <button className="btn-action btn-delete-case" onClick={handleDelete}>
                            Eliminar Caso
                        </button>
                    </div>
                </div>
            </main>

            <footer className="footer-bar">
                <p>© 2025 SPER - Departamento de Seguridad Informática</p>
            </footer>
        </div>
    );
}

export default Case;