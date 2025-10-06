import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../../../api/axiosConfig'; 
import logo from '../../../assets/images/logo.png';
import './Navbar.css';

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  // --- FUNCIÓN DE LOGOUT CON AXIOS ---
  const handleLogout = async () => {
    try {
      await apiClient.post('/api/logout');

      // Redirige al usuario a la página de login
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // --- RENDERIZADO ---
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/vehicle">
          <img src={logo} alt="Logo SPER" width="50" height="50" />
          SPER
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link active" aria-current="page" to="/real-time-vehicle">Cargar Vehiculo</Link>
            </li>

            {user.admin ? (
              <li className="nav-item">
                <Link className="nav-link" to="/vehicle">Flota General</Link>
              </li>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" to="/vehicle">Flota</Link>
              </li>
            )}

            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                id="navbarDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Unidades
              </a>
              <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                {user.dg && <li><Link className="dropdown-item" to="/vehicle?title=Direccion General">Direccion General</Link></li>}
                {user.up1 && <li><Link className="dropdown-item" to="/vehicle?title=Unidad Penal 1">Unidad Penal 1</Link></li>}
                {user.up3 && <li><Link className="dropdown-item" to="/vehicle?title=Unidad Penal 3">Unidad Penal 3</Link></li>}
                {user.up4 && <li><Link className="dropdown-item" to="/vehicle?title=Unidad Penal 4">Unidad Penal 4</Link></li>}
                {user.up5 && <li><Link className="dropdown-item" to="/vehicle?title=Unidad Penal 5">Unidad Penal 5</Link></li>}
                {user.up6 && <li><Link className="dropdown-item" to="/vehicle?title=Unidad Penal 6">Unidad Penal 6</Link></li>}
                {user.up7 && <li><Link className="dropdown-item" to="/vehicle?title=Unidad Penal 7">Unidad Penal 7</Link></li>}
                {user.up8 && <li><Link className="dropdown-item" to="/vehicle?title=Unidad Penal 8">Unidad Penal 8</Link></li>}
                {user.up9 && <li><Link className="dropdown-item" to="/vehicle?title=Unidad Penal 9">Unidad Penal 9</Link></li>}
                {user.inst && <li><Link className="dropdown-item" to="/vehicle?title=Instituto">Instituto</Link></li>}
                {user.trat && <li><Link className="dropdown-item" to="/vehicle?title=Tratamiento">Tratamiento</Link></li>}
              </ul>
            </li>

            <li className="nav-item">
              <button className="nav-link btn btn-link" onClick={handleLogout}>LogOut</button>
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