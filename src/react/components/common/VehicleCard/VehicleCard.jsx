// En tu archivo VehicleCard.jsx

import { Link } from 'react-router-dom';
import './VehicleCard.css'; 

const VehicleCard = ({ vehicle }) => {
    // Verificamos si hay una imagen para mostrar; si no, usamos una por defecto
    const imageUrl = vehicle.thumbnail && vehicle.thumbnail.length > 0 
        ? `/uploads/${vehicle.thumbnail[0]}` 
        : '/images/default-vehicle.png'; // Asegúrate de tener esta imagen en tu carpeta 'public/images'

    return (
        <div className="card-s">
            {/* Cara Frontal */}
            <div className="face front">
                <img src={imageUrl} alt={`${vehicle.marca} ${vehicle.modelo}`} />
                {/* Asegúrate de que vehicle.title exista y sea el nombre del establecimiento/unidad */}
                <h3>{vehicle.title}</h3> 
            </div>

            {/* Cara Trasera */}
            <div className="face back">
                {/* Aquí puedes mostrar más detalles al girar la tarjeta */}
                <h3>{vehicle.marca} {vehicle.modelo}</h3> {/* Puedes poner modelo o marca */}
                <p>Dominio: {vehicle.dominio}</p>
                <p>Año: {vehicle.anio}</p>
                <p>Destino: {vehicle.destino}</p> {/* Puedes añadir más información aquí */}
                <div className="link">
                    <Link to={`/vehicle-detail/${vehicle._id}`}>Ver Ficha</Link>
                </div>
            </div>
        </div>
    );
};

export default VehicleCard;