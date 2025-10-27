// src/pages/EdditVehicle/__tests__/EdditVehicle.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EdditVehicle from '../EdditVehicle';
import apiClient from '../../../api/axiosConfig';
import { toast } from 'react-toastify';

// 🧠 Mockeamos useNavigate y useParams
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ productId: 'vehicle-1' }),
    useNavigate: () => mockNavigate,
}));

// 🧠 Mockeamos axiosConfig y toastify
jest.mock('../../../api/axiosConfig', () => ({
    get: jest.fn(),
    put: jest.fn(),
    defaults: { baseURL: 'http://localhost' },
}));
jest.mock('react-toastify', () => ({
    toast: { success: jest.fn(), error: jest.fn() },
}));

// 🧠 Mockeamos assets si hacen falta
jest.mock('../../../assets/images/logo.png', () => 'mock-logo.png');

// 🧠 Setup
const userEvent = userEventLib.default || userEventLib;

describe('Componente EdditVehicle', () => {
    const vehicleApiData = {
        descripciones: [{ descripcion: 'Descripción inicial' }],
        kilometrajes: [{ kilometraje: '1000' }],
        destinos: [{ descripcion: 'Destino A' }],
        services: [{ descripcion: '2024-01-01' }],
        rodados: [{ descripcion: '2024-02-02' }],
        reparaciones: [{ descripcion: 'Parche' }],
        chofer: 'Chofer X',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('carga y muestra los datos del vehículo en el formulario', async () => {
        apiClient.get.mockResolvedValue({ data: { vehicle: vehicleApiData } });

        render(<EdditVehicle />);

        expect(await screen.findByDisplayValue(/Descripción inicial/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
        expect(screen.getByDisplayValue(/Destino A/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2024-02-02')).toBeInTheDocument();
        expect(screen.getByDisplayValue(/Parche/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue(/Chofer X/i)).toBeInTheDocument();

        expect(apiClient.get).toHaveBeenCalledWith('/api/vehicle/vehicle-1');
    });

    it('muestra error si falla la carga inicial', async () => {
        apiClient.get.mockRejectedValue({
            response: { data: { message: 'No existe' } },
        });

        render(<EdditVehicle />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('No existe');
        });
    });

    it(
        'permite editar campos y enviar el formulario, muestra toast y navega después',
        async () => {
            apiClient.get.mockResolvedValue({ data: { vehicle: vehicleApiData } });
            apiClient.put.mockResolvedValue({}); // Simula PUT exitoso

            render(<EdditVehicle />);

            const descInput = await screen.findByDisplayValue(/Descripción inicial/i);
            const choferInput = screen.getByDisplayValue(/Chofer X/i);
            const submitBtn = screen.getByRole('button', { name: /Registrar Cambios/i });

            const user = userEvent.setup();
            await user.clear(descInput);
            await user.type(descInput, 'Nueva descripción');
            await user.clear(choferInput);
            await user.type(choferInput, 'Chofer Nuevo');

            await user.click(submitBtn);

            await waitFor(() => {
                expect(apiClient.put).toHaveBeenCalledWith(
                    '/api/vehicle/vehicle-1',
                    expect.objectContaining({
                        description: 'Nueva descripción',
                        usuario: 'Chofer Nuevo',
                    })
                );
            });

            expect(toast.success).toHaveBeenCalledWith('Vehículo modificado con éxito.');

            // --- CORRECCIÓN AQUÍ ---
            // Esperamos a que la navegación ocurra, DÁNDOLE MÁS TIEMPO
            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/vehicle-detail/vehicle-1');
            }, { timeout: 2000 }); // Añadido timeout de 2000ms
            // --- FIN CORRECCIÓN ---

        }
    );

    it('muestra error si falla el PUT en el submit', async () => {
        apiClient.get.mockResolvedValue({ data: { vehicle: vehicleApiData } });
        apiClient.put.mockRejectedValue({
            response: { data: { message: 'Put falló' } },
        });

        render(<EdditVehicle />);

        const submitBtn = await screen.findByRole('button', {
            name: /Registrar Cambios/i,
        });

        const user = userEvent.setup();
        await user.click(submitBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Put falló');
        });
    });
});