import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import apiClient from '../../../api/axiosConfig.js';
import Navbar from '../common/NavBar/NavBar';
import Footer from '../common/Footer/Footer';
import '../Layout/Layout.css';

const Layout = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserSession = async () => {
            try {
                // 1. Cambiamos la ruta a la nueva que verifica el token
                const response = await apiClient.get('/api/user/current');

                // El interceptor de Axios ya se encargó de enviar el token por nosotros
                setUser(response.data.user);

            } catch (error) {
                console.error("No hay sesión de usuario activa:", error.response?.data?.message || error.message);
                navigate('/login'); // Si el token no es válido o no existe, redirigimos al login
            } finally {
                setLoading(false);
            }
        };
        fetchUserSession();
    }, [navigate]);

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (!user) {
        return null;
    }

    return (
        <div className="layout-container">
            <Navbar user={user} />
            <main>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default Layout;