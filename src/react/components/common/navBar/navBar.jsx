import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png'; // Asegúrate de tener el logo en esta ruta
import './Navbar.css';

const Navbar = ({ user }) => {
  // Si el usuario no está logueado (user no existe), no renderizamos nada o un navbar alternativo.
  // En este caso, retornamos null para no mostrar nada si no hay sesión.
  if (!user) {
    return null;
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/vehicle">
          SPER
          <img src={logo} alt="Logo SPER" width="80" height="80" className="d-inline-block align-text-top" />
        </Link>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              [cite_start]<Link className="nav-link active" aria-current="page" to="/realtimevehicle">Cargar Vehiculo</Link> [cite: 1]
            </li>
            
            {/* Si el usuario es admin, muestra "Flota General" */}
            {user.admin && (
              <li className="nav-item">
                [cite_start]<Link className="nav-link" to="/vehiclegeneral">Flota General</Link> [cite: 2]
              </li>
            )}

            {/* Si el usuario NO es admin, muestra "Flota" */}
            {!user.admin && (
              <li className="nav-item">
                [cite_start]<Link className="nav-link" to="/vehicle">Flota</Link> [cite: 2]
              </li>
            )}
            
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Unidades
              [cite_start]</a> [cite: 3]
              <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                {/* Lógica para mostrar las unidades según los permisos del usuario */}
                [cite_start]{user.dg && <li><a className="dropdown-item" href="?unidad=dg">Direccion General</a></li>} [cite: 3, 4]
                [cite_start]{user.up1 && <li><a className="dropdown-item" href="?unidad=up1">Unidad Penal 1</a></li>} [cite: 4]
                [cite_start]{user.up3 && <li><a className="dropdown-item" href="?unidad=up3">Unidad Penal 3</a></li>} [cite: 4]
                [cite_start]{user.up4 && <li><a className="dropdown-item" href="?unidad=up4">Unidad Penal 4</a></li>} [cite: 4]
                [cite_start]{user.up5 && <li><a className="dropdown-item" href="?unidad=up5">Unidad Penal 5</a></li>} [cite: 5]
                [cite_start]{user.up6 && <li><a className="dropdown-item" href="?unidad=up6">Unidad Penal 6</a></li>} [cite: 5]
                [cite_start]{user.up7 && <li><a className="dropdown-item" href="?unidad=up7">Unidad Penal 7</a></li>} [cite: 5]
                [cite_start]{user.up8 && <li><a className="dropdown-item" href="?unidad=up8">Unidad Penal 8</a></li>} [cite: 6]
                [cite_start]{user.up9 && <li><a className="dropdown-item" href="?unidad=up9">Unidad Penal 9</a></li>} [cite: 6]
                [cite_start]{user.inst && <li><a className="dropdown-item" href="?unidad=inst">Instituto</a></li>} [cite: 6]
                [cite_start]{user.inst && <li><a className="dropdown-item" href="?unidad=trat">Tratamiento</a></li>} [cite: 6, 7]
              </ul>
            </li>

            <li className="nav-item">
              {/* Para el logout, se suele usar una etiqueta <a> normal si va a un endpoint del backend,
                  o un <button> si maneja el estado en el cliente */}
              [cite_start]<a className="nav-link" href="/logOut" tabIndex="-1" aria-disabled="true">LogOut</a> [cite: 7]
            </li>
          </ul>
          <span className="navbar-text text-white">
            Usuario conectado: {user.username}
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;