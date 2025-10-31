import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './EdditVehicle.css';
import NavBar from '../../components/common/navBar/navBar'; 
import { toast } from 'react-toastify';

const EdditVehicle = () => {
    const { productId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        description: '',
        kilometros: '',
        destino: '',
        service: '',
        rodado: '',
        reparaciones: '',
        usuario: ''
    });


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
                // ---------------------------------

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
                            <input className="controls" type="date" name="service" value={formData.service} onChange={handleChange} placeholder="Fecha de último service" />
                        </div>
                        <div className="price-product">
                            <p>Rodado</p>
                            <input className="controls" type="date" name="rodado" value={formData.rodado} onChange={handleChange} placeholder="Fecha de cambio de rodado" />
                        </div>
                    </div>
                    <div className="price-product">
                        <p>Reparaciones</p>
                        <input type="text" className="controls" name="reparaciones" value={formData.reparaciones} onChange={handleChange} placeholder="Reparaciones realizadas" />
                    </div>
                     <div className="price-product">
                        <p>Chofer</p>
                        <input type="text" className="controls" name="usuario" value={formData.usuario} onChange={handleChange} placeholder="Chofer asignado" />
                    </div>
                    <div className="button-reg">
                        <button className="botons" type="submit">Registrar Cambios</button>
                    </div>
                </form>
            </main>
        </>
    );
}

export default EdditVehicle;