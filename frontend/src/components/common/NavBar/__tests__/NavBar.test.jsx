import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NavBar from '../NavBar';

// Mocks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

jest.mock('../../../../assets/images/logo.png', () => 'test-logo-stub');

// Mock simple de NotificationBell para que no interfiera
jest.mock('../NavBar', () => {
    const originalModule = jest.requireActual('../NavBar');
    return {
        __esModule: true,
        ...originalModule,
    };
});

describe('Componente NavBar', () => {
    
    const baseProps = {
        user: { id: 1, username: 'TestUser', admin: false, unidad: 'Direccion General' },
        unreadCount: 0,
        notifications: [],
        onBellClick: jest.fn(),
        isNotificationOpen: false,
        onNotificationClick: jest.fn(),
        onDeleteOne: jest.fn(),
        onClearAll: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.setItem('token', 'fake-token');
    });

    test('Debe renderizar el logo y el nombre del usuario', () => {
        render(
            <BrowserRouter>
                <NavBar {...baseProps} />
            </BrowserRouter>
        );

        expect(screen.getByText('SPER')).toBeInTheDocument();
        
        // Usamos getAllByText porque el nombre aparece en móvil y desktop
        const userNames = screen.getAllByText('TestUser');
        expect(userNames.length).toBeGreaterThan(0);
        expect(userNames[0]).toBeInTheDocument();
        const flotas = screen.getAllByText('Flota');
        expect(flotas[0]).toBeInTheDocument();
    });

    test('NO debe mostrar opciones de Admin a un usuario normal', () => {
        render(
            <BrowserRouter>
                <NavBar {...baseProps} />
            </BrowserRouter>
        );

        expect(screen.queryByText('Registrar Usuario')).not.toBeInTheDocument();
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
        expect(screen.queryByText('Tickets de Soporte')).not.toBeInTheDocument();
    });

    test('Debe mostrar opciones de Admin cuando el usuario es Admin', () => {
        const adminProps = {
            ...baseProps,
            user: { ...baseProps.user, admin: true, username: 'AdminBoss' }
        };

        render(
            <BrowserRouter>
                <NavBar {...adminProps} />
            </BrowserRouter>
        );

        // GetAllByText para AdminBoss
        const adminNames = screen.getAllByText('AdminBoss');
        expect(adminNames[0]).toBeInTheDocument();
        
        // Verificamos menús exclusivos
        expect(screen.getByText('Registrar Usuario')).toBeInTheDocument();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Flota General')).toBeInTheDocument();
    });

    test('Debe ejecutar Logout correctamente', () => {
        render(
            <BrowserRouter>
                <NavBar {...baseProps} />
            </BrowserRouter>
        );

        // Buscamos todos los botones de LogOut (móvil y desktop)
        const logoutButtons = screen.getAllByText('LogOut');
        
        // Hacemos click en el primero que encontremos 
        fireEvent.click(logoutButtons[0]);

        // Verificar borrado de token
        expect(localStorage.getItem('token')).toBeNull();
        
        // Verificar navegación
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
});