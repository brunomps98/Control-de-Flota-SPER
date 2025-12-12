import { Link } from 'react-router-dom';
import './VehicleCard.css';
import Tilt from 'react-parallax-tilt'; 

// Recibimos props 
const VehicleCard = ({ vehicle, isAdmin, onDelete }) => {
    
    // Determinamos la URL de la imagen del vehiculo
    const imageUrl = (vehicle.thumbnail && Array.isArray(vehicle.thumbnail) && vehicle.thumbnail.length > 0)
    ? vehicle.thumbnail[0] 
    : "https://via.placeholder.com/400x300.png?text=Sin+Imagen"; 

    // Handler para el botón de eliminar
    const handleDeleteClick = (e) => {
        e.preventDefault();    // Evita que el Link navegue
        e.stopPropagation();   // Evita que el evento burbujee
        onDelete(vehicle.id);
    };

    return (
        <Tilt
            className="tilt-wrapper"
            tiltMaxAngleX={10}
            tiltMaxAngleY={10}
            perspective={1000}
            glareEnable={true}
            glareMaxOpacity={0.1}
            glarePosition="all"
            scale={1.02}
        >
            {/* Redirección a vehicle-detail al clickear */}
            <Link to={`/vehicle-detail/${vehicle.id}`} className="vehicle-card-link">
                
                <div className="vehicle-card-image">
                    <img src={imageUrl} alt={`${vehicle.marca} ${vehicle.modelo}`} />
                    
                    {/* Botón de eliminar solo visible para admins */}
                    {isAdmin && (
                        <div 
                            className="vehicle-delete-btn" 
                            onClick={handleDeleteClick}
                            title="Eliminar Vehículo"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="20" height="20">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}
                </div>
                    {/* Botón de ver ficha de vehiculos */}
                <div className="vehicle-card-content">
                    <h3>{vehicle.marca} {vehicle.modelo}</h3>
                    <p className="vehicle-card-details">
                        {vehicle.anio} | {vehicle.dominio}
                    </p>
                    <span className="vehicle-card-button">
                        Ver Ficha
                    </span>
                </div>
            </Link>
        </Tilt>
    );
};

export default VehicleCard;