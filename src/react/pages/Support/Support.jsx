import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Usamos Link para la navegación
import './Support.css';
import logoSper from '../../assets/images/logo.png';

const Support = () => {
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        email: '',
        phone: '',
        problem_description: '',
        file: null
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ message: '', type: '' });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: files ? files[0] : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus({ message: '', type: '' });

        const dataToSend = new FormData();
        Object.keys(formData).forEach(key => {
            dataToSend.append(key, formData[key]);
        });

        try {
            const response = await fetch('/api/support', {
                method: 'POST',
                body: dataToSend,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Hubo un error al enviar el caso.');
            }

            setSubmitStatus({ message: result.message, type: 'success' });
            setFormData({
                name: '', surname: '', email: '', phone: '',
                problem_description: '', file: null
            });
            document.getElementById('exampleFile').value = '';

        } catch (error) {
            setSubmitStatus({ message: error.message, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
    setFormData({
        name: '',
        surname: '',
        email: '',
        phone: '',
        problem_description: '',
        file: null
    });

    document.getElementById('exampleFile').value = '';

    setSubmitStatus({ message: '', type: '' });
};

    return (
        <>
            <header className="top-bar-support">
                <div className="top-bar-left-support">
                    <div className="logo-support">
                        <Link to="/">
                            <img src={logoSper} alt="Logo Sper" width="60" height="60"/>
                        </Link>
                    </div>
                    <div className="title-support">
                        <h1>SPER</h1>
                    </div>
                </div>
            </header>

            <main>
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
                                name="file" 
                                multiple
                                placeholder="Inserte sus archivos mostrando el problema acá" 
                                accept="image/*"
                                onChange={handleChange}
                            />
                            <br/>
                        </div>

                        <div className="form-buttons-container">
                            <button className="btn-submit" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Enviando...' : 'Enviar datos'}
                            </button>
                            <button className="btn-submit" type="button"  onClick={handleReset}>Limpiar campos</button>
                        </div>
                    </form>

                    {submitStatus.message && (
                        <div style={{ textAlign: 'center', marginTop: '20px', padding: '15px', borderRadius: '5px', color: submitStatus.type === 'success' ? '#155724' : '#721c24', backgroundColor: submitStatus.type === 'success' ? '#d4edda' : '#f8d7da' }}>
                            {submitStatus.message}
                        </div>
                    )}
                </section>
            </main>

            <footer className="footer-bar">
                <p>© 2025 SPER - Departamento de Seguridad Informática</p>
            </footer>
        </>
    );
}

export default Support;