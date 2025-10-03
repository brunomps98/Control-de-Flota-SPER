import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EdditVehicle.css'; // Asegúrate de tener los estilos específicos aquí
import NavBar from '../../components/common/NavBar/NavBar';

const EdditVehicle = () => {
    // Hooks de React Router para obtener el ID de la URL y para navegar
    const { productId } = useParams();
    const navigate = useNavigate();

    // Estado para guardar los datos del formulario
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

    // useEffect para buscar los datos del vehículo cuando el componente carga
    useEffect(() => {
        const fetchVehicleData = async () => {
            try {
                // Pedimos los datos actuales del vehículo para pre-llenar el formulario
                const response = await fetch(`/api/vehicle/${productId}`); 
                if (!response.ok) throw new Error('No se pudieron cargar los datos del vehículo.');
                
                const data = await response.json();
                // Pre-llenamos el formulario con los datos existentes
                setFormData({
                    description: data.vehicle.description.slice(-1)[0] || '',
                    kilometros: data.vehicle.kilometros.slice(-1)[0] || '',
                    destino: data.vehicle.destino || '',
                    service: data.vehicle.service.slice(-1)[0] || '',
                    rodado: data.vehicle.rodado.slice(-1)[0] || '',
                    reparaciones: data.vehicle.reparaciones.slice(-1)[0] || '',
                    usuario: data.vehicle.usuario || ''
                });
            } catch (err) {
                setError(err.message);
            }
        };

        fetchVehicleData();
    }, [productId]); // Se ejecuta cada vez que el ID del producto cambia

    // Manejador para los cambios en los inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // Manejador para el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`/vehicle/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar el vehículo.');
            }

            setSuccess('Vehículo modificado con éxito.');
            // Navegamos a la página de información del vehículo después de 1.5 segundos
            setTimeout(() => {
                navigate(`/vehicle-information/${productId}`);
            }, 1500);

        } catch (err) {
            setError(err.message);
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