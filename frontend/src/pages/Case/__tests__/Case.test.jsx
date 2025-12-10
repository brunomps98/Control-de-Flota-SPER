import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Case from '../Case'; 
import apiClient from '../../../api/axiosConfig';
import MySwal from '../../../utils/swal';

// Mocks

// Mock de Axios
jest.mock('../../../api/axiosConfig', () => ({
    get: jest.fn(),
    delete: jest.fn(),
}));

// Mock de SweetAlert 
jest.mock('../../../utils/swal', () => ({
    fire: jest.fn(),
}));

// Mock de capacitor app
jest.mock('@capacitor/app', () => {
    const mockRemove = jest.fn();
    return {
        __esModule: true,
        App: {
            addListener: jest.fn().mockResolvedValue({
                remove: mockRemove,
            }),
        },
    };
});

// Mock de capacitor core
jest.mock('@capacitor/core', () => ({
    Capacitor: {
        getPlatform: jest.fn(() => 'web'),
    },
}));

// React Router (Mockeamos useParams y useNavigate)
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useParams: () => ({ ticketId: '123' }), // Simulamos que estamos en el ticket 123
}));

describe('Componente Case (Detalle)', () => {

    const mockTicketData = {
        id: 123,
        name: 'Bruno',
        surname: 'Test',
        email: 'bruno@test.com',
        phone: '11223344',
        problem_description: 'Descripción del problema de prueba',
        archivos: [
            { id: 1, url_archivo: 'http://img1.jpg' },
            { id: 2, url_archivo: 'http://img2.jpg' }
        ]
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup por defecto: Carga exitosa del ticket
        apiClient.get.mockResolvedValue({ data: { ticket: mockTicketData } });
    });

    const renderComponent = () => {
        render(
            <MemoryRouter>
                <Case />
            </MemoryRouter>
        );
    };

    test('Debe mostrar "Cargando..." y luego la información del ticket', async () => {
        renderComponent();

        // Verificar estado de carga
        expect(screen.getByText(/Cargando detalles del caso/i)).toBeInTheDocument();

        // Esperar a que se cargue la info
        await waitFor(() => {
            expect(screen.getByText('Reportado por: Bruno Test')).toBeInTheDocument();
        });

        // Verificar datos renderizados
        expect(screen.getByText('bruno@test.com')).toBeInTheDocument();
        expect(screen.getByText('Descripción del problema de prueba')).toBeInTheDocument();
        
        // Verificar imágenes
        const images = screen.getAllByRole('img');
        expect(images).toHaveLength(2);
    });

    test('Debe mostrar mensaje de error si falla la carga', async () => {
        // Simulamos error en el GET
        apiClient.get.mockRejectedValue({
            response: { data: { message: 'Ticket no encontrado' } }
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText(/Error: Ticket no encontrado/i)).toBeInTheDocument();
        });
    });

    test('Debe eliminar el ticket correctamente', async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText('Reportado por: Bruno Test')).toBeInTheDocument());

        // Configurar mocks para la eliminación
        MySwal.fire.mockResolvedValueOnce({ isConfirmed: true }); 
        // El delete de axios
        apiClient.delete.mockResolvedValue({});
        // El segundo Swal.fire es el de éxito
        MySwal.fire.mockResolvedValueOnce({}); 

        // Click en botón eliminar
        const deleteBtn = screen.getByText('Eliminar Caso');
        fireEvent.click(deleteBtn);

        // Verificar que se llamó a la confirmación
        expect(MySwal.fire).toHaveBeenCalledWith(expect.objectContaining({
            title: '¿Estás seguro?',
            icon: 'warning'
        }));

        // Esperar a que se llame a la API y luego navegación
        await waitFor(() => {
            expect(apiClient.delete).toHaveBeenCalledWith('/api/support/123');
        });
        
        // Verificamos el mensaje de éxito
        await waitFor(() => {
             expect(MySwal.fire).toHaveBeenCalledWith(
                '¡Eliminado!',
                expect.any(String),
                'success'
            );
        });
        expect(mockNavigate).toHaveBeenCalledWith('/support-tickets');
    });

    test('No debe eliminar si el usuario cancela', async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText('Reportado por: Bruno Test')).toBeInTheDocument());

        // Simulamos que el usuario dice no (false)
        MySwal.fire.mockResolvedValueOnce({ isConfirmed: false });

        const deleteBtn = screen.getByText('Eliminar Caso');
        fireEvent.click(deleteBtn);

        await waitFor(() => {
            // Aseguramos que no se llamó a delete
            expect(apiClient.delete).not.toHaveBeenCalled();
        });
    });
});