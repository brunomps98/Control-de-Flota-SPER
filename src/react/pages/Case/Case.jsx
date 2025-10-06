import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './Case.css';
import logoSper from '../../assets/images/logo.png';

const Case = () => {
    // 1. OBTENCIÓN DE DATOS
    const { ticketId } = useParams();
    const navigate = useNavigate();

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                // 👇 Lógica de fetch corregida
                const apiUrl = `${import.meta.env.VITE_API_URL}/api/support/${ticketId}`;
                const response = await fetch(apiUrl, { credentials: 'include' });

                if (!response.ok) {
                    throw new Error('No se pudo encontrar el caso de soporte.');
                }
                const data = await response.json();
                setTicket(data.ticket);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTicket();
    }, [ticketId]);

    // 3. FUNCIONALIDAD DE BOTONES
    const handleDelete = async () => {
        if (window.confirm('¿Estás seguro de que querés eliminar este caso? Esta acción no se puede deshacer.')) {
            try {
                // 👇 Lógica de fetch corregida (y se añadió /api a la URL)
                const apiUrl = `${import.meta.env.VITE_API_URL}/api/support/${ticketId}`;
                const response = await fetch(apiUrl, {
                    method: 'DELETE',
                    credentials: 'include' // Importante para la autorización
                });

                if (!response.ok) {
                    throw new Error('No se pudo eliminar el ticket.');
                }

                navigate('/support-tickets');
            } catch (err) {
                setError(err.message);
            }
        }
    };

    // --- RENDERIZADO CONDICIONAL ---
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
                                    <a href={`/uploads/${file}`} target="_blank" rel="noopener noreferrer" key={index}>
                                        <img
                                            src={`/uploads/${file}`}
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