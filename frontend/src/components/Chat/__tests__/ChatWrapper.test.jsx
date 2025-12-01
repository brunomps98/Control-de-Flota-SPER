import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ChatWrapper from '../ChatWrapper';
import { useChat } from '../../../context/ChatContext';

// Mocks

// Mock del Contexto 
jest.mock('../../../context/ChatContext');

// Mock de Axios
jest.mock('../../../api/axiosConfig');

// Mock de librerías externas
jest.mock('sweetalert2', () => ({ fire: jest.fn() }));
jest.mock('sweetalert2-react-content', () => () => ({ fire: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { error: jest.fn(), info: jest.fn() } }));

// Capacitor
jest.mock('@capacitor/app', () => ({
    App: { addListener: jest.fn().mockReturnValue(Promise.resolve({ remove: jest.fn() })) },
}));
jest.mock('@capacitor/core', () => ({
    Capacitor: { getPlatform: () => 'web' },
}));

describe('Componente ChatWrapper', () => {

    beforeAll(() => {
        // Mockeamos scrollIntoView porque JSDOM no lo tiene
        window.HTMLElement.prototype.scrollIntoView = jest.fn();
    });
    
    // Configuración base del contexto para un Usuario Normal
    const mockUserContext = {
        user: { id: 10, username: 'Agente', admin: false },
        socket: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
        guestRoom: { id: 100 },
        guestMessages: [
            { id: 1, content: 'Hola soporte', sender_id: 10, created_at: new Date().toISOString() },
            { id: 2, content: 'Hola, en qué te ayudo?', sender_id: 99, sender: { admin: true }, created_at: new Date().toISOString() }
        ],
        isChatOpen: false,
        unreadChatCount: 1,
        toggleChat: jest.fn(),
        activeRooms: [], // Solo para admin
        selectRoom: jest.fn(),
        startNewChat: jest.fn(),
        
        // Funciones de estado que el componente usa
        currentView: 'chat',
        setCurrentView: jest.fn(),
        selectedRoom: null,
        adminMessages: [],
        isLoading: false,
        isChatLoading: false
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useChat.mockReturnValue(mockUserContext);
    });

    test('Debe mostrar el botón flotante con badge de no leídos', () => {
        render(<BrowserRouter><ChatWrapper /></BrowserRouter>);

        // Verificar botón
        const chatButton = screen.getByRole('button');
        expect(chatButton).toBeInTheDocument();

        // Verificar badge 
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    test('Debe abrir la ventana de chat al hacer click', () => {
        // Simulamos que al hacer click, el estado isChatOpen cambia a true

        // Render inicial cuando está cerrado
        const { rerender } = render(<BrowserRouter><ChatWrapper /></BrowserRouter>);
        
        const chatButton = screen.getByRole('button');
        fireEvent.click(chatButton);
        
        // Verificar que se llamó a la función del contexto
        expect(mockUserContext.toggleChat).toHaveBeenCalled();

        // Re-render simulando que se abrió (isChatOpen: true)
        useChat.mockReturnValue({ ...mockUserContext, isChatOpen: true });
        rerender(<BrowserRouter><ChatWrapper /></BrowserRouter>);

        expect(screen.getByText('Hola soporte')).toBeInTheDocument();
        expect(screen.getByText('Hola, en qué te ayudo?')).toBeInTheDocument();
        
        // Verificar header (Usuario normal ve "Soporte")
        expect(screen.getByText('Soporte')).toBeInTheDocument();
    });

    test('Debe mostrar la Bandeja de Entrada si es ADMIN', () => {
        // Configuramos el contexto para un ADMIN
        const mockAdminContext = {
            ...mockUserContext,
            user: { id: 99, username: 'Admin', admin: true },
            isChatOpen: true, // Ya abierto para ver el contenido
            currentView: 'inbox', // Vista inicial de admin
            activeRooms: [
                { id: 100, user: { id: 10, username: 'Agente1' }, last_message: 'Ayuda', updated_at: new Date().toISOString() },
                { id: 101, user: { id: 11, username: 'Agente2' }, last_message: 'Gracias', updated_at: new Date().toISOString() }
            ]
        };
        useChat.mockReturnValue(mockAdminContext);

        render(<BrowserRouter><ChatWrapper /></BrowserRouter>);

        // Verificar que se ven los chats activos
        expect(screen.getByText('Chats Activos')).toBeInTheDocument();
        expect(screen.getByText('Agente1')).toBeInTheDocument();
        expect(screen.getByText('Agente2')).toBeInTheDocument();
        expect(screen.getByText('Ayuda')).toBeInTheDocument();
    });

    test('Admin debe poder entrar a un chat específico', () => {
        const mockAdminContext = {
            ...mockUserContext,
            user: { id: 99, username: 'Admin', admin: true },
            isChatOpen: true,
            currentView: 'inbox',
            activeRooms: [
                { id: 100, user: { id: 10, username: 'Agente1' }, last_message: 'Ayuda', updated_at: new Date().toISOString() }
            ]
        };
        useChat.mockReturnValue(mockAdminContext);

        render(<BrowserRouter><ChatWrapper /></BrowserRouter>);

        // Click en el chat de Agente1
        const roomItem = screen.getByText('Agente1');
        fireEvent.click(roomItem);

        // Verificar que se llamó a selectRoom
        expect(mockAdminContext.selectRoom).toHaveBeenCalledWith(expect.objectContaining({ id: 100 }));
    });
});