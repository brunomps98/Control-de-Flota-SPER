import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import Navbar from '../common/navBar/navBar';
import Footer from '../common/footer/footer';
import '../Layout/Layout.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const Layout = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchUserSession = async () => {
            try {
                const response = await apiClient.get('/api/user/current');
                setUser(response.data.user);
            } catch (error) {
                console.error("No hay sesión de usuario activa:", error.response?.data?.message || error.message);
                navigate('/login'); 
            } finally {
                setLoading(false);
            }
        };
        fetchUserSession();
    }, [navigate]);

    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;

        const handleBackButton = () => {
            const path = location.pathname;

            if (path === '/vehicle' || path === '/vehicle-general') {
                App.exitApp(); 
            } 
            else {
                navigate(-1); 
            } 
        };

        const listener = App.addListener('backButton', handleBackButton);

        return () => {
            listener.remove();
        };
    }, [navigate, location]); 
    
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
                <Outlet context={{ user }} />
            </main>
            <Footer />
        </div>
    );
} 

export default Layout;