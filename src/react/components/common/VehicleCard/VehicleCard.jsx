import { Link } from 'react-router-dom';
import './VehicleCard.css'; // Importamos los estilos para esta tarjeta

const VehicleCard = ({ vehicle }) => {
    return (
        <div className="card-s">
            {/* Cara Frontal */}
            <div className="face front">
                <img src={`/uploads/${vehicle.thumbnail[0]}`} alt={`${vehicle.marca} ${vehicle.modelo}`} />
                <h3>{vehicle.title}</h3>
            </div>

            {/* Cara Trasera */}
            <div className="face back">
                <h3>{vehicle.modelo}</h3>
                <p>Dominio: {vehicle.dominio}</p>
                <p>Año: {vehicle.anio}</p>
                <div className="link">
                    <Link to={`/vehiculo/${vehicle._id}`}>Ver Detalles</Link>
                </div>
            </div>
        </div>
    );
};

export default VehicleCard;