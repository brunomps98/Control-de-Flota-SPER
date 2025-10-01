import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../common/NavBar/navBar';
import Footer from '../common/Footer/footer';
import '../Layout/Layout.css';

const Layout = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserSession = async () => {
            try {
                // --- INICIO DE LA CORRECCIÓN ---
                const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/session/current`;
                const response = await fetch(apiUrl, { credentials: 'include' });
                // --- FIN DE LA CORRECCIÓN ---
                const data = await response.json();

                if (response.ok) {
                    setUser(data.user);
                } else {
                    navigate('/login');
                }
            } catch (error) {
                console.error("Error fetching user session:", error);
                navigate('/login');
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
        // Redirige si no hay usuario después de cargar
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