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
            navigate('/');
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

    // --- 3. handleSubmit  ---
    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setError(''); 

        if (!formData.username || !formData.email || !formData.passw || !formData.unidad) {
            const errorMsg = 'Por favor, completá todos los campos obligatorios.';
            setError(errorMsg);
            toast.error(errorMsg); // Mostrar toast de error
            return; 
        }

        try {
            // 4. ENVIAR DATOS AL BACKEND
            const response = await apiClient.post('/api/register', formData);

            // 5. MOSTRAR ÉXITO Y REDIRIGIR
            toast.success(response.data.message || '¡Usuario registrado con éxito!');
            
            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            // 6. MANEJADOR DE ERRORES DEL BACKEND
            const errorMsg = err.response?.data?.message || 'Error al registrar el usuario.';
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    return (
        <div className="register-page-container">
            <div className="banner-productos">
                <div className="navbar-r">
                    <img src={logoSper} alt="Logo SPER" className="logo-r"/>
                </div>
            </div>

            <main>
                <div className="container register">
                    <div className="title-r">
                        <h1>Registro</h1>
                    </div>
                    
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
                            <input 
                                type="text" 
                                className="form-control" 
                                id="exampleInputUnidad" 
                                name="unidad"
                                value={formData.unidad}
                                onChange={handleChange}
                                required 
                            />
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
                            <div id="emailHelp" className="form-text">Nunca compartiremos su correo electrónico con nadie más.</div>
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

                        <div className="text-center">
                            <button type="submit" className="btn btn-primary">Registrarse</button> 
                        </div>
                    </form>

                    {/* Este 'error' ahora solo muestra errores de validación o del servidor */}
                    {error && (
                        <div className="alert alert-danger mt-3" role="alert">
                            {error}
                        </div>
                    )}
                </div>
            </main>

            <div>
                <footer className="footer-bar">
                    <p>© 2025 SPER - Departamento de Seguridad Informática</p>
                </footer>
            </div>
        </div>
    );
}

export default Register;