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

        const addListenerAsync = async () => {
            await App.addListener('backButton', handleBackButton);
        };
        addListenerAsync();

        return () => {
        };
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: files ? files : value
        }));
    };

    // --- handleSubmit CON TOAST ---
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

            // --- 3. MOSTRAR ÉXITO CON TOAST ---
            toast.success(response.data.message);
            handleReset(); // Limpia el formulario

        } catch (error) {
            // --- 4. MOSTRAR ERROR CON TOAST ---
            toast.error(error.response?.data?.message || 'Hubo un error al enviar el caso.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- handleReset ---
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
        <>
            <header className="top-bar-support">
                 <div className="top-bar-left-support">
                    <div className="logo-support">
                        <Link to="/">
                            <img src={logoSper} alt="Logo Sper" width="60" height="60" />
                        </Link>
                    </div>
                    <div className="title-support">
                        <h1>SPER</h1>
                    </div>
                </div>
            </header>

            <main>
                 <div className="support-actions-container">
                    <Link to="/support-tickets" className="btn-view-tickets-alt">
                        Ver Lista de Casos de Soporte
                    </Link>
                </div>

                <div className="support-title">
                    <h1>Soporte</h1>
                    <p>Complete el siguiente formulario para recibir ayuda</p>
                </div>

                <section>
                    <form onSubmit={handleSubmit}>
                         <div className="mb-32">
                            <label htmlFor="exampleName" className="form-support">Nombre</label>
                            <input
                                type="text"
                                className="form-control"
                                id="exampleName"
                                name="name"
                                required
                                placeholder="Nombre del solicitante"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-32">
                            <label htmlFor="exampleSurname" className="form-support">Apellido</label>
                            <input
                                type="text"
                                className="form-control"
                                id="exampleSurname"
                                name="surname"
                                required
                                placeholder="Apellido del solicitante"
                                value={formData.surname}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-32">
                            <label htmlFor="exampleEmail" className="form-support">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                id="exampleEmail"
                                name="email"
                                required
                                placeholder="Dirección de email del solicitante"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-32">
                            <label htmlFor="phone" className="form-support">Número de teléfono</label>
                            <input
                                type="tel"
                                className="form-control"
                                id="phone"
                                name="phone"
                                required
                                pattern="\d{10}"
                                title="Ingresa tu número de 10 dígitos sin espacios ni guiones (ej: 3435201155)"
                                placeholder="Numero de telefono del solicitante"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-32">
                            <label htmlFor="exampleDescription" className="form-support">Descripción del Problema</label>
                            <textarea
                                className="form-control"
                                id="exampleDescription"
                                name="problem_description"
                                required
                                placeholder="Escriba detalladamente su problema acá"
                                rows="4"
                                value={formData.problem_description}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                        <div className="mb-32">
                            <label htmlFor="exampleFile" className="form-support">Capturas de pantalla del problema</label>
                            <input
                                type="file"
                                className="form-control"
                                id="exampleFile"
                                name="files"
                                multiple
                                placeholder="Inserte sus archivos mostrando el problema acá"
                                accept="image/*"
                                onChange={handleChange}
                            />
                            <br />
                        </div>
                        <div className="form-buttons-container">
                            <button className="btn-submit" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Enviando...' : 'Enviar datos'}
                            </button>
                            <button className="btn-submit" type="button" onClick={handleReset}>Limpiar campos</button>
                        </div>
                    </form>
                </section>
            </main>
            <footer className="footer-bar">
                <p>© 2025 SPER - Departamento de Seguridad Informática</p>
            </footer>
        </>
    );
}

export default Support;