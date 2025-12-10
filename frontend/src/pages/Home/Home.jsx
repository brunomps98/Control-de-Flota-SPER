import { Link } from 'react-router-dom';
import './Home.css';
import logoSper from '../../assets/images/logo.png';
import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const Home = () => {
  // Use effect de Capacitor
  useEffect(() => {
    if (Capacitor.getPlatform() === 'web') return;
    // Si apretamos atras, cerramos la app en android 
    const handleBackButton = () => {
        App.exitApp();
    };

    const listener = App.addListener('backButton', handleBackButton);

    return () => {
        listener.remove();
    };
  }, []); 

  return (
    <div className="home-container"> 
      <header className="top-bar">
        <div className="top-bar-left">
          <div className="logoHome">
            <img src={logoSper} alt="Logo Sper" width="60" height="60" />
          </div>
          <div className="title h1">
            <h1>SISTEMA DE GESTION Y CONTROL DE FLOTA S.P.E.R</h1>
          </div>
        </div>
      </header>

      <div className="banner">
        <div className="content">
          <h2 className="welcome-title">
            Bienvenido al Sistema de Control de Flota del Servicio Penitenciario de Entre Ríos.
          </h2>
        </div>
        
        <div className="button-container">
          <Link to="/login">
            <button className="login-btn" type="button">
              Iniciar sesión
            </button>
          </Link>
          <Link to="/support">
            <button className="support-btn" type="button">
              Soporte
            </button>
          </Link>
        </div>
      </div>

      <footer className="footer-bar">
        <p>© 2025 SPER - Departamento de Seguridad Informática</p>
      </footer>
    </div>
  );
};

export default Home;