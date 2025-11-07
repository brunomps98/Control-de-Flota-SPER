// En: frontend/src/components/chat/ChatWrapper.jsx (Con Timestamps)

import React, { useState, useEffect, useRef } from 'react';
import './ChatWrapper.css';
import { useSocket } from '../../context/SocketContext';
import apiClient from '../../api/axiosConfig';

// --- ▼▼ 1. IMPORTAMOS LIBRERÍA DE FECHAS ▼▼ ---
// (Asegúrate de haber corrido: npm install date-fns)
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale'; // Para formato en español (ej. "Ayer")
// --- ▲▲ -------------------------------------- ▲▲ ---


// --- Iconos (Sin cambios) ---
const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="32" height="32">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.86 8.25-8.625 8.25a9.76 9.76 0 0 1-2.53-..429m-3.53-3.61a3.847 3.847 0 0 1-4.13-3.69C2.25 12 3.86 8.25 8.625 8.25c4.765 0 8.625 3.69 8.625 8.25 0 .81-.123 1.58-.35 2.29l3.22 3.22a.75.75 0 0 0 1.06-1.06l-3.22-3.22A9.73 9.73 0 0 0 21 12Z" />
    </svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="24" height="24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="20" height="20">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);
// --- Fin de Iconos ---


// --- ▼▼ 2. FUNCIÓN HELPER PARA FORMATEAR FECHA ▼▼ ---
const formatTimestamp = (isoDateString) => {
    if (!isoDateString) return '';
    
    try {
        const date = parseISO(isoDateString); // Convierte el string de la DB a un objeto Date

        if (isToday(date)) {
            // "1:06 PM"
            return format(date, 'p', { locale: es }); // 'p' es el formato de hora corta
        }
        if (isYesterday(date)) {
            // "Ayer"
            return 'Ayer';
        }
        // "7/11/2025"
        return format(date, 'P', { locale: es }); // 'P' es el formato de fecha corta
    } catch (error) {
        console.error("Error formateando fecha:", error);
        return ''; // Devuelve vacío si la fecha es inválida
    }
};
// --- ▲▲ ----------------------------------------- ▲▲ ---


