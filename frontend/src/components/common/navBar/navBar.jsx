import React from 'react'; 
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../../assets/images/logo.png';
import './navBar.css'; 

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.017 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
);

const NotificationBell = ({ user, unreadCount, onBellClick, notifications, isNotificationOpen, extraClasses = '' }) => {
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
                <div className="notification-header">Notificaciones</div>
                {notifications.length > 0 ? (
                    notifications.map((notif, index) => (
                        <div className="notification-item" key={index}>
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

const Navbar = ({ user, unreadCount, onBellClick, notifications, isNotificationOpen }) => {
  const navigate = useNavigate();
  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const bellProps = { user, unreadCount, onBellClick, notifications, isNotificationOpen };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark app-navbar">
      <div className="container-fluid">
      
        <Link className="navbar-brand d-flex align-items-center gap-2 me-auto" to="/vehicle">
          <img src={logo} alt="Logo SPER" className="app-logo" />
          <span>SPER</span>
        </Link>

        <div className="navbar-text text-white d-lg-none user-connected-mobile">
            <span className="uc-name-mobile">{user.username}</span>
        </div>

        <NotificationBell {...bellProps} extraClasses="d-lg-none" />

        <button
          className="navbar-toggler d-lg-none" 
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" aria-current="page" to="/real-time-vehicle">Cargar Vehiculo</Link>
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
            {user.admin && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">Dashboard</Link>
                </li>
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Unidades
                  </a>
                  <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                  </ul>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/support-tickets">Tickets de Soporte</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">Registrar Usuario</Link>
                </li>
              </>
            )}
            <li className="nav-item">
              <button className="nav-link btn btn-link" onClick={handleLogout}>LogOut</button>
            </li>
          </ul>

          <div className="d-none d-lg-flex align-items-center gap-3">
            <NotificationBell {...bellProps} />
            <div className="user-connected" role="status" aria-label={`Usuario conectado ${user.username}`}>
                <span className="uc-label">Usuario conectado:</span>
                <span className="uc-name">{user.username}</span>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;