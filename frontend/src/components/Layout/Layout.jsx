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
        const resourceId = notif.resourceId || notif.resource_id;
        const type = notif.type;
        
        // Usamos la misma lógica de redirección
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

    // --- FUNCIÓN CENTRALIZADA DE REDIRECCIÓN ---
    const processRedirect = (type, resourceId) => {
        console.log("Procesando redirección:", { type, resourceId });
        
        if (type === 'vehicle_update' && resourceId) {
            navigate(`/vehicle-detail/${resourceId}`);
        } 
        else if (type === 'new_ticket') {
            if (resourceId) navigate(`/case/${resourceId}`);
            else navigate('/support-tickets');
        } 
        else if (type === 'chat_message' || type === 'new_message') {
            navigate('/chat'); 
            if (resourceId) {
                // Pequeño hack para pasar el ID al chat si ya está montado
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('OPEN_CHAT_ROOM', { detail: resourceId }));
                }, 500);
            }
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

    // VERIFICAR REDIRECCIONES PENDIENTES (AL CARGAR USUARIO) 
    useEffect(() => {
        if (user && !loading) {
            // Revisamos si había una notificación pendiente en el "buzón" (localStorage)
            const pendingRedirect = localStorage.getItem('pending_notification_redirect');
            
            if (pendingRedirect) {
                try {
                    const { type, resourceId } = JSON.parse(pendingRedirect);
                    console.log("Encontrada redirección pendiente:", type, resourceId);
                    
                    // Limpiamos el buzón para que no redirija eternamente
                    localStorage.removeItem('pending_notification_redirect');
                    
                    // Ejecutamos la redirección ahora que el usuario está logueado
                    processRedirect(type, resourceId);
                    
                } catch (e) {
                    console.error("Error parseando redirección pendiente", e);
                    localStorage.removeItem('pending_notification_redirect');
                }
            }
        }
    }, [user, loading]); // Se ejecuta cuando user cambia de null a objeto

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

                // Listeners
                PushNotifications.addListener('registration', async (token) => {
                    try {
                        await apiClient.post('/api/user/fcm-token', { fcmToken: token.value });
                    } catch (error) { /* Silent fail */ }
                });

                PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                    const data = notification.notification.data;
                    console.log('[FCM] Click recibido (raw):', data);

                    let type = data.type;
                    let resourceId = data.resourceId || data.chatRoomId || data.vehicleId || data.id;

                    // Normalización de datos según tu backend
                    if (data.chatRoomId) { type = 'chat_message'; resourceId = data.chatRoomId; }
                    else if (data.vehicleId) { type = 'vehicle_update'; resourceId = data.vehicleId; }

                    // GUARDAR EN EL "BUZÓN" (LocalStorage)
                    // No redirigimos directamente. Guardamos la intención y recargamos/dejamos seguir.
                    localStorage.setItem('pending_notification_redirect', JSON.stringify({
                        type,
                        resourceId
                    }));

                    if (window.location.pathname !== '/login') {
                         processRedirect(type, resourceId);
                         localStorage.removeItem('pending_notification_redirect'); // Ya lo usamos
                    } else {
                        // Si estamos en login, dejamos el item en localStorage para que
                        // cuando el usuario se loguee exitosamente y cargue Layout, se redirija.
                    }
                });

            } catch (error) {
                console.error('[FCM] Error setup:', error);
            }
        };

        registerForNotifications();

        return () => {
            PushNotifications.removeAllListeners();
        };
    }, []); // Array vacío: Se registra UNA sola vez al montar la app, independiente del usuario.

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

    // Listener de Sockets para Admin (Notificaciones en tiempo real)
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

    // Carga de notificaciones iniciales
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

    // --- RENDER ---
    if (loading) return <div>Cargando...</div>;
    
    // Si no hay usuario y ya terminó de cargar, Layout no renderiza nada (protección)
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