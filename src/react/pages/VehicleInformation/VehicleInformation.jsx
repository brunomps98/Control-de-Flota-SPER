import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './VehicleInformation.css'; // Asegúrate de crear y enlazar este archivo
import logoSper from '../../assets/images/logo.png'; // Asegúrate de que esta ruta sea correcta

const VehicleInformation = () => {
    const { cid } = useParams(); // Obtiene el ID del vehículo desde la URL
    const navigate = useNavigate();

    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Función para buscar los datos del vehículo
    const fetchVehicle = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/vehicle/${cid}`);
            if (!response.ok) throw new Error('No se pudo encontrar el vehículo.');
            const data = await response.json();
            setVehicle(data.vehicle);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // useEffect para cargar los datos del vehículo cuando el componente se monta
    useEffect(() => {
        fetchVehicle();
    }, [cid]); // Se ejecuta si el ID del vehículo en la URL cambia

    // Función para eliminar el último registro de un historial
    const handleDeleteLastEntry = async (fieldName) => {
        if (!window.confirm(`¿Estás seguro de que querés eliminar el último registro de "${fieldName}"?`)) {
            return;
        }
        try {
            const response = await fetch(`/api/vehicle/${cid}/history/${fieldName}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo eliminar el registro.');
            }
            // Si la eliminación fue exitosa, volvemos a cargar los datos del vehículo para ver el cambio
            fetchVehicle();
        } catch (err) {
            setError(err.message);
        }
    };

    // Renderizado condicional mientras carga o si hay un error
    if (loading) return <p>Cargando historial del vehículo...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
    if (!vehicle) return <p>No se encontró el vehículo.</p>;

    return (
        <>


            <main>
                <div className="body-p">
                    <div className="card-p">
                        <div className="header-p">
                            <h1>Ficha de Mantenimiento</h1>
                            <img className="logo-dtail" src={logoSper} alt="Logo SPER" />
                        </div>
                        <div className="content-p">
                            <div className="vehicle-image-p">
                                <img src={`/uploads/${vehicle.thumbnail[0]}`} alt={`${vehicle.marca} ${vehicle.modelo}`} />
                            </div>
                            <div className="vehicle-info-p">
                                <p>UNIDAD: {vehicle.title}</p>
                                <p>MARCA: {vehicle.marca}</p>
                                <p>MODELO: {vehicle.modelo}</p>
                                <p>AÑO: {vehicle.anio}</p>
                                <p>DOMINIO: {vehicle.dominio}</p>
                            </div>
                        </div>

                        {/* --- Renderizado de Historiales --- */}
                        {/* Se puede crear un componente reutilizable para esto, pero por ahora lo dejamos así */}

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