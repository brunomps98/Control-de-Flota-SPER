import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminUserPage from '../AdminUserPage';
import apiClient from '../../../api/axiosConfig';
import { App } from '@capacitor/app';

// Mocks


// Mock de capacitor/app
jest.mock('@capacitor/app', () => ({
  App: {
    addListener: jest.fn(), 
  },
}));

// Mock de axios
jest.mock('../../../api/axiosConfig.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(), 
  },
}));

const mockNavigate = jest.fn();
const mockSearchParams = new URLSearchParams();
const mockSetSearchParams = jest.fn();

// Mock de react-dom
jest.mock('react-router-dom', () => {
    const original = jest.requireActual('react-router-dom');
    return {
        ...original,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [mockSearchParams, mockSetSearchParams],
    };
});

// Mock de capacitor core
jest.mock('@capacitor/core', () => ({
    Capacitor: {
        isPluginAvailable: () => true,
        getPlatform: () => 'web',
    },
}));

// Mock de sweet alert
jest.mock('sweetalert2', () => {
    const fire = jest.fn().mockResolvedValue({ isConfirmed: true });
    return {
        __esModule: true,
        default: { fire },
        fire,
    };
});

const mockUsers = [
    { id: 1, username: 'Admin', email: 'admin@test.com', unidad: 'Direccion General', admin: true, profile_picture: null },
    { id: 2, username: 'Usuario1', email: 'user1@test.com', unidad: 'Unidad Penal 1', admin: false, profile_picture: 'http://img.fake/1.jpg' }
];

describe('Componente AdminUserPage (Gestión de Usuarios)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Aseguramos que addListener devuelva una promesa que resuelve a un objeto con 'remove'
        App.addListener.mockResolvedValue({
            remove: jest.fn()
        });

        apiClient.get.mockResolvedValue({ data: mockUsers });
    });

    test('Debe renderizar la lista de usuarios correctamente', async () => {
        render(<BrowserRouter><AdminUserPage /></BrowserRouter>);

        await waitFor(() => {
            expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
            expect(screen.getByText('Usuario1')).toBeInTheDocument();
            const table = screen.getByRole('table');
            expect(within(table).getByText('Unidad Penal 1')).toBeInTheDocument();
        });
    });

    test('Debe activar modo edición al hacer click en Editar', async () => {
        render(<BrowserRouter><AdminUserPage /></BrowserRouter>);

        await waitFor(() => expect(screen.getByText('Usuario1')).toBeInTheDocument());

        const editButtons = screen.getAllByText('Editar');
        const editUserBtn = editButtons[1]; // El segundo usuario 

        fireEvent.click(editUserBtn);

        await waitFor(() => {
            expect(screen.getByText('Guardar')).toBeInTheDocument();
            // Verificamos que aparezca el input con el valor del usuario
            expect(screen.getAllByDisplayValue('Usuario1').length).toBeGreaterThan(0);
        });
    });
});