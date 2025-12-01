import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SupportTickets from '../SupportTickets';
import apiClient from '../../../api/axiosConfig';
import { App } from '@capacitor/app';

// Mocks

// Axios
jest.mock('../../../api/axiosConfig', () => ({
    get: jest.fn(),
    delete: jest.fn(),
}));


// SweetAlert2
const mockSwalFire = jest.fn();
jest.mock('sweetalert2', () => ({
    fire: (...args) => mockSwalFire(...args),
}));
jest.mock('sweetalert2-react-content', () => {
    return () => ({
        fire: (...args) => mockSwalFire(...args),
    });
});

// Capacitor
jest.mock('@capacitor/app', () => {
    const mockRemove = jest.fn();

    return {
        __esModule: true,
        App: {
            // Usamos mockResolvedValue para simular que devuelve una Promesa
            addListener: jest.fn().mockResolvedValue({
                remove: mockRemove,
            }),
        },
        default: {
            addListener: jest.fn().mockResolvedValue({
                remove: mockRemove,
            }),
        },
    };
});

jest.mock('@capacitor/core', () => ({
    Capacitor: {
        getPlatform: jest.fn(() => 'web'),
    },
}));

const mockNavigate = jest.fn();

let mockSearchParamsInstance = new URLSearchParams();

const mockSetSearchParams = jest.fn((params) => {
    mockSearchParamsInstance = new URLSearchParams(params);
});

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParamsInstance, mockSetSearchParams],
}));


describe('Componente SupportTickets', () => {

    const mockTickets = [
        {
            id: 1,
            name: 'Juan',
            surname: 'Perez',
            email: 'juan@test.com',
            phone: '123456',
            problem_description: 'Problema 1'
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        apiClient.get.mockResolvedValue({ data: { tickets: mockTickets } });
    });

    const renderComponent = () => {
        render(
            <MemoryRouter>
                <SupportTickets debounceDelay={0} />
            </MemoryRouter>
        );
    };

    test('Debe cargar y renderizar los tickets correctamente', async () => {
        renderComponent();

        expect(screen.getByText('Listado de Casos de Soporte')).toBeInTheDocument();
        expect(screen.getByText('Cargando tickets...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Juan Perez')).toBeInTheDocument();
        });
    });

    test('Debe permitir cambiar filtros', async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText('Juan Perez')).toBeInTheDocument());

        // Abrir filtros
        fireEvent.click(screen.getByText(/Mostrar Filtros/i));

        // Escribir en el input
        const nameInput = screen.getByLabelText('Nombre:');
        fireEvent.change(nameInput, { target: { value: 'Pedro' } });

        expect(nameInput.value).toBe('Pedro');
    });

    test('Debe eliminar un ticket tras confirmar en SweetAlert', async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText('Juan Perez')).toBeInTheDocument());

        // Configuración para simular click en "Sí, eliminar"
        mockSwalFire.mockResolvedValue({ isConfirmed: true });
        apiClient.delete.mockResolvedValue({});

        // Click en botón eliminar
        const deleteBtn = screen.getByText('Eliminar Caso');
        fireEvent.click(deleteBtn);

        // Verificación
        expect(mockSwalFire).toHaveBeenCalledWith(expect.objectContaining({
            title: '¿Estás seguro?',
        }));

        await waitFor(() => {
            expect(apiClient.delete).toHaveBeenCalledWith('/api/support/1');
        });
    });
});