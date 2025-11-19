import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import './RealTimeVehicle.css';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'; 
import { App } from '@capacitor/app'; 
import { Capacitor } from '@capacitor/core'; 

const RealTimeVehicle = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        title: '', description: '', dominio: '', kilometros: '', destino: '',
        anio: '', modelo: '', tipo: '', chasis: '', motor: '', cedula: '',
        service: '', rodado: '', marca: '', reparaciones: '', usuario: '',
        thumbnail: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate(); 

    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;
        const handleBackButton = () => navigate('/vehicle');
        const listener = App.addListener('backButton', handleBackButton);
        return () => listener.remove();
    }, [navigate]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await apiClient.get('/api/user/current');
                const userData = response.data.user; 
                
                setUser(userData);
                
                if (userData) {
                    const unitMap = {
                        "Direccion General": "dg", "Unidad Penal 1": "up1", "Unidad Penal 3": "up3",
                        "Unidad Penal 4": "up4", "Unidad Penal 5": "up5", "Unidad Penal 6": "up6",
                        "Unidad Penal 7": "up7", "Unidad Penal 8": "up8", "Unidad Penal 9": "up9",
                        "Instituto": "inst", "Tratamiento": "trat"
                    };
                    
                    let initialTitle = "";
                    // Si es Admin, no preseleccionamos nada obligatoriamente (o lo dejamos vacio para que elija)
                    // Si es Invitado, buscamos su unidad
                    const userPermissionKey = unitMap[userData.unidad]; 
                    
                    if (userPermissionKey && userData[userPermissionKey]) { 
                        initialTitle = userData.unidad;
                    }
                    
                    setFormData(prevState => ({ ...prevState, title: initialTitle }));
                }
            } catch (error) {
                console.error("No se pudo obtener la sesión del usuario:", error);
                toast.error("Error al cargar datos de usuario.");
            } finally {
                setLoading(false); 
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

            // Reset form pero manteniendo la unidad si es invitado
            const resetForm = (initialTitle = "") => {
                 setFormData({
                     title: initialTitle, description: '', dominio: '', kilometros: '', destino: '',
                     anio: '', modelo: '', tipo: '', chasis: '', motor: '', cedula: '',
                     service: '', rodado: '', marca: '', reparaciones: '', usuario: '',
                     thumbnail: null
                 });
                 const fileInput = document.getElementById('thumbnail');
                 if (fileInput) fileInput.value = '';
            }
            
            // Si no es admin, mantenemos el título fijo. Si es admin, se limpia.
            const titleToKeep = !user.admin ? formData.title : "";
            resetForm(titleToKeep);

        } catch (error) {
            if (error.response && error.response.status === 403) {
                 toast.error('Permiso denegado: No puede agregar vehículos a esa unidad.');
            } else {
                 toast.error(error.response?.data?.message || 'Error al agregar vehículo.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="login-page vehicle-form-page">
                <main className="login-main">
                    <p style={{color: 'white', fontSize: '1.2rem'}}>Cargando...</p>
                </main>
            </div>
        );
    }

    return (
        <div className="login-page vehicle-form-page">
            <main className="login-main">
                <div className="login-card vehicle-form-card">
                    <h2 className="form-title">Cargar Vehículo</h2>

                    <form onSubmit={handleSubmit} className="vehicle-form-grid">

                        <div className="form-group span-1">
                            <label htmlFor="title" className="form-label">Establecimiento (Título)</label>
                            <select
                                id="title"
                                className="form-control"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                // --- LÓGICA DE BLOQUEO: Si no es admin, se deshabilita ---
                                disabled={!user.admin}
                            >
                                <option value="">-- Seleccione --</option>
                                {(user.admin || user.dg) && <option value="Direccion General">Dirección General</option>}
                                {(user.admin || user.up1) && <option value="Unidad Penal 1">Unidad Penal 1</option>}
                                {(user.admin || user.up3) && <option value="Unidad Penal 3">Unidad Penal 3</option>}
                                {(user.admin || user.up4) && <option value="Unidad Penal 4">Unidad Penal 4</option>}
                                {(user.admin || user.up5) && <option value="Unidad Penal 5">Unidad Penal 5</option>}
                                {(user.admin || user.up6) && <option value="Unidad Penal 6">Unidad Penal 6</option>}
                                {(user.admin || user.up7) && <option value="Unidad Penal 7">Unidad Penal 7</option>}
                                {(user.admin || user.up8) && <option value="Unidad Penal 8">Unidad Penal 8</option>}
                                {(user.admin || user.up9) && <option value="Unidad Penal 9">Unidad Penal 9</option>}
                                {(user.admin || user.inst) && <option value="Instituto">Instituto</option>}
                                {(user.admin || user.trat) && <option value="Tratamiento">Tratamiento</option>}
                            </select>
                        </div>
                        <div className="form-group span-2">
                            <label htmlFor="description" className="form-label">Descripción de estado</label>
                            <input id="description" className="form-control" type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Descripción y utilización específica" required />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="dominio" className="form-label">Patente</label>
                            <input id="dominio" className="form-control" type="text" name="dominio" value={formData.dominio} onChange={handleChange} placeholder="Ingrese el dominio" required />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="kilometros" className="form-label">Kilómetros</label>
                            <input id="kilometros" className="form-control" type="number" min="0" name="kilometros" value={formData.kilometros} onChange={handleChange} placeholder="Kilometraje actual" required />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="destino" className="form-label">Destino</label>
                            <input id="destino" className="form-control" type="text" name="destino" value={formData.destino} onChange={handleChange} placeholder="Unidad asignada" required />
                        </div>

                        <div className="form-group span-1">
                            <label htmlFor="anio" className="form-label">Año</label>
                            <input id="anio" className="form-control" type="number" max="9999" name="anio" value={formData.anio} onChange={handleChange} placeholder="año del vehiculo" required />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="modelo" className="form-label">Modelo</label>
                            <input id="modelo" className="form-control" type="text" name="modelo" value={formData.modelo} onChange={handleChange} placeholder="Ej:s10, berlingo" required />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="tipo" className="form-label">Tipo</label>
                            <input id="tipo" className="form-control" type="text" name="tipo" value={formData.tipo} onChange={handleChange} placeholder="Ingrese tipo de vehiculo" required />
                        </div>

                        <div className="form-group span-1">
                            <label htmlFor="chasis" className="form-label">N° Chasis</label>
                            <input id="chasis" className="form-control" type="text" name="chasis" value={formData.chasis} onChange={handleChange} placeholder="Ingrese n° de chasis" required />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="motor" className="form-label">N° Motor</label>
                            <input id="motor" className="form-control" type="text" name="motor" value={formData.motor} onChange={handleChange} placeholder="Ingrese n° de motor" required />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="cedula" className="form-label">N° Cedula</label>
                            <input id="cedula" className="form-control" type="text" name="cedula" value={formData.cedula} onChange={handleChange} placeholder="Ingrese n° de cedula" required />
                        </div>

                        <div className="form-group span-1">
                            <label htmlFor="service" className="form-label">Service</label>
                            <input id="service" className="form-control" type="date" name="service" value={formData.service} onChange={handleChange} required />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="rodado" className="form-label">Rodado</label>
                            <input id="rodado" className="form-control" type="date" name="rodado" value={formData.rodado} onChange={handleChange} required />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="marca" className="form-label">Marca</label>
                            <input id="marca" className="form-control" type="text" name="marca" value={formData.marca} onChange={handleChange} placeholder="ingrese marca del vehiculo" required />
                        </div>

                        <div className="form-group span-2">
                            <label htmlFor="reparaciones" className="form-label">Reparaciones</label>
                            <input id="reparaciones" className="form-control" type="text" name="reparaciones" value={formData.reparaciones} onChange={handleChange} placeholder="indicar reparaciones realizadas" required />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="usuario" className="form-label">Chofer</label>
                            <input id="usuario" className="form-control" type="text" name="usuario" value={formData.usuario} onChange={handleChange} placeholder="indicar el chofer actual" required />
                        </div>

                        <div className="form-group span-3">
                            <label htmlFor="thumbnail" className="form-label">Imágenes</label>
                            <input id="thumbnail" className="form-control" type="file" name="thumbnail" onChange={handleChange} multiple title="Por favor, seleccione las imágenes que desea subir..." />
                        </div>
                        
                        <div className="form-group span-3">
                            <button className="login-submit-btn" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Registrando...' : 'Registrar Vehículo'}
                            </button>
                        </div>

                    </form>
                </div>
            </main>
        </div>
    );
}

export default RealTimeVehicle;