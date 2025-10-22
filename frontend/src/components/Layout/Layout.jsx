import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import Navbar from '../common/NavBar/NavBar';
import Footer from '../common/Footer/Footer';
import '../Layout/Layout.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const Layout = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    // 3. Obtén la ubicación actual
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

    // --- 4. NUEVO HOOK CON LA LÓGICA DE NAVEGACIÓN ---
    useEffect(() => {
        // No ejecutar esta lógica en la web
        if (Capacitor.getPlatform() === 'web') return;

        // Definimos la función que manejará el evento
        const handleBackButton = () => {
            const path = location.pathname;

            // REGLA 1: Minimizar en las listas principales
            if (path === '/vehicle' || path === '/vehicle-general') {
                App.exitApp(); // Salir de la app
            } 
            // REGLA 2: En cualquier otra página (details, info, add-vehicle, etc.)
            else {
                navigate(-1); // Navega hacia atrás
            }
        };

        // Añadimos el listener
        const listener = App.addListener('backButton', handleBackButton);

        // Función de limpieza para remover el listener
        return () => {
            listener.remove();
        };
    }, [navigate, location]); // Se re-ejecuta si la navegación o la ubicación cambian

    
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