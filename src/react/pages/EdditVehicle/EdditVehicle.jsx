import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../../api/axiosConfig';
import './EdditVehicle.css';
import NavBar from '../../components/common/NavBar/NavBar';

const EdditVehicle = () => {
    // --- HOOKS 
    const { productId } = useParams();
    const navigate = useNavigate();

    // --- ESTADOS 
    const [formData, setFormData] = useState({
        description: '',
        kilometros: '',
        destino: '',
        service: '',
        rodado: '',
        reparaciones: '',
        usuario: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // --- CARGA DE DATOS CON AXIOS ---
    useEffect(() => {
        const fetchVehicleData = async () => {
            try {
                // 2. Usamos apiClient.get para cargar los datos iniciales.
                const response = await apiClient.get(`/api/vehicle/${productId}`);
                const vehicleData = response.data.vehicle; 

                setFormData({
                    description: vehicleData.description.slice(-1)[0] || '',
                    kilometros: vehicleData.kilometros.slice(-1)[0] || '',
                    destino: vehicleData.destino.slice(-1)[0] || '',
                    service: vehicleData.service.slice(-1)[0] || '',
                    rodado: vehicleData.rodado.slice(-1)[0] || '',
                    reparaciones: vehicleData.reparaciones.slice(-1)[0] || '',
                    usuario: vehicleData.usuario || ''
                });
            } catch (err) {
                setError(err.response?.data?.message || 'No se pudieron cargar los datos del vehículo.');
            }
        };

        fetchVehicleData();
    }, [productId]);

    // --- MANEJADOR DE CAMBIOS EN EL FORMULARIO ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // --- ENVÍO DE FORMULARIO CON AXIOS ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await apiClient.put(`/api/vehicle/${productId}`, formData);

            setSuccess('Vehículo modificado con éxito.');
            setTimeout(() => {
                navigate(`/vehicle-information/${productId}`);
            }, 1500);

        } catch (err) {
            setError(err.response?.data?.message || 'Error al actualizar el vehículo.');
        }
    };
    
    // --- RENDERIZADO ---
    return (
        <>
            <main>
                <form id="formEditVehicle" onSubmit={handleSubmit}>
                    <div className="title-add-product">
                        <h2 className="title-add">Editar Vehículo</h2>
                    </div>
                    <div className="desc-product">
                        <p>Descripción de estado de Vehículo</p>
                        <input className="controls" type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Descripción del vehículo" />
                    </div>
                    <div className="stock-code-price">
                        <div className="stock-product">
                            <p>Kilómetros</p>
                            <input className="controls" type="number" min="0" name="kilometros" value={formData.kilometros} onChange={handleChange} placeholder="Kilometraje actual" />
                        </div>
                        <div className="code-product">
                            <p>Destino</p>
                            <input className="controls" type="text" name="destino" value={formData.destino} onChange={handleChange} placeholder="Unidad asignada" />
                        </div>
                    </div>
                    <div className="stock-code-price">
                        <div className="price-product">
                            <p>Service</p>
                            <input className="controls" type="text" name="service" value={formData.service} onChange={handleChange} placeholder="Fecha de último service" />
                        </div>
                        <div className="price-product">
                            <p>Rodado</p>
                            <input className="controls" type="text" name="rodado" value={formData.rodado} onChange={handleChange} placeholder="Fecha de cambio de rodado" />
                        </div>
                    </div>
                    <div className="price-product">
                        <p>Reparaciones</p>
                        <input type="text" className="controls" name="reparaciones" value={formData.reparaciones} onChange={handleChange} placeholder="Reparaciones realizadas" />
                    </div>
                    <div className="button-reg">
                        <button className="botons" type="submit">Registrar Cambios</button>
                    </div>
                </form>

                {success && <div className="alert alert-success" role="alert">{success}</div>}
                {error && <div className="alert alert-danger" role="alert">{error}</div>}
            </main>
            <NavBar />
        </>
    );
}

export default EdditVehicle;