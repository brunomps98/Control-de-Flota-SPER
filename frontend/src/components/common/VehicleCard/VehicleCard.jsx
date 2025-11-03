import { Link } from 'react-router-dom';
import './VehicleCard.css'

const VehicleCard = ({ vehicle }) => {
    
    const imageUrl = (vehicle.thumbnail && Array.isArray(vehicle.thumbnail) && vehicle.thumbnail.length > 0)
    ? vehicle.thumbnail[0] 
    : ""; // Dejamos un string vacío si no hay imagen


    return (
        <div className="card-s">
            <div className="face front">
                <img src={imageUrl} alt={`${vehicle.marca} ${vehicle.modelo}`} />
                <h3>{vehicle.title}</h3>
            </div>

            <div className="face back">
                <h3>{vehicle.marca} {vehicle.modelo}</h3>
                <p>Dominio: {vehicle.dominio}</p>
                <p>Año: {vehicle.anio}</p>
                <div className="link">
                    <Link to={`/vehicle-detail/${vehicle.id}`}>Ver Ficha</Link>
                </div>
            </div>
        </div>
    );
};

export default VehicleCard;