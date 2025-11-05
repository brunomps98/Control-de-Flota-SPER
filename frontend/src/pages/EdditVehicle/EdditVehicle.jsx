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

    // --- LÓGICA DE CARGA ---
    // (No hacemos fetch de datos viejos, el form es solo para AÑADIR)
    useEffect(() => {
        // Opcional: Podríamos cargar el 'vehicle' solo para mostrar el nombre,
        // pero para este formulario, no es necesario.
        // Dejamos los campos vacíos.
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
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.put(`/api/vehicle/${productId}`, formData);
            toast.success('Historial actualizado con éxito.');

            // --- ▼▼ ESTE ES EL ARREGLO ▼▼ ---
            // Usamos window.location.assign en lugar de navigate.
            // Esto fuerza un "hard refresh" de la página de detalle,
            // asegurando que SÍ O SÍ pida los datos nuevos.
            setTimeout(() => {
                window.location.assign(`/vehicle-detail/${productId}`);
            }, 1500); // Mantenemos el delay para que el toast se vea

        } catch (err) {
            toast.error(err.response?.data?.message || 'Error al actualizar el vehículo.');
        }
    };


    return (
        <div className="login-page vehicle-form-page">
            <main className="login-main">
                <div className="login-card vehicle-form-card">
                    <h2 className="form-title">Añadir Historial</h2>

                    <form onSubmit={handleSubmit} className="vehicle-form-grid">

                        <div className="form-group span-2">
                            <label htmlFor="description" className="form-label">Nuevo Chofer</label>
                            <input id="description" className="form-control" type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Ingrese el nuevo chofer..." />
                        </div>

                        <div className="form-group span-1">
                            <label htmlFor="kilometros" className="form-label">Kilómetros</label>
                            <input id="kilometros" className="form-control" type="number" min="0" name="kilometros" value={formData.kilometros} onChange={handleChange} placeholder="Nuevo registro de KMs" />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="destino" className="form-label">Destino</label>
                            <input id="destino" className="form-control" type="text" name="destino" value={formData.destino} onChange={handleChange} placeholder="Nuevo destino" />
                        </div>

                        <div className="form-group span-1">
                            <label htmlFor="service" className="form-label">Service</label>
                            <input id="service" className="form-control" type="date" name="service" value={formData.service} onChange={handleChange} />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="rodado" className="form-label">Rodado</label>
                            <input id="rodado" className="form-control" type="date" name="rodado" value={formData.rodado} onChange={handleChange} />
                        </div>

                        <div className="form-group span-2">
                            <label htmlFor="reparaciones" className="form-label">Reparaciones</label>
                            <input id="reparaciones" type="text" className="form-control" name="reparaciones" value={formData.reparaciones} onChange={handleChange} placeholder="Reparaciones realizadas" />
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