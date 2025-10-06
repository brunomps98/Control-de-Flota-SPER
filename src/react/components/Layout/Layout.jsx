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
                // 2. Usamos apiClient para la petición GET a la sesión del usuario
                const response = await apiClient.get('/api/session/current');

                // Si la petición es exitosa (código 2xx), establecemos el usuario
                setUser(response.data.user);

            } catch (error) {
                // 3. Si hay un error (ej: 401 No Autorizado), Axios lo captura aquí
                console.error("No hay sesión de usuario activa:", error.response?.data?.message || error.message);
                navigate('/login'); // Redirigimos al login
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