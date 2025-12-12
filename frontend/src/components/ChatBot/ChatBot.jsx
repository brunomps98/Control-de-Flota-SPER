import React, { useState, useEffect, useRef } from 'react';
import './ChatBot.css';
import chatFlow from './chatFlow.json';
import { useChat } from '../../context/ChatContext'; 

// Icono
const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" width="28" height="28">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12h15m-15 3.75h15m-1.5 3.75h1.5m-1.5 0v1.5m-9-1.5v1.5m-3-1.5v1.5M9.75 20.25v1.5m3-1.5v1.5M4.5 5.25h15a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V7.5a2.25 2.25 0 012.25-2.25z" />
    </svg>
);

// Montamos el componente ChatBot
const ChatBot = ({ onToggle }) => { 
    // Consumimos el estado del chat principal directamente
    const { isChatOpen, toggleChat } = useChat();
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState('inicio');
    const [history, setHistory] = useState([]);
    const chatBodyRef = useRef(null);

    // Cargar mensaje inicial al abrir
    useEffect(() => {
        if (isOpen && history.length === 0) {
            const stepData = chatFlow['inicio'];
            setHistory([{ sender: 'bot', text: stepData.mensaje, options: stepData.opciones }]);
        }
    }, [isOpen]);

    // Auto-scroll al fondo
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [history, isOpen]);

    // Manejo de selección de opción
    const handleOptionClick = (option) => {
        const newHistory = [...history, { sender: 'user', text: option.texto }];

        // Verificar si es transferencia a humano
        if (option.accion === 'transferir_admin') {
            setHistory([...newHistory, { sender: 'bot', text: 'Te estoy transfiriendo con un administrador... aguarda un momento.' }]);

            // Cierre del bot y apertura del chat principal
            setTimeout(() => {
                setIsOpen(false); // Cierra el bot visualmente
                if (onToggle) onToggle(false); // Avisa al layout que el bot se cerró
                
                // Abre el chat principal si no está abierto
                if (!isChatOpen) {
                    toggleChat();
                }
                setCurrentStep('inicio');
                setHistory([]);
            }, 1500);
            return;
        }

        // Navegación normal del bot
        const nextStepId = option.siguienteId;
        const nextStepData = chatFlow[nextStepId];

        // Agregar respuesta del bot
        if (nextStepData) {
            setTimeout(() => {
                setHistory(prev => [
                    ...prev,
                    { sender: 'bot', text: nextStepData.mensaje, options: nextStepData.opciones }
                ]);
                setCurrentStep(nextStepId);
            }, 500);
        }

        setHistory(newHistory);
    };

    // Toogle del chat bot
    const toggleBotChat = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (onToggle) onToggle(newState); 
    };

    // Lógica de ocultamiento: Se oculta si el chat principal está abierto
    const shouldHideButton = isChatOpen;

    // Modo solo (pantalla completa) si el chat principal está abierto
    const isSoloMode = isOpen;

    return (
        <div className={`chatbot-wrapper ${isSoloMode ? 'solo' : ''}`}>
            {/* Botón Flotante Circular */}
            <button
                className={`chatbot-toggle ${shouldHideButton ? 'hide' : ''}`}
                onClick={toggleBotChat}
                title="Asistente Virtual" 
            >
                <BotIcon />
            </button>

            {/* Ventana del Chat */}
            <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
                <div className="chatbot-header">
                    <div className="header-title">
                        <BotIcon />
                        <span>Asistente Virtual</span>
                    </div>
                    <button className="close-btn" onClick={toggleBotChat}>×</button>
                </div>

                <div className="chatbot-body" ref={chatBodyRef}>
                    {history.map((msg, index) => (
                        <div key={index} className={`chat-message ${msg.sender}`}>
                            <div className="message-bubble">
                                {msg.text}
                            </div>
                            {msg.sender === 'bot' && msg.options && index === history.length - 1 && (
                                <div className="options-container">
                                    {msg.options.map((opt, idx) => (
                                        <button
                                            key={idx}
                                            className="option-btn"
                                            onClick={() => handleOptionClick(opt)}
                                        >
                                            {opt.texto}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChatBot;