import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import apiClient from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import logoSper from '../../assets/images/logo.png';
import '../../pages/Login/Login.css';

{/* Montamos el componente principal (de olvido de contraseña) */ }
const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // UseEffect de Capacitor
    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;
        const handleBackButton = () => navigate('/login');
        const listener = App.addListener('backButton', handleBackButton);
        return () => listener.remove();
    }, [navigate]);

    // Función para manejar el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            // Llamamos al endpoint del backend
            const response = await apiClient.post('/api/forgot-password', { email });

            // Mostramos el mensaje genérico de éxito
            setMessage(response.data.message);
            toast.success(response.data.message);
            setEmail('');
            // Mensaje de errores
        } catch (error) {
            console.error("Error al solicitar reseteo:", error);
            const errorMsg = error.response?.data?.message || 'Error interno del servidor.';
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <main className="login-main">
                <div className="login-card">
                    <img src={logoSper} alt="Logo SPER" className="login-logo" />
                    {/* Título y subtitulo del formulario */}
                    <h2 className="form-title">Restablecer Contraseña</h2>
                    <p className="form-subtitle">Ingresa tu email y te enviaremos un enlace de recuperación.</p>

                    <form onSubmit={handleSubmit} className="login-form">

                        {/* Si ya se envió, mostramos el mensaje de exito */}
                        {message ? (
                            <div className="alert alert-success" role="alert">
                                {message}
                            </div>
                        ) : (
                            <>
                                {/* Campo para el email */}
                                <div className="mb-3">
                                    <label htmlFor="emailInput" className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="emailInput"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                {/* Boton para enviar mensaje y mensaje de enviando */}
                                <button type="submit" className="login-submit-btn" disabled={isLoading}>
                                    {isLoading ? 'Enviando...' : 'Enviar Enlace'}
                                </button>
                            </>
                        )}
                        {/* Botón que redirige al login */}
                        <div className="forgot-password-link-container">
                            <Link to="/login" className="forgot-password-link">
                                Volver a Iniciar Sesión
                            </Link>
                        </div>

                    </form>
                </div>
            </main>
            <footer className="footer-bar">
                <p>© 2025 SPER - Departamento de Seguridad Informática</p>
            </footer>
        </div>
    );
};

export default ForgotPassword;