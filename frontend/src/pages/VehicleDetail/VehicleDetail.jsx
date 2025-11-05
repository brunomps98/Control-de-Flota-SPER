import React, { useState, useEffect } from 'react';
// CAMBIO 1: Importamos useLocation
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './VehicleDetail.css'; 
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { App } from '@capacitor/app'; 
import { Capacitor } from '@capacitor/core';

const MySwal = withReactContent(Swal);

// --- COMPONENTE DE HISTORIAL (Sin cambios) ---
const HistorySection = ({ title, historyData, loading, error, fieldName = 'descripcion', unit = '', vehicleId, onDelete, historyType, onDeleteAll, fetchHistory, labelName }) => {
    
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

    if (loading) return <div className="history-section loading"><p>Cargando {title.toLowerCase()}...</p></div>;
    if (error) return <div className="history-section error"><p style={{ color: 'red' }}>Error al cargar {title.toLowerCase()}: {error}</p></div>;
    if (!historyData || historyData.length === 0) return <div className="history-section empty"><p>Sin registros de {title.toLowerCase()}.</p></div>;

    return (
        <div className="history-section loaded">
            <div className="history-header">
                <h3>{title}</h3>
                {historyData && historyData.length > 0 && (
                    <button className="btn-history-delete-all" onClick={() => onDeleteAll(historyType)}>
                        Eliminar Todo
                    </button>
                )}
            </div>
            <table>
                <thead>
                    <tr>
                        <th style={{ width: historyType === 'descripciones' ? 'auto' : '60%' }}>
                            {labelName || (fieldName === 'kilometraje' ? 'Kilometraje' : 'Descripción')} {unit}
                        </th>
                        
                        {historyType !== 'descripciones' && <th>Fecha</th>}
                        
                        <th className="action-col">Borrar</th>
                    </tr>
                </thead>
                <tbody>
                    {[...historyData].reverse().map((item) => (
                        <tr key={item.id}>
                            <td>{item[fieldName]}</td>
                            
                            {historyType !== 'descripciones' && (
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

                            <td className="action-col">
                                <button
                                    className="btn-history-delete-one"
                                    onClick={() => onDelete(item.id, historyType)}
                                    title="Eliminar este registro"
                                >
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


const VehicleDetail = () => {
    // --- ESTADOS ---
    const { cid } = useParams();
    const navigate = useNavigate();
    // CAMBIO 2: Obtenemos la 'location'
    const location = useLocation(); 
    const [vehicle, setVehicle] = useState(null);
    const [loadingVehicle, setLoadingVehicle] = useState(true);
    const [errorVehicle, setErrorVehicle] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    const [kilometrajes, setKilometrajes] = useState({ data: null, loading: false, error: null });
    const [services, setServices] = useState({ data: null, loading: false, error: null });
    const [reparaciones, setReparaciones] = useState({ data: null, loading: false, error: null });
    const [destinos, setDestinos] = useState({ data: null, loading: false, error: null });
    const [rodados, setRodados] = useState({ data: null, loading: false, error: null });
    const [descripciones, setDescripciones] = useState({ data: null, loading: false, error: null });


    const fetchVehicleData = async () => {
        setErrorVehicle(null);
        setLoadingVehicle(true);
        try {
            const response = await apiClient.get(`/api/vehicle/${cid}`);
            // Si el backend devuelve { vehicle: {...} }
            // o devuelve directamente el objeto, manejamos ambos casos:
            const vehiclePayload = response.data.vehicle ? response.data.vehicle : response.data;
            setVehicle(vehiclePayload);
            
            if (vehiclePayload.thumbnails && vehiclePayload.thumbnails.length > 0) {
                setSelectedImage(vehiclePayload.thumbnails[0].url_imagen);
            } else {
                setSelectedImage("https://via.placeholder.com/800x600.png?text=Sin+Imagen"); 
            }
            
        } catch (err) {
            setErrorVehicle(err.response?.data?.message || 'No se pudo cargar la información del vehículo.');
        } finally {
            setLoadingVehicle(false);
        }
    };

    // CAMBIO 3: Añadimos 'location.key' a las dependencias.
    // Esto fuerza el re-fetch CADA VEZ que navegamos a esta página
    // (ej. al volver de 'EdditVehicle').
    useEffect(() => {
        fetchVehicleData();
    }, [cid, location.key]); 

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
            const response = await apiClient.get(`/api/vehicle/${cid}/${historyType}`);
            // Manejo flexible: algunos endpoints devuelven .history u otros directamente la array
            const historyArray = response.data.history ? response.data.history : response.data;
            stateSetter({ data: historyArray, loading: false, error: null });
            
            // CAMBIO 4: Eliminamos 'fetchVehicleData()' de aquí.
            // Ya no es necesario y causaba el parpadeo de la página.

        } catch (err) {
            stateSetter({ data: null, loading: false, error: err.response?.data?.message || `Error cargando ${historyType}` });
        }
    };

    // NUEVO: Al montar / al volver a esta ruta, cargamos los historiales
    useEffect(() => {
        // Solo llamamos si hay un cid válido
        if (!cid) return;
        fetchHistory('kilometrajes');
        fetchHistory('descripciones');
        fetchHistory('destinos');
        fetchHistory('services');
        fetchHistory('reparaciones');
        fetchHistory('rodados');
    }, [cid, location.key]);


    // --- LÓGICA DE BOTONES (Sin cambios) ---
    const handleEdit = () => navigate(`/eddit-vehicle/${cid}`);

    const handleDeleteVehicle = () => {
        MySwal.fire({
            title: '¿Estás seguro?',
            text: "¡Vas a eliminar este vehículo! No podrás revertir esto.",
            icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Sí, ¡eliminar!', cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                setErrorVehicle(null);
                try {
                    await apiClient.delete(`/api/vehicle/${cid}`);
                    MySwal.fire('¡Eliminado!', 'El vehículo ha sido eliminado.', 'success')
                        .then(() => navigate('/vehicle'));
                } catch (err) {
                    const errorMessage = err.response?.data?.message || 'No se pudo eliminar el vehículo.';
                    setErrorVehicle(errorMessage);
                    MySwal.fire('Error', `No se pudo eliminar el vehículo: ${errorMessage}`, 'error');
                }
            }
        });
    };

    const handleDeleteAllHistory = (historyType) => {
        const stateSetter = historyStateSetters[historyType];
        MySwal.fire({
            title: '¿Estás seguro?',
            text: `Vas a eliminar TODO el historial de "${historyType}". ¡No podrás revertir esto!`,
            icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Sí, ¡eliminar!', cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                stateSetter(prev => ({ ...prev, error: null }));
                try {
                    await apiClient.delete(`/api/vehicle/${cid}/history/all/${historyType}`);
                    MySwal.fire('¡Eliminado!', `El historial de ${historyType} ha sido eliminado.`, 'success');
                    stateSetter({ data: null, loading: false, error: null }); 
                    fetchVehicleData(); // Refrescamos la ficha (esto está bien)
                } catch (err) {
                    MySwal.fire('Error', 'No se pudo eliminar el historial.', 'error');
                }
            }
        });
    };

    const handleDeleteOneHistoryEntry = (historyId, historyType) => {
        const stateSetter = historyStateSetters[historyType];
        MySwal.fire({
            title: '¿Eliminar este registro?',
            text: "Esta acción es irreversible.",
            icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Sí, ¡eliminar!', cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                stateSetter(prev => ({ ...prev, error: null }));
                try {
                    await apiClient.delete(`/api/vehicle/${cid}/history/${historyType}/${historyId}`);
                    MySwal.fire('¡Eliminado!', 'El registro ha sido eliminado.', 'success');
                    fetchHistory(historyType); // Refresca solo este historial
                } catch (err) {
                    const errorMessage = err.response?.data?.message || 'No se pudo eliminar el registro.';
                    stateSetter(prev => ({ ...prev, error: errorMessage }));
                    MySwal.fire('Error', `No se pudo eliminar: ${errorMessage}`, 'error');
                }
            }
        });
    };

     useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;
        const handleBackButton = () => navigate('/vehicle');
        const listener = App.addListener('backButton', handleBackButton);
        return () => listener.remove();
    }, [navigate]);


    if (loadingVehicle) return <div className="vehicle-page-container"><p className="detail-loading-message">Cargando información del vehículo...</p></div>;
    if (errorVehicle && !vehicle) return <div className="vehicle-page-container"><p className="detail-error-message">Error al cargar: {errorVehicle}</p></div>;
    if (!vehicle) return <div className="vehicle-page-container"><p className="detail-loading-message">No se encontró el vehículo.</p></div>;

    const allImages = vehicle.thumbnails || [];

    // --- LÓGICA DE "LATEST" (MODIFICADA: prioriza los historiales cargados en estado) ---
    const getLatestHistory = (historyArray, fieldName) => {
        if (historyArray && historyArray.length > 0) {
            return historyArray[historyArray.length - 1][fieldName];
        }
        return null; 
    };

    // Priorizar datos cargados en estado (por ejemplo luego de editar desde EdditVehicle),
    // si no existen, fallback a vehicle.<historyArray> (respuesta del backend), y finalmente al campo directo.
    const latestChofer =
        (descripciones.data && descripciones.data.length > 0)
            ? getLatestHistory(descripciones.data, 'descripcion')
            : (getLatestHistory(vehicle.descripciones, 'descripcion') || vehicle.chofer || 'Sin asignar');

    const latestKilometraje =
        (kilometrajes.data && kilometrajes.data.length > 0)
            ? getLatestHistory(kilometrajes.data, 'kilometraje')
            : (getLatestHistory(vehicle.kilometrajes, 'kilometraje') || vehicle.kilometros || 'N/A');

    const latestDestino =
        (destinos.data && destinos.data.length > 0)
            ? getLatestHistory(destinos.data, 'descripcion')
            : (getLatestHistory(vehicle.destinos, 'descripcion') || vehicle.destino || 'N/A');


    return (
        <div className="vehicle-page-container">
            <main className="vehicle-detail-main">
                
                <h1 className="vehicle-main-title">{vehicle.marca} {vehicle.modelo}</h1>
                <p className="vehicle-main-subtitle">{vehicle.title}</p>

                {errorVehicle && <p className="detail-error-message" style={{marginBottom: '15px'}}>{errorVehicle}</p>}

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
                            <p><strong>Dominio:</strong> <span>{vehicle.dominio}</span></p>
                            <p><strong>Año:</strong> <span>{vehicle.anio}</span></p>
                            
                            <p><strong>Kilometraje:</strong> <span>{latestKilometraje} km</span></p>
                            <p><strong>Destino:</strong> <span>{latestDestino}</span></p>
                            <p><strong>Chofer:</strong> <span>{latestChofer}</span></p>

                            <p><strong>Establecimiento:</strong> <span>{vehicle.title}</span></p>
                            <p><strong>Tipo:</strong> <span>{vehicle.tipo}</span></p>
                            <hr/>
                            <p><strong>Chasis N°:</strong> <span>{vehicle.chasis}</span></p>
                            <p><strong>Motor N°:</strong> <span>{vehicle.motor}</span></p>
                            <p><strong>Cédula N°:</strong> <span>{vehicle.cedula}</span></p>
                        </div>
                        
                        <div className="actions-card">
                            <h2>Acciones</h2>
                            <Link to="/vehicle" className="btn-action btn-secondary">Volver a Lista</Link>
                            <button className="btn-action btn-secondary" onClick={() => window.print()}>Imprimir</button>
                            <button className="btn-action btn-primary" onClick={handleEdit}>Añadir Historial</button>
                            <button className="btn-action btn-destructive" onClick={handleDeleteVehicle}>Eliminar Vehículo</button>
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
                    />
                    <HistorySection
                        title="Services"
                        historyData={services.data}
                        loading={services.loading}
                        error={services.error}
                        fieldName="descripcion"
                        historyType="services"
                        onDelete={handleDeleteOneHistoryEntry}
                        onDeleteAll={handleDeleteAllHistory}
                        fetchHistory={fetchHistory}
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
                    />
                     <HistorySection
                        title="Rodados"
                        historyData={rodados.data}
                        loading={rodados.loading}
                        error={rodados.error}
                        fieldName="descripcion"
                        historyType="rodados"
                        onDelete={handleDeleteOneHistoryEntry}
                        onDeleteAll={handleDeleteAllHistory}
                        fetchHistory={fetchHistory}
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
                    />
                </div>
            </main>
        </div>
    );
}

export default VehicleDetail;
