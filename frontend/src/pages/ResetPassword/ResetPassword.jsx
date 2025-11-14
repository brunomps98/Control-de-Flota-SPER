import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import logoSper from '../../assets/images/logo.png';
import '../../pages/login/login.css'; 

// --- Iconos de Ojo ( ---
const EyeOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 10.224 7.29 6.332 12 6.332c4.71 0 8.577 3.892 9.964 5.351a1.012 1.012 0 0 1 0 .639C20.577 13.776 16.71 17.668 12 17.668c-4.71 0-8.577-3.892-9.964-5.351Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);
const EyeClosedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 14.302 6.096 17.668 12 17.668c1.7 0 3.297-.272 4.77-.748l-1.02-1.02A3 3 0 0 0 12 15a3 3 0 0 0-2.036.78l-1.4-1.4A5.967 5.967 0 0 1 12 9c.773 0 1.503.168 2.167.46l-1.12 1.12A3.003 3.003 0 0 0 12 10.5a3 3 0 0 0-.25.031l-1.42 1.42A5.96 5.96 0 0 1 3.98 8.223Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.225 10.225c.53.53.948 1.19 1.225 1.937M17.25 10.5c.09.43.146.874.146 1.328 0 1.5-.432 2.87-1.16 4.028m-1.742 1.742A9.01 9.01 0 0 1 12 17.668c-5.904 0-9.226-3.72-9.964-5.351.48-1.02.99-1.98 1.57-2.868m4.314-1.921A9.009 9.009 0 0 1 12 6.332c4.71 0 8.577 3.892 9.964 5.351.041.052.082.103.123.154l-3.32 3.32m-3.98-3.98-.4-1.292" />
    </svg>
);

const ResetPassword = () => {
    const { token } = useParams(); // Obtiene el token de la URL
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            const errorMsg = 'Las contraseñas no coinciden.';
            setError(errorMsg);
            toast.error(errorMsg);
            return;
        }

        setIsLoading(true);

        try {
            // Llamamos al endpoint del backend que creamos
            const response = await apiClient.post('/api/reset-password', { 
                token: token, 
                newPassword: password 
            });
            
            setMessage(response.data.message);
            toast.success(response.data.message);
            setPassword('');
            setConfirmPassword('');
            
            // Redirigir al login después de 3 segundos
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (error) {
            console.error("Error al restablecer contraseña:", error);
            const errorMsg = error.response?.data?.message || 'Error interno del servidor.';
            setError(errorMsg);
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
                    
                    <h2 className="form-title">Nueva Contraseña</h2>
                    <p className="form-subtitle">Ingresa tu nueva contraseña segura.</p>

                    <form onSubmit={handleSubmit} className="login-form">
                        
                        {/* Si el reseteo fue exitoso, mostramos el mensaje */}
                        {message ? (
                            <div className="alert alert-success" role="alert">
                                {message}
                            </div>
                        ) : (
                            <>
                                <div className="mb-3">
                                    <label htmlFor="passwordInput" className="form-label">Nueva Contraseña</label>
                                    <div className="input-wrapper">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="form-control"
                                            id="passwordInput"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button 
                                            type="button" 
                                            className="password-toggle-btn" 
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                                        </button>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="confirmPasswordInput" className="form-label">Confirmar Contraseña</label>
                                    <div className="input-wrapper">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="form-control"
                                            id="confirmPasswordInput"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="login-submit-btn" disabled={isLoading}>
                                    {isLoading ? 'Actualizando...' : 'Guardar Contraseña'}
                                </button>
                            </>
                        )}
                        
                        {/* Mostramos errores si los hay */}
                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}

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

export default ResetPassword;