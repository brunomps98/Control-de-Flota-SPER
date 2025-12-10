import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation, useOutletContext } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './VehicleDetail.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// Inicializamos Swal
const MySwal = withReactContent(Swal);

// Componente de historial
const HistorySection = ({ title, historyData, loading, error, fieldName = 'descripcion', unit = '', vehicleId, onDelete, historyType, onDeleteAll, fetchHistory, labelName, isAdmin }) => {

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) {
            return dateString;
        }
    };

    if (!historyData && !loading && !error) {
        return (
            <div className="history-section-placeholder">
                <p>Historial de {title.toLowerCase()}</p>
                <button className="btn-load-history" onClick={() => fetchHistory(historyType)}>
                    Cargar Historial
                </button>
            </div>
        );
    }

    // Avisos de carga de historial
    if (loading) return <div className="history-section loading"><p>Cargando {title.toLowerCase()}...</p></div>;
    if (error) return <div className="history-section error"><p style={{ color: 'red' }}>Error al cargar {title.toLowerCase()}: {error}</p></div>;
    if (!historyData || historyData.length === 0) return <div className="history-section empty"><p>Sin registros de {title.toLowerCase()}.</p></div>;

    return (
        <div className="history-section loaded">
            <div className="history-header">
                <h3>{title}</h3>
                {isAdmin && historyData && historyData.length > 0 && (
                    <button className="btn-history-delete-all" onClick={() => onDeleteAll(historyType)}>
                        Eliminar Todo
                    </button>
                )}
            </div>
            <table>
                <thead>
                    <tr>
                        <th style={{ width: (historyType === 'descripciones' || historyType === 'services' || historyType === 'rodados') ? 'auto' : '60%' }}>
                            {labelName || (fieldName === 'kilometraje' ? 'Kilometraje' : 'Descripción')} {unit}
                        </th>

                        {historyType !== 'descripciones' && historyType !== 'services' && historyType !== 'rodados' && <th>Fecha</th>}

                        {isAdmin && <th className="action-col">Borrar</th>}
                    </tr>
                </thead>
                <tbody>
                    {[...historyData].reverse().map((item) => (
                        <tr key={item.id}>
                            <td>{item[fieldName]}</td>

                            {historyType !== 'descripciones' && historyType !== 'services' && historyType !== 'rodados' && (
                                <td>
                                    {
                                        formatDate(
                                            item.created_at ||
                                            item.fecha_registro ||
                                            item.fecha_service ||
                                            item.fecha_reparacion ||
                                            item.fecha_destino ||
                                            item.fecha_rodado
                                        )
                                    }
                                </td>
                            )}
                            {isAdmin && (
                                <td className="action-col">
                                    <button
                                        className="btn-history-delete-one"
                                        onClick={() => onDelete(item.id, historyType)}
                                        title="Eliminar este registro"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Componente principal
const VehicleDetail = () => {
    const { cid } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const { user } = useOutletContext();

    const [vehicle, setVehicle] = useState(null);
    const [loadingVehicle, setLoadingVehicle] = useState(true);
    const [errorVehicle, setErrorVehicle] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    // Estados para historiales
    const [kilometrajes, setKilometrajes] = useState({ data: null, loading: false, error: null });
    const [services, setServices] = useState({ data: null, loading: false, error: null });
    const [reparaciones, setReparaciones] = useState({ data: null, loading: false, error: null });
    const [destinos, setDestinos] = useState({ data: null, loading: false, error: null });
    const [rodados, setRodados] = useState({ data: null, loading: false, error: null });
    const [descripciones, setDescripciones] = useState({ data: null, loading: false, error: null });

    // Carga de datos de vehiculos
    const fetchVehicleData = async () => {
        setErrorVehicle(null);
        setLoadingVehicle(true);
        try {
            // Esperamos los datos del vehiculo
            const response = await apiClient.get(`/api/vehicle/${cid}`);
            const vehiclePayload = response.data.vehicle ? response.data.vehicle : response.data;
            setVehicle(vehiclePayload);

            if (vehiclePayload.thumbnails && vehiclePayload.thumbnails.length > 0) {
                // Mostramos las imagenes de la DB
                setSelectedImage(vehiclePayload.thumbnails[0].url_imagen);
            } else {
                // Y sino mostramos una imagen por defecto
                setSelectedImage("https://via.placeholder.com/800x600.png?text=Sin+Imagen");
            }

        } catch (err) {
            // Mnesaje de error si no se pudo obtener la información del vehiculo
            setErrorVehicle(err.response?.data?.message || 'No se pudo cargar la información del vehículo.');
        } finally {
            setLoadingVehicle(false);
        }
    };

    useEffect(() => {
        fetchVehicleData();
    }, [cid, location.key]);

    // Carga de historiales del vehiculo
    const historyStateSetters = {
        kilometrajes: setKilometrajes,
        services: setServices,
        reparaciones: setReparaciones,
        destinos: setDestinos,
        rodados: setRodados,
        descripciones: setDescripciones,
    };

    const fetchHistory = async (historyType) => {
        const stateSetter = historyStateSetters[historyType];
        if (!stateSetter) return;

        stateSetter(prev => ({ ...prev, loading: true, error: null }));
        try {
            // Intentamos traer el historial del vehiculo
            const response = await apiClient.get(`/api/vehicle/${cid}/${historyType}`);
            const historyArray = response.data.history ? response.data.history : response.data;
            stateSetter({ data: historyArray, loading: false, error: null });

        } catch (err) {
            // Y sino mostramos error
            stateSetter({ data: null, loading: false, error: err.response?.data?.message || `Error cargando ${historyType}` });
        }
    };

    useEffect(() => {
        if (!cid) return;
        fetchHistory('kilometrajes');
        fetchHistory('descripciones');
        fetchHistory('destinos');
        fetchHistory('services');
        fetchHistory('reparaciones');
        fetchHistory('rodados');
    }, [cid, location.key]);

    // Acciones
    
    // Editar vehiculo (redirección a eddit-vehicle)
    const handleEdit = () => navigate(`/eddit-vehicle/${cid}`);

    // Eliminar vehiculo
    const handleDeleteVehicle = () => {
        MySwal.fire({
            // Confirmación
            title: '¿Estás seguro?',
            text: "¡Vas a eliminar este vehículo! No podrás revertir esto.",
            icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Sí, ¡eliminar!', cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                setErrorVehicle(null);
                try {
                    // Mostramos mensaje de exito
                    await apiClient.delete(`/api/vehicle/${cid}`);
                    MySwal.fire('¡Eliminado!', 'El vehículo ha sido eliminado.', 'success')
                        .then(() => navigate('/vehicle'));
                } catch (err) {
                    // Y sino mostramos mensaje de error
                    const errorMessage = err.response?.data?.message || 'No se pudo eliminar el vehículo.';
                    setErrorVehicle(errorMessage);
                    MySwal.fire('Error', `No se pudo eliminar el vehículo: ${errorMessage}`, 'error');
                }
            }
        });
    };

    // Función eliminar todo el historial del vehiculo
    const handleDeleteAllHistory = (historyType) => {
        const stateSetter = historyStateSetters[historyType];
        MySwal.fire({
            // Confirmación para hacerlo
            title: '¿Estás seguro?',
            text: `Vas a eliminar TODO el historial de "${historyType}". ¡No podrás revertir esto!`,
            icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Sí, ¡eliminar!', cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                stateSetter(prev => ({ ...prev, error: null }));
                try {
                    // Esperamos confirmación del backend
                    await apiClient.delete(`/api/vehicle/${cid}/history/all/${historyType}`);
                    // Mostramos mensaje de exito al eliminar historial
                    MySwal.fire('¡Eliminado!', `El historial de ${historyType} ha sido eliminado.`, 'success');
                    stateSetter({ data: null, loading: false, error: null });
                    fetchVehicleData();
                } catch (err) {
                    // Y sino mostramos error
                    MySwal.fire('Error', 'No se pudo eliminar el historial.', 'error');
                }
            }
        });
    };

    // Función para eliminar un solo registro del historial
    const handleDeleteOneHistoryEntry = (historyId, historyType) => {
        const stateSetter = historyStateSetters[historyType];
        MySwal.fire({
            // Mostramos confirmación al usuario
            title: '¿Eliminar este registro?',
            text: "Esta acción es irreversible.",
            icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Sí, ¡eliminar!', cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                stateSetter(prev => ({ ...prev, error: null }));
                try {
                    // Esperamos confirmación del backend
                    await apiClient.delete(`/api/vehicle/${cid}/history/${historyType}/${historyId}`);
                    // Mostramos mensaje de exito si se borró correctamente
                    MySwal.fire('¡Eliminado!', 'El registro ha sido eliminado.', 'success');
                    fetchHistory(historyType);
                } catch (err) {
                    // Y sino mostramos mensaje de error
                    const errorMessage = err.response?.data?.message || 'No se pudo eliminar el registro.';
                    stateSetter(prev => ({ ...prev, error: errorMessage }));
                    MySwal.fire('Error', `No se pudo eliminar: ${errorMessage}`, 'error');
                }
            }
        });
    };

    // UseEffect de Capacitor
    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;
        const handleBackButton = () => navigate('/vehicle');
        const listener = App.addListener('backButton', handleBackButton);
        return () => listener.remove();
    }, [navigate]);

    // Helper para obtener el último valor del historial de vehiculo
    const getLatestValue = (historyState, fieldName, fallbackValue) => {
        if (historyState.data && historyState.data.length > 0) {
            return historyState.data[historyState.data.length - 1][fieldName];
        }
        const vehicleHistory = vehicle[historyState.historyKey];
        if (vehicleHistory && vehicleHistory.length > 0) {
            return vehicleHistory[vehicleHistory.length - 1][fieldName];
        }
        // Y sino retornamos un fallback con nada
        return fallbackValue || 'N/A';
    };

    // Renderizado condicional de carga o error
    if (loadingVehicle) {
        return (
            <div className="login-page">
                <div className="vehicle-detail-main">
                    <p className="detail-loading-message">Cargando información del vehículo...</p>
                </div>
            </div>
        );
    }

    if (errorVehicle && !vehicle) {
        return (
            <div className="login-page">
                <div className="vehicle-detail-main">
                    <p className="detail-error-message">Error al cargar: {errorVehicle}</p>
                </div>
            </div>
        );
    }

    if (!vehicle) {
        return (
            <div className="login-page">
                <div className="vehicle-detail-main">
                    <p className="detail-loading-message">No se encontró el vehículo.</p>
                </div>
            </div>
        );
    }

    // Preparación de datos para renderizar
    const allImages = vehicle.thumbnails || [];
    kilometrajes.historyKey = 'kilometrajes';
    descripciones.historyKey = 'descripciones';
    destinos.historyKey = 'destinos';
    const latestChofer = getLatestValue(descripciones, 'descripcion', vehicle.chofer);
    const latestKilometraje = getLatestValue(kilometrajes, 'kilometraje', vehicle.kilometros);
    const latestDestino = getLatestValue(destinos, 'descripcion', vehicle.destino);

    return (
        <div className="login-page">
            <main className="vehicle-detail-main">

                <h1 className="vehicle-main-title">{vehicle.marca} {vehicle.modelo}</h1>
                <p className="vehicle-main-subtitle">{vehicle.title}</p>

                {errorVehicle && <p className="detail-error-message" style={{ marginBottom: '15px' }}>{errorVehicle}</p>}

                <div className="detail-header-grid">

                    <div className="gallery-container">
                        <div className="main-image-wrapper">
                            <img src={selectedImage} alt="Vehículo principal" className="main-image" />
                        </div>
                        {allImages.length > 1 && (
                            <div className="thumbnail-list">
                                {allImages.map((imgObj) => (
                                    <img
                                        src={imgObj.url_imagen}
                                        alt={`Miniatura ${imgObj.id}`}
                                        key={imgObj.id}
                                        className={`thumbnail-image ${selectedImage === imgObj.url_imagen ? 'selected' : ''}`}
                                        onClick={() => setSelectedImage(imgObj.url_imagen)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="info-actions-container">
                        <div className="info-card">
                            <h2>Ficha del Vehículo</h2>

                            <p><strong>Subido por:</strong>
                                <span>
                                    {vehicle.owner ? (
                                        <Link to={`/profile/${vehicle.owner.id}`} className="creator-link">
                                            {vehicle.owner.username}
                                        </Link>
                                    ) : (
                                        <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Desconocido</span>
                                    )}
                                </span>
                            </p>

                            <p><strong>Dominio:</strong> <span>{vehicle.dominio}</span></p>
                            <p><strong>Año:</strong> <span>{vehicle.anio}</span></p>

                            <p><strong>Kilometraje:</strong> <span>{latestKilometraje} km</span></p>
                            <p><strong>Destino:</strong> <span>{latestDestino}</span></p>
                            <p><strong>Chofer:</strong> <span>{latestChofer}</span></p>

                            <p><strong>Establecimiento:</strong> <span>{vehicle.title}</span></p>
                            <p><strong>Tipo:</strong> <span>{vehicle.tipo}</span></p>
                            <hr />
                            <p><strong>Chasis N°:</strong> <span>{vehicle.chasis}</span></p>
                            <p><strong>Motor N°:</strong> <span>{vehicle.motor}</span></p>
                            <p><strong>Cédula N°:</strong> <span>{vehicle.cedula}</span></p>
                        </div>

                        <div className="actions-card">
                            <h2>Acciones</h2>
                            <Link to="/vehicle" className="btn-action btn-secondary">Volver a Lista</Link>
                            <button className="btn-action btn-secondary" onClick={() => window.print()}>Imprimir</button>

                            <button className="btn-action btn-primary" onClick={handleEdit}>Añadir Historial</button>

                            {user && user.admin && (
                                <button className="btn-action btn-destructive" onClick={handleDeleteVehicle}>Eliminar Vehículo</button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="history-grid-title">
                    <h2>Historiales del Móvil</h2>
                </div>
                <div className="history-grid">
                    <HistorySection
                        title="Kilometraje"
                        historyData={kilometrajes.data}
                        loading={kilometrajes.loading}
                        error={kilometrajes.error}
                        fieldName="kilometraje" unit="km"
                        historyType="kilometrajes"
                        onDelete={handleDeleteOneHistoryEntry}
                        onDeleteAll={handleDeleteAllHistory}
                        fetchHistory={fetchHistory}
                        isAdmin={user?.admin}
                    />
                    <HistorySection
                        title="Services"
                        historyData={services.data}
                        loading={services.loading}
                        error={services.error}
                        fieldName="descripcion"
                        labelName="Fecha de Service"
                        historyType="services"
                        onDelete={handleDeleteOneHistoryEntry}
                        onDeleteAll={handleDeleteAllHistory}
                        fetchHistory={fetchHistory}
                        isAdmin={user?.admin}
                    />
                    <HistorySection
                        title="Reparaciones"
                        historyData={reparaciones.data}
                        loading={reparaciones.loading}
                        error={reparaciones.error}
                        fieldName="descripcion"
                        historyType="reparaciones"
                        onDelete={handleDeleteOneHistoryEntry}
                        onDeleteAll={handleDeleteAllHistory}
                        fetchHistory={fetchHistory}
                        isAdmin={user?.admin}
                    />
                    <HistorySection
                        title="Destinos"
                        historyData={destinos.data}
                        loading={destinos.loading}
                        error={destinos.error}
                        fieldName="descripcion"
                        historyType="destinos"
                        onDelete={handleDeleteOneHistoryEntry}
                        onDeleteAll={handleDeleteAllHistory}
                        fetchHistory={fetchHistory}
                        isAdmin={user?.admin}
                    />
                    <HistorySection
                        title="Rodados"
                        historyData={rodados.data}
                        loading={rodados.loading}
                        error={rodados.error}
                        fieldName="descripcion"
                        labelName="Fecha de Rodado"
                        historyType="rodados"
                        onDelete={handleDeleteOneHistoryEntry}
                        onDeleteAll={handleDeleteAllHistory}
                        fetchHistory={fetchHistory}
                        isAdmin={user?.admin}
                    />
                    <HistorySection
                        title="Historial de Choferes"
                        historyData={descripciones.data}
                        loading={descripciones.loading}
                        error={descripciones.error}
                        fieldName="descripcion"
                        labelName="Chofer"
                        historyType="descripciones"
                        onDelete={handleDeleteOneHistoryEntry}
                        onDeleteAll={handleDeleteAllHistory}
                        fetchHistory={fetchHistory}
                        isAdmin={user?.admin}
                    />
                </div>
            </main>
        </div>
    );
}

export default VehicleDetail;