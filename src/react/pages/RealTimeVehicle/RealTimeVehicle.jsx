import React, { useState, useEffect } from 'react';
import './RealTimeVehicle.css'; // Asegúrate de tener los estilos específicos aquí
import NavBar from '../../components/common/NavBar/NavBar';

const RealTimeVehicle = () => {

    // Estado para guardar todos los datos del formulario
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dominio: '',
        kilometros: '',
        destino: '',
        anio: '',
        modelo: '',
        tipo: '',
        chasis: '',
        motor: '',
        cedula: '',
        service: '',
        rodado: '',
        marca: '',
        reparaciones: '',
        usuario: '',
        thumbnail: [] // Para guardar los archivos de imagen
    });


    // Estados para la retroalimentación al usuario
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ message: '', type: '' });

    // useEffect para obtener datos iniciales del usuario (ej: su unidad)
    useEffect(() => {
        const fetchUserData = async () => {
            try {

                const response = await fetch('/api/session/current');
                if (response.ok) {
                    const userData = await response.json();
                    setFormData(prevState => ({
                        ...prevState,
                        title: userData.unidad || '' // Pre-llena el campo 'Establecimiento'
                    }));
                }
            } catch (error) {
                console.error("No se pudo obtener la sesión del usuario:", error);
            }
        };
        fetchUserData();
    }, []); // El array vacío asegura que se ejecute solo una vez

    // Manejador para los cambios en los inputs
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: files ? files : value
        }));
    };

    // Manejador para el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus({ message: '', type: '' });

        const dataToSend = new FormData();
        // Agregamos todos los campos al FormData
        for (const key in formData) {
            if (key === 'thumbnail') {
                // Agregamos los archivos uno por uno
                if (formData.thumbnail.length > 0) {
                    for (let i = 0; i < formData.thumbnail.length; i++) {
                        dataToSend.append('thumbnail', formData.thumbnail[i]);
                    }
                }
            } else {
                dataToSend.append(key, formData[key]);
            }
        }

        try {
            const response = await fetch('/api/addVehicleWithImage', {
                method: 'POST',
                body: dataToSend,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error al agregar vehículo.');

            setSubmitStatus({ message: 'Vehículo cargado con éxito.', type: 'success' });
            // Aquí podrías resetear el formulario si lo deseas
        } catch (err) {
            setSubmitStatus({ message: err.message, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>


            <div id="message-container">
                {/* Mostramos mensajes de éxito o error aquí */}
                {submitStatus.message && (
                    <div className={submitStatus.type === 'success' ? 'alert alert-success' : 'alert alert-danger'} role="alert">
                        {submitStatus.message}
                    </div>
                )}
            </div>

            <form id="formProduct" onSubmit={handleSubmit}>
                <main>
                    <div className="title-add-product">
                        <h2 className="title-add">Cargar Vehículo</h2>
                    </div>

                    <div className="name-desc">
                        <div className="name-product">
                            <p>Establecimiento (Título de la Tarjeta)</p>
                            <select
                                className="controls"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            >
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
                        <div className="desc-product">
                            <p>Descripción de estado de Vehículo</p>
                            <input className="controls" type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Descripción y utilización específica" required />
                        </div>
                    </div>

                    <div className="stock-code-price">
                        <div className="code-product">
                            <p>Patente</p>
                            <input className="controls" type="text" name="dominio" value={formData.dominio} onChange={handleChange} placeholder="Ingrese el dominio" required />
                        </div>
                        <div className="stock-product">
                            <p>Kilómetros</p>
                            <input className="controls" type="number" min="0" name="kilometros" value={formData.kilometros} onChange={handleChange} placeholder="Kilometraje actual" required />
                        </div>
                        <div className="code-product">
                            <p>Destino</p>
                            <input className="controls" type="text" name="destino" value={formData.destino} onChange={handleChange} placeholder="Unidad asignada" required />
                        </div>
                    </div>

                    <div className="stock-code-price">
                        <div className="code-product">
                            <p>Año</p>
                            <input className="controls" type="text" name="anio" value={formData.anio} onChange={handleChange} placeholder="año del vehiculo" required />
                        </div>
                        <div className="code-product">
                            <p>Modelo</p>
                            <input className="controls" type="text" name="modelo" value={formData.modelo} onChange={handleChange} placeholder="Ej:s10, berlingo" required />
                        </div>
                        <div className="code-product">
                            <p>Tipo</p>
                            <input className="controls" type="text" name="tipo" value={formData.tipo} onChange={handleChange} placeholder="Ingrese tipo de vehiculo" required />
                        </div>
                    </div>

                    <div className="stock-code-price">
                        <div className="price-product">
                            <p>N° Chasis</p>
                            <input className="controls" type="text" name="chasis" value={formData.chasis} onChange={handleChange} placeholder="Ingrese n° de chasis" required />
                        </div>
                        <div className="price-product">
                            <p>N° Motor</p>
                            <input className="controls" type="text" name="motor" value={formData.motor} onChange={handleChange} placeholder="Ingrese n° de motor" required />
                        </div>
                        <div className="price-product">
                            <p>N° Cedula</p>
                            <input className="controls" type="text" name="cedula" value={formData.cedula} onChange={handleChange} placeholder="Ingrese n° de cedula" required />
                        </div>
                    </div>

                    <div className="stock-code-price">
                        <div className="price-product">
                            <p>Service</p>
                            <input className="controls" type="date" name="service" value={formData.service} onChange={handleChange} placeholder="fecha de ultimo service" required />
                        </div>
                        <div className="price-product">
                            <p>Rodado</p>
                            <input className="controls" type="date" name="rodado" value={formData.rodado} onChange={handleChange} placeholder="fecha de cambio de rodado" required />
                        </div>
                        <div className="price-product">
                            <p>Marca</p>
                            <input className="controls" type="text" name="marca" value={formData.marca} onChange={handleChange} placeholder="ingrese marca del vehiculo" required />
                        </div>
                    </div>

                    <div className="stock-code-price">
                        <div className="price-product">
                            <p>Reparaciones</p>
                            <input className="controls" type="text" name="reparaciones" value={formData.reparaciones} onChange={handleChange} placeholder="indicar reparaciones realizadas" required />
                        </div>
                        <div className="price-product">
                            <p>Chofer</p>
                            <input className="controls" type="text" name="usuario" value={formData.usuario} onChange={handleChange} placeholder="indicar el chofer actual" required />
                        </div>
                    </div>

                    <div className="url-product">
                        <p>Imágenes</p>
                        <input className="controls" type="file" name="thumbnail" id="thumbnail" onChange={handleChange} multiple required title="Por favor, seleccione las imágenes que desea subir..." />
                    </div>

                    <div className="button-reg">
                        <button className="botons" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Registrando...' : 'Registrar Vehículo'}
                        </button>
                    </div>
                </main>
            </form>
        </>
    );
}

export default RealTimeVehicle;