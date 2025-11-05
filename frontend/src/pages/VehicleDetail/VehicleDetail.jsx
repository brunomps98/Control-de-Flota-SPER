import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './VehicleDetail.css'; // Usaremos este archivo con contenido 100% nuevo
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { App } from '@capacitor/app'; 
import { Capacitor } from '@capacitor/core';

const MySwal = withReactContent(Swal);

// --- 1. COMPONENTE DE HISTORIAL (MOVIDO AFUERA) ---
// (Lógica 100% intacta, solo movido)
const HistorySection = ({ title, historyData, loading, error, fieldName = 'descripcion', unit = '', vehicleId, onDelete, historyType, onDeleteAll }) => {
    
    // Función para formatear la fecha (¡NUEVO!)
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            // Evita "Invalid Date"
            if (isNaN(date.getTime())) {
                return dateString; // Devuelve el string original si no es válido
            }
            return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) {
            return dateString; // Devuelve el string original en caso de error
        }
    };
    
    // Botón para cargar
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
                        <th>{fieldName === 'kilometraje' ? 'Kilometraje' : 'Descripción'} {unit}</th>
                        <th>Fecha</th>
                        <th className="action-col">Borrar</th>
                    </tr>
                </thead>
                <tbody>
                    {[...historyData].reverse().map((item) => (
                        <tr key={item.id}>
                            <td>{item[fieldName]}</td>
                            <td>
                                {
                                    // Lógica de fechas (usando la nueva función)
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


// --- COMPONENTE PRINCIPAL ---
const VehicleDetail = () => {
    // --- ESTADOS (Lógica sin cambios) ---
    const { cid } = useParams();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState(null);
    const [loadingVehicle, setLoadingVehicle] = useState(true);
    const [errorVehicle, setErrorVehicle] = useState(null);

    // --- 2. NUEVO ESTADO PARA LA GALERÍA ---
    const [selectedImage, setSelectedImage] = useState(null);

    // Estados de historial (sin cambios)
    const [kilometrajes, setKilometrajes] = useState({ data: null, loading: false, error: null });
    const [services, setServices] = useState({ data: null, loading: false, error: null });
    const [reparaciones, setReparaciones] = useState({ data: null, loading: false, error: null });
    const [destinos, setDestinos] = useState({ data: null, loading: false, error: null });
    const [rodados, setRodados] = useState({ data: null, loading: false, error: null });
    const [descripciones, setDescripciones] = useState({ data: null, loading: false, error: null });


    // --- CARGA INICIAL (Modificada para setear la imagen) ---
    const fetchVehicleData = async () => {
        setErrorVehicle(null);
        setLoadingVehicle(true);
        try {
            const response = await apiClient.get(`/api/vehicle/${cid}`);
            setVehicle(response.data.vehicle);

            // 3. Setear la imagen principal al cargar
            if (response.data.vehicle.thumbnails && response.data.vehicle.thumbnails.length > 0) {
                setSelectedImage(response.data.vehicle.thumbnails[0].url_imagen);
            } else {
                setSelectedImage("https://via.placeholder.com/800x600.png?text=Sin+Imagen"); // Placeholder
            }
            
        } catch (err) {
            setErrorVehicle(err.response?.data?.message || 'No se pudo cargar la información del vehículo.');
        } finally {
            setLoadingVehicle(false);
        }
    };

    useEffect(() => {
        fetchVehicleData();
    }, [cid]);

    // --- CARGA DE HISTORIAL (Modificada para un solo handler) ---
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
            stateSetter({ data: response.data.history, loading: false, error: null });
        } catch (err) {
            stateSetter({ data: null, loading: false, error: err.response?.data?.message || `Error cargando ${historyType}` });
        }
    };

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
                    stateSetter({ data: null, loading: false, error: null }); // Resetea la data
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
                    fetchHistory(historyType); // Refresca la lista
                } catch (err) {
                    const errorMessage = err.response?.data?.message || 'No se pudo eliminar el registro.';
                    stateSetter(prev => ({ ...prev, error: errorMessage }));
                    MySwal.fire('Error', `No se pudo eliminar: ${errorMessage}`, 'error');
                }
            }
        });
    };

    // --- Lógica de Capacitor (sin cambios) ---
     useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;
        const handleBackButton = () => navigate('/vehicle');
        const listener = App.addListener('backButton', handleBackButton);
        return () => listener.remove();
    }, [navigate]);


    // --- RENDERIZADO (NUEVA ESTRUCTURA) ---
    if (loadingVehicle) return <div className="vehicle-page-container"><p className="detail-loading-message">Cargando información del vehículo...</p></div>;
    if (errorVehicle && !vehicle) return <div className="vehicle-page-container"><p className="detail-error-message">Error al cargar: {errorVehicle}</p></div>;
    if (!vehicle) return <div className="vehicle-page-container"><p className="detail-loading-message">No se encontró el vehículo.</p></div>;

    const allImages = vehicle.thumbnails || [];

    return (
        // 1. Contenedor de página (fondo gris)
        <div className="vehicle-page-container">
            <main className="vehicle-detail-main">
                
                {/* Título Principal de la Página */}
                <h1 className="vehicle-main-title">{vehicle.marca} {vehicle.modelo}</h1>
                <p className="vehicle-main-subtitle">{vehicle.title}</p>

                {errorVehicle && <p className="detail-error-message" style={{marginBottom: '15px'}}>{errorVehicle}</p>}

                {/* 2. Layout de 2 Columnas (Galería + Info/Acciones) */}
                <div className="detail-header-grid">
                    
                    {/* --- COLUMNA IZQUIERDA: GALERÍA --- */}
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

                    {/* --- COLUMNA DERECHA: INFO Y ACCIONES --- */}
                    <div className="info-actions-container">
                        {/* Tarjeta de Información */}
                        <div className="info-card">
                            <h2>Ficha del Vehículo</h2>
                            <p><strong>Dominio:</strong> <span>{vehicle.dominio}</span></p>
                            <p><strong>Año:</strong> <span>{vehicle.anio}</span></p>
                            <p><strong>Tipo:</strong> <span>{vehicle.tipo}</span></p>
                            <p><strong>Chofer:</strong> <span>{vehicle.chofer || 'Sin asignar'}</span></p>
                            <p><strong>Establecimiento:</strong> <span>{vehicle.title}</span></p>
                            <hr/>
                            <p><strong>Chasis N°:</strong> <span>{vehicle.chasis}</span></p>
                            <p><strong>Motor N°:</strong> <span>{vehicle.motor}</span></p>
                            <p><strong>Cédula N°:</strong> <span>{vehicle.cedula}</span></p>
                        </div>
                        
                        {/* Tarjeta de Acciones (Botones movidos) */}
                        <div className="actions-card">
                            <h2>Acciones</h2>
                            <Link to="/vehicle" className="btn-action btn-secondary">Volver a Lista</Link>
                            <button className="btn-action btn-secondary" onClick={() => window.print()}>Imprimir</button>
                            <button className="btn-action btn-primary" onClick={handleEdit}>Editar/Añadir Historial</button>
                            <button className="btn-action btn-destructive" onClick={handleDeleteVehicle}>Eliminar Vehículo</button>
                        </div>
                    </div>
                </div>

                {/* --- 3. SECCIÓN DE HISTORIALES (Debajo) --- */}
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
                    />
                    <HistorySection
                        title="Descripciones"
                        historyData={descripciones.data}
                        loading={descripciones.loading}
                        error={descripciones.error}
                        fieldName="descripcion"
                        historyType="descripciones"
                        onDelete={handleDeleteOneHistoryEntry}
                        onDeleteAll={handleDeleteAllHistory}
                    />
                </div>
            </main>
        </div>
    );
}

export default VehicleDetail;