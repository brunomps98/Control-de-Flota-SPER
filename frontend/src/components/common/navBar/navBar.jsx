import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../../assets/images/logo.png';
import './NavBar.css';

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.017 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
  </svg>
);

const NotificationBell = ({ user, unreadCount, onBellClick, notifications, isNotificationOpen, onNotificationClick, onDeleteOne, onClearAll, extraClasses = '' }) => {
  if (!user.admin) return null;
  return (
    <div className={`notification-container ${extraClasses}`}>
      <div
        className="notification-bell"
        onClick={onBellClick}
      >
        <BellIcon />
        <span
          className={`notification-badge ${unreadCount > 0 ? 'show' : ''}`}
        ></span>
      </div>
      <div className={`notification-panel ${isNotificationOpen ? 'show' : ''}`}>
        <div className="notification-header">
            <span>Notificaciones</span>
            {notifications.length > 0 && (
                <button className="btn-clear-all" onClick={onClearAll}>
                    Borrar todas
                </button>
            )}
        </div>
        {notifications.length > 0 ? (
          notifications.map((notif, index) => (
            <div 
              className="notification-item clickable" 
              key={index} 
              onClick={() => onNotificationClick(notif)} 
            >
              <button 
                className="btn-delete-item"
                onClick={(e) => onDeleteOne(notif.id, e)} 
                title="Eliminar notificación"
              >
                &times;
              </button>
              <strong>{notif.title}</strong><br />{notif.message}
            </div>
          ))
        ) : (
          <div className="notification-empty">No hay notificaciones nuevas.</div>
        )}
      </div>
    </div>
  );
};

const Navbar = ({ user, unreadCount, onBellClick, notifications, isNotificationOpen, onNotificationClick, onDeleteOne, onClearAll }) => {
  const navigate = useNavigate();
  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const bellProps = { user, unreadCount, onBellClick, notifications, isNotificationOpen, onNotificationClick, onDeleteOne, onClearAll };

  const handleMobileLinkClick = () => {
    const toggler = document.querySelector('.navbar-toggler');
    const collapseMenu = document.querySelector('#navbarSupportedContent');
    if (toggler && collapseMenu && collapseMenu.classList.contains('show')) {
      toggler.click();
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark app-navbar">
      <div className="container-fluid position-relative">

        <Link className="navbar-brand d-flex align-items-center gap-2" to="/vehicle">
          <img src={logo} alt="Logo SPER" className="app-logo" />
          <span>SPER</span>
        </Link>

        <div className="navbar-text text-white d-lg-none user-connected-mobile">
            <span className="uc-label-mobile">Usuario conectado:</span>
            <span className="uc-name-mobile">{user.username}</span>
        </div>

        <div className="d-flex align-items-center d-lg-none gap-2">
          <NotificationBell {...bellProps} extraClasses="d-lg-none" />
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
        </div>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">

          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {user.admin && (
              <li className="nav-item">
                <Link className="nav-link" to="/vehicle" onClick={handleMobileLinkClick}>Flota General</Link>
              </li>
            )}
            {!user.admin && (
               <li className="nav-item">
                 <Link className="nav-link" to="/vehicle" onClick={handleMobileLinkClick}>Flota</Link>
               </li>
            )}
            <li className="nav-item">
               <Link className="nav-link" aria-current="page" to="/real-time-vehicle" onClick={handleMobileLinkClick}>Cargar Vehículo</Link>
            </li>
            {user.admin && (
                <li className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Unidades
                    </a>
                    <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                        {user.dg && <li><Link className="dropdown-item" to="/vehicle?title=Direccion General" onClick={handleMobileLinkClick}>Direccion General</Link></li>}
                        {user.up1 && <li><Link className="dropdown-item" to="/vehicle?title=Unidad Penal 1" onClick={handleMobileLinkClick}>Unidad Penal 1</Link></li>}
                        {user.up3 && <li><Link className="dropdown-item" to="/vehicle?title=Unidad Penal 3" onClick={handleMobileLinkClick}>Unidad Penal 3</Link></li>}
                        {user.up4 && <li><Link className="dropdown-item" to="/vehicle?title=Unidad Penal 4" onClick={handleMobileLinkClick}>Unidad Penal 4</Link></li>}
                        {user.up5 && <li><Link className="dropdown-item" to="/vehicle?title=Unidad Penal 5" onClick={handleMobileLinkClick}>Unidad Penal 5</Link></li>}
                        {user.up6 && <li><Link className="dropdown-item" to="/vehicle?title=Unidad Penal 6" onClick={handleMobileLinkClick}>Unidad Penal 6</Link></li>}
                        {user.up7 && <li><Link className="dropdown-item" to="/vehicle?title=Unidad Penal 7" onClick={handleMobileLinkClick}>Unidad Penal 7</Link></li>}
                        {user.up8 && <li><Link className="dropdown-item" to="/vehicle?title=Unidad Penal 8" onClick={handleMobileLinkClick}>Unidad Penal 8</Link></li>}
                        {user.up9 && <li><Link className="dropdown-item" to="/vehicle?title=Unidad Penal 9" onClick={handleMobileLinkClick}>Unidad Penal 9</Link></li>}
                        {user.inst && <li><Link className="dropdown-item" to="/vehicle?title=Instituto" onClick={handleMobileLinkClick}>Instituto</Link></li>}
                        {user.trat && <li><Link className="dropdown-item" to="/vehicle?title=Tratamiento" onClick={handleMobileLinkClick}>Tratamiento</Link></li>}
                    </ul>
                </li>
            )}
            {user.admin && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/register" onClick={handleMobileLinkClick}>Registrar Usuario</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/usuarios" onClick={handleMobileLinkClick}>Usuarios</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/support-tickets" onClick={handleMobileLinkClick}>Tickets de Soporte</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard" onClick={handleMobileLinkClick}>Dashboard</Link>
                </li>
              </>
            )}
            
            <li className="nav-item d-lg-none nav-item-user-info">
              <span className="uc-label-mobile">Usuario conectado:</span>
              <span className="uc-name-mobile">{user.username}</span>
            </li>
            <li className="nav-item d-lg-none">
              <button className="nav-link btn btn-link" onClick={() => {
                handleMobileLinkClick();
                handleLogout();
              }}>LogOut</button>
            </li>
          </ul>

          <div className="d-none d-lg-flex align-items-center gap-3 flex-shrink-1">
            <NotificationBell {...bellProps} />
            <div className="user-connected" role="status" aria-label={`Usuario conectado ${user.username}`}>
              <span className="uc-label">Usuario conectado:</span>
              <span className="uc-name">{user.username}</span>
            </div>
            <button className="nav-link btn btn-link text-nowrap" onClick={handleLogout}>LogOut</button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;