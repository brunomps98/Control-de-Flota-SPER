import { Link } from 'react-router-dom';
import './VehicleCard.css';
import Tilt from 'react-parallax-tilt'; 

const VehicleCard = ({ vehicle }) => {
    
    const imageUrl = (vehicle.thumbnail && Array.isArray(vehicle.thumbnail) && vehicle.thumbnail.length > 0)
    ? vehicle.thumbnail[0] 
    : "https://via.placeholder.com/400x300.png?text=Sin+Imagen"; 


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
            <Link to={`/vehicle-detail/${vehicle.id}`} className="vehicle-card-link">
                
                <div className="vehicle-card-image">
                    <img src={imageUrl} alt={`${vehicle.marca} ${vehicle.modelo}`} />
                </div>

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