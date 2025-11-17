import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import './Register.css'; 
import logoSper from '../../assets/images/logo.png';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import apiClient from '../../api/axiosConfig'; 
import { toast } from 'react-toastify'; 

// --- 1. AÑADIR COMPONENTES DE ÍCONOS ---
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
// --- FIN DE ÍCONOS ---

const Register = () => {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        username: '',
        unidad: '',
        email: '',
        passw: ''
    });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false); // <-- 2. AÑADIR ESTADO

    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;
        const handleBackButton = () => {
            navigate('/vehicle'); 
        };
        const listener = App.addListener('backButton', handleBackButton);
        return () => {
            listener.remove();
        };
    }, [navigate]); 

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setError(''); 
        if (!formData.username || !formData.email || !formData.passw || !formData.unidad) {
            const errorMsg = 'Por favor, completá todos los campos obligatorios.';
            setError(errorMsg);
            toast.error(errorMsg); 
            return; 
        }
        try {
            const response = await apiClient.post('/api/register', formData);
            toast.success(response.data.message || '¡Usuario registrado con éxito!');
            setFormData({ username: '', unidad: '', email: '', passw: '' });
        } catch (err) {
            if (err.response?.status === 409) {
                const errorMsg = 'El email o nombre de usuario ya existe.';
                setError(errorMsg);
                toast.error(errorMsg);
            } else {
                const errorMsg = err.response?.data?.message || 'Error al registrar el usuario.';
                setError(errorMsg);
                toast.error(errorMsg);
            }
        }
    };

    return (
        <div className="login-page"> 
            
            <main className="login-main">
                
                <div className="login-card">
                    <img src={logoSper} alt="Logo SPER" className="login-logo" />

                    <h2 className="form-title">Registrar Nuevo Usuario</h2>
                    <p className="form-subtitle">Crear una cuenta para un nuevo agente.</p>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="exampleInputUsername" className="form-label">Nombre de usuario</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                id="exampleInputUsername" 
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required 
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="exampleInputUnidad" className="form-label">Unidad</label>
                            <select 
                                className="form-control" 
                                id="exampleInputUnidad" 
                                name="unidad"
                                value={formData.unidad}
                                onChange={handleChange}
                                required
                            >
                                <option value="">-- Seleccione una Unidad --</option>
                                <option value="Direccion General">Dirección General</option>
                                <option value="Unidad Penal 1">Unidad Penal 1</option>
                                <option value="Unidad Penal 3">Unidad Penal 3</option>
                                <option value="Unidad Penal 4">Unidad Penal 4</option>
                                <option value="Unidad Penal 5">Unidad Penal 5</option>
                                <option value="Unidad Penal 6">Unidad Penal 6</option>
                                <option value="Unidad Penal 7">Unidad Penal 7</option>
                                <option value="Unidad Penal 8">Unidad Penal 8</option>
                                <option value="Unidad Penal 9">Unidad Penal 9</option>
                                <option value="Instituto">Instituto</option>
                                <option value="Tratamiento">Tratamiento</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="exampleInputEmail1" className="form-label">Email</label>
                            <input 
                                type="email" 
                                className="form-control" 
                                id="exampleInputEmail1" 
                                aria-describedby="emailHelp" 
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required 
                            />
                            <div id="emailHelp" className="form-text">El email no será compartido.</div>
                        </div>

                        {/* --- 3. MODIFICAR DIV DE CONTRASEÑA --- */}
                        <div className="mb-3">
                            <label htmlFor="exampleInputPassword1" className="form-label">Contraseña</label>
                            <div className="input-wrapper">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    className="form-control" 
                                    id="exampleInputPassword1" 
                                    name="passw"
                                    value={formData.passw}
                                    onChange={handleChange}
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
                        {/* --- FIN DE MODIFICACIÓN --- */}

                        <div className="button-container">
                            <button type="submit" className="login-submit-btn">Registrar Usuario</button> 
                        </div>
                    </form>
                    
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default Register;