import React, { useState, useEffect, useRef } from 'react';
import './ChatWrapper.css';
import { useSocket } from '../../context/SocketContext';
import apiClient from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Iconos ---
const ThreeDotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="16" height="16">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
    </svg>
);
const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="32" height="32">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.86 8.25-8.625 8.25a9.76 9.76 0 0 1-2.53-.429m-3.53-3.61a3.847 3.847 0 0 1-4.13-3.69C2.25 12 3.86 8.25 8.625 8.25c4.765 0 8.625 3.69 8.625 8.25 0 .81-.123 1.58-.35 2.29l3.22 3.22a.75.75 0 0 0 1.06-1.06l-3.22-3.22A9.73 9.73 0 0 0 21 12Z" />
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

// --- Función Helper de Timestamp ---
const formatTimestamp = (isoDateString) => {
    if (!isoDateString) return '';
    try {
        const date = parseISO(isoDateString); 
        if (isToday(date)) { return format(date, 'p', { locale: es }); }
        if (isYesterday(date)) { return 'Ayer'; }
        return format(date, 'P', { locale: es }); 
    } catch (error) {
        console.error("Error formateando fecha:", error);
        return ''; 
    }
};

// --- LÓGICA DE CHATWINDOW ---
const ChatWindow = ({ onClose, user }) => {
    const socket = useSocket(); 
    const messagesEndRef = useRef(null); 
    
    // --- Estados ---
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [guestRoom, setGuestRoom] = useState(null);
    const [guestMessages, setGuestMessages] = useState([]);
    const [adminRooms, setAdminRooms] = useState([]); 
    const [currentView, setCurrentView] = useState('inbox'); 
    const [selectedRoom, setSelectedRoom] = useState(null); 
    const [adminMessages, setAdminMessages] = useState([]); 
    const [isChatLoading, setIsChatLoading] = useState(false); 
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const typingTimerRef = useRef(null);

    // --- Efecto para Cargar Datos (API) ---
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

    // --- Efecto para Escuchar Sockets ---
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

        // Alguien está escribiendo
        const handleShowTyping = (payload) => {
            setIsOtherUserTyping(true);
        };
        // Alguien dejó de escribir
        const handleHideTyping = (payload) => {
            setIsOtherUserTyping(false);
        };

        const handleAdminNotification = ({ message, roomId }) => {
            if (user.admin) {
                setAdminRooms(prevRooms => 
                    prevRooms.map(room => 
                        room.id === roomId 
                        ? { ...room, last_message: message.content.substring(0, 30), updated_at: message.created_at } 
                        : room
                    ).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                );
            }
        };
        const handleMessageDeleted = (payload) => {
            const { messageId, roomId } = payload;
            if (user.admin && selectedRoom?.id === roomId) {
                setAdminMessages(prev => prev.filter(m => m.id !== messageId));
            }
            if (!user.admin && guestRoom?.id === roomId) {
                setGuestMessages(prev => prev.filter(m => m.id !== messageId));
            }
        };
        const handleRoomDeleted = (payload) => {
            const { roomId } = payload;
            if (user.admin) {
                setAdminRooms(prev => prev.filter(r => r.id !== roomId));
                if (selectedRoom?.id === roomId) {
                    handleBackToInbox(); 
                }
            }
            if (!user.admin && guestRoom?.id === roomId) {
                setGuestMessages([]);
                setGuestRoom(null); 
            }
        };
        const handleSuccess = (payload) => { toast.success(payload.message); };
        const handleError = (payload) => { toast.error(payload.message); };

        socket.on('new_message', handleNewMessage);
        socket.on('new_message_notification', handleAdminNotification);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('room_deleted', handleRoomDeleted);
        socket.on('show_typing', handleShowTyping);
        socket.on('hide_typing', handleHideTyping);
        socket.on('operation_success', handleSuccess);
        socket.on('operation_error', handleError);
        
        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('new_message_notification', handleAdminNotification);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('room_deleted', handleRoomDeleted);
            socket.off('show_typing', handleShowTyping);
            socket.off('hide_typing', handleHideTyping);
            socket.off('operation_success', handleSuccess);
            socket.off('operation_error', handleError);
        };
    }, [socket, user, guestRoom, selectedRoom]); 

    // --- Efecto para Auto-Scroll ---
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [guestMessages, adminMessages]); 

    // --- Funciones ---
    const handleSendMessage = (e) => {
        e.preventDefault();
        const targetRoomId = user.admin ? selectedRoom?.id : guestRoom?.id;
        
        // Validación solo para texto
        if (!socket || !newMessage.trim() || !targetRoomId) return;
        
        socket.emit('send_message', { 
            roomId: targetRoomId, 
            content: newMessage.trim() 
        });
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

    const handleBackToInbox = React.useCallback(() => {
        setCurrentView('inbox');
        setSelectedRoom(null);
        setAdminMessages([]);
    }, []); 

    const handleCopy = (text) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                toast.success('¡Mensaje copiado!');
            }, (err) => {
                toast.error('No se pudo copiar.');
            });
        }
        setOpenMenuId(null); 
    };
    const handleDelete = (messageId) => {
        setOpenMenuId(null); 
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡Vas a eliminar este mensaje! No podrás revertir esto.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33', 
            cancelButtonColor: '#007bff', 
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                socket.emit('delete_message', { messageId });
            }
        });
    };
    const handleClearHistory = () => {
        const targetRoomId = user.admin ? selectedRoom?.id : guestRoom?.id;
        if (!targetRoomId) return;
        setIsHeaderMenuOpen(false);
        Swal.fire({
            title: '¿Eliminar este chat?',
            text: "¡Vas a eliminar esta sala de chat! El invitado tendrá que iniciar una nueva conversación. No podrás revertir esto.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#007bff',
            confirmButtonText: 'Sí, ¡eliminar chat!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                socket.emit('delete_room', { roomId: targetRoomId });
            }
        });
    };

    const handleTypingChange = (e) => {
        setNewMessage(e.target.value);

        const targetRoomId = user.admin ? selectedRoom?.id : guestRoom?.id;
        if (!socket || !targetRoomId) return;

        if (!typingTimerRef.current) {
            socket.emit('typing_start', { roomId: targetRoomId });
        }

        if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
        }

        typingTimerRef.current = setTimeout(() => {
            socket.emit('typing_stop', { roomId: targetRoomId });
            typingTimerRef.current = null; 
        }, 2000);
    };
    
    // --- Renderizado ---
    
    const renderMessageList = (messages) => (
        <div className="message-list">
            {messages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.sender_id === user.id ? 'sent' : 'received'}`}>
                    <div className="message-bubble">
                        <div className="message-header">
                            <span className="message-sender">
                                {msg.sender_id === user.id ? (user.admin ? 'Tú (Admin)' : 'Tú') : (msg.sender?.username || 'Admin')}
                            </span>
                            <span className="message-timestamp">
                                {formatTimestamp(msg.created_at)}
                            </span>
                        </div>
                        <div className="message-content">
                            {msg.content}
                        </div>
                    </div>
                    <div className="message-options-wrapper">
                        <button className="message-options-btn" onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}>
                            <ThreeDotIcon />
                        </button>
                        {openMenuId === msg.id && (
                            <div className="message-menu">
                                <button onClick={() => handleCopy(msg.content)}>Copiar</button>
                                <button className="message-menu-delete" onClick={() => handleDelete(msg.id)}>Eliminar</button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {isOtherUserTyping && (
                <div className="message-row received">
                    <div className="message-bubble typing-indicator">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );

    const renderChatBody = () => {
        if (isLoading) { return <p>Cargando...</p>; }
        if (user.admin) {
            if (currentView === 'inbox') {
                return (
                    <div className="admin-inbox">
                        {adminRooms.length === 0 && <p>No hay conversaciones activas.</p>}
                        {adminRooms.map(room => (
                            <div key={room.id} className="admin-room-item" onClick={() => handleSelectRoom(room)}>
                                
                                <div className="room-item-user">
                                    <div className={`online-indicator ${room.isOnline ? 'online' : ''}`}></div>

                                    {room.user.username}
                                </div>

                                <div className="room-item-preview">{room.last_message}</div>
                                <div className="room-item-unit">{room.user.unidad}</div>
                                <div className="room-item-timestamp">{formatTimestamp(room.updated_at)}</div>
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
        if (guestMessages.length === 0 && !isLoading) {
            return <p>Inicia la conversación. Un administrador te responderá.</p>;
        }
        return renderMessageList(guestMessages);
    };
    
   const renderChatFooter = () => {
        if (user.admin && currentView === 'inbox') return null; 
        return (
            <form className="chat-footer" onSubmit={handleSendMessage}>
                <input 
                    type="text" 
                    placeholder="Escribe un mensaje..." 
                    value={newMessage}
                    onChange={handleTypingChange} 
                    disabled={isLoading || isChatLoading}
                />
                <button 
                    type="submit" 
                    className="chat-btn-send"
                    disabled={isLoading || isChatLoading || !newMessage.trim()}
                >
                    Enviar
                </button>
            </form>
        );
    };
    
    return (
        <div className="chat-window" onClick={(e) => {
            if (openMenuId && !e.target.closest('.message-options-btn') && !e.target.closest('.message-menu')) {
                setOpenMenuId(null);
            }
            if (isHeaderMenuOpen && !e.target.closest('.chat-header-menu-btn') && !e.target.closest('.chat-header-menu')) {
                setIsHeaderMenuOpen(false);
            }
        }}>
            <div className="chat-header">
                {user.admin && currentView === 'chat' && (
                    <button onClick={handleBackToInbox} className="chat-back-btn">
                        <BackIcon />
                    </button>
                )}
                <h3>
                    {user.admin ? (
                        currentView === 'inbox' ? (
                            'Bandeja de Entrada' 
                        ) : (
                            <div className="chat-header-title-with-status">
                                <div className={`online-indicator ${selectedRoom?.isOnline ? 'online' : ''}`}></div>
                                {selectedRoom?.user?.username || 'Chat'}
                            </div>
                        )
                    ) : (
                        'Chat de Soporte'
                    )}
                </h3>
                {!(user.admin && currentView === 'inbox') && (
                    <div className="chat-header-options">
                        <button className="chat-header-menu-btn" onClick={() => setIsHeaderMenuOpen(prev => !prev)}>
                            <ThreeDotIcon />
                        </button>
                        {isHeaderMenuOpen && (
                            <div className="chat-header-menu">
                                <button className="message-menu-delete" onClick={handleClearHistory}>Eliminar historial</button>
                                <button onClick={onClose}>Cerrar chat</button>
                            </div>
                        )}
                    </div>
                )}
                {(user.admin && currentView === 'inbox') && (
                     <button onClick={onClose} className="chat-close-btn-simple">
                        <CloseIcon />
                    </button>
                )}
            </div>
            <div className="chat-body">
                {renderChatBody()}
            </div>
            {renderChatFooter()}
        </div>
    );
};


// --- El Componente Principal (Wrapper) ---
const ChatWrapper = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const toggleChat = () => setIsOpen(prev => !prev);

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