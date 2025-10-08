import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/axiosConfig';
import './RealTimeVehicle.css';
import NavBar from '../../components/common/NavBar/NavBar';

const RealTimeVehicle = () => {
    const [formData, setFormData] = useState({
        title: '', description: '', dominio: '', kilometros: '', destino: '',
        anio: '', modelo: '', tipo: '', chasis: '', motor: '', cedula: '',
        service: '', rodado: '', marca: '', reparaciones: '', usuario: '',
        thumbnail: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ message: '', type: '' });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await apiClient.get('/api/user/current');
                const userData = response.data; 

                if (userData && userData.user) {
                    setFormData(prevState => ({
                        ...prevState,
                        title: userData.user.unidad || ''
                    }));
                }
            } catch (error) {
                console.error("No se pudo obtener la sesión del usuario:", error);
            }
        };
        fetchUserData();
    }, []);

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
        setSubmitStatus({ message: '', type: '' });

        const dataToSend = new FormData();
        for (const key in formData) {
            if (key === 'thumbnail' && formData[key]) {
                for (let i = 0; i < formData[key].length; i++) {
                    dataToSend.append('thumbnail', formData[key][i]);
                }
            } else {
                dataToSend.append(key, formData[key]);
            }
        }

        try {
            await apiClient.post('/api/addVehicleWithImage', dataToSend);
            setSubmitStatus({ message: 'Vehículo cargado con éxito.', type: 'success' });
            e.target.reset();
        } catch (err) {
            setSubmitStatus({ message: err.response?.data?.message || 'Error al agregar vehículo.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div id="message-container">
                {submitStatus.message && (
                    <div className={submitStatus.type === 'success' ? 'alert alert-success' : 'alert alert-danger'} role="alert">
                        {submitStatus.message}
                    </div>
                )}
            </div>
            <form id="formProduct" onSubmit={handleSubmit}>
                {/* El resto de tu JSX no necesita cambios */}
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
                            <input className="controls" type="text" name="description" placeholder="Descripción y utilización específica" required />
                        </div>
                    </div>
                    {/* ... más inputs ... */}
                     <div className="stock-code-price">
                        <div className="code-product">
                            <p>Patente</p>
                            <input className="controls" type="text" name="dominio"  onChange={handleChange} placeholder="Ingrese el dominio" required />
                        </div>
                        <div className="stock-product">
                            <p>Kilómetros</p>
                            <input className="controls" type="number" min="0" name="kilometros"  onChange={handleChange} placeholder="Kilometraje actual" required />
                        </div>
                        <div className="code-product">
                            <p>Destino</p>
                            <input className="controls" type="text" name="destino"  onChange={handleChange} placeholder="Unidad asignada" required />
                        </div>
                    </div>

                    <div className="stock-code-price">
                        <div className="code-product">
                            <p>Año</p>
                            <input className="controls" type="text" name="anio" onChange={handleChange} placeholder="año del vehiculo" required />
                        </div>
                        <div className="code-product">
                            <p>Modelo</p>
                            <input className="controls" type="text" name="modelo" onChange={handleChange} placeholder="Ej:s10, berlingo" required />
                        </div>
                        <div className="code-product">
                            <p>Tipo</p>
                            <input className="controls" type="text" name="tipo" onChange={handleChange} placeholder="Ingrese tipo de vehiculo" required />
                        </div>
                    </div>

                    <div className="stock-code-price">
                        <div className="price-product">
                            <p>N° Chasis</p>
                            <input className="controls" type="text" name="chasis"  onChange={handleChange} placeholder="Ingrese n° de chasis" required />
                        </div>
                        <div className="price-product">
                            <p>N° Motor</p>
                            <input className="controls" type="text" name="motor"  onChange={handleChange} placeholder="Ingrese n° de motor" required />
                        </div>
                        <div className="price-product">
                            <p>N° Cedula</p>
                            <input className="controls" type="text" name="cedula"  onChange={handleChange} placeholder="Ingrese n° de cedula" required />
                        </div>
                    </div>

                    <div className="stock-code-price">
                        <div className="price-product">
                            <p>Service</p>
                            <input className="controls" type="date" name="service" onChange={handleChange} placeholder="fecha de ultimo service" required />
                        </div>
                        <div className="price-product">
                            <p>Rodado</p>
                            <input className="controls" type="date" name="rodado" onChange={handleChange} placeholder="fecha de cambio de rodado" required />
                        </div>
                        <div className="price-product">
                            <p>Marca</p>
                            <input className="controls" type="text" name="marca"  onChange={handleChange} placeholder="ingrese marca del vehiculo" required />
                        </div>
                    </div>

                    <div className="stock-code-price">
                        <div className="price-product">
                            <p>Reparaciones</p>
                            <input className="controls" type="text" name="reparaciones"  onChange={handleChange} placeholder="indicar reparaciones realizadas" required />
                        </div>
                        <div className="price-product">
                            <p>Chofer</p>
                            <input className="controls" type="text" name="usuario"  onChange={handleChange} placeholder="indicar el chofer actual" required />
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