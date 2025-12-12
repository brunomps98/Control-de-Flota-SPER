import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import Navbar from '../common/NavBar/NavBar';
import Footer from '../common/Footer/Footer';
import '../Layout/Layout.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import ChatWrapper from '../Chat/ChatWrapper';
import { SocketProvider, useSocket } from '../../context/SocketContext';
import { ChatProvider } from '../../context/ChatContext';
import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'react-toastify';
import ChatBot from '../ChatBot/ChatBot';

// Fijamos tiempo de timeout si el usuario no realiza ninguna acción, cerramos sesión 
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

const Layout = () => {
    // Hooks de estados del layout
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Notificaciones de Campana 
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Estado del ChatBot (Flotante)
    const [isBotOpen, setIsBotOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const timerRef = useRef(null);

    // Callbacks
    const handleInactivityLogout = useCallback(() => {
        localStorage.removeItem('token');
        toast.info('Tu sesión se cerró automáticamente por inactividad.');
        navigate('/login', { replace: true });
    }, [navigate]);
    // Reseteamos el tiempo de inactividad si el usuario hace algo
    const resetInactivityTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(handleInactivityLogout, INACTIVITY_TIMEOUT_MS);
    }, [handleInactivityLogout]);

    // Manejar clicks en notificaciones en web
    const handleNotificationClick = async (notif) => {
        setIsNotificationOpen(false);

        // Intentamos obtener el ID de todas las formas posibles
        const resourceId = notif.resourceId || notif.resource_id || notif.id;
        const type = notif.type;
        processRedirect(type, resourceId);

        // Marcar notificación como leída
        try {
            if (!notif.is_read) {
                await apiClient.put(`/api/notifications/${notif.id}/read`);
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
            }
        } catch (error) {
            console.error("Error al marcar notificación como leída:", error);
        }
    };

    // Función de redirección
    const processRedirect = (rawType, resourceId) => {

        let type = rawType;
        if (type === 'vehicle') type = 'vehicle_update';

        if (type === 'vehicle_update') {
            if (resourceId) {
                navigate(`/vehicle-detail/${resourceId}`);
            } else {
                console.warn("⚠️ Redirección de vehículo sin ID, yendo a lista.");
                navigate('/vehicle');
            }
        }
        else if (type === 'new_ticket') {
            if (resourceId) navigate(`/case/${resourceId}`);
            else navigate('/support-tickets');
        }
        else if (type === 'chat_message' || type === 'new_message') {
            navigate('/vehicle'); // Base segura

            if (resourceId) {
                // Abrir ventana
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('OPEN_CHAT_ROOM', { detail: resourceId }));
                }, 1000); // 1 segundo para asegurar que todo cargó
            }
        }
        else {
            // Fallback por si el tipo no coincide
            navigate('/vehicle');
        }
    };

    // Cargamos usuario
    useEffect(() => {
        const fetchUserSession = async () => {
            try {
                const response = await apiClient.get('/api/user/current');
                setUser(response.data.user);
            } catch (error) {
                console.error("No hay sesión de usuario activa:", error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchUserSession();
    }, [navigate]);

    //  Verificamos redirecciones pendientes al cargar
    useEffect(() => {
        if (user && !loading) {
            const pendingRedirect = localStorage.getItem('pending_notification_redirect');

            if (pendingRedirect) {
                try {
                    const parsed = JSON.parse(pendingRedirect);
                    const { type, resourceId } = parsed;


                    localStorage.removeItem('pending_notification_redirect');

                    processRedirect(type, resourceId);

                } catch (e) {
                    console.error("Error procesando redirección pendiente", e);
                    localStorage.removeItem('pending_notification_redirect');
                }
            }
        }
    }, [user, loading]);

    // Configuración de notificaciones push (capacitor)
    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;

        // Función para registrar notificaciones
        const registerForNotifications = async () => {
            try {
                let permStatus = await PushNotifications.checkPermissions();
                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }
                if (permStatus.receive !== 'granted') return;

                await PushNotifications.register();

                PushNotifications.addListener('registration', async (token) => {
                    try {
                        await apiClient.post('/api/user/fcm-token', { fcmToken: token.value });
                    } catch (error) { /* Silent fail */ }
                });

                PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                    const data = notification.notification.data;

                    // Normalización de datos
                    let type = data.type;
                    let resourceId = null;

                    if (data.vehicleId) { resourceId = data.vehicleId; type = 'vehicle_update'; }
                    else if (data.chatRoomId) { resourceId = data.chatRoomId; type = 'chat_message'; }
                    else if (data.id) {
                        resourceId = data.id;
                        if (type === 'vehicle') type = 'vehicle_update';
                    }

                    // Guardamos la intención (el buzón)
                    // Guardamos a dónde quiere ir el usuario para leerlo apenas cargue la app
                    localStorage.setItem('pending_notification_redirect', JSON.stringify({
                        type,
                        resourceId
                    }));

                    // Lógica inteligente de navegación
                    const token = localStorage.getItem('token');
                    // Si existe token llevamos a vehicle
                    if (token) {
                        window.location.href = '/vehicle';
                        // Y sino redirrecionamos al login 
                    } else {
                        navigate('/login');
                    }
                });

            } catch (error) {
            }
        };

        registerForNotifications();

        // Limpiamos los listeners al desmontar
        return () => {
            PushNotifications.removeAllListeners();
        };
    }, []);

    // UseEffect para el captcha (oculto)
    useEffect(() => {
        const badge = document.querySelector('.grecaptcha-badge');
        if (badge) { badge.style.display = 'none'; badge.style.visibility = 'hidden'; }
    }, []);

    //UseEffects para capacitor

    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;
        const handleBackButton = () => {
            const path = location.pathname;
            if (path === '/vehicle' || path === '/vehicle-general') App.exitApp();
            else navigate(-1);
        };
        const listener = App.addListener('backButton', handleBackButton);
        return () => { listener.remove(); };
    }, [navigate, location]);

    // UseEffect para manejo de inactividad en web
    useEffect(() => {
        if (!user || Capacitor.getPlatform() !== 'web') return;
        const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
        resetInactivityTimer();
        events.forEach(event => window.addEventListener(event, resetInactivityTimer));
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
        };
    }, [user, resetInactivityTimer]);

    // UseEffect papra notificaciones
    const NotificationsListener = () => {
        const socket = useSocket();
        useEffect(() => {
            if (!socket) return;
            const handleNewNotification = (data) => {
                setNotifications(prev => [data, ...prev].slice(0, 10));
                setUnreadCount(prev => prev + 1);
                toast.info(`🔔 ${data.message}`, { icon: false });
            };
            socket.on('new_notification', handleNewNotification);
            return () => socket.off('new_notification', handleNewNotification);
        }, [socket]);
        return null;
    };

    // Cargamos notificaciones al iniciar sesión solo si el usuario es admin
    useEffect(() => {
        if (user && user.admin) {
            apiClient.get('/api/notifications').then(res => {
                if (Array.isArray(res.data)) {
                    setNotifications(res.data);
                    setUnreadCount(res.data.filter(n => !n.is_read).length);
                }
            }).catch(e => console.error(e));
        }
    }, [user]);

    // Renderizado de pagina de carga
    if (loading) {
        return (
            <div className="app-loading-screen">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    // Si no hay usuario, redirigimos al login
    if (!user) return null;

    // Definimos el botón para marcar las notificaciones como leidas
    const handleBellClick = async (event) => {
        event.stopPropagation();
        const opening = !isNotificationOpen;
        setIsNotificationOpen(opening);
        if (opening && unreadCount > 0) {
            setUnreadCount(0);
            try {
                await apiClient.put('/api/notifications/mark-all-read');
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            } catch (error) { console.error(error); }
        }
    };
    // Definimos el botón para eliminar una sola notificación
    const handleDeleteOne = async (id, event) => {
        if (event) event.stopPropagation();
        setNotifications(prev => prev.filter(n => n.id !== id));
        setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
        apiClient.delete(`/api/notifications/${id}`).catch(e => console.error(e));
    };
    // Definimos el botón para eliminar todas las notificaciones 
    const handleClearAll = async () => {
        apiClient.delete('/api/notifications/clear-all').then(() => {
            setNotifications([]);
            setUnreadCount(0);
        }).catch(e => console.error(e));
    };

    return (
        <SocketProvider>
            <ChatProvider user={user}>
                <div className="layout-container" onClick={() => isNotificationOpen && setIsNotificationOpen(false)}>
                    <Navbar
                        user={user}
                        unreadCount={unreadCount}
                        onBellClick={handleBellClick}
                        notifications={notifications}
                        isNotificationOpen={isNotificationOpen}
                        onNotificationClick={handleNotificationClick}
                        onDeleteOne={handleDeleteOne}
                        onClearAll={handleClearAll}
                    />
                    <main>
                        <Outlet context={{ user }} />
                    </main>
                    <Footer />

                    {!user.admin && <ChatBot onToggle={(state) => setIsBotOpen(state)} />}
                    <ChatWrapper hideButton={isBotOpen} />
                </div>
                {user.admin && <NotificationsListener />}
            </ChatProvider>
        </SocketProvider>
    );
}

export default Layout;