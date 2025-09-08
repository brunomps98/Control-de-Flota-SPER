import { Link } from 'react-router-dom';
import './Register.css';
import logoSper from '../../assets/images/logo.png';

const Register = () => {
    return (
        <div className="home-container">

            <div class="banner-productos">
                <div class="navbar-r">
                    <img src={logoSper} alt="Logo SPER" className="logo-r"/>
                </div>
            </div>

            <div>
            <footer className="footer-bar">
                <p>© 2025 SPER - Departamento de Seguridad Informática</p>
            </footer>
            </div>
        </div >
    )
}

export default Register;