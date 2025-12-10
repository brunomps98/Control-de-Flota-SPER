import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EdditVehicle from '../EdditVehicle';
import apiClient from '../../../api/axiosConfig';
import { toast } from 'react-toastify';
import { App } from '@capacitor/app';

// Mocks

// Mock de navigate 
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'), // Mantenemos MemoryRouter, Route, etc.
    useNavigate: () => mockNavigate, // Sobreescribimos solo el hook useNavigate
}));

// Mock de capacitor app
jest.mock('@capacitor/app', () => ({
    App: {
        addListener: jest.fn().mockReturnValue({
            remove: jest.fn()
        }),
    },
}));

// Mock de capacitor core
jest.mock('@capacitor/core', () => ({
    Capacitor: {
        getPlatform: jest.fn(() => 'web'),
    },
}));

// Mock de Axios
jest.mock('../../../api/axiosConfig', () => ({
    __esModule: true,
    default: {
        put: jest.fn(),
    },
}));

// Mock de React Toastify
jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

describe('Componente EdditVehicle (Añadir Historial / Actualizar)', () => {

    const productId = '123';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers(); // Activamos los timers falsos

        App.addListener.mockReturnValue({
            remove: jest.fn(),
        });
    });

    afterEach(() => {
        jest.useRealTimers(); // Restauramos timers
    });

    // Renderizamos componente
    const renderComponent = () => {
        render(
            <MemoryRouter initialEntries={[`/edit-vehicle/${productId}`]}>
                <Routes>
                    <Route path="/edit-vehicle/:productId" element={<EdditVehicle />} />
                </Routes>
            </MemoryRouter>
        );
    };

    //Tests 

    test('Debe renderizar el formulario correctamente', () => {
        renderComponent();
        expect(screen.getByText('Añadir Historial / Actualizar')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Guardar Historial/i })).toBeInTheDocument();
    });

    test('Debe permitir escribir en los campos', () => {
        renderComponent();
        const choferInput = screen.getByLabelText('Nuevo Chofer / Responsable');
        fireEvent.change(choferInput, { target: { value: 'Juan Perez' } });
        expect(choferInput.value).toBe('Juan Perez');
    });

    test('Debe enviar el formulario exitosamente (PUT) y redirigir con navigate', async () => {
        apiClient.put.mockResolvedValue({ data: { message: 'Actualizado' } });

        renderComponent();

        // Llenamos solo un par de campos obligatorios para el test
        fireEvent.change(screen.getByLabelText('Nuevo Chofer / Responsable'), { target: { value: 'Nuevo Chofer' } });
        fireEvent.change(screen.getByLabelText('Kilómetros'), { target: { value: '15000' } });

        // Click en guardar
        fireEvent.click(screen.getByRole('button', { name: /Guardar Historial/i }));

        // Verificamos API y Toast
        await waitFor(() => {
            expect(apiClient.put).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Historial actualizado con éxito.');
        });

        // Avanzamos el tiempo para disparar el setTimeout
        act(() => {
            jest.advanceTimersByTime(1600);
        });

        // Verificamos que se llamó a navigate en lugar de window.location
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(`/vehicle-detail/${productId}`);
        });
    });

    test('Debe manejar errores de la API', async () => {
        const errorMessage = 'Error de validación';
        apiClient.put.mockRejectedValue({
            response: { data: { message: errorMessage } },
        });

        renderComponent();

        fireEvent.click(screen.getByRole('button', { name: /Guardar Historial/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(errorMessage);
        });
    });
});