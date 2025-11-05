import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './login.css';
import logoSper from '../../assets/images/logo.png'; 
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { toast } from 'react-toastify'; 

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;
        const handleBackButton = () => navigate('/');
        const addListenerAsync = async () => {
            await App.addListener('backButton', handleBackButton);
        };
        addListenerAsync();
        return () => {
        };
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await apiClient.post('/api/login', { username, password });
            const { user, token } = response.data;
            localStorage.setItem('token', token);
            const destinationPath = '/vehicle';
            navigate(destinationPath, { state: { username: user.username } });
        } catch (err) {
            console.error("Login Error:", err);
            toast.error(err.response?.data?.message || 'Error al iniciar sesión');
        }
    };

    return (
        <div className="login-page">
            <main className="login-main">
                <div className="login-card">
                    <img src={logoSper} alt="Logo SPER" className="login-logo" />
                    
                    <h2 className="form-title">Iniciar sesión</h2>
                    <p className="form-subtitle">Bienvenido, por favor ingresa tus datos.</p>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="mb-3">
                            <label htmlFor="usernameInput" className="form-label">Usuario</label>
                            <input
                                type="text"
                                className="form-control"
                                id="usernameInput"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="passwordInput" className="form-label">Contraseña</label>
                            <input
                                type="password"
                                className="form-control"
                                id="passwordInput"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="login-submit-btn">
                            Iniciar sesión
                        </button>
                    </form>
                </div>
            </main>

            <footer className="footer-bar">
                <p>© 2025 SPER - Departamento de Seguridad Informática</p>
            </footer>
        </div>
    );
};

export default Login;