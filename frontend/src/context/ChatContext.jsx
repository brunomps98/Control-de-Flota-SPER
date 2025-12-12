import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import apiClient from '../api/axiosConfig';
import { toast } from 'react-toastify';

// Creamos el contexto del chat

const ChatContext = createContext();

// Hook para usar el contexto del chat

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children, user }) => {
    const socket = useSocket();

    // Estados de chat
    const [guestRoom, setGuestRoom] = useState(null);
    const [guestMessages, setGuestMessages] = useState([]);
    const [activeRooms, setActiveRooms] = useState([]);
    const [newChatUsers, setNewChatUsers] = useState([]);
    const [currentView, setCurrentView] = useState('inbox');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [adminMessages, setAdminMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);

    // Estado de notificaciones
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const loadedUserIdRef = useRef(null);

    // Carga inicial del chat
    useEffect(() => {
        if (!user) return;
        if (loadedUserIdRef.current === user.id) return;

        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                // Si es admin llevamos al buzón con todos los mensajes
                if (user.admin) {
                    const response = await apiClient.get('/api/chat/rooms');
                    setActiveRooms(response.data.activeRooms);
                    setNewChatUsers(response.data.newChatUsers);
                    // Si no es admin mostramos redirigimos solamente al chat con el admin
                } else {
                    const response = await apiClient.get('/api/chat/myroom');
                    setGuestRoom(response.data.room);
                    setGuestMessages(response.data.messages);
                }
                loadedUserIdRef.current = user.id;
            } catch (error) {
                console.error("Error cargando chat:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [user?.id]);

    // Listeners
    useEffect(() => {
        if (!socket || !user) return;

        // Manejo de nuevos mensajes

        const handleNewMessage = (message) => {
            if (!user.admin && message.room_id === guestRoom?.id) {
                setGuestMessages((prev) => [...prev, message]);
                if (!isChatOpen) setUnreadChatCount(prev => prev + 1);
            }
            else if (user.admin) {
                if (selectedRoom?.id === message.room_id) {
                    setAdminMessages((prev) => [...prev, message]);
                } else {
                    if (!isChatOpen) setUnreadChatCount(prev => prev + 1);
                    setActiveRooms(prevRooms => {
                        const roomIndex = prevRooms.findIndex(r => r.id === message.room_id);
                        if (roomIndex === -1) return prevRooms;
                        const updatedRooms = [...prevRooms];
                        const roomToUpdate = { ...updatedRooms[roomIndex] };
                        roomToUpdate.last_message = message.type === 'text' ? message.content.substring(0, 30) : `📎 [${message.type}]`;
                        roomToUpdate.updated_at = message.created_at;
                        updatedRooms.splice(roomIndex, 1);
                        updatedRooms.unshift(roomToUpdate);
                        return updatedRooms;
                    });
                }
            }
        };
        
        // Notiicaciones para admin
        const handleAdminNotification = ({ message, roomId }) => {
            if (user.admin) {
                setActiveRooms(prevRooms => {
                    const roomExists = prevRooms.some(r => r.id === roomId);
                    if (roomExists) {
                        return prevRooms.map(room =>
                            room.id === roomId
                                ? { ...room, last_message: message.type === 'text' ? message.content?.substring(0, 30) : `📎 [${message.type}]`, updated_at: message.created_at }
                                : room
                        ).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
                    } else {
                        apiClient.get('/api/chat/rooms').then(res => {
                            setActiveRooms(res.data.activeRooms);
                            setNewChatUsers(res.data.newChatUsers);
                        });
                        return prevRooms;
                    }
                });
                if (!isChatOpen) setUnreadChatCount(prev => prev + 1);
            }
        };
        // Para eliminación de mensajes y de salas
        const handleMessageDeleted = ({ messageId, roomId }) => {
            if (user.admin && selectedRoom?.id === roomId) setAdminMessages(prev => prev.filter(m => m.id !== messageId));
            if (!user.admin && guestRoom?.id === roomId) setGuestMessages(prev => prev.filter(m => m.id !== messageId));
        };

        // Manejo de sala eliminada

        const handleRoomDeleted = ({ roomId }) => {
            if (user.admin) {
                setActiveRooms(prev => prev.filter(r => r.id !== roomId));
                if (selectedRoom?.id === roomId) {
                    setCurrentView('inbox');
                    setSelectedRoom(null);
                }
            }
            if (!user.admin && guestRoom?.id === roomId) {
                setGuestMessages([]);
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('new_message_notification', handleAdminNotification);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('room_deleted', handleRoomDeleted);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('new_message_notification', handleAdminNotification);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('room_deleted', handleRoomDeleted);
        };
    }, [socket, user, guestRoom, selectedRoom, isChatOpen]);

    // Acciones

    // Seleccionar sala
    const selectRoom = async (room) => {
        try {
            setIsChatLoading(true);
            setCurrentView('chat');
            setSelectedRoom(room);
            const response = await apiClient.get(`/api/chat/room/${room.id}/messages`);
            setAdminMessages(response.data.messages);
            socket.emit('admin_join_room', room.id);
        } catch (error) {
            console.error(error);
        } finally {
            setIsChatLoading(false);
        }
    };
    // Iniciar nuevo chat
    const startNewChat = async (targetUser) => {
        try {
            setIsChatLoading(true);
            const response = await apiClient.post('/api/chat/find-or-create-room', { userId: targetUser.id });
            selectRoom(response.data);
            setActiveRooms(prev => [response.data, ...prev.filter(r => r.user_id !== targetUser.id)]);
            setNewChatUsers(prev => prev.filter(u => u.id !== targetUser.id));
        } catch (error) {
            toast.error("Error al iniciar chat.");
            setIsChatLoading(false);
        }
    };

    // Cerrar y abrir chat 
    const toggleChat = () => {
        if (!isChatOpen) setUnreadChatCount(0);
        setIsChatOpen(prev => !prev);
    };

    // Valores del contexto

    const value = {
        user, socket,
        guestRoom, guestMessages, setGuestMessages,
        activeRooms, setActiveRooms,
        newChatUsers, setNewChatUsers,
        currentView, setCurrentView,
        selectedRoom, setSelectedRoom,
        adminMessages, setAdminMessages,
        isLoading,
        isChatLoading,
        setIsChatLoading,
        unreadChatCount, isChatOpen,
        selectRoom, startNewChat, toggleChat
    };

    // Proveemos el contexto a los hijos
    
    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};