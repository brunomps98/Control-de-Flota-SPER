import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './Support.css'; 
import logoSper from '../../assets/images/logo.png';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { toast } from 'react-toastify';

const Support = () => {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        email: '',
        phone: '',
        problem_description: '',
        files: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;
        const handleBackButton = () => navigate('/');
        const listenerPromise = App.addListener('backButton', handleBackButton);

        return () => {
            listenerPromise.then(listener => listener.remove());
        };
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: files ? files : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const hasFiles = formData.files && formData.files.length > 0;
        try {
            let response;
            if (hasFiles) {
                const dataToSend = new FormData();
                Object.keys(formData).forEach(key => {
                    if (key === 'files') {
                        for (let i = 0; i < formData.files.length; i++) {
                            dataToSend.append('files', formData.files[i]);
                        }
                    } else {
                        dataToSend.append(key, formData[key]);
                    }
                });
                response = await apiClient.post('/api/support', dataToSend);
            } else {
                const { files, ...textData } = formData;
                response = await apiClient.post('/api/support-no-files', textData);
            }
            toast.success(response.data.message);
            handleReset();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Hubo un error al enviar el caso.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        const initialFormData = {
            name: '', surname: '', email: '', phone: '',
            problem_description: '', files: null
        };
        setFormData(initialFormData);
        const fileInput = document.getElementById('exampleFile');
        if (fileInput) fileInput.value = '';
    };
    return (
        <div className="login-page">
            <main className="login-main">

                <div className="login-card support-card">
                    <img src={logoSper} alt="Logo SPER" className="login-logo" />
                    <h2 className="form-title">Soporte</h2>
                    <p className="form-subtitle">Complete el siguiente formulario para recibir ayuda.</p>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="exampleName" className="form-label">Nombre</label>
                            <input
                                type="text"
                                className="form-control"
                                id="exampleName"
                                name="name"
                                required
                                placeholder="Tu nombre"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="exampleSurname" className="form-label">Apellido</label>
                            <input
                                type="text"
                                className="form-control"
                                id="exampleSurname"
                                name="surname"
                                required
                                placeholder="Tu apellido"
                                value={formData.surname}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="exampleEmail" className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                id="exampleEmail"
                                name="email"
                                required
                                placeholder="tu@email.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="phone" className="form-label">Número de teléfono</label>
                            <input
                                type="tel"
                                className="form-control"
                                id="phone"
                                name="phone"
                                required
                                pattern="\d{10}"
                                title="Ingresa tu número de 10 dígitos sin espacios ni guiones (ej: 3435201155)"
                                placeholder="3431234567"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="exampleDescription" className="form-label">Descripción del Problema</label>
                            <textarea
                                className="form-control"
                                id="exampleDescription"
                                name="problem_description"
                                required
                                placeholder="Escriba detalladamente su problema acá..."
                                rows="4"
                                value={formData.problem_description}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="exampleFile" className="form-label">Capturas de pantalla (Opcional)</label>
                            <input
                                type="file"
                                className="form-control"
                                id="exampleFile"
                                name="files"
                                multiple
                                accept="image/*"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="button-container">
                            <button className="login-submit-btn" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Enviando...' : 'Enviar Caso'}
                            </button>
                            <button className="login-secondary-btn" type="button" onClick={handleReset}>
                                Limpiar Campos
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <footer className="footer-bar">
                <p>© 2025 SPER - Departamento de Seguridad Informática</p>
            </footer>
        </div>
    );
}

export default Support;