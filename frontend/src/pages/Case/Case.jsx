import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './Case.css'; 
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import MySwal from '../../utils/swal';

const Case = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate(); 
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


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
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#009688',
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

    return (
        <div className="page-full-dark">

            <main className="main-content-dark">
                
                {loading && (
                    <p className="loading-message">Cargando detalles del caso...</p>
                )}
                {error && !ticket && (
                    <p className="error-message">Error: {error}</p>
                )}
                {!loading && !ticket && !error && (
                     <p className="error-message">No se encontró el ticket.</p>
                )}

                {ticket && (
                    <div className="case-container"> 
                        {error && <p className="error-message" style={{marginBottom: '15px'}}>Error: {error}</p>}

                        <h1>Detalle del Caso de Soporte</h1>
                        <div className="ticket-header">
                            <h2>Reportado por: {ticket.name} {ticket.surname}</h2>
                        </div>
                        <div className="case-details">
                            <p><strong>Email de Contacto:</strong> {ticket.email}</p>
                            <p><strong>Teléfono de Contacto:</strong> {ticket.phone}</p>
                            <hr />
                            <h3>Descripción del Problema Reportado:</h3>
                            <p>{ticket.problem_description}</p>
                        </div>
                        <hr />
                        
                        {ticket.archivos && ticket.archivos.length > 0 && (
                            <div className="image-gallery-section">
                                <h3>Imágenes Adjuntas:</h3>
                                <div className="image-gallery">
                                    {ticket.archivos.map((fileObj) => (
                                        <a href={fileObj.url_archivo} target="_blank" rel="noopener noreferrer" key={fileObj.id}>
                                            <img
                                                src={fileObj.url_archivo} 
                                                alt={`Imagen del caso ${fileObj.id}`}
                                            />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="ticket-actions">
                            <Link to="/support-tickets" className="btn-action btn-view-case">Volver a la Lista</Link>
                            <button className="btn-action btn-delete-case" onClick={handleDelete}>
                                Eliminar Caso
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Case;