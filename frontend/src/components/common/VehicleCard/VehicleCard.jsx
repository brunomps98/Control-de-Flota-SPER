import { Link } from 'react-router-dom';
import './VehicleCard.css';
import apiClient from '../../../api/axiosConfig';

const VehicleCard = ({ vehicle }) => {

    // --- AÑADE ESTE CONSOLE.LOG ---
    console.log("Datos recibidos por VehicleCard:", vehicle); 
    // -----------------------------
    
    const apiBaseURL = apiClient.defaults.baseURL;
    const imageUrl = vehicle.thumbnail
        ? `${apiBaseURL}/uploads/${vehicle.thumbnail}`
        : '/images/default-vehicle.png';
    
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