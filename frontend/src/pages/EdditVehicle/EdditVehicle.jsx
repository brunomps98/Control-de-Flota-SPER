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
        service: '', rodado: '', reparaciones: ''
    });


    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;
        const handleBackButton = () => navigate(`/vehicle-detail/${productId}`);
        const listener = App.addListener('backButton', handleBackButton);
        return () => listener.remove();
    }, [navigate, productId]);

    // Lógica de carga
    useEffect(() => {
        setFormData({
            description: '',
            kilometros: '',
            destino: '',
            service: '',
            rodado: '',
            reparaciones: ''
        });
    }, [productId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Aplicamos consistencia de mayúsculas
        let finalValue = value;
        if (['destino'].includes(name)) {
            finalValue = value.toUpperCase();
        }

        setFormData(prevState => ({
            ...prevState,
            [name]: finalValue
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.put(`/api/vehicle/${productId}`, formData);
            toast.success('Historial actualizado con éxito.');
            setTimeout(() => {
                window.location.assign(`/vehicle-detail/${productId}`);
            }, 1500); 

        } catch (err) {
            toast.error(err.response?.data?.message || 'Error al actualizar el vehículo.');
        }
    };


    return (
        <div className="login-page vehicle-form-page">
            <main className="login-main">
                <div className="login-card vehicle-form-card">
                    <h2 className="form-title">Añadir Historial / Actualizar</h2>

                    <form onSubmit={handleSubmit} className="vehicle-form-grid">

                        {/* CHOFER */}
                        <div className="form-group span-2">
                            <label htmlFor="description" className="form-label">Nuevo Chofer / Responsable</label>
                            <input 
                                id="description" 
                                className="form-control" 
                                type="text" 
                                name="description" 
                                value={formData.description} 
                                onChange={handleChange} 
                                placeholder="Ingrese el nuevo chofer..." 
                            />
                        </div>

                        {/* KILOMETROS (NUMERICO) */}
                        <div className="form-group span-1">
                            <label htmlFor="kilometros" className="form-label">Kilómetros</label>
                            <input 
                                id="kilometros" 
                                className="form-control" 
                                type="number" 
                                min="0" 
                                name="kilometros" 
                                value={formData.kilometros} 
                                onChange={handleChange} 
                                placeholder="Nuevo registro de KMs" 
                            />
                        </div>

                        {/* DESTINO (TEXTO MAYUSCULA) */}
                        <div className="form-group span-1">
                            <label htmlFor="destino" className="form-label">Destino</label>
                            <input 
                                id="destino" 
                                className="form-control" 
                                type="text" 
                                name="destino" 
                                value={formData.destino} 
                                onChange={handleChange} 
                                placeholder="Nuevo destino" 
                                style={{textTransform: 'uppercase'}}
                            />
                        </div>

                        {/* FECHAS */}
                        <div className="form-group span-1">
                            <label htmlFor="service" className="form-label">Nuevo Venc. Service</label>
                            <input 
                                id="service" 
                                className="form-control" 
                                type="date" 
                                name="service" 
                                value={formData.service} 
                                onChange={handleChange} 
                            />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="rodado" className="form-label">Nuevo Venc. Cubiertas</label>
                            <input 
                                id="rodado" 
                                className="form-control" 
                                type="date" 
                                name="rodado" 
                                value={formData.rodado} 
                                onChange={handleChange} 
                            />
                        </div>

                        {/* REPARACIONES */}
                        <div className="form-group span-2">
                            <label htmlFor="reparaciones" className="form-label">Reparaciones / Novedades</label>
                            <input 
                                id="reparaciones" 
                                type="text" 
                                className="form-control" 
                                name="reparaciones" 
                                value={formData.reparaciones} 
                                onChange={handleChange} 
                                placeholder="Reparaciones realizadas" 
                            />
                        </div>

                        <div className="form-group span-2">
                            <button className="login-submit-btn" type="submit">
                                Guardar Historial
                            </button>
                        </div>

                    </form>
                </div>
            </main>
        </div>
    );
}

export default EdditVehicle;