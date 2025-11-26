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

    // ---  MANEJAR CLIC EN NOTIFICACIÓN ---
    const handleNotificationClick = (notif) => {
        setIsNotificationOpen(false);
        if (notif.type === 'vehicle_update' && notif.resourceId) {
            navigate(`/vehicle-detail/${notif.resourceId}`);
        }
        else if (notif.type === 'new_ticket' && notif.resourceId) {
            navigate(`/case/${notif.resourceId}`);
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
        if (Capacitor.getPlatform() === 'web') return;
        const registerForNotifications = async () => {
        };
        registerForNotifications();
    }, []);

    useEffect(() => {
        if (!user) return;
        const events = [
            'mousemove',
            'keydown',
            'touchstart',
            'scroll',
            'click'
        ];
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

    // Oyente para la Campana (Solo Admins)
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

    // --- Early Returns ---
    if (loading) {
        return <div>Cargando...</div>;
    }
    if (!user) {
        return null;
    }

    // --- Funciones Handler ---
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
            // --- CORRECCIÓN AQUÍ: Usar la ruta exacta que tienes en db.router.js ---
            await apiClient.delete('/api/notifications/clear-all');

            // Actualizar estado visual
            setNotifications([]);
            setUnreadCount(0);

        } catch (error) {
            console.error("Error al borrar notificaciones:", error);
        }
    };

    // --- Renderizado ---
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

                    {/* Solo lo mostramos si el usuario NO es admin  */}
                    {!user.admin && (
                        <ChatBot
                            // El bot se gestiona solo con el contexto, solo avisa si se abre/cierra
                            // para ajustar la posición del otro botón si fuera necesario
                            onToggle={(state) => setIsBotOpen(state)}
                        />
                    )}

                    {/* ChatWrapper consume contexto, solo pasamos si debe ocultarse por el bot */}
                    <ChatWrapper
                        hideButton={isBotOpen}
                    />
                </div>

                {/* Montamos oyente de notificaciones (Campana) */}
                {user.admin && <NotificationsListener />}

            </ChatProvider>
        </SocketProvider>
    );
}

export default Layout;