import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../../../api/axiosConfig';
import './VehicleInformation.css';
import logoSper from '../../assets/images/logo.png';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// Initialize SweetAlert for React
const MySwal = withReactContent(Swal);

const VehicleInformation = () => {
    // --- HOOKS Y ESTADOS ---
    const { cid } = useParams();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // OBTÉNIENDO LA URL BASE DINÁMICA
    const apiBaseURL = apiClient.defaults.baseURL;

    // --- CARGA DE DATOS CON AXIOS ---
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

    // --- ELIMINAR REGISTRO CON SWEETALERT Y AXIOS ---
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
                // Limpiamos errores previos antes de intentar
                setError(null);
                try {
                    await apiClient.delete(`/api/vehicle/${cid}/history/${fieldName}`);
                    // Mostramos éxito y recargamos datos
                    MySwal.fire(
                        '¡Eliminado!',
                        `El último registro de ${fieldName} ha sido eliminado.`,
                        'success'
                    );
                    fetchVehicle(); // Recargamos para ver el cambio
                } catch (err) {
                    // Guardamos el error para mostrarlo
                    const errorMessage = err.response?.data?.message || 'No se pudo eliminar el registro.';
                    setError(errorMessage);
                    MySwal.fire(
                        'Error',
                        `No se pudo eliminar el registro: ${errorMessage}`,
                        'error'
                    );
                }
            }
        });
    };

    // --- RENDERIZADO  ---
    if (loading) return <p>Cargando historial del vehículo...</p>;
    // Mostramos error si hubo un problema al cargar O al eliminar
    if (error && !vehicle) return <p style={{ color: 'red' }}>Error al cargar: {error}</p>; // Error principal si no carga
    if (!vehicle) return <p>No se encontró el vehículo.</p>;

    return (
        <>
            <main>
                <div className="body-p">
                    {/* Mostramos error de eliminación si ocurrió */}
                    {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>Error al eliminar: {error}</p>}

                    <div className="card-p">
                        <div className="header-p">
                            <h1>Ficha de Mantenimiento</h1>
                            <img className="logo-dtail" src={logoSper} alt="Logo SPER" />
                        </div>
                        <div className="content-p">
                            <div className="vehicle-image-p">
                                <img
                                    src={vehicle.thumbnail && vehicle.thumbnail.length > 0
                                        ? `${apiBaseURL}/uploads/${vehicle.thumbnail[0]}`
                                        : '/images/default-vehicle.png'}
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
                                {vehicle.kilometros.length > 0 ? (
                                    vehicle.kilometros.map((km, index) => (
                                        <li key={index}>
                                            Registro #{index + 1}: <strong>{km} km</strong>
                                            {index === vehicle.kilometros.length - 1 && (
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
                                {vehicle.service.length > 0 ? (
                                    vehicle.service.map((item, index) => (
                                        <li key={index}>
                                            Registro #{index + 1}: <strong>{item}</strong>
                                            {index === vehicle.service.length - 1 && (
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
                                {vehicle.rodado.length > 0 ? (
                                    vehicle.rodado.map((item, index) => (
                                        <li key={index}>
                                            Registro #{index + 1}: <strong>{item}</strong>
                                            {index === vehicle.rodado.length - 1 && (
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
                                        <li key={index}>
                                            Registro #{index + 1}: <strong>{item}</strong>
                                            {index === vehicle.reparaciones.length - 1 && (
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
                                {vehicle.description.length > 0 ? (
                                    vehicle.description.map((item, index) => (
                                        <li key={index}>
                                            Registro #{index + 1}: <strong>{item}</strong>
                                            {index === vehicle.description.length - 1 && (
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
                        <Link to={`/vehicle-detail/${vehicle._id}`} className="signup-btn3">Volver a la Ficha</Link>
                        <Link to={`/eddit-vehicle/${vehicle._id}`} className="signup-btn3">Editar</Link>
                    </div>
                </div>
            </main>
        </>
    );
}

export default VehicleInformation;