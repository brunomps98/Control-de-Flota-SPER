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

    // ---  MANEJAR CLIC EN NOTIFICACIÓN (WEB) ---
    const handleNotificationClick = async (notif) => {
        setIsNotificationOpen(false); // Cierra el panel

        const resourceId = notif.resourceId || notif.resource_id;
        const type = notif.type;

        console.log("Navegando a:", { type, resourceId });

        if (resourceId) {
            if (type === 'vehicle_update') {
                navigate(`/vehicle-detail/${resourceId}`);
            } else if (type === 'new_ticket') {
                navigate(`/case/${resourceId}`);
            } 
            else if (type === 'chat_message' || type === 'new_message') {
                if (user && user.admin) {
                    // Emitimos el evento para abrir la ventana flotante
                    window.dispatchEvent(new CustomEvent('OPEN_CHAT_ROOM', { detail: resourceId }));
                } else {
                    navigate('/chat');
                }
            }
        }
        // Bloque genérico (si no hay ID)
        else if (type === 'chat_message' || type === 'new_message') {
            if (user && user.admin) {
            } else {
                navigate('/chat');
            }
        }

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

    // --- UseEffects ---
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

    // --- Cargar notificaciones guardadas en DB (Solo Admin) ---
    useEffect(() => {
        if (user && user.admin) {
            const fetchNotifications = async () => {
                try {
                    const response = await apiClient.get('/api/notifications');
                    if (Array.isArray(response.data)) {
                        const notifs = response.data;
                        setNotifications(notifs);
                        const unread = notifs.filter(n => !n.is_read).length;
                        setUnreadCount(unread);
                    }
                } catch (error) {
                    console.error("Error cargando notificaciones:", error);
                }
            };
            fetchNotifications();
        }
    }, [user]);

    useEffect(() => {
        const badge = document.querySelector('.grecaptcha-badge');
        if (badge) {
            badge.style.display = 'none';
            badge.style.visibility = 'hidden';
        }
    }, []);

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
        // Solo ejecutar si estamos en una app nativa (Android/iOS)
        if (Capacitor.getPlatform() === 'web') return;

        const registerForNotifications = async () => {
            try {
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    console.warn('[FCM] Permiso de notificaciones denegado.');
                    return;
                }

                await PushNotifications.register();

                PushNotifications.addListener('registration', async (token) => {
                    console.log('[FCM] Token obtenido:', token.value);
                    try {
                        await apiClient.post('/api/user/fcm-token', { fcmToken: token.value });
                    } catch (error) {
                        console.error('[FCM] Error al guardar token en backend:', error);
                    }
                });

                PushNotifications.addListener('registrationError', (error) => {
                    console.error('[FCM] Error en registro:', error);
                });

                PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('[FCM] Notificación recibida en primer plano:', notification);
                    toast.info(notification.title || 'Nueva notificación');
                    setUnreadCount(prev => prev + 1); 
                });

                PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                    const data = notification.notification.data;
                    console.log('[FCM] Click en notificación:', data);

                    if (data.chatRoomId) {
                        if (user && user.admin) {
                            setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('OPEN_CHAT_ROOM', { detail: data.chatRoomId }));
                            }, 800); // Delay un poco mayor para asegurar que la app cargó el contexto
                        }
                        else navigate('/chat');
                    }
                    else if (data.vehicleId) {
                        navigate(`/vehicle-detail/${data.vehicleId}`);
                    }
                    else if (data.type === 'new_ticket') {
                        if (data.id) {
                            navigate(`/case/${data.id}`);
                        } else {
                            navigate('/support-tickets');
                        }
                    }
                });

            } catch (error) {
                console.error('[FCM] Error general en setup:', error);
            }
        };

        registerForNotifications();

        return () => {
            PushNotifications.removeAllListeners();
        };
    }, [user, navigate]); 

    useEffect(() => {
        if (!user) return;
        if (Capacitor.getPlatform() !== 'web') return;

        const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
        resetInactivityTimer();
        events.forEach(event => {
            window.addEventListener(event, resetInactivityTimer);
        });
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, resetInactivityTimer);
            });
        };
    }, [user, resetInactivityTimer]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isNotificationOpen) {
                setIsNotificationOpen(false);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, [isNotificationOpen]);

    // --- Componentes "Oyentes" de Sockets ---
    const NotificationsListener = () => {
        const socket = useSocket();
        useEffect(() => {
            if (!socket) return;
            const handleNewNotification = (data) => {
                console.log("Nueva notificación recibida:", data);
                setNotifications(prev => [data, ...prev].slice(0, 10));
                setUnreadCount(prev => prev + 1);
                toast.info(`🔔 ${data.message}`, { icon: false });
            };
            socket.on('new_notification', handleNewNotification);
            return () => {
                socket.off('new_notification', handleNewNotification);
            };
        }, [socket]);
        return null;
    };

    if (loading) {
        return <div>Cargando...</div>;
    }
    if (!user) {
        return null;
    }

    const handleBellClick = async (event) => {
        event.stopPropagation();
        const opening = !isNotificationOpen;
        setIsNotificationOpen(opening);

        if (opening && unreadCount > 0) {
            setUnreadCount(0);
            try {
                await apiClient.put('/api/notifications/mark-all-read');
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            } catch (error) {
                console.error("Error al marcar notificaciones como leídas:", error);
            }
        }
    };

    const handleDeleteOne = async (id, event) => {
        if (event) event.stopPropagation();
        setNotifications(prev => prev.filter(n => n.id !== id));
        setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
        try {
            await apiClient.delete(`/api/notifications/${id}`);
        } catch (error) {
            console.error("Error eliminando notificación:", error);
        }
    };

    const handleClearAll = async () => {
        try {
            await apiClient.delete('/api/notifications/clear-all');
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error("Error al borrar notificaciones:", error);
        }
    };

    return (
        <SocketProvider>
            <ChatProvider user={user}>
                <div className="layout-container" onClick={(e) => {
                    if (isNotificationOpen) {
                        setIsNotificationOpen(false);
                    }
                }}>
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

                    {!user.admin && (
                        <ChatBot onToggle={(state) => setIsBotOpen(state)} />
                    )}
                    <ChatWrapper hideButton={isBotOpen} />
                </div>
                {user.admin && <NotificationsListener />}
            </ChatProvider>
        </SocketProvider>
    );
}

export default Layout;