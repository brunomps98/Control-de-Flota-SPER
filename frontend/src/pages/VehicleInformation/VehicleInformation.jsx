import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './VehicleInformation.css';
import logoSper from '../../assets/images/logo.png';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const VehicleInformation = () => {
    const { cid } = useParams();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const apiBaseURL = apiClient.defaults.baseURL;

    const fetchVehicle = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/api/vehicle/${cid}`);
            setVehicle(response.data.vehicle);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo encontrar el vehículo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicle();
    }, [cid]);

    const handleDeleteLastEntry = (fieldName) => {
        MySwal.fire({
            title: '¿Estás seguro?',
            text: `Vas a eliminar el último registro de "${fieldName}". ¡No podrás revertir esto!`,
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
                    await apiClient.delete(`/api/vehicle/${cid}/history/${fieldName}`);
                    MySwal.fire(
                        '¡Eliminado!',
                        `El último registro de ${fieldName} ha sido eliminado.`,
                        'success'
                    );
                    fetchVehicle(); 
                } catch (err) {
                    const errorMessage = err.response?.data?.message || 'No se pudo eliminar el registro.';
                    setError(errorMessage);
                    MySwal.fire('Error', `No se pudo eliminar el registro: ${errorMessage}`, 'error');
                }
            }
        });
    };

    if (loading) return <p>Cargando historial del vehículo...</p>;
    if (error && !vehicle) return <p style={{ color: 'red' }}>Error al cargar: {error}</p>;
    if (!vehicle) return <p>No se encontró el vehículo.</p>;

    const mainImageUrl = vehicle.thumbnails && vehicle.thumbnails.length > 0
        ? `${apiBaseURL}/uploads/${vehicle.thumbnails[0].url_imagen}`
        : '/images/default-vehicle.png';

    return (
        <>
            <main>
                <div className="body-p">
                    {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>Error: {error}</p>}

                    <div className="card-p">
                        <div className="header-p">
                            <h1>Ficha de Mantenimiento</h1>
                            <img className="logo-dtail" src={logoSper} alt="Logo SPER" />
                        </div>
                        <div className="content-p">
                            <div className="vehicle-image-p">
                                <img
                                    src={mainImageUrl}
                                    alt={`${vehicle.marca} ${vehicle.modelo}`}
                                />
                            </div>
                            <div className="vehicle-info-p">
                                <p>UNIDAD: {vehicle.title}</p>
                                <p>MARCA: {vehicle.marca}</p>
                                <p>MODELO: {vehicle.modelo}</p>
                                <p>AÑO: {vehicle.anio}</p>
                                <p>DOMINIO: {vehicle.dominio}</p>
                            </div>
                        </div>


                        <div className="history-card">
                            <h4>Historial de Kilometraje</h4>
                            <ul className="history-list">
                                {vehicle.kilometrajes.length > 0 ? (
                                    // 'kmEntry' es un objeto, no un número
                                    vehicle.kilometrajes.map((kmEntry, index) => (
                                        <li key={kmEntry.id}> {/* Usamos el ID del objeto como key */}
                                            {/* Mostramos el campo 'kilometraje' del objeto */}
                                            Registro #{index + 1}: <strong>{kmEntry.kilometraje} km</strong>
                                            {index === 0 && (
                                                <button className="delete-history-btn" onClick={() => handleDeleteLastEntry('kilometros')} title="Eliminar último registro">🗑️</button>
                                            )}
                                        </li>
                                    ))
                                ) : (
                                    <li>No hay registros de kilometraje.</li>
                                )}
                            </ul>
                        </div>
                        
                        <div className="history-card">
                            <h4>Historial de Services</h4>
                            <ul className="history-list">
                                {vehicle.services.length > 0 ? (
                                    vehicle.services.map((item, index) => (
                                        <li key={item.id}> {/* Usamos item.id como key */}
                                            Registro #{index + 1}: <strong>{item.descripcion}</strong>
                                            {index === 0 && ( // El más nuevo es el índice 0
                                                <button className="delete-history-btn" onClick={() => handleDeleteLastEntry('service')} title="Eliminar último registro">🗑️</button>
                                            )}
                                        </li>
                                    ))
                                ) : (
                                    <li>No hay registros de services.</li>
                                )}
                            </ul>
                        </div>
                        
                        <div className="history-card">
                            <h4>Historial de Cambio de Rodado</h4>
                            <ul className="history-list">
                                {vehicle.rodados.length > 0 ? (
                                    vehicle.rodados.map((item, index) => (
                                        <li key={item.id}>
                                            Registro #{index + 1}: <strong>{item.descripcion}</strong>
                                            {index === 0 && (
                                                <button className="delete-history-btn" onClick={() => handleDeleteLastEntry('rodado')} title="Eliminar último registro">🗑️</button>
                                            )}
                                        </li>
                                    ))
                                ) : (
                                    <li>No hay registros de cambio de rodado.</li>
                                )}
                            </ul>
                        </div>

                        <div className="history-card">
                            <h4>Historial de Reparaciones</h4>
                            <ul className="history-list">
                                {vehicle.reparaciones.length > 0 ? (
                                    vehicle.reparaciones.map((item, index) => (
                                        <li key={item.id}>
                                            Registro #{index + 1}: <strong>{item.descripcion}</strong>
                                            {index === 0 && (
                                                <button className="delete-history-btn" onClick={() => handleDeleteLastEntry('reparaciones')} title="Eliminar último registro">🗑️</button>
                                            )}
                                        </li>
                                    ))
                                ) : (
                                    <li>No hay reparaciones registradas.</li>
                                )}
                            </ul>
                        </div>

                        <div className="history-card">
                            <h4>Historial de Descripciones del Vehículo</h4>
                            <ul className="history-list">
                                {vehicle.descripciones.length > 0 ? (
                                    vehicle.descripciones.map((item, index) => (
                                        <li key={item.id}>
                                            Registro #{index + 1}: <strong>{item.descripcion}</strong>
                                            {index === 0 && (
                                                <button className="delete-history-btn" onClick={() => handleDeleteLastEntry('description')} title="Eliminar último registro">🗑️</button>
                                            )}
                                        </li>
                                    ))
                                ) : (
                                    <li>No hay descripciones guardadas.</li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="buttons-impre">
                        <Link to={`/vehicle-detail/${vehicle.id}`} className="signup-btn3">Volver a la Ficha</Link>
                        <Link to={`/eddit-vehicle/${vehicle.id}`} className="signup-btn3">Editar</Link>
                    </div>
                </div>
            </main>
        </>
    );
}

export default VehicleInformation;