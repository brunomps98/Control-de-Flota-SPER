import { useState, useEffect, useRef, useCallback } from 'react';
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

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

const Layout = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const timerRef = useRef(null);

    // Función de Logout (envuelta en useCallback) ---
    const handleInactivityLogout = useCallback(() => {
        // Limpiar token
        localStorage.removeItem('token');

        // Mostrar notificación al usuario
        toast.info('Tu sesión se cerró automáticamente por inactividad.');

        // Redirigir al login (usamos replace para no guardar en el historial)
        navigate('/login', { replace: true });
    }, [navigate]);

    // Función para reiniciar el timer (envuelta en useCallback) ---
    const resetInactivityTimer = useCallback(() => {
        // Limpiar el timer anterior si existe
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // Creamos un nuevo timer
        timerRef.current = setTimeout(handleInactivityLogout, INACTIVITY_TIMEOUT_MS);
    }, [handleInactivityLogout]);

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
                // Pedir permiso al usuario
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    throw new Error('Permiso de notificaciones no concedido.');
                }

                // Si el permiso fue concedido, registrar el dispositivo
                await PushNotifications.register();

                // Escuchar el evento 'registration' para obtener el token FCM
                PushNotifications.addListener('registration', async (token) => {
                    console.log('Token FCM obtenido:', token.value);
                    try {
                        // Enviar el token a nuestro backend 
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

    useEffect(() => {
        // Solo activar el timer si el usuario está logueado
        if (!user) return;

        // Eventos que cuentan como actividad
        const events = [
            'mousemove',
            'keydown',
            'touchstart',
            'scroll',
            'click'
        ];

        // Iniciar el timer la primera vez
        resetInactivityTimer();

        // Agregamos los event listeners
        events.forEach(event => {
            window.addEventListener(event, resetInactivityTimer);
        });

        // Función de limpieza (se ejecuta cuando el componente se desmonta)
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, resetInactivityTimer);
            });
        };
    }, [user, resetInactivityTimer]);

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