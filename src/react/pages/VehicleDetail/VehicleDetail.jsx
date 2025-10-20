import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../../api/axiosConfig';
import './VehicleDetail.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// Initialize SweetAlert for React
const MySwal = withReactContent(Swal);

const VehicleDetail = () => {
    // --- (Hooks, Estados, apiBaseURL ) ---
    const { cid } = useParams();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Estado para errores de carga o eliminación
    const apiBaseURL = apiClient.defaults.baseURL;

    // --- (useEffect de carga) ---
    useEffect(() => {
        const fetchVehicleData = async () => {
            // Limpiamos errores previos al cargar
            setError(null);
            try {
                const response = await apiClient.get(`/api/vehicle/${cid}`);
                setVehicle(response.data.vehicle);
            } catch (err) {
                 // Solo ponemos error si falla la carga inicial
                if (!vehicle) {
                    setError(err.response?.data?.message || 'No se pudo cargar la información del vehículo.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchVehicleData();
    }, [cid]);

    // --- (handleEdit ) ---
    const handleEdit = () => {
        navigate(`/eddit-vehicle/${cid}`);
    };

    // --- 2. MODIFICAR handleDelete CON SWEETALERT ---
    const handleDelete = () => {
        MySwal.fire({
            title: '¿Estás seguro?',
            text: "¡Vas a eliminar este vehículo! No podrás revertir esto.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Limpiamos errores previos
                setError(null);
                try {
                    await apiClient.delete(`/api/vehicle/${cid}`);
                    // Mostramos éxito y redirigimos
                    MySwal.fire(
                        '¡Eliminado!',
                        'El vehículo ha sido eliminado.',
                        'success'
                    ).then(() => {
                         navigate('/vehicle'); // Redirigir DESPUÉS de cerrar el popup de éxito
                    });
                } catch (err) {
                    // Guardamos el error para mostrarlo
                    const errorMessage = err.response?.data?.message || 'No se pudo eliminar el vehículo.';
                    setError(errorMessage);
                    MySwal.fire(
                        'Error',
                        `No se pudo eliminar el vehículo: ${errorMessage}`,
                        'error'
                    );
                }
            }
        });
    };


    // --- (Renderizado ) ---
    if (loading) return <p>Cargando información del vehículo...</p>;
    // Muestra error si hubo problema al cargar O al eliminar
    if (error && !vehicle) { // Solo muestra el error de carga si el vehículo no existe
        return <p style={{ color: 'red' }}>Error al cargar: {error}</p>;
    }
    if (!vehicle) return <p>No se encontró el vehículo.</p>;

    const getLastEntry = (arr) => arr && arr.length > 0 ? arr[arr.length - 1] : 'Sin registro';

    return (
        <>
            <div className="body-p">
                {/* Mostramos error de eliminación si ocurrió */}
                {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>Error al eliminar: {error}</p>}

                <div className="card-p">
                    <div className="header-p">
                        <h1>Móvil Oficial</h1>
                    </div>
                    <div className="content-p">
                        <div className="vehicle-image-p">
                            {/* Fallback para imagen */}
                            <img
                                src={vehicle.thumbnail && vehicle.thumbnail.length > 0
                                    ? `${apiBaseURL}/uploads/${vehicle.thumbnail[0]}`
                                    : '/images/default-vehicle.png'}
                                alt={`${vehicle.marca} ${vehicle.modelo}`}
                            />
                        </div>
                        <div className="vehicle-info-p">
                            <p>DESTINO: {getLastEntry(vehicle.destino)}</p>
                            <p>AÑO: {vehicle.anio}</p>
                            <p>MARCA: {vehicle.marca}</p>
                            <p>MODELO: {vehicle.modelo}</p>
                            <p>TIPO: {vehicle.tipo}</p>
                            <p>CHASIS N°: {vehicle.chasis}</p>
                            <p>MOTOR N°: {vehicle.motor}</p>
                            <p>CEDULA N°: {vehicle.cedula}</p>
                            <p>KILOMETRAJE: {getLastEntry(vehicle.kilometros)}</p>
                        </div>
                    </div>
                    <div className="vehicle-description-p">
                        <h3>DESCRIPCIÓN DEL VEHÍCULO:</h3>
                        <input className="controls-p" type="text" value={getLastEntry(vehicle.description)} readOnly />
                    </div>
                    <div className="footer-p">
                        <div className="service-info-p">
                            <h4>ÚLTIMO SERVICE:</h4>
                            <input className="controls-p" type="text" value={getLastEntry(vehicle.service)} readOnly />
                        </div>
                        <div className="oil-change-info-p">
                            <h4>ÚLTIMO CAMBIO DE RODADO:</h4>
                            <input className="controls-p" type="text" value={getLastEntry(vehicle.rodado)} readOnly />
                        </div>
                    </div>
                    <div className="vehicle-description-p">
                        <h3>ÚLTIMAS REPARACIONES:</h3>
                        <table className="reparaciones-table">
                            <thead>
                                <tr>
                                    <th>Descripción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vehicle.reparaciones && vehicle.reparaciones.length > 0 ? (
                                    vehicle.reparaciones.slice(-5).reverse().map((reparacion, index) => (
                                        <tr key={index}>
                                            <td>{reparacion}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td>Sin reparaciones registradas.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="image-description-p">
                        <h4 className="h4-p">IMÁGENES:</h4>
                        <div className="img-div">
                            {/* Galería de imágenes */}
                            {vehicle.thumbnail && vehicle.thumbnail.slice(1).map((img, index) => (
                                <img className="img-p" src={`${apiBaseURL}/uploads/${img}`} alt={`Imagen ${index + 2}`} key={index} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="action-footer">
                    <Link to="/vehicle" className="action-btn btn-secondary">Volver</Link>
                    <button className="action-btn btn-secondary" onClick={() => window.print()}>Imprimir</button>
                    <Link to={`/vehicle-information/${vehicle._id}`} className="action-btn btn-primary">Ver Historial</Link>
                    <button className="action-btn btn-primary" onClick={handleEdit}>Editar</button>
                    {/* Botón llama a la nueva función handleDelete */}
                    <button className="action-btn destructive-btn" onClick={handleDelete}>Eliminar</button> 
                </div>
            </div>
        </>
    );
}

export default VehicleDetail;