<<<<<<< HEAD
import React, { useState } from 'react';
// import { Link } from 'react-router-dom'; // Descomentar si se usa para navegar
=======
import { Link } from 'react-router-dom';
>>>>>>> 40402f90bc4202fb56023d534e577ce34bb6e75e
import './Register.css';
import logoSper from '../../assets/images/logo.png';

const Register = () => {
<<<<<<< HEAD
    // 1. Estado para guardar los datos de todos los inputs
    const [formData, setFormData] = useState({
        username: '',
        unidad: '',
        email: '',
        passw: ''
    });

    // Estado para manejar los mensajes de error
    const [error, setError] = useState('');

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

        // Si todo está bien, mostramos los datos y los preparamos para el envío
        console.log('Datos a enviar al backend:', formData);
        
        // Aquí iría la lógica para enviar los datos a tu API, por ejemplo:
        // fetch('/register', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(formData)
        // }).then(response => ...).catch(error => ...);
    };

    return (
        <div className="register-page-container">
            <div className="banner-productos">
                <div className="navbar-r">
=======
    return (
        <div className="home-container">

            <div class="banner-productos">
                <div class="navbar-r">
>>>>>>> 40402f90bc4202fb56023d534e577ce34bb6e75e
                    <img src={logoSper} alt="Logo SPER" className="logo-r"/>
                </div>
            </div>

<<<<<<< HEAD
                <main>
               
                <div className="container register">
                    <div className="title-r">
                        <h1>Registro</h1>
                    </div>
                    {/* 4. Quitamos action/method y usamos onSubmit */}
                    <form onSubmit={handleSubmit}>
                        {/* Campo de Nombre de usuario */}
                        <div className="mb-3">
                           
                            <label htmlFor="exampleInputUsername" className="form-label">Nombre de usuario</label>
                            {/* 6. Conectamos el input al estado con 'value' y 'onChange' */}
                            <input 
                                type="text" 
                                className="form-control" 
                                id="exampleInputUsername" 
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Campo de Unidad */}
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

                        {/* Campo de Email */}
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

                        {/* Campo de Contraseña */}
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
=======
            <div>
            <footer className="footer-bar">
                <p>© 2025 SPER - Departamento de Seguridad Informática</p>
            </footer>
            </div>
        </div >
    )
>>>>>>> 40402f90bc4202fb56023d534e577ce34bb6e75e
}

export default Register;