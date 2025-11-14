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
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
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
    // Estados de admin
    const [activeRooms, setActiveRooms] = useState([]); 
    const [newChatUsers, setNewChatUsers] = useState([]); 
    const [currentView, setCurrentView] = useState('inbox');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [adminMessages, setAdminMessages] = useState([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const typingTimerRef = useRef(null);

    // --- 2. EFECTO DE CARGA DE DATOS  ---
    useEffect(() => {
        if (!user) return;
        if (user.admin) {
            const fetchAdminRooms = async () => {
                try {
                    setIsLoading(true);
                    const response = await apiClient.get('/api/chat/rooms');
                    setActiveRooms(response.data.activeRooms);
                    setNewChatUsers(response.data.newChatUsers);
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

    // --- Efecto para Escuchar Sockets  ---
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

        const handleShowTyping = (payload) => { setIsOtherUserTyping(true); };
        const handleHideTyping = (payload) => { setIsOtherUserTyping(false); };

        const handleAdminNotification = ({ message, roomId }) => {
            if (user.admin) {
                // Mueve la sala actualizada al principio de 'activeRooms'
                setActiveRooms(prevRooms => 
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
                setActiveRooms(prev => prev.filter(r => r.id !== roomId));
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

    // Funcion que inicia un chat desde el admin
    const handleStartNewChat = async (targetUser) => {
        try {
            setIsChatLoading(true); // Mostramos "Cargando..." en la vista de chat
            
            // Llamamos a la nueva ruta del backend
            const response = await apiClient.post('/api/chat/find-or-create-room', { 
                userId: targetUser.id 
            });

            // El backend nos devuelve la sala 
            const room = response.data;
        
            handleSelectRoom(room);
            setActiveRooms(prev => [room, ...prev.filter(r => r.user_id !== targetUser.id)]);
            setNewChatUsers(prev => prev.filter(u => u.id !== targetUser.id));

        } catch (error) {
            console.error("Error al iniciar nueva conversación:", error);
            toast.error("No se pudo iniciar el chat.");
            setIsChatLoading(false);
        }
        // finally se ejecuta dentro de handleSelectRoom
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
                                {
                                    msg.sender_id === user.id ?
                                        (user.admin ? 'Tú (Admin)' : 'Tú')
                                        :
                                        (msg.sender?.admin ? 'Admin' : msg.sender?.username)
                                }
                            </span>
                            <span className="message-timestamp">
                                {formatTimestamp(msg.created_at)}
                            </span>
                        </div>
                        {msg.image_urls && msg.image_urls.length > 0 && (
                            <div className="message-image-container">
                                {msg.image_urls.map((url, index) => (
                                    <a href={url} target="_blank" rel="noopener noreferrer" key={index}>
                                        <img src={url} alt={`Adjunto ${index + 1}`} className="message-image" />
                                    </a>
                                ))}
                            </div>
                        )}
                        {msg.content && (
                            <div className="message-content">
                                {msg.content}
                            </div>
                        )}
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

    // ---  FUNCIÓN renderChatBody ---
    const renderChatBody = () => {
        if (isLoading) { return <p>Cargando...</p>; }
        
        // --- LÓGICA DE ADMIN  ---
        if (user.admin) {
            // --- VISTA BANDEJA DE ENTRADA ---
            if (currentView === 'inbox') {
                return (
                    <div className="admin-inbox">
                        
                        {/* SECCIÓN CHATS ACTIVOS */}
                        <div className="chat-list-header">Chats Activos</div>
                        {activeRooms.length === 0 && (
                            <p style={{padding: '10px 15px', fontSize: '0.9rem', color: '#777'}}>
                                No hay conversaciones activas.
                            </p>
                        )}
                        {activeRooms.map(room => (
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

                        {/* SECCIÓN  INICIAR NUEVO CHAT */}
                        <div className="chat-list-header">Iniciar Nuevo Chat</div>
                        <div className="new-chat-list">
                            {newChatUsers.length === 0 && (
                                <p style={{padding: '10px 15px', fontSize: '0.9rem', color: '#777'}}>
                                    No hay más usuarios para contactar.
                                </p>
                            )}
                            {newChatUsers.map(chatUser => (
                                <div key={chatUser.id} className="new-chat-item" onClick={() => handleStartNewChat(chatUser)}>
                                    <div className={`online-indicator ${chatUser.isOnline ? 'online' : ''}`}></div>
                                    <div className="user-info">
                                        <div className="user-name">{chatUser.username}</div>
                                        <div className="user-unit">{chatUser.unidad}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }
            //  VISTA DE CHAT  
            if (currentView === 'chat') {
                if (isChatLoading) { return <p>Cargando mensajes...</p>; }
                return renderMessageList(adminMessages);
            }
        }
        
        // LÓGICA DE INVITADO 
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


// El Componente Principal (Wrapper) 
const ChatWrapper = ({ user, isChatOpen, unreadChatCount, onToggleChat }) => {
    // Estado para la animación de "pop"
    const [popping, setPopping] = useState(false);

    if (!user) {
        return null;
    }

    // Efecto para la animación de "pop"
    useEffect(() => {
        // Solo hacemos 'pop' si el número de no leídos AUMENTA
        if (unreadChatCount > 0) {
            setPopping(true);
            const timer = setTimeout(() => setPopping(false), 200); // Duración de la animación en CSS
            return () => clearTimeout(timer);
        }
    }, [unreadChatCount]);

    return (
        <div className="chat-wrapper-container">
            {/* Usamos el prop 'isChatOpen' para mostrar/ocultar */}
            {isChatOpen && <ChatWindow onClose={onToggleChat} user={user} />}

            {/* Usamos el prop 'onToggleChat' para el click */}
            <button className="chat-bubble-button" onClick={onToggleChat}>
                {isChatOpen ? <CloseIcon /> : <ChatIcon />}

                {/* Mostramos el globo contador si hay mensajes no leídos */}
                {unreadChatCount > 0 && (
                    <span className={`chat-unread-badge ${popping ? 'pop' : ''}`}>
                        {unreadChatCount > 9 ? '9+' : unreadChatCount}
                    </span>
                )}
            </button>
        </div>
    );
};

export default ChatWrapper;