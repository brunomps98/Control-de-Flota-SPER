import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import './RealTimeVehicle.css';
import { toast } from 'react-toastify';

const RealTimeVehicle = () => {
    const [formData, setFormData] = useState({
        title: '', // Inicializamos como vacío
        description: '', dominio: '', kilometros: '', destino: '',
        anio: '', modelo: '', tipo: '', chasis: '', motor: '', cedula: '',
        service: '', rodado: '', marca: '', reparaciones: '', usuario: '',
        thumbnail: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await apiClient.get('/api/user/current');
                const userData = response.data.user; // Accedemos directo al user
                if (userData) {
                    // Lista de valores válidos de las opciones del select
                    const validTitles = [
                        "Direccion General", "Unidad Penal 1", "Unidad Penal 3",
                        "Unidad Penal 4", "Unidad Penal 5", "Unidad Penal 6",
                        "Unidad Penal 7", "Unidad Penal 8", "Unidad Penal 9",
                        "Instituto", "Tratamiento"
                    ];

                    // Si la unidad del usuario es una opción válida, la usamos. Si no, dejamos el título vacío.
                    const initialTitle = validTitles.includes(userData.unidad) ? userData.unidad : "";

                    setFormData(prevState => ({
                        ...prevState,
                        title: initialTitle
                    }));
                }
            } catch (error) {
                console.error("No se pudo obtener la sesión del usuario:", error);
                // Si falla, también dejamos el título vacío por seguridad
                setFormData(prevState => ({ ...prevState, title: "" }));
            }
        };
        fetchUserData();
    }, []); // El array vacío asegura que solo se ejecute al montar

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

        if (!formData.title) {
            toast.error('Por favor, seleccione un establecimiento.');
            setIsSubmitting(false);
            return;
        }

        try {
            const dataToSend = new FormData();
            for (const key in formData) {
                if (key !== 'thumbnail') {
                    dataToSend.append(key, formData[key]);
                }
            }
            if (formData.thumbnail && formData.thumbnail.length > 0) {
                for (let i = 0; i < formData.thumbnail.length; i++) {
                    dataToSend.append('thumbnail', formData.thumbnail[i]);
                }
            }

            const response = await apiClient.post('/api/addVehicleWithImage', dataToSend);
            toast.success(response.data.message);

            // Reseteamos el formulario manteniendo el título inicial si aún es válido
            const fetchUserDataAgain = async () => {
                 try {
                     const userRes = await apiClient.get('/api/user/current');
                     const userData = userRes.data.user;
                     if (userData) {
                         const validTitles = ["Direccion General", "Unidad Penal 1", "Unidad Penal 3", "Unidad Penal 4", "Unidad Penal 5", "Unidad Penal 6", "Unidad Penal 7", "Unidad Penal 8", "Unidad Penal 9", "Instituto", "Tratamiento"];
                         const resetTitle = validTitles.includes(userData.unidad) ? userData.unidad : "";
                         setFormData({
                             title: resetTitle, description: '', dominio: '', kilometros: '', destino: '',
                             anio: '', modelo: '', tipo: '', chasis: '', motor: '', cedula: '',
                             service: '', rodado: '', marca: '', reparaciones: '', usuario: '',
                             thumbnail: null
                         });
                         // Limpiar el input de archivo manualmente si es necesario
                         const fileInput = document.getElementById('thumbnail');
                         if (fileInput) fileInput.value = '';
                     }
                 } catch (err) {
                     // Si falla al obtener usuario, reseteamos a valores vacíos
                     setFormData({
                         title: '', description: '', dominio: '', kilometros: '', destino: '',
                         anio: '', modelo: '', tipo: '', chasis: '', motor: '', cedula: '',
                         service: '', rodado: '', marca: '', reparaciones: '', usuario: '',
                         thumbnail: null
                     });
                     const fileInput = document.getElementById('thumbnail');
                      if (fileInput) fileInput.value = '';
                 }
            }
            fetchUserDataAgain(); // Llamamos para resetear con el title correcto


        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al agregar vehículo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
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
                                <option value="">-- Seleccione Establecimiento --</option>
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
                            <input
                                className="controls"
                                type="number"  
                                max="9999"     
                                name="anio"
                                value={formData.anio}
                                onChange={handleChange}
                                placeholder="año del vehiculo"
                                required
                             />
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
                        <input className="controls" type="file" name="thumbnail" id="thumbnail" onChange={handleChange} multiple title="Por favor, seleccione las imágenes que desea subir..." />
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