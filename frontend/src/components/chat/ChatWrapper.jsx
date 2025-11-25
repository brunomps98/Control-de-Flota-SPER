import React, { useState, useEffect, useRef } from 'react';
import './ChatWrapper.css';
import { useSocket } from '../../context/SocketContext';
import apiClient from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Iconos 
const ThreeDotIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" /></svg>);
const ChatIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="32" height="32"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const BackIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>);
const AttachIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" /></svg>);
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" /></svg>);

const formatTimestamp = (isoDateString) => {
    if (!isoDateString) return '';
    try {
        const date = parseISO(isoDateString);
        if (isToday(date)) return format(date, 'p', { locale: es });
        if (isYesterday(date)) return 'Ayer';
        return format(date, 'P', { locale: es });
    } catch (error) { return ''; }
};

const ChatWindow = ({ onClose, user }) => {
    const socket = useSocket();
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Estados
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    
    // Estados para archivo adjunto
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const [guestRoom, setGuestRoom] = useState(null);
    const [guestMessages, setGuestMessages] = useState([]);
    
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

    // Carga Inicial 
    useEffect(() => {
        if (!user) return;
        if (user.admin) {
            const fetchAdminRooms = async () => {
                try {
                    setIsLoading(true);
                    const response = await apiClient.get('/api/chat/rooms');
                    setActiveRooms(response.data.activeRooms);
                    setNewChatUsers(response.data.newChatUsers);
                } catch (error) { console.error(error); } 
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
                } catch (error) { console.error(error); } 
                finally { setIsLoading(false); }
            };
            fetchGuestRoom();
        }
    }, [user]);

    //  Listeners de Socket 
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

        const handleShowTyping = () => setIsOtherUserTyping(true);
        const handleHideTyping = () => setIsOtherUserTyping(false);

        const handleAdminNotification = ({ message, roomId }) => {
            if (user.admin) {
                setActiveRooms(prevRooms =>
                    prevRooms.map(room =>
                        room.id === roomId
                            ? { 
                                ...room, 
                                last_message: message.type === 'text' ? message.content.substring(0, 30) : `📎 [${message.type}]`, 
                                updated_at: message.created_at 
                              }
                            : room
                    ).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                );
            }
        };

        const handleMessageDeleted = ({ messageId, roomId }) => {
            if (user.admin && selectedRoom?.id === roomId) {
                setAdminMessages(prev => prev.filter(m => m.id !== messageId));
            }
            if (!user.admin && guestRoom?.id === roomId) {
                setGuestMessages(prev => prev.filter(m => m.id !== messageId));
            }
        };

        const handleRoomDeleted = ({ roomId }) => {
            if (user.admin) {
                setActiveRooms(prev => prev.filter(r => r.id !== roomId));
                if (selectedRoom?.id === roomId) handleBackToInbox();
            }
            if (!user.admin && guestRoom?.id === roomId) {
                setGuestMessages([]);
                setGuestRoom(null);
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('new_message_notification', handleAdminNotification);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('room_deleted', handleRoomDeleted);
        socket.on('show_typing', handleShowTyping);
        socket.on('hide_typing', handleHideTyping);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('new_message_notification', handleAdminNotification);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('room_deleted', handleRoomDeleted);
            socket.off('show_typing', handleShowTyping);
            socket.off('hide_typing', handleHideTyping);
        };
    }, [socket, user, guestRoom, selectedRoom]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [guestMessages, adminMessages, previewUrl]);

    // Manejo de archivos 
    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Validar tamaño 
            if (file.size > 50 * 1024 * 1024) {
                toast.error("El archivo es demasiado grande (Max 50MB)");
                return;
            }

            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Envio de mensajes 
    const handleSendMessage = async (e) => {
        e.preventDefault();
        const targetRoomId = user.admin ? selectedRoom?.id : guestRoom?.id;
        if (!socket || !targetRoomId) return;
        if (!newMessage.trim() && !selectedFile) return;

        let fileUrl = null;
        let fileType = 'text';

        // Subir Archivo si existe
        if (selectedFile) {
            setIsUploading(true);
            try {
                const formData = new FormData();
                formData.append('file', selectedFile);

                const response = await apiClient.post('/api/chat/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                fileUrl = response.data.fileUrl;
                fileType = response.data.fileType;

            } catch (error) {
                console.error("Error subiendo archivo:", error);
                toast.error("Error al enviar el archivo.");
                setIsUploading(false);
                return; // Detenemos el envío si falla la subida
            }
            setIsUploading(false);
        }

        // Emitir Socket con la data
        socket.emit('send_message', {
            roomId: targetRoomId,
            content: newMessage.trim(), // Texto (puede ir vacío si hay foto)
            type: fileType,             // 'text', 'image', 'video', 'audio'
            file_url: fileUrl
        });

        // Limpiar
        setNewMessage("");
        handleRemoveFile();
    };

    const handleTypingChange = (e) => {
        setNewMessage(e.target.value);
        const targetRoomId = user.admin ? selectedRoom?.id : guestRoom?.id;
        if (!socket || !targetRoomId) return;
        if (!typingTimerRef.current) socket.emit('typing_start', { roomId: targetRoomId });
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            socket.emit('typing_stop', { roomId: targetRoomId });
            typingTimerRef.current = null;
        }, 2000);
    };

    const handleSelectRoom = async (room) => {
        try {
            setIsChatLoading(true);
            setCurrentView('chat');
            setSelectedRoom(room);
            const response = await apiClient.get(`/api/chat/room/${room.id}/messages`);
            setAdminMessages(response.data.messages);
            socket.emit('admin_join_room', room.id);
        } catch (error) { console.error(error); } 
        finally { setIsChatLoading(false); }
    };

    const handleStartNewChat = async (targetUser) => {
        try {
            setIsChatLoading(true);
            const response = await apiClient.post('/api/chat/find-or-create-room', { userId: targetUser.id });
            handleSelectRoom(response.data);
            setActiveRooms(prev => [response.data, ...prev.filter(r => r.user_id !== targetUser.id)]);
            setNewChatUsers(prev => prev.filter(u => u.id !== targetUser.id));
        } catch (error) { toast.error("Error al iniciar chat."); setIsChatLoading(false); }
    };

    const handleBackToInbox = () => {
        setCurrentView('inbox');
        setSelectedRoom(null);
        setAdminMessages([]);
        setIsOtherUserTyping(false);
    };

    const handleDelete = (messageId) => {
        setOpenMenuId(null);
        Swal.fire({
            title: '¿Borrar mensaje?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí'
        }).then((result) => {
            if (result.isConfirmed) socket.emit('delete_message', { messageId });
        });
    };

    // --- RENDERIZADO DE CONTENIDO MULTIMEDIA ---
    const renderMessageContent = (msg) => {
        const isMyMessage = msg.sender_id === user.id;
        
        return (
            <div className="message-content-wrapper">
                {/* Archivo Multimedia */}
                {msg.file_url && (
                    <div className="media-container">
                        {msg.type === 'image' ? (
                            <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                                <img src={msg.file_url} alt="Adjunto" className="message-image" />
                            </a>
                        ) : msg.type === 'video' ? (
                            <video src={msg.file_url} controls className="message-video" />
                        ) : msg.type === 'audio' ? (
                            <audio src={msg.file_url} controls className="message-audio" />
                        ) : (
                            <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="message-file-link">
                                📎 Descargar Archivo
                            </a>
                        )}
                    </div>
                )}
                
                {/* Texto del Mensaje */}
                {msg.content && <p className="message-text">{msg.content}</p>}
            </div>
        );
    };

    const renderMessageList = (messages) => (
        <div className="message-list">
            {messages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.sender_id === user.id ? 'sent' : 'received'}`}>
                    <div className="message-bubble">
                        <div className="message-header">
                            <span className="message-sender">
                                {msg.sender_id === user.id ? (user.admin ? 'Tú (Admin)' : 'Tú') : (msg.sender?.admin ? 'Admin' : msg.sender?.username)}
                            </span>
                            <span className="message-timestamp">{formatTimestamp(msg.created_at)}</span>
                        </div>
                        
                        {renderMessageContent(msg)}

                    </div>
                    <div className="message-options-wrapper">
                        <button className="message-options-btn" onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}>
                            <ThreeDotIcon />
                        </button>
                        {openMenuId === msg.id && (
                            <div className="message-menu">
                                {msg.content && <button onClick={() => {navigator.clipboard.writeText(msg.content); setOpenMenuId(null);}}>Copiar</button>}
                                <button className="message-menu-delete" onClick={() => handleDelete(msg.id)}>Eliminar</button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {isOtherUserTyping && (
                <div className="message-row received">
                    <div className="message-bubble typing-indicator">
                        <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );

    const renderChatBody = () => {
        if (isLoading) return <p>Cargando...</p>;
        if (user.admin && currentView === 'inbox') {
            return (
                <div className="admin-inbox">
                    <div className="chat-list-header">Chats Activos</div>
                    {activeRooms.length === 0 && <p style={{padding:'10px', color:'#777'}}>Sin chats activos.</p>}
                    {activeRooms.map(room => (
                        <div key={room.id} className="admin-room-item" onClick={() => handleSelectRoom(room)}>
                            <div className="room-item-user">
                                <div className={`online-indicator ${room.isOnline ? 'online' : ''}`}></div>
                                {room.user.username}
                            </div>
                            <div className="room-item-preview">{room.last_message}</div>
                            <div className="room-item-timestamp">{formatTimestamp(room.updated_at)}</div>
                        </div>
                    ))}
                    <div className="chat-list-header">Iniciar Nuevo Chat</div>
                    {newChatUsers.map(chatUser => (
                        <div key={chatUser.id} className="new-chat-item" onClick={() => handleStartNewChat(chatUser)}>
                            <div className={`online-indicator ${chatUser.isOnline ? 'online' : ''}`}></div>
                            <div className="user-name">{chatUser.username}</div>
                        </div>
                    ))}
                </div>
            );
        }
        if (user.admin && currentView === 'chat') return isChatLoading ? <p>Cargando...</p> : renderMessageList(adminMessages);
        return guestMessages.length === 0 ? <p style={{padding:'15px', color:'#bbb'}}>Inicia la conversación...</p> : renderMessageList(guestMessages);
    };

    const renderChatFooter = () => {
        if (user.admin && currentView === 'inbox') return null;
        return (
            <div className="chat-footer-wrapper">
                {selectedFile && (
                    <div className="image-preview-container">
                        {selectedFile.type.startsWith('image') ? (
                            <img src={previewUrl} alt="Preview" className="image-preview" />
                        ) : (
                            <div className="file-preview-icon">📄 {selectedFile.name}</div>
                        )}
                        <button className="remove-image-btn" onClick={handleRemoveFile}><CloseIcon/></button>
                    </div>
                )}

                <form className="chat-footer" onSubmit={handleSendMessage}>
                    {/* INPUT OCULTO */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        style={{display: 'none'}} 
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                    />
                    
                    {/* BOTÓN CLIP */}
                    <button 
                        type="button" 
                        className="chat-btn-attach" 
                        onClick={() => fileInputRef.current.click()}
                        disabled={isUploading || isLoading}
                        title="Adjuntar archivo"
                    >
                        <AttachIcon />
                    </button>

                    <input
                        type="text"
                        className="chat-text-input"
                        placeholder={isUploading ? "Subiendo archivo..." : "Escribe un mensaje..."}
                        value={newMessage}
                        onChange={handleTypingChange}
                        disabled={isLoading || isUploading}
                    />
                    <button
                        type="submit"
                        className="chat-btn-send"
                        disabled={isLoading || isUploading || (!newMessage.trim() && !selectedFile)}
                    >
                        {isUploading ? '...' : 'Enviar'}
                    </button>
                </form>
            </div>
        );
    };

    return (
        <div className="chat-window">
            <div className="chat-header">
                {user.admin && currentView === 'chat' && <button onClick={handleBackToInbox} className="chat-back-btn"><BackIcon/></button>}
                <h3>{user.admin ? (currentView === 'inbox' ? 'Bandeja' : selectedRoom?.user?.username) : 'Soporte'}</h3>
                {!(user.admin && currentView === 'inbox') && (
                    <div className="chat-header-options">
                        <button className="chat-header-menu-btn" onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}><ThreeDotIcon/></button>
                        {isHeaderMenuOpen && <div className="chat-header-menu"><button onClick={onClose}>Cerrar</button></div>}
                    </div>
                )}
                {user.admin && currentView === 'inbox' && <button onClick={onClose} className="chat-close-btn-simple"><CloseIcon/></button>}
            </div>
            <div className="chat-body">{renderChatBody()}</div>
            {renderChatFooter()}
        </div>
    );
};

// Wrapper
const ChatWrapper = ({ user, isChatOpen, unreadChatCount, onToggleChat, hideButton }) => {
    const [popping, setPopping] = useState(false);
    useEffect(() => { if (unreadChatCount > 0) { setPopping(true); setTimeout(() => setPopping(false), 200); } }, [unreadChatCount]);
    if (!user) return null;
    return (
        <div className="chat-wrapper-container">
            {isChatOpen && <ChatWindow onClose={onToggleChat} user={user} />}
            <button className={`chat-bubble-button ${hideButton ? 'hide' : ''}`} onClick={onToggleChat}>
                {isChatOpen ? <CloseIcon /> : <ChatIcon />}
                {unreadChatCount > 0 && <span className={`chat-unread-badge ${popping ? 'pop' : ''}`}>{unreadChatCount > 9 ? '9+' : unreadChatCount}</span>}
            </button>
        </div>
    );
};

export default ChatWrapper;