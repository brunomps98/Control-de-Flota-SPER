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

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

const Layout = () => {
    // --- Hooks de Estado ---
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

    // --- Callbacks ---
    const handleInactivityLogout = useCallback(() => {
        localStorage.removeItem('token');
        toast.info('Tu sesión se cerró automáticamente por inactividad.');
        navigate('/login', { replace: true });
    }, [navigate]);

    const resetInactivityTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(handleInactivityLogout, INACTIVITY_TIMEOUT_MS);
    }, [handleInactivityLogout]);

    // ---  MANEJAR CLIC EN NOTIFICACIÓN (WEB/INTERNO) ---
    const handleNotificationClick = async (notif) => {
        setIsNotificationOpen(false);

        // Intentamos obtener el ID de todas las formas posibles
        const resourceId = notif.resourceId || notif.resource_id || notif.id;
        const type = notif.type;

        processRedirect(type, resourceId);

        // Marcar como leída
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

    // FUNCIÓN CENTRALIZADA DE REDIRECCIÓN 
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
                // 2. Abrir ventana
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

    // CARGAR USUARIO 
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

    //  VERIFICAR REDIRECCIONES PENDIENTES (AL CARGAR USUARIO) 
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

    // CONFIGURAR PUSH NOTIFICATIONS (NATIVO) 
    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;

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

                    // 1. GUARDAMOS LA INTENCIÓN (El "Buzón")
                    // Esto es vital. Guardamos a dónde quiere ir el usuario para leerlo apenas cargue la app.
                    localStorage.setItem('pending_notification_redirect', JSON.stringify({
                        type,
                        resourceId
                    }));

                    // 2. LÓGICA INTELIGENTE DE NAVEGACIÓN
                    const token = localStorage.getItem('token');

                    if (token) {
                        window.location.href = '/vehicle';
                    } else {
                        navigate('/login');
                    }
                });

            } catch (error) {
            }
        };

        registerForNotifications();

        return () => {
            PushNotifications.removeAllListeners();
        };
    }, []);

    // --- Otros UseEffects ---
    useEffect(() => {
        const badge = document.querySelector('.grecaptcha-badge');
        if (badge) { badge.style.display = 'none'; badge.style.visibility = 'hidden'; }
    }, []);

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

    // --- RENDERIZADO DEL SPLASH SCREEN ---
    if (loading) {
        return (
            <div className="app-loading-screen">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!user) return null;

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
    const handleDeleteOne = async (id, event) => {
        if (event) event.stopPropagation();
        setNotifications(prev => prev.filter(n => n.id !== id));
        setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
        apiClient.delete(`/api/notifications/${id}`).catch(e => console.error(e));
    };
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