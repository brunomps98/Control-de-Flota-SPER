import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../../assets/images/logo.png';
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
              <Link className="nav-link active" aria-current="page" to="/realtimevehicle">Cargar Vehiculo</Link>
            </li>

            {/* Si el usuario es admin, muestra "Flota General" */}
            {user.admin && (
              <li className="nav-item">
                <Link className="nav-link" to="/vehiclegeneral">Flota General</Link>
              </li>
            )}

            {/* Si el usuario NO es admin, muestra "Flota" */}
            {!user.admin && (
              <li className="nav-item">
                <Link className="nav-link" to="/vehicle">Flota</Link>
              </li>
            )}

            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Unidades
              </a>
              <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                {/* Lógica para mostrar las unidades según los permisos del usuario */}
                {user.dg && <li><a className="dropdown-item" href="?unidad=dg">Direccion General</a></li>}
                {user.up1 && <li><a className="dropdown-item" href="?unidad=up1">Unidad Penal 1</a></li>}
                {user.up3 && <li><a className="dropdown-item" href="?unidad=up3">Unidad Penal 3</a></li>}
                {user.up4 && <li><a className="dropdown-item" href="?unidad=up4">Unidad Penal 4</a></li>}
                {user.up5 && <li><a className="dropdown-item" href="?unidad=up5">Unidad Penal 5</a></li>}
                {user.up6 && <li><a className="dropdown-item" href="?unidad=up6">Unidad Penal 6</a></li>}
                {user.up7 && <li><a className="dropdown-item" href="?unidad=up7">Unidad Penal 7</a></li>}
                {user.up8 && <li><a className="dropdown-item" href="?unidad=up8">Unidad Penal 8</a></li>}
                {user.up9 && <li><a className="dropdown-item" href="?unidad=up9">Unidad Penal 9</a></li>}
                {user.inst && <li><a className="dropdown-item" href="?unidad=inst">Instituto</a></li>}
                {user.inst && <li><a className="dropdown-item" href="?unidad=trat">Tratamiento</a></li>} 
              </ul>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="/" tabIndex="-1" aria-disabled="true">LogOut</a>
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