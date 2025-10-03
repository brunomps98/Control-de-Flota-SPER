import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
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
                const response = await fetch('/api/session/current', { credentials: 'include' });
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