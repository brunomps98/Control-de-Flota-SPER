import React, { useState, useEffect, useRef } from 'react';
import './ChatWrapper.css';
import { useChat } from '../../context/ChatContext';
import apiClient from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Iconos
const ThreeDotIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" /></svg>);
const ChatIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="32" height="32"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const BackIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>);
const AttachIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" /></svg>);
const MicIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>);
const StopIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="20" height="20"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>);
const CancelIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const SendIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5" /></svg>);
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="60" height="60"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>);
const NewChatIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821C21.068 3.789 20.037 3.175 19.005 3.175ZM14.016 11.5H11.5v2.5h-1v-2.5H8v-1h2.5V8h1v2.5h2.516v1Z" /></svg>);

const formatTimestamp = (isoDateString) => {
    if (!isoDateString) return '';
    try {
        const date = parseISO(isoDateString);
        if (isToday(date)) return format(date, 'p', { locale: es });
        if (isYesterday(date)) return 'Ayer';
        return format(date, 'P', { locale: es });
    } catch (error) { return ''; }
};

const ChatWindow = ({ onClose }) => {
    const navigate = useNavigate();
    const {
        user, socket,
        guestRoom, guestMessages, setGuestMessages,
        activeRooms, setActiveRooms,
        newChatUsers, setNewChatUsers,
        currentView, setCurrentView,
        selectedRoom, setSelectedRoom,
        adminMessages, setAdminMessages,
        isLoading, isChatLoading,
        setIsChatLoading,
        selectRoom, startNewChat
    } = useChat();

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const [newMessage, setNewMessage] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const recordingInterval = useRef(null);

    // Estado para el botón flotante
    const [showContactList, setShowContactList] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const typingTimerRef = useRef(null);

    useEffect(() => {
        return () => { selectedFiles.forEach(file => { if (file.preview) URL.revokeObjectURL(file.preview); }); };
    }, [selectedFiles]);

    useEffect(() => {
        if (!socket) return;
        const handleShowTyping = () => setIsOtherUserTyping(true);
        const handleHideTyping = () => setIsOtherUserTyping(false);
        socket.on('show_typing', handleShowTyping);
        socket.on('hide_typing', handleHideTyping);
        return () => {
            socket.off('show_typing', handleShowTyping);
            socket.off('hide_typing', handleHideTyping);
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [guestMessages, adminMessages, selectedFiles]);

    const handleFileSelect = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newFiles = [];
            files.forEach(file => {
                if (file.size > 50 * 1024 * 1024) toast.error(`El archivo ${file.name} es demasiado grande (Max 50MB)`);
                else { file.preview = URL.createObjectURL(file); newFiles.push(file); }
            });
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };
    const handleRemoveFile = (index) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    const handleClearFiles = () => { setSelectedFiles([]); if (fileInputRef.current) fileInputRef.current.value = ""; };

    const startRecording = async () => {
        try {
            handleClearFiles();

            // Verificamos permisos antes de intentar 

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const recorder = new MediaRecorder(stream);
            const chunks = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                // Creamos un archivo con nombre único
                const file = new File([blob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
                file.preview = URL.createObjectURL(file);
                setSelectedFiles([file]);
                stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
                setRecordingTime(0);
            };
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingTime(0);
            recordingInterval.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);

        } catch (error) {
            console.error("Error al iniciar grabación:", error);

            // Si es web normal (no Capacitor) y no es seguro, mostramos el error de HTTPS.
            // Si es Capacitor, mostramos el error real 
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && Capacitor.getPlatform() === 'web') {
                toast.error("Requiere HTTPS para grabar audio.");
            } else {
                // Error real 
                toast.error(`No se pudo acceder al micrófono: ${error.message}`);
            }
        }
    };

    const stopRecording = () => { if (mediaRecorder && isRecording) { mediaRecorder.stop(); clearInterval(recordingInterval.current); } };
    const cancelRecording = () => { if (mediaRecorder && isRecording) { mediaRecorder.stop(); clearInterval(recordingInterval.current); setMediaRecorder(null); setIsRecording(false); setRecordingTime(0); } };
    const formatTime = (seconds) => { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins}:${secs < 10 ? '0' : ''}${secs}`; };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const targetRoomId = user.admin ? selectedRoom?.id : guestRoom?.id;
        if (!socket || !targetRoomId) return;
        if (!newMessage.trim() && selectedFiles.length === 0) return;

        setIsUploading(true);
        try {
            if (selectedFiles.length > 0) {
                const formData = new FormData();
                selectedFiles.forEach(file => formData.append('files', file));
                const response = await apiClient.post('/api/chat/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                response.data.files.forEach(fileData => {
                    socket.emit('send_message', { roomId: targetRoomId, content: null, type: fileData.fileType, file_url: fileData.fileUrl });
                });
            }
            if (newMessage.trim()) {
                socket.emit('send_message', { roomId: targetRoomId, content: newMessage.trim(), type: 'text', file_url: null });
            }

            if (user.admin && selectedRoom) {
                setActiveRooms(prev => {
                    const exists = prev.some(r => r.id === selectedRoom.id);
                    if (!exists) {
                        const newRoomEntry = {
                            ...selectedRoom,
                            last_message: newMessage.trim() || 'Archivo adjunto...',
                            updated_at: new Date().toISOString()
                        };
                        return [newRoomEntry, ...prev];
                    }
                    return prev;
                });
                setNewChatUsers(prev => prev.filter(u => u.id !== selectedRoom.user.id));
            }

            setNewMessage("");
            handleClearFiles();
        } catch (error) { toast.error("Error al enviar."); }
        finally { setIsUploading(false); }
    };

    const handleTypingChange = (e) => {
        setNewMessage(e.target.value);
        const targetRoomId = user.admin ? selectedRoom?.id : guestRoom?.id;
        if (!socket || !targetRoomId) return;
        if (!typingTimerRef.current) socket.emit('typing_start', { roomId: targetRoomId });
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => { socket.emit('typing_stop', { roomId: targetRoomId }); typingTimerRef.current = null; }, 2000);
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

            // Pedimos la sala
            const response = await apiClient.post('/api/chat/find-or-create-room', { userId: targetUser.id });

            // Verificamos si la respuesta trae los mensajes o solo la sala
            const room = response.data.room || response.data;
            const messages = response.data.messages || []; // Si el backend ya los manda, los usamos

            // Transición instantanea de ui
            setCurrentView('chat');
            setSelectedRoom(room);
            setShowContactList(false);

            // Manejo de mensajes: Si el backend no los mandó, los buscamos 
            if (response.data.messages) {
                setAdminMessages(messages);
            } else {
                const msgRes = await apiClient.get(`/api/chat/room/${room.id}/messages`);
                setAdminMessages(msgRes.data.messages);
            }

            // Conectar socket
            socket.emit('admin_join_room', room.id);

            // Actualizar listas laterales
            if (room.last_message) {
                setActiveRooms(prev => {
                    if (prev.some(r => r.id === room.id)) return prev;
                    return [room, ...prev];
                });
                // Quitamos al usuario de la lista de "Nuevos"
                setNewChatUsers(prev => prev.filter(u => u.id !== targetUser.id));
            }

        } catch (error) {
            console.error(error);
            toast.error("Error al iniciar chat.");
        } finally {
            setIsChatLoading(false);
        }
    };

    // Manejo de botón de atras
    const handleBack = () => {
        if (currentView === 'profile_pic') {
            setCurrentView('info'); // Si estamos en foto, volver a Info
        } else if (showContactList) {
            setShowContactList(false);
        } else if (currentView === 'info') {
            setCurrentView('chat');
        } else {
            setCurrentView('inbox');
            setSelectedRoom(null);
            setAdminMessages([]);
            setIsOtherUserTyping(false);
        }
    };
    const handleOpenUserInfo = () => { if (user.admin && selectedRoom) setCurrentView('info'); };

    const handleDelete = (messageId) => {
        setOpenMenuId(null);
        Swal.fire({ title: '¿Borrar mensaje?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí' }).then((result) => {
            if (result.isConfirmed) socket.emit('delete_message', { messageId });
        });
    };

    const handleDeleteChat = () => {
        setIsHeaderMenuOpen(false);

        // Aseguramos obtener el ID correcto dependiendo quién sea
        const targetRoomId = user.admin ? selectedRoom?.id : guestRoom?.id;

        if (!targetRoomId) {
            toast.error("Error: No se identificó el chat a eliminar.");
            return;
        }

        // Textos personalizados según el rol
        const title = user.admin ? '¿Eliminar chat permanentemente?' : '¿Vaciar mi historial?';
        const text = user.admin
            ? "Esta acción borrará la sala y los mensajes de la base de datos para AMBOS. Es irreversible."
            : "Se borrarán los mensajes de tu vista. El administrador aún conservará el registro.";
        const confirmButtonText = user.admin ? 'Eliminar Todo' : 'Vaciar Historial';

        Swal.fire({
            title,
            text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText
        }).then((result) => {
            if (result.isConfirmed) {
                if (user.admin) {
                    socket.emit('delete_room', { roomId: targetRoomId });
                } else {
                    socket.emit('clear_history', { roomId: targetRoomId });
                    setGuestMessages([]);
                    toast.success("Historial vaciado.");
                }
            }
        });
    };

    const renderMessageContent = (msg) => (
        <div className="message-content-wrapper">
            {msg.file_url && (
                <div className="media-container">
                    {msg.type === 'image' ? <a href={msg.file_url} target="_blank" rel="noopener noreferrer"><img src={msg.file_url} alt="Adjunto" className="message-image" /></a>
                        : msg.type === 'video' ? <video src={msg.file_url} controls className="message-video" />
                            : msg.type === 'audio' ? <audio src={msg.file_url} controls className="message-audio" />
                                : <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="message-file-link">📎 Descargar Archivo</a>}
                </div>
            )}
            {msg.content && <p className="message-text">{msg.content}</p>}
        </div>
    );

    const renderMessageList = (messages) => (
        <div className="message-list">
            {messages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.sender_id === user.id ? 'sent' : 'received'}`}>
                    <div className="message-bubble">
                        <div className="message-header">
                            <span className="message-sender">{msg.sender_id === user.id ? (user.admin ? 'Tú (Admin)' : 'Tú') : (msg.sender?.admin ? 'Admin' : msg.sender?.username)}</span>
                            <span className="message-timestamp">{formatTimestamp(msg.created_at)}</span>
                        </div>
                        {renderMessageContent(msg)}
                    </div>
                    <div className="message-options-wrapper">
                        <button className="message-options-btn" onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}><ThreeDotIcon /></button>
                        {openMenuId === msg.id && (
                            <div className="message-menu">
                                {msg.content && <button onClick={() => { navigator.clipboard.writeText(msg.content); setOpenMenuId(null); }}>Copiar</button>}
                                <button className="message-menu-delete" onClick={() => handleDelete(msg.id)}>Eliminar</button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {isOtherUserTyping && <div className="message-row received"><div className="message-bubble typing-indicator"><span className="dot"></span><span className="dot"></span><span className="dot"></span></div></div>}
            <div ref={messagesEndRef} />
        </div>
    );

    const renderUserInfo = () => {
        const targetUser = selectedRoom?.user;
        if (!targetUser) return <p>Cargando...</p>;

        // Calculamos el estado online
        const currentRoomInList = activeRooms.find(r => r.id === selectedRoom.id);
        const isOnline = currentRoomInList ? currentRoomInList.isOnline : !!selectedRoom.isOnline;

        const chatImages = adminMessages.filter(msg => msg.type === 'image' && msg.file_url);

        // Función de redirección
        const goToProfile = () => {
            navigate(`/profile/${targetUser.id}`); // Navega a la URL del perfil
            if (onClose) onClose(); // Cierra el chat para ver la página limpia
        };

        return (
            <div className="user-info-view">
                <div className="user-info-header-section">
                    <div
                        className="user-info-avatar-large"
                        onClick={() => {
                            if (targetUser.profile_picture) {
                                setCurrentView('profile_pic'); // Cambia a la vista de pantalla completa
                            } else {
                                toast.info("Sin imagen de perfil", { autoClose: 2000 }); // Muestra mensaje si no hay foto
                            }
                        }}
                        style={{
                            color: '#aeb9c4',
                            marginBottom: '15px',
                            background: '#1a222c',
                            borderRadius: '50%',
                            width: '100px',
                            height: '100px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid #4a5568',
                            cursor: 'pointer' 
                        }}
                    >
                        {targetUser.profile_picture ? (
                            <img
                                src={targetUser.profile_picture}
                                alt="Perfil"
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        ) : <UserIcon />}
                    </div>

                    <h2
                        className="user-info-name"
                        onClick={goToProfile}
                        style={{
                            cursor: 'pointer',
                        }}
                        title="Ir al perfil completo"
                    >
                        {targetUser.username}
                    </h2>

                    <span
                        className={`chat-contact-status ${isOnline ? 'status-online' : ''}`}
                        style={{ fontSize: '0.9rem', marginTop: '5px', fontWeight: '500' }}
                    >
                        {isOnline ? 'En línea' : 'Desconectado'}
                    </span>

                </div>
                <div className="user-info-body">
                    <div className="info-item"><label>Unidad</label><p>{targetUser.unidad}</p></div>
                    <div className="info-item"><label>Email</label><p>{targetUser.email}</p></div>
                    <div className="info-item"><label>ID Usuario</label><p>{targetUser.id}</p></div>
                    <div className="user-info-media-section">
                        <h4>Archivos Multimedia</h4>
                        {chatImages.length > 0 ? (
                            <div className="media-gallery-carousel">
                                {chatImages.map((img) => (
                                    <div key={img.id} className="media-gallery-item" onClick={() => window.open(img.file_url, '_blank')}>
                                        <img src={img.file_url} alt="media" />
                                    </div>
                                ))}
                            </div>
                        ) : <p className="no-media-text">No hay imágenes compartidas.</p>}
                    </div>
                </div>
            </div>
        );
    };

    // Vista de foto de perfil completa
    const renderProfilePic = () => {
        const targetUser = selectedRoom?.user;
        if (!targetUser || !targetUser.profile_picture) return null;
        return (
            <div className="full-image-view">
                <img src={targetUser.profile_picture} alt={targetUser.username} className="full-profile-img" />
            </div>
        );
    };

    const renderChatBody = () => {
        if (isLoading) return <p>Cargando...</p>;

        if (user.admin && currentView === 'inbox') {

            // Vista b: Lista de contactos (nuevo chat)
            if (showContactList) {
                return (
                    <div className="admin-inbox slide-in-right">
                        <div className="chat-list-header">Seleccionar contacto</div>
                        {newChatUsers.length === 0 && <p style={{ padding: '15px', color: '#777' }}>No hay usuarios nuevos.</p>}

                        {newChatUsers.map(chatUser => (
                            <div key={chatUser.id} className="admin-room-item" onClick={() => handleStartNewChat(chatUser)}>
                                <div className="wa-avatar-container">
                                    {chatUser.profile_picture ? (
                                        <img src={chatUser.profile_picture} alt="avatar" className="wa-avatar-img" />
                                    ) : (
                                        <div className="wa-avatar-placeholder">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                                        </div>
                                    )}
                                </div>
                                <div className="wa-info-container">
                                    <div className="wa-row-top">
                                        <div className="wa-name-wrapper">
                                            <span className="wa-name">{chatUser.username}</span>
                                            {chatUser.isOnline && <div className="wa-status-dot"></div>}
                                        </div>
                                    </div>
                                    <div className="wa-row-bottom">
                                        <span className="wa-last-message" style={{ color: '#009688' }}>
                                            ¡Toca para iniciar chat!
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }

            // Vista a: Bandeja principal con chats activos
            return (
                <div className="admin-inbox">
                    <div className="chat-list-header">Chats Activos</div>
                    {activeRooms.length === 0 && <p style={{ padding: '10px', color: '#777' }}>Sin chats activos.</p>}

                    {activeRooms.map(room => (
                        <div key={room.id} className="admin-room-item" onClick={() => selectRoom(room)}>
                            <div className="wa-avatar-container">
                                {room.user.profile_picture ? (
                                    <img src={room.user.profile_picture} alt="avatar" className="wa-avatar-img" />
                                ) : (
                                    <div className="wa-avatar-placeholder">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                                    </div>
                                )}
                            </div>

                            <div className="wa-info-container">
                                <div className="wa-row-top">
                                    <div className="wa-name-wrapper">
                                        <span className="wa-name">{room.user.username}</span>
                                        {room.isOnline && <div className="wa-status-dot"></div>}
                                    </div>
                                    <span className="wa-timestamp">{formatTimestamp(room.updated_at)}</span>
                                </div>
                                <div className="wa-row-bottom">
                                    <span className="wa-last-message">
                                        {room.last_message || "Imagen o archivo adjunto..."}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button className="wa-fab-btn" onClick={() => setShowContactList(true)} title="Nuevo Chat">
                        <NewChatIcon />
                    </button>
                </div>
            );
        }

        // Manejo de vistas con switch
        if (user.admin && currentView === 'info') return renderUserInfo();
        if (user.admin && currentView === 'profile_pic') return renderProfilePic();
        if (user.admin && currentView === 'chat') return isChatLoading ? <p>Cargando...</p> : renderMessageList(adminMessages);
        return guestMessages.length === 0 ? <p style={{ padding: '15px', color: '#bbb' }}>Inicia la conversación...</p> : renderMessageList(guestMessages);
    };

    const renderChatFooter = () => {
        // Ocultar footer en bandeja, info Y en la foto de perfil
        if (user.admin && (currentView === 'inbox' || currentView === 'info' || currentView === 'profile_pic')) return null;
        const showSendButton = newMessage.trim().length > 0 || selectedFiles.length > 0;
        return (
            <div className="chat-footer-wrapper">
                {selectedFiles.length > 0 && (
                    <div className="preview-list-container">
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="preview-item">
                                {file.type.startsWith('image') ? <img src={file.preview} alt="Preview" className="preview-img" />
                                    : file.type.startsWith('audio') ? <div className="preview-icon audio">🎤</div>
                                        : <div className="preview-icon file">📄</div>}
                                <button className="remove-preview-btn" onClick={() => handleRemoveFile(index)}><CloseIcon /></button>
                            </div>
                        ))}
                    </div>
                )}
                {isRecording ? (
                    <div className="chat-footer recording-mode">
                        <button type="button" className="chat-btn-cancel-record" onClick={cancelRecording}><CancelIcon /></button>
                        <div className="recording-indicator"><span className="record-dot"></span><span>Grabando... {formatTime(recordingTime)}</span></div>
                        <button type="button" className="chat-btn-send" onClick={stopRecording}><StopIcon /></button>
                    </div>
                ) : (
                    <form className="chat-footer" onSubmit={handleSendMessage}>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx" />
                        <button type="button" className="chat-btn-round chat-btn-attach" onClick={() => fileInputRef.current.click()} disabled={isUploading || isLoading} title="Adjuntar archivos"><AttachIcon /></button>
                        <input type="text" className="chat-text-input" placeholder={isUploading ? "Enviando..." : "Escribe un mensaje..."} value={newMessage} onChange={handleTypingChange} disabled={isLoading || isUploading} />
                        {showSendButton ?
                            <button type="submit" className="chat-btn-round chat-btn-send" disabled={isLoading || isUploading}>{isUploading ? '...' : <SendIcon />}</button> :
                            <button type="button" className="chat-btn-round chat-btn-mic" onClick={startRecording} disabled={isUploading || isLoading} title="Grabar audio"><MicIcon /></button>
                        }
                    </form>
                )}
            </div>
        );
    };

    // Lógica del header del chat
    let headerTitle = 'Soporte';
    let chatPartnerUser = null;
    let isOnline = false;

    if (user.admin) {
        if (currentView === 'inbox') {
            headerTitle = showContactList ? 'Seleccionar contacto' : 'Bandeja';
        }
        else if (currentView === 'info') headerTitle = 'Info. del Usuario';
        else if (currentView === 'profile_pic') headerTitle = selectedRoom?.user?.username || 'Foto de perfil'; // Nombre al ver la foto
        else {
            headerTitle = selectedRoom?.user?.username;
            chatPartnerUser = selectedRoom?.user;
            const currentRoomInList = activeRooms.find(r => r.id === selectedRoom.id);
            if (currentRoomInList) isOnline = currentRoomInList.isOnline;
            else if (selectedRoom) isOnline = selectedRoom.isOnline;
        }
    }

    const showOptions = (!user.admin) || (user.admin && currentView === 'chat');

    return (
        <div className="chat-window">
            <div className="chat-header">
                {user.admin && (currentView !== 'inbox' || showContactList) &&
                    <button onClick={handleBack} className="chat-back-btn"><BackIcon /></button>
                }

                <div
                    className={`chat-header-info ${user.admin && currentView === 'chat' ? 'clickable' : ''}`}
                    onClick={user.admin && currentView === 'chat' ? handleOpenUserInfo : undefined}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', flexGrow: 1, overflow: 'hidden' }}
                >
                    {/* Mostramos la foto de perfil chica en el header solo si no estamos dentro de su perfil */}
                    {chatPartnerUser && currentView !== 'profile_pic' && (
                        <div className="header-avatar-container" style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.2)' }}>
                            {chatPartnerUser.profile_picture ? (
                                <img src={chatPartnerUser.profile_picture} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="chat-header-text-column">
                        <h3 className="chat-contact-name">
                            {headerTitle}
                        </h3>
                        {chatPartnerUser && currentView === 'chat' && (
                            <span className={`chat-contact-status ${isOnline ? 'status-online' : ''}`}>
                                {isOnline ? 'En línea' : 'Desconectado'}
                            </span>
                        )}
                    </div>
                </div>

                {currentView === 'info' && <div style={{ width: '34px' }}></div>}

                {showOptions && (
                    <div className="chat-header-options">
                        <button className="chat-header-menu-btn" onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}><ThreeDotIcon /></button>
                        {isHeaderMenuOpen && (
                            <div className="chat-header-menu">
                                <button onClick={onClose}>Cerrar Ventana</button>
                                <button onClick={handleDeleteChat} className="chat-delete-chat-btn">{user.admin ? 'Eliminar Chat' : 'Eliminar Chat'}</button>
                            </div>
                        )}
                    </div>
                )}

                {user.admin && currentView === 'inbox' && <button onClick={onClose} className="chat-close-btn-simple"><CloseIcon /></button>}
            </div>
            <div className="chat-body">{renderChatBody()}</div>
            {renderChatFooter()}
        </div>
    );
};

const ChatWrapper = ({ hideButton }) => {
    const { user, isChatOpen, unreadChatCount, toggleChat, selectRoom, activeRooms } = useChat(); // Removed setIsChatOpen from here as it might not be available
    const [popping, setPopping] = useState(false);
    useEffect(() => { if (unreadChatCount > 0) { setPopping(true); setTimeout(() => setPopping(false), 200); } }, [unreadChatCount]);

    useEffect(() => {
        const handleOpenSpecificChat = (event) => {
            const roomId = event.detail;

            // Buscamos la sala en la lista de activos
            const targetRoom = activeRooms.find(r => String(r.id) === String(roomId));

            if (targetRoom) {
                // Si el chat está cerrado, lo abrimos manualmente
                if (!isChatOpen) {
                    toggleChat();
                }

                // Seleccionamos la sala inmediatamente
                selectRoom(targetRoom);
            } else {
                console.warn("Sala no encontrada en la lista activa. ID:", roomId);
            }
        };

        window.addEventListener('OPEN_CHAT_ROOM', handleOpenSpecificChat);

        // Limpieza al desmontar
        return () => {
            window.removeEventListener('OPEN_CHAT_ROOM', handleOpenSpecificChat);
        };
    }, [activeRooms, isChatOpen, selectRoom, toggleChat]);

    if (!user) return null;
    return (
        <div className="chat-wrapper-container">
            {isChatOpen && <ChatWindow onClose={toggleChat} user={user} />}
            <button className={`chat-bubble-button ${hideButton ? 'hide' : ''}`} onClick={toggleChat}>
                {isChatOpen ? <CloseIcon /> : <ChatIcon />}
                {unreadChatCount > 0 && <span className={`chat-unread-badge ${popping ? 'pop' : ''}`}>{unreadChatCount > 9 ? '9+' : unreadChatCount}</span>}
            </button>
        </div>
    );
};

export default ChatWrapper;