// --- LÓGICA DE CHATWINDOW ---
const ChatWindow = ({ onClose, user }) => {
    const socket = useSocket(); 
    const messagesEndRef = useRef(null); 
    
    // --- Estados (Sin cambios) ---
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [guestRoom, setGuestRoom] = useState(null);
    const [guestMessages, setGuestMessages] = useState([]);
    const [adminRooms, setAdminRooms] = useState([]); 
    const [currentView, setCurrentView] = useState('inbox'); 
    const [selectedRoom, setSelectedRoom] = useState(null); 
    const [adminMessages, setAdminMessages] = useState([]); 
    const [isChatLoading, setIsChatLoading] = useState(false); 

    // --- 1. Efecto para Cargar Datos (API) ---
    useEffect(() => {
        if (!user) return; 

        if (user.admin) {
            const fetchAdminRooms = async () => {
                try {
                    setIsLoading(true);
                    const response = await apiClient.get('/api/chat/rooms');
                    setAdminRooms(response.data);
                } catch (error) { console.error("Error al cargar salas de admin:", error); } 
                finally { setIsLoading(false); }
            };
            fetchAdminRooms();
        } else {
            const fetchGuestRoom = async () => {
                try {
                    setIsLoading(true);
                    const response = await apiClient.get('/api/chat/myroom');
                    setGuestRoom(response.data.room);
                    setGuestMessages(response.data.messages);
                } catch (error) { console.error("Error al cargar la sala de chat:", error); } 
                finally { setIsLoading(false); }
            };
            fetchGuestRoom();
        }
    }, [user]); 

    // --- 2. Efecto para Escuchar Sockets ---
    useEffect(() => {
        if (!socket) return; 

        const handleNewMessage = (message) => {
            const guestRoomId = guestRoom?.id;
            const adminSelectedRoomId = selectedRoom?.id;

            if (!user.admin && message.room_id === guestRoomId) {
                setGuestMessages((prev) => [...prev, message]);
            } else if (user.admin && message.room_id === adminSelectedRoomId) {
                setAdminMessages((prev) => [...prev, message]);
            }
        };
        
        const handleAdminNotification = ({ message, roomId }) => {
            if (user.admin) {
                setAdminRooms(prevRooms => 
                    prevRooms.map(room => 
                        room.id === roomId 
                        // Actualizamos el last_message Y el updated_at
                        ? { ...room, last_message: message.content.substring(0, 30), updated_at: message.created_at } 
                        : room
                    )
                    // Re-ordenamos la lista
                    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                );
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('new_message_notification', handleAdminNotification);
        
        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('new_message_notification', handleAdminNotification);
        };
    }, [socket, user, guestRoom, selectedRoom]); 

    // --- 3. Efecto para Auto-Scroll ---
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [guestMessages, adminMessages]); 

    // --- 4. Funciones (Enviar Mensaje y Admin) ---
    const handleSendMessage = (e) => {
        e.preventDefault();
        const targetRoomId = user.admin ? selectedRoom?.id : guestRoom?.id;
        if (!socket || !newMessage.trim() || !targetRoomId) return;
        socket.emit('send_message', { roomId: targetRoomId, content: newMessage });
        setNewMessage(""); 
    };
    
    const handleSelectRoom = async (room) => {
        try {
            setIsChatLoading(true); 
            setCurrentView('chat'); 
            setSelectedRoom(room); 
            const response = await apiClient.get(`/api/chat/room/${room.id}/messages`);
            setAdminMessages(response.data.messages);
            socket.emit('admin_join_room', room.id);
        } catch (error) { console.error("Error al cargar mensajes de la sala:", error); } 
        finally { setIsChatLoading(false); }
    };

    const handleBackToInbox = () => {
        setCurrentView('inbox');
        setSelectedRoom(null);
        setAdminMessages([]);
    };

    // --- 5. Renderizado ---
    
    // Función helper para renderizar la lista de mensajes (de admin o invitado)
    const renderMessageList = (messages) => (
        <div className="message-list">
            {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    className={`message-bubble ${msg.sender_id === user.id ? 'sent' : 'received'}`}
                >
                    <div className="message-header">
                        <span className="message-sender">
                            {msg.sender_id === user.id ? (user.admin ? 'Tú (Admin)' : 'Tú') : (msg.sender?.username || 'Admin')}
                        </span>
                        {/* --- ▼▼ 3. MOSTRAMOS LA FECHA FORMATEADA ▼▼ --- */}
                        <span className="message-timestamp">
                            {formatTimestamp(msg.created_at)}
                        </span>
                        {/* --- ▲▲ --------------------------------------- ▲▲ --- */}
                    </div>
                    <div className="message-content">
                        {msg.content}
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );

    // El "cuerpo" (lista de mensajes o lista de salas)
    const renderChatBody = () => {
        if (isLoading) { return <p>Cargando...</p>; }
        
        if (user.admin) {
            if (currentView === 'inbox') {
                return (
                    <div className="admin-inbox">
                        {adminRooms.length === 0 && <p>No hay conversaciones activas.</p>}
                        {adminRooms.map(room => (
                            <div key={room.id} className="admin-room-item" onClick={() => handleSelectRoom(room)}>
                                <div className="room-item-user">{room.user.username}</div>
                                <div className="room-item-preview">{room.last_message}</div>
                                <div className="room-item-unit">{room.user.unidad}</div>
                                {/* --- ▼▼ 4. MOSTRAMOS FECHA EN LA BANDEJA DE ENTRADA ▼▼ --- */}
                                <div className="room-item-timestamp">
                                    {formatTimestamp(room.updated_at)}
                                </div>
                                {/* --- ▲▲ ------------------------------------------------ ▲▲ --- */}
                            </div>
                        ))}
                    </div>
                );
            }
            if (currentView === 'chat') {
                if (isChatLoading) { return <p>Cargando mensajes...</p>; }
                return renderMessageList(adminMessages);
            }
        }

        // Vista de Invitado
        if (guestMessages.length === 0 && !isLoading) {
            return <p>Inicia la conversación. Un administrador te responderá.</p>;
        }
        return renderMessageList(guestMessages);
    };
    
    // El "pie" (caja de texto para enviar)
    const renderChatFooter = () => {
        if (user.admin && currentView === 'inbox') return null; 
        return (
            <form className="chat-footer" onSubmit={handleSendMessage}>
                <input 
                    type="text" 
                    placeholder="Escribe un mensaje..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isLoading || isChatLoading}
                />
                <button type="submit" disabled={isLoading || isChatLoading}>
                    Enviar
                </button>
            </form>
        );
    };

    return (
        <div className="chat-window">
            <div className="chat-header">
                {user.admin && currentView === 'chat' && (
                    <button onClick={handleBackToInbox} className="chat-back-btn">
                        <BackIcon />
                    </button>
                )}
                <h3>
                    {user.admin ? (currentView === 'inbox' ? 'Bandeja de Entrada' : (selectedRoom?.user?.username || 'Chat')) : 'Chat de Soporte'}
                </h3>
                <button onClick={onClose} className="chat-close-btn">
                    <CloseIcon />
                </button>
            </div>
            <div className="chat-body">
                {renderChatBody()}
            </div>
            {renderChatFooter()}
        </div>
    );
};


// --- El Componente Principal (Wrapper) (Sin cambios) ---
const ChatWrapper = ({ user }) => {
    const [isOpen, setIsOpen] =  useState(false);
    const toggleChat = () => setIsOpen(prev => !prev);

    // Si el usuario no existe (aún cargando o deslogueado), no renderices el chat
    if (!user) {
        return null;
    }

    return (
        <div className="chat-wrapper-container">
            {isOpen && <ChatWindow onClose={toggleChat} user={user} />}
            <button className="chat-bubble-button" onClick={toggleChat}>
                {isOpen ? <CloseIcon /> : <ChatIcon />}
            </button>
        </div>
    );
};

export default ChatWrapper;