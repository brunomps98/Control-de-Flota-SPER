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

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

const Layout = () => {
    // --- Hooks de Estado (Sección de Hooks) ---
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // Notificaciones de Campana
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    // Notificaciones de Chat
    const [isChatOpen, setIsChatOpen] = useState(false);
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
                setNotifications(prev => [data, ...prev.slice(0, 9)]); 
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

            // Handler para cuando SOY INVITADO y recibo un mensaje
            const handleGuestMessage = (message) => {
                if (!isChatOpen && !user.admin) {
                    setUnreadChatCount(prev => prev + 1);
                }
            };
            // Handler para cuando SOY ADMIN y me notifican de un mensaje
            const handleAdminNotification = (data) => {
                if (!isChatOpen && user.admin) {
                    setUnreadChatCount(prev => prev + 1);
                }
            };

            socket.on('new_message', handleGuestMessage); // Para invitados
            socket.on('new_message_notification', handleAdminNotification); // Para admins

            return () => {
                socket.off('new_message', handleGuestMessage);
                socket.off('new_message_notification', handleAdminNotification);
            };
        }, [socket, user, isChatOpen]); // Depende de isChatOpen

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
    const handleBellClick = (event) => {
        event.stopPropagation();
        setIsNotificationOpen(prev => !prev);
        if (!isNotificationOpen) {
            setUnreadCount(0);
        }
    };

    // Handler para ABRIR/CERRAR el chat
    const handleToggleChat = () => {
        if (!isChatOpen) {
            setUnreadChatCount(0); // Resetea el contador al ABRIR
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
                />
                <main>
                    <Outlet context={{ user }} />
                </main>
                <Footer />
                
                {/* Pasamos los props de estado al ChatWrapper */}
                <ChatWrapper 
                    user={user}
                    isChatOpen={isChatOpen}
                    unreadChatCount={unreadChatCount}
                    onToggleChat={handleToggleChat}
                />
            </div>
            
            {/* Montamos AMBOS oyentes */}
            {user.admin && <NotificationsListener />}
            {user && <ChatListener />}
        </SocketProvider>
    );
}

export default Layout;