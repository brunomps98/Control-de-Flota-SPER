import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import './Register.css'; 
import logoSper from '../../assets/images/logo.png';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import apiClient from '../../api/axiosConfig'; 
import { toast } from 'react-toastify'; 

const Register = () => {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        username: '',
        unidad: '',
        email: '',
        passw: ''
    });
    const [error, setError] = useState('');

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
                        <div className="mb-3">
                            <label htmlFor="exampleInputPassword1" className="form-label">Contraseña</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                id="exampleInputPassword1" 
                                name="passw"
                                value={formData.passw}
                                onChange={handleChange}
                                required 
                            />
                        </div>
                        
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

            <footer className="footer-bar">
                <p>© 2025 SPER - Departamento de Seguridad Informática</p>
            </footer>
        </div>
    );
}

export default Register;