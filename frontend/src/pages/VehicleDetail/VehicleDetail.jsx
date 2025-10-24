import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './VehicleDetail.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const VehicleDetail = () => {
    const { cid } = useParams();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const apiBaseURL = apiClient.defaults.baseURL;

    useEffect(() => {
        const fetchVehicleData = async () => {
            setError(null);
            try {
                const response = await apiClient.get(`/api/vehicle/${cid}`);
                setVehicle(response.data.vehicle);
            } catch (err) {
                if (!vehicle) {
                    setError(err.response?.data?.message || 'No se pudo cargar la información del vehículo.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchVehicleData();
    }, [cid, vehicle]); 

    const handleEdit = () => {
        navigate(`/eddit-vehicle/${cid}`);
    };

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
                setError(null);
                try {
                    await apiClient.delete(`/api/vehicle/${cid}`); 
                    MySwal.fire(
                        '¡Eliminado!',
                        'El vehículo ha sido eliminado.',
                        'success'
                    ).then(() => {
                         navigate('/vehicle');
                    });
                } catch (err) {
                    const errorMessage = err.response?.data?.message || 'No se pudo eliminar el vehículo.';
                    setError(errorMessage);
                    MySwal.fire('Error', `No se pudo eliminar el vehículo: ${errorMessage}`, 'error');
                }
            }
        });
    };
    const getLastHistoryEntry = (arr, fieldName = 'descripcion') => {
        if (!arr || arr.length === 0) return 'Sin registro';
        return arr[0][fieldName]; 
    };


    if (loading) return <p>Cargando información del vehículo...</p>;
    if (error && !vehicle) {
        return <p style={{ color: 'red' }}>Error al cargar: {error}</p>;
    }
    if (!vehicle) return <p>No se encontró el vehículo.</p>;

    const mainImageUrl = vehicle.thumbnails && vehicle.thumbnails.length > 0
        ? `${apiBaseURL}/uploads/${vehicle.thumbnails[0].url_imagen}` 
        : '/images/default-vehicle.png';

    return (
        <>
            <div className="body-p">
                {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}

                <div className="card-p">
                    <div className="header-p">
                        <h1>Móvil Oficial</h1>
                    </div>
                    <div className="content-p">
                        <div className="vehicle-image-p">
                            <img
                                src={mainImageUrl}
                                alt={`${vehicle.marca} ${vehicle.modelo}`}
                            />
                        </div>
                        <div className="vehicle-info-p">
                            <p>DESTINO: {getLastHistoryEntry(vehicle.destinos)}</p>
                            <p>AÑO: {vehicle.anio}</p>
                            <p>MARCA: {vehicle.marca}</p>
                            <p>MODELO: {vehicle.modelo}</p>
                            <p>TIPO: {vehicle.tipo}</p>
                            <p>CHASIS N°: {vehicle.chasis}</p>
                            <p>MOTOR N°: {vehicle.motor}</p>
                            <p>CEDULA N°: {vehicle.cedula}</p>
                            <p>KILOMETRAJE: {getLastHistoryEntry(vehicle.kilometrajes, 'kilometraje')}</p>
                        </div>
                    </div>
                    <div className="vehicle-description-p">
                        <h3>DESCRIPCIÓN DEL VEHÍCULO:</h3>
                        <input className="controls-p" type="text" value={getLastHistoryEntry(vehicle.descripciones)} readOnly />
                    </div>
                    <div className="footer-p">
                        <div className="service-info-p">
                            <h4>ÚLTIMO SERVICE:</h4>
                            <input className="controls-p" type="text" value={getLastHistoryEntry(vehicle.services)} readOnly />
                        </div>
                        <div className="oil-change-info-p">
                            <h4>ÚLTIMO CAMBIO DE RODADO:</h4>
                            <input className="controls-p" type="text" value={getLastHistoryEntry(vehicle.rodados)} readOnly />
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
                                    vehicle.reparaciones.map((reparacion) => (
                                        <tr key={reparacion.id}>
                                            <td>{reparacion.descripcion}</td>
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
                            {vehicle.thumbnails && vehicle.thumbnails.slice(1).map((img) => (
                                <img className="img-p" src={`${apiBaseURL}/uploads/${img.url_imagen}`} alt={`Imagen ${img.id}`} key={img.id} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="action-footer">
                    <Link to="/vehicle" className="action-btn btn-secondary">Volver</Link>
                    <button className="action-btn btn-secondary" onClick={() => window.print()}>Imprimir</button>
                    <Link to={`/vehicle-information/${vehicle.id}`} className="action-btn btn-primary">Ver Historial</Link>
                    <button className="action-btn btn-primary" onClick={handleEdit}>Editar</button>
                    <button className="action-btn destructive-btn" onClick={handleDelete}>Eliminar</button> 
                </div>
            </div>
        </>
    );
}

export default VehicleDetail;