import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './VehicleDetail.css'; 
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// 1. Añadida la prop 'onDelete'
const HistorySection = ({ title, historyData, loading, error, fieldName = 'descripcion', unit = '', vehicleId, onDelete }) => {
    if (loading) return <p>Cargando {title.toLowerCase()}...</p>;
    if (error) return <p style={{ color: 'red' }}>Error al cargar {title.toLowerCase()}: {error}</p>;
    if (!historyData || historyData.length === 0) return <p>Sin registros de {title.toLowerCase()}.</p>;

    return (
        <table className={`${fieldName}-table`}>
            <thead>
                <tr>
                    <th>{fieldName === 'kilometraje' ? 'Kilometraje' : 'Descripción'} {unit}</th>
                    {fieldName !== 'kilometraje' && <th>Fecha</th>}
                </tr>
            </thead>
            <tbody>
                {(historyData || []).slice().reverse().map((item, index) => (
                    <tr key={item.id}>
                        <td>{item[fieldName]}</td>
                        {/* Mostramos la fecha correspondiente */}
                        {fieldName === 'descripcion' && <td>{new Date(item.created_at || item.fecha_registro || item.fecha_service || item.fecha_reparacion || item.fecha_destino || item.fecha_rodado).toLocaleDateString()}</td>}
                        {fieldName === 'kilometraje' && /* No mostramos fecha para km si no quieres */ null }
                        {fieldName !== 'descripcion' && fieldName !== 'kilometraje' && <td>{new Date(item[`fecha_${fieldName.replace('es','').replace('s','')}`] || item.created_at).toLocaleDateString()}</td>}
                        
                        <td>
                            <button 
                                className="delete-history-btn-small" 
                                onClick={() => onDelete(item.id, fieldName)}
                                title="Eliminar este registro"
                            >
                                🗑️
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};


const VehicleDetail = () => {
    // --- ESTADOS ---
    const { cid } = useParams();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState(null); // Datos básicos del vehículo
    const [loadingVehicle, setLoadingVehicle] = useState(true);
    const [errorVehicle, setErrorVehicle] = useState(null);
    const apiBaseURL = apiClient.defaults.baseURL;

    // Estados separados para cada historial
    const [kilometrajes, setKilometrajes] = useState({ data: null, loading: false, error: null, loaded: false });
    const [services, setServices] = useState({ data: null, loading: false, error: null, loaded: false });
    const [reparaciones, setReparaciones] = useState({ data: null, loading: false, error: null, loaded: false });
    const [destinos, setDestinos] = useState({ data: null, loading: false, error: null, loaded: false });
    const [rodados, setRodados] = useState({ data: null, loading: false, error: null, loaded: false });
    const [descripciones, setDescripciones] = useState({ data: null, loading: false, error: null, loaded: false });


    // --- CARGA INICIAL (Solo datos básicos + thumbnails) ---
    const fetchVehicleData = async () => {
        setErrorVehicle(null);
        setLoadingVehicle(true);
        try {
            const response = await apiClient.get(`/api/vehicle/${cid}`);
            setVehicle(response.data.vehicle);
        } catch (err) {
            setErrorVehicle(err.response?.data?.message || 'No se pudo cargar la información del vehículo.');
        } finally {
            setLoadingVehicle(false);
        }
    };

    useEffect(() => {
        fetchVehicleData();
    }, [cid]);

    // --- FUNCIONES PARA CARGAR HISTORIAL BAJO DEMANDA ---
    const fetchHistory = async (endpoint, stateSetter) => {
        stateSetter(prev => ({ ...prev, loading: true, error: null }));
        try {
            const response = await apiClient.get(`/api/vehicle/${cid}/${endpoint}`);
            stateSetter({ data: response.data.history, loading: false, error: null, loaded: true });
        } catch (err) {
            stateSetter({ data: null, loading: false, error: err.response?.data?.message || `Error cargando ${endpoint}`, loaded: true });
        }
    };

    // --- MANEJADORES DE EDICIÓN Y BORRADO  ---
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

     // --- FUNCIÓN PARA BORRAR TODO EL HISTORIAL DE UN TIPO ---
     const handleDeleteAllHistory = (fieldName) => { 
        MySwal.fire({
            title: '¿Estás seguro?',
            text: `Vas a eliminar TODO el historial de "${fieldName}". ¡No podrás revertir esto!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const stateSetter = eval(`set${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`); 
                stateSetter(prev => ({...prev, error: null}));

                try {
                    await apiClient.delete(`/api/vehicle/${cid}/history/all/${fieldName}`);
                    MySwal.fire('¡Eliminado!', `El historial de ${fieldName} ha sido eliminado.`, 'success');
                    fetchHistory(fieldName, stateSetter); // Refrescamos
                } catch (err) {
                    const errorMessage = err.response?.data?.message || 'No se pudo eliminar el historial.';
                    stateSetter(prev => ({...prev, error: errorMessage }));
                    MySwal.fire('Error', `No se pudo eliminar el historial: ${errorMessage}`, 'error');
                }
            }
        });
    };

    const handleDeleteOneHistoryEntry = (historyId, fieldName) => {
        MySwal.fire({
            title: '¿Eliminar este registro?',
            text: "Esta acción es irreversible.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const stateSetter = eval(`set${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`);
                stateSetter(prev => ({ ...prev, error: null }));

                try {
                    // Nueva ruta de API que incluye el ID del registro
                    await apiClient.delete(`/api/vehicle/${cid}/history/${fieldName}/${historyId}`);
                    
                    MySwal.fire('¡Eliminado!', 'El registro ha sido eliminado.', 'success');
                    
                    // Refrescamos la lista de historial
                    fetchHistory(fieldName, stateSetter);

                } catch (err) {
                    const errorMessage = err.response?.data?.message || 'No se pudo eliminar el registro.';
                    stateSetter(prev => ({ ...prev, error: errorMessage }));
                    MySwal.fire('Error', `No se pudo eliminar: ${errorMessage}`, 'error');
                }
            }
        });
    };


    // --- RENDERIZADO ---
    if (loadingVehicle) return <p>Cargando información del vehículo...</p>;
    if (errorVehicle && !vehicle) return <p style={{ color: 'red' }}>Error al cargar: {errorVehicle}</p>;
    if (!vehicle) return <p>No se encontró el vehículo.</p>;

    const mainImageUrl = vehicle.thumbnails && vehicle.thumbnails.length > 0
        ? `${apiBaseURL}/uploads/${vehicle.thumbnails[0].url_imagen}`
        : '/images/default-vehicle.png';

    return (
        <>
            <div className="body-p">
                {errorVehicle && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{errorVehicle}</p>}

                <div className="card-p">
                    <div className="header-p">
                        <h1>Móvil Oficial</h1>
                    </div>
                    <div className="content-p">
                        <div className="vehicle-image-p">
                            <img src={mainImageUrl} alt={`${vehicle.marca} ${vehicle.modelo}`} />
                        </div>
                        <div className="vehicle-info-p">
                            <p>ESTABLECIMIENTO: {vehicle.title}</p> 
                            <p>CHOFER: {vehicle.chofer || 'Sin asignar'}</p>
                            <p>AÑO: {vehicle.anio}</p>
                            <p>MARCA: {vehicle.marca}</p>
                            <p>MODELO: {vehicle.modelo}</p>
                            <p>TIPO: {vehicle.tipo}</p>
                            <p>CHASIS N°: {vehicle.chasis}</p>
                            <p>MOTOR N°: {vehicle.motor}</p>
                            <p>CEDULA N°: {vehicle.cedula}</p>
                        </div>
                    </div>


                    <div className="history-section">
                        <div className="history-header">
                            <h3>Historial de Kilometraje</h3>
                            {kilometrajes.loaded && kilometrajes.data && kilometrajes.data.length > 0 && (
                                <button 
                                    className="destructive-btn-small"
                                    onClick={() => handleDeleteAllHistory('kilometrajes')}
                                >
                                    Eliminar Todo
                                </button>
                            )}
                        </div>

                        {!kilometrajes.loaded && !kilometrajes.loading && (
                            <button className="action-btn btn-secondary" onClick={() => fetchHistory('kilometrajes', setKilometrajes)}>Ver Historial</button>
                        )}
                        {kilometrajes.loaded && (
                             <HistorySection
                                title="Kilometraje"
                                historyData={kilometrajes.data}
                                loading={kilometrajes.loading}
                                error={kilometrajes.error}
                                fieldName="kilometraje"
                                unit="km"
                                vehicleId={cid}
                                onDelete={handleDeleteOneHistoryEntry} 
                            />
                        )}
                    </div>

                    <div className="history-section">
                        <div className="history-header">
                            <h3>Historial de Services</h3>
                            {services.loaded && services.data && services.data.length > 0 && (
                                <button 
                                    className="destructive-btn-small"
                                    onClick={() => handleDeleteAllHistory('services')}
                                >
                                    Eliminar Todo
                                </button>
                            )}
                        </div>
                        
                        {!services.loaded && !services.loading && (
                            <button className="action-btn btn-secondary" onClick={() => fetchHistory('services', setServices)}>Ver Historial</button>
                        )}
                        {services.loaded && (
                             <HistorySection
                                title="Services"
                                historyData={services.data}
                                loading={services.loading}
                                error={services.error}
                                fieldName="descripcion"
                                vehicleId={cid}
                                onDelete={handleDeleteOneHistoryEntry} 
                            />
                        )}
                    </div>

                    <div className="history-section">
                        <div className="history-header">
                            <h3>Historial de Reparaciones</h3>
                            {reparaciones.loaded && reparaciones.data && reparaciones.data.length > 0 && (
                                <button 
                                    className="destructive-btn-small"
                                    onClick={() => handleDeleteAllHistory('reparaciones')}
                                >
                                    Eliminar Todo
                                </button>
                            )}
                        </div>
                        
                        {!reparaciones.loaded && !reparaciones.loading && (
                             <button className="action-btn btn-secondary" onClick={() => fetchHistory('reparaciones', setReparaciones)}>Ver Historial</button>
                        )}
                        {reparaciones.loaded && (
                             <HistorySection
                                title="Reparaciones"
                                historyData={reparaciones.data}
                                loading={reparaciones.loading}
                                error={reparaciones.error}
                                fieldName="descripcion"
                                vehicleId={cid}
                                onDelete={handleDeleteOneHistoryEntry} 
                            />
                        )}
                    </div>

                    <div className="history-section">
                        <div className="history-header">
                            <h3>Historial de Destinos</h3>
                            {destinos.loaded && destinos.data && destinos.data.length > 0 && (
                                <button 
                                    className="destructive-btn-small"
                                    onClick={() => handleDeleteAllHistory('destinos')}
                                >
                                    Eliminar Todo
                                </button>
                            )}
                        </div>

                         {!destinos.loaded && !destinos.loading && (
                             <button className="action-btn btn-secondary" onClick={() => fetchHistory('destinos', setDestinos)}>Ver Historial</button>
                        )}
                         {destinos.loaded && (
                             <HistorySection
                                title="Destinos"
                                historyData={destinos.data}
                                loading={destinos.loading}
                                error={destinos.error}
                                fieldName="descripcion"
                                vehicleId={cid}
                                onDelete={handleDeleteOneHistoryEntry} 
                            />
                        )}
                    </div>

                     <div className="history-section">
                        <div className="history-header">
                            <h3>Historial de Rodados</h3>
                            {rodados.loaded && rodados.data && rodados.data.length > 0 && (
                                <button 
                                    className="destructive-btn-small"
                                    onClick={() => handleDeleteAllHistory('rodados')}
                                >
                                    Eliminar Todo
                                </button>
                            )}
                        </div>

                        {!rodados.loaded && !rodados.loading && (
                             <button className="action-btn btn-secondary" onClick={() => fetchHistory('rodados', setRodados)}>Ver Historial</button>
                        )}
                         {rodados.loaded && (
                             <HistorySection
                                title="Rodados"
                                historyData={rodados.data}
                                loading={rodados.loading}
                                error={rodados.error}
                                fieldName="descripcion"
                                vehicleId={cid}
                                onDelete={handleDeleteOneHistoryEntry} 
                            />
                        )}
                    </div>

                     <div className="history-section">
                        <div className="history-header">
                            <h3>Historial de Descripciones</h3>
                            {descripciones.loaded && descripciones.data && descripciones.data.length > 0 && (
                                <button 
                                    className="destructive-btn-small"
                                    onClick={() => handleDeleteAllHistory('descripciones')}
                                >
                                    Eliminar Todo
                                </button>
                            )}
                        </div>

                         {!descripciones.loaded && !descripciones.loading && (
                             <button className="action-btn btn-secondary" onClick={() => fetchHistory('descripciones', setDescripciones)}>Ver Historial</button>
                         )}
                         {descripciones.loaded && (
                             <HistorySection
                                title="Descripciones"
                                historyData={descripciones.data}
                                loading={descripciones.loading}
                                error={descripciones.error}
                                fieldName="descripcion"
                                vehicleId={cid}
                                onDelete={handleDeleteOneHistoryEntry}
                            />
                         )}
                    </div>

                    <div className="image-description-p">
                        <h4 className="h4-p">IMÁGENES ADICIONALES:</h4>
                        <div className="img-div">
                            {vehicle.thumbnails && vehicle.thumbnails.slice(1).map((img) => (
                                <img className="img-p" src={`${apiBaseURL}/uploads/${img.url_imagen}`} alt={`Imagen ${img.id}`} key={img.id} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="action-footer">
                    <Link to="/vehicle" className="action-btn btn-secondary">Volver a Lista</Link>
                    <button className="action-btn btn-secondary" onClick={() => window.print()}>Imprimir</button>
                    <button className="action-btn btn-primary" onClick={handleEdit}>Editar/Añadir Historial</button>
                    <button className="action-btn destructive-btn" onClick={handleDeleteVehicle}>Eliminar Vehículo</button>
                </div>
            </div>
        </>
    );
}

export default VehicleDetail;