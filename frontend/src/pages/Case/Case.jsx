import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './Case.css';
import logoSper from '../../assets/images/logo.png';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const Case = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate(); 
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const apiBaseURL = apiClient.defaults.baseURL;

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const response = await apiClient.get(`/api/support/${ticketId}`);
                setTicket(response.data.ticket);
            } catch (err) {
                if (!ticket) {
                     setError(err.response?.data?.message || 'No se pudo encontrar el caso de soporte.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchTicket();
    }, [ticketId]);

    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;
        const handleBackButton = () => navigate('/support-tickets');
        const listener = App.addListener('backButton', handleBackButton);
        return () => listener.remove();
    }, [navigate]); 

    const handleDelete = () => {
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
                setError(null);
                try {
                    await apiClient.delete(`/api/support/${ticketId}`);
                    MySwal.fire(
                        '¡Eliminado!',
                        'El caso de soporte ha sido eliminado.',
                        'success'
                    ).then(() => {
                         navigate('/support-tickets');
                    });
                } catch (err) {
                    const errorMessage = err.response?.data?.message || 'No se pudo eliminar el ticket.';
                    setError(errorMessage);
                    MySwal.fire('Error', `No se pudo eliminar el ticket: ${errorMessage}`, 'error');
                }
            }
        });
    };

    // --- RENDERIZADO ---
    if (loading) {
        return <p>Cargando detalles del caso...</p>;
    }
    if (error && !ticket) { 
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
                    {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>Error: {error}</p>}

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

                    
                    {/* 1. Usamos 'ticket.archivos' (el alias de Sequelize) */}
                    {ticket.archivos && ticket.archivos.length > 0 && (
                        <>
                            <h3>Imágenes Adjuntas:</h3>
                            <div className="image-gallery" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
                                {/* 2. Mapeamos 'archivos', 'fileObj' es un objeto */}
                                {ticket.archivos.map((fileObj) => (
                                    // 3. Usamos 'fileObj.url_archivo'
                                    <a href={`${apiBaseURL}/uploads/${fileObj.url_archivo}`} target="_blank" rel="noopener noreferrer" key={fileObj.id}> {/* 4. Usamos 'fileObj.id' como key */}
                                        <img
                                            src={`${apiBaseURL}/uploads/${fileObj.url_archivo}`} 
                                            alt={`Imagen del caso ${fileObj.id}`}
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