import { Link } from 'react-router-dom';
import './VehicleCard.css'; // Seguiremos usando este archivo, pero con contenido nuevo

const VehicleCard = ({ vehicle }) => {
    
    // Tu lógica de imagen (¡perfecta!)
    const imageUrl = (vehicle.thumbnail && Array.isArray(vehicle.thumbnail) && vehicle.thumbnail.length > 0)
    ? vehicle.thumbnail[0] 
    : "https://via.placeholder.com/400x300.png?text=Sin+Imagen"; // Añadido un placeholder por si acaso


    return (
        // CAMBIO: El <Link> ahora envuelve todo. 
        // Eliminamos .card-s y .face
        <Link to={`/vehicle-detail/${vehicle.id}`} className="vehicle-card-link">
            
            {/* 1. Sección de Imagen */}
            <div className="vehicle-card-image">
                <img src={imageUrl} alt={`${vehicle.marca} ${vehicle.modelo}`} />
            </div>

            {/* 2. Sección de Contenido (debajo de la imagen) */}
            <div className="vehicle-card-content">
                
                {/* Título principal */}
                <h3>{vehicle.marca} {vehicle.modelo}</h3>
                
                {/* Detalles (Año y Dominio) */}
                <p className="vehicle-card-details">
                    {vehicle.anio} | {vehicle.dominio}
                </p>

                {/* Botón (visual) */}
                <span className="vehicle-card-button">
                    Ver Ficha
                </span>
            </div>
        </Link>
    );
};

export default VehicleCard;