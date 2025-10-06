import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../../api/axiosConfig';
import './VehicleDetail.css';

const VehicleDetail = () => {
    // --- HOOKS ---
    const { cid } = useParams();
    const navigate = useNavigate();

    // --- ESTADOS ---
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- CARGA DE DATOS CON AXIOS ---
    useEffect(() => {
        const fetchVehicleData = async () => {
            try {
                const response = await apiClient.get(`/api/vehicle/${cid}`);
                setVehicle(response.data.vehicle);
            } catch (err) {
                setError(err.response?.data?.message || 'No se pudo cargar la información del vehículo.');
            } finally {
                setLoading(false);
            }
        };
        fetchVehicleData();
    }, [cid]);

    // --- LÓGICA DE NAVEGACIÓN Y ELIMINACIÓN CON AXIOS ---
    const handleEdit = () => {
        navigate(`/eddit-vehicle/${cid}`);
    };

    const handleDelete = async () => {
        if (window.confirm('¿Estás seguro de que querés eliminar este vehículo?')) {
            try {
                // 3. Usamos apiClient.delete para la petición de borrado.
                await apiClient.delete(`/api/vehicle/${cid}`);
                navigate('/vehicle'); // Redirigimos si la eliminación fue exitosa
            } catch (err) {
                setError(err.response?.data?.message || 'No se pudo eliminar el vehículo.');
            }
        }
    };

    // --- RENDERIZADO ---
    if (loading) return <p>Cargando información del vehículo...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
    if (!vehicle) return <p>No se encontró el vehículo.</p>;

    const getLastEntry = (arr) => arr && arr.length > 0 ? arr[arr.length - 1] : 'Sin registro';

    return (
        <>
            <div className="body-p">
                <div className="card-p">
                    <div className="header-p">
                        <h1>Móvil Oficial</h1>
                    </div>
                    <div className="content-p">
                        <div className="vehicle-image-p">
                            <img src={`${import.meta.env.VITE_API_URL}/uploads/${vehicle.thumbnail[0]}`} alt={`${vehicle.marca} ${vehicle.modelo}`} />
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
                            {vehicle.thumbnail && vehicle.thumbnail.slice(1).map((img, index) => (
                                <img className="img-p" src={`${import.meta.env.VITE_API_URL}/uploads/${img}`} alt={`Imagen ${index + 2}`} key={index} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="action-footer">
                    <Link to="/vehicle" className="action-btn btn-secondary">Volver</Link>
                    <button className="action-btn btn-secondary" onClick={() => window.print()}>Imprimir</button>
                    <Link to={`/vehicle-information/${vehicle._id}`} className="action-btn btn-primary">Ver Historial</Link>
                    <button className="action-btn btn-primary" onClick={handleEdit}>Editar</button>
                    <button className="action-btn destructive-btn" onClick={handleDelete}>Eliminar</button>
                </div>
            </div>
        </>
    );
}

export default VehicleDetail;