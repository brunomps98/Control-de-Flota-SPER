import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import Navbar from '../common/navBar/navBar';
import Footer from '../common/footer/footer';
import '../Layout/Layout.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import ChatWrapper from '../chat/ChatWrapper';
import { SocketProvider } from '../../context/SocketContext'; 
import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'react-toastify';


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
    
    useEffect(() => {
        // Solo ejecutar en plataformas nativas (Android/iOS)
        if (Capacitor.getPlatform() === 'web') return;

        const registerForNotifications = async () => {
            try {
                // 1. Pedir permiso al usuario
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    throw new Error('Permiso de notificaciones no concedido.');
                }

                // 2. Si el permiso fue concedido, registrar el dispositivo
                await PushNotifications.register();

                // 3. Escuchar el evento 'registration' para obtener el token FCM
                PushNotifications.addListener('registration', async (token) => {
                    console.log('Token FCM obtenido:', token.value);
                    try {
                        // 4. Enviar el token a nuestro backend 
                        await apiClient.post('/api/user/fcm-token', { fcmToken: token.value });
                        console.log('Token FCM guardado en el backend.');
                    } catch (err) {
                        console.error('Error guardando token FCM en backend:', err);
                        toast.error('No se pudo registrar para notificaciones.');
                    }
                });

                // 5. Escuchar errores
                PushNotifications.addListener('registrationError', (error) => {
                    console.error('Error de registro de Push:', error);
                    toast.error('Error al registrar notificaciones.');
                });

            } catch (error) {
                // Si el usuario denegó el permiso, esto se logueará
                console.warn('Error al registrar notificaciones:', error.message);
            }
        };

        // Ejecutamos la función
        registerForNotifications();

    }, []); 

    

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (!user) {
        return null;
    }

    return (
        <SocketProvider>
            <div className="layout-container">
                <Navbar user={user} />
                <main>
                    <Outlet context={{ user }} />
                </main>
                <Footer />
                <ChatWrapper user={user} />
            </div>
        </SocketProvider>
    );
} 

export default Layout;