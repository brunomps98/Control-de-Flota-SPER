import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import './Register.css';
import logoSper from '../../assets/images/logo.png';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const Register = () => {
    // 4. Inicializa useNavigate
    const navigate = useNavigate();

    // 1. Estado para guardar los datos de todos los inputs
    const [formData, setFormData] = useState({
        username: '',
        unidad: '',
        email: '',
        passw: ''
    });

    // Estado para manejar los mensajes de error
    const [error, setError] = useState('');

    // --- 5. LÓGICA DEL BOTÓN ATRÁS ---
    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;

        // Regla: En Register, volver a Home ('/')
        const handleBackButton = () => {
            navigate('/');
        };

        const listener = App.addListener('backButton', handleBackButton);

        return () => {
            listener.remove();
        };
    }, [navigate]); 

    // 2. Función genérica que actualiza el estado cuando escribís en cualquier input
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // 3. Función que se ejecuta al presionar el botón de submit
    const handleSubmit = (e) => {
        e.preventDefault(); 
        setError(''); 

        // Validación simple de ejemplo
        if (!formData.username || !formData.email || !formData.passw) {
            setError('Por favor, completá todos los campos obligatorios.');
            return; // Detiene la ejecución si hay un error
        }

        console.log('Datos a enviar al backend:', formData);

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
                            />
                        </div>

                        <div className="text-center">
                            <button type="submit" className="btn btn-primary">Registrarse</button> 
                        </div>
                    </form>

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