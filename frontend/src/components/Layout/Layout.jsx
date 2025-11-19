import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import Navbar from '../common/navBar/navBar';
import Footer from '../common/footer/footer';
import '../Layout/Layout.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import ChatWrapper from '../chat/ChatWrapper';
import { SocketProvider, useSocket } from '../../context/SocketContext';
import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'react-toastify';
import ChatBot from '../ChatBot/ChatBot'

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

const Layout = () => {
    // --- Hooks de Estado ---
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // Notificaciones de Campana
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    // Notificaciones de Chat
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isBotOpen, setIsBotOpen] = useState(false);
    const [unreadChatCount, setUnreadChatCount] = useState(0);

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
        // Cerramos el panel de notificaciones
        setIsNotificationOpen(false);

        // Navegamos según el tipo
        if (notif.type === 'vehicle_update' && notif.resourceId) {
            navigate(`/vehicle-detail/${notif.resourceId}`);
        }
        else if (notif.type === 'new_ticket' && notif.resourceId) {
            navigate(`/case/${notif.resourceId}`);
        }
        // Si es otro tipo (o no tiene ID), solo se cierra el panel y no navega
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

    useEffect(() => {
        if (user && user.admin) {
            const fetchNotifications = async () => {
                try {
                    const response = await apiClient.get('/api/notifications');

                    if (Array.isArray(response.data)) {
                        const notifs = response.data;
                        setNotifications(notifs);

                        // Calculamos cuántas no están leídas localmente
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
        // Oculta el ícono de reCAPTCHA
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

    // Oyente para la Campana  (Solo Admins)
    const NotificationsListener = () => {
        const socket = useSocket();
        useEffect(() => {
            if (!socket) return;
            const handleNewNotification = (data) => {
                console.log("Nueva notificación recibida:", data);
                // Agregamos la nueva al inicio y mantenemos las recientes
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

    // Oyente para el Globo de Chat  (Todos los Usuarios)
    const ChatListener = () => {
        const socket = useSocket();
        useEffect(() => {
            if (!socket || !user) return;

            const handleGuestMessage = (message) => {
                if (!isChatOpen && !user.admin) {
                    setUnreadChatCount(prev => prev + 1);
                }
            };
            const handleAdminNotification = (data) => {
                if (!isChatOpen && user.admin) {
                    setUnreadChatCount(prev => prev + 1);
                }
            };

            socket.on('new_message', handleGuestMessage);
            socket.on('new_message_notification', handleAdminNotification);

            return () => {
                socket.off('new_message', handleGuestMessage);
                socket.off('new_message_notification', handleAdminNotification);
            };
        }, [socket, user, isChatOpen]);

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

        // Si abrimos y hay no leídas...
        if (opening && unreadCount > 0) {
            // Actualización visual inmediata (Optimistic UI)
            setUnreadCount(0);

            try {
                //  Actualización REAL en Base de Datos
                await apiClient.put('/api/notifications/mark-all-read');
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

            } catch (error) {
                console.error("Error al marcar notificaciones como leídas:", error);
            }
        }
    };


    // Función para eliminar UNA sola notificación
    const handleDeleteOne = async (id, event) => {
        if (event) event.stopPropagation();

        // Actualización Optimista (Visual inmediata)
        setNotifications(prev => prev.filter(n => n.id !== id));

        // Si borramos una no leída, bajamos el contador
        setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));

        try {
            // Petición al Backend
            await apiClient.delete(`/api/notifications/${id}`);
        } catch (error) {
            console.error("Error eliminando notificación:", error);
        }
    };

    // Función para eliminar TODAS
    const handleClearAll = async () => {
        // Visual inmediata
        setNotifications([]);
        setUnreadCount(0);

        try {
            // 2. Petición al Backend
            await apiClient.delete('/api/notifications/clear-all');
        } catch (error) {
            console.error("Error vaciando notificaciones:", error);
        }
    };

    const handleToggleChat = () => {
        if (!isChatOpen) {
            setUnreadChatCount(0);
        }
        setIsChatOpen(prev => !prev);
    };

    // --- Renderizado ---
    return (
        <SocketProvider>
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
                        isChatOpen={isChatOpen}
                        onToggle={(state) => setIsBotOpen(state)}
                        onOpenAdminChat={() => {
                            if (!isChatOpen) handleToggleChat();
                        }}
                    />
                )}

                {/* Pasamos los props de estado al ChatWrapper */}
                <ChatWrapper
                    user={user}
                    isChatOpen={isChatOpen}
                    unreadChatCount={unreadChatCount}
                    onToggleChat={handleToggleChat}
                    hideButton={isBotOpen}
                />
            </div>

            {/* Montamos AMBOS oyentes */}
            {user.admin && <NotificationsListener />}
            {user && <ChatListener />}
        </SocketProvider>
    );
}

export default Layout;