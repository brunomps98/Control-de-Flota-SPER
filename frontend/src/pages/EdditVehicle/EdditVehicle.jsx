import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './EdditVehicle.css'; 
import { toast } from 'react-toastify';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core'; 

const EdditVehicle = () => {
    const { productId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        description: '', kilometros: '', destino: '',
        service: '', rodado: '', reparaciones: '', usuario: ''
    });


    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;
        const handleBackButton = () => navigate(`/vehicle-detail/${productId}`);
        const listener = App.addListener('backButton', handleBackButton);
        return () => listener.remove();
    }, [navigate, productId]);

    useEffect(() => {
        const fetchVehicleData = async () => {
            try {
                const response = await apiClient.get(`/api/vehicle/${productId}`);
                const vehicleData = response.data.vehicle; 

                setFormData({
                    description: (vehicleData.descripciones && vehicleData.descripciones[0]?.descripcion) || '',
                    kilometros: (vehicleData.kilometrajes && vehicleData.kilometrajes[0]?.kilometraje) || '',
                    destino: (vehicleData.destinos && vehicleData.destinos[0]?.descripcion) || '',
                    service: (vehicleData.services && vehicleData.services[0]?.descripcion) || '',
                    rodado: (vehicleData.rodados && vehicleData.rodados[0]?.descripcion) || '',
                    reparaciones: (vehicleData.reparaciones && vehicleData.reparaciones[0]?.descripcion) || '',
                    usuario: vehicleData.chofer || ''
                });

            } catch (err) {
                toast.error(err.response?.data?.message || 'No se pudieron cargar los datos del vehículo.');
            }
        };
        fetchVehicleData();
    }, [productId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.put(`/api/vehicle/${productId}`, formData);
            toast.success('Vehículo modificado con éxito.');
            setTimeout(() => {
                navigate(`/vehicle-detail/${productId}`); 
            }, 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error al actualizar el vehículo.');
        }
    };


    return (
        <div className="login-page vehicle-form-page">
            <main className="login-main">
                <div className="login-card vehicle-form-card">
                    <h2 className="form-title">Editar Vehículo</h2>

                    <form onSubmit={handleSubmit} className="vehicle-form-grid">

                        <div className="form-group span-2">
                            <label htmlFor="description" className="form-label">Descripción de estado</label>
                            <input id="description" className="form-control" type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Descripción del vehículo" />
                        </div>

                        <div className="form-group span-1">
                            <label htmlFor="kilometros" className="form-label">Kilómetros</label>
                            <input id="kilometros" className="form-control" type="number" min="0" name="kilometros" value={formData.kilometros} onChange={handleChange} placeholder="Kilometraje actual" />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="destino" className="form-label">Destino</label>
                            <input id="destino" className="form-control" type="text" name="destino" value={formData.destino} onChange={handleChange} placeholder="Unidad asignada" />
                        </div>

                        <div className="form-group span-1">
                            <label htmlFor="service" className="form-label">Service</label>
                            <input id="service" className="form-control" type="date" name="service" value={formData.service} onChange={handleChange} />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="rodado" className="form-label">Rodado</label>
                            <input id="rodado" className="form-control" type="date" name="rodado" value={formData.rodado} onChange={handleChange} />
                        </div>

                        <div className="form-group span-1">
                             <label htmlFor="reparaciones" className="form-label">Reparaciones</label>
                            <input id="reparaciones" type="text" className="form-control" name="reparaciones" value={formData.reparaciones} onChange={handleChange} placeholder="Reparaciones realizadas" />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="usuario" className="form-label">Chofer</label>
                            <input id="usuario" type="text" className="form-control" name="usuario" value={formData.usuario} onChange={handleChange} placeholder="Chofer asignado" />
                        </div>

                        <div className="form-group span-2">
                            <button className="login-submit-btn" type="submit">
                                Registrar Cambios
                            </button>
                        </div>

                    </form>
                </div>
            </main>
        </div>
    );
}

export default EdditVehicle;