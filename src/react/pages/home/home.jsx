import { Link } from 'react-router-dom';
import './Home.css';
import logoSper from '../../assets/images/logo.png';

const Home = () => {
  return (
    <div className="home-container"> 
      <header className="top-bar">
        <div className="top-bar-left">
          <div className="logoHome">
            <img src={logoSper} alt="Logo Sper" width="60" height="60" />
          </div>
          <div className="title">
            <h1>SISTEMA DE GESTION Y CONTROL DE FLOTA S.P.E.R</h1>
          </div>
        </div>
      </header>

      <div className="banner">
        <div className="content">
          <h1>SISTEMA DE GESTION Y CONTROL DE FLOTA S.P.E.R</h1>
          <p>
            Bienvenido al sistema de control de flota del Servicio Penitenciario de Entre Ríos.
          </p>
        </div>
        
        <div className="button-login">
          <Link to="/login">
            <button className="login-btn" type="button">
              <span className="cover"></span> 
              Iniciar sesión
            </button>
          </Link>
        </div>

        <div className="button-support">
            <Link to href="/support">
                <button className="support-btn" type="button">
                    <span className="cover"></span> 
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